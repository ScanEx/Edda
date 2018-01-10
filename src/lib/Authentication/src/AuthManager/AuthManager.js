import { sendCrossDomainJSONRequest } from '../lib/Request/src/Request.js';
import { EventTarget } from '../lib/EventTarget/src/EventTarget.js';

class AuthManager extends EventTarget {
    constructor({
        authorizationEndpoint, 
        userInfoEndpoint, 
        redirectEndpointHtml, 
        redirectEndpointAshx,         
        credentialLoginEndpoint,
        clientId}){
        super();
        // поддерживаем как минимум два события для
        // серверов ресурсов: login и logout
        this._authorizationEndpoint = authorizationEndpoint;
        this._userInfoEndpoint = userInfoEndpoint;
        this._redirectEndpointHtml = redirectEndpointHtml;
        this._redirectEndpointAshx = redirectEndpointAshx;
        this._redirectEndpointAshx2 = `${redirectEndpointAshx}/?return_url=${location.href}`;
        this._credentialLoginEndpoint = credentialLoginEndpoint;
        this._resourceServers = [];
        this._clientId = clientId || 1;
    }
    $getAntiCsrfToken() {
        const cookieName = "sync";
        const re = new RegExp(`.*${cookieName}=([^;]+).*`, 'i');
        return document.cookie.replace(re, '$1');        
    }
    /** Добавляет сервер ресурсов
     * Должна вызываться только из класса ResourceServer.
     * @param {ResourceServer} resourceServer
     */
    $addResourceServer(resourceServer){
        this._resourceServers.push(resourceServer);
    }    
    _chain (tasks, state) {        
        return tasks.reduce(
            (prev, next) => prev.then(next),
            new Promise ((resolve, reject) => resolve (state))
        );
    }
    _authorizeResourceServers(){
        let tasks = this._resourceServers.map(rs => {
            return state => {
                return new Promise(resolve => {
                    rs.sendGetRequest('oAuth2/LoginDialog.ashx')
                    .then(response => {
                        state = state.concat(response);
                        resolve(state);
                    })
                    .catch(e => state.push(e));
                });
            };
        });
        return this._chain(tasks, []);
    }
    _processAuthorization(search){
        function parseQueryString (search) {
            let a = search.slice(1).split('&');
            let o = {};
            for (let i = 0; i < a.length; i++) {
                let s = a[i].split('=');
                o[s[0]] = s[1];
            }
            return o;
        }
        return new Promise((resolve, reject) => {            
            // превращаем строку с параметрами в хеш
            let params = parseQueryString(search);

            if (params.error) {
                reject({
                    Status: 'auth',
                    Result: null,
                    Error: {
                        message: params.error
                    }
                });
            } else {
                sendCrossDomainJSONRequest(`${this._redirectEndpointAshx}${search}`,
                resp => {
                    if (resp.Status === 'ok') {
                        resolve({
                            Status: 'ok',
                            Result: resp.Result
                        });
                    } else {
                        reject({
                            Status: resp.Status,
                            Result: null
                        });
                    }
                }, 
                'CallbackName', 
                () => {
                    reject({
                        Status: 'network',
                        Result: null,
                        Error: {
                            message: arguments[2]
                        }
                    });
                });                
            }
        });
    }
    /** Получение информации о пользователе от AuthServer
     * @return {Function} promise(userInfo)
     */
    getUserInfo(){
        if (this._getUserInfoDeferred) {
            return this._getUserInfoDeferred;
        }        
        return this._getUserInfoDeferred = new Promise((resolve, reject) => {

            function authorizationGrant(search) {
                // удаляем айфрейм и глобальную переменную
                setTimeout(function() {
                    delete window.authorizationGrant;
                    document.body.removeChild (document.body.querySelector('.authorizationIframe'));                    
                }, 0);

                this._processAuthorization(search).then(resp => resolve(resp), (err) => reject(err));
            }

            // посылаем запросы на все сервера ресурсов
            // когда они все ответят ..
            this._authorizeResourceServers()
            .then(servers => {
                // .. формируем параметры state и scope
                let scope = '';
                let state = '';
                for (let i = 0; i < servers.length; i++) {
                    let response = servers[i];
                    scope += response.Service.ServerId + ',';
                    state += response.Result.State + ',';
                }
                scope = scope.slice(0, -1);
                state = state.slice(0, -1);

                // .. и посылаем запрос на сервер авторизации
                window.authorizationGrant = authorizationGrant.bind(this);
                document.body.insertAdjacentHTML('afterbegin', 
                `<iframe
                    class="authorizationIframe"
                    style="display: block !important; position: absolute; left: -99999px;"
                    src="${this._userInfoEndpoint}/?client_id=1&redirect_uri=${this._redirectEndpointHtml}&scope=${scope}&state=${state}">
                </iframe>`);

            })
            .catch(() => {
                reject({
                    Status: 'error'
                });
            });

        });               
    }
    /** Принудительное перелогинивание пользователя.
     * Пользователь должен увидеть поля для ввода
     * логина/пароля (возможно, на сервере авторизации).
     * При успешной авторизации библиотека должна
     * произвести авторизацию пользователя на всех
     * подключенных серверах ресурсов
     * и только после этого resolve promise
     * @return {Function} promise(userInfo)
     */
    login (arg) {
        let foreignServer;
        let iframeContainer;
        if (typeof arg === 'string') {
            // обратная совместимость
            foreignServer = arg;
        } else if (typeof arg === 'object') {
            foreignServer = arg.foreignServer;
            iframeContainer = arg.iframeContainer;
        }
        
        this._authorizeResourceServers()
        .then(servers => {
            // .. формируем параметры state и scope
            let scope = '';
            let state = '';
            for (let i = 0; i < servers.length; i++) {
                let response = servers[i];
                scope += response.Service.ServerId + ',';
                state += response.Result.State + ',';
            }
            scope = scope.slice(0, -1);
            state = state.slice(0, -1);

            let authUrl = `${this._authorizationEndpoint}/?client_id=1&redirect_uri=${this._redirectEndpointAshx2}&scope=${scope}&state=${state}`;

            if (foreignServer) {
                authUrl += `&authserver=${foreignServer}`;
            }

            if (!iframeContainer) {
                window.open(authUrl, '_self');
            } else {
                window.authorizationGrant = authorizationGrant;
                document.body.removeChild(document.body.querySelector('.authorizationIframe'));
                document.body.insertAdjacentHTML('afterbegin', 
                `<iframe
                    class="authorizationIframe"
                    src="${self._authorizationEndpoint}/?client_id=1
                        &redirect_uri=${self._redirectEndpointHtml}
                        &redirect_uri_alt=${self._redirectEndpointAshx2}
                        &scope=${scope}
                        &state=${state}">
                </iframe>`);

                function authorizationGrant() {
                    window.location.reload();                    
                    let event = document.createEvent('Event');
                    event.initEvent('login', false, false);
                    this.dispatchEvent(event);
                }
            }
        });
    }
    /** Залогиниться, используя логин и пароль
     * @param  {String} login
     * @param  {String} password
     * @return {Promise}
     */
    loginWithCredentials (login, password) {
        // отправляем ajax-запрос на Handler/Login с логином и паролем
        // После этого пользователь считается залогиненным на my.
        // Затем вызываем getUserInfo()

        return new Promise ((resolve, reject) => {            
            sendCrossDomainJSONRequest(
                `${this._credentialLoginEndpoint}?login=${encodeURIComponent(login)}&password=${encodeURIComponent(password)}`,
                response => {
                    if (response.Status.toLowerCase() === 'ok') {
                        this.getUserInfo()
                        .then(() => {
                            resolve({
                                Status: 'ok',
                                Result: arguments[0].Result
                            });
                        })
                        .catch(() => {
                            reject({
                                Status: 'error',
                                Result: {
                                    Message: 'authorization error'
                                }
                            });
                        });
                    } else if (response.Status.toLowerCase() === 'auth') {
                        reject({
                            Status: 'auth',
                            Result: {
                                Message: response.Result.Message
                            }
                        });
                    } else {
                        reject({
                            Status: 'error',
                            Result: {
                                Message: 'unknown error'
                            }
                        });
                    }
                },
                'CallbackName',
                () => {
                    reject({
                        Status: 'network',
                        Result: {
                            Message: 'network error'
                        }
                    });
                }
            );
        });        
    }
    /** Принудительное разлогинивание пользователя.
     * В том числе и на серверах ресурсов
     * @return {Function} promise(status)
     */
    logout () {
        return new Promise ((resolve, reject) => {
            let promises = [];
            for (let i = 0; i < this._resourceServers.length; i++) {
                let resourceServer = this._resourceServers[i];
                let promise = resourceServer.sendGetRequest('oAuth2/Logout.ashx');
                promises.push(promise);
            }
            this._chain(promises, {})
            .then(() => {
                if (this._clientId === 1) {
                    sendCrossDomainJSONRequest('http://my.kosmosnimki.ru/Handler/Logout',
                    (response) => resolve({ Status: 'ok'}), '', () => reject({ Status: 'network'}));
                } else {
                    resolve({
                        Status: 'ok'
                    });                    
                    let event = document.createEvent('Event');
                    event.initEvent('logout', false, false);
                    this.dispatchEvent(event);
                }
            })
            .catch(() => {
                reject({
                    Status: 'error'
                });
            });            
        });           
    }
}

export { AuthManager };

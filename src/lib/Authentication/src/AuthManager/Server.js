import { sendCrossDomainJSONRequest } from '../lib/Request/src/Request.js';

//TODO: использовать ли библиотеку?
function parseUri(str)
{
    var parser = /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*):?([^:@]*))?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/,
        key = ["source","protocol","authority","userInfo","user","password","host","port","relative","path","directory","file","query","anchor"],
        m = parser.exec(str),
        uri = {},
        i   = 14;

    while (i--) uri[key[i]] = m[i] || "";
    
    // HACK
    uri.hostOnly = uri.host;
    uri.host = uri.authority;
    
    return uri;
}

let requests = {};
let lastRequestId = 0;
let uniquePrefix = `id${Math.random()}`;

function processMessage (e) {
    if (e.origin in requests) {
        let dataStr = decodeURIComponent(e.data.replace(/\n/g,'\n\\'));
        try {
            let dataObj = JSON.parse(dataStr);
            var request = requests[e.origin][dataObj.CallbackName];
            if (request) {
                delete requests[e.origin][dataObj.CallbackName];
                request.iframe.parentNode.removeChild(request.iframe);
                request.callback && request.callback(dataObj);
            }
        }
        catch (e) { }
    }    
}

//совместимость с IE8
if (window.addEventListener) {
    window.addEventListener('message', processMessage);
} else {
    window.attachEvent('onmessage', processMessage);
}

function addQueryVariables (url, variables) {
    let oldQueryString = url.split('?')[1];
    let newQueryString = '';
    for (let variable in variables) {
        if (variables.hasOwnProperty(variable)) {
            newQueryString += ('&' + variable + '=' + encodeURIComponent(variables[variable]));
        }
    }
    if (oldQueryString) {
        return url + newQueryString;
    } else {
        return url + '?' + newQueryString.slice(1);
    }
}

function createPostIframe(id)
{
    var iframe = document.createElement("iframe");
    iframe.style.display = 'none';
    iframe.setAttribute('id', id);
    iframe.setAttribute('name', id);
    iframe.src = 'javascript:true';
    
    return iframe;
}

class Server {
    constructor({root}) {
        this._root = root;
    }

    /** Послать GET запрос к серверу ресурсов.
     * @param  {String} url
     * @param  {Object} params
     * @return {Function} promise(data)
     */
    sendGetRequest (url, params) {
        return new Promise((resolve, reject) => {
            let requestUrl = `${this._root}/${url}`;
            requestUrl = addQueryVariables(requestUrl, params);
            sendCrossDomainJSONRequest(requestUrl, data => resolve(data), 'CallbackName', errors => reject({ Status: 'error' }));           
        });        
    }
        
    /** Послать к серверу ресурсов запрос за картинкой.
     * @param  {String} url
     * @param  {Object} params
     * @return {Function} promise(image)
     */
    sendImageRequest (url, params) {            
        let requestUrl = `${this._root}/${url}`;
        requestUrl = addQueryVariables(requestUrl, params);
        
        var img = new Image();
        
        img.onload = () => resolve({ Status: 'ok', Result: img });
        img.onerror = errors => reject(errors);            
        img.src = requestUrl;
    }

    /** Послать POST запрос к серверу ресурсов.
     * @param  {String} url
     * @param  {Object} params
     * @param  {HTMLFormElement} baseForm HTML Form, которая может быть использована как основа для посылки запроса (например, если нужно загрузить файл)
     * @return {Function} promise(data)
     */
    sendPostRequest (url, params, baseForm) {
        let requestURL = `${this._root}/${url}`;            
        return new Promise((resolve, reject) => {
            let processResponse = (response) => {
                if (response.Status !== 'ok') {
                    reject(response);
                } else {
                    resolve(response);
                }
            };

            try {
                
                let id = `${uniquePrefix}${lastRequestId++}`;
                let iframe = createPostIframe(id);
                let parsedURL = parseUri(requestURL);
                let origin = (parsedURL.protocol ? `${parsedURL.protocol}:` : window.location.protocol) + `//${parsedURL.host || window.location.host}`;
                let originalFormAction;
                let form;
                
                requests[origin] = requests[origin] || {};
                requests[origin][id] = {callback: processResponse, iframe: iframe};
                    
                if (baseForm)
                {
                    form = baseForm;
                    originalFormAction = form.getAttribute('action');
                    form.setAttribute('action', requestURL);
                    form.target = id;                
                }
                else
                {
                    form = document.createElement('form');
                    form.style.display = 'none';
                    form.setAttribute('enctype', 'multipart/form-data');
                    form.target = id;
                    form.setAttribute('method', 'POST');
                    form.setAttribute('action', requestURL);
                    form.id = id;
                }
                
                let hiddenParamsDiv = document.createElement("div");
                hiddenParamsDiv.style.display = 'none';
                
                let appendFormParam = function(paramName, paramValue) { 
                    let input = document.createElement("input");            
                    paramValue = typeof paramValue !== 'undefined' ? paramValue : '';
                    
                    input.setAttribute('type', 'hidden');
                    input.setAttribute('name', paramName);
                    input.setAttribute('value', paramValue);
                    
                    hiddenParamsDiv.appendChild(input)
                }
                
                for (let paramName in params) {
                    appendFormParam(paramName, params[paramName]);
                }
                
                appendFormParam('WrapStyle', 'message');
                appendFormParam('CallbackName', id);
                
                form.appendChild(hiddenParamsDiv);
                
                if (!baseForm)
                    document.body.appendChild(form);
                    
                document.body.appendChild(iframe);
                
                form.submit();
                
                if (baseForm)
                {
                    form.removeChild(hiddenParamsDiv);
                    if (originalFormAction !== null)
                        form.setAttribute('action', originalFormAction);
                    else
                        form.removeAttribute('action');
                }
                else
                {
                    form.parentNode.removeChild(form);
                }
            }
            catch (e) {
                reject(e);
            }
            
        });                                    
    }
}

export { Server };
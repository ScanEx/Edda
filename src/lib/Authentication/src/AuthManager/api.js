import { ResourceServer } from './ResourceServer.js';
import { AuthManager } from './AuthManager.js';

let resourceServersInstances = {};
let resourceServersConstructors = {};
let authManager;

// строка, в которой перечислены псевдонимы используемых нами серверов ресурсов.
// потребуется для синхронизации серверов ресурсов
let scope;

// зашиваем известные и часто-используемые ресурсы
resourceServersConstructors['subscriptions'] = () => {
    return new ResourceServer(authManager, {
        id: 'subscriptions',
        root: 'http://fires.kosmosnimki.ru/SAPIv2'
    });
};

resourceServersConstructors['geomixer2'] = () => {
    return new ResourceServer(authManager, {
        id: 'geomixer2',
        root: 'http://maps2.kosmosnimki.ru'
    });
};

resourceServersConstructors['geomixer'] = () => {
    return new ResourceServer(authManager, {
        id: 'geomixer',
        root: 'http://maps.kosmosnimki.ru'
    });
};

resourceServersConstructors['geocode'] = () => {
    return new ResourceServer(authManager, {
        id: 'geocode',
        root: 'http://geocode.kosmosnimki.ru'
    });
};

function getResourceServer (id) {
    if (!authManager) {
        authManager = getAuthManager();
    }
    // используем lazy instantiation для отложенного создания
    // необходимых нам компонентов
    if (!resourceServersInstances[id]) {
        resourceServersInstances[id] = resourceServersConstructors[id]();
        if (!scope) {
            scope = id;
        } else {
            scope += (',' + id);
        }
    }
    return resourceServersInstances[id];
}

function getAuthManager () {
    // то же и с authManager
    if (!authManager) {
        authManager = new AuthManager({
            authorizationEndpoint: 'http://my.kosmosnimki.ru/Test/LoginDialog',
            userInfoEndpoint: 'http://my.kosmosnimki.ru/oAuth/LoginDialog',
            redirectEndpointHtml: location.href.replace(/[^\/]+$/, '') + 'oAuth2/oAuthCallback.htm',
            redirectEndpointAshx: location.href.replace(/[^\/]+$/, '') + 'oAuth2/oAuthCallback.ashx',
            credentialLoginEndpoint: 'http://my.kosmosnimki.ru/Handler/Login'
        });
    }
    return authManager;
}

export { getAuthManager, getResourceServer };
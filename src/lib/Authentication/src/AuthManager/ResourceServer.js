import { Server } from './Server.js';

class ResourceServer extends Server {
    constructor(authManager, {id, root}){
        super({root: root});
        this._id = id;        
        this._authManager = authManager;
        this._authManager.$addResourceServer(this);
        // this.sendGetRequest = this.extendRequestMethod('sendGetRequest');
        // this.sendImageRequest = this.extendRequestMethod('sendImageRequest');
        // this.sendPostRequest = this.extendRequestMethod('sendPostRequest');
    }
    // extendRequestMethod (requestFuncName) {
    //     return function(url, params, baseForm) {
    //         let params = params || {};
    //         params.sync = this._authManager.$getAntiCsrfToken();
    //         return new Promise((resolve, reject) => {
    //             super[requestFuncName].call(this, url, params, baseForm)
    //             .then(data => {
    //                 data.Service = { ServerId: self._id };                    
    //                 if (data.Status === 'ok') {
    //                     resolve(data);
    //                 } else {
    //                     reject(data);
    //                 }
    //             })
    //             .catch(errors => {
    //                 reject({
    //                     Status: 'error',
    //                     ErrorInfo: errors.ErrorInfo
    //                 });
    //             });
    //         });                    
    //     }
    // }
    sendGetRequest (url, params, baseForm) {
        params = params || {};
        params.sync = this._authManager.$getAntiCsrfToken();
        return new Promise ((resolve, reject) => {
            super.sendGetRequest(url, params, baseForm)
            .then(data => {
                data.Service = { ServerId: this._id };            
                if (data.Status === 'ok') {
                    resolve(data);
                } else {
                    reject(data);
                }
            })
            .catch(errors => reject({ Status: 'error', ErrorInfo: errors.ErrorInfo }));
        });  
    }
    sendImageRequest (url, params, baseForm) {
        params = params || {};
        params.sync = this._authManager.$getAntiCsrfToken();
        return new Promise ((resolve, reject) => {
            super.sendImageRequest(url, params, baseForm)
            .then(data => {
                data.Service = { ServerId: this._id };            
                if (data.Status === 'ok') {
                    resolve(data);
                } else {
                    reject(data);
                }
            })
            .catch(errors => reject({ Status: 'error', ErrorInfo: errors.ErrorInfo }));
        });  
    }
    sendPostRequest (url, params, baseForm) {
        params = params || {};
        params.sync = this._authManager.$getAntiCsrfToken();
        return new Promise ((resolve, reject) => {
            super.sendPostRequest(url, params, baseForm)
            .then(data => {
                data.Service = { ServerId: this._id };            
                if (data.Status === 'ok') {
                    resolve(data);
                } else {
                    reject(data);
                }
            })
            .catch(errors => reject({ Status: 'error', ErrorInfo: errors.ErrorInfo }));
        });  
    }
}

export { ResourceServer };
import { copy } from 'lib/Object.Extensions/src/Extensions.js';
import { chain, from_gmx } from 'app/Utils/Utils.js';
import { Formats } from './Formats.js';

class ShapeLoader {
    constructor ({
        gmxResourceServer,
        catalogResourceServer,
        resultsController,
        drawnObjects,
        shapeLoaderUrl = 'http://maps.kosmosnimki.ru/ShapeLoader',        
        metadataUrl = 'GetMetadata.ashx',
        fileMakerUrl = 'VectorFileMaker',
        fileDownloaderUrl = 'DownloadFile',
        csvFileUrl = 'CreateCsv.ashx' }) {
        this._gmxResourceServer = gmxResourceServer;
        this._catalogResourceServer = catalogResourceServer;
        this._resultsController = resultsController;
        this._drawnObjects = drawnObjects;
        this._shapeLoaderUrl = shapeLoaderUrl;
        this._idLoaderUrl = `${location.href.substr(0, location.href.lastIndexOf('/'))}/SearchByID.ashx`;
        this._fileMakerUrl = fileMakerUrl;
        this._fileDownloaderUrl = fileDownloaderUrl;
        this._metadataUrl = metadataUrl;
        this._csvFileUrl = csvFileUrl;
        this._csvColumns = ['sceneid', 'stereo', 'platform', 'cloudness', 'tilt', 'acqdate'];
    }    
    upload () {
        return new Promise ((resolve, reject) => {            
            let ff = document.createElement('input');
            ff.setAttribute('type', 'file');
            document.body.appendChild(ff);
            ff.click();
            ff.addEventListener('change', e => {
                window.Catalog.loaderWidget.show();
                let [file] = ff.files;                
                if (file) {
                    let fd = new FormData();
                    fd.append('filename', file);
                    fd.append('WrapStyle', 'None');                    
                    fetch (this._shapeLoaderUrl, {
                        method: 'POST',
                        body: fd
                    })
                    .then (response => {
                        ff.remove();    
                        return response.json();
                    })
                    .then(response => {
                        window.Catalog.loaderWidget.hide();
                        switch(response.Status) {
                            case 'ok':
                                resolve({type: 'shapefile', results: response.Result});
                                break;
                            default:
                                fetch (this._idLoaderUrl, {method: 'POST', body: fd})
                                .then (res => {
                                    ff.remove();
                                    return res.json();
                                })
                                .then (res => {
                                    if (res.Status === 'ok') {                                        
                                        resolve({type: 'idlist', results: res.Result});
                                    }
                                    else {
                                        reject(res);
                                    }
                                })
                                .catch (e => {
                                    ff.remove();
                                    reject(e);
                                });                                
                                break;
                        }
                    })
                    .catch(e => {
                        window.Catalog.loaderWidget.hide();
                        ff.remove();
                        reject(e);
                    });            
                }                         
            });
        });               
    }
    download (archiveName, type) {
        window.Catalog.loaderWidget.show();
        let get_meta_data = state => {
            return new Promise (resolve => {                
                let ids = [];
                let items = [];
                let csv = item => this._csvColumns.map(col => col === 'acqdate' ? moment(item[col]).format('YYYY-MM-DD') : item[col]);
                switch (type) {                      
                    case 'results':
                        if(this._resultsController.downloadCache && this._resultsController.downloadCache.length > 0) {
                            ids = this._resultsController.downloadCache.map(item => item.sceneid);
                        }
                        else {
                            ids = this._resultsController.resultList.items.map(item => item.sceneid);
                        }
                        break;
                    case 'csv':
                        if(this._resultsController.downloadCache && this._resultsController.downloadCache.length > 0) {
                            items = this._resultsController.downloadCache.map(csv);
                        }
                        else {
                            items = this._resultsController.resultList.items.map(csv);
                        }
                        break;
                    case 'cart':
                    case 'quicklooks':
                        if(this._resultsController.downloadCache && this._resultsController.downloadCache.length > 0) {
                            ids = this._resultsController.downloadCache.map(item => item.sceneid);
                        }
                        else {
                            ids = this._resultsController.favoritesList.items.map(item => item.sceneid);
                        }                        
                        break;
                    default:
                        break;
                }
                if (type === 'csv') {
                    state.items = JSON.stringify (items);
                    resolve(state);
                }
                else {
                    if (ids.length > 0) {
                        this._catalogResourceServer.sendPostRequest(this._metadataUrl, {ids, WrapStyle: 'None'})
                        .then(response => {
                            if (response.Status === 'ok') {
                                state.result = response.Result;
                                resolve(state);
                            }
                            else {
                                state.error = response;
                                resolve(state);
                            }                
                        })
                        .catch (e => {
                            state.error = e;
                            resolve(state);
                        });
                    }
                    else {
                        resolve(state);
                    }
                }                             
            });
        };        
        let make_file = state => {
            return new Promise (resolve => {  
                if (type === 'csv') {
                    resolve(state);
                }
                else {
                    let Features = this._drawnObjects.items
                    .filter(item => item.visible)
                    .map(({id, name, area, visible, editable, color, geoJSON}) => {                        
                        return {
                            type: 'Feature',
                            geometry: geoJSON.geometry,
                            properties: {
                                id, 
                                // name: encodeURIComponent(name),
                                name,
                                area,
                                visible,
                                editable,
                                color
                            }
                        };
                    });
                    let Files = Features.length ? [{
                            Columns: [
                                {"Name":"id","Type":"String"},
                                {"Name":"name","Type":"String"},
                                {"Name":"area","Type":"Float"},                            
                                {"Name":"editable","Type":"Boolean"},
                                {"Name":"visible","Type":"Boolean"},
                                {"Name":"color","Type":"String"}
                            ],
                            Features,
                            Filename: `${archiveName}_contours`,
                            Formats: ['shape','tab'],
                        }] : [];
                    switch (type) {                                     
                        case 'results':
                        case 'cart':
                        case 'quicklooks':
                            let result = state.result;
                            Files = Files.concat (Object.keys (result).map(file => {
                                let Features = result[file].map(f => {                        
                                    let properties = copy(f);
                                    delete properties.geometry;
                                    return {
                                        type: 'Feature',
                                        geometry: copy(f.geometry),
                                        properties
                                    };
                                });
                                return {
                                    Columns: Formats[file],
                                    Filename: `${archiveName}_${file}`,
                                    Features,
                                    Formats: ['shape', 'tab']
                                };
                            }));
                            break;
                        default:
                            break;                  
                    }             
                
                    this._gmxResourceServer.sendPostRequest(
                        this._fileMakerUrl,
                        {Request: JSON.stringify({ArchiveName: archiveName, Files, Images: type === 'quicklooks'})}
                    ).then(response => {
                        if (response.Status === 'ok'){
                            state.id = response.Result;
                            resolve(state);
                        }
                        else {
                            resolve(state);
                        }
                    })
                    .catch (e => {
                        state.error = e;
                        resolve(state);
                    });

                }                
            });
        };
        let download_file = state => {            
            window.Catalog.loaderWidget.hide();
            return new Promise(resolve => {
                if (type === 'csv') {
                    const {items} = state;
                    this._catalogResourceServer.sendPostRequest(this._csvFileUrl, {file: encodeURIComponent (archiveName), items, columns: this._csvColumns, WrapStyle: 'None'})
                    .then(response => {
                        if (response.Status === 'ok') {
                            state.result = response.Result;
                            resolve(state);
                        }
                        else {
                            state.error = response;
                            resolve(state);
                        }                
                    })
                    .catch (e => {
                        state.error = e;
                        resolve(state);
                    });
                }
                else {
                    this._gmxResourceServer.sendPostRequest(`${this._fileDownloaderUrl}?id=${state.id}`)
                    .then(response => {
                        if (response.Status === 'ok'){
                            state.id = response.Result;
                            resolve(state);
                        }
                        else {
                            resolve(state);
                        }
                    })
                    .catch (e => {
                        state.error = e;
                        resolve(state);
                    });
                }                
            });
        };
        return chain([
            get_meta_data,            
            make_file,
            download_file,
        ], {}).then(state => {            
            if (state.error) {
                console.log(state.error);
            }
            
        });        
    }    
}

export { ShapeLoader };
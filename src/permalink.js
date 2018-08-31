import { getResourceServer } from 'scanex-auth';
import { chain } from 'scanex-async';
import { hex, from_gmx } from './app/Utils/Utils.js';

window.LAYER_ID = '9B4733A8CBE942CE9F5E70DCAA6C1FBE'; // 'AFB4D363768E4C5FAC71C9B0C6F7B2F4'

let ss = ['WV03','WV02',
'GE01','PHR','QB02',
'KOMPSAT3A','KOMPSAT3',
'IK','GF2',
'KOMPSAT2',
'SP6_7','BKA','GF1_2m','ZY3','RE',
'LANDSAT_8',
'GF1_16m',
'WV01',
'EROSB','EROSA',
'GE01_L','IK_L','QB02_L','WV01_L','WV02_L',
'SP5_2MS','SP5_5MS','SP5_10MS',
'SP5_2PC','SP5_5PC'];

let gmxResourceServer = getResourceServer('geomixer');

function read_permalink (state) {
    return new Promise((resolve, reject) => {
        gmxResourceServer.sendGetRequest('TinyReference/Get.ashx', { id: state.id })
        .then(response => {
            if (response.Status == 'ok') {
                try {
                    resolve(JSON.parse(response.Result));
                }
                catch (e) {
                    reject(e);
                }				        
            }
            else {
                reject(response.Result);
            }
        })
        .catch(e => reject(e));
    });
}

function get_query (ids) {
    return ids.map(id => `(sceneid = '${id}')`).join (' OR ');
}

function search (ids) {
    return new Promise((resolve, reject) => {        
        if (ids.length > 0) {
            gmxResourceServer.sendPostRequest('VectorLayer/Search.ashx', {
                layer: LAYER_ID,
                geometry: true,
                pagesize: 0,
                query: get_query(ids),
                WrapStyle: 'message',
            })
            .then(response => {
                if (response.Status == 'ok') {
                    try {                        
                        resolve(from_gmx(response.Result));
                    }
                    catch (e) {
                        reject(e);
                    }				        
                }
                else {
                    reject(response.Result);
                }
            })
            .catch(e => reject(e));
        }
        else {            
            resolve([]);
        }
    });
}

function get_items (state) {
    return new Promise (resolve => {
        search (state.selected.concat(state.quicklook))
        .then (items => {
            state.items = items;
            state.items.forEach (item => {
                item.quicklook = false;
                if (Array.isArray(state.quicklook)) {
                    for (let i = 0; i < state.quicklook.length; ++i) {
                        if (state.visible[i] === item.sceneid) {
                            item.quicklook = true;
                            break;
                        }           
                    }
                }

                item.checked = false;
                if (Array.isArray(state.cart)) {
                    for (let i = 0; i < state.cart.length; ++i) {
                        if (state.cart[i] === item.sceneid) {
                            item.checked = true;
                            break;
                        }           
                    }
                }
                                                 
            });
            resolve(state);
        })
        .catch (e => {
            console.log(e);
            resolve(state);
        });
    });
}

function get_cart (state) {
    return new Promise (resolve => {
        search (state.cart)
        .then (items => {
            state.cart = items;
            resolve(state);
        })
        .catch (e => {
            console.log(e);
            resolve(state);
        });
    });
}

let matches = /\?([^&]+)/g.exec(window.location.search);
if (matches.length > 1) {
    let id = matches[1];
    chain([
        read_permalink,
        get_items,
        get_cart,
    ], {id})
    .then(state => {
        let {
            lang, 
            position,
            bounds,
            cadastre,
            activeLayer,
            drawingObjects,
            searchCriteria: { 
                dateStart, dateEnd, 
                isYearly, 
                minCloudCover, maxCloudCover, 
                minAngle, maxAngle,
                archive,
                stereo,
                satellites,
            },
            cart,
            items,
        } = state;
        let rxDate = new RegExp ('(\\d{2})\\.(\\d{2})\\.(\\d{4})');
        let d1 = rxDate.exec(dateStart);
        let d2 = rxDate.exec(dateEnd);
        let date = [`${d1[3]}-${d1[2]}-${d1[1]}`,`${d2[3]}-${d2[2]}-${d2[1]}`];
        let st = satellites.reduce((a,i) => {
            let s = ss[i];
            let k = s.lastIndexOf('_L');
            if (k > -1){                                        
                let x = s.substr(0, k);
                if (x === 'WV01') {
                    a.pc.push (x);
                }
                else {
                    a.ms.push (x);
                }
            }
            else if (s in ['WV01', 'EROSA', 'EROSB']) {
                a.pc.push (s);
            }
            else {
                a.ms.push (s);
            }
            return a;
        }, {ms: [], pc: []});
        let objects = drawingObjects.map (item => {
            let {name, color, checked} = item.properties;
            return {
                name: name,
                geoJSON: item,
                color: typeof color === 'string' && color !== '' ? `#${hex(color, 6)}` : '#0033FF',
                visible: checked,
            };
        });        
        let viewState = {
            lang,
            activeLayer,
            drawingObjects: objects,
            position,                
            bounds,                
            searchCriteria: {
                date,
                annually: isYearly,
                angle: [minAngle, maxAngle],
                clouds: [minCloudCover, maxCloudCover],
                stereo,
                archive,
                satellites: st,
            },
            items,
            cart,
            cadastre,
        };
        localStorage.setItem('view_state', JSON.stringify(viewState));
        window.location = `${window.location.origin}${window.location.pathname.substr(0, window.location.pathname.lastIndexOf('/'))}`;
    });
}
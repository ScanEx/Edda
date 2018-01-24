import { EventTarget } from 'lib/EventTarget/src/EventTarget.js';
import { Quicklook } from 'app/Quicklook/Quicklook.js';
import { ENUM_ID } from 'lib/DataGrid/src/DataGrid.js';
import { Translations } from 'lib/Translations/src/Translations.js';
import { is_geojson_feature, from_gmx, normalize_geometry, normalize_geometry_type, chain } from 'app/Utils/Utils.js';
import { copy } from 'lib/Object.Extensions/src/Extensions.js';
import './ResultsController.css';
import { flatten, get_bbox } from '../Utils/Utils';

window.Catalog.translations = window.Catalog.translations || new Translations();
let T = window.Catalog.translations

const Colors = {
    Default: 0x23a5cc,
    Hilite: 0x23a5cc,
    Cart: 0xef4e70,
    CartHilite: 0xef4e70,
};

const layerAttributes = ["hover", "selected", "visible", "result", "cart", "sceneid", "acqdate", "acqtime", "cloudness", "tilt", "sunelev", "stereo", "url", "x1", "y1", "x2", "y2", "x3", "y3", "x4", "y4", "volume", "platform", "spot5_a_exists", "spot5_b_exists", "islocal", "product", "gmx_id", "sensor", "local_exists", "spot5id", "stidx"]
const layerAttrTypes = ["boolean", "boolean", "boolean", "boolean", "boolean", "string", "date", "time", "float", "float", "float", "string", "string", "float", "float", "float", "float", "float", "float", "float", "float", "string", "string", "boolean", "boolean", "boolean", "boolean", "integer", "string", "boolean", "string", "integer"];

function properties_to_item (properties) {
    return properties.slice(1, properties.length - 1).reduce((a,v,i) => {
        let f = layerAttributes[i];
        switch (layerAttrTypes[i]){
            case 'date':
                switch (typeof v) {
                    case 'string':
                        a[f] = new Date(v);
                        break;
                    case 'number':
                        a[f] = new Date(v * 1000);
                        break;
                    default:
                        break;
                }             
                break;                
            default:
                a[f] = v;
                break;
        }           
        return a;
    },{});
}

L.gmx.VectorLayer.prototype.toItemList = function () {
    let items = this.getDataManager()._items;    
    return Object.keys (items).map(id => items[id].properties).map(properties_to_item);
}

L.gmx.VectorLayer.prototype.getFilteredItems = function(filter) {
    return this.toItemList().filter(item => (typeof filter !== 'function') || filter(item));
};

L.gmx.VectorLayer.prototype.mergeData = function(data) {
    let dm = this.getDataManager();
    let cache = Object.keys(dm._items).reduce((a,gmx_id) => {
        a[gmx_id] = copy(dm._items[gmx_id].properties);
        return a;
    }, {});
    let items = data.reduce((a,value) => {
        const gmx_id = value[0];
        if (cache[gmx_id]){
            cache[gmx_id][result_index] = true;
        }
        else {
            a[gmx_id] = value;
        }        
        return a;
    }, cache);
    let res = Object.keys(items).map(gmx_id => items[gmx_id]);
    this.removeData();
    this.addData(res);
};

function getBounds (items) {
    return items.reduce((a,item) => {
        let {x2,y2,x4,y4} = item;        
        let ne = L.latLng(y2, x2);
        let sw = L.latLng(y4, x4);
        let b = L.latLngBounds(sw, ne);
        if (a === null) {            
            a = b;
        }
        else {
            a.extend(b);
        }
        return a;
    }, null);
}

// L.gmx.DataManager.prototype.removeData = function (data) {
//     this._itemsBounds = null;
//     var vTile = this.processingTile;
//     if (vTile) {                
//         var chkKeys = (data || vTile.data).reduce(function(a,item) {
//             var id = item[0];
//             a[id] = true;
//             delete this._items[id];
//             return a;
//         }.bind(this), {});
        
//         this._removeDataFromObservers(chkKeys);
//         vTile.removeData(chkKeys, true);
//         this._updateItemsFromTile(vTile);

//         this._triggerObservers();
//     }

//     return vTile;
// };

const sceneid_index = layerAttributes.indexOf('sceneid') + 1;
const result_index = layerAttributes.indexOf('result') + 1;
const cart_index = layerAttributes.indexOf('cart') + 1;
const selected_index = layerAttributes.indexOf('selected') + 1;
const visible_index = layerAttributes.indexOf('visible') + 1;
const hover_index = layerAttributes.indexOf('hover') + 1;

let qlCache = {};

function prefetch_ql  (sceneid) {
    return new Promise((resolve, reject) => {
        
        let img = new Image();
        img.crossOrigin = "Anonymous";
        img.onload = () => {   
            qlCache[sceneid] = true;
            resolve();
        };
        img.onerror = () => {              
            delete qlCache[sceneid];
            reject();
        };                
        img.src = `http://wikimixer.kosmosnimki.ru/QuickLookImage.ashx?id=${sceneid}&srs=3857`;
    });                            
}

class ResultsController extends EventTarget {
    constructor({map, requestAdapter, sidebar, resultList, favoritesList, imageDetails, drawnObjects}){
        super();
        this._map = map;
        this._cart = {};
        this._requestAdapter = requestAdapter;  
        this._sidebar = sidebar;      
        this._resultList = resultList;
        this._favoritesList = favoritesList;
        this._imageDetails = imageDetails;        
        this._resultList.items = [];
        this._favoritesList.items = [];
        this._drawings = {};     
        this._currentTab = ''; 
        this.update_ql = this.update_ql.bind(this);
        this._layer = L.gmx.createLayer({
            properties: {
                type: 'Vector',                
                visible: true,
                identityField: 'gmx_id',
                GeometryType: 'polygon',
                // IsRasterCatalog: true,
                RCMinZoomForRasters: 3,
                Quicklook: '{"template":"http://wikimixer.kosmosnimki.ru/QuickLookImage.ashx?id=[sceneid]","minZoom":3,"X1":"x1","Y1":"y1","X2":"x2","Y2":"y2","X3":"x3","Y3":"y3","X4":"x4","Y4":"y4"}',
                MetaProperties: {
                    quicklookPlatform: {
                        Type: "String",
                        Value: "image"
                    }
                },
                srs: 3857,
                attributes: layerAttributes,
                attrTypes: layerAttrTypes,
                styles: [
                    {
                        MinZoom: 3,
                        MaxZoom: 17,                        
                        DisableBalloonOnClick: true,
                        DisableBalloonOnMouseMove: true,                        
                        RenderStyle:{
                            outline: {color: Colors.Default, thickness: 1},
                            fill: {color: 0xfff, opacity: 0}
                        },                       
                    }
                ]
            },
            geometry: null
        }).addTo(this._map);
        this._layer.disableFlip();
        this._layer.setFilter (item => {
            let obj = properties_to_item(item.properties);
            let filtered = false;
            if(typeof this._filter === 'function') {
                filtered = this._filter(obj);
            }
            else {
                filtered = true;
            }            
            switch (this._currentTab) {
                case 'results':                    
                    return item.properties[result_index] && filtered;
                case 'favorites':                 
                    return item.properties[cart_index] && filtered;
                case 'search':
                    return false;
                default:
                    return true;
            }
        });
        this._layer.setStyleHook (item => {
            let color = Colors.Default;
            let lineWidth = 1;            
            if (item.properties[hover_index]) {
                color = item.properties[cart_index] ? Colors.CartHilite : Colors.Hilite;
                lineWidth = 3;                
            }
            else {
                color = item.properties[cart_index] ? Colors.Cart : Colors.Default;                
            }
            let sceneid = item.properties[sceneid_index];
            let skipRasters = item.properties[visible_index] === 'hidden';
            if (!qlCache[sceneid] && !skipRasters) {
                skipRasters = true;
            }
            return { skipRasters, strokeStyle: color, lineWidth };
        }); 

        this._layer
        .on('click', e => {
            let { gmx: {id, layer, target} } = e;            
            let show = null;            
            switch (target.properties[visible_index]) {
                case 'visible':
                case 'loading':
                    show = false;
                    break;                
                case 'hidden':
                default:
                    show = true;
                    break;
            }
            this.show_ql (id, show)
            .then(() => {
                let item = null;                
                switch (this._currentTab) {
                    case 'results':                        
                        if (show) {
                            this.resultList.scrollToRow(id);
                        }
                        break;
                    case 'favorites':                                            
                        if (show) {
                            this.favoritesList.scrollToRow(id);
                        }
                        break;
                    default:
                        break;
                }
            });            
        })
        .on('mouseover', e => {
            let { gmx: {id, layer, target} } = e;
            target.properties[hover_index] = true;            
            this._layer.redrawItem(id); 
            this.update_row(id, true);
        })
        .on('mouseout', e => {
            let { gmx: {id, layer, target} } = e;
            target.properties[hover_index] = false;
            this._layer.redrawItem(id);
            this.update_row(id, false);
        });        
        this._resultList.addEventListener('cart', e => {            
            const { gmx_id } = e.detail;
            let item = this._layer.getDataManager()._items[gmx_id];            
            item.properties[cart_index] = !item.properties[cart_index];
            this._layer.redrawItem(gmx_id);
            
            this._resultList.redrawItem (gmx_id, properties_to_item(item.properties));

            let event = document.createEvent('Event');
            event.initEvent('cart', false, false);
            event.detail = item;
            this.dispatchEvent(event);
        });          
        this._resultList.addEventListener('visible', e => {            
            let {gmx_id, visible} = e.detail;
            let show = false;
            switch (visible) {
                case 'visible':
                case 'loading':
                    show = false;
                    break;                
                case 'hidden':
                default:
                    show = true;
                    break;
            }
            this.show_ql(gmx_id, show)
            .then(() => {                                
                let event = document.createEvent('Event');
                event.initEvent('visible', false, false);
                this.dispatchEvent(event);
            });            
        });       
        this._resultList.addEventListener('info', e => {
            let {item, top, button} = e.detail;
            let {left, width} = this._resultList.bbox;
            this._imageDetails.button = button;
            if (this._imageDetails.visible && this._imageDetails.item.sceneid == item.sceneid) {
                this._imageDetails.hide();
            }
            else {
                this._imageDetails.hide();
                this._imageDetails.item = item;                
                this._imageDetails.show({left: left + width + 20, top});
            }
        });
        this._resultList.addEventListener('mouseover', e => {
            let {item: {gmx_id}} = e.detail;
            let item = this._layer.getDataManager()._items[gmx_id];            
            item.properties[hover_index] = true;
            this._layer.redrawItem(gmx_id);
            this._layer.bringToTopItem(gmx_id);            
        });

        this._resultList.addEventListener('mouseout', e => {
            let {item: {gmx_id}} = e.detail;
            let item = this._layer.getDataManager()._items[gmx_id];            
            item.properties[hover_index] = false;
            this._layer.redrawItem(gmx_id);
            this._layer.bringToBottomItem(gmx_id);
        });

        this._resultList.addEventListener('click', e => {
            let {item: {gmx_id, x2, y2, x4, y4}} = e.detail;            
            this.show_ql(gmx_id, true)
            .then (() => {
                let ne = L.latLng(y2, x2);
                let sw = L.latLng(y4, x4);
                this._map.fitBounds(L.latLngBounds(sw, ne), { animate: false });
                this._map.invalidateSize();
            });            
        });        

        this._resultList.addEventListener('cart:all', e => {
            let {state} = e.detail;
            let items = this._layer.getDataManager()._items;
            Object.keys(items).forEach(id => {
                let item = items[id];
                if (item.properties[result_index]) {
                    item.properties[cart_index] = true;
                }                
            });
            this._layer.repaint();
            this._resultList.items = this._layer.getFilteredItems(item => item.result);
            let event = document.createEvent('Event');
            event.initEvent('cart', false, false);
            this.dispatchEvent(event);
        });

        this._resultList.addEventListener('cart:limit', e => {
            let event = document.createEvent('Event');
            event.initEvent('cart:limit', false, false);
            this.dispatchEvent(event);
        });

        this._favoritesList.addEventListener ('selected', e => {
            let {gmx_id, selected} = e.detail;
            let item = this._layer.getDataManager()._items[gmx_id];
            item.properties[selected_index] = selected;
            this._layer.redrawItem(gmx_id);            

            let event = document.createEvent('Event');
            event.initEvent('selected', false, false);
            event.detail = e.detail;
            this.dispatchEvent(event);
        });


        this._favoritesList.addEventListener('visible', e => {
            let {gmx_id, visible} = e.detail;
            let show = false;
            switch (visible) {
                case 'visible':
                case 'loading':
                    show = false;
                    break;                
                case 'hidden':
                default:
                    show = true;
                    break;
            }
            this.show_ql(gmx_id, show)
            .then (() => {
                // this._resultList.items = this._layer.getFilteredItems(item => item.result);
                let event = document.createEvent('Event');
                event.initEvent('visible', false, false);
                this.dispatchEvent(event);
            });
        });

        this._favoritesList.addEventListener('visible:all', e => {
            let show = e.detail;
            let items = this._layer.getDataManager()._items;
            Object.keys(items)
            .filter(id => items[id].properties[cart_index])
            .forEach(id => {
                this.show_ql(id, show);
            });

            let event = document.createEvent('Event');
            event.initEvent('visible', false, false);
            this.dispatchEvent(event);
        });

        this._favoritesList.addEventListener('mouseover', e => {
            let {item: {gmx_id}} = e.detail;
            let item = this._layer.getDataManager()._items[gmx_id];            
            item.properties[hover_index] = true;
            this._layer.redrawItem(gmx_id);
            this._layer.bringToTopItem(gmx_id);
        });

        this._favoritesList.addEventListener('mouseout', e => {
            let {item: {gmx_id}} = e.detail;
            let item = this._layer.getDataManager()._items[gmx_id];            
            item.properties[hover_index] = false;
            this._layer.redrawItem(gmx_id);
            this._layer.bringToBottomItem(gmx_id);
        });

        this._favoritesList.addEventListener('info', e => {
            let {item, top, button} = e.detail;
            let {left, width} = this._favoritesList.bbox;
            this._imageDetails.button = button;
            if (this._imageDetails.visible && this._imageDetails.item.sceneid == item.sceneid) {
                this._imageDetails.hide();
            }
            else {
                this._imageDetails.hide();
                this._imageDetails.item = item;                
                this._imageDetails.show({left: left + width + 20, top});
            }
        });

        this._favoritesList.addEventListener('click', e => {
            let {item: {gmx_id, x2, y2, x4, y4}} = e.detail;            
            this.show_ql(gmx_id, true)
            .then(() => {
                let ne = L.latLng(y2, x2);
                let sw = L.latLng(y4, x4);
                this._map.fitBounds(L.latLngBounds(sw, ne), { animate: false });
                this._map.invalidateSize();
            });
        });

        this._drawnObjects = drawnObjects;
        this.createDrawing = this.createDrawing.bind(this);

        this._map.gmxDrawing
        .on('drawstop', this.createDrawing)
        .on('editstop', function ({object}) {
            if(this._drawings[object.options.uuid]){
                this.updateDrawing(object);
            }
        }.bind(this))
        .on('dragend', function({object}) {
            if(this._drawings[object.options.uuid]){
                this.updateDrawing(object);
            }
        }.bind(this));

        this._drawnObjects.addEventListener('edit', e => {
            let { id, name, color } = e.detail;
            let { drawing } = this._drawings[id];            
            this._drawings[id].name = name;
            this._drawings[id].color = color;
            let options = {
                lineStyle: {
                    fill: false,
                    weight: 2,
                    opacity: 1,
                    color,
                }, 
                pointStyle: {color}
            };
            if (drawing) {
                if (drawing.options.editable) {
                    drawing.setOptions(options);
                }
                else {                
                    drawing.enableEdit();
                    options.className = 'osm-layer';
                    drawing.setOptions(options);
                    drawing.disableEdit();
                }
            }            
        });        
        
        this._drawnObjects.addEventListener('delete', e => {
            let { id } = e.detail;
            let { drawing } = this._drawings[id];
            delete this._drawings[id];
            if (drawing) {
                drawing.remove();
            }            
            this.updateDrawnObjects();
        });
        

        this._drawnObjects.addEventListener('check', e => {
            let { id, visible } = e.detail;           
            this.showDrawing (id, visible);
            this.updateDrawnObjects();
        });

        this._drawnObjects.addEventListener('show:all', e => {
            let visible = e.detail;
            Object.keys(this._drawings).forEach(id => {
                this.showDrawing (id, visible);
            });
        });
        
        this._drawnObjects.addEventListener('fit', e => {
            const {id, visible} = e.detail;
            let item = this._drawings[id];
            if (visible && item) {
                let {type, coordinates} = item.geoJSON.geometry;                
                if (type === 'Point') {
                    let center = L.latLng(coordinates[1],coordinates[0]);                    
                    this._map.setView(center);
                    this._map.invalidateSize();
                }
                else {                    
                    const bounds = item.drawing.getBounds();
                    this._map.fitBounds(bounds, { animate: false });
                    this._map.invalidateSize();
                }                
            }
        });

        this._drawnObjects.addEventListener('delete:all', e => {
            Object.keys (this._drawings).forEach(id => {
                let { drawing } = this._drawings[id];
                delete this._drawings[id];
                if (drawing) {
                    drawing.remove();
                }
            });
            this.updateDrawnObjects();
        });

        document.body.addEventListener('click', e => this._imageDetails.hide());
    }
    process_ql (id, show) {
        this._layer.redrawItem(id);
        if (show) {
            this._layer.bringToTopItem(id);
        }
        else {
            this._layer.bringToBottomItem(id);
        } 
        let event = document.createEvent('Event');
        event.initEvent('visible', false, false);
        this.dispatchEvent(event);                                
    }

    update_row (gmx_id, hover) {                
        switch (this._currentTab) {
            case 'results':                    
                if (hover) {
                    this._resultList.hilite(gmx_id);
                }
                else {
                    this._resultList.dim(gmx_id);
                }                    
                break;
            case 'favorites':                   
                if (hover) {
                    this._favoritesList.hilite(gmx_id);
                }
                else {
                    this._favoritesList.dim(gmx_id);
                }                    
                break;
            default:
                break;
        }
    }

    update_list_item (item, state) {
        const gmx_id = item.properties[0];
        item.properties[visible_index] = state;
        // this._layer.redrawItem(gmx_id);
        let obj = properties_to_item (item.properties);
        switch (this._currentTab) {
            case 'results':                    
                this._resultList.redrawItem(gmx_id, obj);
                break;
            case 'favorites':                    
                this._favoritesList.redrawItem(gmx_id, obj);
                break;
            default:
                break;
        }
    }

    show_ql (id, show) {     
        return new Promise ((resolve,reject) => {
            let item = this._layer.getDataManager()._items[id];
            if (show)  {                
                this.update_list_item (item, 'loading');
                prefetch_ql(item.properties[sceneid_index])
                .then(() => {                        
                    this.update_list_item (item, 'visible');
                    this.process_ql(id, show);
                    resolve();
                })
                .catch(() => {                        
                    this.update_list_item (item, 'failed');
                    resolve();
                });
            }
            else {                                   
                this.update_list_item (item, 'hidden');
                this.process_ql(id, show);
                resolve();
            }
        });                         
    }

    get cart () {
        return this._cart;
    }
    get resultList () {
        return this._resultList;
    }
    get favoritesList () {
        return this._favoritesList;
    }
    set drawings (value) {
        this._drawings = value;
    }
    get drawings () {
        return this._drawings;
    }    
    set downloadCache ({fields, values, types}) {
        this._downloadCache = from_gmx ({fields, values, types});
    }
    get downloadCache () {
        return this._downloadCache;
    }
    setLayer ({fields, values, types}) {  
        // "hover", "selected", "visible", "result", "cart"
        qlCache = {};         
        const idx = fields.indexOf('gmx_id');
        let data = values.reduce((a,item) => {            
            let value = layerAttributes.reduce((b,k) => {
                const i = fields.indexOf(k);
                if (i < 0) {
                    switch (k) {
                        case 'hover':                            
                        case 'selected':                        
                        case 'cart':
                            return b.concat(false);
                        case 'result':
                            return b.concat(true);                        
                        case 'acqtime':
                            return b.concat(null);
                        case 'visible':
                            return b.concat('hidden');
                    }
                }
                else {
                    return b.concat(item[i]);
                }
                
            }, []);
            value.unshift(item[idx]);
            value.push(item[item.length - 1]);
            a.push(value);
            return a;
        },[]);
                
        this._layer.mergeData(data);

        let event = document.createEvent('Event');
        event.initEvent('result:done', false, false);
        this.dispatchEvent(event);
    }
    hideContours() {
        this._currentTab = 'search';
        this._layer.repaint();
    }    
    get resultsCount () {
        return this._layer.getFilteredItems(item => item.result).length;
    }
    get favoritesCount () {
        return this._layer.getFilteredItems(item => item.cart).length;
    }
    get count () {
        switch (this._currentTab) {
            case 'results':
                return this._resultList.count;
            case 'favorites':
                return this._favoritesList.count;
            default:
                return 0;
        }
    }   
    showResults () {
        this._currentTab = 'results';
        this._layer.repaint();
        this._resultList.items = this._layer.getFilteredItems(item => item.result).map(this.update_ql);
    } 
    zoomToResults () {
        let bounds = getBounds(this._layer.getFilteredItems(item => item.result));
        this._map.fitBounds(bounds, { animate: false });
        this._map.invalidateSize();
    } 
    zoomToFavorites () {
        let bounds = getBounds(this._layer.getFilteredItems(item => item.cart));
        this._map.fitBounds(bounds, { animate: false });
        this._map.invalidateSize();
    } 
    showFavorites() {
        this._currentTab = 'favorites';
        this._layer.repaint();        
        this.favoritesList.items = this._layer.getFilteredItems(item => item.cart).map(this.update_ql);
    }
    get hasResults () {        
        let items = this._layer.getDataManager()._items;
        return Object.keys(items).some(id => {
            let item = items[id];
            return item.properties[result_index];
        });
    } 
    get hasVisibleResults () {        
        let items = this._layer.getDataManager()._items;
        return Object.keys(items).some(id => {
            let item = items[id];
            return item.properties[result_index] && item.properties[visible_index];
        });
    }
    get hasFavoritesSelected () {            
        let items = this._layer.getDataManager()._items;
        return Object.keys(items).some(id => {
            let item = items[id];
            return item.properties[cart_index] && item.properties[selected_index];
        });
    }
    get hasFavorites () {        
        let items = this._layer.getDataManager()._items;
        return Object.keys(items).some(id => {
            let item = items[id];
            return item.properties[cart_index];
        });
    }
    addVisibleToCart () {                

        if (this._layer.getFilteredItems(item => item.result && item.visible === 'visible' || item.cart).length > window.MAX_CART_SIZE) {
            let event = document.createEvent('Event');
            event.initEvent('cart:limit', false, false);            
            this.dispatchEvent(event);
            return;
        }

        let items = this._layer.getDataManager()._items;        
        Object.keys(items).forEach(id => {
            let item = items[id];
            if (item.properties[visible_index] === 'visible') {
                item.properties[cart_index] = true;                
                this._layer.redrawItem(item.id);
            }
        });        

        this.showResults();
        
        let event = document.createEvent('Event');
        event.initEvent('cart', false, false);        
        this.dispatchEvent(event);        
    }
    update_ql (item) {
        const {gmx_id, visible} = item;            
        let show = false;
        switch (visible) {
            case 'visible':
            case 'loading':
                show = true;
                break;                
            case 'hidden':
            default:
                show = false;
                break;
        }
        this.show_ql(gmx_id, show);
        return item;
    }    
    removeSelectedFavorites () {
        let items = this._layer.getDataManager()._items;        
        Object.keys(items).forEach(id => {
            let item = items[id];
            if (item.properties[cart_index] && item.properties[selected_index]) {
                item.properties[cart_index] = false;
                item.properties[selected_index] = false;
                this._layer.redrawItem(item.id);
            }
        });        
        this._favoritesList.items = this._layer.getFilteredItems(item => item.cart);
    }
    get results () {
        let items = this._layer.getDataManager()._items;
        return this._resultList.items.map(item => {
            let properties = items[item.gmx_id].properties;
            item.geoJSON = L.gmxUtil.convertGeometry (properties[properties.length - 1], true, true);
            item.geoJSON = normalize_geometry_type(item.geoJSON);
            return item;
        });
    }
    get favorites () {
        let items = this._layer.getDataManager()._items;
        return this._favoritesList.items.map(item => {
            let properties = items[item.gmx_id].properties;
            item.geoJSON = L.gmxUtil.convertGeometry (properties[properties.length - 1], true, true);
            item.geoJSON = normalize_geometry_type(item.geoJSON);
            return item;
        });
    }
    clear () {
        this.resultList.items = [];
        this._downloadCache = [];        
        let items = this._layer.getDataManager()._items;
        let toRemove = Object.keys(items).reduce((a,gmx_id) => {
            let item = items[gmx_id].properties;
            if (item[cart_index]) {
                item[result_index] = false;
            }
            else {
                a.push([gmx_id]);
            }            
            return a;
        }, []);
        this._layer.removeData(toRemove);
    }    
    createDrawing({object, geoJSON}) { 
        const id = object.options.uuid || L.gmxUtil.newId();        
        if(!this._drawings[id]) {
            object.options.uuid = id;
            let color = L.GmxDrawing.utils.defaultStyles.lineStyle.color;
            switch (object.options.type) {
                case 'Polygon':
                case 'Polyline':
                case 'Rectangle':
                    color = object.options.lineStyle.color;
                    break;
                default:
                    break;
            }                     
            geoJSON = geoJSON || object.toGeoJSON();
            this._drawings[object.options.uuid] = this.getObject({
                id: object.options.uuid,                
                name: null,
                geoJSON, 
                color,
                visible: true,
            });
            this._drawings[object.options.uuid].drawing = object;
            this.updateDrawnObjects();
            window.Catalog.preventShowQuicklook = false;
            return this._drawings[object.options.uuid].drawing;
        }
        else {            
            return this._drawings[id].drawing;
        }
    }    
    addDrawing (item) {        
        let { name, color, area, geoJSON, visible } = item;
        if(is_geojson_feature(geoJSON)) {
            let id = L.gmxUtil.newId();
            let editable = typeof geoJSON.properties.editable === 'undefined' ? true : geoJSON.properties.editable;            ;
            this._drawings[id] = this.getObject ({ id, name, geoJSON, color, visible, editable });            
            this.updateDrawnObjects();            
            this.showDrawing(id, visible);
            return this._drawings[id].drawing;
        }   
        else {
            return null;
        }             
    }  
    showDrawing (id, visible) {
        if (visible) {
            let object = this._drawings[id];
            let color = object.color;
            let editable = typeof object.geoJSON.properties.editable === 'undefined' ? true : object.geoJSON.properties.editable;
            let options = {
                editable,
                lineStyle: {
                    fill: false,
                    weight: 2,
                    opacity: 1,
                    color,
                },
                pointStyle: {
                    color,
                }                        
            };            
            let [drawing] = this._map.gmxDrawing.addGeoJSON(object.geoJSON, options);
            if (!editable) {
                options.className = 'osm-layer';             
                drawing.enableEdit();
                drawing.setOptions({                                     
                    editable,                    
                    lineStyle: {
                        fill: false,
                        weight: 2,
                        opacity: 1,
                        color,
                    },                    
                    pointStyle: {color}
                });
                drawing.disableEdit();
            }
            drawing.options.uuid = id;
            object.drawing = drawing;
            drawing.bringToBack();
            drawing.visible = true;
        }
        else {
            this._drawings[id].visible = false;
            if(this._drawings[id].drawing) {
                this._drawings[id].drawing.remove();
                this._drawings[id].drawing = null;
            }            
        } 
    }
    updateDrawing(object) {
        if(this._drawings[object.options.uuid]){
            const id = object.options.uuid;            
            const geoJSON = object.toGeoJSON();
            this._drawings[id].drawing = object;
            this._drawings[id].geoJSON = geoJSON;
            this._drawings[id].area = this._getObjectArea(geoJSON);
            this.updateDrawnObjects();
        }
    }
    _getObjectName(geoJSON) {
        if(geoJSON.properties.name) {
            return geoJSON.properties.name;
        }
        else {
            const type = geoJSON.geometry.type;
            switch (type.toUpperCase()) {
                case 'POINT':
                    return T.getText('objects.point');
                case 'LINESTRING':
                case 'MULTILINESTRING':
                    return T.getText('objects.line');
                case 'MULTIPOLYGON':
                case 'POLYGON':
                default:
                    return T.getText('objects.polygon');
            }         
        }
    }
    _getObjectArea(geoJSON) {        
        const type = geoJSON.geometry.type;
        switch (type.toUpperCase()) {
            case 'POINT':
                return 0;
            case 'LINESTRING':
            case 'MULTILINESTRING':
                return L.gmxUtil.geoJSONGetLength(geoJSON);
            case 'MULTIPOLYGON':
            case 'POLYGON':
            default:
                return L.gmxUtil.geoJSONGetArea(geoJSON);
        }
    }
    getObject ({id, name, geoJSON, color, visible}) {
        id = id || L.gmxUtil.newId();
        return {
            id,
            name: (name === null || typeof name === 'undefined') ? this._getObjectName(geoJSON) : decodeURIComponent(name),
            area: this._getObjectArea(geoJSON),            
            geoJSON:  {type: 'Feature', geometry: L.gmxUtil.geometryToGeoJSON(geoJSON.geometry), properties: geoJSON.properties },
            visible: typeof visible === 'undefined' ? true : Boolean(visible),
            color: geoJSON.geometry.type === 'Point' ? 
                undefined : 
                typeof color === 'undefined' ? 
                    '#0033FF' : 
                    isNaN (parseInt(color, 10)) ? color : `#${hex(color)}`,
            editable: typeof geoJSON.properties.editable === 'undefined' ? true : geoJSON.properties.editable,
        };
    }
    updateDrawnObjects() {
        let objects =  Object.keys(this._drawings).map(id => this._drawings[id]);
        this._requestAdapter.geometries = objects.filter(obj => obj.visible).reduce((a, {geoJSON}) => a.concat(geoJSON.geometry), []);
        this._drawnObjects.items = objects;
    }  
    enableFilter (enable) {
        this._resultList.enableFilter (enable);
        this._favoritesList.enableFilter (enable);
    }
    set filter (value) {
        this._filter = value;
        this._resultList.filter = value;
        this._favoritesList.filter = value;
        this._layer.repaint();
    } 
    get platforms () {
        let get_platforms = items => {
            let ps = items.reduce((a,{platform}) => {
                a[platform] = true;
                return a;
            }, {});
            return Object.keys(ps).map(platform => {
                return {platform, checked: true};
            });
        };
        switch (this._currentTab) {
            case 'results':
                return get_platforms (this._layer.getFilteredItems(item => item.result));
            case 'favorites':                
                return get_platforms (this._layer.getFilteredItems(item => item.cart));
            default:
                return [];
        }
    }   
}

export { ResultsController, layerAttributes, layerAttrTypes };
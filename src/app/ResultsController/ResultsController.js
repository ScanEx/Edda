import EventTarget from 'scanex-event-target';
import Translations from 'scanex-translations';
import { CompositeLayer, attributes as layerAttributes, attrTypes as layerAttrTypes } from '../../app/CompositeLayer/CompositeLayer.js';
import { is_geojson_feature, from_gmx, split180, normalize_geometry_type, hex } from '../../app/Utils/Utils.js';
import { get_hash } from 'scanex-datagrid';

import './ResultsController.css';

let T = Translations;

const Colors = {
    Default: 0x23a5cc,
    Hilite: 0x23a5cc,
    Cart: 0xef4e70,
    CartHilite: 0xef4e70,
};

const properties_to_item = properties => {
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
};

const sceneid_index = layerAttributes.indexOf('sceneid') + 1;
const result_index = layerAttributes.indexOf('result') + 1;
const cart_index = layerAttributes.indexOf('cart') + 1;
const selected_index = layerAttributes.indexOf('selected') + 1;
const visible_index = layerAttributes.indexOf('visible') + 1;
const hover_index = layerAttributes.indexOf('hover') + 1;

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
        this._currentID = null;        

        this._compositeLayer = new CompositeLayer({ map: this._map});
        this._compositeLayer.addEventListener('click', e => {
            let {id, show} = e.detail;    
            let obj = this._compositeLayer.getItem (id);
            this._update_list_item (id, obj);        
            switch (this._currentTab) {
                case 'results':                        
                    if (show) {                            
                        if (this._currentID) {
                            this._resultList.dim(this._currentID);
                        }
                        this._currentID = id;
                        this._resultList.hilite(id);
                        this._resultList.scrollToRow(id);
                    }
                    else {
                        this._currentID = null;
                    }
                    break;
                case 'favorites':
                    if (show) {
                        if (this._currentID) {
                            this._favoritesList.dim(this._currentID);
                        }
                        this._currentID = id;
                        this._favoritesList.hilite(id);
                        this._favoritesList.scrollToRow(id);                            
                    }
                    else {
                        this._currentID = null;
                    }
                    break;
                default:
                    break;
            }            
        });   
        this._compositeLayer.addEventListener('ready', e => { 
            let {id} = e.detail;
            let obj = this._compositeLayer.getItem (id);
            this._update_list_item (id, obj);
            let event = document.createEvent('Event');
            event.initEvent('visible', false, false);            
            this.dispatchEvent(event);
        });     
        this._compositeLayer.addEventListener('mouseover', e => {
            const id = e.detail;            
            this._highlight(id, true);
        });
        this._compositeLayer.addEventListener('mouseout', e => {
            const id = e.detail;
            this._highlight(id, false);
        });
        
        this._resultList.addEventListener('cart', e => {            
            const { gmx_id } = e.detail;
            const item = this._compositeLayer.addToCart(gmx_id);
            this._resultList.redrawItem (gmx_id, item);

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

            this._show_ql(gmx_id, show)
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
            this._compositeLayer.setHover(gmx_id, true);            
        });

        this._resultList.addEventListener('mouseout', e => {
            let {item: {gmx_id}} = e.detail;
            this._compositeLayer.setHover(gmx_id, false);            
        });

        this._resultList.addEventListener('click', e => {
            let {item: {gmx_id}} = e.detail;            

            const {properties} = this._compositeLayer.vectors[gmx_id]; 
            const bounds  = this._compositeLayer.getBounds([properties]);
            this._map.fitBounds(bounds, { animate: false });
                        
            this._show_ql(gmx_id, true)
            .then(() => {                
                let event = document.createEvent('Event');
                event.initEvent('visible', false, false);
                this.dispatchEvent(event);
            });
            
        });        

        this._resultList.addEventListener('cart:all', e => {
            let { state } = e.detail;

            this._compositeLayer.addAllToCart();
            this._resultList.items = this._compositeLayer.getFilteredItems(item => item.result);

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
            this._compositeLayer.setSelected(gmx_id, selected);
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
            this._show_ql(gmx_id, show)
            .then(() => {
                let event = document.createEvent('Event');
                event.initEvent('visible', false, false);
                this.dispatchEvent(event);
            });            
        });

        this._favoritesList.addEventListener('visible:all', e => {
            let show = e.detail;
            let items = this._compositeLayer.vectors;
            Object.keys(items)
            .filter(id => items[id].properties[cart_index])
            .forEach(id => {
                this._show_ql(id, show);
            });

            let event = document.createEvent('Event');
            event.initEvent('visible', false, false);
            this.dispatchEvent(event);
        });

        this._favoritesList.addEventListener('mouseover', e => {
            let {item: {gmx_id}} = e.detail;
            this._compositeLayer.setHover(gmx_id, true);            
        });

        this._favoritesList.addEventListener('mouseout', e => {
            let {item: {gmx_id}} = e.detail;
            this._compositeLayer.setHover(gmx_id, false);
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
            let {item: {gmx_id}} = e.detail;
            const {properties} = this._compositeLayer.vectors[gmx_id];            
            const bounds  = this._compositeLayer.getBounds([properties]);
            this._map.fitBounds(bounds, { animate: false });
            this._show_ql(gmx_id, true);
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
                    // this._map.invalidateSize();
                }
                else {                    
                    const bounds = item.drawing.getBounds();
                    this._map.fitBounds(bounds, { animate: false });
                    // this._map.invalidateSize();
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
    
    _highlight (gmx_id, hover) {                
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

    _update_list_item (id, item) {        
        switch (this._currentTab) {
            case 'results':                    
                this._resultList.redrawItem(id, item);
                break;
            case 'favorites':                    
                this._favoritesList.redrawItem(id, item);
                break;
            default:
                break;
        }
    }

    _show_ql (id, show) {
        return new Promise(resolve => {                        
            if(this._compositeLayer.setVisible(id, show)) {                
                this._update_list_item (id, this._compositeLayer.getItem (id));
                this._compositeLayer.showQuicklook(id, show)
                .then(() => {                    
                    this._update_list_item (id, this._compositeLayer.getItem (id));
                    let event = document.createEvent('Event');
                    event.initEvent('visible', false, false);
                    this.dispatchEvent(event); 
                    resolve();
                })
                .catch(e => console.log(e));
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
    setLayer ({fields, values, types}, activeTabId = 'results') {
        this._compositeLayer.setData({fields, values}, activeTabId);
        let event = document.createEvent('Event');
        event.initEvent('result:done', false, false);
        event.detail = {activeTabId};
        this.dispatchEvent(event);
    }
    hideContours() {
        this._currentTab = 'search';
        this._compositeLayer.currentTab = this._currentTab;
        this._compositeLayer.redraw();
    }    
    get resultsCount () {
        return this._compositeLayer.resultsCount;
    }
    get favoritesCount () {
        return this._compositeLayer.favoritesCount;
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
        this._compositeLayer.currentTab = this._currentTab;
        this._compositeLayer.redraw();
        this._resultList.items = this._compositeLayer.getFilteredItems(item => item.result);
        // this._resultList.items.forEach(({gmx_id, visible}) => this._update_ql(gmx_id, visible));
    } 
    zoomToResults () {        
        this._compositeLayer.zoomToResults();
    } 
    zoomToFavorites () {        
        this._compositeLayer.zoomToFavorites();
    } 
    showFavorites() {
        this._currentTab = 'favorites';
        this._compositeLayer.currentTab = this._currentTab;
        this._compositeLayer.redraw();
        this.favoritesList.items = this._compositeLayer.getFilteredItems(item => item.cart);
        // this.favoritesList.items.forEach(({gmx_id, visible}) => this._update_ql(gmx_id, visible));
    }
    get hasResults () {        
        return this._compositeLayer.hasResults;
    } 
    get hasVisibleResults () {        
        return this._compositeLayer.hasVisibleResults;
    }
    get hasFavoritesSelected () {        
        return this._compositeLayer.hasFavoritesSelected;
    }
    get hasFavorites () {        
        return this._compositeLayer.hasFavorites;
    }

    addVisibleToCart () {                

        if (this._compositeLayer.getFilteredItems(item => item.result && item.visible === 'visible' || item.cart).length > window.MAX_CART_SIZE) {
            let event = document.createEvent('Event');
            event.initEvent('cart:limit', false, false);            
            this.dispatchEvent(event);
            return;
        }

        this._compositeLayer.addVisibleToCart();

        this.showResults();
        
        let event = document.createEvent('Event');
        event.initEvent('cart', false, false);        
        this.dispatchEvent(event);        
    }
    _update_ql (id, visible) {        
        let show = false;
        if (typeof visible === 'boolean') {
            show = visible;
        }
        else if (typeof visible === 'string') {
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
        }        
        return this._show_ql(id, show);
    }    
    removeSelectedFavorites () {
        this._compositeLayer.removeSelectedFavorites();       
        this._favoritesList.items = this._compositeLayer.getFilteredItems(item => item.cart);
    }
    get results () {        
        let items = this._compositeLayer.vectors;
        return this._compositeLayer.results.map(item => {            
            let {properties} = items[item.gmx_id];
            item.geoJSON = L.gmxUtil.convertGeometry (properties[properties.length - 1], true, true);
            item.geoJSON = normalize_geometry_type(item.geoJSON);
            return item;
        });
    }
    get favorites () {
        let items = this._compositeLayer.vectors;
        return this._compositeLayer.favorites.map(item => {
            let {properties} = items[item.gmx_id];
            item.geoJSON = L.gmxUtil.convertGeometry (properties[properties.length - 1], true, true);
            item.geoJSON = normalize_geometry_type(item.geoJSON);
            return item;
        });
    }
    clear () {
        this.resultList.items = [];
        this._downloadCache = [];     
        this._compositeLayer.clear();        
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
            let editable = typeof geoJSON.properties.editable === 'undefined' ? true : geoJSON.properties.editable;
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
                // drawing.enableEdit();
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
                // drawing.disableEdit();
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
        const id = object.options.uuid;            
        const geoJSON = object.toGeoJSON();
        let { geometry } = geoJSON;
        let { coordinates } = geometry;        
        if(typeof coordinates !== 'undefined' && this._drawings[id]){
            this._drawings[id].drawing = object;
            this._drawings[id].geoJSON = geoJSON;
            this._drawings[id].area = this._getObjectArea(geoJSON);            
        }
        else {
            if(this._drawings[id].drawing) {
                this._drawings[id].drawing.remove();
                this._drawings[id].drawing = null;
                delete this._drawings[id];                
            }
        }
        this.updateDrawnObjects();
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
        const {geometry: {type,coordinates}} = geoJSON;
        if (typeof coordinates !== 'undefined') {
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
        this._requestAdapter.geometries = objects
        .filter(obj => obj.visible)
        .reduce((a, {geoJSON}) => a.concat(geoJSON.geometry), [])
        .reduce((a, geometry) => {
            return a.concat (split180(geometry));
        }, []);
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
        this._compositeLayer.redraw();
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
                return get_platforms (this._compositeLayer.getFilteredItems(item => item.result));
            case 'favorites':                
                return get_platforms (this._compositeLayer.getFilteredItems(item => item.cart));
            default:
                return [];
        }
    }   
}

export { ResultsController, layerAttributes, layerAttrTypes };
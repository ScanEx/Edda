import EventTarget from 'scanex-event-target';
import { flatten, split_complex_id, normalize_geometry_type, normalize_geometry, normalize_point, get_bbox, make_close_to } from '../../app/Utils/Utils.js';

const Colors = {
    Default: 0x23a5cc,
    Hilite: 0x23a5cc,
    Cart: 0xef4e70,
    CartHilite: 0xef4e70,
};

const serialize = obj => Object.keys(obj).map(id => obj[id]);

const attributes = ["hover", "selected", "visible", "clip_coords", "result", "cart", "sceneid", "acqdate", "acqtime", "cloudness", "tilt", "sunelev", "stereo", "url", "x1", "y1", "x2", "y2", "x3", "y3", "x4", "y4", "volume", "platform", "spot5_a_exists", "spot5_b_exists", "islocal", "product", "gmx_id", "sensor", "local_exists", "spot5id", "stidx"];
const attrTypes = ["boolean", "boolean", "string", "object", "boolean", "boolean", "string", "date", "time", "float", "float", "float", "string", "string", "float", "float", "float", "float", "float", "float", "float", "float", "string", "string", "boolean", "boolean", "boolean", "boolean", "integer", "string", "boolean", "string", "integer"];

class CompositeLayer extends EventTarget {
    constructor ({        
        minZoom = 3,
        maxZoom = 17,
        map,
        qlUrl = '//search.kosmosnimki.ru/QuickLookImage.ashx',
        // qlUrl = '//wikimixer.kosmosnimki.ru/QuickLookImage.ashx',
        qlSize = { width: 600, height: 600 },
        srs = 3857}) {
        super();
        this._currentTab = '';
        this._qlUrl = qlUrl;
        this._qlSize = qlSize;
        this._attributes = attributes;
        this._attrTypes = attrTypes;
        this._sceneid_index = this._attributes.indexOf('sceneid') + 1;
        this._cloudness_index = this._attributes.indexOf('cloudness') + 1;
        this._tilt_index = this._attributes.indexOf('tilt') + 1;
        this._result_index = this._attributes.indexOf('result') + 1;
        this._platform_index = this._attributes.indexOf('platform') + 1;
        this._clip_coords_index = this._attributes.indexOf('clip_coords') + 1;
        this._cart_index = this._attributes.indexOf('cart') + 1;
        this._selected_index = this._attributes.indexOf('selected') + 1;
        this._acqdate_index = this._attributes.indexOf('acqdate') + 1;
        this._url_index = this._attributes.indexOf('url') + 1;
        this._visible_index = this._attributes.indexOf('visible') + 1;
        this._hover_index = this._attributes.indexOf('hover') + 1;
        this._x1_index = this._attributes.indexOf('x1') + 1;
        this._vectors = {};        
        this._propertiesToItem = this._propertiesToItem.bind(this);

        this._map = map;
        let tab_filter = ({properties}) => {
            let obj = this._propertiesToItem(properties);
            let filtered = true;            
            if(typeof this._filter === 'function') {
                filtered = this._filter(obj);
            }
            
            let resultsClientFilter = window.Catalog.resultList.clientFilter;
            let unChecked = window.Catalog.resultList.unChecked;
            let {satellites, clouds, angle, date} = resultsClientFilter;

            let propertiesValue = properties[this._acqdate_index];
            let propertiesDate;
            switch (typeof propertiesValue) {
                case 'string':
                    propertiesDate = new Date(propertiesValue);
                    break;
                case 'number':
                    propertiesDate = new Date(propertiesValue * 1000);
                    break;
                default:
                    break;
            }     

            let satellitePlatforms = [];
            satellites.forEach(item => {
                const {_platforms: platforms} = item;
                platforms.forEach(platform => {
                    if (satellitePlatforms.indexOf(platform) === -1 && unChecked.indexOf(platform) === -1) {
                        satellitePlatforms.push(platform);
                    }
                });
            });

            switch (this._currentTab) {
                case 'results':
                    let satellitesCriteria = satellitePlatforms.indexOf(properties[this._platform_index]) !== -1;
                    let cloudsCriteria = clouds[0] <= properties[this._cloudness_index] && properties[this._cloudness_index] <= clouds[1];
                    let angleCriteria = angle[0] <= properties[this._tilt_index] && properties[this._tilt_index] <= angle[1];
                    let dateCriteria = date[0].getTime() <= propertiesDate.getTime() && propertiesDate.getTime() <= date[1].getTime();
                    return filtered && ( (properties[this._result_index] && satellitesCriteria && cloudsCriteria && angleCriteria && dateCriteria) || (properties[this._result_index] && properties[this._cart_index]));
                case 'favorites':                                     
                    return filtered && properties[this._cart_index];
                case 'search':
                    return false;
                default:
                    return true;
            }
        };
        this._vectorLayer = L.gmx.createLayer({
            geometry: null,
            properties: {
                type: 'Vector',
                visible: true,
                identityField: 'gmx_id',
                GeometryType: 'polygon',                
                srs,
                attributes: this._attributes,
                attrTypes: this._attrTypes,
                styles: [
                    {
                        MinZoom: minZoom,
                        MaxZoom: maxZoom,
                        DisableBalloonOnClick: true,
                        DisableBalloonOnMouseMove: true,                        
                        RenderStyle:{
                            outline: { color: Colors.Default, thickness: 1 },
                            fill: { color: 0xfff, opacity: 0 }
                        },                       
                        HoverStyle:{
                            outline: { color: Colors.Default, thickness: 1 },
                            fill: { color: 0xfff, opacity: 0 }
                        },
                    }
                ]
            },
        });
        this._vectorLayer.disableFlip();
        this._vectorLayer.setFilter (tab_filter);
        this._vectorLayer.setStyleHook (item => {
            
            const currentTab = this._currentTab;

            let {properties} = item;
            let color = Colors.Default;
            let lineWidth = 1;

            if (currentTab === 'results' && properties[this._cart_index]) {
                lineWidth = 3;
            }

            if (properties[this._hover_index]) {
                color = properties[this._cart_index] ? Colors.CartHilite : Colors.Hilite;
                lineWidth = 5;
            }
            else {
                color = properties[this._cart_index] ? Colors.Cart : Colors.Default;
            }

            return { skipRasters: true, strokeStyle: color, lineWidth };
        });
        this._vectorLayer.addTo(this._map);
        this._vectorLayer
        .on('click', e => {
            let { gmx: {id, layer, target} } = e;            
            let show = null;
            if(this._vectors[id]) {
                let {properties} = this._vectors[id];
                if (properties) {
                    switch (properties[this._visible_index]) {
                        case 'visible':
                        case 'loading':
                            show = false;
                            break;                
                        case 'hidden':
                        default:
                            show = true;
                            break;
                    }
                    this.setVisible(id, show);            
                    this.showQuicklook(id, show)
                    .then(() => {
                        let event = document.createEvent('Event');
                        event.initEvent('ready', false, false);
                        event.detail = {id, show};
                        this.dispatchEvent(event);
                    });
                    let event = document.createEvent('Event');
                    event.initEvent('click', false, false);
                    event.detail = {id, show};
                    this.dispatchEvent(event);
                }
            }
        })
        .on('mouseover', e => {
            let { gmx: {id, layer, target} } = e;
            if (this._vectors[id]) {
                let {properties} = this._vectors[id];
                if(properties) {
                    properties[this._hover_index] = true;
                    this._vectorLayer.redrawItem(id);
                    let event = document.createEvent('Event');
                    event.initEvent('mouseover', false, false);
                    event.detail = id;
                    this.dispatchEvent(event);
                }
            }
        })
        .on('mouseout', e => {
            let { gmx: {id, layer, target} } = e;
            if (this._vectors[id]) {
                let {properties} = this._vectors[id];
                if (properties) {
                    properties[this._hover_index] = false;                
                    this._vectorLayer.redrawItem(id);
                    let event = document.createEvent('Event');
                    event.initEvent('mouseout', false, false);
                    event.detail = id;
                    this.dispatchEvent(event);
                }
            }            
        });
    }
    showQuicklook (id, show) {
        return new Promise (resolve => {
            let {properties,quicklook} = this._vectors[id];            
            if (show) {
                if (!quicklook) {
                    const sceneid = split_complex_id(properties[this._sceneid_index]).id;
                    const platform = properties[this._platform_index];
                    let imageUrl = `${this._qlUrl}?sceneid=${sceneid}&platform=${platform}&width=${this._qlSize.width}&height=${this._qlSize.height}`;
                    // let imageUrl = `${this._qlUrl}?sceneid=${sceneid}&platform=${platform}`;
                    const {lng} = this._map.getCenter();
                    let clipCoords = normalize_geometry(properties[this._clip_coords_index], lng);
                    let [ x1,y1, x2,y2, x3,y3, x4,y4 ] = properties.slice(this._x1_index, this._x1_index + 8);
                    const anchors = [
                        [make_close_to(lng, x1),y1],
                        [make_close_to(lng, x2),y2],
                        [make_close_to(lng, x3),y3], 
                        [make_close_to(lng,x4),y4]
                    ];
                    
                    quicklook = L.imageTransform(imageUrl, flatten(anchors, true), { 
                        clip: clipCoords,
                        disableSetClip: true,
                        pane: 'tilePane'
                    });                    
                    quicklook.on('load', e => {
                        properties[this._visible_index] = 'visible';
                        const gmx_id = properties[0];
                        this._vectorLayer.bringToTopItem(gmx_id);
                        resolve();
                    });
                    quicklook.on('error', e => {
                        properties[this._visible_index] = 'failed';
                        this._map.removeLayer(quicklook);    
                        const gmx_id = properties[0];
                        if (this._vectors[gmx_id]) {
                            this._vectors[gmx_id].quicklook = null;
                        }
                        resolve();
                    });
                    quicklook.addTo(this._map);
                    this._vectors[id].quicklook = quicklook;
                    
                }
                else {
                    properties[this._visible_index] = 'visible';
                    quicklook.addTo(this._map);
                    this._vectorLayer.bringToTopItem(id);
                    resolve();
                }
            }
            else {
                if (quicklook) {
                    this._map.removeLayer(quicklook);
                    //this._vectors[id].quicklook = null;
                }
                this._vectorLayer.bringToBottomItem(id);  
                resolve();
            }
        });        
    }
    _propertiesToItem (properties) {
        return properties && properties.slice(1, properties.length - 1).reduce((a,v,i) => {
            let f = this._attributes[i];
            switch (this._attrTypes[i]){
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
        },{}) || null;
    }
    _mergeResults (old, data) {
        let cache = Object.keys(old).reduce((a,id) => {
            a[id] = a[id] || {properties: [], quicklook: null};
            a[id].properties = old[id].properties;
            return a;
        }, {});
        return data.reduce((a,value) => {
            const id = value[0];
            if (cache[id]){
                cache[id].properties[this._result_index] = true;
            }
            else {
                a[id] = a[id] || {properties: [], quicklook: null};
                a[id].properties = value;
            }
            return a;
        }, cache);
    }
    setData ({fields, values}, activeTabId = 'results') {
        const idx = fields.indexOf('gmx_id');        
        let vectors = values.reduce((a,properties) => {
            let clipCoords = normalize_geometry (L.gmxUtil.geometryToGeoJSON(properties[properties.length - 1], true, true));
            let value = this._attributes.reduce((b,k) => {
                const i = fields.indexOf(k);
                if (i < 0) {
                    switch (k) {
                        case 'hover':                            
                        case 'selected':                        
                        case 'cart':
                            b.push(false);
                            break;
                        case 'result':
                            b.push(true);                        
                            break;
                        case 'acqtime':
                            b.push(null);
                            break;
                        case 'visible':
                            b.push('hidden');
                            break;
                        case 'clip_coords':
                            b.push(clipCoords);
                            break;
                        default:
                            break;
                    }
                }
                else {
                    switch (k) {
                        case 'visible':
                            switch (typeof properties[i]) {                            
                                case 'boolean':
                                    b.push(properties[i] ? 'visible' : 'hidden');
                                    break;
                                default:
                                case 'string':
                                    b.push(properties[i]);
                                    break;
                            } 
                            break;
                        case 'clip_coords':
                            b.push(clipCoords);
                            break;                      
                        default:
                            b.push(properties[i]);
                            break;
                    }                   
                } 
                return b;               
            }, []);
            value.unshift(properties[idx]);            
            value.push(properties[properties.length - 1]);
            a.push(value);            
            return a;
        },[]);        
        this._vectors = this._mergeResults (this._vectors, vectors);
        this._vectorLayer.removeData();
        let items = serialize(this._vectors).map(({properties}) => properties);
        this._vectorLayer.addData(items);
    }

    clear () {         
        let toRemove = Object.keys(this._vectors).reduce((a,id) => {
            let {properties} = this._vectors[id];
            if (properties[this._cart_index]) {
                properties[this._result_index] = false;
            }
            else {
                a.push([id]);
            }            
            return a;
        }, []);
        this._vectorLayer.removeData(toRemove);
        toRemove.forEach(([id]) => {
            let {quicklook} = this._vectors[id];
            if(quicklook) {
                this._map.removeLayer(quicklook);
            }
            delete this._vectors[id];
        });        
    }
    
    get vectors () {
        return this._vectors;
    }

    get hasResults () {        
        return Object.keys(this._vectors).some(id =>  {
            const {properties} = this._vectors[id];
            return properties[this._result_index];
        });
    }

    get hasVisibleResults () {        
        return Object.keys(this._vectors).some(id =>  {
            const {properties} = this._vectors[id];
            return properties[this._result_index] && properties[this._visible_index] === 'visible';
        });
    }

    get hasFavoritesSelected () {        
        return Object.keys(this._vectors).some(id => {
            const {properties} = this._vectors[id];
            return properties[this._cart_index] && properties[this._selected_index];
        });            
    }

    get hasFavorites () {                
        return Object.keys(this._vectors).some(id =>  {
            const {properties} = this._vectors[id];
            return properties[this._cart_index];            
        });
    }

    get results () {
        return this.getFilteredItems(item => item.result);
    }

    get favorites () {
        return this.getFilteredItems(item => item.cart);
    }

    get resultsCount () {
        return Object.keys(this._vectors).reduce((a,id) =>  {
            const { properties } = this._vectors[id];
            return properties[this._result_index] ? a + 1 : a;
        }, 0);
    }
    
    get favoritesCount () {
        return Object.keys(this._vectors).reduce((a,id) =>  {
            const { properties } = this._vectors[id];
            return properties[this._cart_index] ? a + 1 : a;
        }, 0);
    }
    getFilteredItems (filter) {        
        return serialize (this._vectors).map(({properties}) => this._propertiesToItem(properties)).filter (filter);
    }
    getItem (id) {
        if (this._vectors[id]) {            
            return this._propertiesToItem(this._vectors[id].properties);
        }
        else {
            console.warn('vector layer item with id =', id, ' not found.');
            return null;
        }
    }
    redraw () {
        this._vectorLayer.repaint();
    }
    redrawItem (id) {
        this._vectorLayer.redrawItem(id);
    }
    setHover (id, hover) {
        if (this._vectors[id]) {            
            this._vectors[id].properties[this._hover_index] = hover;
            this.redrawItem(id);
        }
        else {
            console.warn('vector layer item with id =', id, ' not found.');
        }
    }
    setSelected (id, selected) {
        if (this._vectors[id]) {
            this._vectors[id].properties[this._selected_index] = selected;
            this.redrawItem(id);
        }
        else {
            console.warn('vector layer item with id =', id, ' not found.');
        }
    }
    setVisible (id, show) {
        if (this._vectors[id]) {
            let {properties} = this._vectors[id];
            let changed = false;
            if (show) {
                switch(properties[this._visible_index]) {
                    case 'hidden':
                    case 'failed':
                        properties[this._visible_index] = 'loading';
                        changed = true;
                        break;
                    case 'loading':                
                        properties[this._visible_index] = 'visible';
                        changed = true;
                        break;
                    case 'visible':
                    default:
                        break;
                }
            }
            else {
                switch(properties[this._visible_index]) {
                    case 'failed':
                    case 'loading':
                    case 'visible':
                        properties[this._visible_index] = 'hidden';
                        changed = true;
                        break;
                    case 'hidden':
                    default:
                        break;
                }
            }
            this._vectorLayer.redrawItem(id);
            return changed;
        }
        else {
            console.warn('vector layer item with id =', id, ' not found.');
            return false;
        }        
    }

    addAllToCart() {
        
        const resultFiltered = window.Catalog.resultList.filteredItems;
        const gmxIdList = resultFiltered.map(item => item['gmx_id']);

        Object.keys(this._vectors).forEach(id => {
            let {properties} = this._vectors[id];
            if (properties[this._result_index] && gmxIdList.indexOf(parseInt(id)) !== -1) {
                properties[this._cart_index] = true;
                properties[this._selected_index] = true;
            }
        });
        this.redraw();
    }    
       
    addToCart(id) {
        let {properties} = this._vectors[id];
        if (properties) {
            properties[this._cart_index] = !properties[this._cart_index];
            properties[this._selected_index] = true;
            this._vectorLayer.redrawItem(id);
        }
        return this._propertiesToItem (properties);
    }

    removeSelectedFavorites () {        
        Object.keys(this._vectors).forEach(id => {
            let {properties,quicklook} = this._vectors[id];
            if (properties[this._cart_index] && properties[this._selected_index]) {
                properties[this._cart_index] = false;
                properties[this._selected_index] = false;
                this.showQuicklook(id, false);
                this._vectorLayer.redrawItem(id);
            }
        });
    }

    addVisibleToCart () {        
        Object.keys(this._vectors).forEach(id => {
            let {properties} = this._vectors[id];
            if (properties[this._visible_index] === 'visible') {
                properties[this._cart_index] = true;
                properties[this._selected_index] = true;
                this._vectorLayer.redrawItem(id);
            }
        });
    }

    set currentTab (value) {
        this._currentTab = value;
        Object.keys(this._vectors).forEach(id => {
            let {properties} = this._vectors[id];
            let filtered = true;
            if(typeof this._filter === 'function') {
                filtered = this._filter(this._propertiesToItem(properties));
            }
            switch (this._currentTab) {
                case 'results':
                    this.showQuicklook(id, filtered && properties[this._result_index] && properties[this._visible_index] === 'visible');
                    break;
                case 'favorites':                
                    this.showQuicklook(id, filtered && properties[this._cart_index] && properties[this._visible_index] === 'visible');
                    break;
                case 'search':
                    this.showQuicklook(id, false);
                    break;
                default:
                    break;
            }
        });
    }

    _normBounds (x2,x4) {
        if (x2 < 0 && x4 > 0) {
            return [x2 + 360, x4];
        }
        else if (x2 > 0 && x4 < 0) {
            return [x2, x4 + 360];
        }
    }

    getBounds (items) {        
        let bounds = items.reduce((a,properties) => {
            const geometry = L.gmxUtil.convertGeometry(properties[properties.length - 1], true, true);
            let [[x1,y1],[x2,y2],[x3,y3],[x4,y4]] = get_bbox(geometry);            
            let ne = L.latLng(y2,x2);
            let sw = L.latLng(y4,x4);
            let b = L.latLngBounds(ne, sw);
            if (a === null) {            
                a = b;
            }
            else {
                a.extend(b);
            }
            return a;
        }, null);
        let ne = bounds.getNorthEast();
        let sw = bounds.getSouthWest();
        const lng = ne.lng;
        ne = L.latLng (ne.lat, make_close_to(lng, ne.lng));
        sw = L.latLng (sw.lat, make_close_to(lng, sw.lng));
        return L.latLngBounds(ne, sw);
    }

    zoomToResults () {
        let items = serialize(this._vectors).map(({properties}) => properties).filter(properties => properties[this._result_index]);
        let bounds = this.getBounds(items);      
        if (bounds) {                        
            this._map.fitBounds(bounds, { animate: false });
        }
    } 
    zoomToFavorites () {
        let items = serialize(this._vectors).map(({properties}) => properties).filter(properties => properties[this._cart_index]);
        let bounds = this.getBounds(items);
        if (bounds) {
            this._map.fitBounds(bounds, { animate: false });        
        }
    } 
}

export { CompositeLayer, attributes, attrTypes };
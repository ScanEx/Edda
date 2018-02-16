import { EventTarget } from 'lib/EventTarget/src/EventTarget.js';
import { flatten, normalize_geometry, split_complex_id, normalize_geometry_type, chain } from 'app/Utils/Utils.js';

const Colors = {
    Default: 0x23a5cc,
    Hilite: 0x23a5cc,
    Cart: 0xef4e70,
    CartHilite: 0xef4e70,
};

function serialize (obj) {
    return Object.keys(obj).map(id => obj[id]);
}

const attributes = ["hover", "selected", "visible", "result", "cart", "clip_coords", "sceneid", "acqdate", "acqtime", "cloudness", "tilt", "sunelev", "stereo", "url", "x1", "y1", "x2", "y2", "x3", "y3", "x4", "y4", "volume", "platform", "spot5_a_exists", "spot5_b_exists", "islocal", "product", "gmx_id", "sensor", "local_exists", "spot5id", "stidx"];
const attrTypes = ["boolean", "boolean", "string", "boolean", "boolean", "object", "string", "date", "time", "float", "float", "float", "string", "string", "float", "float", "float", "float", "float", "float", "float", "float", "string", "string", "boolean", "boolean", "boolean", "boolean", "integer", "string", "boolean", "string", "integer"];

class CompositeLayer extends EventTarget {
    constructor ({        
        minZoom = 3,
        maxZoom = 17,
        map,
        qlUrl = 'http://wikimixer.kosmosnimki.ru/QuickLookImage.ashx',
        qlSize = { width: 300, height: 300 },
        srs = 3857}) {
        super();
        this._currentTab = '';
        this._qlUrl = qlUrl;
        this._qlSize = qlSize;
        this._attributes = attributes;
        this._attrTypes = attrTypes;
        this._sceneid_index = this._attributes.indexOf('sceneid') + 1;
        this._result_index = this._attributes.indexOf('result') + 1;
        this._clip_coords_index = this._attributes.indexOf('clip_coords') + 1;
        this._cart_index = this._attributes.indexOf('cart') + 1;
        this._selected_index = this._attributes.indexOf('selected') + 1;
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
            switch (this._currentTab) {
                case 'results':            
                    return filtered && properties[this._result_index];
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
            let {properties} = item;
            let color = Colors.Default;
            let lineWidth = 1;
            if (properties[this._hover_index]) {
                color = properties[this._cart_index] ? Colors.CartHilite : Colors.Hilite;
                lineWidth = 3;
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
                    event.initEvent('click', false, false);
                    event.detail = {id, show};
                    this.dispatchEvent(event);
                });
            }            
        })
        .on('mouseover', e => {
            let { gmx: {id, layer, target} } = e;
            let {properties} = this._vectors[id];
            if(properties) {
                properties[this._hover_index] = true;
                this._vectorLayer.redrawItem(id);
                let event = document.createEvent('Event');
                event.initEvent('mouseover', false, false);
                event.detail = id;
                this.dispatchEvent(event);
            }            
        })
        .on('mouseout', e => {
            let { gmx: {id, layer, target} } = e;
            let {properties} = this._vectors[id];
            if (properties) {
                properties[this._hover_index] = false;                
                this._vectorLayer.redrawItem(id);
                let event = document.createEvent('Event');
                event.initEvent('mouseout', false, false);
                event.detail = id;
                this.dispatchEvent(event);
            }                                             
        });
    }
    showQuicklook (id, show) {
        return new Promise (resolve => {
            let {properties,quicklook} = this._vectors[id];            
            if (show) {
                if (!quicklook) {
                    let imageUrl = `${this._qlUrl}?id=${split_complex_id(properties[this._sceneid_index]).id}&width=${this._qlSize.width}&height=${this._qlSize.height}`;
                    let clipCoords = properties[this._clip_coords_index];
                    const anchors = [
                        properties.slice(this._x1_index, this._x1_index + 2),
                        properties.slice(this._x1_index + 2, this._x1_index + 4),
                        properties.slice(this._x1_index + 4, this._x1_index + 6),
                        properties.slice(this._x1_index + 6, this._x1_index + 8)
                    ];
                    quicklook = L.imageTransform(imageUrl, flatten(anchors, true), { clip: clipCoords, disableSetClip: true }).addTo(this._map);
                    this._vectors[id].quicklook = quicklook;
                    quicklook.on('load', e => {
                        properties[this._visible_index] = 'visible';                                                  
                        this._vectorLayer.bringToTopItem(id);
                        resolve();                        
                    });
                    quicklook.on('error', e => {
                        properties[this._visible_index] = 'failed';
                        this._map.removeLayer(quicklook);    
                        this._vectors[id].quicklook = null;
                        resolve();
                    });
                    quicklook.addTo(this._map);
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
                    this._vectors[id].quicklook = null;
                    this._vectorLayer.bringToBottomItem(id);  
                }
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
        let vectors = values.reduce((a,item) => {
            let clipCoords = flatten(L.gmxUtil.geometryToGeoJSON(item[item.length - 1], true, true).coordinates, true);
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
                    if (k === 'visible') {
                        switch (typeof item[i]) {                            
                            case 'boolean':
                                b.push(item[i] ? 'visible' : 'hidden');
                                break;
                            default:
                            case 'string':
                                b.push(item[i]);
                                break;
                        }                        
                    }
                    else {
                        b.push(item[i]);                        
                    }
                } 
                return b;               
            }, []);
            value.unshift(item[idx]);            
            value.push(item[item.length - 1]);
            a.push(value);            
            return a;
        },[]);        
        this._vectors = this._mergeResults (this._vectors, vectors);
        this._vectorLayer.removeData();
        let items = serialize (this._vectors).map(({properties}) => properties);
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
            return properties[this._result_index] && properties[this._visible_index];
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
        return this._propertiesToItem(this._vectors[id].properties);
    }
    redraw () {
        this._vectorLayer.repaint();
    }
    redrawItem (id) {
        this._vectorLayer.redrawItem(id);
    }
    setHover (id, hover) {
        this._vectors[id].properties[this._hover_index] = hover;
        this.redrawItem(id);
    }
    setSelected (id, selected) {
        this._vectors[id].properties[this._selected_index] = selected;
        this.redrawItem(id);
    }
    setVisible (id, show) {
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

    addAllToCart() {        
        Object.keys(this._vectors).forEach(id => {
            let {properties} = this._vectors[id];
            if (properties[this._result_index]) {
                properties[this._cart_index] = true;
            }
        });
        this.redraw();
    }    
       
    addToCart(id) {
        let {properties} = this._vectors[id];
        if (properties) {
            properties[this._cart_index] = !properties[this._cart_index];
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
}

export { CompositeLayer, attributes, attrTypes };
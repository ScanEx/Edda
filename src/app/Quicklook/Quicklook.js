import { EventTarget } from 'lib/EventTarget/src/EventTarget.js';
import { flatten, split_complex_id } from 'app/Utils/Utils.js';

class Quicklook extends EventTarget {
    constructor ({map, data, url}) {
        super();
        this._map = map;
        this._data = data;
    	this._anchors = [
            [this._data.x1, this._data.y1],
            [this._data.x2, this._data.y2],
            [this._data.x3, this._data.y3],
            [this._data.x4, this._data.y4],
        ];
        this._url = url;
        this._shape = null;
    	this._image = null;
        this._stop = L.DomEvent.stopPropagation;   
    }
    _createLayer (geojson, style, pointToLayer) {        
        //var geojson = this.wktToGeoJSON(wkt);
        let shape = L.GeoJSON.geometryToLayer(geojson, pointToLayer);

        if (shape instanceof L.LayerGroup) {
            shape.eachLayer(function (layer) {
                if (style && typeof layer.setStyle == 'function') {
                    layer.setStyle(style);
                }
            });
        }
        else if (style && typeof shape.setStyle == 'function') {
            shape.setStyle(style);
        }

        return shape;
    }
    show() {
        if (!this.shapeVisible) {            
            switch (this._data.geoJSON.type.toUpperCase()) {
                case 'POLYGON':
                case 'MULTIPOLYGON':
                    this._shape = this._createLayer(this._data.geoJSON, {                         
                        fill: true,
                        weight: 1,
                        opacity: 1,
                        color: '#23a5cc',
                        fillOpacity: 0,
                    });
                    this._map.addLayer(this._shape);    
                    if (this._data.geoJSON.type != 'Point') {
                        L.DomEvent
                        .on(this._shape, 'click', this._stop)
                        .on(this._shape, 'mouseover', this._stop)
                        .on(this._shape, 'mouseout', this._stop)
                        .on(this._shape, 'click', L.DomEvent.preventDefault);

                        this._shape.on('click', e => {
                            if (this.imageVisible) {
                                this.hideImage();
                                this.bringToBack();
                            }
                            else {
                                this.showImage();                                
                            }   

                            let event = document.createEvent('Event');
                            event.initEvent('click', false, false);
                            event.detail = {data: this._data, imageVisible: this.imageVisible, originalEvent: e};
                            this.dispatchEvent(event);

                            this._map.fire('click', e);

                        }, this)
                        .on('mouseover', e => {
                        
                            let event = document.createEvent('Event');
                            event.initEvent('mouseover', false, false);
                            event.detail = {originalEvent: e, data: this._data, target: this};
                            this.dispatchEvent(event);

                        }, this)
                        .on('mouseout', e => {

                            let event = document.createEvent('Event');
                            event.initEvent('mouseout', false, false);
                            event.detail = {originalEvent: e, data: this._data, target: this};
                            this.dispatchEvent(event);

                        }, this);
                    }                                  
                    this._shape.bringToFront();
                    break;
                default:
                    console.log('Attempt to create a quicklook from a prohibited geometry:', g);                    
                    break;
            }              
        }
    }
    setStyle (style) {
        if (this.shapeVisible) {
            this._shape.setStyle(style);
        }
    }
    hide() {
        this.hideImage();
        if (this.shapeVisible) {
            this._shape.removeEventListener();
            this._map.removeLayer(this._shape);
        }        
        this._shape = null;
    }
    showImage () {
        if (!this.imageVisible) {
            if (!this.shapeVisible) {
                this.show();
            }
            let imageUrl = `${this._url}?id=${split_complex_id(this._data.sceneid).id}&width=1024&height=1024`;
            let clipCoords = flatten(this._shape.toGeoJSON().geometry.coordinates, true);
            this._image = L.imageTransform(imageUrl, flatten(this._anchors, true), { clip: clipCoords, disableSetClip: true }).addTo(this._map);            
        }
    }
    hideImage () {
        if (this.imageVisible) {            
            this._map.removeLayer(this._image);
            this._image = null;
        }
    }
    get data () {
        return this._data;
    }
    get imageVisible () {
        return this._image != null;
    }
    get shapeVisible () {
        return this._shape != null;
    }
    bringToBack () {
        if (this.shapeVisible) {
            this._shape.bringToBack();
        }
        if (this.imageVisible) {
            this._image.bringToBack();
        }
    }    
    bringToFront () {
        if (this.imageVisible) {
            this._image.bringToFront();
        }
    }
    get anchors () {
        return {
            type: 'Polygon',
            coordinates: [this._anchors.concat([this._anchors[0]])]
        }
    }    
    get bounds () {
        return L.GeoJSON.coordsToLatLngs(flatten(this._anchors));
    }
}

export { Quicklook };
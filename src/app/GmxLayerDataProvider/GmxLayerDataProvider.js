import EventTarget from 'scanex-event-target';

class GmxLayerDataProvider extends EventTarget {
    constructor ({gmxResourceServer, map}) {
        super();
        this.showSuggestion = false;
        this.showOnMap = false;
        this.showOnSelect = false;
        this.showOnEnter = true;
        this._rsGmx = gmxResourceServer;
        this._map = map;        
    }
    _toGeoJSON (fields, values) {
        return fields.reduce((a, k, i) => {
            if (k === 'geomixergeojson') {
                var geojson = L.gmxUtil.geometryToGeoJSON(values[i], true);
                a.geometry = geojson;
            }
            else {
                a.properties = a.properties || {};
                a.properties[k] = values[i];
            }
            return a;
        }, {type: 'Feature'});
    }
    fetch (value) {
        return new Promise(resolve => resolve([]));
    }
    find (value, limit, strong, retrieveGeometry) {
        var query = value.split(/[\s,]+/).map(x => "(sceneid = '" + x + "')").join(' OR ');
        return new Promise((resolve, reject) => {
            var rq = {
                layer: 'AFB4D363768E4C5FAC71C9B0C6F7B2F4',
                geometry: true,
                pagesize: 0,
                query: query,
                out_cs: 'EPSG:3857',
            };
            this._rsGmx.sendPostRequest('VectorLayer/Search.ashx', rq)
                .then(response => {
                    if (response.Status == 'ok') {
                        var rs = response.Result.values.map(values => {
                            return {
                                feature: this._toGeoJSON(response.Result.fields, values),
                                provider: this,
                                query: value,
                            };
                        });
                        resolve(rs);

                        let event = document.createEvent('Event');
                        event.initEvent('fetch', false, false);
                        event.detail = response.Result;
                        this.dispatchEvent(event);
                    }
                    else {
                        reject(response.Result);
                    }
                })
                .catch(err => {
                    console.log(err);
                    reject(err);
                });
        });
    }
}

export default GmxLayerDataProvider;
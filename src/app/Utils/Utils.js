function chain (tasks, state) {        
    return tasks.reduce(
        (prev, next) => prev.then(next),
        new Promise ((resolve, reject) => resolve (state))
    );
}

function create_container () {
    let container = document.createElement('div');
    document.body.appendChild(container);
    return container;
}

function _f (arr, acc, swap) {
    if (arr.length) {
        let r = [];
        for (let i = 0, len = arr.length; i < len; i++) {
            let a = arr[i];
            if (_f(a, acc, swap)) {
                if (swap) {
                    r.unshift(a);
                }
                else {
                    r.push(a);
                }
            }
        }
        if (r.length) {
            acc.push(r);
        }
        return false;
    }
    else {
        return true;
    }
}

function flatten (arr, swap) {
    let acc = [];
    _f(arr, acc, swap);
    return acc;
}

function split_complex_id (complexId) {
    let separatorIndex = complexId.lastIndexOf('!');
    return separatorIndex > 0
        ? { id: complexId.substring(0, separatorIndex),
            productId: complexId.substring(separatorIndex + 1, complexId.length)
        }
        : { id: complexId };
}

function build_complex_id (id, productId) {
    return productId ? id + '!' + productId : id;
}

function hex (number, width = 6) {
    let h = number.toString(16);
    while (h.length < width) {
        h = '0' + h;
    }
    return h.toUpperCase();
}

function unhex (str) {
    return parseInt(str.substr(1), 16);
}

function is_geometry(obj) {
    let {type} = obj;
    switch (type) {
        case 'Point':
        case 'MultiPoint':
        case 'LineString':
        case 'MultiLineString':
        case 'Polygon':
        case 'MultiPolygon':
        case 'GeometryCollection':
            return true;
        default:
            return false;
    }    
}

function normalize_geometry_type (geometry) {
    let {type} = geometry;
    switch (type.toUpperCase()) {
        case 'POINT':
            geometry.type = 'Point';
            break;
        case 'MULTIPOINT':
            geometry.type = 'MultiPoint';
            break;
        case 'LINESTRING':
            geometry.type = 'LineString';
            break;
        case 'MULTILINESTRING':
            geometry.type = 'MultiLineString';
            break;
        case 'POLYGON':
            geometry.type = 'Polygon';
            break;
        case 'MULTIPOLYGON':
            geometry.type = 'MultiPolygon';
            break;
        case 'GEOMETRYCOLLECTION':
            geometry.type = 'GeometryCollection';
            break;
        default:
            break;
    }  
    return geometry;  
}

function is_geojson_feature (obj) {
    let {type, geometry, properties} = obj;
    if(type !== 'Feature') {
        console.log('geojson feature test failed: provided type is not a "Feature" object', obj);
        return false;
    }
    if(!is_geometry(geometry)) {
        console.log('geojson feature test failed: geometry is of wrong type', geometry);
        return false;
    }
    return true;
}

function get_type_of_value (value) {
    switch(typeof value) {
        case 'number':                                
            return Number.isInteger(value) ? 'Integer' : 'Float';
        case 'boolean':                        
            return 'Boolean';
        case 'string':
        default:
            return 'String';
    }
}

function convert_date (item, fields) {
    for (let k in fields) {
        let field = fields[k];
        if (field.type === 'date') {
            item[k] = new Date(item[k]);
        }
    }
    return item;
}

function from_gmx ({fields, values, types}, convertMercator = true) {
    return values.map(x => {
        let item = fields.reduce((a, k, i) => {
            switch(types[i]){
                default:                    
                    a[k] = x[i];
                    break;                   
                case 'date':
                    switch (typeof x[i]) {
                        case 'string':
                            a[k] = new Date(x[i]);
                            break;
                        case 'number':
                            a[k] = new Date(x[i] * 1000);
                            break;
                        default:
                            break;
                    }                    
                    break;
                case 'time':
                    break;
                case 'geometry':
                    a[k] = L.gmxUtil.geometryToGeoJSON(x[i], convertMercator);
                    break;
            }
            switch (k) {
                case 'stereo':
                    const s = x[i];
                    a.stereo = typeof s === 'string' && s !== 'NONE';
                    break;                    
                default:
                    break;
            }
            return a;                    
        }, {});
        if (item.geomixergeojson) {
            item.geoJSON = item.geomixergeojson;
            delete item.geomixergeojson;
        }        
        item.url = `http://search.kosmosnimki.ru/QuickLookImage.ashx?id=${item.sceneid}`;
        return item;
    });    
}

function normalize_geometries (lng, objects) {
    for (var i = 0, len = objects.length; i < len; i++) {
        normalize_geometry(lng, objects[i].geometry);
        fix_anchors(lng, objects[i]);
    }
}

function normalize_ring (lng, coordinates) {
    for (var i = 0; i < coordinates.length; ++i) {
        var d = get_correction(lng, coordinates[i][0]);
        if (d) {
            coordinates[i][0] += d;
        }
    }
}

function normalize_polygon (lng, coordinates) {
    for (var i = 0; i < coordinates.length; ++i) {
        normalize_ring(lng, coordinates[i]);				
    }
}

function normalize_geometry (lng, geometry) {
    switch (geometry.type) {
        case 'Polygon':
            normalize_polygon(lng, geometry.coordinates);
            break;
        case 'MultiPolygon':
            for (var i = 0; i < geometry.coordinates.length; ++i) {
                normalize_polygon(lng, geometry.coordinates[i]);
            }
            break;
        default:
            break;
    }
}

function fix_anchors (lng, object) {
    for (var i = 0; i <= 4; ++i) {
        var d = get_correction(lng, object['x' + i]);
        if (d) {
            object['x' + i] += d;
        }
    }
}

function get_correction (lon, x) {
    var d1 = Math.abs(lon - x),
        d2 = Math.abs(lon - (x + 360));
    if (d1 <= d2) {
        return 0;
    }
    else {
        return 360;
    }
}

function get_bbox (geometry) {
    let {type, coordinates} = geometry;
    let lon = 0, lat = 0;
    let sorter = (a,b)=> {
        if (a > b) {
            return 1;
        }
        if (a < b) {
            return -1;
        }            
        return 0;
    };
    let rings = coords => {
        let {xs, ys} = coords.reduce((a, [x, y]) => {        
            a.xs.push (x);
            a.ys.push (y);
            return a;
        }, {xs:[],ys:[]});        
        xs = xs.sort(sorter);
        ys = ys.sort(sorter);
        let xmin = xs[0];
        let xmax = xs[xs.length - 1];
        let ymin = ys[0];
        let ymax = ys[ys.length - 1];
        return [[xmin,ymax],[xmax,ymax],[xmax,ymin],[xmin,ymin]];
    };
    switch (type.toUpperCase()) {
        case 'POINT':
            [lon, lat] = coordinates;
            return [[lon,lat],[lon,lat],[lon,lat],[lon,lat]];
        case 'MULTIPOINT':
        case 'LINESTRING':
            return rings (coordinates);
        case 'POLYGON':
            return rings (coordinates[0]);
        case 'MULTILINESTRING':
        case 'MULTIPOLYGON':
            let {xs, ys} = coordinates.reduce ((a, coords) => {
                let [[x1,y1],[x2,y2],[x3,y3],[x4,y4]] = rings (coords[0]);
                a.xs.push (x1);
                a.xs.push (x2);
                a.xs.push (x3);
                a.xs.push (x4);
                a.ys.push (y1);
                a.ys.push (y2);
                a.ys.push (y3);
                a.ys.push (y4);
                return a;
            }, {xs: [], ys: []});
            xs = xs.sort(sorter);
            ys = ys.sort(sorter);
            let xmin = xs[0];
            let xmax = xs[xs.length - 1];
            let ymin = ys[0];
            let ymax = ys[ys.length - 1];
            return [[xmin,ymax],[xmax,ymax],[xmax,ymin],[xmin,ymin]];                        
        default:
            break;
    }
}

export { chain, create_container, flatten, split_complex_id, unhex, hex, is_geojson_feature, is_geometry, get_type_of_value, from_gmx, normalize_geometries, normalize_geometry, get_bbox, normalize_geometry_type };
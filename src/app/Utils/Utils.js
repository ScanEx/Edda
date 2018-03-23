import { isNumber } from "util";

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

function normalize_point (lng, [x,y]) {
    return [make_close_to(lng, x),y];
}

function normalize_ring (lng, coordinates) {
    return coordinates.map(normalize_point.bind(null, lng));
}

function normalize_polygon (lng, coordinates) {        
    if (isNumber (lng)) {
        return coordinates.map(normalize_ring.bind(null, lng));
    }
    else {
        return coordinates.map(normalize_ring.bind(null, get_ref_lon(coordinates)));
    }
}

function get_ref_lon (coordinates) {        
    let f = flatten (coordinates);
    let pos = f.filter(([x,y]) => x >= 0);
    let [x,y] = pos.length > 0 ? pos[0] : f[0];        
    return x;    
}

function normalize_geometry (geometry, lng) {
    let {type, coordinates} = geometry;
    const x = isNumber(lng) ? lng : get_ref_lon(coordinates);
    switch (type.toUpperCase()) {
        case 'POLYGON':
            return {type, coordinates: normalize_polygon(x, coordinates)};
        case 'MULTIPOLYGON':
            return {type, coordinates: coordinates.map(normalize_polygon.bind(null, x))};
        default:
            return geometry;
    }
}

function wrap_point ([x,y]) {
    let lon = x;
    while (lon < -180) {
        lon += 360;
    }
    while (lon > 180) {
        lon -= 360;
    }
    return [lon,y];
}

function wrap_ring (coordinates) {
    return coordinates.map(wrap_point);
}

function wrap_polygon (coordinates) {
    return coordinates.map(wrap_ring);
}

function wrap_geometry (geometry) {
    let {type, coordinates} = geometry;
    switch (type.toUpperCase()) {
        case 'POLYGON':
            return {type, coordinates: wrap_polygon(coordinates)};
        case 'MULTIPOLYGON':
            return {type, coordinates: coordinates.map(wrap_polygon)};
        default:
            return geometry;
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
            return null;
    }
}

const EAST_HEMISPHERE = L.bounds(
    L.point(0, -90), 
    L.point(180, 90)
);

const WEST_HEMISPHERE = L.bounds(
    L.point(180, -90),
    L.point(360, 90)
);

const WEST_HEMISPHERE2 = L.bounds(
    L.point(-180, -90),
    L.point(0, 90)
);

function split180 (geometry) {
    const {type, coordinates} = geometry;
    let split_coords = (points, hemisphere) => {        
        let coords = L.PolyUtil.clipPolygon(points, hemisphere).map(({x,y}) => [x,y]);
        if (coords.length > 0) {
            let start_point = coords[0];
            let end_point = coords[coords.length - 1];
            if (start_point[0] != end_point[0] || start_point[1] != end_point[1]) {
                coords.push(start_point);
            }
        }
        return coords;
    };    
    let geometries = [];
    switch(type.toUpperCase()) {
        case 'POLYGON':
            const points = coordinates[0].map(([x,y]) => L.point(x,y));
            let c1 =  split_coords(points, EAST_HEMISPHERE);
            if (c1.length > 0) {
                geometries.push(normalize_geometry ({type, coordinates: [c1]}, 179));
            }            
            let c2 = split_coords(points, WEST_HEMISPHERE);
            if (c2.length > 0) {
                geometries.push(normalize_geometry ({type, coordinates: [c2]}, -179));
            }
            else {
                c2 = split_coords(points, WEST_HEMISPHERE2);
                if (c2.length > 0) {
                    geometries.push(normalize_geometry ({type, coordinates: [c2]}, -179));
                }
            }
            break;
        case 'LINESTRING':            
        default:
            geometries.push(geometry);
            break;
    }
    return geometries;
}

function make_close_to (lng, x) {
    let dist = (a,b) => Math.abs (a - b);
    let {p} = [x - 360, x, x + 360]
    .map(p => {
        return {p, d: dist (lng, p)};
    })
    .reduce((a,{p,d}) => {
        if (a === null || d < a.d) {
            a = {d, p};
        }
        return a;
    }, null);
    return p;
}

export {
    chain, create_container, flatten, split_complex_id, unhex, hex, is_geojson_feature, is_geometry,
    get_type_of_value, from_gmx, get_bbox, normalize_geometry_type,
    normalize_geometry, normalize_polygon, normalize_ring, normalize_point, split180, make_close_to
};
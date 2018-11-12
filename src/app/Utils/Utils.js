const isNumber = n => !isNaN (new Number(n));

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
        item.url = `//search.kosmosnimki.ru/QuickLookImage.ashx?id=${item.sceneid}`;
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
        case 'MULTILINESTRING':
            return rings (coordinates[0]);        
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

function get_window_center () {
    let {left, top, width, height} = document.body.getBoundingClientRect();
    return {left: left + Math.round (width / 2), top: top + Math.round(height / 2)};
}

function read_permalink (id) {
    return new Promise((resolve, reject) => {        
        if (window.Catalog.gmxResourceServer) {

            window.Catalog.gmxResourceServer.sendGetRequest('TinyReference/Get.ashx', { id: id })
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
        }
        else {
            reject("Geomixer resource server not defined.");
        }        
    });
}

function is_mobile () {
    var check = false;
    (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
    return check;
}

function get_difference_between_dates(startDate, endDate) {

    const startYear = startDate.getFullYear();
    const startMonth = startDate.getMonth();
    const startDay = startDate.getDate();

    const endYear = endDate.getFullYear();
    const endMonth = endDate.getMonth();
    const endDay = endDate.getDate();

    const startMomentDate = moment([startYear, startMonth, startDay]);
    const endMomentDate = moment([endYear, endMonth, endDay]);

    const monthDiff = startMomentDate.diff(endMomentDate, 'months');
    const absMonthDiff = Math.abs(monthDiff);

    if (absMonthDiff > 0) {
        return `${absMonthDiff} мес`;
    }

    const dayDiff = startMomentDate.diff(endMomentDate, 'days');
    const absDayDiff = Math.abs(dayDiff);

    return `${absDayDiff} дн`;
}

export {
    chain, create_container, flatten, split_complex_id, unhex, hex, is_geojson_feature, is_geometry,
    get_type_of_value, from_gmx, get_bbox, normalize_geometry_type,
    normalize_geometry, normalize_polygon, normalize_ring, normalize_point, split180, make_close_to,
    get_window_center, read_permalink, is_mobile, get_difference_between_dates
};
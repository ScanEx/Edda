function sti (period, lon, lat) {
    return 65536 * period + 256 * Math.round(256 * (90 - lat) / 180) + Math.round(256 * (lon + 180) / 360);
}

function step  (lat) {
    return lat < 50 ? 1 : (50 <= lat && lat <= 70 ? 2 : 3);
}

function tile_range (period, [[x1, y1], [x2, y2], [x3, y3], [x4, y4]]) {        
    
    let nw = sti (period, x1, y1) - (step (Math.abs(y1)) + 512);
    let ne = sti (period, x2, y2) + (step (Math.abs(y2)) - 512);
    let se = sti (period, x3, y3) + (step (Math.abs(y3)) + 512);
    let sw = sti (period, x4, y4) - (step (Math.abs(y4)) - 512);

    let rng = [];    
    for (let lo = nw, hi = ne; hi <= se; lo += 256, hi += 256) {
        let k = lo;
        while (k <= hi) {
            rng.push(k++);
        }        
    }
    return rng;
}

function get_months (date) {
    return (date.getFullYear() - 1970) * 12 + date.getMonth() + 1;
}

function get_quarters (date) {
    return (date.getFullYear() - 1970) * 4 + Math.ceil ((date.getMonth() + 1) / 3);
}

function st_range (start, end, boxes) {            
    let rng = [];
    let lo = get_quarters (start);
    let hi = get_quarters (end);
    for (let i = lo; i <= hi; i++) {
        boxes.forEach (box => {
            tile_range (i, box).forEach (n => rng.push(n));
        });        
    }
    return rng;
}

function to_query (range) {    
    return `${range.length > 0 ? `stidx IN (${range.join(',')})` : '' }`;
}

export {st_range, to_query};
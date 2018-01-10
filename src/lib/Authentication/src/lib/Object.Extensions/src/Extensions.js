function copy (source) {
    switch(typeof source) {
        case 'number':
        case 'string':
        case 'function':
        default:
            return source;
        case 'object':
            if (source === null) {
                return null;
            }
            else if (Array.isArray(source)) {
                return source.map (item => copy (item));
            }
            else if (source instanceof Date) {
                return source;
            }
            else {                
                return Object.keys(source).reduce((a, k) => {                    
                    a[k] = copy(source[k]);
                    return a;
                }, {});
            }
    }
}

function extend (target, source) {
    if (target === source) {
	    return target;
    }
    else {
        return Object.keys(source).reduce((a, k) => {
            let value = source[k];
            if(typeof a[k] === 'object' && (k in a)){
                a[k] = extend (a[k], value);
            }
            else {
               a[k] = copy(value);
            }
            return a;
        }, copy (target));
    }    
}


export {copy, extend};
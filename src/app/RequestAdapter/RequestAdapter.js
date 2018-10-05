import { st_range, to_query } from '../../app/Utils/Index.js';
import { get_bbox } from '../../app/Utils/Utils.js';

class RequestAdapter {
    constructor({layer, gmxResourceServer, authorized}){
        this._layer = layer;
        this._gmxResourceServer = gmxResourceServer;
        this._geometries = [];
        this._authorized = authorized;
    }
    set criteria (value) {
        this._criteria = value;
    }
    get criteria () {
        return this._criteria;
    }
    get satellites () {        
        let {satellites, archive} = this._criteria;
        let serialize = s => Object.keys(s).reduce((a,k) => a.concat(s[k]), []);
        let ss = serialize(satellites.ms).concat(serialize(satellites.pc));
        return `(${ss.filter(x => x.checked).map(x => `(${x.condition(archive, this._authorized)})`).join(' OR ')})`;
    }
    get geometries () {
        return this._geometries;
    }
    set geometries (value) {
        this._geometries = value;
    }
    get geometry () {        
        return {
            type: 'GeometryCollection',
            geometries: this._geometries,
        };
    }
    get hasGeometry() {
        return Array.isArray (this._geometries) && this._geometries.length > 0;
    }
    _formatDate (date) {                
        return moment(date).format('YYYY-MM-DD') ;
    }
    get date () {
        let {date, annually} = this._criteria;
        let [dateStart, dateEnd] = date;
        if (annually) {
            let dcr = [];
            let startMonth = dateStart.getMonth();
            let startDay = dateStart.getDate();
            let endMonth = dateEnd.getMonth();
            let endDay = dateEnd.getDate();
            let endYear = dateEnd.getFullYear();
            if (startMonth > endMonth) {
                --endYear;
            }
            for (let year = dateStart.getFullYear(); year <= endYear; year++) {
                let start = new Date(year, startMonth, startDay);
                let end = new Date(startMonth > endMonth ? year + 1 : year, endMonth, endDay);
                dcr.push(`(acqdate >= '${this._formatDate(start)}' AND acqdate <= '${this._formatDate(end)}')`);
            }
            return `(${dcr.join(' OR ')})`;
        }
        else {
            return `(acqdate >= '${this._formatDate (dateStart)}' AND acqdate <= '${this._formatDate(dateEnd)}')`;
        }
    }
    get clouds () {
        let { clouds } = this._criteria;
        let [min, max] = clouds;
        return `(cloudness IS NULL OR cloudness < 0 OR (cloudness >= ${min.toFixed(1)} AND cloudness <= ${max.toFixed(1)}))`;
    }
    get angle() {
        let { angle } = this._criteria;
        let [min, max] = angle;
        return `(tilt IS NULL OR tilt < 0 OR (tilt >= ${min.toFixed(1)} AND tilt <= ${max.toFixed(1)}))`;
    }
    get stereo () {
        let { stereo } = this._criteria;
        return stereo ? "NOT (stereo IS NULL OR stereo = 'NONE')" : '';
    }
    get spatial () {        
        return `Intersects([geomixergeojson], buffer(GeometryFromGeoJson('${JSON.stringify(this.geometry)}', 4326), 0.001))`
    }
    get archive () {
        let { archive } = this._criteria;
        switch(archive){ 
            case 'global':
                return 'islocal = FALSE';
            case 'local':
                return 'islocal = TRUE';
            default:
            case 'all':
                return '';
        }
    }
    get st_index () {
        let {date: [start, end], annually} = this._criteria;
        let boxes = this.geometries.reduce ((a, g) => {
            a.push (get_bbox (g));
            return a;
        }, []);    
        return to_query (st_range (start, end, boxes));
    }
    get query() {        
        return [
            this.st_index,
            this.spatial,     
            this.date,
            this.clouds,            
            this.angle,
            this.stereo,
            this.satellites,                   
        ]
        .filter(x => x.trim() !== '')
        .join(' AND ');
    }
    get request () {
        return {
            layer: this._layer,
            orderby: 'acqdate',
            orderdirection: 'desc',
            geometry: true,
            page: 0,
            pagesize: 0,
            count: false,
            out_cs: 'EPSG:3857',
            query: this.query,
        };
    }
    search(limit = 0){
        return new Promise((resolve, reject) => {
            let rq = this.request;
            rq.pagesize = limit;
            this._gmxResourceServer.sendPostRequest('VectorLayer/Search.ashx', rq)
            .then(response => {                 
                if(response.Status === 'ok'){
                    resolve(response.Result);
                }
                else {
                    reject(response);
                }
            })
            .catch(e => {
                const {ErrorInfo: {ErrorMessage = ''}} = e;
                const exceptError = new Error(ErrorMessage);
                reject(exceptError);
            });
        });
    }
}

export default RequestAdapter;
import Translations from 'scanex-translations';

const T = Translations;

T.addText('rus', {
    operator: {
        dg: 'Digital Globe, США',
        airbus: 'Airbus Defence & Space, Франция',
        siis: 'SI Imaging Services (SIIS), Южная Корея',
        ge: 'GeoEye, США',
        iinv: 'ImageSat International, N.V., Израиль',
        spaceview: 'Beijing Space View Technology Co., Ltd (Space View), КНР',
        vniiem: 'ФГУП "НПП ВНИИЭМ", Беларусь',
        blackbridge: 'BlackBridge AG, ФРГ',
        usgs: 'United States Geological Survey, США',
        roskosmos: 'Роскосмос',
        twentyfirst: 'Twenty First Century AT, China'
    }
});

T.addText('eng', {
    operator: {
        dg: 'Digital Globe, USA',
        airbus: 'Airbus Defence & Space, France',
        siis: 'SI Imaging Services (SIIS), South Korea',
        ge: 'GeoEye, USA',
        iinv: 'ImageSat International, N.V., Israel',
        spaceview: 'Beijing Space View Technology Co., Ltd (Space View), China',
        vniiem: 'ФГУП "НПП ВНИИЭМ", Belarus',
        blackbridge: 'BlackBridge AG, Germany',
        usgs: 'United States Geological Survey, USA',
        roskosmos: 'Roskosmos',
        twentyfirst: 'Twenty First Century AT, China'
    }
});

class Satellite {
    constructor({id, platforms, name, resolution, swath, operator, since, ms = true, arity = 1, restricted = false, checked = false, endingDate = null}) {
        this._id = id;
        this._platforms = platforms;
        this._name = name;
        this._resolution = resolution;
        this._swath = swath;
        this._operator = operator;
        this._since = since;
        this._arity = arity;
        this._ms = ms;
        this._restricted = restricted;
        this._checked = checked;
        this._endingDate = endingDate;
    }
    get id() {
        return this._id;
    }
    get platforms() {
        return this._platforms;
    }
    get name() {
        return this._name;
    }
    get resolution() {
        return this._resolution;
    }
    get swath() {
        return this._swath;
    }
    get operator() {
        return this._operator;
    }
    get since() {
        return this._since;
    }
    get arity(){
        return this._arity;
    }
    get ms() {
        return this._ms;
    }
    get restricted() {
        return this._restricted;
    }
    get checked() {
        return this._checked;
    }
    get endingDate() {
        return this._endingDate;
    }
    set checked(value) {
        this._checked = value;
    }
    set endingDate(value) {
        this._endingDate = value;
    }
    islocal (archive) {
        switch(archive){ 
            case 'global':
                return ' AND islocal = FALSE';
            case 'local':
                return ' AND islocal = TRUE';
            default:
            case 'all':
                return '';
        }
    }
    condition (archive) {        
        return `platform IN (${this.platforms.map(x => `'${x}'`).join(',')})${this.islocal(archive)}`;
    }
}

class DG extends Satellite{
    constructor ({id, platforms, name, resolution, swath, since, ms, endingDate}){
        super({id, platforms, name, resolution, swath, operator: T.getText('operator.dg'), since, ms, endingDate});
    }
}

class KOMPSAT extends Satellite {
    constructor ({id, platforms, name, resolution, swath, since}){
        super({id, platforms, name, resolution, swath, operator: T.getText('operator.siis'), since});
    }
}

class SpaceView extends Satellite {
    constructor({id, platforms, name, resolution, swath, arity, since}){
        super({id, platforms, name, resolution, swath, operator: T.getText('operator.spaceview'), arity, since, restricted: true});
    }
}

class GF1 extends SpaceView {
    constructor({id, platforms, name, resolution, swath, since, sensor}){
        super({id, platforms, name, resolution, swath, since});
        this._sensor = sensor;
    }
    get sensor() {
        return this._sensor;
    }
    condition (archive) {
        return `${super.condition(archive)} AND sensor = '${this.sensor}'`;
    }
}

class SV1 extends SpaceView {
    constructor(){
        super({id: 'SV1', platforms: ['GJ1A', 'GJ1B', 'GJ1C', 'GJ1D'], name: 'Superview-1', resolution: 0.5, swath: 12, arity: 4, since: '26.12.2016, 09.01.2018'});
    }    
}

class Airbus extends Satellite {
    constructor({id, platforms, name, resolution, swath, since, arity, ms, endingDate}){
        super({id, platforms, name, resolution, swath, operator: T.getText('operator.airbus'), since, arity, ms, endingDate});
    }
}

class PHR extends Airbus{
    constructor(){
        super({id: 'PHR', platforms: ['PHR1A','PHR1B','1A_PM','1B_PM','PHR-1A','PHR-1B'], name: 'Pleiades A-B', resolution: 0.5, swath: 20, since: '2011, 2012', arity: 2});
    }
    condition (archive) {
        switch (archive) {
            case 'all':
                return "platform IN ('PHR1A','PHR1B','1A_PM','1B_PM','PHR-1A','PHR-1B')";
            case 'local':
                return "platform IN ('1A_PM','1B_PM','PHR-1A','PHR-1B')";
            case 'global':
            default:
                return super.condition(archive);
        }
    }
}

class PLD_1A extends Airbus{
    constructor(){
        super({id: '1A_PHR', platforms: ['1A-PHR-1A','1A-PHR-1B'], name: '1ATLAS (PLD)', resolution: 0.5, swath: 20, since: '2011, 2012', arity: 2});
    }
    get restricted () {
        return true;
    }
    condition (archive) {
        return "platform IN ('1A-PHR-1A','1A-PHR-1B')";
    }
    
}

class SP5_10MS extends Airbus {
    constructor(){
        super({id: 'SP5_10MS', platforms: ['SPOT 5'], name: 'SPOT 5 (10m)', resolution: 10, swath: 20, since: '2002 - 2015', endingDate: '2015'});
    }
    condition (archive, authorized) {
        return `platform = 'SPOT 5' AND sensor = 'J'${authorized ? this.islocal(archive) : ''}`;
    }
}

class SP5_5MS extends Airbus{
    constructor(){
        super({id: 'SP5_5MS', platforms: ['SPOT 5'], name: 'SPOT 5 (5m)', resolution: 5, swath: 20, since: '2002 - 2015'});
    }
    condition (archive, authorized) {
        return `platform = 'SPOT 5' AND (sensor = 'J' AND (spot5_a_exists = TRUE OR spot5_b_exists = TRUE))${authorized ? this.islocal(archive) : ''}`;
    }
}

class SP5_5PC extends SP5_5MS{
    constructor(){
        super();
        this._id = 'SP5_5PC';
        this._ms = false;
    }
    condition (archive, authorized) {
        return `platform = 'SPOT 5' AND (sensor = 'A' OR sensor = 'B' AND spot5_b_exists = FALSE)${authorized ? this.islocal(archive) : ''}`;
    }
}

class SP5_2MS extends Airbus{
    constructor(){
        super({id: 'SP5_2MS', platforms: ['SPOT 5'], name: 'SPOT 5 (2.5m)', resolution: 2.5, swath: 20, since: '2002 - 2015'});
    }
    condition (archive, authorized) {
        return `platform = 'SPOT 5' AND sensor = 'J' AND spot5_a_exists = TRUE AND spot5_b_exists = TRUE${authorized ? this.islocal(archive) : ''}`;
    }
}

class SP5_2PC extends SP5_2MS{
    constructor(){
        super();
        this._id = 'SP5_2PC';
        this._ms = false;
    }
    condition (archive, authorized) {
        return `platform = 'SPOT 5' AND sensor = 'A' AND spot5_b_exists = TRUE${authorized ? this.islocal(archive) : ''}`;
    }
}

class SP6_7 extends Airbus {
    constructor(){
        super({id: 'SP6_7', platforms: ['SPOT6','SPOT 6','SPOT7','SPOT 7'],  name: 'SPOT 6-7', resolution: 1.5, swath: 60, since: '2012, 2014', arity: 2});
    }
    condition(archive, authorized) {
        return `platform IN ('SPOT6','SPOT 6','SPOT7','SPOT 7')${authorized ? this.islocal(archive) : ''}`;
    }
}

class SP6_7_1A extends Airbus {
    constructor(){
        super({id: '1A_SP6_7', platforms: ['1A-SPOT-6','1A-SPOT-7'],  name: '1ATLAS (SP)', resolution: 1.5, swath: 60, since: '2012, 2014', arity: 2});
    }
    get restricted () {
        return true;
    }
    condition(archive, authorized) {
        return "platform IN ('1A-SPOT-6','1A-SPOT-7')";
    }
}

class SP67_P extends Airbus {
    constructor(){
        super({id: 'SP67_P', platforms: ['SPOT-6','SPOT-7'],  name: 'SPOT-6/7-P', resolution: 1.5, swath: 60, since: '2012, 2014', arity: 2});
    }
    get restricted () {
        return true;
    }
    condition(archive, authorized) {
        return "platform IN ('SPOT-6','SPOT-7') AND product = TRUE";
    }
}

class EROS extends Satellite {
    constructor({id, platforms, name, resolution, swath, since }){
        super({id,  platforms, name, resolution, swath, operator: T.getText('operator.iinv'), restricted: true, since, ms: false });
    }
}

class RP extends Satellite {
    constructor ({id, platforms, name, ms}) {
        super ({id, platforms, name, resolution: 1, swath: 38, operator: T.getText('operator.roskosmos'), arity: 3, since: '2013, 2014, 2016', ms });
        
    }
    condition (archive) {
        return `${super.condition(archive)} AND sensor = 'СППИ "Сангур-1У"'`;
    }
}

class RP_PC extends RP {
    constructor() {
        super ({id: 'RP_PC', platforms: ['Ресурс-П1','Ресурс-П2','Ресурс-П3'], name: 'Ресурс-П', ms: false, });
    }
    condition (archive) {
        return `${super.condition(archive)} AND spot5_a_exists = TRUE AND spot5_b_exists = FALSE`;
    }
}

class RP_1MS extends RP {
    constructor() {
        super ({id: 'RP_1MS', platforms: ['Ресурс-П1','Ресурс-П2','Ресурс-П3'], name: 'Ресурс-П (1м)', resolution: 1, ms: true, });
    }
    condition (archive) {
        return `${super.condition(archive)} AND spot5_a_exists = TRUE AND spot5_b_exists = TRUE`;
    }
}

class RP_4MS extends RP {
    constructor() {
        super ({id: 'RP_4MS', platforms: ['Ресурс-П1','Ресурс-П2','Ресурс-П3'], name: 'Ресурс-П (4м)', resolution: 4, ms: true, });
    }
    condition (archive) {
        return `${super.condition(archive)} AND spot5_b_exists = TRUE`;
    }
}

class Triplesat extends Satellite {
    constructor () {
        super({
            id: '21AT',
            platforms: ['TripleSat Constellation-1','TripleSat Constellation-2','TripleSat Constellation-3'],
            name: 'TripleSat',
            resolution: 1,
            swath: 23,
            arity: 3,
            operator: T.getText('operator.twentyfirst'),
            since: '2015',
            ms: true,
            restricted: true,
        });
    }    
}

const satellites = {
    ms: [
        new DG({id: 'WV04', platforms: ['WV04'], name: 'WorldView 4', resolution: 0.3, swath: 13.2, since: '2016'}),
        new DG({id: 'WV03', platforms: ['WV03'], name: 'WorldView 3', resolution: 0.3, swath: 13.1, since: '2014'}),
        new DG({id: 'WV02', platforms: ['WV02'], name: 'WorldView 2', resolution: 0.4, swath: 16.4, since: '2009'}),        
        new DG({id: 'GE01', platforms: ['GE01'], name: 'GeoEye-1', resolution: 0.4, swath: 15.2, since: '2008'}),
        new PHR(),
        new DG({id: 'QB02', platforms: ['QB02'], name: 'Quickbird', resolution: 0.5, swath: 16.5, since: '2001 - 2015', endingDate: '2015'}),
        new KOMPSAT({id: 'KOMPSAT3A', platforms: ['KOMPSAT3A'], name: 'KOMPSAT-3A', resolution: 0.5, swath: 12, since: '2015'}),
        new KOMPSAT({id: 'KOMPSAT3', platforms: ['KOMPSAT3'], name: 'KOMPSAT-3', resolution: 0.7, swath: 16, since: '2012'}),
        new SV1(),            
        new Satellite({id: 'IK', platforms: ['IK-2','IKONOS-2'], name: 'IKONOS', resolution: 0.8, swath: 11.3, operator: T.getText('operator.ge'), since: '1999 - 2015', endingDate: '2015'}),
        new SpaceView({id: 'GF2', platforms: ['GF2'], name: 'GaoFen-2', resolution: 0.8, swath: 45, since: '2014'}),
        new KOMPSAT({id: 'KOMPSAT2', platforms: ['KOMPSAT2'], name: 'KOMPSAT-2', resolution: 1, swath: 15, since: '2006'}), 
        new Triplesat(),
        new RP_1MS(),
        new SP6_7(),
        new Satellite({id: 'BKA', platforms: ['BKA'], name: 'БелКА', resolution: 2, swath: 20, operator: T.getText('operator.vniiem'), since: '2012', restricted: true}),
        new GF1({id: 'GF1_2m', platforms: ['GF1'], name: 'GaoFen-1 (2m)', resolution: 2, swath: 60, since: '2013', sensor: 'A'}),        
        new SpaceView({id: 'ZY3', platforms: ['ZY3','ZY302'], name: 'ZiYuan-3', resolution: 2.1, swath: 51, since: '2012'}),
        // new SP5_2MS(),
        new RP_4MS(),
        // new SP5_5MS(),
        new Satellite({id: 'RE', platforms: ['RE'], name: 'RapidEye', resolution: 6.5, swath: 77, operator: T.getText('operator.blackbridge'), since: '2008', restricted: true}),
        new SP5_10MS(),
        new Satellite({id: 'LANDSAT8', platforms: ['LANDSAT_8'], name: 'LANDSAT 8', resolution: 15, swath: 185, operator: T.getText('operator.usgs'), since: '2013', restricted: true}),
        new GF1({id: 'GF1_16m', platforms: ['GF1'], name: 'GaoFen-1 (16m)', resolution: 16, swath: 800, since: '2013', sensor: 'B'}),
        new SP6_7_1A(),
        new PLD_1A(),        
        new SP67_P(),
    ],
    pc: [
        new DG({id: 'WV01', platforms: ['WV01'], name: 'WorldView 1', resolution: 0.5, swath: 17.6, since: '2007'}),
        new EROS({id: 'EROSB', platforms: ['EROS-B'], name: 'EROS-B', resolution: 0.7, swath: 7, since: '2006'}),        
        new RP_PC(),
        new EROS({id: 'EROSA', platforms: ['EROS-A1'], name: 'EROS-A', resolution: 1.9, swath: 14, since: '2000'}),
        // new SP5_2PC(),
        new SP5_5PC(),        
    ],
};

function get_name(a, x) {    
    return x.platforms.reduce((b, y) => {
        b[y] = x.name;
        return b;
    }, a);
}

let names = satellites.ms.reduce(get_name, {});
names = satellites.pc.reduce(get_name, names);

function getSatelliteName (platform) {    
    return names[platform];
}

export { satellites, getSatelliteName };
import './Satellites.css';
import EventTarget from 'scanex-event-target';
import Translations from 'scanex-translations';
import Tristate from 'scanex-tristate';
import Info from './Info.js';
import { create_container } from '../../../app/Utils/Utils.js';

let T = Translations;

T.addText('rus', {
    satellite: {
        global: 'Внешние',
        local: 'Внутренние',
        ms: 'Мультиспектр',
        pc: 'Панхром',
        resolution: 'Разрешение',
        swath: 'Ширина полосы съемки',
        since: 'На орбите:'
    },    
});

T.addText('eng', {
    satellite: {
        global: 'Global',
        local: 'Local',
        ms: 'Multispectrum',
        pc: 'Panchrome',
        resolution: 'Resolution',
        swath: 'Swath',
        since: 'In orbit since'
    },   
});

const SATELLITE_COLS = 2;

class Satellites extends EventTarget {
    constructor (container, {restricted = false}) {
        super();
        this._container = container;        
        this._restricted = restricted;  
        this._info = new Info (create_container());
    }
    set data({ms, pc}) {        
        this._ms = this._restricted ? ms : ms.filter(x => !x.restricted);
        this._pc = this._restricted ? pc : pc.filter(x => !x.restricted);
        this._render();       
        this._handleChange();
    }
    get data () {
        return {ms: this._ms, pc: this._pc };
    }
    get count () {
        let ss = this.items
        .filter(x => x.checked)
        .reduce((a,x) => {
            switch (x.id) {
                case 'SP5_10MS':
                case 'SP5_5MS':
                case 'SP5_5PC':
                case 'SP5_2MS':
                case 'SP5_2PC':
                    a.SP5 = 1;
                    break;
                case 'SP6_7':
                    a.SP6_7 = 2;
                    break;
                case 'PHR':
                    a.PHR = 2;
                    break;
                case 'RP_PC':
                case 'RP_MS':
                    a.RP = 3;
                    break;
                case 'SV1':
                    a.SV1 = 4;
                    break;
                default:
                    a[x.id] = 1;
                    break;
            }            
            return a;
        }, {});
        return Object.keys(ss).reduce((a,k) => a + ss[k], 0);
    }    
    get items () {
        return this._ms.concat(this._pc);
    }
    get range () {        
        const range = this.items.filter(x => x.checked)
        .map(x => x.resolution)
        .sort((a,b) => {
            if (a < b) return -1;
            if (a > b) return 1;
            if (a == b) return 0;
        });
        if (range.length > 0) {
            return [range[0],range[range.length - 1]];
        }
        else {
            return [];
        }
    }    
    set range([min, max]){
        this._ms.forEach(x => {
            x.checked = min <= x.resolution && x.resolution <= max;
        });
        let ms = this._container.querySelectorAll('.search-options-satellites-ms div input[type="checkbox"]');
        this._updateChecked(ms, this._ms);
        this._msTristate.update();

        this._pc.forEach(x => {
            x.checked = min <= x.resolution && x.resolution <= max;
        });
        let pc = this._container.querySelectorAll('.search-options-satellites-pc div input[type="checkbox"]');
        this._updateChecked(pc, this._pc);
        this._pcTristate.update();
        
        // this._handleChange();
    }
    _updateChecked (nodes, cache) {
        for (let i = 0; i < nodes.length; ++i){
            const node = nodes[i];            
            node.checked = cache[i].checked;
        }
    }
    _attachEvents (nodes, cache){
        for (let i = 0; i < nodes.length; ++i){
            const node = nodes[i];         
            node.addEventListener('click', e => {
                cache[i].checked = e.target.checked;
                this._handleChange();               
            });
            let p = node.parentNode.querySelector('label');
            p.addEventListener('mouseover', e => {
                let {resolution, swath, operator, since } = cache[i];
                this._info.resolution = resolution;
                this._info.swath = swath;
                this._info.operator = operator;
                this._info.since = since;
                let {left, top, width} = p.getBoundingClientRect();
                this._info.show(left + width, top - 10);
            });
            p.addEventListener('mouseout', e => {
                this._info.hide ();            
            });
        }        
    }
    _handleChange(){
        let event = document.createEvent('Event');
        event.initEvent('change', false, false);
        this.dispatchEvent(event);        
    }
    _getSatelliteClass (i) {        
        return i > 0 && (i % SATELLITE_COLS === 0) ?  'satellite-col-break' : 'satellite-col';
    }
    _getSatelliteList(cache) {
        return cache.map((x, i) => {
            const {id, name, endingDate = null} = x;
            return `<div class="satellite-col">
                        <input type="checkbox" id="sat_${id}" value="${id}" />
                        <label for="sat_${id}">${name} ${endingDate ? '(' + endingDate + ')' : ''}</label>
                    </div>`;
        }).join('');
    }
    _getTooltip(obj){
        return `${T.getText('satellite.resolution')} ${obj.resolution} ${T.getText('satellite.swath')} ${obj.swath} ${obj.operator} ${T.getText('satellite.since')} ${obj.since}`;
    }    
    _render () {  
        
        this._container.innerHTML = 
        `<fieldset class="search-options-satellites-ms">
            <legend>
                <input id="search-options-satellites-ms-select" type="checkbox" class="search-options-satellites-ms-select" />
                <label for="search-options-satellites-ms-select">${T.getText('satellite.ms')}</label>
            </legend>            
            <div>${this._getSatelliteList(this._ms)}</div>
        </fieldset>
        <fieldset class="search-options-satellites-pc">            
            <legend>
                <input id="search-options-satellites-pc-select" type="checkbox" class="search-options-satellites-pc-select" />
                <label for="search-options-satellites-pc-select">${T.getText('satellite.pc')}</label>
            </legend>            
            <div>${this._getSatelliteList(this._pc)}</div>
        </fieldset>`;
        let ms = this._container.querySelectorAll('.search-options-satellites-ms div input[type="checkbox"]');        
        this._attachEvents(ms, this._ms);
        this._msTristate = new Tristate (this._container.querySelector('.search-options-satellites-ms legend input[type="checkbox"]'), ms);
        this._updateChecked(ms, this._ms);
        this._msTristate.update();

        let pc = this._container.querySelectorAll('.search-options-satellites-pc div input[type="checkbox"]');
        this._attachEvents(pc, this._pc);
        this._pcTristate = new Tristate (this._container.querySelector('.search-options-satellites-pc legend input[type="checkbox"]'), pc);
        this._updateChecked(pc, this._pc);                  
        this._pcTristate.update();
    }

    // redraw () {
    //     this._render();
    //     this._handleChange();
    // }
}

export default Satellites;
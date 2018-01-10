import './FavoritesList.css';
import { DataGrid } from 'lib/DataGrid/src/DataGrid.js';
import { getSatelliteName } from 'res/Satellites.js';
import { EventTarget } from 'lib/EventTarget/src/EventTarget.js';
import { create_container } from 'app/Utils/Utils.js';
import { Translations } from 'lib/Translations/src/Translations.js';

window.Catalog.translations = window.Catalog.translations || new Translations();
let T = window.Catalog.translations

class FavoritesList extends EventTarget {
    constructor(container, { restricted }) {
        super();
        this._cart = {};
        this._restricted = restricted;
        this._container = container;
        this._container.classList.add('favorites-list');             
        this._onCellClick = this._onCellClick.bind(this);
        this._onColumnClick = this._onColumnClick.bind(this);
        this._onRowMouseOver = this._onRowMouseOver.bind(this);
        this._onRowMouseOut = this._onRowMouseOut.bind(this);
        this._onSort = this._onSort.bind(this);
        this._activeInfo = null;
        this._fields = {  
            'selected': {
                type: 'selector',
                default: false,
            },           
            'visible': {
                type: 'boolean',
                columnIcon: 'favorites-select-quicklooks-active',
                icon: 'search',
                yes: 'search-visibility-off',
                no: 'search-visibility-on',
                default: false,
            },
            'stereo': {
                columnIcon: 'search search-stereo',
                type: 'boolean',
                icon: 'search',
                yes: 'search-stereo', 
                sortable: true,               
                default: false,
                tooltip: T.getText('results.stereo'),
            },                               
            'platform': {
                type: 'string',
                name: T.getText('results.satellite'),
                sortable: true,
                formatter: (item) =>  {                    
                    switch(item.platform) {
                        case 'SPOT6':                        
                        case 'SPOT 6':
                            return item.islocal ? 'SPOT 6' : 'SPOT 6 (A)';
                        case 'SPOT7':
                        case 'SPOT 7':
                            return item.islocal ? 'SPOT 7' : 'SPOT 7 (A)';
                        case 'SPOT 5':
                            let sp5 = 'SPOT 5';
                            if (item.sensor === 'J') {
                                if (item.spot5_a_exists & item.spot5_b_exists) {
                                    sp5 = 'SPOT 5 - 2.5ms';
                                }
                                else if (item.spot5_a_exists || item.spot5_b_exists) {
                                    sp5 = 'SPOT 5 - 5ms';
                                }
                                else {
                                    sp5 = 'SPOT 5 - 10ms';
                                }
                            }
                            else if (item.sensor === 'A' || item.sensor === 'B' && !item.spot5_b_exists) {                            
                                sp5 = 'SPOT 5 - 5pan';
                            }
                            else if (item.sensor === 'A' && item.spot5_b_exists) {
                                sp5 = 'SPOT 5 - 2.5pan';
                            }                            
                            return `${sp5}${item.islocal ? '' : ' (A)'}`;
                        case 'Ресурс-П1':
                        case 'Ресурс-П2':
                        case 'Ресурс-П3':
                            if (item.spot5_a_exists && !item.spot5_b_exists) {
                                return `${item.platform} pan`;
                            }
                            else if (item.spot5_b_exists) {
                                return `${item.platform} ms`;
                            }
                            else {
                                return item.platform;
                            }    
                        case 'GF1':
                            switch (item.sensor) {
                                case 'A':
                                    return 'GaoFen-1 (2m)';
                                case 'B':
                                    return 'GaoFen-1 (16m)';
                                default:
                                    return 'GaoFen-1';
                            }
                        case '1A-PHR-1A':
                            return '1ATLAS (PHR-1A)';
                        case '1A-PHR-1B':
                            return '1ATLAS (PHR-1B)';
                        case '1A-SPOT-6':
                            return '1ATLAS (SP6)';
                        case '1A-SPOT-7':
                            return '1ATLAS (SP7)';
                        default:
                            return `${getSatelliteName(item.platform)}${item.islocal ? ' (L)': ''}`;
                    }
                },
            },
            'cloudness': {
                type: 'float',
                name: T.getText('results.clouds'),
                sortable: true,
                formatter: item => Math.round (item.cloudness),
                default: 0,
                align: 'center',
            },
            'tilt': {
                type: 'float',
                name: T.getText('results.angle'),
                sortable: true,
                formatter: item => Math.round (item.tilt),
                default: 0,
                align: 'center',
            },
            'acqdate': {
                type: 'date',
                name: T.getText('results.date'),
                formatter: item => item.acqdate.toLocaleDateString(),
                sortable: true,
            },                
            'info': {
                type: 'boolean',
                icon: 'search',
                yes: 'search-info-off',
                no: 'search-info-on',
            },
            
        };

        this._grid = new DataGrid(this._container, {fields: this.fields, indexBy: 'gmx_id'});
        this._grid.addEventListener('cell:click', this._onCellClick);        
        this._grid.addEventListener('column:click', this._onColumnClick);
        this._grid.addEventListener('row:mouseover', this._onRowMouseOver);
        this._grid.addEventListener('row:mouseout', this._onRowMouseOut);
        this._grid.addEventListener('sort', this._onSort);
        this._stopPropagation = this._stopPropagation.bind(this);        
    }

    _onSort (e) {
        let event = document.createEvent('Event');
        event.initEvent('sort', false, false);
        event.detail = this._grid.sortedItems;
        this.dispatchEvent(event);
    }

    _stopPropagation (e) {
        e.stopPropagation();
    } 

    getItemByIndex (id) {
        return this._grid.getItemByIndex(id);
    }

    get fields () {
        return this._fields;
    }    
    _onCellClick (e){
        e.stopPropagation();
        let {i, j, row, cell, name, field, item} = e.detail;
        let event = document.createEvent('Event');
        let btn = null;
        let k = 0;

        switch(name){           
            case 'selected':
                item.selected = Boolean(cell.querySelector('input[type=checkbox]').checked);
                event.initEvent('selected', false, false);
                event.detail = item;
                this.dispatchEvent(event);
                break;
            case 'visible':
                k = Object.keys(this._fields).indexOf('visible');
                btn = row.querySelectorAll('td')[k].querySelector('i');
                if (btn.classList.contains('search-visibility-on')) {
                    btn.classList.remove('search-visibility-on');
                    btn.classList.add('search-visibility-off');
                    item.visible = true;
                }
                else {
                    btn.classList.remove('search-visibility-off');
                    btn.classList.add('search-visibility-on');
                    item.visible = false;
                }

                event.initEvent('visible', false, false);
                event.detail = item;
                this.dispatchEvent(event);
                break;
            case 'info':
                let {left, top} = cell.getBoundingClientRect();
                let button = cell.querySelector('i');
                         
                event.initEvent('info', false, false);
                event.detail = {item: item, left, top, button};
                this.dispatchEvent(event);
                
                break;     
            default:
                k = Object.keys(this._fields).indexOf('visible');
                btn = row.querySelectorAll('td')[k].querySelector('i');
                btn.classList.remove('search-visibility-on');
                btn.classList.add('search-visibility-off');
                item.visible = true;

                event.initEvent('visible', false, false);
                event.detail = item;
                this.dispatchEvent(event);
                break;
        }
        switch (name) {
            case 'selected':
            case 'info':
            case 'visible':
                break;
            default:           
                event.initEvent('click', false, false);
                event.detail = e.detail;
                this.dispatchEvent(event);
                break;
        }
    }   
    _onColumnClick (e) {
        e.stopPropagation();
        let {col, field, name} = e.detail;        
        switch (name) {
            case 'visible':
                let state = false;
                if (this._grid.items.every(x => x.visible)) {
                    state = false;
                }
                else if (this._grid.items.every(x => !x.visible)) {
                    state = true;
                }
                else {
                    state = col.querySelector('i').classList.contains('favorites-select-quicklooks-active');
                }                
                this._grid.items.forEach(item => item.visible = state);
                this._grid.refresh();
                let btn = this._grid.getCol(name).querySelector('i');
                if (state) {                   
                    btn.classList.add('favorites-select-quicklooks-passive');
                    btn.classList.remove('favorites-select-quicklooks-active');
                }
                else {
                    btn.classList.add('favorites-select-quicklooks-active');
                    btn.classList.remove('favorites-select-quicklooks-passive');
                }
                let event = document.createEvent('Event');
                event.initEvent('visible:all', false, false);
                event.detail = state;
                this.dispatchEvent(event);
                break;
            default:
                break;
        }
    } 
    _onRowMouseOver (e) {
        let event = document.createEvent('Event');
        event.initEvent('mouseover', false, false);
        event.detail = e.detail;
        this.dispatchEvent(event);
    }
    _onRowMouseOut (e) {
        let event = document.createEvent('Event');
        event.initEvent('mouseout', false, false);
        event.detail = e.detail;
        this.dispatchEvent(event);
    }
    set items (value) {
        if(Array.isArray(value)) {
            this._grid.items  = value;
        }
    }
    get items() {
        return this._grid.items;
    }
    get sortedItems () {        
        return this._grid.sortedItems;
    }
    hilite (id) {                
        this._grid.getRow(id).classList.add('hilite');
    }
    dim (id) {        
        this._grid.getRow(id).classList.remove('hilite');
    }   
    resize(total) {
        let height = this._container.querySelector('.table-list-header').getBoundingClientRect().height;
        let body = this._container.querySelector('.table-list-body');
        body.style.maxHeight = `${total - height}px`;
        body.style.height = body.style.maxHeight;
    }
    refresh() {
        this._grid.refresh();
        let event = document.createEvent('Event');
        event.initEvent('refreshed', false, false);
        this.dispatchEvent(event);
    }
    scrollToRow(id) {
        this._grid.scrollToRow(id);
    }
    enableFilter (enable) {
        this._grid.filtered = enable;
    }
    get filteredItems () {
        return this._grid.filteredItems;
    }
    get bbox () {
        return this._container.getBoundingClientRect();
    }
    adjustWidth () {
        this._grid.adjustHeader();
    }
}

export { FavoritesList };
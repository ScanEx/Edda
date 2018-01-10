import './ResultList.css';
// import { Panel } from 'lib/Leaflet.Panel/src/Panel.js';
import { DataGrid } from 'lib/DataGrid/src/DataGrid.js';
// import { Panel } from 'lib/Leaflet.Panel/src/Panel.js';
import { getSatelliteName } from 'res/Satellites.js';
import { EventTarget } from 'lib/EventTarget/src/EventTarget.js';
import { create_container } from 'app/Utils/Utils.js';
import { Translations } from 'lib/Translations/src/Translations.js';

window.Catalog.translations = window.Catalog.translations || new Translations();
let T = window.Catalog.translations

T.addText('rus', {
    results: {
        title: 'Найденные снимки',
        sceneid: 'ID',
        date: 'Дата',
        satellite: 'Спутник',
        clouds: 'Обл.',
        angle: 'Угол',
        stereo: 'Стерео',
        visibility: 'Видимость',
        cart: 'Добавить все в корзину',
    },   
    warning: {
        title: 'Внимание',           
    },
});

T.addText('eng', {
    results: {
        title: 'Found images',
        sceneid: 'ID',
        date: 'Date',
        satellite: 'Satellite',
        clouds: 'Clouds',
        angle: 'Angle',
        stereo: 'Stereo',
        visibility: 'Visibility',
        cart: 'Add all to cart',
    }, 
    warning: {
        title: 'Warning',              
    },     
});

class ResultList extends EventTarget {
    constructor(container, { restricted }){
        super();       
        this._cart = {};
        this._restricted = restricted;
        this._container = container;
        this._container.classList.add('result-list');
        this._onColumnClick = this._onColumnClick.bind(this);
        this._onCellClick = this._onCellClick.bind(this);
        this._onRowMouseOver = this._onRowMouseOver.bind(this);
        this._onRowMouseOut = this._onRowMouseOut.bind(this);
        this._onSort = this._onSort.bind(this);
        this._activeInfo = null;
        this._fields = {             
            'visible': {                
                type: 'boolean',                    
                icon: 'search',
                yes: 'search-visibility-off',
                no: 'search-visibility-on',
                default: false,
                width: 30,             
            },
            'stereo': {
                columnIcon: 'search search-stereo',
                type: 'boolean',
                icon: 'search',
                yes: 'search-stereo',
                sortable: true,
                default: false,
                tooltip: T.getText('results.stereo'),
                width: 32,
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
                width: 100,
            },
            'cloudness': {
                type: 'float',
                name: T.getText('results.clouds'),
                sortable: true,
                formatter: item => {
                    let value = item.cloudness;
                    return value < 0 ? '' : Math.round (value);
                },
                default: 0,
                align: 'center',
                width: 55,
            },
            'tilt': {
                type: 'float',
                name: T.getText('results.angle'),
                sortable: true,
                formatter: item => {
                    let value = item.tilt;
                    return value < 0 ? '' : Math.round (value);
                },
                default: 0,
                align: 'center',
                width: 55,
            },
            'acqdate': {
                type: 'date',
                name: T.getText('results.date'),
                formatter: item => item.acqdate.toLocaleDateString(),
                sortable: true,
                width: 71,
            },                
            'info': {
                type: 'boolean',
                icon: 'search',
                yes: 'search-info-off',
                no: 'search-info-on',
                width: 26,
            },
            'cart': {
                tooltip: T.getText('results.cart'),
                columnIcon: 'cart-add cart-add-active',
                type: 'boolean',
                icon: 'cart-add',
                yes: 'cart-add-active',
                no: 'cart-add-passive',
                width: 22,
            },
        };

        this._grid = new DataGrid(this._container, {fields: this.fields, filter: item => Boolean (item.checked), indexBy: 'gmx_id'});
        this._grid.addEventListener('cell:click', this._onCellClick);
        this._grid.addEventListener('column:click', this._onColumnClick);
        this._grid.addEventListener('row:mouseover', this._onRowMouseOver);
        this._grid.addEventListener('row:mouseout', this._onRowMouseOut);
        this._grid.addEventListener('sort', this._onSort);
        this._stopPropagation = this._stopPropagation.bind(this);
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

    _onSort (e) {
        let event = document.createEvent('Event');
        event.initEvent('sort', false, false);
        event.detail = this._grid.sortedItems;
        this.dispatchEvent(event);
    }

    _onCellClick (e){
        e.stopPropagation();
        let {row, cell, name, field, item} = e.detail;
        let event = document.createEvent('Event');
        let btn = null;
        let k = 0;

        switch(name){           
            case 'cart':
                btn = cell.querySelector('i');
                if (btn.classList.contains('cart-add-active')) {
                    btn.classList.remove('cart-add-active');
                    btn.classList.add('cart-add-passive');
                    item.cart = false;
                }
                else {
                    btn.classList.remove('cart-add-passive');
                    btn.classList.add('cart-add-active');
                    item.cart = true;                    
                }                

                event.initEvent('cart', false, false);
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
            case 'cart':
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
    _updateChecked (state) {
        let btn = this._grid.getCol('cart').querySelector('i');
        if (state) {                                                                   
            btn.classList.remove('cart-add-passive');
            btn.classList.add('cart-add-active');
        }
        else {
            btn.classList.remove('cart-add-active');
            btn.classList.add('cart-add-passive');
        }
    }
    _getChecked () {
        if (this._grid.items.length === 0) {
            return false;
        }
        let checked = false;
        if (this._grid.items.every(x => x.cart)) {
            checked = true;
        }
        else if (this._grid.items.every(x => !x.cart)) {
            checked = false;
        }        
        return checked;
    }
    _onColumnClick (e) {
        e.stopPropagation();
        let {col, field, name} = e.detail;
        let event = document.createEvent('Event');
        switch (name) {
            case 'cart':
                let newItems = this._grid.items.filter(item => !item.cart);
                // let state = !this._getChecked();
                let state = true;
                if (newItems.length + window.Catalog.favoritesList.items.length <= window.MAX_CART_SIZE) {                    
                    this._grid.items.forEach(item => {
                        item.checked = state;                        
                    });
                    this._grid.refresh();

                    // this._updateChecked(state);

                    event.initEvent('cart:all', false, false);
                    event.detail = {items: state ? newItems : this._grid.items, state};
                    this.dispatchEvent(event);
                }
                else {
                    event.initEvent('cart:limit', false, false);                    
                    this.dispatchEvent(event);
                }                
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
        this._container.querySelector('.table-list-body').style.maxHeight = `${total - height}px`;
    }
    refresh() {
        this._grid.refresh();        
        // this._updateChecked(this._getChecked());
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

export { ResultList };
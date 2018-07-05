import './DrawnObjects.css';

import 'scanex-datagrid/dist/bundle.css';
import { DataGrid, ENUM_ID } from 'scanex-datagrid';

import EventTarget from 'scanex-event-target';

import 'scanex-float-panel/dist/bundle.css';
import FloatingPanel from 'scanex-float-panel';

import Translations from 'scanex-translations';

import 'scanex-color-picker/dist/bundle.css';
import ColorPicker from 'scanex-color-picker';

import { create_container } from 'app/Utils/Utils.js';

let T = Translations;

T.addText ('rus', {
    objects: {
        title: 'Объекты',
        polygon: 'Многоугольник',
        line: 'Линия',
        point: 'Точка',
    },
    name: 'Название',
    area: 'Характеристика',
    color: 'Цвет'
});

T.addText ('eng', {
    objects: {
        title: 'Objects',
        polygon: 'Polygon',
        line: 'Line',
        point: 'Point',
    },
    name: 'Name',
    area: 'Data',
    color: 'Color'
});

function get_area_text(area){
    const sq = '<span class="square">2</span>';
    if (area < 10e+5) {
        return `${Math.round(area).toFixed(0)} ${T.getText('units.m')}${sq}`;
    }
    else {
        return `${Math.round(area / 10e+5).toFixed(0)} ${T.getText('units.km')}${sq}`;
    }    
}

class DrawnObjects extends EventTarget {
    constructor (container, { color = '#0000FF'}){        
        super();
        this._count = 0;
        this._container = container;
        this._container.style.display = 'none';
        this._container.innerHTML =
            `<div class="drawn-objects">
                <div class="drawn-objects-header">
                    <span class="drawn-objects-title">${T.getText('objects.title')}</span>
                    <span class="drawn-objects-number">0</span>
                    <span class="drawn-objects-minimize"></span>
                </div>
                <div class="drawn-objects-list"></div>
            </div>`;
        this._preventDefault = this._preventDefault.bind(this);
        this._stopPropagation = this._stopPropagation.bind(this);
        this._container.addEventListener('click', this._preventDefault);        
        this._container.addEventListener('click', this._stopPropagation);
        this._container.addEventListener('mousewheel', this._stopPropagation);
        this._toggle = this._toggle.bind(this);
        this._container.querySelector('.drawn-objects-minimize').addEventListener('click', this._toggle);

        this._onCellClick = this._onCellClick.bind(this);
        this._onCellEdit = this._onCellEdit.bind(this);
        this._onColumnClick = this._onColumnClick.bind(this);
        this._grid = new DataGrid(this._container.querySelector('.drawn-objects-list'), {
            fields: {
                'visible': {
                    type: 'boolean',
                    columnIcon: 'drawn-objects-visible',
                    icon: 'search',                    
                    yes: 'search-visibility-off',
                    no: 'search-visibility-on',
                    default: true,
                },
                'color': {
                    type: 'color',
                    name: T.getText('color'),
                    default: color,
                },
                'name': {
                    type: 'string',
                    name: T.getText('name'),
                    edit: 'drawing-edit',
                    sortable: true,
                },               
                'area': {
                    type: 'float',
                    name: T.getText('area'),
                    align: 'right',
                    sortable: true,
                    default: 0,
                    formatter: (item) => {
                        const geoJSON = item.geoJSON;
                        const g = geoJSON.geometry;
                        const type = g.type;
                        const value = item.area;
                        switch (type.toUpperCase()) {
                            case "POINT":
                                return L.gmxUtil.latLonToString(g.coordinates[0], g.coordinates[1], 6);
                            case "LINESTRING":
                            case "MULTILINESTRING":
                                return L.gmxUtil.prettifyDistance(value);
                            case "MULTIPOLYGON":
                            case "POLYGON":
                            default:
                                return get_area_text(value);
                        }
                    }
                },
                'delete': { 
                    columnIcon: 'delete-all',
                    type: 'button',
                    button: 'search search-delete',
                },
            },           
        });
        this._grid.addEventListener('cell:click', this._onCellClick);
        this._grid.addEventListener('cell:edit', this._onCellEdit);
        this._grid.addEventListener('column:click', this._onColumnClick);
        this._colorPickerCell = null;
        this._onSetColor = this._onSetColor.bind(this);

        this._colorPickerContainer = create_container();
        this._colorPickerContainer.classList.add('noselect');
        this._hideColorPicker = this._hideColorPicker.bind(this);
        this._colorPicker = new ColorPicker(this._colorPickerContainer);
        this._colorPicker.addEventListener('change', this._onSetColor);
        document.body.addEventListener('click', this._hideColorPicker);
    }
    _toggle (e) {
        var content = this._container.querySelector('.drawn-objects-list');
        content.style.display = content.style.display === 'none' ? 'block' : 'none';
    }
    _preventDefault (e) {
        e.preventDefault();
    }
    _stopPropagation (e) {
        e.stopPropagation();
    }
    _hideColorPicker (e) {
        this._colorPickerContainer.style.visibility = 'hidden';
    }
    _onSetColor(e) {
        if(this._colorPickerCell) {
            let {item,cell} = this._colorPickerCell;          
            item.color = e.detail.hex;
            cell.querySelector('.table-list-color').style.borderColor = e.detail.hex;

            let event = document.createEvent('Event');
            event.initEvent('edit', false, false);
            event.detail = item;
            this.dispatchEvent(event);            
        }
    }
    _onCellClick (e){
        let {i, j, row, cell, name, field, item} = e.detail;
        let event = document.createEvent('Event');
        switch(name){            
            case 'visible':
                // let btn = cell.querySelector('i');
                // if (btn.classList.contains('search-visibility-off')) {
                //     btn.classList.remove('search-visibility-off');
                //     btn.classList.add('search-visibility-on');
                //     item.visible = false;
                // }
                // else {
                //     btn.classList.remove('search-visibility-on');
                //     btn.classList.add('search-visibility-off');
                    
                // }   
                item.visible = !item.visible;                
                const id = item[ENUM_ID];
                this._grid.redrawRow(id, item);
                
                event.initEvent('check', false, false);
                event.detail = item;
                this.dispatchEvent(event);

                break;           
            case 'color':
                if (item.color) {
                    this._colorPickerCell = {item, cell};
                    let {left, top} = cell.getBoundingClientRect();
                    var colorPickerRect = this._colorPickerContainer.getBoundingClientRect();
                    this._colorPickerContainer.style.left = `${left - colorPickerRect.width - 50}px`;
                    var rect = document.body.getBoundingClientRect();
                    this._colorPickerContainer.style.top = `${top + colorPickerRect.height < rect.bottom ? top : top - colorPickerRect.height + 10}px`;
                    this._colorPicker.value = item.color;
                    this._colorPickerContainer.style.visibility = 'visible';
                }
                break;            
            case 'delete':                
                event.initEvent('delete', false, false);
                event.detail = item;
                this.dispatchEvent(event);
                break;
            default:                                          
                event.initEvent('fit', false, false);
                event.detail = item;
                this.dispatchEvent(event);
                break;
        }        
    }
    _onCellEdit (e){
        let {item} = e.detail;
        let event = document.createEvent('Event');
        event.initEvent('edit', false, false);
        event.detail = item;
        this.dispatchEvent(event);
    }   
    _onColumnClick (e) {
        let {col, name} = e.detail;
        let event = document.createEvent('Event');
        switch (name) {
            case 'visible':                
                let state = !col.querySelector('i').classList.contains('drawn-objects-visible');
                this._grid.items.forEach(item => item.visible = state);
                this._grid.refresh();
                let btn = this._grid.getCol(name).querySelector('i');
                if (state) {
                    btn.classList.remove('drawn-objects-hidden');
                    btn.classList.add('drawn-objects-visible');                    
                }
                else {
                    btn.classList.add('drawn-objects-hidden');
                    btn.classList.remove('drawn-objects-visible');                   
                }
                
                event.initEvent('show:all', false, false);
                event.detail = state;
                this.dispatchEvent(event);
                break;
            case 'delete':                
                event.initEvent('delete:all', false, false);
                this.dispatchEvent(event);
                break;
            default:
                break;
        }
    }
    set items(items) {
        if (Array.isArray(items) && items.length > 0) {
            this._container.style.display = 'block';
            this._grid.items = items;
            this.updateCount(this._grid.items.length);
        }
        else {
            this._container.style.display = 'none';
            this._grid.items  = [];
            this.updateCount(0);
        }        
    }
    get items () {
        return this._grid.items;
    }
    get count () {
        return this._count;
    }
    updateCount (num) {
        this._count = parseInt(num, 10);
        this._container.querySelector('.drawn-objects-number').innerText = num;
    }
    resize(total) {
        let height = this._container.querySelector('.table-list-header').getBoundingClientRect().height;
        this._container.querySelector('.table-list-body').style.maxHeight = `${total - height}px`;
    }
}

let DrawnObjectsControl = L.Control.extend ({
    includes: L.Evented ? L.Evented.prototype : L.Mixin.Events,

    // options.position (left|right)
    initialize: function(options) {    
        L.setOptions(this, options);
    },

    onAdd: function(map) {
        this._container = L.DomUtil.create('div', 'drawn-objects-control');
        this.widget = new DrawnObjects(this._container, {});
        // L.DomEvent.disableClickPropagation(this._container);
        // L.DomEvent.disableScrollPropagation(this._container);
        // L.DomEvent.on(this._container, 'mousemove', L.DomEvent.stopPropagation);
        return this._container;
    },    

    onRemove: function(map) { },

});


export { DrawnObjects, DrawnObjectsControl };
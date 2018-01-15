import { EventTarget } from 'lib/EventTarget/src/EventTarget.js';
import { RangeWidget } from 'lib/SliderWidget/src/RangeWidget/RangeWidget.js';
import { getSatelliteName } from 'res/Satellites.js';
import './FilterControl.css';

let T = window.Catalog.translations;

class CompactRangeWidget extends RangeWidget {
    constructor(container, options) {
        super(container, options);
        let label = document.createElement('label');
        label.className = 'range-widget-label';
        label.innerText = options.label;
        let content = this._container.querySelector('.range-widget-content');
        content.insertBefore(label, this._container.querySelector('.range-widget-content input'));        
    }
}

class SatelliteFilter {
    constructor (container, options) {
        this._container = container;
        this._options = options;        
        this._container.innerHTML = `<div class="satellite-filter-header">
            <label class="satellite-filter-label">${this._options.label}</label>
            <div class="satellite-filter-button">
                <label></label>
                <span>&#x025bc;</span>
            </div>
        </div>
        <div class="satellite-filter-body"></div>`;
    }
    set items (values) {
        this._container.querySelector('.satellite-filter-body').innerHTML = 
            values.map(({platform, checked}) => {
                return `<div class="satellite-item">
                    <input type="checkbox"${checked ? ' checked': ''} value="${platform}" /><label>${getSatelliteName(platform)}</label>
                </div>`;
            }).join('');
    }
}

let FilterControl = L.Control.extend({
    includes: L.Evented ? L.Evented.prototype : L.Mixin.Events,
    initialize: function(options) {            
        L.setOptions(this, options);        
    },
    onAdd: function(map) {
        this._container = L.DomUtil.create('div', 'filter-control');
        this._container.innerHTML = `<div class="cloudiness-slider"></div><div class="angle-slider"></div><div class="satellite-filter"></div>`;
        this.clouds = new CompactRangeWidget (this._container.querySelector('.cloudiness-slider'), {min: 0, max: 100, label: T.getText('clouds')});
        this.clouds.values = this.options.clouds && this.options.clouds.values || [0, 100];

        this.angle = new CompactRangeWidget (this._container.querySelector('.angle-slider'), {min: 0, max: 60, label: T.getText('angle')});
        this.angle.values = this.options.angle && this.options.angle.values || [0, 60];

        // this.satellites = new SatelliteFilter(this._container.querySelector('.satellite-filter'), {label: T.getText('satellites')});

        L.DomEvent.disableClickPropagation(this._container);
        L.DomEvent.disableScrollPropagation(this._container);
        // L.DomEvent.on(this._container, 'mousemove', L.DomEvent.stopPropagation);

        this.clouds.addEventListener('stop', e => {
            let [lo, hi] = e.detail;
            this.fireEvent ('change', { clouds: [lo, hi], angle: this.angle.values});
        }); 
        
        this.angle.addEventListener('stop', e => {
            let [lo, hi] = e.detail;
            this.fireEvent ('change', { clouds: this.clouds.values, angle: [lo, hi]});
        });

        return this._container;
    },

    onRemove: function(map) { },
});

export { FilterControl };
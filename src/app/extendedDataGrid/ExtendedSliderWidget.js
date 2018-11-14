import {SliderWidget} from 'scanex-slider-widget';


export default class ExtendedSliderWidget extends SliderWidget {

    constructor(...props) {

        super(...props);

        const parent = this._container.parentNode;

        this._leftInput = parent.querySelector('.min-input');
        this._rightInput = parent.querySelector('.max-input');

        this._leftInput.addEventListener('change', this._handleLeftInput.bind(this));
        this._leftInput.addEventListener('focus', e => this._leftInput.select());
        this._rightInput.addEventListener('change', this._handleRightInput.bind(this));
        this._rightInput.addEventListener('focus', e => this._rightInput.select());

        this.addEventListener('change', () => {
            this._leftInput.value = this._lo;
            this._rightInput.value = this._hi;
        });
    }

    _handleLeftInput(e){
        const lo = this.options.mode === 'integer' ? parseInt(this._leftInput.value, 10) : new Date(this._leftInput.value.getTime());
        const hi = this.options.mode === 'integer' ? parseInt(this._rightInput.value, 10) : new Date(this._rightInput.value.getTime());
        if(!isNaN(lo) && this.options.min <= lo && lo <= this.options.max){
            this.values = [lo, hi];
        }
        else {
            this._leftInput.value = this.options.mode === 'integer' ? Math.round (this._lo) : this._lo.toFixed(1);
        }

        // this.dispatchEvent(new CustomEvent('change', { detail: [this._lo, this._hi]}));

        let event = document.createEvent('Event');
        event.initEvent('change', false, false);
        event.detail = [this._lo, this._hi];
        this.dispatchEvent(event);
        
        event.initEvent('stop', false, false);
        event.detail = [this._lo, this._hi];
        this.dispatchEvent(event);

    }
    _handleRightInput(e){
        const lo = this.options.mode === 'integer' ? parseInt(this._leftInput.value, 10) : parseFloat(this._leftInput.value);
        const hi = this.options.mode === 'integer' ? parseInt(this._rightInput.value, 10) : parseFloat(this._rightInput.value);
        if(!isNaN(hi) && this.options.min <= hi && hi <= this.options.max){
            this.values = [lo, hi];
        }
        else {
            this._rightInput.value = this.options.mode === 'integer' ?  Math.round (this._hi) : this._hi.toFixed(1);
        }

        // this.dispatchEvent(new CustomEvent('change', { detail: [this._lo, this._hi]}));

        let event = document.createEvent('Event');
        event.initEvent('change', false, false);
        event.detail = [this._lo, this._hi];
        this.dispatchEvent(event);
        
        event.initEvent('stop', false, false);
        event.detail = [this._lo, this._hi];
        this.dispatchEvent(event);
        
    }

    setValues(values) {

        this.values = values;

        this._leftInput.value = values[0];
        this._rightInput.value = values[1];
    }

}
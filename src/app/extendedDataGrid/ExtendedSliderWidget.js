import {SliderWidget} from 'scanex-slider-widget';


export default class ExtendedSliderWidget extends SliderWidget {

    set values ([lo, hi]){

        if (this.options.min <= lo && lo <= hi && hi <= this.options.max) {
            let { width, left } = this._bar.getBoundingClientRect();
            const leftRect = this._leftTick.getBoundingClientRect();
            const rightRect = this._rightTick.getBoundingClientRect();

            this._lo = lo;
            this._hi = hi;

            const k = (width - leftRect.width - rightRect.width) / (this.options.max - this.options.min);
            this._range.style.left = `${Math.round((this._lo - this.options.min) * k)}px`;            
            this._range.style.width = `${Math.round((this._hi - this._lo) * k) + leftRect.width + rightRect.width}px`;
        }        
        // this.dispatchEvent(new CustomEvent('change', { detail: [lo, hi]}));
    }

}
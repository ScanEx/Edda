import {SliderWidget} from 'scanex-slider-widget';


export default class ExtendedSliderWidget extends SliderWidget {

    constructor(...props) {

        super(...props);

        const parent = this._container.parentNode;

        this._leftInput = parent.querySelector('.min-input');
        this._rightInput = parent.querySelector('.max-input');

        this._leftInput.addEventListener('change', this._handleLeftInput.bind(this));
        this._rightInput.addEventListener('change', this._handleRightInput.bind(this));

        this._startDate = this.options.startDate || null;
        this._endDate = this.options.endDate || null;

        this.addEventListener('change', () => {
            this._startDate.setDate(new Date(this._lo));
            this._endDate.setDate(new Date(this._hi));
        });
    }

    _compareDates(one, two) {

        const oneDate = new Date(one);
        const twoDate = new Date(two);

        return oneDate.getDay() === twoDate.getDay() && oneDate.getMonth() === twoDate.getMonth() && oneDate.getYear() === twoDate.getYear();
    }

    _handleLeftInput(e){
        const lo = this._startDate.getDate();
        const hi = this._endDate.getDate();
        const loTime = lo.getTime();
        const hiTime = hi.getTime();

        if (this._compareDates(this._lo, loTime)) {
            return;
        }

        if (!isNaN(loTime) && this.options.min <= loTime && lo <= this.options.max) {
            this.values = [loTime, hiTime];
        }
        else {
            const prevLo = this._lo;
            const prevLoDate = new Date(prevLo);

            this._startDate.setDate(prevLoDate);
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
        const lo = this._startDate.getDate();
        const hi = this._endDate.getDate();
        const loTime = lo.getTime();
        const hiTime = hi.getTime();
        
        if (this._compareDates(this._hi, hiTime)) {
            return;
        }

        if(!isNaN(hiTime) && this.options.min <= hiTime && hiTime <= this.options.max){
            this.values = [loTime, hiTime];
        }
        else {
            const prevHi = this._hi;
            const prevHiDate = new Date(prevHi);

            this._endDate.setDate(prevHiDate);
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

    _updateBounds() {        
        const {width, left} = this._bar.getBoundingClientRect();        
        const leftRect = this._leftTick.getBoundingClientRect();
        const rightRect = this._rightTick.getBoundingClientRect();

        const k = (this.options.max - this.options.min) / (width - leftRect.width - rightRect.width);
        const lo = leftRect.left - left;
        this._lo = this.options.min + (lo * k) < this.options.min ? this.options.min : this.options.min + (lo * k);
        const hi = rightRect.left - rightRect.width - left;
        this._hi = this.options.min + (hi * k) > this.options.max ? this.options.max : this.options.min + (hi * k);
    }

}
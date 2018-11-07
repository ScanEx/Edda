import {SliderWidget} from 'scanex-slider-widget';


export default class ExtendedSliderWidget extends SliderWidget {

    constructor(...props) {

        super(...props);

        const parent = this._container.parentNode;

        this._leftNumber = parent.querySelector('.min-input');
        this._rightNumber = parent.querySelector('.max-input');

        this.addEventListener('change', () => {
            this._leftNumber.value = this._lo;
            this._rightNumber.value = this._hi;
        });
    }

}
import {SliderWidget} from 'scanex-slider-widget';


export default class ExtendedSliderWidget extends SliderWidget {

    constructor(...props) {

        super(...props);

        const parent = this._container.parentNode;

        this._leftNumber = parent.querySelector('.min-value');
        this._rightNumber = parent.querySelector('.max-value');

        this.addEventListener('change', () => {
            this._leftNumber.innerText = this._lo;
            this._rightNumber.innerText = this._hi;
        });
    }

}
import { EventTarget } from 'lib/EventTarget/src/EventTarget.js';
import './ImageDetails.css';
import { Translations } from 'lib/Translations/src/Translations.js';

window.Catalog.translations = window.Catalog.translations || new Translations();
let T = window.Catalog.translations

class ImageDetails extends EventTarget {
    constructor(container, {left, top}){ 
        super();       
        this._container = container;
        this._container.classList.add('image-info');
        this.stopPropagation = this.stopPropagation.bind(this);
        this._container.addEventListener('click', this.stopPropagation);
        this._left = left;
        this._top = top;    
        this.hide();
    } 
    stopPropagation(e) {
        e.stopPropagation();
    }   
    show (options = {left: this._left, top: this._top}) {
        let {left, top} = options;
        let header = document.body.querySelector('#header').getBoundingClientRect();
        let body = document.body.getBoundingClientRect();
        let above_top = value => top < header.top + header.height;
        let below_bottom = value => top + this._height > body.height - header.height;
        this._container.style.left =  `${left}px`;
        if (above_top (top)) {
            this._container.style.top = `${top + this._height}px`;
        }
        else {
            this._container.style.top = `${top}px`;
        }

        if (below_bottom (top)) {
            this._container.style.top = `${top - this._height}px`;
        }
        else {
            this._container.style.top = `${top}px`;
        }            
        this._container.style.visibility = 'visible';
        if (this.button) {
            this.button.classList.add('search-info-off');
            this.button.classList.remove('search-info-on');
        }

        // this.dispatchEvent(new CustomEvent('show', {
        //     detail: {item: this._item, button: this.button},
        // }));

        let event = document.createEvent('Event');
        event.initEvent('show', false, false);
        event.detail = {item: this._item, button: this.button};
        this.dispatchEvent(event);
    }
    hide() {
        this._container.style.visibility = 'hidden';
        if (this.button) {
            this.button.classList.remove('search-info-off');
            this.button.classList.add('search-info-on');
        }
        
        // this.dispatchEvent(new CustomEvent('hide', {
        //     detail: {item: this._item, button: this.button},
        // }));

        let event = document.createEvent('Event');
        event.initEvent('hide', false, false);
        event.detail = {item: this._item, button: this.button};
        this.dispatchEvent(event);
    }
    set item (value) {
        this._item = value;        
        this._container.innerHTML =
        `<table>
            <tbody>
                <tr>
                    <td class="image-info-id-label">ID:</td>
                    <td class="image-info-id-value">${this._item.sceneid}</td>
                </tr>
            </tbody>
        </table>`;         
    }
    get item () {
        return this._item;
    }
    get visible () {
        return this._container.style.visibility === 'visible';
    }
}

export { ImageDetails };
import Translations from 'scanex-translations';
import FloatingPanel from 'scanex-float-panel';

import { create_container, get_window_center } from '../Utils/Utils.js';

const T = Translations;

class UploadDialog {

    constructor ({drawingsProperties, clickCallback}) {

        this._drawingsProperties = drawingsProperties;
        this._clickCallback = clickCallback;

        this._onClickHandler = this._onClickHandler.bind(this);
        this._onChangeHandler = this._onChangeHandler.bind(this);

        this._init();
    }

    _init() {

        const dlgUploadContainer = create_container();

        dlgUploadContainer.classList.add('upload-dialog');
        const {left, top} = this._get_map_center();
        this._dialog = new FloatingPanel(dlgUploadContainer, { id: 'upload.dialog', left, top, modal: true });
        this._dialog.header.innerHTML = this._renderHeader();
        this._dialog.content.innerHTML = this._renderContent();
        this._dialog.footer.innerHTML = this._renderFooter();

        this._addDomEvents();
    
        this._dialog.show();
    }

    _destroy() {

        this._removeDomEvents();
        
        this._dialog._container.remove();
    }

    _addDomEvents() {

        const radioList = this._dialog.content.querySelectorAll('.item-radio');

        radioList.forEach(radio => {
            radio.addEventListener('change', this._onChangeHandler);
        });

        this._dialog.footer.querySelector('button').addEventListener('click', this._onClickHandler);
    }

    _removeDomEvents() {

        const radioList = this._dialog.content.querySelectorAll('.item-radio');

        radioList.forEach(radio => {
            radio.removeEventListener('change', this._onChangeHandler);
        });

        this._dialog.footer.querySelector('button').removeEventListener('click', this._onClickHandler);
    }

    _onChangeHandler(ev) {

        const {target} = ev;
        const radioName = target.getAttribute('name');
        const radioValue = target.value;

        this._changeDrawingData(radioName, radioValue);
    }

    _onClickHandler() {

        const data = this._drawingsProperties;

        if (data.length > 0) {
            this._clickCallback(data);
        }
    
        this._dialog.hide();
        this._destroy();
    }

    _changeDrawingData(name, value) {

        const drawings = this._drawingsProperties;

        for (let i = 0; i < drawings.length; i++) {
            let currentItem = drawings[i];
            if (currentItem['name'] === name) {
                currentItem['selectedName'] = value;
                this._drawingsProperties[i] = currentItem;
                return;
            }
        }
    }

    _get_map_center() {

        const headerBounds = document.getElementById('header').getBoundingClientRect();
        const {top, left} = get_window_center ();
        return {top: top + headerBounds.top + headerBounds.height, left};
    }

    _renderHeader () {

        const {_drawingsProperties: drawingsProperties = []} = this;

        return `<div class="header">${T.getText('alerts.' + (drawingsProperties.length > 0 ? 'addToDrawingsHeader' : 'wrongDrawings'))}</div>`;
    }

    _renderContent() {

        const {_drawingsProperties: drawingsProperties = []} = this;
        const content = drawingsProperties.length > 0 ? drawingsProperties.map((item) => this._renderItem(item)) : '';

        return `<div class="content">${content}</div>`
    }

    _renderItem(item) {

        const {name} = item;

        return `<div class="item-header">${name}</div><div class="item-data">${this._renderFields(item)}</div>`;
    }

    _renderFields(item) {

        const {name} = item;

        let result = [];

        let isFirst = true;
        for (let index in item) {

            const currentItem = item[index];
            const isSelected = isFirst ? 'checked="checked"' : '';
            if (isFirst) {
                isFirst = false;
            }

            if ( typeof (currentItem) !== 'object' && index !== 'selectedName' ) {
                result.push(
                    `<div class="item-container">
                        <input class="item-radio" value="${currentItem}" ${isSelected} type="radio" name="${name}" />
                        <span>${index}:</span>&nbsp;<span>${currentItem}</span>
                    </div>`
                );
            }
        }

        return result.join('');
    }

    _renderFooter() {

        const {_drawingsProperties: drawingsProperties = []} = this;

        return `<button class="dialog-upload-button">${T.getText('alerts.' + (drawingsProperties.length > 0 ? 'addToDrawings' : 'cancel'))}</button>`;
    }

}

export default UploadDialog;
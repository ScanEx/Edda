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
        const radioIndex = target.getAttribute('index');

        this._changeDrawingData(radioName, radioIndex);
    }

    _onClickHandler() {

        const data = this._drawingsProperties;

        if (data.length > 0) {
            this._clickCallback(data);
        }
    
        this._dialog.hide();
        this._destroy();
    }

    _changeDrawingData(name, index) {

        const drawings = this._drawingsProperties;

        const correctIndex = index === 'geometry' ? 'name' : index;

        for (let i = 0; i < drawings.length; i++) {
            let currentItem = drawings[i];
                
            const {geoJSON: {properties = {}}} = currentItem;

            currentItem['selectedName'] = properties[correctIndex];
            this._drawingsProperties[i] = currentItem;
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

        let renderedDrawingProperties = [];

        for (let i = 0; i < drawingsProperties.length; i++) {

            if (i > 0) {
                break;
            }

            const currentItem = drawingsProperties[i];
            renderedDrawingProperties.push(this._renderItem(currentItem));
        }

        const content = drawingsProperties.length > 0 ? renderedDrawingProperties.join('') : '';

        return `<div class="content">${content}</div>`
    }

    _renderItem(item) {

        const {name} = item;

        return `<div class="item-header">${name}</div><div class="item-data">${this._renderFields(item)}</div>`;
    }

    _renderFields(item) {

        const {itemId, geoJSON: {properties} = {}, name} = item;
        const fullProperties = Object.assign({'geometry': name}, properties);

        let result = [];

        let isFirst = true;
        for (let index in fullProperties) {

            const currentItem = fullProperties[index];
            
            if ( typeof (currentItem) !== 'object' ) {

                const isSelected = isFirst ? 'checked="checked"' : '';
                if (isFirst) {
                    isFirst = false;
                }

                result.push(
                    `<div class="item-container">
                        <input class="item-radio" index="${index}" value="${currentItem}" ${isSelected} type="radio" name="${itemId}" />
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
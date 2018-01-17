import './Progress.css';

window.Catalog.translations = window.Catalog.translations || new Translations();
let T = window.Catalog.translations;
T.addText ('rus', {
    progress: 'Загрузка...'
});
T.addText ('eng', {
    progress: 'Loading...'
});

class Progress {
    constructor (container) {
        this._container = container;
        this._container.classList.add('progress-widget');
        this._container.innerHTML = `<i></i><label>${T.getText('progress')}</label>`;
    }
    show () {
        this._container.querySelector('i').classList.add('progress-on');
    }
    hide () {
        this._container.querySelector('i').classList.remove('progress-on');
    }
}

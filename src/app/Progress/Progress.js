import Translations from 'scanex-translations';
import './Progress.css';

let T = Translations;
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

export default Progress;
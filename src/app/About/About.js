import { Panel } from 'lib/Leaflet.Panel/src/Panel.js';
import './About.css';

window.Catalog.translations = window.Catalog.translations || new Translations();
let T = window.Catalog.translations;

T.addText('rus', {
    about: {
        version: 'Версия',
        news: 'Что нового',
        help: 'Инструкция пользователя'
    },
    
});

T.addText('eng', {
    about: {
        version: 'Version',
        news: "What's new",        
        help: "User's guide"
    }
    
});

class About extends Panel {
    constructor (container, {text}) {
        super(container, {
            id: 'about.dialog',
            left: window.DIALOG_PLACE.left,
            top: window.DIALOG_PLACE.top,
            modal: true
        });
        this._text = text;
        this._container.classList.add('about-dialog');
        this._content.innerHTML = `<div class="logo-symbol-about"></div>        
        <div class="about-version">
            <div></div>
            <div>${T.getText('about.version')} ${window.Catalog.VERSION}</div>
            <div></div>
        </div>
        <div class="about-date">${moment(window.Catalog.VERSION_DATE).format('L')}</div>
        <div class="about-news">
            <div>${T.getText('about.news')}</div>
            <div><ul>${this._text.split(/\r?\n/g).map(x => `<li>${x}</li>`).join('')}</ul></div>
        </div>
        <div class="about-link">${T.getText('about.help')}</div>`;
        this._container.querySelector('.about-link').addEventListener('click', e => {
            window.open ('https://scanex.github.io/Documentation/Catalog/index.html', '_blank');
            this.hide();
        });
    }
}

export { About };
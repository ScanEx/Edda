import 'scanex-float-panel/dist/scanex-float-panel.css';
import FloatingPanel from 'scanex-float-panel';

import Translations from 'scanex-translations';
import { get_window_center } from '../../app/Utils/Utils.js';
import './About.css';

let T = Translations;

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

class About extends FloatingPanel {
    constructor (container, {text}) {
        const {left, top} = get_window_center();
        super(container, {id: 'about.dialog', left, top, modal: true});
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

export default About;
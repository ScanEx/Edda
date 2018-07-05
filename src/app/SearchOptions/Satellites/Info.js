import './Info.css';
import Translations from 'scanex-translations';

let T = Translations;

class Info {
    constructor (container) {
        this._container = container;
        this._container.classList.add('satellite-info');
        this._delay = 600;
        this._allowShow = false;
    }
    show(left, top) {
        this.render();
        this._container.style.left = `${left}px`;
        this._container.style.top = `${top}px`;
        this._allowShow = true;
        window.setTimeout (() => {
            if (this._allowShow) {
                this._container.style.display = 'block';
                this._allowShow = false;
            }            
        }, this._delay);        
    }
    hide () {
        this._allowShow = false;
        this._container.style.display = 'none';
    }
    render () {
        this._container.innerHTML = `<table cellspacing="0" cellpadding="0">
            <tbody>
                <tr>
                    <td>${T.getText('satellite.resolution')}:</td><td>${this._resolution}</td><td>${T.getText('resolution.unit')}</td>
                </tr>
                <tr>
                    <td>${T.getText('satellite.swath')}:</td><td>${this._swath}</td><td>${T.getText('units.km')}</td>
                </tr>                
            </tbody>
        </table>
        <div>${this._operator}</div>
        <div>${T.getText('satellite.since')} ${this._since}</div>`;
    }
    set resolution (value) {
        this._resolution = value;
    }
    set swath (value) {
        this._swath = value;
    }
    set operator (value) {
        this._operator = value;
    }
    set since (value) {
        this._since = value;
    }
}

export default Info;
import './Cart.css';
import { Panel } from 'lib/Leaflet.Panel/src/Panel.js';
import { getSatelliteName } from 'res/Satellites.js';
import { Translations } from 'lib/Translations/src/Translations.js';
import { create_container } from 'app/Utils/Utils.js';

window.Catalog.translations = window.Catalog.translations || new Translations();
let T = window.Catalog.translations

T.addText ('rus', {
    cart: {
        title: 'Корзина',
        clear: 'Очистить корзину',
        back: 'Назад',
        order: 'Перейти к оформлению заказа',        
        warning: 'Для редактирования контактной информации воспользуйтесь <a href="#">ссылкой</a>.\r\nПосле этого необходимо снова зайти в систему.',
        customer: 'Организация (заказчик)',
        project: {
            name: 'Название проекта',
            type: {
                title: 'Тип проекта',
                commercial: 'Коммерческий',
                internal: 'Внутренний',
                presale: 'Пресейл',
            },
            number: '№ Договора-контракта',
        },
        person: 'Имя и фамилия',        
        company: 'Компания',
        email: 'Электронная почта',
        comment: 'Комментарий',
        header: 'Оформление заказа',
        submit: 'Заказать',
        close: 'Закрыть',
        success: {
            header: 'Благодарим за оформление заказа!',
            content: 'На адрес электронной почты, указанный при регистрации было отправлено сообщение с ссылкой на детали заказа.',
            footer: 'В ближайшее время мы свяжемся с Вами и дадим подробную информацию о стоимости и характеристиках.',
        },
        invalid: 'Данное поле обязательно для заполнения'
    }
});

T.addText ('eng', {
    cart: {
        title: 'Cart',
        clear: 'Clear',
        back: 'Back',
        order: 'To order',        
        warning: 'To edit contact information use the link #. Afterwards it is necessary to login.',
        customer: 'Organization (customer)',
        project: {
            name: 'Project name',
            type: {
                title: 'Project type',
                commercial: 'Commercial',
                internal: 'Internal',
                presale: 'Presale',
            },
            number: 'Project number',
        },
        person: 'Name',
        company: 'Company',
        email: 'Email',
        comment: 'Comment',
        header: 'Place an order',
        submit: 'Submit',
        close: 'Close',
        success: {
            header: 'Thank you for order!',
            content: 'An email with the permanent link to your query has been sent to your address.',
            footer: 'We will soon send you more information concerning the cost and details.',
        },
        invalid: 'This field is required'
    }
});

class Cart extends Panel {
    constructor (container, {catalogResourceServer, left, top, cols = 2, imageWidth = 250, imageHeight = 250, internal = true }) {
        super(container, {id: 'panel.cart', title: T.getText('cart.header'), left, top, modal: true});
        this._catalogResourceServer = catalogResourceServer;
        this._body.classList.add('cart');
        this._cols = cols;
        this._internal = internal;
        this._link = 'http://my.kosmosnimki.ru/Home/Settings';              
        this._submit = this._submit.bind(this);
        this._imageWidth = imageWidth;
        this._imageHeight = imageHeight;
        this._items = [];
        this._permalink = '';
        this.hide();

        let dlgCartContainer = create_container();
        dlgCartContainer.classList.add('cart-dialog');
        this._dlgCart = new Panel(dlgCartContainer, {
            id: 'cart.dialog', 
            left: window.DIALOG_PLACE.left, 
            top: window.DIALOG_PLACE.top,
            modal: true
        });
        this._dlgCart.hide();
        this._dlgCart.content.innerHTML = 
        `<div>${T.getText('cart.success.header')}</div>
        <div>${T.getText('cart.success.content')}</div>
        <div>${T.getText('cart.success.footer')}</div>`;
        this._dlgCart.footer.innerHTML = `<button class="cart-close-button">${T.getText('cart.close')}</button>`;
        this._dlgCart.footer.querySelector('button').addEventListener('click', e => { this._dlgCart.hide(); });

        this._requiredFields =
        this._internal ? [
            '.cart-customer input', '.cart-project input', '.cart-project-number', '.cart-person input',
            '.cart-email input',
        ] : [
            '.cart-person input',
            '.cart-email input'
        ];
    }            
    get items () {
        return this._items;
    }
    set items (value) {
        this._items = value;
        this._view();
    }
    set permalink (value) {
        this._permalink = value;
    }
    get permalink () {
        return this._permalink;
    }     
    _view() {
        this._updateItemsNumber();
        const warning = T.getText('cart.warning').replace('#', this._link).replace(/\r\n/, '<br />');
        const userInfo = window.Catalog.userInfo;        
        this._content.innerHTML = `<div class="cart-order">
            <div class="cart-order-form">
                <div class="cart-order-warning">${warning}</div>
                <table>
                    <tbody>
                        <tr class="cart-customer">
                            <td>
                                <label>${T.getText('cart.customer')}</label>
                            </td>
                            <td>
                                <input type="text" value="" />
                            </td>
                            <td>${this._internal ? '*' : ''}</td>
                        </tr>
                        ${
                            this._internal ? 
                            `<tr class="cart-project">
                                <td>
                                    <label>${T.getText('cart.project.name')}</label>
                                </td>
                                <td>
                                    <input type="text" value="" />
                                </td>
                                <td>*</td>
                            </tr>
                            <tr class="cart-project-type">
                                <td>
                                    <label>${T.getText('cart.project.type.title')}</label>                                    
                                </td>
                                <td>
                                    <select>
                                        <option value="commercial">${T.getText('cart.project.type.commercial')}</option>
                                        <option value="internal">${T.getText('cart.project.type.internal')}</option>
                                        <option value="presale">${T.getText('cart.project.type.presale')}</option>
                                    </select>                                  
                                </td>
                                <td>*</td>
                            </tr>
                            <tr class="cart-project-number">
                                <td>
                                    <label>${T.getText('cart.project.number')}</label>
                                </td>
                                <td>
                                    <input type="text" class="cart-project-number" value="" />
                                </td>
                                <td>*</td>
                            </tr>` : ''
                        }
                        <tr class="cart-person">
                            <td>
                                <label>${T.getText('cart.person')}</label>
                            </td>
                            <td>
                                <input type="text" value="${userInfo.FullName}" />
                            </td>
                            <td>*</td>
                        </tr>
                        ${
                            this._internal ?
                            `<tr class="cart-company">
                                <td>
                                    <label>${T.getText('cart.company')}</label>
                                </td>
                                <td>
                                    <input type="text" readonly value="${userInfo.Organization}" />
                                </td>
                                <td></td>
                            </tr>` : ''
                        }
                        <tr class="cart-email">
                            <td>
                                <label>${T.getText('cart.email')}</label>
                            </td>
                            <td>
                                <input type="text" value="${userInfo.Email}" />
                            </td>
                            <td>*</td>
                        </tr>
                        <tr class="cart-comment">
                            <td>
                                <label>${T.getText('cart.comment')}</label>
                            </td>
                            <td>                            
                                <textarea maxlength="1000"></textarea>
                            </td>
                            <td>                                
                            </td>
                        </tr>                  
                    </tbody>
                </table>                
            </div>
            <div class="cart-order-footer">                
                <button class="cart-order-submit">${T.getText('cart.submit')}</button>
            </div>
        </div>`;            

        this._submitButton = this._content.querySelector('.cart-order-submit');        
        this._submitButton.addEventListener('click', this._submit);

        if (this._internal) {
            this._projectTypeSelect = this._content.querySelector('.cart-project-type select');            
            let update_project_number = () => {
                let field = this._content.querySelector('.cart-project-number')
                let input = field.querySelector('input');                
                let required = this._projectTypeSelect.value === 'commercial';
                input.readOnly = !required;
                field.querySelector('td:nth-child(3)').innerText = required ? '*' : '';
                if (input.readOnly) {
                    input.classList.add('read-only');
                }
                else {
                    input.classList.remove('read-only');
                }
            };
            update_project_number();
            this._projectTypeSelect.addEventListener('change', e => update_project_number());
        }        

        this.clear = this.clear.bind(this);        
                          
        this._requiredFields.forEach (s => {
            let el = this._container.querySelector(s === '.cart-project-number' ? s + ' input' : s);
            if (el) {
                el.addEventListener('focus', e => {                    
                    el.classList.remove('invalid-field');                    
                });
            }            
        });     
    }      
    get count () {
        return this.items.length;
    }
    _updateItemsNumber(){        
        let event = document.createEvent('Event');
        event.initEvent('items:change', false, false);
        event.detail = this.count;
        this.dispatchEvent(event);
    }   
    hide() {
        super.hide();        
        let event = document.createEvent('Event');
        event.initEvent('hide', false, false);
        this.dispatchEvent(event);
    }        
    _valid (s) {        
        if (this._internal && s === '.cart-project-number') {            
            switch (this._projectTypeSelect.value) {
                case 'commercial':
                    let el = this._container.querySelector(s + ' input');
                    if (el && el.value.trim() === '') {
                        el.classList.add ('invalid-field');
                        return false;
                    }
                    else {
                        el.classList.remove ('invalid-field');
                        return true;
                    }
                case 'internal':                    
                case 'presale':
                    return true;
                default:
                    return false;
            }            
        }
        let el = this._container.querySelector(s);
        if (el && el.value.trim() === '') {
            el.classList.add ('invalid-field');
            return false;
        }
        else {
            el.classList.remove ('invalid-field');
            return true;
        }
    }
    _validate () {
        return this._requiredFields
        .map(this._valid.bind(this))
        .every(s => s);
    }
    _getProjectType (type) {
        switch (type) {
            case 'commercial':
                return 'К';
            case 'internal':
                return 'ВН';
            case 'presale':
                return 'ПС';
            default:
                throw 'unknown project type';
        }
    }
    _submit(){                        
        if (this._validate()) {
            this._catalogResourceServer.sendPostRequest('CreateOrder.ashx', {
                TinyReference: this.permalink,
                ReceiveWay: '',
                Customer: this._container.querySelector('.cart-customer input').value,
                Project: this._internal ? this._container.querySelector('.cart-project input').value : '',
                ProjectType: this._getProjectType(this._internal ?  this._container.querySelector('.cart-project-type select').value : 'commercial'),
                ContractNumber: this._internal ? this._container.querySelector('input.cart-project-number').value : '',
                Name: '',
                Surname: this._container.querySelector('.cart-person input').value,
                Organization: this._internal ? this._container.querySelector('.cart-company input').value : '',
                Email: this._container.querySelector('.cart-email input').value,
                Phone: '',
                Comment: this._container.querySelector('.cart-comment textarea').value,
                Scenes: this.items.map(item => item.sceneid).join(','),
                Internal: this._internal,
            })
            .then(response => {      
                this.hide();
                if (response.Status === 'ok') {                    
                    this._dlgCart.show();
                }
                else {
                    console.log(response);
                }
            })
            .catch(e => {
                this.hide();
                console.log(e)
            });
        } 
    }
    clear () {
        this._items = [];
        this._view();
        this.hide();
    }
}

export { Cart };
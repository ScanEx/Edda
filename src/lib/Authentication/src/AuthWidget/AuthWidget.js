import { DropdownMenuWidget } from '../lib/DropdownWidget/src/DropdownMenuWidget.js';
import { EventTarget } from '../lib/EventTarget/src/EventTarget.js';
import '../assets/account.css';
import './AuthWidget.css';

const T = window.Catalog.Translations;

T.addText('rus', {
	auth: {
		'login': 'Войти',
		'logout': 'Выйти',
		'myAccount': 'Личный кабинет',
		'myMap': 'Личная карта',
		'closeDialog': 'Закрыть'
	}
});

T.addText('eng', {
	auth: {
		'login': 'Login',
		'logout': 'Logout',
		'myAccount': 'My account',
		'myMap': 'My map',
		'closeDialog': 'Close'
	}
});

class AuthWidget extends EventTarget {
    constructor(options) {
        super();
        this._view = document.createElement('div');
        this._view.classList.add('authWidget');

        this._authManager = options.authManager;
        this._userInfo = null;
        
        this._options = options;
        this._options.showAccountLink = true;
        this._options.accountLink = 'http://my.kosmosnimki.ru/Home/Settings/';
        this._options.showMapLink = true;

        this._authManager.getUserInfo()
        .then(response => {
            this._render({
                login: response.Result && response.Result.Login,
                userName: response.Result && (response.Result.FullName || response.Result.Nickname || response.Result.Login),
                nickName: response.Result.Nickname,
            });
            this._userInfo = response.Result;            
            let event = document.createEvent('Event');
            event.initEvent('ready', false, false);
            this.dispatchEvent(event);
        })
        .catch((response) => {
            this._render(response);
        });
        this._authManager.addEventListener('login', () => {            
            let event = document.createEvent('Event');
            event.initEvent('login', false, false);
            this.dispatchEvent(event);
        });
    }
    _render (vm) {
        this._view.innerHTML = vm.nickName ?
            `<div class="authWidget_authorized">
                <div class="authWidget-userPanel">
                    <div class="authWidget-userPanel-iconCell">
                        <div class="authWidget-userPanel-userIcon account account-user-logout"></div>
                    </div>
                    <div class="authWidget-userPanel-userMenuCell"></div>
                </div>
            </div>` : 
            `<div class="authWidget_unauthorized">
                <!-- div class="authWidget-loginButton">${T.getText('auth.login')}</div -->
                <div class="authWidget-loginButton account account-user-login"></div>
            </div>`;        

        if (vm.nickName) {
            var dropdownItems = [];

            if (this._options.showAccountLink) {
                dropdownItems.push({
                    title: T.getText('auth.myAccount'),
                    link: this._options.accountLink,
                    id: 'AuthWidgetAccountLink',
                    newWindow: true,
                    iconClass: 'account account-personal-area',
                });
            }

            if (this._options.showMapLink) {
                let defaultMapLink = `http://maps.kosmosnimki.ru/api/index.html?${encodeURIComponent('@' + vm.login)}`;
                dropdownItems.push({
                    title: T.getText('auth.myMap'),
                    link: this._options.mapLink || defaultMapLink,
                    id: 'AuthWidgetMapLink',
                    newWindow: true,
                    iconClass: 'account account-personal-map',
                });
            }

            dropdownItems.push({
                title: T.getText('auth.logout'),
                className: 'authWidget-logoutButton',
                iconClass: 'account account-exit',
            });

            var dropdownMenuWidget = new DropdownMenuWidget({
                items: [{
                    title: vm.nickName,
                    dropdown: dropdownItems
                }]
            });

            dropdownMenuWidget.appendTo(this._view.querySelector('.authWidget-userPanel-userMenuCell'));
        }


        let loginBtn = this._view.querySelector('.authWidget-loginButton');
        if (loginBtn) {
            loginBtn.addEventListener('click', e => {
                var $iframeContainer;
                // if (this._options.loginDialog) {

                //     $iframeContainer = document.createElement('div');
                //     $iframeContainer.classList.add('authWidget-iframeContainer');
                //     var dialog = $iframeContainer.dialog({
                //         width: 500,
                //         height: 450,
                //         closeText: T.getText('auth.closeDialog'),
                //         close: (je, ui) => {
                //             $(this).dialog('destroy');
                //         }
                //     });
                //     // HACK:
                //     let btn = $iframeContainer.querySelector('button.ui-button');
                //     if (btn) {
                //         btn.classList.add('ui-icon');
                //         btn.style.outline = 'none';
                //     }                                
                // }

                this._authManager.login({
                    iframeContainer: $iframeContainer && $iframeContainer[0]
                });
            });
        }
        

        let logoutBtn = this._view.querySelector('.authWidget-logoutButton');
        if(logoutBtn) {
            logoutBtn.addEventListener('click', e => {
                this._authManager.logout()
                .then(response => {
                    this._render(response);
                    this._userInfo = response.Result;                    
                    let event = document.createEvent('Event');
                    event.initEvent('logout', false, false);
                    this.dispatchEvent(event);
                });
            });
        }        
    }

    /** Получить информацию о пользователе, которую вернул AuthManager
     * @return {Object}
     */
    getUserInfo () {
        return this._userInfo;
    }

    appendTo (placeholder) {
        placeholder.appendChild(this._view);
    }
}

export { AuthWidget };
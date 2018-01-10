/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// identity function for calling harmony imports with the correct context
/******/ 	__webpack_require__.i = function(value) { return value; };
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 2);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.DropdownMenuWidget = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

__webpack_require__(3);

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var DropdownMenuWidget = function () {
    function DropdownMenuWidget(options) {
        _classCallCheck(this, DropdownMenuWidget);

        this._view = document.createElement('div');
        this._view.classList.add('dropdownMenuWidget');
        this._view.innerHTML = options.items.map(this._renderItem.bind(this)).join('');
        var dropDown = this._view.querySelector('.dropdownMenuWidget-itemDropdown');
        if (dropDown) {
            dropDown.style.display = 'none';
        }
        var mouseTimeout = options.mouseTimeout || 100;
        var items = this._view.querySelectorAll('.dropdownMenuWidget-item');

        var _loop = function _loop(i) {
            var mouseIsOver = false;
            items[i].addEventListener('mouseenter', function (je) {
                mouseIsOver = true;
                setTimeout(function () {
                    if (mouseIsOver) {
                        var dd = je.target.querySelector('.dropdownMenuWidget-itemDropdown');
                        if (dd) {
                            dd.style.display = 'block';
                        }
                    }
                }, 100);
            });
            items[i].addEventListener('mouseleave', function (je) {
                mouseIsOver = false;
                var dd = je.target.querySelector('.dropdownMenuWidget-itemDropdown');
                if (dd) {
                    dd.style.display = 'none';
                }
            });
        };

        for (var i = 0; i < items.length; ++i) {
            _loop(i);
        }
    }

    _createClass(DropdownMenuWidget, [{
        key: '_renderDropdown',
        value: function _renderDropdown(_ref) {
            var className = _ref.className,
                id = _ref.id,
                link = _ref.link,
                newWindow = _ref.newWindow,
                icon = _ref.icon,
                title = _ref.title;

            return '<li class="dropdownMenuWidget-dropdownMenuItem' + (className ? ' ' + className : '') + '">\n            ' + (newWindow ? '<div class="ui-icon ui-icon-newwin dropdownMenuWidget-dropdownMenuIcon"></div>' : '') + '\n            <a\n                ' + (id ? 'id="' + id + '"' : '') + '\n                ' + (link ? 'href="' + link + '"' : 'href="javascript:void(0)"') + '\n                ' + (newWindow & link ? 'target="_blank"' : '') + '\n                class="dropdownMenuWidget-dropdownItemAnchor' + (newWindow ? ' dropdownMenuWidget-dropdownItemAnchor_newWindow' : '') + '"\n            >\n                ' + (icon ? '<img src="' + icon + '"/>' : '') + '\n                ' + (title ? '<span>' + title + '</span>' : '') + '\n            </a>\n        </li>';
        }
    }, {
        key: '_renderItem',
        value: function _renderItem(_ref2) {
            var className = _ref2.className,
                id = _ref2.id,
                link = _ref2.link,
                newWindow = _ref2.newWindow,
                icon = _ref2.icon,
                fonticon = _ref2.fonticon,
                title = _ref2.title,
                dropdown = _ref2.dropdown;

            return '<div class="dropdownMenuWidget-item' + (className ? ' ' + className : '') + '">\n        <a\n            ' + (id ? 'id="' + id + '"' : '') + '\n            ' + (link ? 'href="' + link + '"' : 'href="javascript:void(0)"') + '\n            ' + (newWindow && link ? 'target="_blank"' : '') + '\n            class="dropdownMenuWidget-itemAnchor' + (newWindow ? ' dropdownMenuWidget-itemAnchor_newWindow' : '') + '"\n        >\n            ' + (icon ? '<img src="' + icon + '" />' : '') + '\n            ' + (fonticon ? '<i class="' + fonticon + '"></i>' : '') + '\n            ' + (title ? '<span>' + title + '</span>' + (dropdown ? '<i class="icon-angle-down"></i>' : '') : '') + '\n        </a>\n        ' + (dropdown ? '<div class="dropdownMenuWidget-itemDropdown">\
                <ul class="dropdownMenuWidget-dropdownMenu">' + dropdown.map(this._renderDropdown.bind(this)).join('') + '</ul>\
            </div>' : '') + '\n        </div>';
        }
    }, {
        key: 'appendTo',
        value: function appendTo(placeholder) {
            placeholder.appendChild(this._view);
        }
    }]);

    return DropdownMenuWidget;
}();

exports.DropdownMenuWidget = DropdownMenuWidget;

/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.DropdownWidget = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

__webpack_require__(4);

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// <String>options.title
// <String>options.className
// <String>options.trigger (hover|click|manual)
// <String>options.direction (down|up)
// <Boolean>options.adjustWidth
// <Boolean>options.showTopItem
var DropdownWidget = function () {
    function DropdownWidget(options) {
        var _this = this;

        _classCallCheck(this, DropdownWidget);

        this.options = Object.assign({
            title: '',
            trigger: 'hover',
            direction: 'down',
            adjustWidth: true,
            showTopItem: true,
            titleClassName: ''
        }, options);

        this.$el = this.options.el;
        this.$el.classList.add('dropdownWidget');
        this.$el.classList.add('dropdownWidget-item');

        this.$titleContainer = document.createElement('div');
        this.$titleContainer.classList.add('dropdownWidget-dropdownTitle');
        if (this.options.titleClassName) {
            this.$titleContainer.classList.add(this.options.titleClassName);
        }
        this.$titleContainer.innerHTML = this.options.title;
        this.$el.appendChild(this.$titleContainer);

        this.$dropdownContainer = document.createElement('div');
        this.$dropdownContainer.classList.add('dropdownWidget-dropdown');
        this.$dropdownContainer.style.display = 'none';
        this.$el.appendChild(this.$dropdownContainer);

        this.$dropdownTitle = document.createElement('div');
        this.$dropdownTitle.classList.add('dropdownWidget-item');
        this.$dropdownTitle.classList.add('dropdownWidget-dropdownTitle');
        if (options.titleClassName) {
            this.$dropdownTitle.classList.add(options.titleClassName);
        }
        this.$dropdownTitle.innerHTML = this.options.title;
        this.$dropdownContainer.appendChild(this.$dropdownTitle);

        if (!this.options.showTopItem) {
            this.$dropdownTitle.style.display = 'none';
        }

        if (this.options.trigger === 'hover') {
            this.$dropdownTitle.classList.add('ui-state-disabled');

            this.$titleContainer.addEventListener('mouseover', function () {
                return _this.expand();
            });
            this.$dropdownContainer.addEventListener('mouseleave', function () {
                return _this.collapse();
            });
        } else if (this.options.trigger === 'click') {
            this.$titleContainer.addEventListener('click', function () {
                return _this.expand();
            });
            this.$dropdownTitle.addEventListener('click', function () {
                return _this.collapse();
            });
        }

        if (this.options.direction === 'up') {
            this.$el.classList.add('dropdownWidget_direction-up');
        } else {
            this.$el.classList.add('dropdownWidget_direction-down');
        }

        this._items = {};
    }

    _createClass(DropdownWidget, [{
        key: 'addItem',
        value: function addItem(id, inst, position) {
            var _this2 = this;

            this._items[id] = inst;

            var $container = document.createElement('div');

            $container.classList.add('dropdownWidget-item');
            $container.classList.add('dropdownWidget-dropdownItem');
            $container.setAttribute('data-id', id);
            $container.setAttribute('data-position', position);
            $container.addEventListener('click', function (je) {
                if (typeof _this2.onItem === 'function') {
                    _this2.onItem(je.currentTarget.getAttribute('data-id'));
                    // this.trigger('item:' + $(je.currentTarget).attr('data-id'));
                    if (_this2.options.trigger === 'click') {
                        _this2.collapse();
                    }
                }
            });
            $container.appendChild(inst.el);
            this.$dropdownContainer.appendChild($container);
            this._sortItems();
        }
    }, {
        key: 'setTitle',
        value: function setTitle(title) {
            this.$titleContainer.innerHTML = title;
            this.$dropdownTitle.innerHTML = title;
        }
    }, {
        key: 'toggle',
        value: function toggle() {
            this._expanded ? this.collapse() : this.expand();
            this._expanded = !this._expanded;
        }
    }, {
        key: 'expand',
        value: function expand() {
            var r = this.$el.getBoundingClientRect();
            this.$dropdownContainer.style.minWidth = r.width + 'px';

            this.$dropdownContainer.style.display = 'block';
            if (typeof this.onExpand === 'function') {
                this.onExpand();
            }
        }
    }, {
        key: 'collapse',
        value: function collapse() {
            this.$dropdownContainer.style.display = 'none';
            if (typeof this.onCollapse === 'function') {
                this.onCollapse();
            }
        }
    }, {
        key: 'reset',
        value: function reset() {
            this.collapse();
        }
    }, {
        key: '_sortItems',
        value: function _sortItems() {
            var containerEl = this.$dropdownContainer[0];
            var items = Array.prototype.slice.call(containerEl.children);

            var titleEl = items.splice(items.indexOf(containerEl.querySelector('.dropdownWidget-dropdownTitle')), 1);

            while (items.length) {
                var maxPositionIndex = items.indexOf(_.max(items, function (el) {
                    return el.getAttribute('data-position') / 1;
                }));
                containerEl.insertBefore(items.splice(maxPositionIndex, 1)[0], containerEl.children[0]);
            }

            if (this.options.direction === 'up') {
                containerEl.appendChild(titleEl);
            } else {
                containerEl.insertBefore(titleEl, containerEl.children[0]);
            }
        }
    }]);

    return DropdownWidget;
}();

exports.DropdownWidget = DropdownWidget;

/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _DropdownWidget = __webpack_require__(1);

var _DropdownMenuWidget = __webpack_require__(0);

window.Scanex = window.Scanex || {};
window.Scanex.DropdownWidget = _DropdownWidget.DropdownWidget;
window.Scanex.DropdownMenuWidget = _DropdownMenuWidget.DropdownMenuWidget;

/***/ }),
/* 3 */
/***/ (function(module, exports) {

// removed by extract-text-webpack-plugin

/***/ }),
/* 4 */
/***/ (function(module, exports) {

// removed by extract-text-webpack-plugin

/***/ })
/******/ ]);
//# sourceMappingURL=dropdownWidget.js.map
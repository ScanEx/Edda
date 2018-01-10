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
/******/ 	return __webpack_require__(__webpack_require__.s = 8);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
    value: true
});
var uniqueGlobalName = function () {
    var freeid = 0;
    return function (thing) {
        var id = "gmx_unique_" + freeid++;
        window[id] = thing;
        return id;
    };
}();

/** Посылает кросс-доменный GET запрос к серверу с использованием транспорта JSONP.
 *
 * @memberOf nsGmx.Utils
 * @param {String} url URL сервера.
 * @param {Function} callback Ф-ция, которая будет вызвана при получении от сервера результата.
 * @param {String} [callbackParamName=CallbackName] Имя параметра для задания имени ф-ции ответа.
 * @param {Function} [errorCallback] Ф-ция, которая будет вызвана в случае ошибки запроса к серверу
 */
function sendCrossDomainJSONRequest(url, callback, callbackParamName, errorCallback) {
    callbackParamName = callbackParamName || 'CallbackName';

    var script = document.createElement("script");
    script.setAttribute("charset", "UTF-8");
    var callbackName = uniqueGlobalName(function (obj) {
        callback && callback(obj);
        window[callbackName] = false;
        document.getElementsByTagName("head").item(0).removeChild(script);
    });

    var sepSym = url.indexOf('?') == -1 ? '?' : '&';

    if (errorCallback) {
        script.onerror = errorCallback;
    }

    script.setAttribute("src", "" + url + sepSym + callbackParamName + "=" + callbackName + "&" + Math.random());
    document.getElementsByTagName("head").item(0).appendChild(script);
}

exports.sendCrossDomainJSONRequest = sendCrossDomainJSONRequest;

/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
    value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

function chain(tasks, state) {
    return tasks.reduce(function (prev, next) {
        return prev.then(next);
    }, new Promise(function (resolve, reject) {
        return resolve(state);
    }));
}

function create_container() {
    var container = document.createElement('div');
    document.body.appendChild(container);
    return container;
}

function _f(arr, acc, swap) {
    if (arr.length) {
        var r = [];
        for (var i = 0, len = arr.length; i < len; i++) {
            var a = arr[i];
            if (_f(a, acc, swap)) {
                if (swap) {
                    r.unshift(a);
                } else {
                    r.push(a);
                }
            }
        }
        if (r.length) {
            acc.push(r);
        }
        return false;
    } else {
        return true;
    }
}

function flatten(arr, swap) {
    var acc = [];
    _f(arr, acc, swap);
    return acc;
}

function split_complex_id(complexId) {
    var separatorIndex = complexId.lastIndexOf('!');
    return separatorIndex > 0 ? { id: complexId.substring(0, separatorIndex),
        productId: complexId.substring(separatorIndex + 1, complexId.length)
    } : { id: complexId };
}

function build_complex_id(id, productId) {
    return productId ? id + '!' + productId : id;
}

function hex(number) {
    var width = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 6;

    var h = number.toString(16);
    while (h.length < width) {
        h = '0' + h;
    }
    return h.toUpperCase();
}

function unhex(str) {
    return parseInt(str.substr(1), 16);
}

function is_geometry(obj) {
    var type = obj.type;

    switch (type) {
        case 'Point':
        case 'MultiPoint':
        case 'LineString':
        case 'MultiLineString':
        case 'Polygon':
        case 'MultiPolygon':
        case 'GeometryCollection':
            return true;
        default:
            return false;
    }
}

function normalize_geometry_type(geometry) {
    var type = geometry.type;

    switch (type.toUpperCase()) {
        case 'POINT':
            geometry.type = 'Point';
            break;
        case 'MULTIPOINT':
            geometry.type = 'MultiPoint';
            break;
        case 'LINESTRING':
            geometry.type = 'LineString';
            break;
        case 'MULTILINESTRING':
            geometry.type = 'MultiLineString';
            break;
        case 'POLYGON':
            geometry.type = 'Polygon';
            break;
        case 'MULTIPOLYGON':
            geometry.type = 'MultiPolygon';
            break;
        case 'GEOMETRYCOLLECTION':
            geometry.type = 'GeometryCollection';
            break;
        default:
            break;
    }
    return geometry;
}

function is_geojson_feature(obj) {
    var type = obj.type,
        geometry = obj.geometry,
        properties = obj.properties;

    if (type !== 'Feature') {
        console.log('geojson feature test failed: provided type is not a "Feature" object', obj);
        return false;
    }
    if (!is_geometry(geometry)) {
        console.log('geojson feature test failed: geometry is of wrong type', geometry);
        return false;
    }
    return true;
}

function get_type_of_value(value) {
    switch (typeof value === 'undefined' ? 'undefined' : _typeof(value)) {
        case 'number':
            return Number.isInteger(value) ? 'Integer' : 'Float';
        case 'boolean':
            return 'Boolean';
        case 'string':
        default:
            return 'String';
    }
}

function convert_date(item, fields) {
    for (var k in fields) {
        var field = fields[k];
        if (field.type === 'date') {
            item[k] = new Date(item[k]);
        }
    }
    return item;
}

function from_gmx(_ref) {
    var fields = _ref.fields,
        values = _ref.values,
        types = _ref.types;
    var convertMercator = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;

    return values.map(function (x) {
        var item = fields.reduce(function (a, k, i) {
            switch (types[i]) {
                default:
                    a[k] = x[i];
                    break;
                case 'date':
                    switch (_typeof(x[i])) {
                        case 'string':
                            a[k] = new Date(x[i]);
                            break;
                        case 'number':
                            a[k] = new Date(x[i] * 1000);
                            break;
                        default:
                            break;
                    }
                    break;
                case 'time':
                    break;
                case 'geometry':
                    a[k] = L.gmxUtil.geometryToGeoJSON(x[i], convertMercator);
                    break;
            }
            switch (k) {
                case 'stereo':
                    var s = x[i];
                    a.stereo = typeof s === 'string' && s !== 'NONE';
                    break;
                default:
                    break;
            }
            return a;
        }, {});
        if (item.geomixergeojson) {
            item.geoJSON = item.geomixergeojson;
            delete item.geomixergeojson;
        }
        item.url = 'http://search.kosmosnimki.ru/QuickLookImage.ashx?id=' + item.sceneid;
        return item;
    });
}

function normalize_geometries(lng, objects) {
    for (var i = 0, len = objects.length; i < len; i++) {
        normalize_geometry(lng, objects[i].geometry);
        fix_anchors(lng, objects[i]);
    }
}

function normalize_ring(lng, coordinates) {
    for (var i = 0; i < coordinates.length; ++i) {
        var d = get_correction(lng, coordinates[i][0]);
        if (d) {
            coordinates[i][0] += d;
        }
    }
}

function normalize_polygon(lng, coordinates) {
    for (var i = 0; i < coordinates.length; ++i) {
        normalize_ring(lng, coordinates[i]);
    }
}

function normalize_geometry(lng, geometry) {
    switch (geometry.type) {
        case 'Polygon':
            normalize_polygon(lng, geometry.coordinates);
            break;
        case 'MultiPolygon':
            for (var i = 0; i < geometry.coordinates.length; ++i) {
                normalize_polygon(lng, geometry.coordinates[i]);
            }
            break;
        default:
            break;
    }
}

function fix_anchors(lng, object) {
    for (var i = 0; i <= 4; ++i) {
        var d = get_correction(lng, object['x' + i]);
        if (d) {
            object['x' + i] += d;
        }
    }
}

function get_correction(lon, x) {
    var d1 = Math.abs(lon - x),
        d2 = Math.abs(lon - (x + 360));
    if (d1 <= d2) {
        return 0;
    } else {
        return 360;
    }
}

function get_bbox(geometry) {
    var type = geometry.type,
        coordinates = geometry.coordinates;

    var lon = 0,
        lat = 0;
    var sorter = function sorter(a, b) {
        if (a > b) {
            return 1;
        }
        if (a < b) {
            return -1;
        }
        return 0;
    };
    var rings = function rings(coords) {
        var _coords$reduce = coords.reduce(function (a, _ref2) {
            var _ref3 = _slicedToArray(_ref2, 2),
                x = _ref3[0],
                y = _ref3[1];

            a.xs.push(x);
            a.ys.push(y);
            return a;
        }, { xs: [], ys: [] }),
            xs = _coords$reduce.xs,
            ys = _coords$reduce.ys;

        xs = xs.sort(sorter);
        ys = ys.sort(sorter);
        var xmin = xs[0];
        var xmax = xs[xs.length - 1];
        var ymin = ys[0];
        var ymax = ys[ys.length - 1];
        return [[xmin, ymax], [xmax, ymax], [xmax, ymin], [xmin, ymin]];
    };
    switch (type.toUpperCase()) {
        case 'POINT':
            var _coordinates = _slicedToArray(coordinates, 2);

            lon = _coordinates[0];
            lat = _coordinates[1];

            return [[lon, lat], [lon, lat], [lon, lat], [lon, lat]];
        case 'MULTIPOINT':
        case 'LINESTRING':
            return rings(coordinates);
        case 'POLYGON':
            return rings(coordinates[0]);
        case 'MULTILINESTRING':
        case 'MULTIPOLYGON':
            var _coordinates$reduce = coordinates.reduce(function (a, coords) {
                var _rings = rings(coords[0]),
                    _rings2 = _slicedToArray(_rings, 4),
                    _rings2$ = _slicedToArray(_rings2[0], 2),
                    x1 = _rings2$[0],
                    y1 = _rings2$[1],
                    _rings2$2 = _slicedToArray(_rings2[1], 2),
                    x2 = _rings2$2[0],
                    y2 = _rings2$2[1],
                    _rings2$3 = _slicedToArray(_rings2[2], 2),
                    x3 = _rings2$3[0],
                    y3 = _rings2$3[1],
                    _rings2$4 = _slicedToArray(_rings2[3], 2),
                    x4 = _rings2$4[0],
                    y4 = _rings2$4[1];

                a.xs.push(x1);
                a.xs.push(x2);
                a.xs.push(x3);
                a.xs.push(x4);
                a.ys.push(y1);
                a.ys.push(y2);
                a.ys.push(y3);
                a.ys.push(y4);
                return a;
            }, { xs: [], ys: [] }),
                xs = _coordinates$reduce.xs,
                ys = _coordinates$reduce.ys;

            xs = xs.sort(sorter);
            ys = ys.sort(sorter);
            var xmin = xs[0];
            var xmax = xs[xs.length - 1];
            var ymin = ys[0];
            var ymax = ys[ys.length - 1];
            return [[xmin, ymax], [xmax, ymax], [xmax, ymin], [xmin, ymin]];
        default:
            break;
    }
}

exports.chain = chain;
exports.create_container = create_container;
exports.flatten = flatten;
exports.split_complex_id = split_complex_id;
exports.unhex = unhex;
exports.hex = hex;
exports.is_geojson_feature = is_geojson_feature;
exports.is_geometry = is_geometry;
exports.get_type_of_value = get_type_of_value;
exports.from_gmx = from_gmx;
exports.normalize_geometries = normalize_geometries;
exports.normalize_geometry = normalize_geometry;
exports.get_bbox = get_bbox;
exports.normalize_geometry_type = normalize_geometry_type;

/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.getResourceServer = exports.getAuthManager = undefined;

var _ResourceServer = __webpack_require__(5);

var _AuthManager = __webpack_require__(4);

var resourceServersInstances = {};
var resourceServersConstructors = {};
var authManager = void 0;

// строка, в которой перечислены псевдонимы используемых нами серверов ресурсов.
// потребуется для синхронизации серверов ресурсов
var scope = void 0;

// зашиваем известные и часто-используемые ресурсы
resourceServersConstructors['subscriptions'] = function () {
    return new _ResourceServer.ResourceServer(authManager, {
        id: 'subscriptions',
        root: 'http://fires.kosmosnimki.ru/SAPIv2'
    });
};

resourceServersConstructors['geomixer2'] = function () {
    return new _ResourceServer.ResourceServer(authManager, {
        id: 'geomixer2',
        root: 'http://maps2.kosmosnimki.ru'
    });
};

resourceServersConstructors['geomixer'] = function () {
    return new _ResourceServer.ResourceServer(authManager, {
        id: 'geomixer',
        root: 'http://maps.kosmosnimki.ru'
    });
};

resourceServersConstructors['geocode'] = function () {
    return new _ResourceServer.ResourceServer(authManager, {
        id: 'geocode',
        root: 'http://geocode.kosmosnimki.ru'
    });
};

function getResourceServer(id) {
    if (!authManager) {
        authManager = getAuthManager();
    }
    // используем lazy instantiation для отложенного создания
    // необходимых нам компонентов
    if (!resourceServersInstances[id]) {
        resourceServersInstances[id] = resourceServersConstructors[id]();
        if (!scope) {
            scope = id;
        } else {
            scope += ',' + id;
        }
    }
    return resourceServersInstances[id];
}

function getAuthManager() {
    // то же и с authManager
    if (!authManager) {
        authManager = new _AuthManager.AuthManager({
            authorizationEndpoint: 'http://my.kosmosnimki.ru/Test/LoginDialog',
            userInfoEndpoint: 'http://my.kosmosnimki.ru/oAuth/LoginDialog',
            redirectEndpointHtml: location.href.replace(/[^\/]+$/, '') + 'oAuth2/oAuthCallback.htm',
            redirectEndpointAshx: location.href.replace(/[^\/]+$/, '') + 'oAuth2/oAuthCallback.ashx',
            credentialLoginEndpoint: 'http://my.kosmosnimki.ru/Handler/Login'
        });
    }
    return authManager;
}

exports.getAuthManager = getAuthManager;
exports.getResourceServer = getResourceServer;

/***/ }),
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
    value: true
});
var uniqueGlobalName = function () {
    var freeid = 0;
    return function (thing) {
        var id = "gmx_unique_" + freeid++;
        window[id] = thing;
        return id;
    };
}();

/** Посылает кросс-доменный GET запрос к серверу с использованием транспорта JSONP.
 *
 * @memberOf nsGmx.Utils
 * @param {String} url URL сервера.
 * @param {Function} callback Ф-ция, которая будет вызвана при получении от сервера результата.
 * @param {String} [callbackParamName=CallbackName] Имя параметра для задания имени ф-ции ответа.
 * @param {Function} [errorCallback] Ф-ция, которая будет вызвана в случае ошибки запроса к серверу
 */
function sendCrossDomainJSONRequest(url, callback, callbackParamName, errorCallback) {
    callbackParamName = callbackParamName || 'CallbackName';

    var script = document.createElement("script");
    script.setAttribute("charset", "UTF-8");
    var callbackName = uniqueGlobalName(function (obj) {
        callback && callback(obj);
        window[callbackName] = false;
        document.getElementsByTagName("head").item(0).removeChild(script);
    });

    var sepSym = url.indexOf('?') == -1 ? '?' : '&';

    if (errorCallback) {
        script.onerror = errorCallback;
    }

    script.setAttribute("src", "" + url + sepSym + callbackParamName + "=" + callbackName + "&" + Math.random());
    document.getElementsByTagName("head").item(0).appendChild(script);
}

exports.sendCrossDomainJSONRequest = sendCrossDomainJSONRequest;

/***/ }),
/* 4 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.AuthManager = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _Request = __webpack_require__(0);

var _EventTarget2 = __webpack_require__(7);

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var AuthManager = function (_EventTarget) {
    _inherits(AuthManager, _EventTarget);

    function AuthManager(_ref) {
        var authorizationEndpoint = _ref.authorizationEndpoint,
            userInfoEndpoint = _ref.userInfoEndpoint,
            redirectEndpointHtml = _ref.redirectEndpointHtml,
            redirectEndpointAshx = _ref.redirectEndpointAshx,
            credentialLoginEndpoint = _ref.credentialLoginEndpoint,
            clientId = _ref.clientId;

        _classCallCheck(this, AuthManager);

        // поддерживаем как минимум два события для
        // серверов ресурсов: login и logout
        var _this = _possibleConstructorReturn(this, (AuthManager.__proto__ || Object.getPrototypeOf(AuthManager)).call(this));

        _this._authorizationEndpoint = authorizationEndpoint;
        _this._userInfoEndpoint = userInfoEndpoint;
        _this._redirectEndpointHtml = redirectEndpointHtml;
        _this._redirectEndpointAshx = redirectEndpointAshx;
        _this._redirectEndpointAshx2 = redirectEndpointAshx + '/?return_url=' + location.href;
        _this._credentialLoginEndpoint = credentialLoginEndpoint;
        _this._resourceServers = [];
        _this._clientId = clientId || 1;
        return _this;
    }

    _createClass(AuthManager, [{
        key: '$getAntiCsrfToken',
        value: function $getAntiCsrfToken() {
            var cookieName = "sync";
            var re = new RegExp('.*' + cookieName + '=([^;]+).*', 'i');
            return document.cookie.replace(re, '$1');
        }
        /** Добавляет сервер ресурсов
         * Должна вызываться только из класса ResourceServer.
         * @param {ResourceServer} resourceServer
         */

    }, {
        key: '$addResourceServer',
        value: function $addResourceServer(resourceServer) {
            this._resourceServers.push(resourceServer);
        }
    }, {
        key: '_chain',
        value: function _chain(tasks, state) {
            return tasks.reduce(function (prev, next) {
                return prev.then(next);
            }, new Promise(function (resolve, reject) {
                return resolve(state);
            }));
        }
    }, {
        key: '_authorizeResourceServers',
        value: function _authorizeResourceServers() {
            var tasks = this._resourceServers.map(function (rs) {
                return function (state) {
                    return new Promise(function (resolve) {
                        rs.sendGetRequest('oAuth2/LoginDialog.ashx').then(function (response) {
                            state = state.concat(response);
                            resolve(state);
                        }).catch(function (e) {
                            return state.push(e);
                        });
                    });
                };
            });
            return this._chain(tasks, []);
        }
    }, {
        key: '_processAuthorization',
        value: function _processAuthorization(search) {
            var _this2 = this,
                _arguments = arguments;

            function parseQueryString(search) {
                var a = search.slice(1).split('&');
                var o = {};
                for (var i = 0; i < a.length; i++) {
                    var s = a[i].split('=');
                    o[s[0]] = s[1];
                }
                return o;
            }
            return new Promise(function (resolve, reject) {
                // превращаем строку с параметрами в хеш
                var params = parseQueryString(search);

                if (params.error) {
                    reject({
                        Status: 'auth',
                        Result: null,
                        Error: {
                            message: params.error
                        }
                    });
                } else {
                    (0, _Request.sendCrossDomainJSONRequest)('' + _this2._redirectEndpointAshx + search, function (resp) {
                        if (resp.Status === 'ok') {
                            resolve({
                                Status: 'ok',
                                Result: resp.Result
                            });
                        } else {
                            reject({
                                Status: resp.Status,
                                Result: null
                            });
                        }
                    }, 'CallbackName', function () {
                        reject({
                            Status: 'network',
                            Result: null,
                            Error: {
                                message: _arguments[2]
                            }
                        });
                    });
                }
            });
        }
        /** Получение информации о пользователе от AuthServer
         * @return {Function} promise(userInfo)
         */

    }, {
        key: 'getUserInfo',
        value: function getUserInfo() {
            var _this3 = this;

            if (this._getUserInfoDeferred) {
                return this._getUserInfoDeferred;
            }
            return this._getUserInfoDeferred = new Promise(function (resolve, reject) {

                function authorizationGrant(search) {
                    // удаляем айфрейм и глобальную переменную
                    setTimeout(function () {
                        delete window.authorizationGrant;
                        document.body.removeChild(document.body.querySelector('.authorizationIframe'));
                    }, 0);

                    this._processAuthorization(search).then(function (resp) {
                        return resolve(resp);
                    }, function (err) {
                        return reject(err);
                    });
                }

                // посылаем запросы на все сервера ресурсов
                // когда они все ответят ..
                _this3._authorizeResourceServers().then(function (servers) {
                    // .. формируем параметры state и scope
                    var scope = '';
                    var state = '';
                    for (var i = 0; i < servers.length; i++) {
                        var response = servers[i];
                        scope += response.Service.ServerId + ',';
                        state += response.Result.State + ',';
                    }
                    scope = scope.slice(0, -1);
                    state = state.slice(0, -1);

                    // .. и посылаем запрос на сервер авторизации
                    window.authorizationGrant = authorizationGrant.bind(_this3);
                    document.body.insertAdjacentHTML('afterbegin', '<iframe\n                    class="authorizationIframe"\n                    style="display: block !important; position: absolute; left: -99999px;"\n                    src="' + _this3._userInfoEndpoint + '/?client_id=1&redirect_uri=' + _this3._redirectEndpointHtml + '&scope=' + scope + '&state=' + state + '">\n                </iframe>');
                }).catch(function () {
                    reject({
                        Status: 'error'
                    });
                });
            });
        }
        /** Принудительное перелогинивание пользователя.
         * Пользователь должен увидеть поля для ввода
         * логина/пароля (возможно, на сервере авторизации).
         * При успешной авторизации библиотека должна
         * произвести авторизацию пользователя на всех
         * подключенных серверах ресурсов
         * и только после этого resolve promise
         * @return {Function} promise(userInfo)
         */

    }, {
        key: 'login',
        value: function login(arg) {
            var _this4 = this;

            var foreignServer = void 0;
            var iframeContainer = void 0;
            if (typeof arg === 'string') {
                // обратная совместимость
                foreignServer = arg;
            } else if ((typeof arg === 'undefined' ? 'undefined' : _typeof(arg)) === 'object') {
                foreignServer = arg.foreignServer;
                iframeContainer = arg.iframeContainer;
            }

            this._authorizeResourceServers().then(function (servers) {
                // .. формируем параметры state и scope
                var scope = '';
                var state = '';
                for (var i = 0; i < servers.length; i++) {
                    var response = servers[i];
                    scope += response.Service.ServerId + ',';
                    state += response.Result.State + ',';
                }
                scope = scope.slice(0, -1);
                state = state.slice(0, -1);

                var authUrl = _this4._authorizationEndpoint + '/?client_id=1&redirect_uri=' + _this4._redirectEndpointAshx2 + '&scope=' + scope + '&state=' + state;

                if (foreignServer) {
                    authUrl += '&authserver=' + foreignServer;
                }

                if (!iframeContainer) {
                    window.open(authUrl, '_self');
                } else {
                    var authorizationGrant = function authorizationGrant() {
                        window.location.reload();
                        var event = document.createEvent('Event');
                        event.initEvent('login', false, false);
                        this.dispatchEvent(event);
                    };

                    window.authorizationGrant = authorizationGrant;
                    document.body.removeChild(document.body.querySelector('.authorizationIframe'));
                    document.body.insertAdjacentHTML('afterbegin', '<iframe\n                    class="authorizationIframe"\n                    src="' + self._authorizationEndpoint + '/?client_id=1\n                        &redirect_uri=' + self._redirectEndpointHtml + '\n                        &redirect_uri_alt=' + self._redirectEndpointAshx2 + '\n                        &scope=' + scope + '\n                        &state=' + state + '">\n                </iframe>');
                }
            });
        }
        /** Залогиниться, используя логин и пароль
         * @param  {String} login
         * @param  {String} password
         * @return {Promise}
         */

    }, {
        key: 'loginWithCredentials',
        value: function loginWithCredentials(login, password) {
            var _this5 = this,
                _arguments2 = arguments;

            // отправляем ajax-запрос на Handler/Login с логином и паролем
            // После этого пользователь считается залогиненным на my.
            // Затем вызываем getUserInfo()

            return new Promise(function (resolve, reject) {
                (0, _Request.sendCrossDomainJSONRequest)(_this5._credentialLoginEndpoint + '?login=' + encodeURIComponent(login) + '&password=' + encodeURIComponent(password), function (response) {
                    if (response.Status.toLowerCase() === 'ok') {
                        _this5.getUserInfo().then(function () {
                            resolve({
                                Status: 'ok',
                                Result: _arguments2[0].Result
                            });
                        }).catch(function () {
                            reject({
                                Status: 'error',
                                Result: {
                                    Message: 'authorization error'
                                }
                            });
                        });
                    } else if (response.Status.toLowerCase() === 'auth') {
                        reject({
                            Status: 'auth',
                            Result: {
                                Message: response.Result.Message
                            }
                        });
                    } else {
                        reject({
                            Status: 'error',
                            Result: {
                                Message: 'unknown error'
                            }
                        });
                    }
                }, 'CallbackName', function () {
                    reject({
                        Status: 'network',
                        Result: {
                            Message: 'network error'
                        }
                    });
                });
            });
        }
        /** Принудительное разлогинивание пользователя.
         * В том числе и на серверах ресурсов
         * @return {Function} promise(status)
         */

    }, {
        key: 'logout',
        value: function logout() {
            var _this6 = this;

            return new Promise(function (resolve, reject) {
                var promises = [];
                for (var i = 0; i < _this6._resourceServers.length; i++) {
                    var resourceServer = _this6._resourceServers[i];
                    var promise = resourceServer.sendGetRequest('oAuth2/Logout.ashx');
                    promises.push(promise);
                }
                _this6._chain(promises, {}).then(function () {
                    if (_this6._clientId === 1) {
                        (0, _Request.sendCrossDomainJSONRequest)('http://my.kosmosnimki.ru/Handler/Logout', function (response) {
                            return resolve({ Status: 'ok' });
                        }, '', function () {
                            return reject({ Status: 'network' });
                        });
                    } else {
                        resolve({
                            Status: 'ok'
                        });
                        var event = document.createEvent('Event');
                        event.initEvent('logout', false, false);
                        _this6.dispatchEvent(event);
                    }
                }).catch(function () {
                    reject({
                        Status: 'error'
                    });
                });
            });
        }
    }]);

    return AuthManager;
}(_EventTarget2.EventTarget);

exports.AuthManager = AuthManager;

/***/ }),
/* 5 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.ResourceServer = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _Server2 = __webpack_require__(6);

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var ResourceServer = function (_Server) {
    _inherits(ResourceServer, _Server);

    function ResourceServer(authManager, _ref) {
        var id = _ref.id,
            root = _ref.root;

        _classCallCheck(this, ResourceServer);

        var _this = _possibleConstructorReturn(this, (ResourceServer.__proto__ || Object.getPrototypeOf(ResourceServer)).call(this, { root: root }));

        _this._id = id;
        _this._authManager = authManager;
        _this._authManager.$addResourceServer(_this);
        // this.sendGetRequest = this.extendRequestMethod('sendGetRequest');
        // this.sendImageRequest = this.extendRequestMethod('sendImageRequest');
        // this.sendPostRequest = this.extendRequestMethod('sendPostRequest');
        return _this;
    }
    // extendRequestMethod (requestFuncName) {
    //     return function(url, params, baseForm) {
    //         let params = params || {};
    //         params.sync = this._authManager.$getAntiCsrfToken();
    //         return new Promise((resolve, reject) => {
    //             super[requestFuncName].call(this, url, params, baseForm)
    //             .then(data => {
    //                 data.Service = { ServerId: self._id };                    
    //                 if (data.Status === 'ok') {
    //                     resolve(data);
    //                 } else {
    //                     reject(data);
    //                 }
    //             })
    //             .catch(errors => {
    //                 reject({
    //                     Status: 'error',
    //                     ErrorInfo: errors.ErrorInfo
    //                 });
    //             });
    //         });                    
    //     }
    // }


    _createClass(ResourceServer, [{
        key: 'sendGetRequest',
        value: function sendGetRequest(url, params, baseForm) {
            var _this2 = this;

            params = params || {};
            params.sync = this._authManager.$getAntiCsrfToken();
            return new Promise(function (resolve, reject) {
                _get(ResourceServer.prototype.__proto__ || Object.getPrototypeOf(ResourceServer.prototype), 'sendGetRequest', _this2).call(_this2, url, params, baseForm).then(function (data) {
                    data.Service = { ServerId: _this2._id };
                    if (data.Status === 'ok') {
                        resolve(data);
                    } else {
                        reject(data);
                    }
                }).catch(function (errors) {
                    return reject({ Status: 'error', ErrorInfo: errors.ErrorInfo });
                });
            });
        }
    }, {
        key: 'sendImageRequest',
        value: function sendImageRequest(url, params, baseForm) {
            var _this3 = this;

            params = params || {};
            params.sync = this._authManager.$getAntiCsrfToken();
            return new Promise(function (resolve, reject) {
                _get(ResourceServer.prototype.__proto__ || Object.getPrototypeOf(ResourceServer.prototype), 'sendImageRequest', _this3).call(_this3, url, params, baseForm).then(function (data) {
                    data.Service = { ServerId: _this3._id };
                    if (data.Status === 'ok') {
                        resolve(data);
                    } else {
                        reject(data);
                    }
                }).catch(function (errors) {
                    return reject({ Status: 'error', ErrorInfo: errors.ErrorInfo });
                });
            });
        }
    }, {
        key: 'sendPostRequest',
        value: function sendPostRequest(url, params, baseForm) {
            var _this4 = this;

            params = params || {};
            params.sync = this._authManager.$getAntiCsrfToken();
            return new Promise(function (resolve, reject) {
                _get(ResourceServer.prototype.__proto__ || Object.getPrototypeOf(ResourceServer.prototype), 'sendPostRequest', _this4).call(_this4, url, params, baseForm).then(function (data) {
                    data.Service = { ServerId: _this4._id };
                    if (data.Status === 'ok') {
                        resolve(data);
                    } else {
                        reject(data);
                    }
                }).catch(function (errors) {
                    return reject({ Status: 'error', ErrorInfo: errors.ErrorInfo });
                });
            });
        }
    }]);

    return ResourceServer;
}(_Server2.Server);

exports.ResourceServer = ResourceServer;

/***/ }),
/* 6 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.Server = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _Request = __webpack_require__(0);

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

//TODO: использовать ли библиотеку?
function parseUri(str) {
    var parser = /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*):?([^:@]*))?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/,
        key = ["source", "protocol", "authority", "userInfo", "user", "password", "host", "port", "relative", "path", "directory", "file", "query", "anchor"],
        m = parser.exec(str),
        uri = {},
        i = 14;

    while (i--) {
        uri[key[i]] = m[i] || "";
    } // HACK
    uri.hostOnly = uri.host;
    uri.host = uri.authority;

    return uri;
}

var requests = {};
var lastRequestId = 0;
var uniquePrefix = "id" + Math.random();

function processMessage(e) {
    if (e.origin in requests) {
        var dataStr = decodeURIComponent(e.data.replace(/\n/g, '\n\\'));
        try {
            var dataObj = JSON.parse(dataStr);
            var request = requests[e.origin][dataObj.CallbackName];
            if (request) {
                delete requests[e.origin][dataObj.CallbackName];
                request.iframe.parentNode.removeChild(request.iframe);
                request.callback && request.callback(dataObj);
            }
        } catch (e) {}
    }
}

//совместимость с IE8
if (window.addEventListener) {
    window.addEventListener('message', processMessage);
} else {
    window.attachEvent('onmessage', processMessage);
}

function addQueryVariables(url, variables) {
    var oldQueryString = url.split('?')[1];
    var newQueryString = '';
    for (var variable in variables) {
        if (variables.hasOwnProperty(variable)) {
            newQueryString += '&' + variable + '=' + encodeURIComponent(variables[variable]);
        }
    }
    if (oldQueryString) {
        return url + newQueryString;
    } else {
        return url + '?' + newQueryString.slice(1);
    }
}

function createPostIframe(id) {
    var iframe = document.createElement("iframe");
    iframe.style.display = 'none';
    iframe.setAttribute('id', id);
    iframe.setAttribute('name', id);
    iframe.src = 'javascript:true';

    return iframe;
}

var Server = function () {
    function Server(_ref) {
        var root = _ref.root;

        _classCallCheck(this, Server);

        this._root = root;
    }

    /** Послать GET запрос к серверу ресурсов.
     * @param  {String} url
     * @param  {Object} params
     * @return {Function} promise(data)
     */


    _createClass(Server, [{
        key: "sendGetRequest",
        value: function sendGetRequest(url, params) {
            var _this = this;

            return new Promise(function (resolve, reject) {
                var requestUrl = _this._root + "/" + url;
                requestUrl = addQueryVariables(requestUrl, params);
                (0, _Request.sendCrossDomainJSONRequest)(requestUrl, function (data) {
                    return resolve(data);
                }, 'CallbackName', function (errors) {
                    return reject({ Status: 'error' });
                });
            });
        }

        /** Послать к серверу ресурсов запрос за картинкой.
         * @param  {String} url
         * @param  {Object} params
         * @return {Function} promise(image)
         */

    }, {
        key: "sendImageRequest",
        value: function sendImageRequest(url, params) {
            var requestUrl = this._root + "/" + url;
            requestUrl = addQueryVariables(requestUrl, params);

            var img = new Image();

            img.onload = function () {
                return resolve({ Status: 'ok', Result: img });
            };
            img.onerror = function (errors) {
                return reject(errors);
            };
            img.src = requestUrl;
        }

        /** Послать POST запрос к серверу ресурсов.
         * @param  {String} url
         * @param  {Object} params
         * @param  {HTMLFormElement} baseForm HTML Form, которая может быть использована как основа для посылки запроса (например, если нужно загрузить файл)
         * @return {Function} promise(data)
         */

    }, {
        key: "sendPostRequest",
        value: function sendPostRequest(url, params, baseForm) {
            var requestURL = this._root + "/" + url;
            return new Promise(function (resolve, reject) {
                var processResponse = function processResponse(response) {
                    if (response.Status !== 'ok') {
                        reject(response);
                    } else {
                        resolve(response);
                    }
                };

                try {

                    var id = "" + uniquePrefix + lastRequestId++;
                    var iframe = createPostIframe(id);
                    var parsedURL = parseUri(requestURL);
                    var origin = (parsedURL.protocol ? parsedURL.protocol + ":" : window.location.protocol) + ("//" + (parsedURL.host || window.location.host));
                    var originalFormAction = void 0;
                    var form = void 0;

                    requests[origin] = requests[origin] || {};
                    requests[origin][id] = { callback: processResponse, iframe: iframe };

                    if (baseForm) {
                        form = baseForm;
                        originalFormAction = form.getAttribute('action');
                        form.setAttribute('action', requestURL);
                        form.target = id;
                    } else {
                        form = document.createElement('form');
                        form.style.display = 'none';
                        form.setAttribute('enctype', 'multipart/form-data');
                        form.target = id;
                        form.setAttribute('method', 'POST');
                        form.setAttribute('action', requestURL);
                        form.id = id;
                    }

                    var hiddenParamsDiv = document.createElement("div");
                    hiddenParamsDiv.style.display = 'none';

                    var appendFormParam = function appendFormParam(paramName, paramValue) {
                        var input = document.createElement("input");
                        paramValue = typeof paramValue !== 'undefined' ? paramValue : '';

                        input.setAttribute('type', 'hidden');
                        input.setAttribute('name', paramName);
                        input.setAttribute('value', paramValue);

                        hiddenParamsDiv.appendChild(input);
                    };

                    for (var paramName in params) {
                        appendFormParam(paramName, params[paramName]);
                    }

                    appendFormParam('WrapStyle', 'message');
                    appendFormParam('CallbackName', id);

                    form.appendChild(hiddenParamsDiv);

                    if (!baseForm) document.body.appendChild(form);

                    document.body.appendChild(iframe);

                    form.submit();

                    if (baseForm) {
                        form.removeChild(hiddenParamsDiv);
                        if (originalFormAction !== null) form.setAttribute('action', originalFormAction);else form.removeAttribute('action');
                    } else {
                        form.parentNode.removeChild(form);
                    }
                } catch (e) {
                    reject(e);
                }
            });
        }
    }]);

    return Server;
}();

exports.Server = Server;

/***/ }),
/* 7 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var EventTarget = function () {
    function EventTarget() {
        _classCallCheck(this, EventTarget);

        this.listeners = {};
    }

    _createClass(EventTarget, [{
        key: "addEventListener",
        value: function addEventListener(type, callback) {
            if (!(type in this.listeners)) {
                this.listeners[type] = [];
            }
            this.listeners[type].push(callback);
        }
    }, {
        key: "removeEventListener",
        value: function removeEventListener(type, callback) {
            if (!(type in this.listeners)) {
                return;
            }
            var stack = this.listeners[type];
            for (var i = 0, l = stack.length; i < l; i++) {
                if (stack[i] === callback) {
                    stack.splice(i, 1);
                    return this.removeEventListener(type, callback);
                }
            }
        }
    }, {
        key: "dispatchEvent",
        value: function dispatchEvent(event) {
            if (!(event.type in this.listeners)) {
                return;
            }
            var stack = this.listeners[event.type];
            // event.target = this;
            for (var i = 0, l = stack.length; i < l; i++) {
                stack[i].call(this, event);
            }
        }
    }]);

    return EventTarget;
}();

exports.EventTarget = EventTarget;

/***/ }),
/* 8 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _Request = __webpack_require__(3);

var _api = __webpack_require__(2);

var _Utils = __webpack_require__(1);

var ss = ['WV03', 'WV02', 'GE01', 'PHR', 'QB02', 'KOMPSAT3A', 'KOMPSAT3', 'IK', 'GF2', 'KOMPSAT2', 'SP6_7', 'BKA', 'GF1_2m', 'ZY3', 'RE', 'LANDSAT_8', 'GF1_16m', 'WV01', 'EROSB', 'EROSA', 'GE01_L', 'IK_L', 'QB02_L', 'WV01_L', 'WV02_L', 'SP5_2MS', 'SP5_5MS', 'SP5_10MS', 'SP5_2PC', 'SP5_5PC'];

var gmxResourceServer = (0, _api.getResourceServer)('geomixer');

function read_permalink(state) {
    return new Promise(function (resolve, reject) {
        gmxResourceServer.sendGetRequest('TinyReference/Get.ashx', { id: state.id }).then(function (response) {
            if (response.Status == 'ok') {
                try {
                    resolve(JSON.parse(response.Result));
                } catch (e) {
                    reject(e);
                }
            } else {
                reject(response.Result);
            }
        }).catch(function (e) {
            return reject(e);
        });
    });
}

function get_query(ids) {
    return ids.map(function (id) {
        return '(sceneid = \'' + id + '\')';
    }).join(' OR ');
}

function search(ids) {
    return new Promise(function (resolve, reject) {
        if (ids.length > 0) {
            gmxResourceServer.sendPostRequest('VectorLayer/Search.ashx', {
                layer: 'AFB4D363768E4C5FAC71C9B0C6F7B2F4',
                geometry: true,
                pagesize: 0,
                query: get_query(ids),
                WrapStyle: 'message'
            }).then(function (response) {
                if (response.Status == 'ok') {
                    try {
                        resolve((0, _Utils.from_gmx)(response.Result));
                    } catch (e) {
                        reject(e);
                    }
                } else {
                    reject(response.Result);
                }
            }).catch(function (e) {
                return reject(e);
            });
        } else {
            resolve([]);
        }
    });
}

function get_items(state) {
    return new Promise(function (resolve) {
        search(state.selected.concat(state.quicklook)).then(function (items) {
            state.items = items;
            state.items.forEach(function (item) {
                item.quicklook = false;
                if (Array.isArray(state.quicklook)) {
                    for (var i = 0; i < state.quicklook.length; ++i) {
                        if (state.visible[i] === item.sceneid) {
                            item.quicklook = true;
                            break;
                        }
                    }
                }

                item.checked = false;
                if (Array.isArray(state.cart)) {
                    for (var _i = 0; _i < state.cart.length; ++_i) {
                        if (state.cart[_i] === item.sceneid) {
                            item.checked = true;
                            break;
                        }
                    }
                }
            });
            resolve(state);
        }).catch(function (e) {
            console.log(e);
            resolve(state);
        });
    });
}

function get_cart(state) {
    return new Promise(function (resolve) {
        search(state.cart).then(function (items) {
            state.cart = items;
            resolve(state);
        }).catch(function (e) {
            console.log(e);
            resolve(state);
        });
    });
}

var matches = /\?([^&]+)/g.exec(window.location.search);
if (matches.length > 1) {
    var id = matches[1];
    (0, _Utils.chain)([read_permalink, get_items, get_cart], { id: id }).then(function (state) {
        var lang = state.lang,
            position = state.position,
            bounds = state.bounds,
            cadastre = state.cadastre,
            activeLayer = state.activeLayer,
            drawingObjects = state.drawingObjects,
            _state$searchCriteria = state.searchCriteria,
            dateStart = _state$searchCriteria.dateStart,
            dateEnd = _state$searchCriteria.dateEnd,
            isYearly = _state$searchCriteria.isYearly,
            minCloudCover = _state$searchCriteria.minCloudCover,
            maxCloudCover = _state$searchCriteria.maxCloudCover,
            minAngle = _state$searchCriteria.minAngle,
            maxAngle = _state$searchCriteria.maxAngle,
            archive = _state$searchCriteria.archive,
            stereo = _state$searchCriteria.stereo,
            satellites = _state$searchCriteria.satellites,
            cart = state.cart,
            items = state.items;

        var rxDate = new RegExp('(\\d{2})\\.(\\d{2})\\.(\\d{4})');
        var d1 = rxDate.exec(dateStart);
        var d2 = rxDate.exec(dateEnd);
        var date = [d1[3] + '-' + d1[2] + '-' + d1[1], d2[3] + '-' + d2[2] + '-' + d2[1]];
        var st = satellites.reduce(function (a, i) {
            var s = ss[i];
            var k = s.lastIndexOf('_L');
            if (k > -1) {
                var x = s.substr(0, k);
                if (x === 'WV01') {
                    a.pc.push(x);
                } else {
                    a.ms.push(x);
                }
            } else if (s in ['WV01', 'EROSA', 'EROSB']) {
                a.pc.push(s);
            } else {
                a.ms.push(s);
            }
            return a;
        }, { ms: [], pc: [] });
        var objects = drawingObjects.map(function (item) {
            var _item$properties = item.properties,
                name = _item$properties.name,
                color = _item$properties.color,
                checked = _item$properties.checked;

            return {
                name: name,
                geoJSON: item,
                color: typeof color === 'string' && color !== '' ? '#' + (0, _Utils.hex)(color, 6) : '#0033FF',
                visible: checked
            };
        });
        var viewState = {
            lang: lang,
            activeLayer: activeLayer,
            drawingObjects: objects,
            position: position,
            bounds: bounds,
            searchCriteria: {
                date: date,
                annually: isYearly,
                angle: [minAngle, maxAngle],
                clouds: [minCloudCover, maxCloudCover],
                stereo: stereo,
                archive: archive,
                satellites: st
            },
            items: items,
            cart: cart,
            cadastre: cadastre
        };
        localStorage.setItem('view_state', JSON.stringify(viewState));
        window.location = '' + window.location.origin + window.location.pathname.substr(0, window.location.pathname.lastIndexOf('/'));
    });
}

/***/ })
/******/ ]);
//# sourceMappingURL=main.aa95ef2879256600b391.bundle.js.map
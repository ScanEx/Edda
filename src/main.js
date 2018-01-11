import 'assets/search.css';
import 'assets/sprite.css';
import 'assets/sidebar/sidebar.css';

import './fonts/fonts.css';

import { Translations } from 'lib/Translations/src/Translations.js';
import { SearchOptions } from 'app/SearchOptions/SearchOptions.js';
import { ImageDetails } from 'app/ImageDetails/ImageDetails.js';
import { DrawnObjects, DrawnObjectsControl } from 'app/DrawnObjects/DrawnObjects.js';
import { Cart } from 'app/Cart/Cart.js';
import { ResultList } from 'app/ResultList/ResultList.js';
import { FavoritesList } from 'app/FavoritesList/FavoritesList.js';
import { satellites, getSatelliteName } from 'res/Satellites.js';
import { AuthWidget } from 'lib/Authentication/src/AuthWidget/AuthWidget.js';
import { AuthManager } from 'lib/Authentication/src/AuthManager/AuthManager.js';
import { ResourceServer } from 'lib/Authentication/src/AuthManager/ResourceServer';
import { getAuthManager, getResourceServer } from 'lib/Authentication/src/AuthManager/api.js';
import { Panel } from 'lib/Leaflet.Panel/src/Panel.js';
import { RequestAdapter } from 'app/RequestAdapter/RequestAdapter.js';
import { ResultsController, layerAttributes, layerAttrTypes } from 'app/ResultsController/ResultsController.js';
import { createTab } from 'app/TabFactory/TabFactory.js';
import { chain, create_container, hex, unhex, from_gmx, normalize_geometry } from 'app/Utils/Utils.js';
import { NotificationWidget } from 'lib/NotificationWidget/src/NotificationWidget.js';
import { LoaderWidget } from 'lib/LoaderWidget/src/LoaderWidget.js';
import { ShapeLoader } from 'app/ShapeLoader/ShapeLoader.js';
import { copy } from 'lib/Object.Extensions/src/Extensions.js';
import { GmxLayerDataProvider } from 'app/GmxLayerDataProvider/GmxLayerDataProvider.js';
import { LanguageWidget } from 'lib/LanguageWidget/src/LanguageWidget.js';
import { FilterControl } from 'app/FilterControl/FilterControl.js';

require('lib/IconSidebarControl/dist/iconSidebarControl.css');
let IconSidebarControl = require('lib/IconSidebarControl/dist/iconSidebarControl.js');

require ('lib/Leaflet-IconLayers/dist/iconLayers.css');
let IconLayers = require ('lib/Leaflet-IconLayers/dist/iconLayers.js');

// import './animate.css';
import './main.css';

window.L.Icon.Default.imagePath = './dist';

window.DIALOG_PLACE = {left: 600, top: 150};
window.RESULT_MAX_COUNT = 1000;
window.MAX_CART_SIZE = 200;

window.Catalog.translations = window.Catalog.translations || new Translations();
let T = window.Catalog.translations

const DEFAULT_LANGUAGE = 'rus';

T.addText('rus', {  
    aoi: 'Область интереса', 
    controls: {
        point: 'Маркер',
        polygon: 'Полигон',
        polyline: 'Линия',
        print: 'Печать',
        permalink: 'Постоянная ссылка',
        rectangle: 'Прямоугольник',
        download: 'Скачать',
        upload: 'Загрузить',
        zoom: 'Увеличение', 
        search: 'Поиск по кадастру, адресам, координатам',
    },
    results: {
        title: 'Найденные снимки',
        favorites: 'Корзина',
        sceneid: 'ID',
        date: 'Дата',
        satellite: 'Спутник',
        clouds: 'Обл.',
        angle: 'Угол',
        stereo: 'Стерео',
        clear: 'Очистить список',
        selected: 'Показывать выбранные / все',
        quicklooks: {
            select: 'Выбрать квиклуки',
            toggle:'Показать / скрыть выбранные квиклуки',
            cart: 'Поместить видимые в корзину'
        },
        download: 'Количество найденных снимков превышает установленный порог.<br/>Хотите скачать их в виде шейп-файла?',
        change: 'Количество найденных снимков превышает установленный порог.<br/>Измените критерий поиска.'
    },
    favorites: {
        limit: `Максимальное количество снимков в корзине - ${window.MAX_CART_SIZE}`,
        delete: 'Удалить выделенные',
    },
    boolean: {
        true: 'Да',
        false: 'Нет',
    },
    units: {
        m: 'м',
        km: 'км',
    },
    alerts: {
        title: 'Внимание',        
        clear: 'Удалить найденные снимки?',
        cancel: 'Отмена',
        close: 'Закрыть',
        authenticate: 'Для оформления заказа необходимо:',
        ok: 'ОК',
        login: 'Войти в систему',
        clipboard: 'Копировать ссылку',
        permalink: 'Постоянная ссылка скопирована в буфер обмена',
        nothing: 'Ничего не найдено',
    },
    search: {
        title: 'Параметры поиска',
        action: 'Найти снимки'
    },
    cart: {
        add: 'Оформить заказ',
    },
    download: {
        type: 'Состав',     
        file: 'Имя файла',
        borders: 'Границы поиска',
        results: 'Результаты поиска',
        cart: 'Корзина: контуры',
        quicklooks: 'Корзина: контуры и квиклуки',
        ok: 'Скачать',
        cancel: 'Отмена',
        noname: 'Без имени',
        noresults: 'Нет объектов для скачивания',
        empty: "Нет объектов",
    }
});

T.addText('eng', {
    aoi: 'Area of interest',
    controls: {
        point: 'Marker',
        polygon: 'Polygon',
        polyline: 'Polyline',
        print: 'Print',
        permalink: 'Permalink',
        rectangle: 'Rectangle',
        download: 'Download',
        upload: 'Upload',
        zoom: 'Zoom',
        search: 'Search by cadastre, address and coordinates',
    },
    results: {
        title: 'Found images',
        favorites: 'Cart',
        sceneid: 'ID',
        date: 'Date',
        satellite: 'Satellite',
        clouds: 'Clouds',
        angle: 'Angle',
        stereo: 'Stereo',
        controls: {
            print: 'Print',
            permalink: 'Permalink',
            zoom: 'Zoom',
        },    
        clear: 'Clear results',
        selected: 'Show selected / all',
        quicklooks: {
            select: 'Select quicklooks',
            toggle: 'Show / hide selected quicklooks',
            cart: 'Add visible to cart'
        },
        download: 'Results exceed allowed items amount.<br/>Do you want to download them in a shape-file?',
        change: 'Results exceed allowed items amount.<br/>Change the criteria to limit the search.'
    },
    favorites: {
        limit: `No more than ${window.MAX_CART_SIZE} elements are allowed in the cart`,
        delete: 'Remove selected',
    },
    boolean: {
        true: 'Yes',
        false: 'No',
    },    
    units: {
        m: 'm',
        km: 'km',
    },
    alerts: {
        title: 'Warning',        
        clear: 'Remove found images?',
        cancel: 'Cancel',
        close: 'Close',
        authenticate: 'To place order<br/>you need to login',
        ok: 'OK',
        login: 'Login',
        clipboard: 'Copy to to clipboard',
        permalink: 'Permalink saved to clipboard',
        nothing: 'Nothing found',
    },
    search: {
        title: 'Search options', 
        action: 'Search',
    },
    cart: {
        add: 'Place an order',
    },
    download: {
        type: 'Download contents',
        file: 'File name',   
        borders: 'Search borders',
        results: 'Results',
        cart: 'Cart: contours',
        quicklooks: 'Cart: contours and quicklooks',
        ok: 'Download',
        cancel: 'Cancel',
        noname: 'No name',
        noresults: 'No objects to download',
        empty: "Can't download. No objects",
    },
});

let mapContainer = document.getElementById('map');

let map = L.map(mapContainer, {
    center: new L.LatLng(55.634508, 37.433167),
    minZoom: 3,
    maxZoom: 17,
    zoom: 3,
    boxZoom: false,
    srs: 3857,
    ftc: 'osm',
    attributionControl: false,
    zoomControl: false,
    squareUnit: 'km2',
    distanceUnit: 'km', 
    maxBounds: L.latLngBounds(L.latLng(-90, -180), L.latLng(90, 180)),
});

map.options.svgSprite = false;

resize_map();

function resize_map(){    
    let container = mapContainer;
    const bounds = document.body.getBoundingClientRect();
    let header = document.getElementById('header');
    const headerBounds = header.getBoundingClientRect();
    container.style.height = `${bounds.height - headerBounds.height}px`;
    map.invalidateSize();
}

function load_locale (state) {
    return new Promise (resolve => {
        let s = localStorage.getItem('view_state');        
        if (s) {            
            let viewState = JSON.parse (s);
            T.setLanguage (viewState.lang || DEFAULT_LANGUAGE);   
            L.gmxLocale.setLanguage(viewState.lang || DEFAULT_LANGUAGE);         
        }
        resolve(state);
    });
}

function load_map (state) {
    return new Promise(resolve => {
        L.gmx.loadMap('1CB019F36D024831972F3029B724D7CA', { apiKey: 'A07FEB777402A559A7DE8BC6CA7C2E96', leafletMap: map })
        .then(gmxMap => {
            state.gmxMap = gmxMap;                    
            map.invalidateSize();
            resolve(state);
        });
    });
}

function init_baselayer_manager(state) {
    return new Promise(resolve => {
        map.gmxBaseLayersManager = new window.L.gmxBaseLayersManager(map);
        map.gmxBaseLayersManager.initDefaults().then(() => resolve(state));
    });
}

function set_active_layer (state) {
    return new Promise(resolve => {
        let gmxMap = state.gmxMap;
        let baseLayers = gmxMap.properties.BaseLayers;
        let currentID = baseLayers[0];
        map.gmxBaseLayersManager.setActiveIDs(baseLayers).setCurrentID(currentID);
        map.addControl(new window.L.Control.gmxLayers(map.gmxBaseLayersManager, { hideBaseLayers: true }));
        resolve(state);
    });
}

let authPermalinkUrl = null;

function authenticate(state){
    return new Promise(resolve => {
        window.Catalog.authManager = getAuthManager();        
        const authBaseUrl = `${location.protocol}//${location.host}${location.pathname.substr(0, location.pathname.lastIndexOf('/'))}`;
        window.Catalog.catalogResourceServer = new ResourceServer(window.Catalog.authManager, {
            id: 'Catalog',
            root: authBaseUrl
        });
        window.Catalog.gmxResourceServer = getResourceServer('geomixer');        
        window.Catalog.authWidget = new AuthWidget({authManager: window.Catalog.authManager});
        window.Catalog.authContainer = document.getElementById('auth');
        window.Catalog.authWidget.appendTo(window.Catalog.authContainer);
        window.Catalog.authWidget.addEventListener('logout', () => {
            localStorage.setItem('view_state', JSON.stringify(get_state()));
            window.location.reload(true);
        });
        let dlgAuthContainer = create_container();
        dlgAuthContainer.classList.add('auth-dialog');
        window.Catalog.dlgAuth = new Panel(dlgAuthContainer, {
            id: 'auth.dialog',
            left: window.DIALOG_PLACE.left,
            top: window.DIALOG_PLACE.top, 
            modal: true
        });
        window.Catalog.dlgAuth.hide();
        window.Catalog.dlgAuth.content.innerHTML = `${T.getText('alerts.authenticate')}`;
        window.Catalog.dlgAuth.footer.innerHTML = `<button class="dialog-login-button">${T.getText('alerts.login')}</button>`;
        window.Catalog.dlgAuth.footer.querySelector('button').addEventListener('click', e => {
            if (!localStorage.getItem ('view_state')) {
                localStorage.setItem('view_state', JSON.stringify(get_state()));
            }
            window.Catalog.authContainer.querySelector('.authWidget-loginButton').click();
        });
        resolve(state);
    });
}

function get_user(state) {
    return new Promise(resolve => {
        window.Catalog.authManager.getUserInfo()
        .then(response => {
            let { ID, FullName, Email, Phone, Organization } = response.Result;
            window.Catalog.userInfo = {
                IsAuthenticated: true,
                ID: ID,
                FullName: FullName,
                Email: Email,
                Phone: Phone,
                Organization: Organization,
            };
            resolve(state);
        })
        .catch(e => {
            console.log(e);
            window.Catalog.userInfo = { IsAuthenticated: false };
            resolve(state);
        });
    });
}

function check_access(state) {
    return new Promise(resolve => {
        window.Catalog.gmxResourceServer.sendGetRequest('Layer/GetLayerInfo.ashx', { layerID: '9077D16CFE374967A8C57C78095F34EA' })
		.then(response => {
            if (response.Status == 'ok' && response.Result && response.Result.LayerID == '9077D16CFE374967A8C57C78095F34EA') {
                window.Catalog.userInfo.Role = 'scanex';
            }
            resolve(state);
        })
        .catch(e => {
            console.log(e);
            resolve(state);
        });
    });
}

function get_root_url () {
    let {origin, pathname} = location;
    return `${origin}${pathname}`;
}

function get_permalink_url (id) {    
    return `${get_root_url()}?link=${id}`;
}

function get_state () {
    let center = map.getCenter();
	let {x, y} = L.Projection.Mercator.project(center);
    let searchCriteria = window.Catalog.searchOptions.criteria;
    let serialize = group => group.filter(s => s.checked).map(s => s.id);
    searchCriteria.satellites = { ms: serialize (searchCriteria.satellites.ms), pc: serialize(searchCriteria.satellites.pc) };
    let drawingObjects = window.Catalog.drawnObjectsControl.widget.items.reduce ((a, {visible, id, color, name, area, geoJSON}) => {
        return a.concat({visible, id, color, name, area, geoJSON});
    }, []);
    return {
        lang: T.getLanguage(),
        drawingObjects,
        position: {
            x: x,
            y: y,
            z: 17 - map.getZoom()
        },
        activeLayer: map.gmxBaseLayersManager.getCurrentID(),        
        bounds: map.getBounds(),
        searchCriteria,
        items: window.Catalog.resultsController.results,
        cart: window.Catalog.resultsController.favorites,
        activeTabId: window.Catalog.searchSidebar.getActiveTabId(),
        cadastre: {},
    };
}

function get_permalink_id () {
    
    return new Promise((resolve, reject) => {            
        let state = get_state();
        window.Catalog.gmxResourceServer.sendPostRequest('TinyReference/Create.ashx', {
            content: JSON.stringify(state)
        })
        .then(response => {                 
            if(response.Status === 'ok'){
                resolve(response.Result);
            }
            else {
                reject(response);
            }
        })
        .catch(e => reject(e));
    });
}

function get_panel_height (container, parts) {
    return parts.reduce((a,x) => {
        return a - container.querySelector(x).getBoundingClientRect().height;
    }, container.getBoundingClientRect().height);
}

function resize_search_options (container) {    
    let total = get_panel_height(container, [ '.search-pane', '.search-options-footer' ]);
    window.Catalog.searchOptions.resize(total);
}

function resize_results (container) {
    let total = get_panel_height(container, [ '.results-header' ]);
    window.Catalog.resultList.resize(total);
    window.Catalog.resultList.adjustWidth();
}

function resize_favorites (container) {
    let total = get_panel_height(container, [ '.favorites-header', '.favorites-footer' ]);
    window.Catalog.favoritesList.resize(total);
    window.Catalog.favoritesList.adjustWidth();
}

function init_sidebar (state) {
    return new Promise(resolve => {
        const restricted = (window.Catalog.userInfo.IsAuthenticated && window.Catalog.userInfo.Role === 'scanex');
        
        // set default search criteria
        const now = new Date();
        let select_satellites = (group, flag) => {
            for (let key in group) {      
                let s = group[key];
                s.checked = flag;
            }
        };
        select_satellites(satellites.ms, true);
        select_satellites(satellites.pc, true);
        
        window.Catalog.defaultCriteria = {
            date: [new Date(now.getFullYear(), 0, 1), now],
            annually: false,
            clouds: [0, 100],
            angle: [0, 60],
            resolution: [0.3, 20],
            satellites: satellites,
            stereo: false,
        };

        window.Catalog.searchSidebar = new IconSidebarControl({position: 'left'});
        map.addControl(window.Catalog.searchSidebar);
        let sidebarContainer = document.querySelector('.iconSidebarControl');
        sidebarContainer.classList.add('noselect');
        let searchContainer = window.Catalog.searchSidebar.setPane('search', {
            createTab: createTab({
                icon: 'sidebar-search',
                active: 'sidebar-search-active',
                inactive: 'sidebar-search-passive',
                hint: T.getText('search.title')
            }),
        });      
        searchContainer.innerHTML = 
            `<div class="search-pane"></div>
            <div class="no-select search-options-pane"></div>
            <div class="search-options-footer">
                <button class="search-options-search-button" type="button">
                    <span>${T.getText('search.action')}</span>
                </button>
            </div>`;
        
        let cadastreLayerGroup = null;

        let crds = new nsGmx.CoordinatesDataProvider({showOnMap: false});
        crds.addEventListener ('fetch', e => {
            let result = e.detail;            
            let geoJSON = result.feature;
            geoJSON.properties.editable = false;
            let center = L.GeoJSON.coordsToLatLng(geoJSON.geometry.coordinates);            
            let item = window.Catalog.resultsController.getObject({geoJSON, editable: geoJSON.properties.editable});
            const drawing = window.Catalog.resultsController.addDrawing (item);
            let { height } =  mapContainer.getBoundingClientRect();
            window.Catalog.drawnObjectsControl.widget.resize(height - 150);            
            // window.Catalog.drawnObjectsControl.widget.items = window.Catalog.drawnObjectsControl.widget.items.concat(item);
            map.setView(center, 14);
            map.invalidateSize();
        });
        let gmx = new GmxLayerDataProvider({ map, gmxResourceServer: window.Catalog.gmxResourceServer});
        gmx.addEventListener ('fetch', e => {
            let {fields, values, types} = e.detail;
            const count = values.length;                            
            if (count === 0) {
                window.Catalog.searchSidebar.enable ('results', false);
                update_results_number(0);
                window.Catalog.notificationWidget.content.innerText = T.getText('alerts.nothing');
                window.Catalog.notificationWidget.show();
            }
            else {
                window.Catalog.searchSidebar.enable ('results', true);
                window.Catalog.searchSidebar.open('results');
                window.Catalog.resultsController.setLayer({fields,values,types});
                update_results_number(Count);                
            }
        });

        let osm = new nsGmx.OsmDataProvider({
            showOnMap: false,
            serverBase: 'http://maps.kosmosnimki.ru',
            suggestionLimit: 10
        });

        osm.addEventListener ('fetch', e => {
            let results = e.detail;
            let features = results.map(x => {
                x.feature.properties.editable = false;
                x.feature.properties.name = x.feature.properties.ObjName;
                return x.feature;
            });
            if (features && features.length) {                                                            
                features.map(geoJSON => {
                    let center = map.getCenter();
                    normalize_geometry(center.lng, geoJSON.geometry);
                    let [object] = map.gmxDrawing.addGeoJSON(
                        geoJSON,
                        {
                            editable: false,
                            lineStyle: {
                                fill: false,
                                weight: 1,
                                opacity: 1,
                            },
                            className: 'osm-layer'
                        }
                    );
                    window.Catalog.resultsController.createDrawing({object, geoJSON});
                    object.bringToBack();
                });                            
                let json = features.reduce((a, geojson) => {
                    a.addData(geojson.geometry);
                    return a;
                }, L.geoJson())
                let bounds = json.getBounds();
                map.fitBounds(bounds);
                map.invalidateSize();
            }
        });

        let cadastre = new nsGmx.CadastreDataProvider({
            serverBase: 'http://pkk5.kosmosnimki.ru/api',
            suggestionLimit: 10,
            tolerance: 2048,
            showOnMap: true,
        });
        cadastre.addEventListener ('fetch', e => {
            let response = e.detail;
            if (response && response.features) {
                var feature = response.features[0];
                if (cadastreLayerGroup) {
                    if (!map.hasLayer(cadastreLayerGroup)) {
                        cadastreLayerGroup.addTo(map);
                    }
                    cadastreModule.searchHook(feature.attrs.cn);
                } else {
                    var R = 6378137,
                        crs = L.Projection.SphericalMercator,
                        bounds = map.getPixelBounds(),
                        ne = map.options.crs.project(map.unproject(bounds.getTopRight())),
                        sw = map.options.crs.project(map.unproject(bounds.getBottomLeft())),
                        latLngBounds = L.latLngBounds(
                            crs.unproject(L.point(feature.extent.xmin, feature.extent.ymin).divideBy(R)),
                            crs.unproject(L.point(feature.extent.xmax, feature.extent.ymax).divideBy(R))
                        );
                    map.fitBounds(latLngBounds, { reset: true });
                }
            }
        });

        let searchControl = new nsGmx.SearchWidget(
            searchContainer.querySelector('.search-pane'),
            {            
                placeHolder: T.getText('controls.search'),
                suggestionLimit: 10,
                providers: [crds, gmx, osm, cadastre],
                replaceInputOnEnter: true,
                style: {
                    editable: false,
                    map: true,
                    pointStyle: {
                        size: 8,
                        weight: 1,
                        opacity: 1,
                        color: '#00008B'
                    },
                    lineStyle: {
                        fill: false,
                        weight: 3,
                        opacity: 1,
                        color: '#008B8B'
                    }
                },
        });

        map.on ('click', searchControl.results.hide.bind(searchControl.results));
        map.on ('dragstart', searchControl.results.hide.bind(searchControl.results));

        window.Catalog.searchOptions = new SearchOptions (searchContainer.querySelector('.search-options-pane'), { restricted });
        window.Catalog.searchOptions.criteria = window.Catalog.defaultCriteria;        
        window.Catalog.searchOptions.addEventListener ('change', e => {
            enable_search ();            
        });
        
        window.Catalog.requestAdapter = new RequestAdapter({
            layer: 'AFB4D363768E4C5FAC71C9B0C6F7B2F4',
            gmxResourceServer: window.Catalog.gmxResourceServer,
            authorized: restricted,
        });
        
        let dlgDownloadResultContainer = create_container();
        dlgDownloadResultContainer.classList.add('download-result-dialog');
        window.Catalog.dlgDownloadResult = new Panel(dlgDownloadResultContainer, {
            id: 'download.result.dialog',
            left: window.DIALOG_PLACE.left,
            top: window.DIALOG_PLACE.top, 
            modal: true,
            header: false,
        });
        window.Catalog.dlgDownloadResult.hide();        
        window.Catalog.dlgDownloadResult.content.innerHTML = `${T.getText('results.download')}`;
        window.Catalog.dlgDownloadResult.footer.innerHTML = 
        `<button class="dialog-ok-button">${T.getText('download.ok')}</button>
        <button class="dialog-cancel-button">${T.getText('download.cancel')}</button>`;
        window.Catalog.dlgDownloadResult.footer.querySelector('button.dialog-ok-button')
        .addEventListener('click', e => {
            window.Catalog.dlgDownloadResult.hide();
            window.Catalog.loaderWidget.show();
            window.Catalog.requestAdapter.search()
            .then (({fields, values, types}) => {
                window.Catalog.loaderWidget.hide();
                window.Catalog.resultsController.downloadCache = {fields, values, types};
                window.Catalog.shapeLoader.download('results', 'results');
            })
            .catch (e => {
                window.Catalog.dlgErrorMessage.content.innerHTML = `${e.Message}`;
                window.Catalog.dlgErrorMessage.show();
            });        
        });

        let dlgErrorMessageContainer = create_container();
        dlgErrorMessageContainer.classList.add('error-message-dialog');        
        window.Catalog.dlgErrorMessage = new Panel (dlgErrorMessageContainer, {
            id: 'error.message.dialog',
            left: window.DIALOG_PLACE.left,
            top: window.DIALOG_PLACE.top, 
            modal: true,
            header: false,
        });
        window.Catalog.dlgErrorMessage.footer.innerHTML = `<button class="dialog-close-button">${T.getText('alerts.close')}</button>`;
        window.Catalog.dlgErrorMessage.footer.querySelector('button.dialog-close-button')
        .addEventListener('click', e => {
            window.Catalog.dlgErrorMessage.hide();
        });

        window.Catalog.dlgErrorMessage.hide();


        window.Catalog.dlgDownloadResult.footer.querySelector('button.dialog-cancel-button')
        .addEventListener('click', e => {
            window.Catalog.dlgDownloadResult.hide();
        });

        let dlgChangeResultContainer = create_container();
        dlgChangeResultContainer.classList.add('download-change-dialog');
        window.Catalog.dlgChangeResult = new Panel(dlgChangeResultContainer, {
            id: 'download.change.dialog',
            left: window.DIALOG_PLACE.left,
            top: window.DIALOG_PLACE.top, 
            modal: true,
            header: false,
        });
        window.Catalog.dlgChangeResult.hide();
        window.Catalog.dlgChangeResult.content.innerHTML = `${T.getText('results.change')}`;
        window.Catalog.dlgChangeResult.footer.innerHTML = `<button class="dialog-close-button">${T.getText('alerts.ok')}</button>`;
        window.Catalog.dlgChangeResult.footer.querySelector('button.dialog-close-button')
        .addEventListener('click', e => {
            window.Catalog.dlgChangeResult.hide();
        });

        window.Catalog.resultsContainer = window.Catalog.searchSidebar.setPane('results', {
            createTab: createTab({
                icon: 'sidebar-image',
                active: 'sidebar-image-active',
                inactive: 'sidebar-image-passive',
                hint: T.getText('results.title')
            }),
        });

        window.Catalog.resultsContainer.innerHTML = 
        `<div class="results-header">
            <span class="results-title">${T.getText('results.title')}</span>
            <span class="results-number">0</span>
            <div class="results-buttons">                
                <i title="${T.getText('results.quicklooks.cart')}" class="quicklooks-cart"></i>
                <i title="${T.getText('results.clear')}" class="results-clear"></i>
            </div>
        </div>
        <div class="results-pane"></div>`;

        window.Catalog.resultsNumberContainer = window.Catalog.resultsContainer.querySelector('.results-number');        

        window.Catalog.favoritesContainer = window.Catalog.searchSidebar.setPane('favorites', {
            createTab: createTab({
                icon: 'sidebar-cart',
                active: 'sidebar-cart-active',
                inactive: 'sidebar-cart-passive',
                hint: T.getText('results.favorites'),
            }),
        });

        window.Catalog.favoritesContainer.innerHTML = 
        `<div class="favorites-header">
            <span class="favorites-title">${T.getText('results.favorites')}</span>
            <span class="favorites-number">0</span>          
            <div class="favorites-buttons">
                <i title="${T.getText('favorites.delete')}" class="favorites-delete-button"></i>
            </div>
        </div>
        <div class="favorites-pane"></div>
        <div class="favorites-footer">
            <div class="favorites-order-button">
                <div>${T.getText('cart.add')}</div>
            </div>
        </div>`;        
  
        window.addEventListener('resize', e => {
            resize_map();
            resize_search_options(searchContainer);
            resize_results(window.Catalog.resultsContainer);
            resize_favorites(window.Catalog.favoritesContainer);
        });        

        window.Catalog.drawnObjectsControl = new DrawnObjectsControl({position: 'topright'});
        map.addControl(window.Catalog.drawnObjectsControl);

        window.Catalog.resultList = new ResultList(window.Catalog.resultsContainer.querySelector('.results-pane'), { restricted });
        window.Catalog.favoritesList = new FavoritesList(window.Catalog.favoritesContainer.querySelector('.favorites-pane'), { restricted });

        window.Catalog.imageDetails = new ImageDetails(create_container(), { left: 600, top: 300 });
        window.Catalog.resultsController = new ResultsController({
            map,
            requestAdapter: window.Catalog.requestAdapter,
            sidebar: window.Catalog.searchSidebar,
            resultList: window.Catalog.resultList,
            favoritesList: window.Catalog.favoritesList,
            imageDetails: window.Catalog.imageDetails,
            drawnObjects: window.Catalog.drawnObjectsControl.widget,
        });

        window.Catalog.resultsController.addEventListener ('cart', e => {
            const count = window.Catalog.resultsController.favoritesCount;
            window.Catalog.searchSidebar.enable ('favorites', count > 0);
            update_cart_number(count);
        });        

        let dlgCartLimitContainer = create_container();
        dlgCartLimitContainer.classList.add('cart-limit-dialog');
        
        window.Catalog.dlgCartLimit = new Panel(dlgCartLimitContainer, {
            id: 'cart.limit.dialog',
            left: Math.round (mapContainer.getBoundingClientRect().width / 2),
            top: window.DIALOG_PLACE.top,
            modal: true,
            header: false,
        });
        window.Catalog.dlgCartLimit.hide();
        window.Catalog.dlgCartLimit.content.innerHTML = `${T.getText('favorites.limit')}`;
        window.Catalog.dlgCartLimit.footer.innerHTML = `<button class="dialog-cancel-button">${T.getText('alerts.close')}</button>`;
        window.Catalog.dlgCartLimit.footer.querySelector('button.dialog-cancel-button').addEventListener('click', e => {
            window.Catalog.dlgCartLimit.hide();
        });

        window.Catalog.resultsController.addEventListener ('cart:limit', e => {
            window.Catalog.dlgCartLimit.show();
        });

        window.Catalog.resultsController.addEventListener ('cart:all', e => {
            const count = window.Catalog.favoritesCount;
            window.Catalog.searchSidebar.enable ('favorites', count > 0);
            update_cart_number(count);
        });

        window.Catalog.resultsController.addEventListener ('visible', e => {
            update_quicklooks_cart();
        });

        window.Catalog.resultsController.addEventListener ('selected', e => {
            enable_cart (window.Catalog.resultsController.hasFavoritesSelected);
        });

        let btnOrder = window.Catalog.favoritesContainer.querySelector('.favorites-order-button');
        btnOrder.addEventListener('click', e => {
            if (btnOrder.classList.contains('favorites-order-button-active')) {
                add_to_order();
            }
        });

        let btnRemoveFavorites = window.Catalog.favoritesContainer.querySelector('.favorites-delete-button');
        btnRemoveFavorites.addEventListener('click', e => {
            if (btnRemoveFavorites.classList.contains('favorites-delete-button-active')) {
                window.Catalog.resultsController.removeSelectedFavorites();                
                enable_cart (window.Catalog.resultsController.hasFavoritesSelected);
                const count =  window.Catalog.resultsController.favoritesCount;
                update_cart_number(count);

                if (count === 0) {
                    if (window.Catalog.searchSidebar.enabled ('results')) {
                        window.Catalog.searchSidebar.open ('results');
                    }
                    else {
                        window.Catalog.searchSidebar.open ('search');
                    }                  
                    window.Catalog.searchSidebar.enable ('favorites', false);
                }
            }
        });   
        
        window.Catalog.btnQuicklooksCart = window.Catalog.resultsContainer.querySelector('.quicklooks-cart');
        update_quicklooks_cart();
        window.Catalog.btnQuicklooksCart.addEventListener('click', e => {
            if (window.Catalog.btnQuicklooksCart.classList.contains('quicklooks-cart-active')) {
                window.Catalog.resultsController.addVisibleToCart();
            }            
        });

        window.Catalog.resultsContainer.querySelector('.results-clear').addEventListener('click', e => {
            window.Catalog.searchSidebar.open('search');
            window.Catalog.resultsController.clear();
            window.Catalog.searchSidebar.enable ('results', false);
            update_results_number(window.Catalog.resultsController.resultsCount);
        });  
        
        window.Catalog.filterControl = new FilterControl ({position: 'topleft'});
        map.addControl (window.Catalog.filterControl);
        window.Catalog.filterControl.getContainer().style.visibility = 'hidden';
        window.Catalog.filterControl.clouds.values = [0, 100];
        window.Catalog.filterControl.angle.values = [0, 60];
        window.Catalog.resultsController.enableFilter(true);
        let filterVisible = false;
        let apply_filter = (clouds, angle) => {
            window.Catalog.resultsController.filter = item => {
                return clouds[0] <= item.cloudness && item.cloudness <= clouds[1] &&
                    angle[0] <= item.tilt && item.tilt <= angle[1];
            };
            window.Catalog.resultsController.enableFilter(true);
            resize_results(window.Catalog.resultsContainer);
            update_results_number(window.Catalog.resultsController.count);
        };
        window.Catalog.filterControl.on ('change', e => {
            let {clouds, angle} = e;
            apply_filter (clouds, angle);
        });

        let show_filter = () => {
            if (!filterVisible) {
                window.Catalog.filterControl.getContainer().style.visibility = 'visible';
                let clouds = [0, 100];
                let angle = [0, 60];
                window.Catalog.filterControl.clouds.values = clouds;
                window.Catalog.filterControl.angle.values = angle;
                apply_filter (clouds, angle);
                filterVisible = true;
            }
        };

        let hide_filter = () => {
            if (filterVisible) {
                window.Catalog.filterControl.getContainer().style.visibility = 'hidden';
                filterVisible = false;
            }
        };

        window.Catalog.searchSidebar.on('opened', e => {            
            switch(e.id) {
                case 'search':
                    window.Catalog.searchOptions.refresh();
                    resize_search_options(searchContainer);                    
                    window.Catalog.resultsController.hideContours(); 
                    hide_filter();                  
                    break;
                case 'results':
                    window.Catalog.resultsController.showResults();
                    resize_results(window.Catalog.resultsContainer);  
                    show_filter();                   
                    break;
                case 'favorites':
                    window.Catalog.resultsController.showFavorites();                    
                    resize_favorites(window.Catalog.favoritesContainer);                    
                    enable_cart (window.Catalog.resultsController.hasFavoritesSelected);
                    show_filter();                   
                    break;
                default:
                    break;
            }
            update_cart_number(window.Catalog.resultsController.favoritesCount);
            shift_base_layers_control();            
        });

        window.Catalog.searchSidebar.enable ('results', false);
        window.Catalog.searchSidebar.enable ('favorites', false);

        window.Catalog.searchSidebar.on('closed', e => {  
            update_cart_number(window.Catalog.favoritesList.items.length);         
            shift_base_layers_control();            
        });

        let get_bounds = () => {
            let bounds = map.getBounds();
            let nw = bounds.getNorthWest();
            let ne = bounds.getNorthEast();
            let se = bounds.getSouthEast();
            let sw = bounds.getSouthWest();
            return {
                type: 'Polygon',
                coordinates: [[
                    [nw.lng, nw.lat],
                    [ne.lng, ne.lat],
                    [se.lng, se.lat],
                    [sw.lng, sw.lat],
                    [nw.lng, nw.lat],
                ]]
            };
        };

        window.Catalog.resultsController.addEventListener('result:done', e => {
            if (window.Catalog.resultsController.hasResults) {
                window.Catalog.searchSidebar.enable ('results', true);
                window.Catalog.searchSidebar.open('results');   
                window.Catalog.resultsController.zoomToResults();
            }
            else if (window.Catalog.resultsController.hasFavorites) {
                window.Catalog.searchSidebar.enable ('favorites', true);
                window.Catalog.searchSidebar.open('favorites');
                window.Catalog.resultsController.zoomToFavorites();
            }            
        });

        window.Catalog.btnSearch = searchContainer.querySelector('.search-options-search-button');
        window.Catalog.btnSearch.addEventListener('click', () => {
            if (window.Catalog.btnSearch.classList.contains('search-options-search-button-active')) {
                window.Catalog.loaderWidget.show();
                window.Catalog.resultsController.clear();
                window.Catalog.requestAdapter.criteria = window.Catalog.searchOptions.criteria;
                if(window.Catalog.drawnObjectsControl.widget.count === 0){
                    window.Catalog.requestAdapter.geometries = [get_bounds()];
                }
                window.Catalog.requestAdapter.search(window.RESULT_MAX_COUNT)
                .then(({Count, fields, values, types}) => {                
                    window.Catalog.loaderWidget.hide();
                    if (Count === 0) {                    
                        window.Catalog.searchSidebar.enable ('results', false);
                        update_results_number(0);
                        window.Catalog.notificationWidget.content.innerText = T.getText('alerts.nothing');
                        window.Catalog.notificationWidget.show();
                    }
                    else if(0 < Count && Count <= window.RESULT_MAX_COUNT) {                        
                       
                        window.Catalog.resultsController.setLayer({fields,values,types});
                        update_results_number(Count);                        
                    }                
                    else {  
                        window.Catalog.searchSidebar.enable ('results', false);
                        if (window.Catalog.userInfo.IsAuthenticated && window.Catalog.userInfo.Role === 'scanex') {                        
                            window.Catalog.dlgDownloadResult.show();
                        }
                        else {
                            window.Catalog.dlgChangeResult.show();
                        }                    
                    }                                
                })
                .catch(e => {
                    window.Catalog.loaderWidget.hide();
                    window.Catalog.dlgErrorMessage.content.innerHTML = `${e.toString()}<br/>${e.StackTrace}`;
                    window.Catalog.dlgErrorMessage.show();
                });
            }             
        });
        enable_search();

        let sidebarWidth = sidebarContainer.getBoundingClientRect().width;                
        map.options.paddingTopLeft = [sidebarWidth, 0];

        resolve(state);
    });
}

function update_quicklooks_cart () {
    if (window.Catalog.resultsController.hasVisibleResults){
        window.Catalog.btnQuicklooksCart.classList.add('quicklooks-cart-active');
        window.Catalog.btnQuicklooksCart.classList.remove('quicklooks-cart-passive');
    }
    else {
        window.Catalog.btnQuicklooksCart.classList.remove('quicklooks-cart-active');
        window.Catalog.btnQuicklooksCart.classList.add('quicklooks-cart-passive');
    }
}

function shift_base_layers_control () {
    let { width } = window.Catalog.searchSidebar.getContainer().getBoundingClientRect();
    map.gmxControlsManager.get('iconLayers').getContainer().style.left = `${width + 30}px`;
}

function enable_search () {    
    if (window.Catalog.searchOptions.selected) {
        window.Catalog.btnSearch.classList.remove('search-options-search-button-passive');        
        window.Catalog.btnSearch.classList.add('search-options-search-button-active');        
    }
    else {
        window.Catalog.btnSearch.classList.remove('search-options-search-button-active');        
        window.Catalog.btnSearch.classList.add('search-options-search-button-passive');
    }
}

function enable_cart (enable) {
    let btnOrder = document.body.querySelector('[data-pane-id=favorites] .favorites-order-button');
    let btnDelete = document.body.querySelector('[data-pane-id=favorites] .favorites-delete-button');
    if (enable) {
        btnOrder.classList.remove('favorites-order-button-passive');
        btnDelete.classList.remove('favorites-delete-button-passive');
        btnOrder.classList.add('favorites-order-button-active');
        btnDelete.classList.add('favorites-delete-button-active');
    }
    else {
        btnOrder.classList.remove('favorites-order-button-active');
        btnDelete.classList.remove('favorites-delete-button-active');
        btnOrder.classList.add('favorites-order-button-passive');
        btnDelete.classList.add('favorites-delete-button-passive');
    }
}

function cart_enabled () {
    return !document.body.querySelector('[data-pane-id=favorites] .favorites-order-button').classList.contains('button-disabled');
}

function ensure_cart_number_place (){
    let p = document.body.querySelector('.iconSidebarControl [data-tab-id=favorites] .sidebar-cart');
    let el = p.querySelector('.cart-number');
    if (el === null) {
        el = document.createElement('span');
        el.className = 'cart-number';
        p.appendChild (el);
    }
    return el; 
}

function update_cart_number (num) {
    document.querySelector('.favorites-number').innerText = num;
    let cartNumberPlace = ensure_cart_number_place ();    
    if (num) {
        cartNumberPlace.innerText = num;
        cartNumberPlace.style.visibility = 'visible';
    }
    else {
        cartNumberPlace.style.visibility = 'hidden';
    }
    window.Catalog.searchSidebar.enable('favorites', num > 0);
}

function update_results_number(num) {
    document.querySelector('[data-pane-id=results] .results-number').innerText = num;
}

function add_to_order () {
    if (window.Catalog.userInfo.IsAuthenticated && cart_enabled()) {        
        window.Catalog.cartPanel.items = window.Catalog.favoritesList.items.filter(item => item.selected);
        show_cart();
    }
    else {
        window.Catalog.dlgAuth.show();
    }    
}

function show_cart () {    
    if (window.Catalog.cartPanel.count > 0) {
        get_permalink_id()
        .then(id => {
            window.Catalog.cartPanel.permalink = get_permalink_url(id);
            window.Catalog.cartPanel.show();
        })
        .catch(e => {
            console.log(e);
        });                        
    }
}

function init_drawing () {

    let setActive = id => {
        map.gmxDrawing.bringToFront();            
        switch (id) {
            case 'point':
                map.gmxDrawing.create('Point');
                break;
            case 'polygon':
                map.gmxDrawing.create('Polygon');
                break;
            case 'polyline':
                map.gmxDrawing.create('Polyline');
                break;
            case 'rectangle':
                map.gmxDrawing.create('Rectangle');
                break;
            default:
                break;
        }
    };  

    let activeIcon = null;  
    
    let handleStateChange = e => {
        const opt = e.target.options;
        const id = opt.id;
        if (id === activeIcon) {
            setActive();            
        } else if (opt.isActive) {
            setActive(id);            
        }
        setActiveIcon(e.target);
    };  

    map.gmxDrawing
    // .on('drawstart', e => {
    //     window.Catalog.preventShowQuicklook = true;
    // })
    .on('drawstop', e => {
        const opt = e.object._obj.options || {};
        if (!opt.ctrlKey && !opt.shiftKey) {
            if (!window.Catalog.searchSidebar.isOpened()) {
                setActiveIcon(e.object);
                window.Catalog.searchSidebar.open('search');
            }            
        } else {
            setActive(e.object.options.type);            
        }        
    });

    map._controlCorners.searchControls = document.querySelector('#search-controls');                
    map._controlCorners.drawControls = document.querySelector('#draw-controls');    
    map.gmxControlsManager.init({
        gmxHide: null,
        gmxLogo: null,
        gmxZoom: null,
        gmxDrawing: null,
        svgSprite: false,
    });

    let drawControls  = ['point','polyline','polygon','rectangle'].map(id => {
        let control = new L.Control.gmxIcon({
            id, position: 'drawControls', title: T.getText(`controls.${id}`), togglable: true
        });
        control.on ('statechange', handleStateChange);
        map.gmxControlsManager.add(control);
        map.addControl(control);
        return control;
    });    

    let setActiveIcon = (control, isActive) => {
        activeIcon = null;
        drawControls.forEach (ctr => {
            let flag = control === ctr && (isActive || ctr.options.isActive);
            ctr.setActive(flag);
            if (flag) { 
                activeIcon = ctr.options.id;
            }
        });       
        return activeIcon;
    };
}

function init_print () {
    let printControl = new L.Control.gmxIcon({
        id: 'print',
        position: 'searchControls',
        title: T.getText('controls.print'),            
        stateChange: () => {
            window.open('http://search.kosmosnimki.ru/print-iframe_leaflet.html', '_blank');
        }
    });
    map.gmxControlsManager.add(printControl);
    map.addControl(printControl);
}

function init_permalink () {
    let dlgPermalink = create_container();
    dlgPermalink.style.display = 'none';
    dlgPermalink.classList.add('dialog-permalink');    
    dlgPermalink.innerHTML = `<input type="text" value=""/><button class="copy-button">${T.getText('alerts.clipboard')}</button>`;
    dlgPermalink.querySelector('.copy-button').addEventListener('click', e => {        
        dlgPermalink.querySelector('input[type="text"]').select();
        if (document.execCommand('copy')) {            
            dlgPermalink.style.display = 'none';
            window.Catalog.notificationWidget.content.innerText = T.getText('alerts.permalink');
            window.Catalog.notificationWidget.show();
        }
    });
    let permalinkControl = new L.Control.gmxIcon({
        id: 'link',
        position: 'searchControls',            
        title: T.getText('controls.permalink'),
        stateChange: control => {
            get_permalink_id().then(id => {                
                dlgPermalink.querySelector('input[type="text"]').value = get_permalink_url(id);                
                dlgPermalink.style.display = 'block';
            });
        }
    });
    map.gmxControlsManager.add(permalinkControl);
    map.addControl(permalinkControl);    
    dlgPermalink.style.top = `${document.getElementById('header').getBoundingClientRect().height}px`;
    dlgPermalink.style.left = '450px';
}

function init_boxzoom() {
    let zoomControl = new L.Control.gmxIcon({
        id: 'boxzoom',
        position: 'searchControls',
        toggle: true,
        title: T.getText('controls.zoom'),
        onAdd:  control => {                
            let _onMouseDown = map.boxZoom._onMouseDown;
            map.boxZoom._onMouseDown = e => {
                _onMouseDown.call(map.boxZoom, {
                    clientX: e.clientX,
                    clientY: e.clientY,
                    which: 1,
                    shiftKey: true
                });
            }
            map.on('boxzoomend', () => {
                map.dragging.enable();
                map.boxZoom.removeHooks();
                control.setActive(false);
            });
        },
        stateChange: control => {
            if (control.options.isActive) {
                map.dragging.disable();
                map.boxZoom.addHooks();
            } else {
                map.dragging.enable();
                map.boxZoom.removeHooks();
            }
        }
    });
    map.gmxControlsManager.add(zoomControl);
    map.addControl(zoomControl);
}

function init_zoom (){
    let zoomControl = L.control.zoom({position: 'bottomright'});
    map.gmxControlsManager.add(zoomControl);
    map.addControl(zoomControl);
}

function init_upload (shapeLoader) {
    let uploadControl = new L.Control.gmxIcon({
        id: 'upload',
        position: 'searchControls',
        title: T.getText('controls.upload'),
        stateChange: control => {            
            shapeLoader.upload()
            .then(({type, results}) => {                
                switch (type) {                    
                    case 'shapefile':
                        let bounds = null;
                        results.forEach(item => {
                            let {name, color, editable, visible, geoJSON: {geometry, properties}} = window.Catalog.resultsController.getObject ({geoJSON: item});
                            const drawing = window.Catalog.resultsController.addDrawing ({
                                name,
                                color,
                                geoJSON: {type: 'Feature', properties, geometry},
                                visible,
                                editable,
                            });
                            if (drawing) {
                                if (bounds) {
                                    bounds.extend(drawing.getBounds());
                                }
                                else {
                                    bounds = drawing.getBounds();
                                }                                            
                            }                    
                        }); 
                        let { height } =  mapContainer.getBoundingClientRect();
                        window.Catalog.drawnObjectsControl.widget.resize(height - 150);
                        map.fitBounds(bounds, { animate: false });
                        map.invalidateSize();
                        break;
                    case 'idlist':
                        let {fields, values, types, Count} = results;                        
                        if (Count){
                                                    
                            const geometry_index = fields.length - 1;
                            values.forEach (item => {
                                item[geometry_index] = L.gmxUtil.convertGeometry (item[geometry_index], false, true);
                            });

                            window.Catalog.resultsController.setLayer(results);
                            update_results_number(Count);
                        }                  
                        break;
                    default:
                        break;
                }                
            })
            .catch(e => {                
                console.log(e);
            });
        }
    });
    map.addControl(uploadControl);
}

function init_download (shapeLoader) {
    let dlgDownload = create_container();
    dlgDownload.style.display = 'none';
    dlgDownload.classList.add('dialog-download');
    dlgDownload.innerHTML = 
    `<table border="0" cellspacing="0" cellpadding="0">
        <tbody>
            <tr>
                <td class="download-type">${T.getText('download.type')}</td>
                <td>
                    <select>                        
                        <option value="borders">${T.getText('download.borders')}</option>
                        <option value="results">${T.getText('download.results')}</option>
                        <option value="cart">${T.getText('download.cart')}</option>
                        <option value="quicklooks">${T.getText('download.quicklooks')}</option>
                    </select>
                </td>
            </tr>
            <tr>
                <td class="download-file">${T.getText('download.file')}</td>
                <td>
                    <input type="text" value="${T.getText('download.noname')}"/>
                </td>
            </tr>
            <tr>
                <td colspan="2" class="download-footer">
                    <button class="download-ok">${T.getText('download.ok')}</button>
                    <button class="download-cancel">${T.getText('download.cancel')}</button>
                </td>
            </tr>
        </tbody>
    </table>`;

    dlgDownload.querySelector('.download-ok').addEventListener('click', e => {                
        let type = dlgDownload.querySelector('select').value;
        let name = dlgDownload.querySelector('input[type=text]').value;
        let valid = false;
        switch (type) {
            case 'borders':
                if (window.Catalog.drawnObjectsControl.widget.items.length > 0) {
                    valid = true;
                }
                break;
            case 'results':
                if (window.Catalog.resultsController.hasResults) {
                    valid = true;
                }
                break;
            case 'cart':
            case 'quicklooks':
                if (window.Catalog.resultsController.hasFavorites) {
                    valid = true;
                }
                break;                                            
            default:
                break;
        }
        if (valid) {            
            dlgDownload.style.display = 'none';
            shapeLoader.download(name, type);
        }        
        else {
            window.Catalog.notificationWidget.content.innerText = T.getText('download.noresults');
            window.Catalog.notificationWidget.show();         
        }        
    });
    dlgDownload.querySelector('input[type="text"]').addEventListener('focus', e => e.target.select());
    dlgDownload.querySelector('.download-cancel').addEventListener('click', e => {        
        dlgDownload.style.display = 'none';
    });

    let downloadControl = new L.Control.gmxIcon({
        id: 'download',
        position: 'searchControls',
        title: T.getText('controls.download'),
        stateChange: control => {
            if ((window.Catalog.resultsController.resultsCount + window.Catalog.resultsController.favoritesCount) > 0 || window.Catalog.drawnObjectsControl.widget.items.length) {
                dlgDownload.style.display = 'block';                
            }
            else {
                window.Catalog.notificationWidget.content.innerText = T.getText('download.empty');
                window.Catalog.notificationWidget.show();
            }
        }
    });
    map.addControl(downloadControl);
    dlgDownload.style.top = `${document.getElementById('header').getBoundingClientRect().height}px`;
    dlgDownload.style.left = `${downloadControl.getContainer().getBoundingClientRect().left}px`;
}

function init_base_layers() {
    const lang = T.getLanguage() || 'rus';
    let layers = map.gmxBaseLayersManager.getActiveIDs().map(id => {
        var layer = map.gmxBaseLayersManager.get(id);
        if (!layer) {
            return null;
        } else {
            return {
                layer: layer,
                icon: layer.options.icon,
                title: layer.options[lang]
            }
        }
    }).filter(e => e);

    let baseLayersControl = new IconLayers(layers, {id: 'iconLayers'});
    map.gmxControlsManager.add(baseLayersControl);
    map.addControl(baseLayersControl);
    
    shift_base_layers_control();
}

function init_controls(state) {        
    return new Promise(resolve => {

        init_drawing ();
        // init_print();
        init_permalink();
        init_boxzoom();
        init_zoom();
        window.Catalog.shapeLoader = new ShapeLoader({
            gmxResourceServer: window.Catalog.gmxResourceServer,
            resultsController: window.Catalog.resultsController,
            catalogResourceServer: window.Catalog.catalogResourceServer,
            drawnObjects: window.Catalog.drawnObjectsControl.widget,
        });
        init_upload(window.Catalog.shapeLoader);
        init_download(window.Catalog.shapeLoader);
        init_base_layers();    
        window.Catalog.notificationWidget = new NotificationWidget (map._controlCorners.right, {timeout: 2000});
        window.Catalog.loaderWidget = new LoaderWidget ();

        resolve(state);
    });
}

function read_permalink (id) {
    return new Promise((resolve, reject) => {        
        window.Catalog.gmxResourceServer.sendGetRequest('TinyReference/Get.ashx', { id: id })
        .then(response => {
            if (response.Status == 'ok') {
                try {                    
                    resolve(JSON.parse(response.Result));
                }
                catch (e) {
                    reject(e);
                }				        
            }
            else {
                reject(response.Result);
            }
        })
        .catch(e => reject(e));
    });
}

function init_cart (state) {
    return new Promise(resolve => {
        const restricted = (window.Catalog.userInfo.Role === 'scanex');
        window.Catalog.cartPanel = new Cart(create_container(), {catalogResourceServer: window.Catalog.catalogResourceServer, left: 400, top: 200, modal: true, internal: restricted});        
        
        update_cart_number(0);    

        window.Catalog.cartPanel.addEventListener('items:change', e => {
            update_cart_number(e.detail);
        });
        resolve(state);
    });
}

function load_search_criteria ({archive, date: [dateStart, dateEnd], annually, angle, clouds, stereo, satellites}) {
    let dates = [moment(dateStart).toDate(), moment(dateEnd).toDate()];
    let { ms, pc } = window.Catalog.defaultCriteria.satellites;
    ms.forEach(s => s.checked = (satellites.ms.indexOf(s.id) >= 0));
    pc.forEach(s => s.checked = (satellites.pc.indexOf(s.id) >= 0));
    window.Catalog.searchOptions.criteria = {
        archive,
        date: dates,
        annually,
        angle,
        clouds,
        stereo,
        satellites: {ms, pc},
    };
}

function load_state (state) {         
    localStorage.removeItem('view_state');
    T.setLanguage (state.lang || DEFAULT_LANGUAGE);
    L.gmxLocale.setLanguage(state.lang || DEFAULT_LANGUAGE);
    load_search_criteria(state.searchCriteria);
    state.drawingObjects.forEach(item => {        
        window.Catalog.resultsController.addDrawing(item);
    });
    update_results_number(state.items.length);    
    
    update_cart_number(state.cart.length);  
    
    let convert_date = (item, fields) => {
        for (let k in fields) {
            let field = fields[k];
            if (field.type === 'date') {
                item[k] = new Date(item[k]);
            }
        }
        return item;        
    }; 

    let items = state.items.reduce ((a,item) => {
        const {gmx_id} = item;
        a[gmx_id] = item;
        a[gmx_id].result = true;
        return a;
    }, {});

    items = state.cart.reduce((a,item) => {
        const {gmx_id} = item;        
        if (a[gmx_id]) {
            a[gmx_id].cart = true;
            if (item.hasOwnProperty('selected')) {
                a[gmx_id].selected = item.selected;
            }                
            if (item.hasOwnProperty('visible')) {
                a[gmx_id].visible = item.visible;
            }            
            else if (item.hasOwnProperty('quicklook')) {
                a[gmx_id].visible = item.quicklook;                
            }
        }
        else {
            a[gmx_id] = item;
            a[gmx_id].cart = true;
        }
        delete a[gmx_id].checked;
        delete a[gmx_id].quicklook;
        return a;
    }, items);

    let {fields, values, types} = Object.keys(items).reduce((a,gmx_id) => {
        let item = items[gmx_id];
        if (a.fields.length === 0) {
            layerAttributes.forEach((k,i) => {                
                if (k === 'selected' || k === 'visible' || k === 'result' || k === 'cart' || item.hasOwnProperty(k)) {
                    a.fields.push(k);                
                    a.types.push(layerAttrTypes[i]);
                }       
            });
        }
        
        let values = a.fields.map(k => {
            if (item[k]) {
                return item[k];
            } 
            else {
                return false;
            }
        });
        
        values.push(L.gmxUtil.convertGeometry(item.geoJSON, false, true));
        a.values.push(values);
        return a;
    }, {fields: [], values: [], types: []});
    
    window.Catalog.resultsController.setLayer({fields,values,types});
    // if (state.items.length > 0){
    //     window.Catalog.searchSidebar.enable ('results', true);        
    //     window.Catalog.resultsController.items = state.items.map(item => convert_date (item, window.Catalog.resultList.fields));
    // }

    // if (state.cart.length > 0) {
    //     window.Catalog.searchSidebar.enable ('favorites', true);
    //     window.Catalog.favoritesList.items = state.cart.map(item => convert_date(item, window.Catalog.favoritesList.fields));
    // }

    update_quicklooks_cart();
    
    let {x, y, z} = state.position;
    let center = L.Projection.Mercator.unproject({y, x});
    map.setView(center, 17 - z);
    map.invalidateSize();
    if (state.activeTabId) {
        if (window.Catalog.searchSidebar.enabled(state.activeTabId)) {            
            window.Catalog.searchSidebar.open(state.activeTabId);
        }
        else {
            window.Catalog.searchSidebar.open('search');
        }        
    }
    let { height } =  mapContainer.getBoundingClientRect();
    window.Catalog.drawnObjectsControl.widget.resize(height - 150);
}

function load_presets (state) {
    return new Promise(resolve => {                       
        let s = localStorage.getItem('view_state');        
        if (s) {            
            let viewState = JSON.parse (s);                        
            load_state(viewState);
            resolve(state);
        }
        else {
            let matches = /link=([^&]+)/g.exec(location.search);
            if (Array.isArray (matches) && matches.length > 0) {
                let [link,id,] = matches;
                read_permalink(id)
                .then (response => {
                    load_state(response);
                    resolve(state);
                })
                .catch(e => {
                    console.log(e);
                    resolve(state);
                });
            }
            else {
                resolve(state);
            }
        }
    });
}

chain([
    load_locale,
    load_map,
    init_baselayer_manager,
    set_active_layer,
    authenticate,
    get_user,
    check_access,
    init_sidebar,
    init_controls,
    init_cart,
    load_presets,
], {})
.then (state => {        
    let btnLogin = window.Catalog.authContainer.querySelector('.authWidget-loginButton');
    if (btnLogin) {
        btnLogin.addEventListener('click', e => {
            if (!localStorage.view_state) {
                localStorage.setItem('view_state', JSON.stringify(get_state()));
            }
        });
    }
    document.getElementById('help').addEventListener('click', e => {
        window.open ('https://scanex.github.io/Documentation/Catalog/index.html', '_blank');
    });
    window.Catalog.langWidget = new LanguageWidget(document.getElementById('lang'), {
        languages: {
            'eng': 'EN',
            'rus': 'RU'
        },        
    });
    window.Catalog.langWidget.currentLanguage = T.getLanguage();
    window.Catalog.langWidget.addEventListener('change', e => {
        T.setLanguage(e.detail);
        L.gmxLocale.setLanguage(e.detail);
        localStorage.setItem('view_state', JSON.stringify(get_state()));
        window.location.reload(true);
    });
});
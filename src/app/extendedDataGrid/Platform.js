import EventTarget from 'scanex-event-target';



export default class PlatformFilter extends EventTarget {

    constructor(config) {

        super();

        const {field, setClientFilter, closeAll} = config;

        this._field = field;
        this._setClientFilter = setClientFilter;
        this._closeAll = closeAll;

        this._unChecked = [];
        this._tmpUnchecked = [];
    }

    get unChecked() {

        return this._unChecked;
    }

    renderHeader(clear = false) {

        const {sortBy} = window.Catalog.resultList;

        if (clear) {
            this._unChecked = [];
            this._tmpUnchecked = [];
        }
        else {
            this._tmpUnchecked = [...this._unChecked];
        }

        this.prepareSatellites();

        const appliedDisplay = this._unChecked.length > 0 ? 'block' : 'none';
        const appliedClass = this._unChecked.length > 0 ? ' applied' : '';
        const sortIconDisplay = sortBy['field'] === 'platform' ? ''  : ' style="visibility: hidden"';

        let checkedCount = 0;
        this._satellites.forEach(satellite => {
            const {platforms} = satellite;
            if (platforms.some(platform => this._unChecked.indexOf(platform) === -1)) {
                checkedCount += 1;
            }
        });

        return (
            `<div class="filterable-field-container">
                <div class="on-hover-div">
                    <div class="filterable-applied">
                        <div style="display: ${appliedDisplay};">
                            <span class="checked">${checkedCount}</span>/<span class="all">${this._satellites.length}</span>
                        </div>
                    </div>
                    <span class="filterable-header-platform filterable-header${appliedClass}">${this._field['name']}</span>
                    <i class="table-list-sort"${sortIconDisplay}></i>
                </div>
                <div style="visibility: hidden;" class="togglable-content-platform togglable-content filterable-satellites-container">
                    <fieldset class="search-options-satellites-ms">
                        ${this._getSatelliteList(this._satellites)}
                    </fieldset>
                    <div class="apply">Применить</div>
                </div>
            </div>`
        );
    }

    attachEvents(column) {

        const filterableHeader = column.querySelector('.filterable-header');
        const satelliteCheckboxes = column.querySelectorAll('input[class="s-checkbox"]');
        const allCheckbox = column.querySelector('input[class="all-checkbox"]');
        const applyButton = column.querySelector('.apply');

        this._container = column;

        column.querySelector('.on-hover-div').addEventListener('mouseover', this._onSortMouseOver.bind(this));
        column.querySelector('.on-hover-div').addEventListener('mouseout', this._onSortMouseOut.bind(this));
        filterableHeader.addEventListener('click', this._onColumnClick.bind(this));
        applyButton.addEventListener('click', this._onApplyClick.bind(this));
        
        satelliteCheckboxes.forEach(item => {
            item.addEventListener('click', this._onCheckboxClick.bind(this));
        });
        if (allCheckbox) {
            allCheckbox.addEventListener('click', this._onAllCheckboxClick.bind(this));
        }
    }

    prepareSatellites(forReturn = false) {

        this._satellites = [];

        const {criteria} = window.Catalog.searchOptions;
        const {satellites} = criteria;

        const results = window.Catalog.resultList.items;
        let resultPlatforms = [];
        results.forEach(item => {
            const platform = item['platform'];
            if (resultPlatforms.indexOf(platform) === -1) {
                resultPlatforms.push(platform);
            }
        });

        satellites.ms.forEach(item => {
            const hasInResults = item.platforms.some(item => resultPlatforms.indexOf(item) !== -1);
            item.checked && hasInResults && this._satellites.push(item);
        });
        satellites.pc.forEach(item => {
            const hasInResults = item.platforms.some(item => resultPlatforms.indexOf(item) !== -1);
            item.checked && hasInResults && this._satellites.push(item);
        });

        this._setClientFilter(this._satellites);

        if (forReturn) {
            return this._satellites;
        }
    }

    _getSatelliteList(cache) {

        cache.sort((first, second) => {
            if(first['_name'] < second['_name']) {
                return -1;
            }
            if(first['_name'] > second['_name']) {
                return 1;
            }
            return 0;
        });

        let checkAll = '';
        if (cache.length > 3) {
            const checkedParametr = this._tmpUnchecked.length < 1 ? 'checked="checked"' : '';
            checkAll = `<div class="satellite-col">
                <input ${checkedParametr} type="checkbox" id="sat_check_all" class="all-checkbox" />
                <strong>Все спутники</strong>
            </div>`;
        }

        return checkAll + cache.map((x) => {
            const {id, name,platforms} = x;
            const isInUnchecked = platforms.some(platform => this._unChecked.indexOf(platform) !== -1 );
            const checkedParam = !isInUnchecked ? 'checked="checked"' : '';
            return `<div class="satellite-col">
                        <input ${checkedParam} type="checkbox" id="sat_${id}" value="${id}" class="s-checkbox" />
                        <label for="sat_${id}">${name}</label>
                    </div>`;
        }).join('');
    }

    _onColumnClick(e) {

        this._closeAll('platform');

        const {target} = e;

        if (target) {
            const hasActiveClass = target.classList.contains('active');
            const parentNode = target.parentNode.parentNode;
            const filterContainer = parentNode.querySelector('.togglable-content');

            if (!hasActiveClass) {
                target.classList.add('active');
                filterContainer.style.visibility = 'visible';
            }
            else {
                target.classList.remove('active');
                filterContainer.style.visibility = 'hidden';
                this._tmpUnchecked = [...this._unChecked];
                const satellitesContainer = this._container.querySelector('.search-options-satellites-ms');
                satellitesContainer.innerHTML = this._getSatelliteList(this._satellites);
                const satelliteCheckboxes = this._container.querySelectorAll('input[type="checkbox"]');
                satelliteCheckboxes.forEach(item => {
                    item.addEventListener('click', this._onCheckboxClick.bind(this));
                });
            }
        }
    }

    _onSortMouseOver(e) {

        const {sortBy} = window.Catalog.resultList;

        if (sortBy['field'] === 'platform') {
            return;
        }

        const {target} = e;

        if (target) {
            let sortIcon = target.querySelector('i');
            if (!sortIcon) {
                sortIcon = target.parentNode.querySelector('i');
            }

            const sortIconType = sortBy['field'] === 'platform' ? sortBy['asc'] ? 'up' : 'down' : sortBy['asc'] ? 'down' : 'up';
            const sortIconClass = 'table-list-sort-' + sortIconType;

            if (sortIcon) {
                sortIcon.classList.add(sortIconClass);
                sortIcon.style.visibility = 'visible';
            }
        }
    }

    _onSortMouseOut(e) {

        const {sortBy} = window.Catalog.resultList;

        if (sortBy['field'] === 'platform') {
            return;
        }

        const {target} = e;

        if (target) {
            let sortIcon = target.querySelector('i');
            if (!sortIcon) {
                sortIcon = target.parentNode.querySelector('i');
            }

            if (sortIcon) {
                sortIcon.style.visibility = 'hidden';
            }
        }
    }

    _onAllCheckboxClick() {

        const state = !(this._tmpUnchecked.length < 1);
        const allCheckboxes = this._container.querySelectorAll('input.s-checkbox');

        allCheckboxes.forEach(item => {
            item.checked = state;
            const event = {target: {checked: state, id: item.getAttribute('id')}};
            this._onCheckboxClick(event);
        });
    }

    _onCheckboxClick(e) {

        const {target} = e;
        const {checked, id} = target;

        const idArray = id.split(/sat_/);
        const correctId = idArray[1];

        const currentPlatforms = this._getSatellitePlatformsById(correctId);

        currentPlatforms.forEach(platform => {
            const unCheckedIndex = this._tmpUnchecked.indexOf(platform);
            if (!checked) {
                if (unCheckedIndex === -1) {
                    this._tmpUnchecked.push(platform);
                }
            }
            else {
                this._tmpUnchecked.splice(unCheckedIndex, 1);
            }
        });

        const allCheckbox = this._container.querySelector('input.all-checkbox');
        if (allCheckbox) {
            allCheckbox.checked = this._tmpUnchecked.length < 1;
        }
    }

    _onApplyClick(e) {

        const {target} = e;
        const parent = target.parentNode.parentNode;
        const filterableHeader = parent.querySelector('.filterable-header');
        const togglableContent = parent.querySelector('.togglable-content');
        const filterableApplied = parent.querySelector('.filterable-applied > div');

        this._unChecked = [...this._tmpUnchecked];

        filterableHeader.classList.remove('active');

        if (this._unChecked.length > 0) {
            filterableHeader.classList.add('applied');
            filterableApplied.style.display = 'block';
            filterableApplied.querySelector('.checked').innerText = (this._satellites.length - this._unChecked.length);
            filterableApplied.querySelector('.all').innerText = this._satellites.length;
        }
        else {
            filterableHeader.classList.remove('applied');
            filterableApplied.style.display = 'none';
        }

        togglableContent.style.display = 'none';

        let newSatellites = [];

        this._satellites.forEach(item => {
            const {platforms} = item;
            const arePlatformsInUnchecked = platforms.some(platform => this._unChecked.indexOf(platform) !== -1);
            if (!arePlatformsInUnchecked) {
                newSatellites.push(item);
            }
        });

        this._setClientFilter(newSatellites);

        let event = document.createEvent('Event');
        event.initEvent('clientFilter:apply', false, false);
        this.dispatchEvent(event);
    }

    _getSatellitePlatformsById(satelliteId) {

        const currentSatellite = this._satellites.filter(item => item['_id'] === satelliteId);
        
        return currentSatellite[0]['_platforms'];
    }

}
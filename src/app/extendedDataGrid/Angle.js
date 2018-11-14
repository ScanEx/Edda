import EventTarget from 'scanex-event-target';
import ExtendedSliderWidget from './ExtendedSliderWidget';



export default class AngleFilter extends EventTarget {

    constructor(config) {

        super();

        const {field, setClientFilter, closeAll} = config;

        this._field = field;
        this._setClientFilter = setClientFilter;
        this._closeAll = closeAll;

        this._minMaxValues = [0, 0];
        this._values = false;
    }

    initSlider() {

        this._angleSlider = new ExtendedSliderWidget(
            document.querySelector('.results-angle-slider-container'),
            {min: this._minMaxValues[0], max: this._minMaxValues[1]}
        );
        this._angleSlider.values = this._values;
    }

    renderHeader(clear = false) {

        const {sortBy} = window.Catalog.resultList;

        if (clear) {
            this._values = this._minMaxValues;
        }

        this._prepareMinMaxValues();

        const [minLimit, maxLimit] = this._minMaxValues;
        const [minValue, maxValue] = this._values;

        const isChanged = minLimit !== minValue || maxLimit !== maxValue;
        const appliedDisplay = isChanged ? 'block' : 'none';
        const appliedClass = isChanged > 0 ? ' applied' : '';

        const sortIconDisplay = sortBy['field'] === 'tilt' ? ''  : ' style="visibility: hidden"';

        return (
            `<div class="filterable-field-container">
                <div class="on-hover-div">
                    <div class="filterable-applied">
                        <div style="display: ${appliedDisplay};">
                            <span class="min">${minValue}</span>-<span class="max">${maxValue}</span>
                        </div>
                    </div>
                    <span class="filterable-header-angle filterable-header${appliedClass}">${this._field['name']}</span>
                    <i class="table-list-sort"${sortIconDisplay}></i>
                </div>
                <div style="visibility: hidden; padding-top:10px;" class="togglable-content-angle togglable-content filterable-cloudness-container">
                    <div style="text-align: left;">
                        <input class="extended-slider-input min-input" type="text" value="${minValue}" />
                        -
                        <input class="extended-slider-input max-input" type="text" value="${maxValue}" />
                    </div>
                    <div class="results-angle-slider-container"></div>
                    <div class="min-value">${minValue}</div>
                    <div class="max-value">${maxValue}</div>
                    <div style="clear: both;"></div>
                    <div class="apply">Применить</div>
                </div>
            </div>`
        );
    }

    attachEvents(column) {

        const filterableHeader = column.querySelector('.filterable-header');
        const applyButton = column.querySelector('.apply');

        filterableHeader.addEventListener('click', this._onColumnClick.bind(this));
        applyButton.addEventListener('click', this._onApplyClick.bind(this));
        column.querySelector('.on-hover-div').addEventListener('mouseover', this._onSortMouseOver.bind(this));
        column.querySelector('.on-hover-div').addEventListener('mouseout', this._onSortMouseOut.bind(this));

        /*this._angleSlider.addEventListener('stop', () => {
            this._values = this._angleSlider.values;
        });*/
    }

    _prepareMinMaxValues() {

        const {criteria} = window.Catalog.searchOptions;
        const {angle} = criteria;

        this._minMaxValues = angle;
        this._values = this._values || angle;
    }

    _onSortMouseOver(e) {

        const {sortBy} = window.Catalog.resultList;

        if (sortBy['field'] === 'tilt') {
            return;
        }

        const {target} = e;

        if (target) {
            let sortIcon = target.querySelector('i');
            if (!sortIcon) {
                sortIcon = target.parentNode.querySelector('i');
            }

            const sortIconType = sortBy['field'] === 'tilt' ? sortBy['asc'] ? 'up' : 'down' : sortBy['asc'] ? 'down' : 'up';
            const sortIconClass = 'table-list-sort-' + sortIconType;

            if (sortIcon) {
                sortIcon.classList.add(sortIconClass);
                sortIcon.style.visibility = 'visible';
            }
        }
    }

    _onSortMouseOut(e) {

        const {sortBy} = window.Catalog.resultList;

        if (sortBy['field'] === 'tilt') {
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

    _onColumnClick(e) {

        this._closeAll('angle');

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
                this._angleSlider.setValues(this._values);
            }
        }
    }

    _onApplyClick(e) {

        const {target} = e;
        const parent = target.parentNode.parentNode;
        const filterableHeader = parent.querySelector('.filterable-header');
        const togglableContent = parent.querySelector('.togglable-content');
        const filterableApplied = parent.querySelector('.filterable-applied > div');

        this._values = this._angleSlider.values;

        filterableHeader.classList.remove('active');

        const [minLimit, maxLimit] = this._minMaxValues;
        const [minValue, maxValue] = this._values;

        const isChanged = minLimit !== minValue || maxLimit !== maxValue;

        if (isChanged) {
            filterableHeader.classList.add('applied');
            filterableApplied.style.display = 'block';
            filterableApplied.querySelector('.min').innerText = minValue;
            filterableApplied.querySelector('.max').innerText = maxValue;
        }
        else {
            filterableHeader.classList.remove('applied');
            filterableApplied.style.display = 'none';
        }

        togglableContent.style.visibility = 'hidden';

        this._setClientFilter(this._values);

        let event = document.createEvent('Event');
        event.initEvent('clientFilter:apply', false, false);
        this.dispatchEvent(event);
    }

}
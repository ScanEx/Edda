import EventTarget from 'scanex-event-target';
import Translations from 'scanex-translations';
import Pikaday from 'pikaday';

import ExtendedSliderWidget from './ExtendedDateSliderWidget';

import {get_difference_between_dates} from '../Utils/Utils';

const T = Translations;


export default class DateFilter extends EventTarget {

    constructor(config) {

        super();

        const {field, setClientFilter, closeAll} = config;

        this._field = field;
        this._setClientFilter = setClientFilter;
        this._closeAll = closeAll;

        const now = new Date();

        this._minMaxValues = [now, now];
        this._values = false;
    }

    renderHeader(clear = false) {

        const {sortBy} = window.Catalog.resultList;

        if (clear) {
            this._values = this._minMaxValues;
        }

        this._prepareMinMaxValues();

        const [minDate, maxDate] = this._minMaxValues;
        const [minValue, maxValue] = this._values;

        const isChanged = minDate.getTime() !== minValue.getTime() || maxDate.getTime() !== maxValue.getTime();
        const appliedDisplay = isChanged ? 'block' : 'none';
        const appliedClass = isChanged > 0 ? ' applied' : '';

        const datesDiff = get_difference_between_dates(minValue, maxValue);

        const sortIconDisplay = sortBy['field'] === 'acqdate' ? ''  : ' style="visibility: hidden"';

        return (
            `<div class="filterable-field-container">
                <div class="on-hover-div">
                    <div class="filterable-applied">
                        <div style="display: ${appliedDisplay};">
                            <span class="date-diff">${datesDiff}</span>
                        </div>
                    </div>
                    <span class="filterable-header-date filterable-header${appliedClass}">${this._field['name']}</span>
                    <i class="table-list-sort"${sortIconDisplay}></i>
                </div>
                <div style="visibility: hidden;" class="togglable-content-date togglable-content filterable-date-container">
                    <div style="text-align: left; padding-top: 10px;">
                        <input class="search-options-period-from-value min-input results-filter-date-start-container" type="text" value="${minValue}" />
                        -
                        <input class="search-options-period-to-value  max-input results-filter-date-end-container" type="text" value="${maxValue}" />
                    </div>
                    <div class="results-date-slider-container"></div>
                    <div class="min-value">${this._getMonthName(minDate.getMonth())} ${minDate.getFullYear()}</div>
                    <div class="max-value">${this._getMonthName(maxDate.getMonth())} ${maxDate.getFullYear()}</div>
                    <div class="apply" style="margin-top:25px;">Применить</div>
                </div>
            </div>`
        );
    }

    initSlider() {

        if (this._dateSlider) {
            const sliderContainer = this._dateSlider._container;
            sliderContainer.removeChild(sliderContainer.querySelector('.slider-widget-bar'));
            sliderContainer.classList.remove('slider-widget');
            sliderContainer.classList.remove('no-select');
        }

        const minTime = this._minMaxValues[0].getTime();
        const maxTime = this._minMaxValues[1].getTime();

        this._dateSlider = new ExtendedSliderWidget(
            document.querySelector('.results-date-slider-container'),
            {min: minTime, max: maxTime, mode: 'date', startDate: this._startDate, endDate: this._endDate}
        );

        const [minValue, maxValue] = this._values;
        const intValues = [minValue.getTime(), maxValue.getTime()];

        this._dateSlider.values = intValues;
    }

    attachEvents(column) {

        const filterableHeader = column.querySelector('.filterable-header');
        const applyButton = column.querySelector('.apply');

        filterableHeader.addEventListener('click', this._onColumnClick.bind(this));
        applyButton.addEventListener('click', this._onApplyClick.bind(this));
        column.querySelector('.on-hover-div').addEventListener('mouseover', this._onSortMouseOver.bind(this));
        column.querySelector('.on-hover-div').addEventListener('mouseout', this._onSortMouseOut.bind(this));
    }

    initDatePicker() {
    
        const [minValue, maxValue] = this._values;
        
        this._dateFormat = 'dd.mm.yy';
            let i18n = {
                previousMonth : 'Предыдущий месяц',
                nextMonth     : 'Следующий месяц',
                months        : ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'],
                weekdays      : ['Воскресенье','Понедельник','Вторник','Среда','Четверг','Пятница','Суббота'],
                weekdaysShort : ['Вс','Пн','Вт','Ср','Чт','Пт','Сб']
            };
            switch (T.getLanguage()){
                default:
                case 'rus':
                    moment.locale('ru');
                    break;
                case 'eng':
                    moment.locale('en');
                    i18n = {
                    previousMonth : 'Previous Month',
                    nextMonth     : 'Next Month',
                    months        : ['January','February','March','April','May','June','July','August','September','October','November','December'],
                    weekdays      : ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],
                    weekdaysShort : ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
                    };
                    break;
            }

            if (this._startDate) {
                this._startDate.destroy();
                this._startDate = null;
            }

            if (this._endDate) {
                this._endDate.destroy();
                this._endDate = null;
            }

            this._startDate = new Pikaday ({
                field: document.querySelector('.results-filter-date-start-container'),
                // format: 'L', 
                format: 'DD.MM.YYYY',
                yearRange: 20,
                i18n: i18n,
                keyboardInput: false,
                blurFieldOnSelect: false,
            });    
            
            this._endDate = new Pikaday ({
                field: document.querySelector('.results-filter-date-end-container'),
                // format: 'L', 
                format: 'DD.MM.YYYY',
                yearRange: 20,
                i18n: i18n,
                keyboardInput: false,
                blurFieldOnSelect: false,
            });  

        this._startDate.setDate(minValue);
        this._endDate.setDate(maxValue);
    }

    _getMonthName(month) {

        const monthObject = {
            0: 'янв',
            1: 'фев',
            2: 'мар',
            3: 'апр',
            4: 'май',
            5: 'июн',
            6: 'июл',
            7: 'авг',
            8: 'сен',
            9: 'окт',
            10: 'ноя',
            11: 'дек'
        }

        return monthObject[parseInt(month)];
    }

    _prepareMinMaxValues() {

        const {criteria} = window.Catalog.searchOptions;
        const {date} = criteria;

        this._minMaxValues = date;
        this._values = this._values || date;
    }

    _onSortMouseOver(e) {

        const {sortBy} = window.Catalog.resultList;

        if (sortBy['field'] === 'acqdate') {
            return;
        }

        const {target} = e;

        if (target) {
            let sortIcon = target.querySelector('i');
            if (!sortIcon) {
                sortIcon = target.parentNode.querySelector('i');
            }

            const sortIconType = sortBy['field'] === 'acqdate' ? sortBy['asc'] ? 'up' : 'down' : sortBy['asc'] ? 'down' : 'up';
            const sortIconClass = 'table-list-sort-' + sortIconType;

            if (sortIcon) {
                sortIcon.classList.add(sortIconClass);
                sortIcon.style.visibility = 'visible';
            }
        }
    }

    _onSortMouseOut(e) {

        const {sortBy} = window.Catalog.resultList;

        if (sortBy['field'] === 'acqdate') {
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

        this._closeAll('date');

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
                const [minValue, maxValue] = this._values;
                this._startDate.setDate(minValue);
                this._endDate.setDate(maxValue);
            }
        }
    }

    _onApplyClick(e) {

        const {target} = e;
        const parent = target.parentNode.parentNode;
        const filterableHeader = parent.querySelector('.filterable-header');
        const togglableContent = parent.querySelector('.togglable-content');
        const filterableApplied = parent.querySelector('.filterable-applied > div');

        filterableHeader.classList.remove('active');

        const [minDate, maxDate] = this._minMaxValues;
        const minValue = this._startDate.getDate();
        const maxValue = this._endDate.getDate();
        this._values = [minValue, maxValue];

        const isChanged = minDate.getTime() !== minValue.getTime() || maxDate.getTime() !== maxValue.getTime();

        if (isChanged) {
            const datesDiff = get_difference_between_dates(minValue, maxValue);
            filterableHeader.classList.add('applied');
            filterableApplied.style.display = 'block';
            filterableApplied.querySelector('.date-diff').innerText = datesDiff;
        }
        else {
            filterableHeader.classList.remove('applied');
            filterableApplied.style.display = 'none';
        }

        togglableContent.style.visibility = 'hidden';

        this._setClientFilter([minValue, maxValue]);

        let event = document.createEvent('Event');
        event.initEvent('clientFilter:apply', false, false);
        this.dispatchEvent(event);
    }

}
import EventTarget from 'scanex-event-target';
import Translations from 'scanex-translations';
import Pikaday from 'pikaday';

import {get_difference_between_dates} from '../Utils/Utils';

const T = Translations;


export default class DateFilter extends EventTarget {

    constructor(config) {

        super();

        const {field, setClientFilter} = config;

        this._field = field;
        this._setClientFilter = setClientFilter;

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
                    <span class="filterable-header${appliedClass}">${this._field['name']}</span>
                    <i class="table-list-sort"${sortIconDisplay}></i>
                </div>
                <div style="visibility: hidden;" class="togglable-content filterable-date-container">
                    <div class="search-options-period-section" style="padding-left: 5px; padding-right: 5px;">
                    <div class="search-options-period">
                        <div>
                            <div class="search-options-period-from label">${T.getText('period.from')}</div>
                            <input class="search-options-period-from-value results-filter-date-start-container" style="" type="text"/>
                        </div>
                        <div style="margin-top: 10px;">
                            <div class="search-options-period-to label">${T.getText('period.to')}</div>
                            <input class="search-options-period-to-value results-filter-date-end-container" type="text" />
                        </div>
                    </div>
                    </div>
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
    }

    initDatePicker() {
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
    
        //const endDate = new Date();    
        //const startDate = new Date(endDate.getFullYear(), 0, 1);

        const [minValue, maxValue] = this._values;
        
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
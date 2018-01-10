import './DropdownWidget.css';
import { EventTarget } from '../lib/EventTarget/src/EventTarget.js';
import { copy, extend } from './lib/Object.Extensions/Extensions.js';

// <String>options.title
// <String>options.className
// <String>options.trigger (hover|click|manual)
// <String>options.direction (down|up)
// <Boolean>options.adjustWidth
// <Boolean>options.showTopItem
class DropdownWidget extends EventTarget {
    constructor (options){
        super();
        this.options = extend({
            title: '',
            trigger: 'hover',
            direction: 'down',
            adjustWidth: true,
            showTopItem: true,
            titleClassName: ''
        }, options);

        this.$el = this.options.el;
        this.$el.classList.add ('dropdownWidget');
        this.$el.classList.add ('dropdownWidget-item');        

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
        if(options.titleClassName) {
            this.$dropdownTitle.classList.add(options.titleClassName);
        }        
        this.$dropdownTitle.innerHTML = this.options.title;
        this.$dropdownContainer.appendChild(this.$dropdownTitle);            

        if (!this.options.showTopItem) {
            this.$dropdownTitle.style.display = 'none';
        }

        if (this.options.trigger === 'hover') {
            this.$dropdownTitle.classList.add('ui-state-disabled');
            this.$titleContainer.addEventListener('mouseover', () => this.expand());
            this.$dropdownContainer.addEventListener('mouseleave', () => this.collapse());
        } else if (this.options.trigger === 'click') {
            this.$titleContainer.addEventListener('click', () => this.expand());
            this.$dropdownTitle.addEventListener('click', () => this.collapse());
        }

        if (this.options.direction === 'up') {
            this.$el.classList.add('dropdownWidget_direction-up');
        } else {
            this.$el.classList.add('dropdownWidget_direction-down');
        }

        this._items = {};
    }
    addItem (id, inst, position) {
        this._items[id] = inst;

        let $container = document.createElement('div');
        
        $container.classList.add('dropdownWidget-item');
        $container.classList.add('dropdownWidget-dropdownItem');
        $container.setAttribute('data-id', id);            
        $container.setAttribute('data-position', position);
        $container.addEventListener('click', je => {            
            // this.dispatchEvent(new CustomEvent("item:click", {
            //     detail: { dataId: je.currentTarget.getAttribute('data-id') }
            // }));
            
            let event = document.createEvent('Event');
            event.initEvent('item:click', false, false);
            event.detail = { dataId: je.currentTarget.getAttribute('data-id') };
            this.dispatchEvent(event);
            
            if (this.options.trigger === 'click') {
                this.collapse();
            }            
        });
        $container.appendChild(inst.el);
        this.$dropdownContainer.appendChild($container);
        this._sortItems()
    }

    setTitle (title) {
        this.$titleContainer.innerHTML = title;
        this.$dropdownTitle.innerHTML = title;
    }

    toggle () {
        this._expanded ? this.collapse() : this.expand();
        this._expanded = !this._expanded;
    }

    expand () {
        const r = this.$el.getBoundingClientRect();
        this.$dropdownContainer.style.minWidth = `${r.width}px`;
        this.$dropdownContainer.style.display = 'block';        
        
        // this.dispatchEvent(new CustomEvent("expand", { detail: { } }));

        let event = document.createEvent('Event');
        event.initEvent('expand', false, false);
        event.detail = {};
        this.dispatchEvent(event);
    }

    collapse () {
        this.$dropdownContainer.style.display = 'none';        
        // this.dispatchEvent(new CustomEvent("collapse", { detail: { } }));

        let event = document.createEvent('Event');
        event.initEvent('collapse', false, false);
        event.detail = {};
        this.dispatchEvent(event);
    }

    reset () {
        this.collapse();
    }

    _sortItems () {
        let containerEl = this.$dropdownContainer[0];
        let items = Array.prototype.slice.call(containerEl.children);

        let titleEl = items.splice(
            items.indexOf(containerEl.querySelector('.dropdownWidget-dropdownTitle')), 1
        );

        while (items.length) {
            let maxPositionIndex = items.indexOf(_.max(items, el => {
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
}

export { DropdownWidget };

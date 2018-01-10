import './DropdownMenuWidget.css';

class DropdownMenuWidget {
    constructor(options) {

        this._view = document.createElement('div');
        this._view.classList.add('dropdownMenuWidget');        
        this._view.innerHTML = options.items.map(this._renderItem.bind(this)).join('');
        let dropDown = this._view.querySelector('.dropdownMenuWidget-itemDropdown');
        if(dropDown) {
            dropDown.style.display = 'none';
        }
        let mouseTimeout = options.mouseTimeout || 100;
        let items = this._view.querySelectorAll('.dropdownMenuWidget-item');
        for (let i = 0; i < items.length; ++i){
            let mouseIsOver = false;
            items[i].addEventListener('mouseenter', je => {
                mouseIsOver = true;
                setTimeout(() => {
                    if (mouseIsOver) {
                        let dd = je.target.querySelector('.dropdownMenuWidget-itemDropdown');
                        if(dd) {
                            dd.style.display = 'block';
                        }
                        
                    }
                }, 100);
            });
            items[i].addEventListener('mouseleave', je => {
                mouseIsOver = false;
                let dd = je.target.querySelector('.dropdownMenuWidget-itemDropdown');
                if(dd) {
                    dd.style.display = 'none';
                }                
            });
        }
    }
    _renderDropdown ({className, id, link, newWindow, icon, title}) {
        return `<li class="dropdownMenuWidget-dropdownMenuItem${ className ? (' ' + className) : ''}">
            ${ newWindow ? '<div class="ui-icon ui-icon-newwin dropdownMenuWidget-dropdownMenuIcon"></div>' : ''}
            <a
                ${ id ? 'id="' + id + '"' : ''}
                ${ link ? 'href="' + link + '"' : 'href="javascript:void(0)"'}
                ${ newWindow && link ? 'target="_blank"' : ''}
                class="dropdownMenuWidget-dropdownItemAnchor${ newWindow ? ' dropdownMenuWidget-dropdownItemAnchor_newWindow' : ''}"
            >
                ${ icon ? '<img src="' + icon + '"/>' : ''}
                ${ title ? '<span>' + title + '</span>' : ''}
            </a>
        </li>`;
    }
    _renderItem({className, id, link, newWindow, icon, fonticon, title, dropdown}) {
        return `<div class="dropdownMenuWidget-item${className ? ' ' + className : ''}">
        <a
            ${ id ? 'id="' + id + '"' : ''}
            ${ link ? 'href="' + link + '"' : 'href="javascript:void(0)"'}
            ${ newWindow && link ? 'target="_blank"': ''}
            class="dropdownMenuWidget-itemAnchor${ newWindow ? ' dropdownMenuWidget-itemAnchor_newWindow': ''}"
        >
            ${ icon ? '<img src="' + icon + '" />' : ''}
            ${ fonticon ? '<i class="' + fonticon + '"></i>' : ''}
            ${ title ? '<span>' + title + '</span>' + (dropdown ? '<i class="icon-angle-down"></i>' : '') : ''}
        </a>
        ${dropdown ? 
            '<div class="dropdownMenuWidget-itemDropdown">\
                <ul class="dropdownMenuWidget-dropdownMenu">' + dropdown.map(this._renderDropdown.bind(this)).join('') + '</ul>\
            </div>'
            : ''}
        </div>`;
    }
    appendTo (placeholder) {
        placeholder.appendChild(this._view);
    }
}

export { DropdownMenuWidget };
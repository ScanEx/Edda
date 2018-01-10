
function get_link () {
    get_url()
    .then(url => {
        this._openDialog(url);
    })
    .catch(err => {
        console.log(err);
        GeoUtils.showMessage(err.ErrorInfo.ErrorMessage);
    });
}

function get_url () {
    return new Promise ((resolve, reject) => {
        get_id()
        .then(id => {
            resolve(ResourceManager.getFullLocation('permalink.html?' + id))
        })
        .catch(err => {
            reject(err);
        });
    });			
}

		function get_id () {
            return new Promise((resolve, reject) => {
                var bundle = {};
			var fc = this._geometryController.getFeatures();
			var center = this._map.getCenter();
			var p = L.Projection.Mercator.project(center);
			var content = {
				lang: Locale.getLocale(),
				drawingObjects: fc.features,
				position: {
					x: p.x,
					y: p.y,
					z: 17 - this._map.getZoom()
				},
				activeLayer: this._map.gmxBaseLayersManager.getCurrentID(),
				selected: this._searchResultsController.getImagesSelected(),
				cart: this._searchResultsController.getImagesInCart(),
				bounds: this._map.getBounds(),
				searchCriteria: this._searchOptionsViewController.serialize(),
				visible: this._searchResultsController.getImagesSelected(true),
				cadastre: this._catalogPageController.getCadastreState()
			};
			this.rsGmx.sendPostRequest('TinyReference/Create.ashx', { content: JSON.stringify(content) })
				.done(function (response) {
					if (response.Status == 'ok') {
						def.resolve(response.Result);
					}
					else {
						def.reject(response.Result);
					}
				})
				.fail(def.reject);
            };
			
		}

class PermalinkAdapter {
	constructor () {

	}
	get content () {
		return {
			lang: Locale.getLocale(),
			drawingObjects: fc.features,
			position: {
				x: p.x,
				y: p.y,
				z: 17 - this._map.getZoom()
			},
			activeLayer: this._map.gmxBaseLayersManager.getCurrentID(),
			selected: this._searchResultsController.getImagesSelected(),
			cart: this._searchResultsController.getImagesInCart(),
			bounds: this._map.getBounds(),
			searchCriteria: this._searchOptionsViewController.serialize(),
			visible: this._searchResultsController.getImagesSelected(true),
			cadastre: this._catalogPageController.getCadastreState()
		};
	}
}

export { Permalink };

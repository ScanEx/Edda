const get_link = () => {
    get_url()
    .then(url => {
        this._openDialog(url);
    })
    .catch(err => {
        console.log(err);
        GeoUtils.showMessage(err.ErrorInfo.ErrorMessage);
    });
};

const get_url = () => new Promise ((resolve, reject) => {
	get_id()
	.then(id => {
		resolve(ResourceManager.getFullLocation('permalink.html?' + id))
	})
	.catch(err => {
		reject(err);
	});
});

const get_id = () => new Promise((resolve, reject) => {
	let bundle = {};
	let fc = this._geometryController.getFeatures();
	let center = this._map.getCenter();
	let p = L.Projection.Mercator.project(center);
	let content = {
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
});
				
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

export default PermalinkAdapter;

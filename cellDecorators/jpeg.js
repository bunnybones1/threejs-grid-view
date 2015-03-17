var __textureTransfer = require('../utils/textureTransfer');

var states = {
	UNLOADED: 0,
	LOADING: 1,
	NOT_FOUND: 2,
	LOADED: 3,
	RENDERED: 4
}

function _setData(data) {
	if(!data.url) {
		throw new Error('This cell is missing an image url.');
	}
	this.type = data.type;
	this.url = data.url;
	this.object3D.setCamera(__textureTransfer.camera);
	this.object3D.setScene(__textureTransfer.scene);
	this.reset();
}

function _update() {
	switch(this.state) {
		case states.LOADING:
			break;
		case states.LOADED:
		case states.NOT_FOUND:
			__render(this);
			this.object3D.update();
			if(this.texture) {
				this.texture.dispose();
				this.texture = null;
			}
			this.state = states.RENDERED;
			break;
		case states.RENDERED:
			break;
		case states.UNLOADED:
		default:
			__load(this);
	}
}

function _reset() {
	this.state = states.UNLOADED;
	this.needsUpdate = true;
	if(cellDecoratorJpeg.debugLevel >= 1) console.log('reset', this.name)
}

function __load(cell) {
	if(cellDecoratorJpeg.debugLevel >= 1) console.log('load', cell.name, cell.url)
	
	cell.texture = THREE.ImageUtils.loadTexture(
		cell.url, 
		undefined, 
		_onTextureLoadComplete.bind(cell), 
		_onTextureLoadError.bind(cell)
	);

	cell.state = states.LOADING;
	__render(cell);
}

function _onTextureLoadError(err) {
	if(cellDecoratorJpeg.debugLevel >= 1) console.log('load error', this.name);
	this.texture = undefined;
	this.state = states.NOT_FOUND;
}

function _onTextureLoadComplete(data) {
	if(cellDecoratorJpeg.debugLevel >= 1) console.log('load complete', this.name);
	this.state = states.LOADED;
}

function __render(cell) {
	switch(cell.state) {
		case states.LOADED:
			__textureTransfer.setMap(cell.texture, cell.height/cell.width);
			__textureTransfer.material.color.setRGB(1, 1, 1);
			if(cellDecoratorJpeg.debugLevel >= 1) console.log('render image', cell.name);
			break;
		case states.NOT_FOUND:
			__textureTransfer.material.color.setRGB(.9, .2, .1);
			__textureTransfer.clearMap();
			if(cellDecoratorJpeg.debugLevel >= 1) console.log('render 404', cell.name);
			break;
		case states.LOADING:
		default:
			__textureTransfer.material.color.setRGB(.2, .4, .9);
			__textureTransfer.clearMap();
			if(cellDecoratorJpeg.debugLevel >= 1) console.log('render loading', cell.name);
			break;
	}
	__textureTransfer.material.color.offsetHSL(0, 0, Math.random() * 0.2);
	cell.needsUpdate = true;
}

function cellDecoratorJpeg(cell) {
	cell.setData = _setData;
	cell.update = _update;
	cell.reset = _reset;
}
cellDecoratorJpeg.debugLevel = 0;

module.exports = cellDecoratorJpeg;
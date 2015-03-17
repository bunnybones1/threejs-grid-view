function _setData(data) {
	if(!data.camera || !data.scene) {
		throw new Error('This cell is missing camera or scene.');
	}
	this.object3D.setCamera(data.camera);
	this.object3D.setScene(data.scene);
	this.needsUpdate = true;
}

function _update() {
	if(this.needsUpdate || this.alwaysUpdate) {
		this.object3D.update();
		this.needsUpdate = false;
	}
}

function cellDecoratorCctv(cell) {
	cell.setData = _setData;
	cell.update = _update;
}

module.exports = cellDecoratorCctv;
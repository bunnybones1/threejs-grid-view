var EmptyTexture = require('./EmptyTexture');
var _scene = new THREE.Scene();
var _camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -1, 1);
var _geometry = new THREE.PlaneGeometry(2, 2, 1, 1);
var _tempTexture = new EmptyTexture(0xffffff, 0xffffff);
var _material = new THREE.MeshBasicMaterial({
	color: 0x2f4f8f,
	map: _tempTexture,
	side: THREE.DoubleSide
});
var _mesh = new THREE.Mesh(_geometry, _material);
_scene.add(_mesh);
_scene.add(_camera);

function _setMap(map, targetAspect, scale) {
	scale = scale || 1;
	var mapAspect = map.image.height / map.image.width;
	var aspect = targetAspect / mapAspect;
	if(aspect > 1) {
		_mesh.scale.set(aspect, 1, 1);
		// _material.color.setRGB(1+(Math.random()*.25), .75+(Math.random()*.25), .75+(Math.random()*.25));
	} else {
		_mesh.scale.set(1, 1/aspect, 1);
		// _material.color.setRGB(.75+(Math.random()*.25), 1+(Math.random()*.25), .75+(Math.random()*.25));
	}
	_mesh.scale.multiplyScalar(scale);
	_material.map = map;
}



function _clearMap() {
	_mesh.scale.set(1, 1, 1);
	_material.map = _tempTexture;
}

var textureTransfer = {
	scene: _scene,
	camera: _camera,
	material: _material,
	mesh: _mesh,
	setMap: _setMap,
	clearMap: _clearMap
};

module.exports = textureTransfer;
var LightProbe = require('threejs-light-probe'),
	CheckerRoom = require('threejs-checkerroom');

function TestScene() {
	this.camera = new THREE.PerspectiveCamera();
	this.scene = new THREE.Scene();
	//dolly
	this.dolly = new THREE.Object3D();
	this.scene.add(this.dolly);
	this.camera.position.z = 8;
	this.camera.position.y = 4;
	this.camera.lookAt(new THREE.Vector3(0, 1, 0));
	this.dolly.add(this.camera);

	//lights
	var light = new THREE.PointLight(0xffffff, .5);
	light.position.x = 5;
	light.position.y = 30;
	this.scene.add(light);
	var hemisphereLight = new THREE.HemisphereLight(0x7f6f5f, 0x7f0000);
	this.scene.add(hemisphereLight);

	//something to reflect
	this.lightMesh = new THREE.Mesh(
		new THREE.SphereGeometry(2, 16, 8),
		new THREE.MeshBasicMaterial({
			color: new THREE.Color(140, 120, 100),
			emissive: new THREE.Color(10, 3, 1)
		})
	)

	this.lightMesh.position.copy(light.position);
	this.scene.add(this.lightMesh);

	var checkerRoom = new CheckerRoom(20, 20, 4);
	this.scene.add(checkerRoom);

	//test mirror ball

	var distance = 2;
	this.totalBalls = 6;
	this.lightProbes = [];
	var colors = [
		0xef7f7f,
		0xefef7f,
		0x7fef7f,
		0x7fefef,
		0x7f7fef,
		0xef7fef
	]
	for (var i = this.totalBalls; i > 0; i--) {
		var ratio = i / this.totalBalls;
		var angle = ratio * Math.PI * 2;

		var pos = new THREE.Vector3(Math.cos(angle) * distance, 1, Math.sin(angle) * distance);

		var lightProbe = new LightProbe();
		this.scene.add(lightProbe);
		// lightProbe.update(this.renderer, this.scene);

		var mirrorBall = new THREE.Mesh(
			new THREE.SphereGeometry(1, 32, 16),
			new THREE.MeshPhongMaterial({
				color: colors[i-1],
				// color: new THREE.Color(-.15, -.35, -4),
				// emissive: colors[i-1],
				// wireframe: true,
				combine: THREE.MultiplyOperation,
				envMap : lightProbe.getCubeMap(64, 1 * ratio * ratio * ratio, 3, false)
			})
		)

		this.scene.add(mirrorBall);
		mirrorBall.position.copy(pos);
		lightProbe.position.copy(pos);
		this.lightProbes.push(lightProbe);
	};

	this.onEnterFrame = this.onEnterFrame.bind(this);
}

TestScene.prototype = {
	bindRenderer: function(renderer) {
		this.renderer = renderer;
	},
	onEnterFrame: function() {
		this.dolly.rotation.y += .005;
		this.lightMesh.position.y = 10 * Math.sin((new Date()).getTime() * .001) + 11;
		for (var i = this.lightProbes.length - 1; i >= 0; i--) {
			this.lightProbes[i].update(this.renderer, this.scene);
		};
	}
}

module.exports = TestScene;
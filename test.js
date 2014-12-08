var onReady = function() {
	var View = require('threejs-managed-view').View,
		UnifiedPointers = require('input-unified-pointers'),
		GridView = require('./'),
		getUrlParam = require('urlparams').getParam,
		Resize = require('input-resize');

	var TestScene = require('./TestScene');
	var testScene = new TestScene();
	
	var view = new View({
		scene: testScene.scene,
		camera: testScene.camera,
		stats: true,
	});

	var totalViews = 40;
	var cellsPerPage = 12;

	var lookTarget = new THREE.Vector3(0, 1, 0);

	var gridCameras = [];
	for(var i = 0; i < totalViews; i++) {
		var camera = new THREE.PerspectiveCamera();
		camera.position.set(
			(Math.random() - .5) * 8,
			3,
			(Math.random() - .5) * 8
		)
		testScene.scene.add(camera);
		camera.lookAt(lookTarget);
		gridCameras.push(camera);
	}

	var rectangle;
	function setRectangle() {
		rectangle = {
			x: 10 + 100,
			y: 10,
			width: window.innerWidth-20-100,
			height: window.innerHeight-20
		};
	}
	setRectangle();
	rectangle.totalCells = cellsPerPage;
	var grid = new GridView({
		renderer: view.renderer,
		canvas: view.canvas,
		rectangle: rectangle,
		gridSolverParams: {
			preferredCellAspectRatio: 1,
			scoreWeightFill: 10,
			totalCells: cellsPerPage
		}
	});

	gridCameras.forEach(function(camera) {
		grid.createCell({
			camera: camera
		})
	});


	function setGridSize(x, y) {
		setRectangle();
		grid.setRectangle(rectangle);
	};

	setGridSize();

	testScene.bindRenderer(view.renderer);
	view.renderManager.onEnterFrame.add(testScene.onEnterFrame);
	// view.skipRender = true;

	var pointerPosition = {x:200, y:200};
	var pointers = new UnifiedPointers(view.canvas);
	pointers.onPointerHoverSignal.add(function(x, y, id) {
		pointerPosition.x = x;
		pointerPosition.y = y;
	});

	pointers.onPointerDownSignal.add(function(x, y) {
		this.dragStartY = y;
		this.startScrollY = grid.gridLayout.scrollY;
		speedHistory = [];
	});

	var residualScroll = 0;
	var residualScrollEase = .9;
	pointers.onPointerUpSignal.add(function(x, y) {
		if(speedHistory.length > 2) {
			var averageSpeed = 0;
			speedHistory.forEach(function(speed) {
				averageSpeed += speed;
			})
			averageSpeed /= speedHistory.length;
			residualScroll = averageSpeed;
		}
	});

	var speedHistory = [];
	var speedHistoryLength = 4;
	function updateSpeedHistory(speed) {
		speedHistory.push(speed);
		if(speedHistory.length > 4) speedHistory.splice(0, 1);
	}
	pointers.onPointerDragSignal.add(function(x, y) {
		console.log(x, y);
		var lastScrollY = grid.gridLayout.scrollY;
		grid.gridLayout.scrollY = Math.min(Math.max(0, -y + this.dragStartY + this.startScrollY), grid.gridLayout.scrollYMax);
		updateSpeedHistory(grid.gridLayout.scrollY - lastScrollY);
	});

	view.renderManager.onEnterFrame.add(grid.onEnterFrame);
	view.renderManager.onEnterFrame.add(function(){
		var intersection = grid.getCellUnderPosition(pointerPosition.x, pointerPosition.y);
		if(intersection) {
			intersection.cell.needsRender = true;
		}
		grid.gridLayout.scrollY = Math.min(Math.max(0, grid.gridLayout.scrollY + residualScroll), grid.gridLayout.scrollYMax);
		residualScroll *= residualScrollEase;
		// grid.gridLayout.scrollY = (Math.min(1, Math.max(0, Math.sin((new Date()).getTime() * 0.0001) * .6 + .5))) * grid.gridLayout.scrollYMax;
	});
	view.renderManager.onExitFrame.add(grid.render);
	Resize.onResize.add(setGridSize);
	view.renderManager.skipFrames = 0;
}

var loadAndRunScripts = require('loadandrunscripts');
loadAndRunScripts(
	[
		'bower_components/three.js/three.js',
		'lib/stats.min.js',
		'lib/threex.rendererstats.js',
	],
	onReady
);

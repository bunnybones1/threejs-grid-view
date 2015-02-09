var onReady = function() {
	var View = require('threejs-managed-view').View,
		UnifiedPointers = require('input-unified-pointers'),
		GridView = require('./'),
		getUrlParam = require('urlparams').getParam,
		Resize = require('input-resize'),
		RenderRegion = require('threejs-render-region'),
		ScrollPhysics = require('touch-scroll-physics');

	var TestScene = require('./TestScene');
	var testScene = new TestScene();
	
	var view = new View({
		scene: testScene.scene,
		camera: testScene.camera,
		stats: true,
		useRafPolyfill: false
	});

	testScene.bindRenderer(view.renderer);
	view.renderManager.onEnterFrame.add(testScene.onEnterFrame);
	// view.skipRender = true;
	// 
	var w = window.innerWidth;
	var h = window.innerHeight;
	var offsetGridX = w * .5;
	var renderRegionLeft = new RenderRegion(w, h, 0, 0, w*.5, h);
	var renderRegionRight = new RenderRegion(w, h, w*.5, 0, w*.5, h);


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

	var rectangle = {
		x: 0,
		y: 0,
		width: window.innerWidth,
		height: window.innerHeight
	};

	rectangle.totalCells = cellsPerPage;
	var grid = new GridView({
		renderer: view.renderer,
		// canvas: view.canvas,
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



	var pointerPosition = {x:200, y:200};
	var pointers = new UnifiedPointers(view.canvas);
	var lastX = 0;
	var dragging;
	pointers.onPointerMoveSignal.add(function(x, y) {
		pointerPosition.x = x;
		pointerPosition.y = y;
	});
	pointers.onPointerDownSignal.add(function(x, y) {
		dragging = renderRegionRight.contains(x, y);
		if(dragging) scrollPhysics.start(x);
		lastX = x;
	});
	pointers.onPointerUpSignal.add(function(x, y) {
		if(dragging) scrollPhysics.end(x);
		dragging = false;
		lastX = x;
	});
	pointers.onPointerDragSignal.add(function(x, y) {
		if(dragging) scrollPhysics.move(x);
		lastX = x;
	});

	var scrollPhysics = new ScrollPhysics({
		totalCells: Math.ceil(totalViews / grid.gridLayout.rows),
		cellSize: grid.gridLayout.cellWidth,
		viewSize: window.innerWidth,
		gutterSize: 100,
		dipToClosestCell: true
	});

	view.renderManager.onEnterFrame.add(function(){
		scrollPhysics.update();
		grid.gridLayout.scrollX = scrollPhysics.value;
		grid.onEnterFrame();
		var intersection = grid.getCellUnderPosition(pointerPosition.x-offsetGridX, pointerPosition.y);
		if(intersection) {
			intersection.cell.needsRender = true;
		}
		// grid.gridLayout.scrollX = Math.min(Math.max(0, grid.gridLayout.scrollX + residualScroll), grid.gridLayout.scrollXMax);
		// residualScroll *= residualScrollEase;
		// grid.gridLayout.scrollX = (Math.min(1, Math.max(0, Math.sin((new Date()).getTime() * 0.0001) * .6 + .5))) * grid.gridLayout.scrollXMax;
	});
	view.renderManager.onEnterFrame.add(function() {
		renderRegionLeft.apply(view.renderer);
	});
	view.renderManager.onExitFrame.add(function() {
		renderRegionRight.apply(view.renderer);
		grid.render();
	});
	view.renderManager.skipFrames = 0;


	function onResize(w, h) {
		offsetGridX = w * .5;
		renderRegionLeft.setFullSizeAndRegion(w, h, 0, 0, w*.5, h);
		renderRegionRight.setFullSizeAndRegion(w, h, w*.5, 0, w*.5, h);
	}
	renderRegionRight.onChangeSignal.add(function(x, y, w, h) {
		view.camera.aspect = w/h;
		view.camera.updateProjectionMatrix();
	})

	renderRegionRight.onChangeSignal.add(function(x, y, w, h) {
		rectangle.width = w;
		rectangle.height = h;
		grid.setRectangle(rectangle);
		scrollPhysics.viewSize = w;
		scrollPhysics.cellSize = grid.gridLayout.cellWidth;
		scrollPhysics.totalCells = Math.ceil(totalViews / grid.gridLayout.rows);
		scrollPhysics.updateSize();
	});

	Resize.onResize.add(onResize);
	onResize(window.innerWidth, window.innerHeight);

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

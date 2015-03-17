var onReady = function() {
	var View = require('threejs-managed-view').View,
		UnifiedPointers = require('input-unified-pointers'),
		GridView = require('./'),
		getUrlParam = require('urlparams').getParam,
		Resize = require('input-resize'),
		RenderRegion = require('threejs-render-region'),
		ScrollPhysics = require('touch-scroll-physics');
		cellDecoratorJpeg = require('./cellDecorators/jpeg'),
		cellDecoratorCctv = require('./cellDecorators/cctv');


	var TestScene = require('./TestScene');
	var testScene = new TestScene();
	
	var view = new View({
		scene: testScene.scene,
		camera: testScene.camera,
		stats: true,
		useRafPolyfill: false
	});

	testScene.skipFrames = 20;

	testScene.bindRenderer(view.renderer);
	view.renderManager.onEnterFrame.add(testScene.onEnterFrame);
	// view.skipRender = true;
	// 
	var w = window.innerWidth;
	var h = window.innerHeight;
	var offsetGridX = w * .5;
	var renderRegionLeft = new RenderRegion(w, h, 0, 0, w*.5, h);
	var renderRegionRight = new RenderRegion(w, h, w*.5, 0, w*.5, h);


	var totalCells = 1000;
	var cellsPerPage1 = 12;
	var cellsPerPage2 = 4;

	var lookTarget = new THREE.Vector3(0, 1, 0);

	var gridCameras1 = [];
	for(var i = 0; i < totalCells; i++) {
		var camera = new THREE.PerspectiveCamera();
		camera.position.set(
			(Math.random() - .5) * 8,
			3,
			(Math.random() - .5) * 8
		)
		// testScene.scene.add(camera);
		camera.lookAt(lookTarget);
		gridCameras1.push(camera);
	}

	var gridCameras2 = [];
	for(var i = 0; i < totalCells; i++) {
		var camera = new THREE.PerspectiveCamera();
		camera.position.set(
			(Math.random() - .5) * 8,
			3,
			(Math.random() - .5) * 8
		)
		// testScene.scene.add(camera);
		camera.lookAt(lookTarget);
		gridCameras2.push(camera);
	}

	var rectangle = {
		x: 0,
		y: 0,
		width: window.innerWidth,
		height: window.innerHeight
	};

	var scrollAxis = 'x';

	var grid = new GridView({
		renderer: view.renderer,
		// canvas: view.canvas,
		rectangle: rectangle,
		scrollAxis: scrollAxis,
		gridSolverParams: {
			preferredCellAspectRatio: 1,
			scoreWeightFill: 10
		}
	});

	var cellsData1 = [];
	gridCameras1.forEach(function(camera) {
		cellsData1.push({
			camera: camera,
			scene: testScene.scene,
			cellDecorator: cellDecoratorCctv
		});
	});

	var cellsData2 = [];
	var testImages = [];
	for (var i = 1; i <= 5; i++) {
		testImages.push('testAssets/fractal' + i + '.jpg');
	}
	gridCameras2.forEach(function(camera, i) {
		if(i%2 === 0) {
			cellsData2.push({
				url: testImages[i%testImages.length],
				cellDecorator: cellDecoratorJpeg
			});
		} else {
			cellsData2.push(cellsData1[i]);
		}
	});

	grid.setData(cellsData1);

	setTimeout(function() {
		grid.setPreferredCellCount(cellsPerPage2);
		grid.setData(cellsData2);
		resizeScrollPhysics(scrollPhysics, rectangle.width, rectangle.height);
	}, 2000);

	var pointerPosition = {x:200, y:200};
	var pointers = new UnifiedPointers(view.canvas);
	var dragging;

	function onPointerDownScrollXStart(x, y) {
		dragging = renderRegionRight.contains(x, y);
		if(dragging) scrollPhysics.start(x);
	}
	function onPointerDownScrollYStart(x, y) {
		dragging = renderRegionRight.contains(x, y);
		if(dragging) scrollPhysics.start(y);
	}

	function onPointerDragScrollX(x, y) {
		if(dragging) scrollPhysics.move(x);
	}
	function onPointerDragScrollY(x, y) {
		if(dragging) scrollPhysics.move(y);
	}

	function onPointerUpScrollXStop(x, y) {
		if(dragging) scrollPhysics.end(x);
		dragging = false;
	}
	function onPointerUpScrollYStop(x, y) {
		if(dragging) scrollPhysics.end(y);
		dragging = false;
	}

	pointers.onPointerMoveSignal.add(function(x, y) {
		pointerPosition.x = x;
		pointerPosition.y = y;
	});

	var scrollPhysics;
	var scrollPhysicsParams = {
		gutterSize: 100,
		dipToClosestCell: true
	}

	var updateScroll;
	function updateScrollX() {
		scrollPhysics.update();
		grid.gridLayout.scrollX = scrollPhysics.value;
	}
	function updateScrollY() {
		scrollPhysics.update();
		grid.gridLayout.scrollY = scrollPhysics.value;
	}

	function resizeScrollPhysics(target, width, height) {
		if(scrollAxis === 'x') {
			target.totalCells = Math.ceil(totalCells / grid.gridSolution.rows);
			target.cellSize = grid.gridSolution.cellWidth;
			target.viewSize = width;
			target.cellPoolSize = (grid.gridSolution.cols+1) * grid.gridSolution.rows;
			if(scrollPhysics) {
				scrollPhysics.value = grid.gridLayout.scrollX;
				scrollPhysics.momentum = 0;
			}
		} else {
			target.totalCells = Math.ceil(totalCells / grid.gridSolution.cols);
			target.cellSize = grid.gridSolution.cellHeight;
			target.viewSize = height;
			target.cellPoolSize = (grid.gridSolution.rows+1) * grid.gridSolution.cols;
			if(scrollPhysics) {
				scrollPhysics.value = grid.gridLayout.scrollY;
				scrollPhysics.momentum = 0;
			}
		}
		if(target.updateSize) target.updateSize();
	}
	resizeScrollPhysics(scrollPhysicsParams, window.innerWidth * 5, window.height);

	if(scrollAxis === 'x') {
		updateScroll = updateScrollX;
		pointers.onPointerDownSignal.add(onPointerDownScrollXStart);
		pointers.onPointerUpSignal.add(onPointerUpScrollXStop);
		pointers.onPointerDragSignal.add(onPointerDragScrollX);
	} else {
		updateScroll = updateScrollY;
		pointers.onPointerDownSignal.add(onPointerDownScrollYStart);
		pointers.onPointerUpSignal.add(onPointerUpScrollYStop);
		pointers.onPointerDragSignal.add(onPointerDragScrollY);
	}

	scrollPhysics = new ScrollPhysics(scrollPhysicsParams);

	view.renderManager.onEnterFrame.add(function(){
		updateScroll();
		grid.onEnterFrame();
		var intersection = grid.getCellUnderPosition(pointerPosition.x-offsetGridX, pointerPosition.y);
		if(intersection) {
			intersection.cell.needsUpdate = true;
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
		resizeScrollPhysics(scrollPhysics, w, h);
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

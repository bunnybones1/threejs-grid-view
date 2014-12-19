var CameraDisplayObject3D = require('threejs-camera-display-object3d');
var setPlaneToOrthographicRectangle = require('threejs-helper-set-plane-to-orthographic-rectangle');
var gridCellPositioner = require('./grid-cell-positioners').verticalScroll;
var GridLayoutSolver = require('grid-layout-solver');
var _ = require('lodash');
var nameID = 0;
function generateName(baseName) {
	nameID++;
	return baseName + nameID;
}

function GridView(params) {
	params = _.merge({
		rectangle: {
			width: window.innerWidth-200,
			height: window.innerHeight-200,
			x: 100,
			y: 100
		},
		useDevicePixelRatio: true,
		renderRegion: true,
		scrollX: 0,
		scrollY: 0,
		autoClear: undefined,
		totalCells: 0,
		gridCellPositioner: gridCellPositioner
	}, params || {});
	_.assign(this, params);
	this.camera = new THREE.OrthographicCamera(0, 1, 0, 1, -100, 100);
	this.scene = new THREE.Scene();
	this.cells = [];


	this.gridLayout = new GridLayoutSolver(params.gridLayoutSolverParams);
	//extra grid properties
	this.gridLayout.scrollX = 0;
	this.gridLayout.scrollY = 0;

	//bind the following functions to this because they might be called from other scopes 
	var _this = this;
	['render', 'setRectangle', 'onEnterFrame'].forEach(function(funcName) {
		_this[funcName] = _this[funcName].bind(_this);
	});
	this.setRectangle(this.rectangle);
}

GridView.prototype = {
	onEnterFrame: function() {
		this.updateCameraBounds();
	},
	updateCameraBounds: function() {
		this.camera.left = this.gridLayout.x + this.gridLayout.scrollX;
		this.camera.right = this.gridLayout.x + this.gridLayout.width + this.gridLayout.scrollX;
		this.camera.top = this.gridLayout.y + this.gridLayout.scrollY;
		this.camera.bottom = this.gridLayout.y + this.gridLayout.height + this.gridLayout.scrollY;
		this.camera.updateProjectionMatrix();
	},
	getCellUnderPosition: function(x, y) {
		var intersection = gridCellPositioner.getCellIntersectionUnderPosition(this.gridLayout, x, y);
		if(intersection && intersection.index != -1 && intersection.index < this.totalCells) {
			intersection.cell = this.cells[intersection.index];
			return intersection;
		}
	},
	renderCellTextures: function() {
		var visibleCellIndices = this.gridCellPositioner.getVisibleIndices(this.gridLayout);
		var cells = this.cells;
		var totalCells = this.totalCells;
		var cellsUpdatedThisFrame = 0;
		visibleCellIndices.forEach(function(index){
			if(index >= 0 && index < totalCells) {
				var cell = cells[index];
				if(cell.needsRender || cell.alwaysRender) {
					cell.render();
					cellsUpdatedThisFrame++;
					cell.needsRender = false;
				}
			}
		})
		console.log('cellsUpdatedThisFrame', cellsUpdatedThisFrame);
	},
	render: function() {
		this.renderCellTextures();
		if(this.autoClear !== undefined) {
			this.backupAutoClear = this.renderer.autoClear;
			this.renderer.autoClear = this.autoClear;
		}
		if(this.renderRegion) {
			var w = ~~(this.canvas.width / this.renderer.devicePixelRatio);
			var h = ~~(this.canvas.height / this.renderer.devicePixelRatio);
			// console.log(w, h);
			var inverseY = h-this.gridLayout.y-this.gridLayout.height;
			this.renderer.setScissor(
				this.gridLayout.x,
				inverseY,
				this.gridLayout.width,
				this.gridLayout.height
			);
			this.renderer.setViewport(
				this.gridLayout.x, 
				inverseY,
				this.gridLayout.width, 
				this.gridLayout.height
			);
			this.renderer.enableScissorTest(true);
			this.renderer.render(this.scene, this.camera);
			this.renderer.setViewport(0, 0, w, h);
			this.renderer.setScissor(0, 0, w, h);
			this.renderer.enableScissorTest(false);
		} else {
			this.renderer.render(this.scene, this.camera);
		}
		if(this.autoClear !== undefined) {
			this.renderer.autoClear = this.backupAutoClear;
		}
	},
	createCell: function(cellProps) {
		if(!cellProps.camera) throw new Error("Please provide a camera");
		cellProps = _.merge({
			x: 0,
			y: 0,
			width: 100,
			height: 100,
			resolutionWidth: 100,
			resolutionHeight: 100,
			renderer: this.renderer
		}, cellProps);

		if(this.useDevicePixelRatio) {
			cellProps.resolutionWidth *= this.renderer.devicePixelRatio,
			cellProps.resolutionHeight *= this.renderer.devicePixelRatio
		}
		if(!cellProps.name) cellProps.name = generateName('cell');
		cellProps.object3D = new CameraDisplayObject3D(cellProps);
		cellProps.render = cellProps.object3D.render;
		this.cells.push(cellProps);
		this.layoutCell(this.totalCells);
		this.totalCells++;
		this.updateScrollBounds();
		this.scene.add(cellProps.object3D);
	},
	layoutCells: function() {
		for (var i = this.totalCells - 1; i >= 0; i--) {
			this.layoutCell(i);
		}
	},
	layoutCell: function(index) {
		var cell = this.cells[index];
		var cellRectangle = this.gridCellPositioner.getCellRectangleOfIndex(this.gridLayout, index);
		cellRectangle.x += this.gridLayout.x;
		cellRectangle.y += this.gridLayout.y;
		// console.log(cellRectangle);
		setPlaneToOrthographicRectangle(cell.object3D, cellRectangle);
		cell.object3D.setSize(cellRectangle.width, cellRectangle.height);
		cell.object3D.setResolution(cellRectangle.width * this.renderer.devicePixelRatio, cellRectangle.height * this.renderer.devicePixelRatio);
		cell.object3D.scale.y *= -1;
		cell.needsRender = true;
	},
	setRectangle: function(rectangle) {
		this.gridLayout.solve(rectangle);
		//extra precalculations for speed
		this.gridLayout.right = this.gridLayout.x + this.gridLayout.width;
		this.gridLayout.bottom = this.gridLayout.y + this.gridLayout.height;
		this.gridLayout.cellWidth = this.gridLayout.width / this.gridLayout.cols;
		this.gridLayout.cellHeight = this.gridLayout.height / this.gridLayout.rows;
		this.updateScrollBounds();
		
		this.updateCameraBounds();
		this.camera.updateProjectionMatrix();
		this.layoutCells();
	},
	updateScrollBounds: function() {
		var totalRows = Math.ceil(this.totalCells / this.gridLayout.cols);
		var rowsToScroll = Math.max(0, totalRows - this.gridLayout.rows);
		this.gridLayout.scrollYMax = rowsToScroll * this.gridLayout.cellHeight;
	}
}
module.exports = GridView;
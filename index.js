var CameraDisplayObject3D = require('threejs-camera-display-object3d');
var setPlaneToOrthographicRectangle = require('threejs-helper-set-plane-to-orthographic-rectangle');
var gridCellPositionerX = require('./cellPositioners/horizontalScroll');
var gridCellPositionerY = require('./cellPositioners/verticalScroll');
var GridLayoutSolver = require('grid-layout-solver');
var cellDecoratorCctv = require('./cellDecorators/cctv');
var Signal = require('signals').Signal;
var nameID = 0;

function noop() {}

function generateName(baseName) {
	nameID++;
	return baseName + nameID;
}

function GridView(params) {
	var _this = this;
	var _rectangle = params.rectangle || {
		width: window.innerWidth-200,
		height: window.innerHeight-200,
		x: 100,
		y: 100
	};

	var _changed = true;

	var _useDevicePixelRatio = params.useDevicePixelRatio || true;
	var _scrollX = params.scrollX || 0;
	var _scrollY = params.scrollY || 0;
	var _lastScrollX = _scrollX;
	var _lastScrollY = _scrollY;
	var _totalCells = params.totalCells || 0;
	var _debugLevel = params.debugLevel || 0;
	var _scrollAxis = params.scrollAxis || 'y';
	var _scrollAxisCapitalized = _scrollAxis.toUpperCase();
	var _margin = params.margin || 0;
	var _lastPreferredCellCount = 0;
	var _autoClear = params.autoClear || false;
	var _camera = new THREE.OrthographicCamera(0, 1, 0, 1, -100, 100);
	var _scene = new THREE.Scene();
	var _renderer = params.renderer;
	var _cells = [];
	var CellClass = params.CellClass ? params.CellClass : CameraDisplayObject3D;

	var onCellResetSignal = new Signal();

	var _scrollTolerance = 0.1;

	var _marginX = 0;
	var _marginY = 0;
	var _scrollXScale = 0;
	var _scrollYScale = 0;

	switch(_scrollAxis) {
		case 'x': 
			_gridCellPositioner = gridCellPositionerX;
			break;
		default: 
			_gridCellPositioner = gridCellPositionerY;
	}

	var _actualCellPoolSize = 0;
	var _cellPoolSize = 0;


	var _gridLayout = new GridLayoutSolver(params.gridSolverParams);
	var _gridSolution;
	//extra grid properties
	_gridLayout.scrollX = 0;
	_gridLayout.scrollY = 0;

	_setRectangle(_rectangle);

	function _onEnterFrame() {
		_updateCameraBounds();
	}

	function _updateCameraBounds() {
		_camera.left = _rectangle.x + _gridLayout.scrollX * _scrollXScale;
		_camera.right = _rectangle.x + _rectangle.width + _gridLayout.scrollX * _scrollYScale;
		_camera.top = _rectangle.y + _rectangle.height - _gridLayout.scrollY;
		_camera.bottom = _rectangle.y - _gridLayout.scrollY;
		_camera.updateProjectionMatrix();
		if(Math.abs(_lastScrollX - _gridLayout.scrollX) > _scrollTolerance || Math.abs(_lastScrollY !== _gridLayout.scrollY) > _scrollTolerance) {
			_changed = true;
		}
		_lastScrollX = _gridLayout.scrollX;
		_lastScrollY = _gridLayout.scrollY;
	};

	function _getCellUnderPosition(x, y) {
		var intersection = _gridCellPositioner.getCellIntersectionUnderPosition(_gridLayout, _rectangle, _gridSolution, x, y);
		if(intersection && intersection.index != -1 && intersection.index < _totalCells) {
			intersection.cell = _cells[intersection.index % _cellPoolSize];
			return intersection;
		}
	}

	function _updateCells() {
		var visibleCellIndices = _gridCellPositioner.getVisibleIndices(_gridLayout, _rectangle, _gridSolution);
		return visibleCellIndices.map(function(index){
			if(index >= 0 && index < _totalCells) {
				var cell = _cells[index % _cellPoolSize];
				if(cell.index !== index) _changeCellData(cell, index);
				if(cell.update) cell.update();
			}
		});
	}

	function _getVisibleCells() {
		var visibleCellIndices = _gridCellPositioner.getVisibleIndices(_gridLayout, _rectangle, _gridSolution);
		return visibleCellIndices.map(function(index){
			if(index >= 0 && index < _totalCells) {
				return _cells[index % _cellPoolSize];
			}
		}).filter(function(cell) {
			return !!cell;
		});
	}

	function _render() {
		_updateCells();
		_renderer.render(_scene, _camera);
	}

	function _createCell() {
		var cell = {
			x: 0,
			y: 0,
			width: _gridSolution.cellWidth,
			height: _gridSolution.cellHeight,
			resolutionWidth: ~~_gridSolution.cellWidth,
			resolutionHeight: ~~_gridSolution.cellHeight,
			renderer: _renderer,
			fresh: true
		};

		if(_useDevicePixelRatio) {
			cell.resolutionWidth *= _renderer.devicePixelRatio,
			cell.resolutionHeight *= _renderer.devicePixelRatio
		}
		if(!cell.name) cell.name = generateName('cell');
		cell.object3D = new CellClass(cell);
		if(!cell.object3D.changed) cell.object3D.changed = noop;
		var oldUpdate = cell.object3D.update.bind(cell.object3D);
		function newUpdate() {
			this._changed = true;
			oldUpdate.apply(this, arguments);
		}
		cell.object3D.update = newUpdate.bind(cell);
		function changed() {
			var a = this.object3D.changed();
			var b = this._changed;
			this._changed = false;
			return a || b;
		}
		cell.changed = changed;
		if(_debugLevel >= 1) console.log('create', cell.name);
		_cells.push(cell);
		_scene.add(cell.object3D);
	}

	function _destroyCell() {
		var cell = _cells.pop();
		if(_debugLevel >= 1) console.log('destroy', cell.name)
		_scene.remove(cell.object3D);
		cell.object3D.destroy();
	}

	function _layoutCells() {
		_cells.forEach(function(cell) {
			cell.needsUpdate = true;
			_layoutCell(cell, cell.index);
		});
	}

	function _layoutCell(cell, index) {
		var cellRectangle = _gridCellPositioner.getCellRectangleOfIndex(_gridSolution, index);
		cellRectangle.x += _rectangle.x;
		cellRectangle.y = _rectangle.height - cellRectangle.y - cellRectangle.height + _rectangle.y;
		if(_debugLevel >= 1) console.log('layout', cell.name, index);
		setPlaneToOrthographicRectangle(cell.object3D, cellRectangle);
		if(cell.x === cellRectangle.x
			&& cell.y === cellRectangle.y
			&& cell.width === cellRectangle.width
			&& cell.height === cellRectangle.height
		) return;
		cell.x = cellRectangle.x;
		cell.y = cellRectangle.y;
		cell.width = cellRectangle.width;
		cell.height = cellRectangle.height;
		cell.object3D.setSize(cellRectangle.width, cellRectangle.height);
		cell.object3D.setResolution(cellRectangle.width * _renderer.devicePixelRatio, cellRectangle.height * _renderer.devicePixelRatio);
		cell.object3D.visible = index < _totalCells;
		if(cell.reset) cell.reset();
	}

	function _changeCellData(cell, index) {
		var data = _data[index];
		if(cell.data === data) return;
		cell.index = index;

		//set/change cell behaviour
		if(data.cellDecorator !== cell.initdCellDecorator) {
			data.cellDecorator(cell);
			cell.initdCellDecorator = data.cellDecorator;
		}

		cell.setData(data);

		if(_debugLevel >= 1) console.log('change', cell.name, index);

		_layoutCell(cell, index);
		cell.needsUpdate = true;
		onCellResetSignal.dispatch(cell);
		delete cell.fresh;
	}

	function _setRectangle(rectangle) {
		_rectangle = rectangle;
		_solveGrid();
		//extra precalculations for speed
		_updateCameraBounds();
	}

	function _updateCellPool() {
		_cellPoolSize = _gridCellPositioner.getPoolSize(_gridSolution);
		_cellPoolSize = Math.min(_cellPoolSize, _totalCells);
		if(_actualCellPoolSize !== _cellPoolSize) {
			while(_actualCellPoolSize < _cellPoolSize) {
				_createCell();
				_actualCellPoolSize++;
			}
			while(_actualCellPoolSize > _cellPoolSize) {
				_destroyCell();
				_actualCellPoolSize--;
			}
		}
	}

	function _setData(data){
		_data = data;
		_totalCells = data.length;
		_updateCellPool();
		_cells.forEach(function(cell) {
			cell.index = -1;
			cell.needsUpdate = true;
		});
	}

	function _determineGridMargins() {
		_marginX = 0;
		_marginY = 0;
		if(_totalCells > _gridSolution.cellCount) {
			if(_scrollAxis === 'x') {
				_marginX = 0.25;
			} else {
				_marginY = 0.25;
			}
		}

		var paddedWidth = _rectangle.width + _gridSolution.cellWidth * _marginX;
		var ratioWidth = _rectangle.width / paddedWidth;
		_gridSolution.cellWidth *= ratioWidth;
		_gridSolution.innerWidth = _rectangle.width * ratioWidth;
		_gridSolution.marginWidth = _rectangle.width - _gridSolution.innerWidth;

		var paddedHeight = _rectangle.height + _gridSolution.cellHeight * _marginY;
		var ratioHeight = _rectangle.height / paddedHeight;
		_gridSolution.cellHeight *= ratioHeight;
		_gridSolution.innerHeight = _rectangle.height * ratioHeight;
		_gridSolution.marginHeight = _rectangle.height - _gridSolution.innerHeight;

	}

	function _determineScrolling() {
		_scrollXScale = _scrollYScale = _totalCells > _gridSolution.cellCount ? 1 : 0;
	}

	function _solveGrid() {
		var index = _gridSolution ? _gridCellPositioner.getIndexOfScroll(_gridSolution, _gridLayout['scroll' + _scrollAxisCapitalized]) : undefined;
		_gridSolution = _gridLayout.solve(_rectangle);
		_determineGridMargins();
		_determineScrolling();
		if(index !== undefined) _gridCellPositioner.setScrollFromIndex(_gridLayout, _gridSolution, index);
		_rectangle.right = _rectangle.x + _rectangle.width;
		_rectangle.bottom = _rectangle.y + _rectangle.height;
		_updateCellPool();
		_layoutCells();
		_this.gridSolution = _gridSolution;
	}

	function _setPreferredCellCount(val, force) {
		if(_lastPreferredCellCount === val && !force) return;
		_lastPreferredCellCount = val;
		_gridLayout.setPreferredCellCount(val);
		_solveGrid();
	}

	function getCellRectangleOfIndex(index) {
		var rect = _gridCellPositioner.getCellRectangleOfIndex(_gridSolution, index);
		rect.x += _rectangle.x;
		rect.y = _rectangle.height - rect.y - rect.height + _rectangle.y;
		return rect;
	}

	function _getScene() {
		return _scene;
	}

	function _getCamera() {
		return _camera;
	}

	function changed() {
		var anythingChanged = false;
		for (var i = _cells.length - 1; i >= 0; i--) {
			anythingChanged = _cells[i].object3D.changed() || anythingChanged;
		};
		if(_changed) {
			anythingChanged = true;
			_changed = false;
		}
		return anythingChanged;
	}

	this.setData = _setData;
	this.gridLayout = _gridLayout;
	this.setRectangle = _setRectangle;
	this.onEnterFrame = _onEnterFrame;
	this.getCellUnderPosition = _getCellUnderPosition;
	this.getVisibleCells = _getVisibleCells;
	this.render = _render;
	this.setPreferredCellCount = _setPreferredCellCount;
	this.cells = _cells;
	this.onCellResetSignal = onCellResetSignal;
	this.updateCells = _updateCells;
	this.getScene = _getScene;
	this.getCamera = _getCamera;
	this.getCellRectangleOfIndex = getCellRectangleOfIndex;
	this.changed = changed;
}

module.exports = GridView;

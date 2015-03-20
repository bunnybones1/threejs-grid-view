var verticalScroll = {
	getCellRectangleOfIndex: function (gridSolution, cellIndex) {
		return {
			x: (cellIndex % gridSolution.cols) * gridSolution.cellWidth,
			y: ~~(cellIndex / gridSolution.cols) * gridSolution.cellHeight,
			width: gridSolution.cellWidth,
			height: gridSolution.cellHeight
		}
	},
	getVisibleIndices: function(gridLayout, gridRectangle, gridSolution) {
		var indices = [];
		var firstRow = ~~(gridLayout.scrollY / gridSolution.innerHeight * gridSolution.rows);
		var lastRow = Math.ceil((gridLayout.scrollY+gridRectangle.height) / gridSolution.innerHeight * gridSolution.rows) - 1;
		for (var iRow = firstRow; iRow <= lastRow; iRow++) {
			for (var iCol = 0; iCol < gridSolution.cols; iCol++) {
				indices.push(iCol + iRow * gridSolution.cols);
			};
		};
		return indices;
	},
	getCellIntersectionUnderPosition: function(gridLayout, gridRectangle, gridSolution, x, y) {
		if(x > gridRectangle.x && y > gridRectangle.y && x < gridRectangle.right && y < gridRectangle.bottom) {
			var relX = (x - gridRectangle.x + gridLayout.scrollX) / gridSolution.innerWidth * gridSolution.cols;
			var relY = (y - gridRectangle.y + gridLayout.scrollY) / gridSolution.innerHeight * gridSolution.rows;
			var index = ~~relX + (~~relY) * gridSolution.cols;
			return {
				x: relX % 1,
				y: relY % 1,
				index: index
			}
		}
	},
	getPoolSize: function(gridSolution) {
		return gridSolution.cols * (gridSolution.rows+1);
	},
	getIndexOfScroll: function(gridSolution, scroll) {
		return ~~((scroll + gridSolution.cellHeight * .5) / gridSolution.cellHeight) * gridSolution.cols;
	},
	setScrollFromIndex: function(gridLayout, gridSolution, index) {
		gridLayout.scrollY = gridSolution.cellHeight * ~~(index / gridSolution.cols);
	}
}
module.exports = verticalScroll;
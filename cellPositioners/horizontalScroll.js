var wrap = require('number-wrap');

var horizontalScroll = {
	getCellRectangleOfIndex: function (gridSolution, cellIndex) {
		return {
			x: (~~((cellIndex / gridSolution.rows)+1)-1) * gridSolution.cellWidth,
			y: wrap(cellIndex, 0, gridSolution.rows) * gridSolution.cellHeight,
			width: gridSolution.cellWidth,
			height: gridSolution.cellHeight
		}
	},
	getVisibleIndices: function(gridLayout, gridRectangle, gridSolution) {
		var indices = [];
		var firstCol = ~~((gridLayout.scrollX / gridSolution.innerWidth * gridSolution.cols) + 1) - 1;
		var lastCol = Math.ceil((gridLayout.scrollX+gridRectangle.width) / gridSolution.innerWidth * gridSolution.cols) - 1;
		for (var iCol = firstCol; iCol <= lastCol; iCol++) {
			for (var iRow = 0; iRow < gridSolution.rows; iRow++) {
				indices.push(iRow + iCol * gridSolution.rows);
			};
		};
		return indices;
	},
	getCellIntersectionUnderPosition: function(gridLayout, gridRectangle, gridSolution, x, y) {
		if(x > gridRectangle.x && y > gridRectangle.y && x < gridRectangle.right && y < gridRectangle.bottom) {
			var relX = (x - gridRectangle.x + gridLayout.scrollX) / gridSolution.innerWidth * gridSolution.cols;
			var relY = (y - gridRectangle.y + gridLayout.scrollY) / gridSolution.innerHeight * gridSolution.rows;
			var index = ~~relY + (~~relX) * gridSolution.rows;
			return {
				x: relX % 1,
				y: relY % 1,
				index: index
			}
		}
	},
	getPoolSize: function(gridSolution) {
		return (gridSolution.cols+2) * gridSolution.rows;
	},
	getIndexOfScroll: function(gridSolution, scroll) {
		return ~~((scroll + gridSolution.cellWidth * .5) / gridSolution.cellWidth) * gridSolution.rows;
	},
	setScrollFromIndex: function(gridLayout, gridSolution, index) {
		gridLayout.scrollX = gridSolution.cellWidth * ~~(index / gridSolution.rows);
	}
}
module.exports = horizontalScroll;
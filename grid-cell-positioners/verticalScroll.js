var verticalScroll = {
	getCellRectangleOfIndex: function (gridLayout, cellIndex) {
		return {
			x: (cellIndex % gridLayout.cols) * gridLayout.cellWidth,
			y: ~~(cellIndex / gridLayout.cols) * gridLayout.cellHeight,
			width: gridLayout.cellWidth,
			height: gridLayout.cellHeight
		}
	},
	getVisibleIndices: function(gridLayout) {
		var indices = [];
		var firstRow = ~~(gridLayout.scrollY / gridLayout.height * gridLayout.rows);
		var lastRow = Math.ceil((gridLayout.scrollY+gridLayout.height) / gridLayout.height * gridLayout.rows) - 1;
		for (var iRow = firstRow; iRow <= lastRow; iRow++) {
			for (var iCol = 0; iCol < gridLayout.cols; iCol++) {
				indices.push(iCol + iRow * gridLayout.cols);
			};
		};
		return indices;
	},
	getCellIntersectionUnderPosition: function(gridLayout, x, y) {
		if(x > gridLayout.x && y > gridLayout.y && x < gridLayout.right && y < gridLayout.bottom) {
			var relX = (x - gridLayout.x + gridLayout.scrollX) / gridLayout.width * gridLayout.cols;
			var relY = (y - gridLayout.y + gridLayout.scrollY) / gridLayout.height * gridLayout.rows;
			var index = ~~relX + (~~relY) * gridLayout.cols;
			return {
				x: relX % 1,
				y: relY % 1,
				index: index
			}
		}
	}
}
module.exports = verticalScroll;
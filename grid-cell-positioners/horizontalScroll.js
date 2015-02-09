var horizontalScroll = {
	getCellRectangleOfIndex: function (gridLayout, cellIndex) {
		return {
			x: ~~(cellIndex / gridLayout.rows) * gridLayout.cellWidth,
			y: (cellIndex % gridLayout.rows) * gridLayout.cellHeight,
			width: gridLayout.cellWidth,
			height: gridLayout.cellHeight
		}
	},
	getVisibleIndices: function(gridLayout) {
		var indices = [];
		var firstCol = ~~(gridLayout.scrollX / gridLayout.width * gridLayout.cols);
		var lastCol = Math.ceil((gridLayout.scrollX+gridLayout.width) / gridLayout.width * gridLayout.cols) - 1;
		for (var iCol = firstCol; iCol <= lastCol; iCol++) {
			for (var iRow = 0; iRow < gridLayout.rows; iRow++) {
				indices.push(iRow + iCol * gridLayout.rows);
			};
		};
		return indices;
	},
	getCellIntersectionUnderPosition: function(gridLayout, x, y) {
		if(x > gridLayout.x && y > gridLayout.y && x < gridLayout.right && y < gridLayout.bottom) {
			var relX = (x - gridLayout.x + gridLayout.scrollX) / gridLayout.width * gridLayout.cols;
			var relY = (y - gridLayout.y + gridLayout.scrollY) / gridLayout.height * gridLayout.rows;
			var index = ~~relY + (~~relX) * gridLayout.rows;
			return {
				x: relX % 1,
				y: relY % 1,
				index: index
			}
		}
	}
}
module.exports = horizontalScroll;
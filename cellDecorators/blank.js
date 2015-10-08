function noop() {};
function _update() {
};

function _setData(data) {
}

function cellDecoratorBlank(cell) {
	cell.setData = _setData;
	cell.update = _update;
	cell.reset = noop;
}
module.exports = cellDecoratorBlank;

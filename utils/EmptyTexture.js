function CheckerBoardTexture(color1, color2, rows, cols) {
	color1 = color1 || new THREE.Color(0xafafaf);
	color2 = color2 || new THREE.Color(0x3f3f3f);

	if(!(color1 instanceof THREE.Color)) color1 = new THREE.Color(color1);
	if(!(color2 instanceof THREE.Color)) color2 = new THREE.Color(color2);

	rows = rows || 4;
	cols = cols || 4;

	cols = Math.max(cols, 1);
	rows = Math.max(rows, 1);
	var size = 16;
	var pixelData = new Uint8Array( 3 * size );
	for (var i = 0, len = size; i < len; i++) {
		var i3 = i * 3;
		var color = (~~(i/2) % 2 == 0) ? color1 : color2;
		if(i >= 8) color = (color === color1) ? color2 : color1;
		pixelData[i3] = ~~(255 * color.r);
		pixelData[i3+1] = ~~(255 * color.g);
		pixelData[i3+2] = ~~(255 * color.b);
	};
	var width = 4,
		height = 4,
		format = THREE.RGBFormat,
		type = THREE.UnsignedByteType,
		mapping = undefined,
		wrapS = THREE.RepeatWrapping,
		wrapT = THREE.RepeatWrapping,
		magFilter = THREE.NearestFilter,
		minFilter = THREE.NearestFilter;

	THREE.DataTexture.call(this, pixelData, width, height, format, type, mapping, wrapS, wrapT, magFilter, minFilter);
	this.repeat.set(rows * .5, cols * .5);
	this.needsUpdate = true;
	// return THREE.ImageUtils.generateDataTexture(4, 4, new THREE.Color(0xff0000));

}

CheckerBoardTexture.prototype = Object.create(THREE.DataTexture.prototype);

module.exports = CheckerBoardTexture;
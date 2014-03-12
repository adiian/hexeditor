function asHex(i) {
	h = i.toString(16).toUpperCase();
	return (h.length % 2 != 0)? '0' + h : h;
}

//var fu = paddy(14, 5); // 00014
//var bar = paddy(2, 4, '#'); // ###2
function zeroFill(n, p, c) {
	var pad_char = typeof c !== 'undefined' ? c : '0';
	var pad = new Array(1 + p).join(pad_char);
	return (pad + n).slice(-pad.length);
}
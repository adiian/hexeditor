function asHex(i,lower) {
    h = lower == true ? i.toString(16).toLowerCase(): i.toString(16).toUpperCase();
	return (h.length % 2 != 0)? '0' + h : h;
}

//var fu = paddy(14, 5); // 00014
//var bar = paddy(2, 4, '#'); // ###2
function zeroFill(n, p, c) {
	var pad_char = typeof c !== 'undefined' ? c : '0';
	var pad = new Array(1 + p).join(pad_char);
	return (pad + n).slice(-pad.length);
}

function asString(dec) {
    var ch = '.';
    if (dec == 32)
        ch = '&nbsp;';
    else if (dec >= 32 && dec < 127)
        ch = String.fromCharCode(dec);

    return ch;
}

function getDecimalFromHex(hex) {
    return parseInt(hex, 16); 
}



function Hex(decimalVal,pos)
{
    this.decimalVal = decimalVal;
    this.pos = pos;
    this.initialDecimalVal = decimalVal;

    this.changeValue = function (newDecimalValue) {
        this.initialDecimalVal = this.decimalVal;
        this.decimalVal = newDecimalValue;
    };
}


function HexData(buff)
{
    var arrayHex = new Array(buff.length);
    var arrayBytes = new Uint8Array(buff);

    for (var i = 0; i < arrayBytes.length; ++i) {
        arrayHex[i] = new Hex( arrayBytes[i], i);
    }

    this.hexDataArray = arrayHex;
    this.selectedPos = -1;
    this.searchResultsPos = new Array();

    this.setSelectedPos = function (i) {
        this.selectedPos = i;
    };

    this.revert = function () {
        for (var i = 0; i < arrayBytes.length; ++i) {
            arrayHex[i].decimalVal = arrayHex[i].initialDecimalVal;
        }
    };

    this.search = function (searchType,searchText,address) {

        var searchResultPos = new Array();
        var searchArrayDec = new Array();
        var searchArrayHexa = new Array();
        var searchArrayChars = new Array();

        var decSplit, hexaSplit, charSplit;

        if (searchType == "Decimal") {
            decSplit = searchText.split(" ");
        } else {
            decSplit = new Array();
        }
        
        if (searchType == "Hexa") {
            if (searchText.indexOf(' ') == -1) {
                hexaSplit = new Array();
                for (var i = 0; i < searchText.length; i += 2) {
                    if (i + 1 < searchText.length) {
                        hexaSplit.push(searchText[i] + "" + searchText[i + 1]);
                    }
                }
            }
            else {
                hexaSplit = searchText.split(" ");
            }

        } else {
            hexaSplit = new Array();
        }

        if (searchType == "Char") {
            charSplit = searchText.split("");
        } else {
            charSplit = new Array();
        }
        
        if (decSplit.length > 0) {
            for (var i = 0; i < decSplit.length; ++i) {
                if (decSplit[i].match(/^\d{1,3}$/)){
                    searchArrayDec.push(parseInt(decSplit[i]));
                }
            }
        }
        
        if (hexaSplit.length > 0) {
            for (var i = 0; i < hexaSplit.length; ++i) {
                if (hexaSplit[i].match(/^[0-9A-Fa-f]{2}$/)) {
                    searchArrayHexa.push(getDecimalFromHex(hexaSplit[i]));
                }
            }
        }

        if (charSplit.length > 0) {
            for (var i = 0; i < charSplit.length; ++i) {
                if (charSplit[i] != "") {
                    searchArrayChars.push(charSplit[i].charCodeAt(0));
                }
            }
        }

        for (var i = 0; i < arrayBytes.length; ++i) {
            var isDec = searchArrayDec.indexOf(this.hexDataArray[i].decimalVal) > -1;
            var isHexa = searchArrayHexa.indexOf(this.hexDataArray[i].decimalVal) > -1;
            var isChar = searchArrayChars.indexOf(this.hexDataArray[i].decimalVal) > -1;

            if (isDec && (i + searchArrayDec.length - 1) < this.hexDataArray.length) {
                var ok = true;
                for (var j = i+1; j < i + searchArrayDec.length; ++j) {
                    if (this.hexDataArray[j].decimalVal != searchArrayDec[j - i]) {
                        ok = false;
                        break;
                    }
                }

                if (ok == true) {
                    for (var k = 0; k < searchArrayDec.length; ++k) {
                        if (searchResultPos.indexOf(searchArrayDec) < 0) {
                            searchResultPos.push(this.hexDataArray[i + k].pos);
                        }
                    }
                }
            }

            if (isHexa && (i + searchArrayHexa.length - 1) < this.hexDataArray.length) {
                var ok = true;
                for (var j = i+1; j < i + searchArrayHexa.length; ++j) {
                    if (this.hexDataArray[j].decimalVal != searchArrayHexa[j - i]) {
                        ok = false;
                        break;
                    }
                }

                if (ok == true) {
                    for (var k = 0; k < searchArrayHexa.length; ++k) {
                        if (searchResultPos.indexOf(searchArrayHexa) < 0) {
                            searchResultPos.push(this.hexDataArray[i + k].pos);
                        }
                    }
                }
            }


            if (isChar && i + searchArrayChars.length < this.hexDataArray.length) {
                var ok = true;
                for (var j = i + 1; j < i + searchArrayChars.length; ++j) {
                    if (this.hexDataArray[j].decimalVal != searchArrayChars[j - i]) {
                        ok = false;
                        break;
                    }
                }

                if (ok == true) {
                    for (var k = 0; k < searchArrayChars.length; ++k) {
                        if (searchResultPos.indexOf(searchArrayChars) < 0) {
                            searchResultPos.push(this.hexDataArray[i + k].pos);
                        }
                    }
                }
            }
        }


        var addressDecimal = getDecimalFromHex(address);
        
        if (addressDecimal <= this.hexDataArray.length) {
            for (var i = 0; i < 16; ++i) {

                if (i > 0 && (addressDecimal + i) % 16 == 0) {
                    break;
                }

                if ( addressDecimal + i <  this.hexDataArray.length &&   searchResultPos.indexOf(this.hexDataArray[addressDecimal + i]) < 0) {
                    searchResultPos.push(this.hexDataArray[addressDecimal + i].pos);
                }
            }
            this.searchResultsPos = searchResultPos;
            return addressDecimal;
        }

        this.searchResultsPos = searchResultPos;
        return -1;
    };

}
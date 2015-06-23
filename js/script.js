var buff;
var originalBuff;
var offset = 0;
var size = 0;
var LINES = 20;
var hexData;
var currentKeyUpEditState = 0;
var filename;
var fileType;

var selstart = -1;
var sellen = -1;

function handleFileSelect(evt) {
    evt.stopPropagation();
    evt.preventDefault();

    var files = evt.dataTransfer ?  evt.dataTransfer.files : evt.target.files; // FileList object.

    // files is a FileList of File objects. List some properties.
    var output = [];
    for (var i = 0, f; f = files[i]; i++) {
        output.push('<span><strong>', escape(f.name), '</strong> (', f.type || 'n/a', ') - ',f.size, ' bytes', '</span>');
        filename = f.name;
        fileType = f.type;
        size = f.size;

        var reader = new FileReader();
        reader.onloadend = function (evt) { buff = evt.target.result; hexData = new HexData(buff); initScroll();  initAll(); }
        reader.readAsArrayBuffer(f);
    }

    document.getElementById('fileinfo').innerHTML = output.join('');
    
    $('#header').css('height', '7%');
    $('#content').show();
    $('.rightButtonsContainer').show();
}

function handleDragOver(evt) {
    evt.stopPropagation();
    evt.preventDefault();
    evt.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
}

$(document).ready(function () {
    // Setup the dnd listeners.
    var dropZone = document.getElementById('header');
    dropZone.addEventListener('dragover', handleDragOver, false);
    dropZone.addEventListener('drop', handleFileSelect, false);
    $("input[type='radio']").click(function () {
        var previousValue = $(this).attr('previousValue');
        var name = $(this).attr('name');
        var id = $(this).attr('id');

        if (previousValue == 'checked') {
            $(this).removeAttr('checked');
            $(this).attr('previousValue', false);
            onBinaryEdit( parseInt(id.replace("editBin","")), false);
        }
        else {
            $("input[name=" + name + "]:radio").attr('previousValue', false);
            $(this).attr('previousValue', 'checked');
            onBinaryEdit(parseInt(id.replace("editBin", "")), true);
        }
    });

    $('#hexcol').click(function () { $(this).focus(); }).keypress(function (event) { onHexaEditKeyPress(event.charCode); });
    $('#editUpperHexa').change(function () {
        onHexaSelectEdit( $(this).val(), 0);
    });

    $('#editLowerHexa').change(function () {
        onHexaSelectEdit( $(this).val(), 1);
    });

    document.getElementById('files').addEventListener('change', handleFileSelect, false);
    window.onresize = function () { initScroll(); initAll(); };
});

function initOffsetCol() {
    
    $('#offsetcol').empty();
    for (var i = 0; i < 16 * LINES; i += 16) {
        $('#offsetcol').append('<div class="offsetcell" off="00000000">' + zeroFill((offset + i).toString(16), 8) + '</div>');
    }
}

function initHexCol() {
    
    var bin = hexData.hexDataArray.slice(offset, offset + LINES * 16);
    var limit = bin.length;

    var pos = 0;
    $('#hexcol').empty();
    for (var l = 0; l < LINES; l++) {
        $('#hexcol').append('<div>');
        for (var i = 0; i < 16; i++) {
            if (pos < limit) {
                var bt = bin[pos].decimalVal;

                $('#hexcol').append('<span class="hexcell '
                    + (bin[pos].pos == hexData.selectedPos ? "hexcell-sel" : "")
                    + (bin[pos].decimalVal != bin[pos].initialDecimalVal ? " hexcell-modified" : "")
                    + ((hexData.searchResultsPos.indexOf( bin[pos].pos))> -1? " hexcell-search" : "")
                                    + '" onClick="hexcellSel(this)"    pos="' + pos.toString() + '" absPos="'+  bin[pos].pos  
                                    + '" id="off' + pos.toString(16) + '"  tabIndex=' + (pos + 1) + '   >' + zeroFill(bt.toString(16), 2) + '</span>');

                pos++;

                if (i == 7)
                    $('#hexcol').append('&nbsp;');
            }
        }
        $('#hexcol').append('<div>');
    }
}

function initAsciiCol() {
   
    var bin = hexData.hexDataArray.slice(offset, offset + LINES * 16);
    var limit = bin.length;

    var pos = 0;
    $('#asciicol').empty();
    for (var l = 0; l < LINES; l++) {
        var line = '<div>';
        for (var i = 0; i < 16; i++) {
            if (pos < limit) {
                var bt = bin[pos].decimalVal;

                ch = asString(bt);

                line += '<span class="asciicell" id="asc' + pos.toString(16) + '"  absPosAscii="' +  bin[pos].pos  +'" >' + ch + '</span>';

                pos++;
            }
        }
        line += '</div>';
        $('#asciicol').append(line);
    }
}

function initAll() {
    initOffsetCol();
    initHexCol();
    initAsciiCol();
}

var firstTime  = false;

function initScroll() {

    var contentHeight = $('#content').height();


    if ($(window).width() > 1024) {
        $("#slider-vertical").css('height', (contentHeight - 25) + 'px');

        LINES = parseInt((contentHeight - 25) / 16); // 16px = 1 LINE..
    }
    else {
        $("#slider-vertical").css('height', 320);
        LINES = 20;
    }

    if (firstTime == false) {
        $("#slider-vertical").noUiSlider({
            range: {
                'min': Number(0),
                'max': Number(Math.floor(size / 16) - (LINES - 5))
            }
            , start: [0]
            , orientation: "vertical"
        });
        firstTime = true;
    }
    else {
        $("#slider-vertical").noUiSlider({
            range: {
                'min': Number(0),
                'max': Number(Math.floor(size / 16) - (LINES - 5))
            }
            , start: [0]
            , orientation: "vertical"
        },true);
    }

    $('#slider-vertical').on('slide',SlideEventHandler);
}

function SlideEventHandler() {
    Slide($('#slider-vertical').val());
}

function Slide(val) {
    offset = 16 * Math.max(0, Math.floor(val));
    initOffsetCol();
    initHexCol();
    initAsciiCol();

    var totalLines = Math.floor(hexData.hexDataArray.length/16);

    $('#offsetDecimal').val(offset.toString());
    $('#offsetHexa').val('0x' + offset.toString(16));
    $('#offsetPercent').val(parseInt((val/totalLines) * 100) + '%');
}

function hexcellSel(cell) {
  
    var absPos = parseInt($(cell).attr('absPos'));
    if (selstart >= 0) {
        // deselect
        var pos = selstart - offset;

        if (pos >= 0 && pos < LINES * 16) {
            $('#off' + pos.toString(16)).removeClass('hexcell-sel');
            $('#asc' + pos.toString(16)).removeClass('selected');
        }

    }

    selstart = offset + parseInt($(cell).attr('pos'));
    hexData.selectedPos = absPos;
    setValueUI(absPos);
    $('#' + $(cell).attr('id').replace('off', 'asc')).addClass('selected');

    $(cell).addClass('hexcell-sel');
    currentKeyUpEditState = 0;
}

function hexcellSelByPos(absPos) {

    if (absPos >= hexData.hexDataArray.length) {
        return false;
    }

    var cell = $('span[absPos="' + absPos + '"]');

    if (selstart >= 0) {
        // deselect
        var pos = selstart - offset;

        if (pos >= 0 && pos < LINES * 16) {
            $('#off' + pos.toString(16)).removeClass('hexcell-sel');
            $('#asc' + pos.toString(16)).removeClass('selected');
        }

    }

    selstart = offset + parseInt(cell.attr('pos'));
    hexData.selectedPos = absPos;
    setValueUI(absPos);
    $('#' + cell.attr('id').replace('off', 'asc')).addClass('selected');

    cell.addClass('hexcell-sel');
  
}


function setValueUI(pos) {
    $('#editDecimal').val(hexData.hexDataArray[pos].decimalVal);
    var hexa = zeroFill(hexData.hexDataArray[pos].decimalVal.toString(16), 2).toUpperCase();
    $('#editUpperHexa').val(hexa[0] + "");
    $('#editLowerHexa').val(hexa[1] + "");
    var bin = zeroFill(hexData.hexDataArray[pos].decimalVal.toString(2), 8);

    for (var i = 0; i < bin.length; ++i)
    {
        $('#editBin' + i).prop('checked', bin[i] == "1");
    }

    var char = asString(hexData.hexDataArray[pos].decimalVal);

    $('span[absPosAscii="' + pos + '"]').html(char);
    $('span[absPos="' + pos + '"]').html(hexa.toLowerCase());
}


function onHexaEditKeyPress(charCode) {

    if (hexData && hexData.selectedPos >= 0) {
        var charCode = String.fromCharCode(event.charCode).toLowerCase()[0];
        if ((charCode >= '0' && charCode <= '9') || (charCode >= 'a' && charCode <= 'f')) {
           
            var currentHex = asHex(hexData.hexDataArray[hexData.selectedPos].decimalVal,true);
            currentHex = currentKeyUpEditState == 0 ? (charCode + currentHex[1]) : (currentHex[0] + charCode);
            $('span[absPos="' + hexData.selectedPos + '"]').html(currentHex);
            var decimalValue = getDecimalFromHex(currentHex);

            hexData.hexDataArray[hexData.selectedPos].changeValue(decimalValue);
            setValueUI(hexData.selectedPos);
            $('span[absPos="' + hexData.selectedPos + '"]').addClass('hexcell-modified');
            
            currentKeyUpEditState++;
           
            if (currentKeyUpEditState == 2) {
                hexcellSelByPos(hexData.selectedPos+1);
                currentKeyUpEditState = 0;
            }
        }
    }
}


function onHexaSelectEdit(charCode,level) {
    if (hexData && hexData.selectedPos >= 0) {
        var currentHex = asHex(hexData.hexDataArray[hexData.selectedPos].decimalVal, true);
        currentHex = level == 0 ? (charCode + currentHex[1]) : (currentHex[0] + charCode);
        
        var decimalValue = getDecimalFromHex(currentHex);

        hexData.hexDataArray[hexData.selectedPos].changeValue(decimalValue);
        setValueUI(hexData.selectedPos);
        $('span[absPos="' + hexData.selectedPos + '"]').addClass('hexcell-modified');
    }
     
}

function onDecimalEditChange() {
    if (hexData && hexData.selectedPos >= 0) {
        var value = parseInt($('#editDecimal').val());
        hexData.hexDataArray[hexData.selectedPos].changeValue(value);
        setValueUI(hexData.selectedPos);
        $('span[absPos="' + hexData.selectedPos + '"]').addClass('hexcell-modified');
    }
}

function onBinaryEdit(bit, isSet) {
    if (hexData && hexData.selectedPos >= 0) {
        var currentBinary = zeroFill(hexData.hexDataArray[hexData.selectedPos].decimalVal.toString(2), 8);
        var newCurrentBinarryArray = currentBinary.split("");
        newCurrentBinarryArray[bit] = isSet == true ? "1" : "0";
        var newBin = newCurrentBinarryArray.join("");

        var decimalValue = parseInt( newBin, 2);
        hexData.hexDataArray[hexData.selectedPos].changeValue(decimalValue);
        setValueUI(hexData.selectedPos);
        $('span[absPos="' + hexData.selectedPos + '"]').addClass('hexcell-modified');
    }
}


function SaveFile() {

    var array = new Uint8Array( hexData.hexDataArray.length);
    
    for (var i = 0; i < hexData.hexDataArray.length; ++i) {
        array[i] = hexData.hexDataArray[i].decimalVal;
    }

    var b64 = btoa(String.fromCharCode.apply(null, array));

    var a = document.createElement("a");
    a.style = "display: none";
    fileType = fileType || 'application/octet-stream';
    a.setAttribute('download', filename);
    a.href = 'data:' + fileType + ';base64,' + b64;

    document.body.appendChild(a);
    a.click();
}

function Revert() {
    hexData.revert();

    $('.hexcell-modified').each(function (index,elem) {
        $(elem).removeClass('hexcell-modified');
        
        var absPos = parseInt($(elem).attr('absPos'));
        var decimal = hexData.hexDataArray[absPos].decimalVal;
        var hexa = asHex(decimal,true);
        var char = asString(decimal);

        $(this).html(hexa);
        $('span[absPosAscii="' + absPos + '"').html(char);
    });
}

function Search() {
    var addressToGo =   hexData.search( $('#searchTextType').val(),  $('#searchText').val(), $('#address').val());
    $('span[absPos]').removeClass('hexcell-search');
    for (var i = 0; i < hexData.searchResultsPos.length; ++i) {
        $('span[absPos="' + hexData.searchResultsPos[i] + '"]').addClass('hexcell-search');
    }

    if (addressToGo > -1) {
        SetOffsetUI(addressToGo);
    }
}

function GoToAddressDecimal() {
    var offsetDecimal = $('#offsetDecimal').val();
    SetOffsetUI(offsetDecimal);
}

function GoToAddressHexa() {
    var offsetHexa = $('#offsetHexa').val().replace("0x", "");
    var decimal = getDecimalFromHex(offsetHexa);
    SetOffsetUI(decimal);
}

function GoToAddressPercent() {
    var totalLines = Math.floor(hexData.hexDataArray.length / 16);
    var perc = parseFloat($('#offsetPercent').val().replace('%',''));
    var val = 16 * (perc * totalLines / 100);
    SetOffsetUI(val);
}

function SetOffsetUI(decimalAddress) {
    var lines = decimalAddress/ 16;
    Slide(lines);
    $('#slider-vertical').val(lines);
}

function onSearchTypeChange() {
    var searchType = $('#searchTextType').val();

    if (searchType == "Decimal") {
        $('#labelSearch').html('Decimals:');
        $('#searchText').attr('placeholder', 'Enter like: this 1 2 44');
    }

    if (searchType == "Hexa") {
        $('#labelSearch').html('Hexas:');
        $('#searchText').attr('placeholder', 'Enter like: this 1 ab ff');
    }

    if (searchType == "Char") {
        $('#labelSearch').html('Characters:');
        $('#searchText').attr('placeholder', 'Enter like: test');
    }
}

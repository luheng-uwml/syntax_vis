
var wordPos = new Array();
var wordWidth = new Array();
var brackets = new Array(); // for visualizing constituency structure
	
var yPositionArcs = 185;
var yPositionTokens = 200;
var yPositionTags = 220;

var bracketHeight = 18;
var boxWidth = 100;
var boxHeight = 100;
var blockSpace = 30;
var wordSpace = 10;
var widthLimit = 1300;
var arrowSize = 10;
var theta = 0.18;
var gamma = 0.12;

var ctx;

var matchedArcStyle = "rgba(0,0,0,0.8)";
var goldArcStyle = "rgba(0,100,0,0.8)";
var wrongArcStyle = "rgba(200,0,0,0.8)";
var defaultFillStyle = "rgba(0,0,0,1.0)";
	
var sentIdx;
var sentences;
var drawGold = true;
var drawPred = true;
	
function drawArc(childIdx, parentIdx, yPosition, arcStyle) {
	var startX = parentIdx < 0 ? 0 : wordPos[parentIdx];
	var endX = wordPos[childIdx];
	var d = Math.abs(startX - endX) / 2;
	var radius =  d / Math.sin(theta * Math.PI);
	var centerX = (startX + endX) / 2;
	var centerY = yPosition + d / Math.tan(theta * Math.PI); 
	
	// Set arc style
	ctx.lineWidth = 2;
	ctx.strokeStyle = arcStyle;
	ctx.fillStyle = arcStyle;
	
	if (parentIdx < 0) {
		var maxD = (wordPos[wordPos.length-1] - wordPos[0]) / 2;
		var maxH = maxD / Math.sin(theta * Math.PI) - maxD / Math.tan(theta * Math.PI);
		
		ctx.beginPath();
		ctx.moveTo(endX, yPosition - Math.min(maxH, 150));
		ctx.lineTo(endX, yPosition);
		ctx.stroke();
		
		ctx.beginPath();
		ctx.moveTo(endX, yPosition);
		ctx.arc(endX, yPosition, arrowSize, (1.5+gamma) * Math.PI, (1.5-gamma) * Math.PI, true);
		ctx.fill();		
	}
	else if (childIdx < parentIdx) {
		ctx.beginPath();
		ctx.arc(centerX, centerY, radius, (1.5 + theta) * Math.PI, (1.5 - theta) * Math.PI, true);
		ctx.stroke();
		
		ctx.beginPath();
		ctx.moveTo(endX, yPosition);
		ctx.arc(endX, yPosition, arrowSize, (-theta+gamma) * Math.PI, (-theta-gamma) * Math.PI, true);
		ctx.fill();
	}
	else {
		ctx.beginPath();
		ctx.arc(centerX, centerY, radius, (1.5 + theta) * Math.PI, (1.5 - theta) * Math.PI, true);
		ctx.stroke();
		
		ctx.beginPath();
		ctx.moveTo(endX, yPosition);
		ctx.arc(endX, yPosition, arrowSize, (1+theta+gamma) * Math.PI, (1+theta-gamma) * Math.PI, true);
		ctx.fill();
	}
}

function drawBracket(label, bpos, X, Y) {
	// TODO: use ctx.translate(X, Y) here, also try ctx.scale(X, Y)
	ctx.textAlign = "center"; 
	ctx.font = "lighter 12px Arial";
	var nc = bpos.xlow.length;
	var twidth = ctx.measureText(label).width;
	var theight = 12;
	var dt = 2;
	
	ctx.fillStyle = defaultFillStyle;
	ctx.strokeStyle = defaultFillStyle;
	ctx.lineWidth = 1;
	ctx.font = "lighter 12px Helvetica";
		
	if (nc == 1) {
		ctx.beginPath();
		ctx.moveTo(X + bpos.xlow[0], Y + bpos.ylow[0] - theight);
		ctx.lineTo(X + bpos.xlow[0], Y + bpos.yhigh);
		ctx.stroke();
		ctx.fillText(label, X + bpos.xlow[0], Y + bpos.ylow[0] - dt);
	} else {
		var r = Math.min(5, (bpos.xlow[nc-1] - bpos.xlow[0]) / 2);
		ctx.beginPath();
		for (var i = 0; i < nc; i++) {
			ctx.moveTo(X + bpos.xlow[i], Y + bpos.ylow[i]);
			ctx.lineTo(X + bpos.xlow[i], Y + bpos.yhigh + r);
			if (i == 0)  {
				ctx.quadraticCurveTo(X + bpos.xlow[i], Y + bpos.yhigh, X + bpos.xlow[i] + r, Y + bpos.yhigh);
			} else if (i == nc - 1) {
				ctx.quadraticCurveTo(X + bpos.xlow[i], Y + bpos.yhigh, X + bpos.xlow[i] - r, Y + bpos.yhigh);
			} else {
				ctx.lineTo(X + bpos.xlow[i], Y + bpos.yhigh);
			}
		}
		ctx.moveTo(X + bpos.xlow[0] + r, Y + bpos.yhigh);
		ctx.lineTo(X + bpos.xlow[nc-1] - r, Y + bpos.yhigh);
		ctx.stroke();	
		ctx.fillText(label, X + bpos.xhigh - twidth / 2 - dt, Y + bpos.yhigh - dt);
	}
	
	ctx.fillStyle = defaultFillStyle;
	ctx.strokeStyle = defaultFillStyle;
	ctx.lineWidth = 1;
}

function drawOneParseCC(words, tags, phrases, X, Y) {
	var numWords = words.length;
	var numPhrases = phrases.length;
	
	var canvas = document.getElementById("canvas");
	if (canvas.getContext) {
	   	ctx = canvas.getContext("2d");	
		ctx.clearRect(0, 0, 1500, 800);
		ctx.textAlign = "center";
	}
	ctx.fillStyle = defaultFillStyle;
	ctx.textAlign = "center"; 
	// compute word positions
	for (var i = 0; i < numWords; i++) {
		ctx.font = "bold 14px Arial";
		var token_width = ctx.measureText(words[i]).width;
		var tag_width = ctx.measureText(tags[i]).width;
		wordWidth[i] = Math.max(token_width, tag_width);
		wordPos[i] = wordWidth[i] / 2 + wordSpace;
		if (i > 0) {
			wordPos[i] += wordPos[i-1] + wordWidth[i-1] / 2;
		}
	}
	// compute bracket positions
	var layers = new Array();
	for (var i = 0; i < numWords; i++) {
		layers[i] = -1;
	}
	for (var i = 0; i < numPhrases; i++) {
		var lw = phrases[i][1]; // left word
		var rw = phrases[i][2] - 1; // right word
		var nc = 0;
		var _xlow = [];
		var _ylow = [];
		var _yhigh = 0;
		var last_cid = -2; // continuous constituency test
		for (var j = lw; j <= rw; j++) {
			var cid = layers[j];
			if ((cid < 0 && (j == lw || j == rw)) || (cid >= 0 && cid != last_cid)) { 
				if (cid < 0) {
					_xlow[nc] = wordPos[j];
					_ylow[nc] = -10;
					_yhigh = Math.min(_yhigh, _ylow[nc] - bracketHeight);
					nc += 1; 
				} else {
					_xlow[nc] = brackets[cid].xhigh;
					_ylow[nc] = brackets[cid].yhigh;
					_yhigh = Math.min(_yhigh, _ylow[nc] - bracketHeight);
					nc += 1;
				}
				last_cid = cid;
			}
			layers[j] = i;
		}
		_xhigh = (_xlow[0] + _xlow[nc-1]) / 2;
		brackets[i] = {xlow : _xlow, ylow : _ylow, xhigh : _xhigh, yhigh : _yhigh};
	}
	var blockHeight = 10 - brackets[numPhrases-1].yhigh; 
	for (var i = 0; i < numWords; i++) {
		ctx.font = "bold 14px Arial";	
		ctx.fillText(words[i], X + wordPos[i], Y + blockHeight);
		ctx.font = "lighter 12px Arial";	
		ctx.fillText(tags[i], X + wordPos[i], Y + blockHeight + 15);
	}
	for (var i = 0; i < numPhrases; i++) {
		drawBracket(phrases[i][0], brackets[i], X, Y + blockHeight);
	}
}

function parseBracketString(tree_str) {
	var str_len = tree_str.length;
    var words = [];
    var tags = [];
    var spans = [];
    var stack = [];
    for (var i = 0; i < str_len; ) {
        if (tree_str.charAt(i) == '(') {
            var j = i + 1;
            while (tree_str.charAt(j) != ')' && tree_str.charAt(j) != '(') {
                j += 1;
            }
            if (tree_str.charAt(j) == ')') {
                var terms = $.trim(tree_str.substring(i+1,j)).split(' ');
                if (terms[0] != "-NONE-") {
                	tags.push(terms[0]);
                	words.push(terms[1]);
                }
                i = j + 1;
            } else {
                label = $.trim(tree_str.substring(i+1,j));
                stack.push( { "label": label, "idx":tags.length });
                i = j;
            }
        } else if (tree_str.charAt(i) == ')') {
        	var top = stack[stack.length - 1]; 
            if (tags.length > top.idx) {
                spans.push([top.label, top.idx, tags.length]);
            }
            stack.pop();
            i += 1;
        } else {
            i += 1;
        }
    }
    return { "words": words, "tags": tags, "phrases": spans};
}

function visualizeBracketString() {
	// Get string from input box
	var tree_str = $( "#tree_input" ).val();
	var tree_obj = parseBracketString(tree_str);
	/*alert(tree_str);
	alert(tree_obj.words);
	alert(tree_obj.tags);
	alert(tree_obj.phrases);
	*/
	drawOneParseCC(tree_obj.words, tree_obj.tags, tree_obj.phrases, 50, 50);
}

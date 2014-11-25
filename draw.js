
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
	//var startX = parentIdx < 0 ? 0 : (pos[parentIdx+1] + pos[parentIdx]) / 2 - wordSpace;
	//var endX = (pos[childIdx+1] + pos[childIdx]) / 2 - wordSpace;
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
	
function drawInit(fileName) {
	// load sentences
	$.getJSON(fileName);
	document.getElementById("canvas").addEventListener("click", onClick, false);
	sentIdx = 0;
	// FIXME: disabling buttons ...
	$ ("#b.prev").prop("disabled", true);
   	$ ("#b.prev.ten").prop("disabled", true);
   	$ ("#corpusInfo").html("<p>Displaying sentences from " + fileName + " ... </p>");
	drawBoth();
}

function visualizeDependencies() {
	var input_str = $( "#tree_input" ).val();
	sentences = [JSON.parse(input_str), ];
	sentIdx = 0;
	drawBoth();
}
	
function drawOneSentence() {
	var canvas = document.getElementById("canvas");
	if (canvas.getContext) {
       	ctx = canvas.getContext("2d");
       	ctx.clearRect(0, 0, 1000, 300);
		ctx.font = "bold 16px Arial";
		ctx.textAlign = "center";	
		var sentence = sentences[sentIdx];
		var numWords = sentence["words"].length;
		
		// Set to default fillStyle
		ctx.fillStyle = defaultFillStyle;
		for (var i = 0; i < numWords; i++) {
			// var wordSize = Math.max(sentence["words"][i].length, sentence["tags"][i].legnth) * 10;
			wordWidth[i] = sentence["words"][i].length * 10;
			// alert(i + ", " + wordSize);
			wordPos[i] = wordWidth[i] / 2 + wordSpace;
			if (i > 0) {
				wordPos[i] += wordPos[i-1] + wordWidth[i-1] / 2;
			}
			ctx.fillText(sentence["words"][i], wordPos[i], yPositionTokens);
		}
		// put tags
		for (var i = 0; i < numWords; i++) {
			ctx.fillText(sentence["tags"][i], wordPos[i], yPositionTags);
		}
		// put arcs
		if (!sentence["gold"]) {
			drawGold = false;
		}
		if (!sentence["pred"]) {
			drawPred = false;
		}
		for (var i = 0; i < numWords; i++) {
			if (drawGold && drawPred) {
				if (sentence["gold"][i] == sentence["pred"][i]) {
					drawArc(i, sentence["gold"][i]-1, yPositionArcs, matchedArcStyle);	
				} else {
					drawArc(i, sentence["gold"][i]-1, yPositionArcs, goldArcStyle);
					drawArc(i, sentence["pred"][i]-1, yPositionArcs, wrongArcStyle);
				}
			} else if (drawGold) {
				drawArc(i, sentence["gold"][i]-1, yPositionArcs, matchedArcStyle);
			} else {
				drawArc(i, sentence["pred"][i]-1, yPositionArcs, matchedArcStyle);
			}
		}
	}		
	$ ("#sentId").html("<p>Sentence ID\t" + sentence["id"] + " ( " + (sentIdx+1) + " out of " + sentences.length + " )</p>");
}

function switchSentence(stepSize) {
	sentIdx += stepSize;
   	if (sentIdx <= 0) {
   		sentIdx = 0;
   		$ ("#b.prev").prop("disabled", true);
   		$ ("#b.prev.ten").prop("disabled", true);	
   	} else {
   		$ ("#b.prev").prop("disabled", false);
   		$ ("#b.prev.ten").prop("disabled", false);
   	}
   	if (sentIdx >= sentences.length - 1) {
   		sentIdx = sentences.length - 1;
   		$ ("#b.next").prop("disabled", true);
   		$ ("#b.next.ten").prop("disabled", true);	
   	} else {
   		$ ("#b.next").prop("disabled", false);
   		$ ("#b.next.ten").prop("disabled", false);
   	}
   	drawBoth();
}

function switchSentenceCC(stepSize) {
	sentIdx += stepSize;
   	if (sentIdx <= 0) {
   		sentIdx = 0;
   		$ ("#b.prev").prop("disabled", true);
   		$ ("#b.prev.ten").prop("disabled", true);	
   	} else {
   		$ ("#b.prev").prop("disabled", false);
   		$ ("#b.prev.ten").prop("disabled", false);
   	}
   	if (sentIdx >= sentences.length - 1) {
   		sentIdx = sentences.length - 1;
   		$ ("#b.next").prop("disabled", true);
   		$ ("#b.next.ten").prop("disabled", true);	
   	} else {
   		$ ("#b.next").prop("disabled", false);
   		$ ("#b.next.ten").prop("disabled", false);
   	}
   	drawOneSentenceCC();
}
    
function predOnly() {
   	drawGold = false;
	drawPred = true; 
    drawOneSentence();
}
    
function goldOnly() {
   	drawGold = true;
    drawPred = false;
   	drawOneSentence(); 
}
    
function drawBoth() {
	drawGold = true;
	drawPred = true;
	drawOneSentence();
}
    
function onClick(canvas) {
   	// detect word
   	var sentence = sentences[sentIdx];
	var numWords = sentence["words"].length;
   	for (var i = 0; i < numWords; i++) {
   		//alert("clicked: " + canvas.pageX + ", " + canvas.pageY + ", " + wordPos[i] + ", "  +wordWidth[i] + ", " + yPositionTokens);
   		if (Math.abs(canvas.pageX - wordPos[i]) < wordWidth[i] / 2 && Math.abs(canvas.pageY - yPositionTokens) < 10) {
			// draw a rectangle
			ctx.beginPath();
			ctx.rect(wordPos[i] - wordWidth[i] / 2, yPositionTokens - 15, wordWidth[i], 20);
			ctx.fillStyle = "rgba(176, 224, 230, 0.3)";
			ctx.fill();
    	}	
    }
}

function drawBracket(label, bpos, isGold, isError, X, Y) {
	// TODO: use ctx.translate(X, Y) here, also try ctx.scale(X, Y)
	ctx.textAlign = "center"; 
	ctx.font = "lighter 12px Arial";
	var nc = bpos.xlow.length;
	var xwidth = 2 * (bpos.xhigh - bpos.xlow[0]);
	var twidth = ctx.measureText(label).width;
	var theight = 12;
	var dt = 2;
	
	if (isError) {
		if (isGold) {
			ctx.fillStyle = goldArcStyle;
			ctx.strokeStyle = goldArcStyle;
		} else {
			ctx.fillStyle = wrongArcStyle;
			ctx.strokeStyle = wrongArcStyle;
		}
		ctx.lineWidth = 2;
		ctx.font = "bold 12px Arial"; 
	} else {
		ctx.fillStyle = defaultFillStyle;
		ctx.strokeStyle = defaultFillStyle;
		ctx.lineWidth = 1;
		ctx.font = "lighter 12px Arial";
	}
		
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

function drawSentenceMeta(metaInfo, X0, Y0, W, H) {
	ctx.translate(X0, Y0);
	// draw a box
	//ctx.rect(0, 0, W, H);
	//ctx.stroke();
	// put text
	ctx.font = "bold 14px Arial";
	ctx.textAlign="start";
	ctx.fillText(metaInfo.label, 10, 10);
	if (metaInfo.label != "gold") {
		ctx.fillText("[P] " + Number(metaInfo.prec).toFixed(2), 10, 35);
		ctx.fillText("[R] " + Number(metaInfo.recall).toFixed(2), 10, 60);
		var f1 = 2 * metaInfo.prec * metaInfo.recall / (metaInfo.prec + metaInfo.recall);
		ctx.fillText("[F1] " + Number(f1).toFixed(2), 10, 85);
	} else {
		ctx.fillText("sent# " + metaInfo.sid, 10, 35);
	}
	ctx.setTransform(1, 0, 0, 1, 0, 0);
}

function drawOneParseCC(words, tags, phrases, meta, errors, X, Y) {
	var numWords = words.length;
	var numPhrases = phrases.length;
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
	var blockWidth = (wordPos[numWords-1] - wordPos[0]) + wordWidth[0] + wordWidth[numWords-1]; 
	for (var i = 0; i < numWords; i++) {
		ctx.font = "bold 14px Arial";	
		ctx.fillText(words[i], X + wordPos[i], Y + blockHeight);
		ctx.font = "lighter 12px Arial";	
		ctx.fillText(tags[i], X + wordPos[i], Y + blockHeight + 15);
	}
	var isGold = false;
	if (meta.label == "gold") {
		isGold = true;
	}
	for (var i = 0; i < numPhrases; i++) {
		drawBracket(phrases[i][0], brackets[i], isGold, errors[i], X, Y + blockHeight);
	}
	drawSentenceMeta(meta, X + blockWidth, Y, boxWidth, boxHeight);
	return {"width":blockWidth, "height":blockHeight+30};
}

function drawOneSentenceCC() {
	if (canvas.getContext) {
       	ctx = canvas.getContext("2d");	
		ctx.clearRect(0, 0, 1500, 2000);
		ctx.textAlign = "center";
	}
	var sentence = sentences[sentIdx];
	var kbest = sentence["kbest"];
	var gold = sentence["gold"];
	var prec = sentence["prec"];
	var recall = sentence["recall"];
	var X0 = 30, Y0 = 30, X1, Y1, X2, Y2, X3, Y3, b0, b1, b2, b3;
	var vertical = false;
	
	// draw gold .. it is stupid to compare error on gold, but consider it as sanity check ...
	b0 = drawOneParseCC(sentence["words"], sentence["tags"], gold,
		{"label":"gold", "sid":sentence["sent_id"]},
		getErrors(kbest[0], gold), X0, Y0);
	
	if (X0 + b0.width * 2 + blockSpace > widthLimit) {
		vertical = true;
		X1 = X0;
		Y1 = Y0 + b0.height + blockSpace;
	} else {
		X1 = X0 + b0.width + blockSpace + boxWidth;
		Y1 = Y0;
	}
	b1 = drawOneParseCC(sentence["words"], sentence["tags"], kbest[0],
		{"label":"1-best", "prec":prec[0], "recall":recall[0]},
		getErrors(gold, kbest[0]), X1, Y1);
		
	if (kbest.length > 1) {
		if (vertical) {
			X2 = X0;
			Y2 = Y1 + b1.height + blockSpace;
		} else {
			X2 = X0;
			Y2 = Y0 + Math.max(b0.height, b1.height) + blockSpace;
		}
		b2 = drawOneParseCC(sentence["words"], sentence["tags"], kbest[1],
			{"label":"2-best", "prec":prec[1], "recall":recall[1]},
			getErrors(gold, kbest[1]), X2, Y2);
			
		if (kbest.length > 2) {
			if (vertical) {
				X3 = X0;
				Y3 = Y2 + b2.height + blockSpace;
			} else {
				X3 = X0 + Math.max(b0.width, b2.width) + blockSpace + boxWidth;
				Y3 = Y0 + Math.max(b0.height, b1.height) + blockSpace;
			}
			b3 = drawOneParseCC(sentence["words"], sentence["tags"], kbest[2],
				{"label":"3-best", "prec":prec[2], "recall":recall[2]},
				getErrors(gold, kbest[2]), X3, Y3);
		}
	}
	$ ("#sentId").html("Sentence ID\t" + sentence["sent_id"] + " ( " +
		(sentIdx+1) + " out of " + sentences.length + " )");
	$ ("#sentText").val(sentence["words"].join(" "));
}

// counting unlabeled errors, stupid N^2 check
function fuzzyLabelMatch(goldLabel, predLabel) {
	return goldLabel == predLabel || goldLabel.indexOf(predLabel) == 0 ||
		predLabel.indexOf(goldLabel) == 0;
}

function getErrors(goldPhrases, predPhrases) {
	var errors = [];
	for (var i = 0; i < predPhrases.length; i++) {
		errors[i] = true;
		for (var j = 0; errors[i] && j < goldPhrases.length; j++) {
			if (predPhrases[i][1] == goldPhrases[j][1] && predPhrases[i][2] == goldPhrases[j][2]
				&& fuzzyLabelMatch(goldPhrases[j][0], predPhrases[i][0])) {
				errors[i] = false;
			}
		}
	}
	return errors;
}

function loadFileCC() {
	srcFileName = $("#src-select").val();
	//alert(srcFileName);
	//append source file
	var head = document.getElementsByTagName('head')[0];
  	var script = document.createElement('script');
	script.type = 'text/javascript';
	script.src = srcFileName;
	head.appendChild(script);
	//drawInitCC();
}

function drawInitCC() {
	$.getJSON(srcFileName);
	document.getElementById("canvas").addEventListener("click", onClick, false);
	sentIdx = 0;
	// FIXME: disabling buttons ...
	$ ("#b.prev").prop("disabled", true);
   	$ ("#b.prev.ten").prop("disabled", true);
   	$ ("#corpusInfo").html("Displaying sentences from " + srcFileName + " ... ");
	drawOneSentenceCC();
}


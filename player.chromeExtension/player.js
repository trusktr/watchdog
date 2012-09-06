
var backgroundPage = chrome.extension.getBackgroundPage(); // The JavaScript 'window' object of the background page.
var isPlayerWindow = function() { return true; };

function when_images_loaded($img_container, callback) { //do callback when images in $img_container are loaded. Only works when ALL images in $img_container are newly inserted images.
	var img_length = $img_container.find('img').length,
		img_load_cntr = 0;
		
	if (img_length) { //if the $img_container contains new images.
		$('img').on('load', function() { //then we avoid the callback until images are loaded
			img_load_cntr++;
			if (img_load_cntr == img_length) {
				//console.log("one!");
				callback();
			}
		});
	}
	else { //otherwise just do the main callback action if there's no images in $img_container.
		callback();
	}
}

function setContent(version, layoutData) {
	var _layoutContainer = $('#layoutContainer');
	if (version == 'v1') {
		_layoutContainer.addClass('hidden').html(layoutData);
	}
	else if (version == 'v2') {
		// receives a layout object then creates the HTML layout to put in #layoutContainer
		var content = '',
			pagedata = '';
		
		for (var i=0; i<layoutData.partitions.length; i++) {
			var partition = layoutData.partitions[i],
				filename = partition.media,
				filenameParts = filename.split("."),
				filenameExtension  = filenameParts[filenameParts.length-1]; // the last part should be the extension...
			
			if (filenameExtension == 'webm') {
				content = '            <video autoplay>'
						+ '                <source src="http://127.0.0.1:3437/' + filename + '" type="video/webm; codecs=\'vorbis,vp8\'" />'
						+ "            </video>";
			} else if (filenameExtension == 'swf') {
				content = "            <object type='application/x-shockwave-flash' data='http://127.0.0.1:3437/" + filename + "' width='100%' height='100%'>"
						+ "                <param name='movie' value='http://127.0.0.1:3437/" + filename + "' />"
						+ "                <param name='quality' value='high' />"
						+ "                <param name='bgcolor' value='#ffffff' />"
						+ "                <param name='play' value='true' />"
						+ "                <param name='loop' value='true' />"
						+ "                <param name='wmode' value='transparent' />"
						+ "                <param name='scale' value='showall' />"
						+ "                <param name='menu' value='false' />"
						+ "                <param name='devicefont' value='false' />"
						+ "                <param name='salign' value='' />"
						+ "                <param name='allowScriptAccess' value='sameDomain' />"
						+ "            </object>";
			} else { // Must be an image
				content = "            <img style='height: 100%; width: 100%;' src='http://127.0.0.1:3437/" + filename + "' alt='' />";
			}
			
			// Construct the html
			pagedata += "       <div style='position: absolute; top: " + partition.y + "%; left: " + partition.x + "%; height: " + partition.h + "%; width: " + partition.w + "%;'>"
					 +              content
					 + "        </div>";
		}
		_layoutContainer.addClass('hidden').html(pagedata);
	
		/*Sample data:*/
		// var layoutData = {
			// "id": 10,
			// "ttl": Math.floor( (Math.random()*/*B*/1) + /*A*/15 ), //random number from A to B
			// "title": "Airport Storage",
			// "partitions": [{
				// "x": 0,
				// "y": 0,
				// "h": 100,
				// "w": 50,
				// "media": "test"+(++tempCounter)+".png",
				// "media_md5": "bfaif97f8ab745b0587de1dcf1dbf6bc"
			// }, {
				// "x": 50,
				// "y": 0,
				// "h": 100,
				// "w": 50,
				// "media": "test"+(++tempCounter)+".png",
				// "media_md5": "bfa2067wd7b7edy7587de1dcf1dbf6bc"
			// }],
			// "overlays": []
		// };
	}
	when_images_loaded(_layoutContainer, function() {
		_layoutContainer.removeClass('hidden');
	});
}

function Timer(duration, action/*TODO: ,autostart*/) {
	var timerId, paused, start, remaining = duration;
	this.pause = function() {
		paused = true;
		window.clearTimeout(timerId);
		remaining -= new Date() - start;
	};
	this.stop = function() {
		paused = true;
		window.clearTimeout(timerId);
		remaining = duration; // back to the beginning.
	};
	this.resume = function() {
		paused = false;
		start = new Date();
		timerId = window.setTimeout(function() {
			action();
		}, remaining);
	};
	this.start = function() {
		this.resume();
	}
	this.isPaused = function() {
		return paused;
	};
	this.setRemaining = function(newValue) {
		remaining = newValue;
	};
	this.increaseTime = function(amount) {
		remaining = remaining + amount;
	};
	this.decreaseTime = function(amount) {
		remaining = (remaining-amount >= 0 ? remaining-amount : 0);
	};
	this.getRemaining = function() {
		return remaining;
	};
	this.resume(); // if autostart. (TODO)
};

$(document).ready(function() {
	// ready, so notify the background page.
	backgroundPage.reportPlayerTabReady(window);
	
	//disable right click menu
	$('body').on('contextmenu', function() {
		return false;
	});
		
	$(window).on('keyup', function(e) {
		console.log('Reporting key action.');
		backgroundPage.reportKeyAction(e);
	});
	
	
	var touchInterfaceClicks = 0;
	$('#nextButton').on('click', function() {
		touchInterfaceClicks++;
		var e = jQuery.Event('keyup');
		e.keyCode = 78; // # Some key code value
		$(window).trigger(e);
	});
	
	$('#previousButton').on('click', function() {
		touchInterfaceClicks++;
		var e = jQuery.Event('keyup');
		e.keyCode = 66; // # Some key code value
		$(window).trigger(e);
	});
	
	$('#pauseButton').on('click', function() {
		touchInterfaceClicks++;
		var e = jQuery.Event('keyup');
		e.keyCode = 32; // # Some key code value
		$(window).trigger(e);
	});
	
	$('#statsButton').on('click', function() {
		touchInterfaceClicks++;
		var e = jQuery.Event('keyup');
		e.keyCode = 77; // # Some key code value
		$(window).trigger(e);
	});
	
	function setTouchControls() {
		console.log('Setting the click event for touch controls.');
		$('#touchControls').on('click', function() {
			console.log('Touch controls activated.');
			$('#touchControls').off('click');
			var buttonsVisibleCount = 0;
			var buttonsHiddenCount = 0;
			$('#touchControls button').stop().fadeIn(function() {
				buttonsVisibleCount++;
			});
			var pollForTouchInterfaceVisible = setInterval(function() {
				var numberOfClicksWhenVisible;
				
				if (buttonsVisibleCount == $('#touchControls button').length) {
					//touch interface is now visible.
					clearInterval(pollForTouchInterfaceVisible);
					
					numberOfClicksWhenVisible = touchInterfaceClicks = 0;
					
					var pollForClicksMadeWhileInterfaceVisible;
					
					var timerUntilInterfaceHidden = new Timer(5000, function() {
						timerUntilInterfaceHidden = null;
						$('#touchControls button').stop().fadeOut(function() {
							buttonsHiddenCount++;
						});
						var pollForTouchInterfaceHidden = setInterval(function() {
							if (buttonsHiddenCount == $('#touchControls button').length) {
								//touch interface is now hidden.
								clearInterval(pollForTouchInterfaceHidden);
								clearInterval(pollForClicksMadeWhileInterfaceVisible);
								setTouchControls();
							}
						}, 50);
					});
				
					pollForClicksMadeWhileInterfaceVisible = setInterval(function() {
						if (numberOfClicksWhenVisible != touchInterfaceClicks && timerUntilInterfaceHidden.getRemaining() >= 0) {
							// a click has been made while the touch interface is visible so let's extend the time until the interface gets hidden.
							numberOfClicksWhenVisible = touchInterfaceClicks = 0;
							timerUntilInterfaceHidden.pause();
							timerUntilInterfaceHidden.setRemaining(5000);
							timerUntilInterfaceHidden.resume();
						}
					}, 50);
				}
			}, 50);
		});
	}
	setTouchControls();
	
});

$(window).on('load', function() {
	var body = document.getElementsByTagName('body')[0];
	var html = document.getElementsByTagName('html')[0];
	var htmlHeight = html.clientHeight;
	console.log('Player loaded! '+ htmlHeight);
	var defaultFontSize = htmlHeight * (6.59/100);
	var defaultLineHeight = htmlHeight * (4.95/100);
	$('body').css({
		'font-size': defaultFontSize+'px',
		'line-height': defaultLineHeight+'px',
		'height': htmlHeight+'px'
	});
});

window.onunload = function() {
	backgroundPage.reportPlayerTabUnload();
	return true;
};










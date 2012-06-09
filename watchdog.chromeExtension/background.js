


var version = 'v1',
	thisExtensionId = chrome.i18n.getMessage('@@extension_id'),
	Player,
	playerConnection,
	
	layouts = new Queue(), // for v2
	currentLayoutHtml = '', // for v1
	currentDuration = 0, // for v1
	getLayoutAction = 'update', // for v1
	isGettingLayout = false, // for v1
	
	playerWindowReady = false,
	playerTab,
	playerWindow,

	isPlayerWindow = function() { return false; };
	
function log(msg) { console.log(msg); }

function reloadExtension(targetExtensionId) {
	chrome.management.get(targetExtensionId, function(extension) {
		log('Reloading extension "' + extension.name + '"...');
		
		chrome.management.setEnabled(extension.id, false, function() {
			chrome.management.setEnabled(extension.id, true);
		});
	});
}

function setPlayerId() {
	chrome.management.getAll(function(extensions) {
		for ( var i = 0; i < extensions.length; ++i ) {
			if (extensions[i].name == 'Player') {
				console.log('Detected id for Player extension: '+extensions[i].id);
				Player = extensions[i].id;
	
				console.log('Player: ' + Player);
			}
		}
	});
}

function playerWindowReadyNotification(theWindow) {
	console.log('Player window ready.');
	
	playerWindow = theWindow;
	playerWindowReady = true;
	console.log(playerWindow); // useful to see what the player's window object contains.
	
	setPlayerLayoutIfNecessary();
}

function playerWindowUnloadNotification() {
	playerWindowReady = false;
	console.log('The player window has been closed and will be restarted.');
}
	
function createPlayerWindow(callback) {
	// call Player's createPlayerWindow(callback)
	// get playerTab set somehow.
}


var /*tempCounter = 0,*/
	_layoutLoader;

function getLayout(callback) {
	var layoutData = {},
		jsonComplete = false;
	
	if (version == 'v1') {
		_layoutLoader = $('<div id="layoutLoader"></div>');
		console.log(_layoutLoader.attr('id'));
		
		_layoutLoader.load('http://127.0.0.1:3437/?action='+getLayoutAction+' div', function(){
			// console.log(_layoutLoader.html());
			isGettingLayout = false;
			getLayoutAction = 'update'; // reset this if it was changed.
			if (typeof callback == 'function') callback();
		});
	}
	else if (version == 'v2') {
		$.getJSON('http://127.0.0.1:3437/?action=update', function(data) {
			layoutData = data;
			console.log(layoutData);
			layouts.enqueue(layoutData);
			jsonComplete = true;
			if (typeof callback == 'function') callback();
		});
	}
	
	// if (tempCounter >= 11) {
		// tempCounter = 0;
	// }
	
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
	
	// return layoutData;
}
	
var layoutIsSet = false;

function setPlayerLayoutIfNecessary() {
	if (playerWindowReady) {
		if (!layoutIsSet) {
			if (version == 'v1') {
				if (currentLayoutHtml && !isGettingLayout) {
					// call Player's setPlayerLayout(version, currentLayoutHtml);
				}
			}
			else if (version == 'v2') {
				if ( !layouts.isEmpty() ) {
					// call Player's setPlayerLayout(version, layouts.peek());
					layoutIsSet = true;
				}
			}
		}
	}
	else if (!playerWindowReady) {
		layoutIsSet = false;
	}
}

var playerWindowSlideInterval;

function Timer(duration, action) {
	var timerId, paused, start, remaining = duration;
	this.pause = function() {
		paused = true;
		window.clearTimeout(timerId);
		remaining -= new Date() - start;
	};
	this.resume = function() {
		paused = false;
		start = new Date();
		timerId = window.setTimeout(function() {
			action();
			playerWindowSlideInterval = new Timer(currentDuration, action);
		}, remaining);
	};
	this.isPaused = function() {
		return paused;
	};
	this.setRemaining = function(newValue) {
		remaining = newValue;
	};
	this.resume();
};

var playerWindowCheckInterval;

function startPlayerWindowSlideInterval() {
	console.log(currentDuration);
	
	setPlayerLayoutIfNecessary(); // TODO: move this out of here...
	
	// function dynamicSetInterval(duration, action) {
		// playerWindowSlideInterval = setTimeout(function() {
			// action();
			// dynamicSetInterval(currentDuration, action);
		// }, duration);
	// }
	
	playerWindowSlideInterval = new Timer(currentDuration, function() {
		if (version == 'v1') {
			currentLayoutHtml = _layoutLoader.html(); // will be the layout to play after this the current slide's current duration (see the if statement directly below this call to dynamicSetInterval()).
			currentDuration = parseInt( _layoutLoader.find('#delay').text() );
			isGettingLayout = true;
			getLayout();
		}
		else if (version == 'v2') {
			layouts.dequeue(); // remove the layout we've already used from the queue.
		}
		
		layoutIsSet = false; // we need to set a new layout, so false. setPlayerLayoutIfNecessary() uses layoutIsSet.
		setPlayerLayoutIfNecessary();
		
		clearInterval(playerWindowCheckInterval);
		playerWindowCheckInterval = setInterval(function() { // this interval is to check that the player isn't crashed or closed.
			setPlayerLayoutIfNecessary(); // TODO: make sure to add testing for sad tabs in setPlayerLayoutIfNecessary.
		}, 50);
	});
}

function back() {
	console.log('Going to previous slide.');
	getLayoutAction = 'back'; // FIXME: the next and back commands happen one slide late. 
	playerWindowSlideInterval.pause();
	playerWindowSlideInterval.setRemaining(0);
	playerWindowSlideInterval.resume();
}

function next() {
	console.log('Going to next slide.');
	getLayoutAction = 'next';
	playerWindowSlideInterval.pause();
	playerWindowSlideInterval.setRemaining(0);
	playerWindowSlideInterval.resume();
}
function stats() {
	
}

function doKeyAction(e) { // requires Timer class
	console.log('keypress!');
	var code;
	if (!e) e = window.event;
	if (e.keyCode) code = e.keyCode;
	if (code === 32) { // space
		if (playerWindowSlideInterval.isPaused()) {
			playerWindowSlideInterval.resume();
			// call Player's helper function to get elements.
			// var vids = playerWindow.document.getElementsByTagName('video');
			for (var i=0; i<vids.length; i++) {
				vids[i].play();
			}
		} else {
			playerWindowSlideInterval.pause();
			// call Player's helper function to get elements.
			// var vids = playerWindow.document.getElementsByTagName('video');
			for (var i=0; i<vids.length; i++) {
				vids[i].pause();
			}
		}
	}
	else if (code === 66) { back(); } // b
	else if (code === 77) { stats(); } // m
	else if (code === 78) { next(); } // n
}


function detectPlayerTab(tabId, changeInfo, tab) { // start when the player window is detected.
	console.log(tab.title+' '+changeInfo.status);
	if (tab.title == 'Player' && changeInfo.status == 'complete') {
		chrome.tabs.onUpdated.removeListener(detectPlayerTab);
		
		setPlayerId();
		// poll for Player's id, then connect to Player
		var playerIdInterval;
		playerIdInterval = setInterval(function() {
			if (Player) {
				clearInterval(playerIdInterval);
				console.log('Connecting to Player ('+Player+')...');
				playerConnection = chrome.extension.connect(Player);
			}
		}, 100);
		
		if (false) {
		// determine version.
		var _versionDiv = $('<div></div>');
		// _versionDiv.load('http://127.0.0.1:3437/?action=version', function() {
			// version = 'v'+_versionDiv.text();
			version = 'v1';
			console.log(version);
		
			if (version == 'v1') {
				// Get the first layout.
				getLayout();
			}
			else if (version == 'v2') {
				// Get some initial layouts. Five is a good number.
				getLayout();
				getLayout();
				getLayout();
				getLayout();
				getLayout();
			}

			/* RECOVERY MECHANISM */
			// call Player's createPlayerWindow(playerWindowInitActions);
			chrome.tabs.onRemoved.addListener(function(tabId, removeInfo) {
				// if (tabId == playerTab.id) { // if the player tab was closed...
					// open a new player TODO: send a crash notification.
					// Call Player's createPlayerWindow(playerWindowInitActions);
				// }
			});
			
			var initialInterval;
			initialInterval = setInterval(function() {
				console.log('Poll for initial content.');
				if (version == 'v1') {
					if (_layoutLoader) { // if we have some initial content: start playing stuff, clear this interval.
						currentLayoutHtml = _layoutLoader.html();
						currentDuration = _layoutLoader.find('#delay').text();
						startPlayerWindowSlideInterval(); // uses currentDuration, so don't call getLayout() until after.
						getLayout(); // TODO: put above prefious line?
						clearInterval(initialInterval);
					}
				}
				else if (version == 'v2') {
					if (layouts.getLength()) {  // if we have some initial content: start playing stuff, clear this interval.
						startPlayerWindowSlideInterval();
						clearInterval(initialInterval);
					}
				}
			}, 100);
			
		// });
		}
	}
}

var playerConnectionPoll;
playerConnectionPoll = setInterval(function() {
	if (playerConnection) {
		console.log('Connected to Player.');
		clearInterval(playerConnectionPoll);
	}
}, 100);

// $(document).ready(detectPlayerTab); // instead of document.onready...
chrome.tabs.onUpdated.addListener(detectPlayerTab);











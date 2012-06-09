


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
	
	setPlayerTabContentIfNecessary();
}

function playerWindowUnloadNotification() {
	playerWindowReady = false;
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

function setPlayerTabContentIfNecessary() {
	console.log(playerWindowReady);
	if (playerWindowReady) {
		console.log(layoutIsSet);
		if (!layoutIsSet) {
			console.log(version);
			if (version == 'v1') {
				console.log(currentLayoutHtml);
				console.log(isGettingLayout);
				if (currentLayoutHtml && !isGettingLayout) {
					// call Player's setPlayerLayout(version, currentLayoutHtml);
					console.log('hellllooooooooo');
					playerConnection.postMessage({
						setPlayerTabContent: true,
						version: version,
						layoutData: currentLayoutHtml
					});
					layoutIsSet = false;
				}
			}
			else if (version == 'v2') {
				if ( !layouts.isEmpty() ) {
					// call Player's setPlayerLayout(version, layouts.peek());
					playerConnection.postMessage({
						setPlayerTabContent: true,
						version: version,
						layoutData: layouts.peek()
					});
					layoutIsSet = true;
				}
			}
		}
	}
	else if (!playerWindowReady) {
		layoutIsSet = false;
	}
}

function setPlayerTabContent() {
	console.log('Setting the player window content.');
	if (version == 'v1') {
		playerConnection.postMessage({
			setPlayerTabContent: true,
			version: version,
			layoutData: currentLayoutHtml
		});
	}
	else if (version == 'v2') {
		playerConnection.postMessage({
			setPlayerTabContent: true,
			version: version,
			layoutData: layouts.peek()
		});
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

var pollForSettingPlayerTabContentIfNecessary;

function startPlayerWindowSlideInterval() {
	console.log('The current content will show for '+currentDuration+' milliseconds.');
	
	// function dynamicSetInterval(duration, action) {
		// playerWindowSlideInterval = setTimeout(function() {
			// action();
			// dynamicSetInterval(currentDuration, action);
		// }, duration);
	// }
	
	playerWindowSlideInterval = new Timer(currentDuration, function() {
		if (version == 'v1') {
			currentLayoutHtml = _layoutLoader.html(); // will be the layout to play after the current slide's duration (see the if statement directly below this call to dynamicSetInterval()).
			currentDuration = parseInt( _layoutLoader.find('#delay').text() );
			isGettingLayout = true;
			getLayout();
		}
		else if (version == 'v2') {
			layouts.dequeue(); // remove the layout we've already used from the queue.
		}
		
		layoutIsSet = false; // we need to set a new layout, so false. setPlayerTabContentIfNecessary() uses layoutIsSet.
		setPlayerTabContent();
		
		clearInterval(pollForSettingPlayerTabContentIfNecessary);
		pollForSettingPlayerTabContentIfNecessary = setInterval(function() { // this interval is to check that the player isn't crashed or closed.
			setPlayerTabContentIfNecessary(); // TODO: make sure to add testing for sad tabs in setPlayerTabContentIfNecessary.
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
			//TODO call Player's helper function to get elements.
			// var vids = playerWindow.document.getElementsByTagName('video');
			for (var i=0; i<vids.length; i++) {
				vids[i].play();
			}
		} else {
			playerWindowSlideInterval.pause();
			//TODO call Player's helper function to get elements.
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
	playerTab = tab;
	playerWindowReady = true;
	
	if (tab.title == 'Player' && changeInfo.status == 'complete') {
		chrome.tabs.onUpdated.removeListener(detectPlayerTab);
		
		setPlayerId();
		// poll for Player's id, then connect to Player.
		var pollForPlayerId;
		pollForPlayerId = setInterval(function() {
			if (Player) {
				clearInterval(pollForPlayerId);
				console.log('Connecting to Player ('+Player+')...');
				playerConnection = chrome.extension.connect(Player);
			}
		}, 100);
	}
}

/*First we poll for the connectiong to Player*/
var pollForPlayerConnection;
pollForPlayerConnection = setInterval(function() {
	if (playerConnection) {
		console.log('Connected to Player.');
		clearInterval(pollForPlayerConnection);
		playerConnection.onMessage.addListener(function(msg) {
			if (msg.playerTab) {
				playerTab = msg.playerTab;
			}
			if (msg.playerTabUnloaded) {
				playerWindowReady = false;
				layoutIsSet = false;
			}
		});
		
		/*And then we poll to see if we have content.*/
		var pollForContentAvailable;
		pollForContentAvailable = setInterval(function() {
			console.log('Polling for initial content.');
			if (version == 'v1') {
				if (_layoutLoader) { // if we have some initial content: start playing stuff, clear this interval.
					currentLayoutHtml = _layoutLoader.html();
					currentDuration = _layoutLoader.find('#delay').text();
					console.log('Starting content playback.');
					setPlayerTabContent();
					startPlayerWindowSlideInterval(); // uses currentDuration, so don't call getLayout() until after.
					getLayout(); // TODO: put above previous line?
					clearInterval(pollForContentAvailable);
				}
			}
			else if (version == 'v2') {
				if (layouts.getLength()) {  // if we have some initial content: start playing stuff, clear this interval.
					setPlayerTabContent();
					startPlayerWindowSlideInterval();
					clearInterval(pollForContentAvailable);
				}
			}
		}, 100);
	}
}, 100);

/* RECOVERY MECHANISM */
// call Player's createPlayerWindow(playerWindowInitActions);
chrome.tabs.onRemoved.addListener(function(tabId, removeInfo) {
	if (tabId == playerTab.id) { // if the player tab was closed...
		// open a new player TODO: send a crash report to unitclient.
		// Call Player's createPlayerWindow(playerWindowInitActions);
		console.log('The player window has been closed and will be restarted.');
		playerConnection.postMessage({
			playerTabClosed: true
		});
	}
});

chrome.tabs.onUpdated.addListener(detectPlayerTab);

$(document).ready(function() {
		
	// determine version.
	var _versionDiv = $('<div></div>');
	// _versionDiv.load('http://127.0.0.1:3437/?action=version', function() {
		// version = 'v'+_versionDiv.text();
		version = 'v1';
		console.log('Unitclient Version: '+version);
	
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
		
	// });
});











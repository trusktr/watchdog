


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

	isPlayerWindow = function() { return false; },
	
	/*Really internal*/
	intervals = new Array();
	
function log(msg) { console.log(msg); }

function reloadExtension(targetExtensionId, callback) {
	chrome.management.get(targetExtensionId, function(extension) {
		console.log('Reloading extension "' + extension.name + '"...');
		
		chrome.management.setEnabled(extension.id, false, function() {
			chrome.management.setEnabled(extension.id, true, function() {
				console.log('"'+extension.name+'" extension reloaded.');
				if (typeof callback == 'function') callback();
			});
		});
	});
}

function setPlayerId() {
	chrome.management.getAll(function(extensions) {
		for ( var i = 0; i < extensions.length; ++i ) {
			if (extensions[i].name == 'Player') {
				console.log('Detected id for Player extension: '+extensions[i].id);
				Player = extensions[i].id;
			}
		}
	});
}
	
function createPlayerWindow(callback) {
	// call Player's createPlayerWindow(callback)
	// get playerTab set somehow.
}


var _layoutLoader;

function getLayout(callback) {
	console.log('Getting layout content.');
	
	var layoutData = {},
		jsonComplete = false;
	
	if (version == 'v1') {
		_layoutLoader = $('<div id="layoutLoader"></div>');
		
		_layoutLoader.load('http://127.0.0.1:3437/?action='+getLayoutAction+' div', function(){
			isGettingLayout = false;
			getLayoutAction = 'update'; // reset this if it was changed.
			console.log('Done getting layout content.');
			if (typeof callback == 'function') callback();
		});
	}
	else if (version == 'v2') {
		$.getJSON('http://127.0.0.1:3437/?action=update', function(data) {
			layoutData = data;
			console.log(layoutData);
			layouts.enqueue(layoutData);
			jsonComplete = true;
			console.log('Done getting layout content.');
			if (typeof callback == 'function') callback();
		});
	}
}

function setPlayerTabContent() {
	console.log('Setting the player window content.');
	if (version == 'v1') {
		if (playerConnection) {
			playerConnection.postMessage({
				setPlayerTabContent: true,
				version: version,
				layoutData: currentLayoutHtml
			});
		}
	}
	else if (version == 'v2') {
		if (playerConnection) {
			playerConnection.postMessage({
				setPlayerTabContent: true,
				version: version,
				layoutData: layouts.peek()
			});
		}
	}
}

var playerPlaybackInterval;

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
			playerPlaybackInterval = new Timer(currentDuration, action);
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
	this.resume(); // if autostart.
};

function startContentPlaybackInterval() {
	console.log('Starting playback of content.');
	
	playerPlaybackInterval = new Timer(currentDuration, function() {
		console.log('The last layout showed for '+(currentDuration/1000)+' seconds.');
		if (version == 'v1') {
			currentLayoutHtml = _layoutLoader.html(); // will be the layout to play after the current slide's duration (see the if statement directly below this call to dynamicSetInterval()).
			currentDuration = parseInt( _layoutLoader.find('#delay').text() );
			isGettingLayout = true;
			getLayout();
		}
		else if (version == 'v2') {
			layouts.dequeue(); // remove the layout we've already used from the queue.
		}
		
		setPlayerTabContent();
	});
}

function back() {
	console.log('Going to previous slide.');
	getLayoutAction = 'back'; // FIXME: the next and back commands happen one slide late. 
	playerPlaybackInterval.pause();
	playerPlaybackInterval.setRemaining(0);
	playerPlaybackInterval.resume();
}

function next() {
	console.log('Going to next slide.');
	getLayoutAction = 'next';
	playerPlaybackInterval.pause();
	playerPlaybackInterval.setRemaining(0);
	playerPlaybackInterval.resume();
}
function stats() {
	console.log('Toggling stats view.');
	var _buffer = $('<div>');
	_buffer.load('http://127.0.0.1:3437/?action=stats', function() {
		if (playerConnection) {
			playerConnection.postMessage({
				toggleStats: true,
				statsData: _buffer.html()
			});
		}
	});
}

function doKeyAction(e) { // requires Timer class
	var code;
	if (!e) e = window.event;
	if (e.keyCode) code = e.keyCode;
	if (code === 32) { // space
		console.log('[Spacebar]');
		if (playerPlaybackInterval.isPaused()) {
			console.log('Resuming playback.');
			playerPlaybackInterval.resume();
			playerConnection.postMessage({
				playbackResumed: true
			});
		} else {
			console.log('Pausing playback.');
			playerPlaybackInterval.pause();
			playerConnection.postMessage({
				playbackPaused: true
			});
		}
	}
	else if (code === 66) { console.log('[b]'); back(); } // b
	else if (code === 77) { console.log('[m]'); stats(); } // m
	else if (code === 78) { console.log('[n]'); next(); } // n
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
				console.log('Creating connection to Player ('+Player+')...');
				playerConnection = chrome.extension.connect(Player);
			}
		}, 100);
	}
}
			
function setPollForContentAvailable() {
	/*We poll to see if we have content.*/
	console.log('Polling for initial content.');
	var pollForContentAvailable;
	pollForContentAvailable = setInterval(function() {
		if (version == 'v1') {
			if (_layoutLoader) { // if we have some initial content: start playing stuff, clear this interval.
				console.log('Initial content available.');
				console.log('Setting up initial content.');
				currentLayoutHtml = _layoutLoader.html();
				currentDuration = _layoutLoader.find('#delay').text();
				setPlayerTabContent();
				startContentPlaybackInterval(); // uses currentDuration, so don't call getLayout() until after.
				getLayout(); // TODO: put above previous line?
				clearInterval(pollForContentAvailable);
			}
		}
		else if (version == 'v2') {
			if (layouts.getLength()) {  // if we have some initial content: start playing stuff, clear this interval.
				console.log('Initial content available.');
				console.log('Setting up initial content.');
				setPlayerTabContent();
				startContentPlaybackInterval();
				clearInterval(pollForContentAvailable);
			}
		}
	}, 100);
	intervals.push(pollForContentAvailable);
}

function setPollForPlayerConnection() {
	/*We poll for the connection to Player*/
	console.log('Polling for the connection to Player.');
	var pollForPlayerConnection;
	pollForPlayerConnection = setInterval(function() {
		if (playerConnection) {
			console.log('Connected to Player.');
			clearInterval(pollForPlayerConnection);
			console.log('Establishing listeners for messages from Player.');
			playerConnection.onMessage.addListener(function(msg) {
				if (msg.playerTabReady) {
					console.log('The player tab is ready.');
					playerTab = msg.playerTab;
				}
				if (msg.playerTabUnload) {
					console.log('The player tab was closed.');
					playerWindowReady = false;
				}
				if (msg.keyAction) {
					console.log('A key was pressed.');
					doKeyAction(msg.key);
				}
			});
			playerConnection.onDisconnect.addListener(function() {
				console.log('############### !!! Connection to Player lost. !!! ###############');
				playerConnection = false;
				console.log('Stopping intervals (if necessary) and playback.');
				for (var i=0; i<intervals.length; ++i) {
					clearInterval(intervals[i]);
				}
				intervals = new Array(); // get ready for when playback resumed.
				playerPlaybackInterval.pause();
				console.log('Attempting to reload Player and resume playback.');
				// reloadExtension(Player, function() {}); // doesn't work with crashed extensions. :(
				$('<div>').load('http://127.0.0.1:3437/?action=crash');
				console.log('Crash event reported.');
				chrome.windows.remove(playerTab.windowId, function() {});
				// chrome.tabs.onUpdated.addListener(detectPlayerTab);
				// setPollForPlayerConnection();
			});
			setPollForContentAvailable();
		}
	}, 100);
	intervals.push(pollForPlayerConnection);
}

chrome.tabs.onUpdated.addListener(detectPlayerTab);

$(document).ready(function() {
		
	// determine version.
	var _versionDiv = $('<div></div>');
	// _versionDiv.load('http://127.0.0.1:3437/?action=version', function() {
		// version = 'v'+_versionDiv.text();
		version = 'v1';
		console.log('Watchdog ready.');
		console.log('Unitclient Version: '+version);
	
		console.log('Getting initial content.');
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
	
	setPollForPlayerConnection();
});

// chrome.windows.onRemoved.addListener(function(windowId) {
	// chrome.management.uninstall(Player);
// });
window.onunload = function() {
	$('<div>').load('http://127.0.0.1:3437/?action=close');
};











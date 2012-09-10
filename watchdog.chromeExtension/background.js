


var version = 'v1',
	thisExtensionId = chrome.i18n.getMessage('@@extension_id'),
	Player,
	playerConnection,
	
	layouts = new Queue(), // for v2
	currentLayoutHtml = '', // for v1
	currentDuration = 0, // for v1
	getLayoutAction = 'update', // for v1
	isGettingLayout = false, // for v1
	isLoading = false,
	
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


var layoutContent;

function getLayout(callback) {
	isGettingLayout = true;
	console.log('Getting layout content.');
	
	var layoutData = {},
		jsonComplete = false;
	
	if (version == 'v1') {
		$.ajax({
			url: 'http://127.0.0.1:3437/',
			type: 'get',
			data: {action: getLayoutAction},
			success: function(data, textStatus, jqXHR) {
				
				/*The following might fail if the layout content format changes.*/
				data = data.split('<body')[1];
				var tmp = data.indexOf('>');
				data = data.substr(tmp+1);
				if ( data.indexOf('<script') ) {
					data = data.split('<script');
					tmp = data[1].indexOf('>');
					data[1] = data[1].substr(tmp+1);
					data[1] = data[1].split('</script>')[1];
				}
				data[1] = data[1].split('</body>')[0];
				data = data.join('');
				
				layoutContent = data;
				
				getLayoutAction = 'update'; // reset this in case it was changed.
				console.log('Done getting layout content.');
				isGettingLayout = false;
				if (typeof callback == 'function') callback();
			}
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
			isLoading = true; //
			playerPlaybackInterval = new Timer(currentDuration, action);
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
	this.resume(); // if autostart.
};

var contentPlaybackIntervalAlternator = 0;
function startContentPlaybackInterval() {
	console.log('Starting playback of content.');
	
	playerPlaybackInterval = new Timer(currentDuration, function() {
		if (contentPlaybackIntervalAlternator) {
			isLoading = false;
			
			console.log('The current slide will show for '+(currentDuration/1000)+' seconds.');
			playerPlaybackInterval.pause();
			if (version == 'v1') {
				--contentPlaybackIntervalAlternator;
				// currentLayoutHtml = layoutContent.html(); // will be the layout to play after the current slide's duration (see the if statement directly below this call to dynamicSetInterval()).
				currentLayoutHtml = layoutContent; // will be the layout to play after the current slide's duration (see the if statement directly below this call to dynamicSetInterval()).
			}
			else if (version == 'v2') {
				// layouts.dequeue(); // remove the layout we've already used from the queue.
			}
			setPlayerTabContent();
			playerPlaybackInterval.resume(); // TODO make sure this gets executed after the instant media content has started rendering to maximize ttl display time accuracy.
		
		}
		else if (!contentPlaybackIntervalAlternator) {
			/*Load content between slides. (v1 only)*/
			isLoading = true;
			
			//TODO block keyboard commands while in this alternation.
			
			// stop the timer, set remaining time to 0, then resume after the next layout's info is ready.
			playerPlaybackInterval.pause();
			playerPlaybackInterval.setRemaining(0);
			
			if (version == 'v1') {
				getLayout(function() {
					// currentDuration = parseInt( layoutContent.find('#delay').text() );
					currentDuration = parseInt( layoutContent.split("<div style='display: none' id='delay'>")[1].split('</div>')[0] );
					++contentPlaybackIntervalAlternator;
					playerPlaybackInterval.resume();
				});
			}
			else if (version == 'v2') {
				getLayout(); // asynchronous
				layouts.dequeue();
				currentDuration = parseInt( layouts.peek().ttl );
				++contentPlaybackIntervalAlternator;
				playerPlaybackInterval.resume();
			}
		}
	});
}

function togglePause() {
	if (!isLoading) {
		//isLoading = true; //this line is only needed for actions that cause the player to load a new slide.
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
}

function back() {
	if (!isLoading) {
		isLoading = true; //
		console.log('Going to previous slide.');
		playerPlaybackInterval.pause();
		getLayoutAction = 'back';
		playerPlaybackInterval.setRemaining(0);
		playerPlaybackInterval.resume();
	}
}

function next() {
	if (!isLoading) {
		isLoading = true; //
		console.log('Going to next slide.');
		playerPlaybackInterval.pause();
		getLayoutAction = 'next';
		playerPlaybackInterval.setRemaining(0);
		playerPlaybackInterval.resume();
	}
}

var statsAlternator = 1,
	statsRefreshInterval;
function stats() {
	//if (!isLoading) {
		//isLoading = true; //this line is only needed for actions that cause the player to load a new slide.
		console.log('Toggling stats view.');
		
		if (statsAlternator) {
			statsAlternator--;
			function showStats() {
				if (playerConnection) {
					playerConnection.postMessage({
						showStats: true
					});
				}
			}
			showStats();
			function refreshStats() {
				var _buffer = $('<div>');
				_buffer.load('http://127.0.0.1:3437/?action=stats', function() {
					if (playerConnection) {
						playerConnection.postMessage({
							refreshStats: true,
							statsData: _buffer.html()
						});
					}
				});
			}
			statsRefreshInterval = setInterval(function() {
				refreshStats();
			}, 1000);
		}
		else {
			statsAlternator++;
			clearInterval(statsRefreshInterval);
			function hideStats() {
				if (playerConnection) {
					playerConnection.postMessage({
						hideStats: true
					});
				}
			}
			hideStats();
		}
	//}
}

var keySequence = '';
function doKeyAction(e) { // requires Timer class
	
	var tmpKeyArray = [];
	keySequence += e.keyCode + ',';
	if (keySequence.indexOf('69,88,73,84') != -1) { // if "exit" is typed.
		// exit
		$('<div>').load('http://127.0.0.1:3437/?action=close');
		chrome.windows.remove(playerTab.windowId, function() {});
	}
	if (keySequence.length > 20) {
		console.log('keySequence trimmed.');
		tmpKeyArray = keySequence.split(',');
		tmpKeyArray.splice(0, 2);
		keySequence = tmpKeyArray.join(',');
	}
	var code;
	if (!e) e = window.event;
	if (e.keyCode) code = e.keyCode;
	if 		(code === 32) { console.log('[Spacebar]'); 	togglePause(); } // space
	else if (code === 66) { console.log('[b]'); 		back(); } // b
	else if (code === 77) { console.log('[m]'); 		stats(); } // m
	else if (code === 78) { console.log('[n]'); 		next(); } // n
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
			if (layoutContent) { // if we have some initial content: start playing stuff, clear this interval.
				clearInterval(pollForContentAvailable);
				console.log('Initial content available.');
				console.log('Setting up initial content.');
				// currentLayoutHtml = layoutContent.html();
				currentLayoutHtml = layoutContent;
				// currentDuration = layoutContent.find('#delay').text();
				currentDuration = parseInt( layoutContent.split("<div style='display: none' id='delay'>")[1].split('</div>')[0] );
				console.log('The current slide will show for '+(currentDuration/1000)+' seconds.');
				setPlayerTabContent();
				startContentPlaybackInterval(); // uses currentDuration, so don't call getLayout() until after.
			}
		}
		else if (version == 'v2') {
			if (layouts.getLength()) {  // if we have some initial content: start playing stuff, clear this interval.
				clearInterval(pollForContentAvailable);
				console.log('Initial content available.');
				console.log('Setting up initial content.');
				setPlayerTabContent();
				startContentPlaybackInterval();
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











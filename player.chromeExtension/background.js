


var version = 'v1',
	thisExtensionId = chrome.i18n.getMessage('@@extension_id'),
	watchdogConnection = false,
	
	currentLayoutHtml = '', // for v1
	
	playerWindowReady = false,
	playerTab,
	playerWindow,

	isPlayerWindow = function() { return false; };
	
function log(msg) { console.log(msg); }

function reportPlayerTabReady(theWindow) {
	playerWindow = theWindow;
	playerWindowReady = true;
	setPlayerTabContent(version, currentLayoutHtml);
	if (watchdogConnection) {
		watchdogConnection.postMessage({
			playerTabReady: true,
			playerTab: playerTab
		});
	}
}

function reportPlayerTabUnload() {
	playerWindowReady = false;
	if (watchdogConnection) {
		watchdogConnection.postMessage({playerTabUnload: true});
	}
}
	
function createPlayerWindow(callback) {
	chrome.tabs.create({url:"player.html"}, function(tab) {
		playerTab = tab;
		// TODO: is the new tab's document.onready fired by now??? If not, the following callback might be better suited in reportPlayerTabReady()
		if (typeof callback == 'function') callback(tab);
	});
}

	
var layoutIsSet = false;
	
function setPlayerTabContent(version, layoutData) {
	console.log('Setting player window content.');
	if (version = 'v1') {
		currentLayoutHtml = layoutData;
	}
	playerWindow.setContent(version, layoutData);
}

function reportKeyAction(e) {
	console.log('Reporting key action.');
	if (watchdogConnection) {
		watchdogConnection.postMessage({
			keyAction: true,
			key: {keyCode: e.keyCode}
		});
	}
};


chrome.extension.onConnectExternal.addListener(function(port) {
	watchdogConnection = port;
	console.log('Connected to Watchdog.');
	
	watchdogConnection.onMessage.addListener(function(msg) {
		if (msg.playerTabClosed) {
			createPlayerWindow();
		}
		if (msg.setPlayerTabContent) {
			setPlayerTabContent(msg.version, msg.layoutData);
		}
		if (msg.playbackResumed) {
			var vids = playerWindow.document.getElementsByTagName('video');
			for (var i=0; i<vids.length; i++) {
				vids[i].play();
			}
		}
		if (msg.playbackPaused) {
			var vids = playerWindow.document.getElementsByTagName('video');
			for (var i=0; i<vids.length; i++) {
				vids[i].pause();
			}
		}
	});
	watchdogConnection.onDisconnect.addListener(function() {
		console.log('Connection to Watchdog disconnected.');
	});
});

/* RECOVERY MECHANISM */
chrome.tabs.onRemoved.addListener(function(tabId, removeInfo) {
	if (tabId == playerTab.id) { // if the player tab was closed...
		// open a new player TODO: send a crash report to unitclient.
		// Call Player's createPlayerWindow(playerWindowInitActions);
		console.log('The player window has been closed and will be restarted.');
		createPlayerWindow();
	}
});

$(document).ready(function() {

	// create the player tab and update it repeatedly so that Watchdog can
	// detect that Player is ready.
	createPlayerWindow(function() {
		var pollForWatchdogConnection;
		pollForWatchdogConnection = setInterval(function() {
			if (!watchdogConnection) { /*if Watchdog is not connected yet.*/
				playerWindow.document.location.reload(); // Keep signaling until Watchdog detects the player tab.
			}
			else if (watchdogConnection) { // if the connection exists.
				clearInterval(pollForWatchdogConnection); // stop polling.
			}
		}, 3000);
	});
	// After the interval is cleared, the player tab is already ready and Watchdog has detected it and will now control it.
		
});

window.onunload = function() {
	chrome.tabs.remove(playerTab.id); // Clean up when closing the plugin.
	chrome.management.uninstall(thisExtensionId);
};





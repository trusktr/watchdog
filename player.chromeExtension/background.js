


var thisExtensionId = chrome.i18n.getMessage('@@extension_id'),
	watchdogConnection = false,
	
	playerWindowReady = false,
	playerTab,
	playerWindow,

	isPlayerWindow = function() { return false; };
	
function log(msg) { console.log(msg); }

function reportPlayerWindowReadyNotification(theWindow) {
	playerWindow = theWindow;
	playerWindowReady = true;
	// call playerWindowReadyNotification(theWindow) of Watchdog
}

function reportPlayerWindowUnloadNotification() {
	// call Watchdog's playerWindowUnloadNotification()
}
	
function createPlayerWindow(callback) {
	chrome.tabs.create({url:"player.html"}, function(tab) {
		playerTab = tab;
		// TODO: is the new tab's document.onready fired by now??? If not, the following callback might be better suited in reportPlayerWindowReadyNotification()
		if (typeof callback == 'function') callback();
	});
}

	
var layoutIsSet = false;
	
function setPlayerLayout(version, currentLayoutHtml) {
	playerWindow.setLayout(version, currentLayoutHtml);
}

function reportKeyAction(e) {
	// call  Watchdog's doKeyAction(e).
};


chrome.extension.onConnectExternal.addListener(function(port) {
	watchdogConnection = port;
	console.log('Connected to Watchdog.');
});

$(document).ready(function() {

	// create the player tab and update it repeatedly so that Watchdog can
	// detect that Player is ready.
	var readyInterval;
	createPlayerWindow(function() {
		readyInterval = setInterval(function() {
			if (!watchdogConnection) { /*if Watchdog is not connected yet.*/
				playerWindow.document.location.reload(); // Keep signaling until Watchdog detects the player tab.
			}
			else if (watchdogConnection) { // if the connection exists.
				clearInterval(readyInterval); // stop polling.
			}
		}, 3000);
	});
	// After the interval is cleared, the player tab is already ready and Watchdog has detected it and will now control it.
		
});

window.onunload = function() {
	chrome.tabs.remove(playerTab.id);
};





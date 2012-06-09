


var thisExtensionId = chrome.i18n.getMessage('@@extension_id'),
	
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



$(document).ready(function() {

	// create the player tab and update it repeatedly so that Watchdog can
	// detect that Player is ready.
	var readyInterval,
		watchdogReady = false;
	createPlayerWindow(function() {
		readyInterval = setInterval(function() {
			if (true/*if Watchdog not loaded yet.*/) {
				playerWindow.document.location.reload();
			}
			else {
				watchdogReady = true;
				clearInterval(readyInterval);
			}
		}, 1000);
	});
	// After the interval is cleared, the player tab is already ready and Watchdog has detected it and will now control it.
		
});





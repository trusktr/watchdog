


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
		if (typeof callback == 'function') callback();
	});
}

	
var layoutIsSet = false;
	
function setPlayerLayoutIfNecessary(version, currentLayoutHtml) {
	playerWindow.setLayout(version, currentLayoutHtml);
}

function reportKeyAction(e) {
	// call doKeyAction(e) of Watchdog .
};



$(document).ready(function() {

		/* RECOVERY MECHANISM */
		createPlayerWindow(playerWindowInitActions);
		
});











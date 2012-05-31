


var layouts = new Queue(),
	currentLayoutHtml = '',
	playerWindowReady = false;
var playerTab,
	playerWindow;

var isPlayerWindow = function() { return false; };

function playerWindowReadyNotification(theWindow) {
	console.log('playerWindowReadyNotification() executed');
	
	playerWindow = theWindow;
	playerWindowReady = true;
	console.log(playerWindow); // useful to see what the window object contains.
	
	setPlayerLayoutIfNecessary('v1');
}

function playerWindowUnloadNotification() {
	playerWindowReady = false;
	console.log('The player window has been closed and will restart.');
}
	
function createPlayerWindow(callback) {
	chrome.tabs.create({url:"player.html"}, function(tab) {
		playerTab = tab;
		if (typeof callback == 'function') callback();
	});
}

function playerWindowActions() {
	console.log('playerWindowActions() executed');
}



var tempCounter = 0,
	_layoutLoader;

function getLayout(version, callback) {
	var layoutData = {},
		jsonComplete = false;
	
	if (version == 'v1') {
		_layoutLoader = $('<div id="layoutLoader"></div>');
		console.log(_layoutLoader.attr('id'));
		
		_layoutLoader.load('http://127.0.0.1:3437/?action=update div', function(){
			console.log('Layout HTML loaded: (BLAH)');
			console.log(_layoutLoader.html());
			if (typeof callback == 'function') callback();
		});
	}
	else if (version == 'v2') {
		$.getJSON('http://127.0.0.1:3437/?action=update', function(data){
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
	
var playerWindowCheckInterval,
	playerWindowSlideInterval,
	layoutIsSet = false;
	
function setPlayerLayoutIfNecessary(version) {
	
	if (playerWindowReady) {
		if (!layoutIsSet) {
			if (version == 'v1') {
				if (currentLayoutHtml) {
					playerWindow.setLayout(version, currentLayoutHtml);
				}
			}
			else if (version == 'v2') {
				if ( !layouts.isEmpty() ) {
					// playerWindow.$('#layoutContainer').append( $('<div>'+layouts.peek().partitions[0].media+'</div>') );
					playerWindow.setLayout(version, layouts.peek());
					layoutIsSet = true;
				}
			}
		}
	}
	else if (!playerWindowReady) {
		layoutIsSet = false;
	}
}
function startPlayerWindowSlideInterval(version) {
	console.log(/*layouts.peek().ttl*1000*/5000);
	
	setPlayerLayoutIfNecessary(version);
	if (version == 'v1') {
		getLayout(version);
	}
	playerWindowSlideInterval = setInterval(function() {
		console.log('Slide interval (BLAH)');
		
		if (version == 'v1') {
			currentLayoutHtml = _layoutLoader.html();
			getLayout(version);
		}
		else if (version == 'v2') {
			layouts.dequeue(); // remove the layout we've already used from the queue.
		}
		
		layoutIsSet = false; // we need a new layout, so false
		setPlayerLayoutIfNecessary(version);
		
		clearInterval(playerWindowCheckInterval);
		playerWindowCheckInterval = setInterval(function(){
			setPlayerLayoutIfNecessary(version);
		}, 50);
	}, /*layouts.peek().ttl*1000*/5000);
}



$(document).ready(function() {
	
	// Get some initial layoutss. Five is a good number.
	var version = 'v1';
	if (version == 'v1') {
		getLayout(version);
	}
	else if (version == 'v2') {
		getLayout(version);
		getLayout(version);
		getLayout(version);
		getLayout(version);
		getLayout(version);
	}

	createPlayerWindow(playerWindowActions);
	chrome.tabs.onRemoved.addListener(function(tabId, removeInfo) {
		if (tabId == playerTab.id) { // if the player tab was closed...
			//open a new one and send a crash report.
			createPlayerWindow(playerWindowActions);
		}
	});
	
	var initialInterval;
	initialInterval = setInterval(function() {
		console.log('initial interval');
		if (version == 'v1') {
			if (_layoutLoader) {
				currentLayoutHtml = _layoutLoader.html();
				startPlayerWindowSlideInterval(version);
				clearInterval(initialInterval);
			}
		}
		else if (version == 'v2') {
			if (layouts.getLength()) {
				startPlayerWindowSlideInterval(version);
				clearInterval(initialInterval);
			}
		}
	}, 100);
	
	
});











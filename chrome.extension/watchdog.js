


var layoutData = new Queue(),
	playerWindowReady = false;
var playerTab,
	playerWindow;

var isPlayerWindow = function() { return false; };

function playerWindowReadyNotification(theWindow) {
	console.log('playerWindowReadyNotification() executed');
	
	playerWindow = theWindow;
	playerWindowReady = true;
	console.log(playerWindow); // useful to see what the window object contains.
	
	setPlayerLayoutIfNecessary();
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



var tempCounter = 0;
function getLayout() {
	// $.getJSON('http://localhost:3437', function(data){
		// layoutData.enqueue(data);
		// console.log(data);
		// /*display data as a layout for ttl seconds.*/
	// });
	
	var layout = {
		"id": 10,
		"ttl": Math.floor( (Math.random()*/*B*/1) + /*A*/4 ), //random number from A to B
		"title": "Airport Storage",
		"partitions": [{
			"x": 0,
			"y": 0,
			"h": 100,
			"w": 50,
			"media": "test"+(++tempCounter)+".jpg",
			"media_md5": "bfaif97f8ab745b0587de1dcf1dbf6bc"
		}, {
			"x": 50,
			"y": 0,
			"h": 100,
			"w": 100,
			"media": "test"+(++tempCounter)+".jpg",
			"media_md5": "bfa2067wd7b7edy7587de1dcf1dbf6bc"
		}],
		"overlays": []
	};
	
	return layout;
}
	
var playerWindowCheckInterval,
	playerWindowSlideInterval,
	layoutIsSet = false;
	
function setPlayerLayoutIfNecessary() {
	
	if (playerWindowReady) {
		if (!layoutIsSet) {
			playerWindow.$('#layoutContainer').append( $('<div>'+layoutData.peek().partitions[0].media+'</div>') );
			layoutIsSet = true;
		}
	}
	else if (!playerWindowReady) {
		layoutIsSet = false;
	}
}
function startPlayerWindowSlideInterval() {
	console.log(layoutData.peek().ttl);
	
	setPlayerLayoutIfNecessary();
	playerWindowSlideInterval = setInterval(function() {
		layoutData.dequeue(); // remove the layout we've already used from the queue.
		layoutData.enqueue(getLayout()); // add another layout to the queue to keep things balanced.
		
		layoutIsSet = false; // we need a new layout, so false
		setPlayerLayoutIfNecessary();
		
		clearInterval(playerWindowCheckInterval);
		playerWindowCheckInterval = setInterval(function(){
			setPlayerLayoutIfNecessary();
		}, 50);
	}, layoutData.peek().ttl*1000);
}



$(document).ready(function() {
	
	// Get some initial layouts. Five is a good number.
	layoutData.enqueue(getLayout());
	layoutData.enqueue(getLayout());
	layoutData.enqueue(getLayout());
	layoutData.enqueue(getLayout());
	layoutData.enqueue(getLayout());

	console.log("layoutData: ");
	console.log(layoutData);

	createPlayerWindow(playerWindowActions);
	chrome.tabs.onRemoved.addListener(function(tabId, removeInfo) {
		if (tabId == playerTab.id) { // if the player tab was closed...
			//open a new one and send a crash report.
			createPlayerWindow(playerWindowActions);
		}
	});
	
	startPlayerWindowSlideInterval();
	
	
});











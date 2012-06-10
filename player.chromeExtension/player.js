
var backgroundPage = chrome.extension.getBackgroundPage(); // The JavaScript 'window' object of the background page.
var isPlayerWindow = function() { return true; };

function setContent(version, layoutData) {
	if (version == 'v1') {
		$('#layoutContainer').html(layoutData);
	}
	else if (version == 'v2') {
		// receives a layout object then creates the HTML layout to put in #layoutContainer
		var content = '',
			pagedata = '';
		
		for (var i=0; i<layoutData.partitions.length; i++) {
			var partition = layoutData.partitions[i],
				filename = partition.media,
				filenameParts = filename.split("."),
				filenameExtension  = filenameParts[filenameParts.length-1]; // the last part should be the extension...
			
			if (filenameExtension == 'webm') {
				content = '            <video autoplay>'
						+ '                <source src="http://127.0.0.1:3437/' + filename + '" type="video/webm; codecs=\'vorbis,vp8\'" />'
						+ "            </video>";
			} else if (filenameExtension == 'swf') {
				content = "            <object type='application/x-shockwave-flash' data='http://127.0.0.1:3437/" + filename + "' width='100%' height='100%'>"
						+ "                <param name='movie' value='http://127.0.0.1:3437/" + filename + "' />"
						+ "                <param name='quality' value='high' />"
						+ "                <param name='bgcolor' value='#ffffff' />"
						+ "                <param name='play' value='true' />"
						+ "                <param name='loop' value='true' />"
						+ "                <param name='wmode' value='transparent' />"
						+ "                <param name='scale' value='showall' />"
						+ "                <param name='menu' value='false' />"
						+ "                <param name='devicefont' value='false' />"
						+ "                <param name='salign' value='' />"
						+ "                <param name='allowScriptAccess' value='sameDomain' />"
						+ "            </object>";
			} else { // Must be an image
				content = "            <img style='height: 100%; width: 100%;' src='http://127.0.0.1:3437/" + filename + "' alt='' />";
			}
			
			// Construct the html
			pagedata += "       <div style='position: absolute; top: " + partition.y + "%; left: " + partition.x + "%; height: " + partition.h + "%; width: " + partition.w + "%;'>"
					 +              content
					 + "        </div>";
		}
		$('#layoutContainer').html(pagedata);
	
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
	}
}

window.onunload = function() {
	backgroundPage.reportPlayerTabUnload();
	return true;
};

$(document).ready(function() {
	// ready, so notify the background page.
	backgroundPage.reportPlayerTabReady(window);
	
	//disable right click menu
	$('body').on('contextmenu', function() {
		return false;
	});
		
	$(window).on('keyup', function(e) {
		console.log('Reporting key action.');
		backgroundPage.reportKeyAction(e);
	});
});

/*Make the player crash after a while.*/
// setTimeout(function() {
	// var txt = '';
	// while(true) {
		// txt += 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
			// +'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
			// +'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
			// +'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
			// +'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
			// +'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
			// +'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
			// +'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
			// +'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
			// +'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
			// +'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
			// +'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
			// +'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
			// +'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
			// +'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
			// +'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
			// +'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
			// +'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
			// +'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
			// +'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
			// +'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
			// +'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
			// +'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
			// +'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
			// +'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
			// +'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
	// }
// }, 6000);










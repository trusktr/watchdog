
var backgroundPage = chrome.extension.getBackgroundPage(); // The JavaScript 'window' object of the background page.
var isPlayerWindow = function() { return true; };

window.onunload = function() {
	backgroundPage.reportPlayerWindowUnloadNotification();
	return true;
};

function setLayout(version, layoutData) {
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
	}
}

$(document).ready(function() {
	// ready, so notify the background page.
	backgroundPage.reportPlayerWindowReadyNotification(window);
	
	//disable right click menu
	$('body').on('contextmenu', function() {
		return false;
	});
		
	$(window).on('keyup', function(e) {
		backgroundPage.reportKeyAction(e);
	});
});




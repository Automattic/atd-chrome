function toHost(url) {
        var host = new RegExp('(https{0,1}://.*?)/.*').exec(url);
        if (host == null)
                host = url;
        else
                host = host[1];
        return host;
}

/* define default values for Language and the keyboard shortcut */
if (localStorage['language'] == undefined)
	localStorage['language'] = 'English';
if (localStorage['shortcut'] == undefined)
	localStorage['shortcut'] = 'true,false,true,false,83,0';
if (localStorage['auto'] == undefined)
	localStorage['auto'] = 'false';
if (localStorage['button'] == undefined)
	localStorage['button'] = 'true';
if (localStorage['message'] == undefined)
	localStorage['message'] = 'true';

/* always disable auto-proofread feature in older versions of Chrome */
if (chrome.pageAction['setPopup'] == undefined)
	localStorage['auto'] = false;

/* we're going to get some nasty errors if our options are not set */
var options = ['options', 'sites', 'phrases', 'guess'];
for (var x = 0; x < options.length; x++) {
	if (localStorage[options[x]] == undefined)
		localStorage[options[x]] = '';
}

/* a function to refresh all the tab icons */
function checkTab(tabId, url, change) {
	var sites = localStorage['sites'].split(/,\s+/);
	var enabled = true;
	var aurl = toHost(url);
	for (var x = 0; x < sites.length; x++) {
		if (sites[x] != '' && sites[x] == aurl)
			enabled = false;
	}

	if (!change)
		chrome.tabs.sendRequest(tabId, enabled ? 'enabled' : 'disabled');

	if (enabled) {
		chrome.pageAction.setIcon({ path: 'images/icon48.png', tabId: tabId });

		/* check if we're using an older ver of Chrome, if so don't even mess with page actions */
		if (chrome.pageAction['setPopup'] != undefined)
			chrome.pageAction.setPopup({ popup: 'action/disable.html', tabId: tabId });
	}
	else {
		chrome.pageAction.setIcon({ path: 'images/icon48bw.png', tabId: tabId });

		/* check if we're using an older ver of Chrome, if so don't even mess with page actions */
		if (chrome.pageAction['setPopup'] != undefined)
			chrome.pageAction.setPopup({ popup: 'action/enable.html', tabId: tabId });
	}

	if (localStorage['button'] == 'true') {
		chrome.pageAction.show(tabId);
	}
	else {
		chrome.pageAction.hide(tabId);
	}

	/* show AtD will have nothing to do with these pages */
	if (aurl == 'http://acid3.acidtests.org' || aurl == 'https://chrome.google.com' || aurl == 'https://spreadsheets.google.com' || aurl == 'http://spreadsheets.google.com') {
		chrome.pageAction.hide(tabId);
		enabled = false;
	}
}

function refreshTabs() {
	chrome.windows.getAll({ populate: true }, function(windows) {
		for (var x = 0; x < windows.length; x++) {
			var window = windows[x];
			for (var y = 0; y < window.tabs.length; y++) {
				checkTab(window.tabs[y].id, window.tabs[y].url);
			}
		}
	});
}

/* setup code to show whether AtD is enabled/disabled on the current site */
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
	if (changeInfo.url) {
		checkTab(tabId, changeInfo.url, true);
	}
	else {
		chrome.tabs.get(tabId, function(t) {
			checkTab(tabId, t.url, true);
		});
	}
});

/* chrome message passing listener */
chrome.extension.onRequest.addListener(function(request, sender, callback) {
	if (request.command == 'options') {
		callback({ auto: localStorage['auto'], 
			   options: localStorage['options'], 
			   sites: localStorage['sites'],
			   phrases: localStorage['phrases'],
			   shortcut: localStorage['shortcut'] });
		return;
	} 
	else if (request.command == 'alert') {
		if (localStorage['message'] == 'true') {
			alert(request.text);
		}
		return;
	}
	else if (request.command == 'refreshTabs') {
		refreshTabs();	
		return;		
	}
	else if (request.command == 'ignore') {
		var strings = localStorage['phrases'].split(/,\s*/);
		strings.push(request.word);
		localStorage['phrases'] = strings.join(', ');
		return;
	}
	else if (request.command == 'open') {
		var left = (screen.width / 2) - (480 / 2);
		var top = (screen.height / 2) - (380 / 2);
		window.open( request.url, '', 'width=480,height=440,toolbar=0,status=0,resizable=0,location=0,menuBar=0,left=' + left + ',top=' + top).focus();
		return;
	}

	var xhr = new XMLHttpRequest();

	if (!xhr)
		return null;

	/* handle language option */
	var language = localStorage['language'];
	if (language == 'French')
		request.url = 'https://fr.service.afterthedeadline.com' + request.url;
	else if (language == 'German')
		request.url = 'https://de.service.afterthedeadline.com' + request.url;
	else if (language == 'Portuguese')
		request.url = 'https://pt.service.afterthedeadline.com' + request.url;
	else if (language == 'Spanish')
		request.url = 'https://es.service.afterthedeadline.com' + request.url;
	else
		request.url = 'https://en.service.afterthedeadline.com' + request.url;

	xhr.open('POST', request.url, true );
                
	xhr.onreadystatechange = function() {
		if ( xhr.readyState == 4 ) {
			callback( xhr.responseText );
		}
	};

	if (localStorage['user-key'] == undefined)
		localStorage['user-key'] = 'atd-chrome-' + (new Date()).getTime();

	if (request.data.length)
		request.data = encodeURI(request.data).replace(/&/g, '%26');
                        
	if (request.data.length)
		request.data +=  '&key=' + localStorage['user-key'];
	else
		request.data = 'key=' + localStorage['user-key'];

	/* language guessing option */
	if (localStorage['guess'] == 'true')
		request.data += '&guess=true';

	xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	xhr.send("data=" + request.data);
});

/* if we have any tabs, lets set their icon to the right thing, right now */
refreshTabs();
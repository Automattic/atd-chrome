var AtD_proofreaders = [];
var AtD_shortcut, AtD_auto;

jQuery.fn.addProofreader = function(options) {
	this.id = 0;

	var parent = this;
	var opts = jQuery.extend({}, {}, options);
	var ids = {};

	return this.each(function() {
		$this = jQuery(this);

		if ($this.data('AtD') == true || $this.css('display') == 'none')
			return;

		var proofreader = undefined;
		if ($this.context.tagName == 'DIV' && AtD_DIV_isExempt($this) == false) {
			proofreader = AtD_DIV_Proofreader($this);
		}
		else if ($this.context.tagName == 'IFRAME' && AtD_IFRAME_isExempt($this) == false) {
			proofreader = AtD_IFRAME_Proofreader($this);
		}
		else if ($this.context.tagName == 'TEXTAREA' && AtD_TEXTAREA_isExempt($this) == false) {
			proofreader = new AtD_Proofreader($this);
		}

		if (proofreader != undefined) {
			proofreader.attach($this);
			AtD_proofreaders.push(proofreader);

			/* attach a submit listener to the parent form */
			$this.parents('form').submit(function(event) {
				proofreader.restore();
			});
		}
	});
};

var last = new Date().getTime();
function doItLater(thefunction) {
	window.setTimeout(function() {
		var now = new Date().getTime();
		if ((now - last) >= 1000) {
			thefunction();
			last = now;
		}
	}, 1000);
};

function AtD_handler(event) {
	doItLater(function() {
		jQuery('textarea').addProofreader();
		jQuery('div').addProofreader();
		jQuery('iframe').addProofreader();

		for (var x = 0; x < AtD_proofreaders.length; x++) {
			if (AtD_proofreaders[x].getWidget() != undefined)
				AtD_proofreaders[x].getWidget().adjustWidget();
		}
	});
};

function toAtDHost(url) {
	var host = new RegExp('(https{0,1}://.*?)/.*').exec(url);
	if (host == null)
		host = url;
	else
		host = host[1];
	return host;
}

function AtD_start() {
	chrome.extension.sendRequest({ command: 'options' }, function(o) {
		var enabled = true;

		/* check if this is an ignored site... if it is, return */
		if (document.location) {
			var current = toAtDHost(document.location.href);
			var sites = o['sites'].split(/,\s+/);
			for (var x = 0; x < sites.length; x++) {
				if (sites[x] != '' && current == sites[x])
					enabled = false;
			}

			if (current == 'http://acid3.acidtests.org' || current == 'https://chrome.google.com' || current == 'https://spreadsheets.google.com' || current == 'http://spreadsheets.google.com')
				enabled = false;
		}

		AtD_shortcut  = o.shortcut.split(/,/);
		AtD_autoproof = o.auto == 'true' ? true : false;

		if (enabled)
			AtD_enable();
		else
			AtD_disable();
	});
}

function AtD_disable() {
	jQuery(document).unbind('DOMNodeInserted', AtD_handler);
	jQuery(document).unbind('DOMSubtreeModified', AtD_handler);
	jQuery('input[type="submit"], input[type="image"], button[type="submit"]').die('click', AtD_form_handler);

	/* make sure the AtD shortcut responds to nothing */
	AtD_shortcut = [false, false, false, false, false];
	AtD_autoproof = false;

	/* kill the proofreaders, eh :) */
	for (var x = 0; x < AtD_proofreaders.length; x++) {
		AtD_proofreaders[x].detach();
	}

	AtD_proofreaders = [];
}

function AtD_enable() {
	jQuery('textarea').addProofreader();
	jQuery('div').addProofreader();
	jQuery('iframe').addProofreader();

	jQuery('input[type="submit"], input[type="image"], button[type="submit"]').live('click', AtD_form_handler);

	jQuery(document).bind('DOMNodeInserted', AtD_handler);
	jQuery(document).bind('DOMSubtreeModified', AtD_handler);

	jQuery('body').append("<LINK REL='stylesheet' type='text/css' media='screen' href='" + chrome.extension.getURL('css/atd.css') + "' />");
}

chrome.extension.onRequest.addListener(function(command) {
	AtD_start();
});

/* delay loading AtD on to a new page, some sites (e.g., gmail) mess up randomly if this happens too quickly */
var AtD_load_wait;
if (window.document != null && window.document.location != null && window.document.location.host == 'mail.google.com')
	AtD_load_wait = 2000;
else
	AtD_load_wait = 250;

window.setTimeout(function() {
	AtD_start();
}, AtD_load_wait);


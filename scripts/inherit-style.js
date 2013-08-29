/* This script inherits styles from an iframe onto the AtD content div. It has to execute
   directly on the page because Chrome's dual-DOM implementation makes accessing this 
   information in an iframe impossible.

   1. document.defaultView is null from a content script's perspective
   2. can't execute content scripts on dynamically generated iframes with an empty src="" tag
*/

function ATD_SCROLL_ADJUST__() {
	/* find the iframe we want to inherit properties from */
	var findIframe = function() {
		var frames = document.getElementsByTagName('iframe');
		for (var x = 0; x < frames.length; x++) {
			if (frames[x].getAttribute('AtD_scroll') != '') {
				return frames[x];
			}
		}
		return undefined;
	};

	var adjustScroll = function(frame) {
		/* record the scroll value */
		var scrollValue = frame.getAttribute('AtD_scroll');

		/* set it based on whatever mechanism it needs to be set through */
		if (frame.contentWindow && frame.contentWindow.scrollbars != undefined && frame.contentWindow.scrollbars.visible) {
			frame.contentWindow.scroll(frame.contentWindow.scrollX, scrollValue);
		}
		else {
			frame.contentDocument.documentElement.scrollTop = scrollValue;
		}
	};

	var frame = findIframe();
	if (frame != undefined)
		adjustScroll(frame);
};

function ATD_INHERIT__() {
	/* find the iframe we want to inherit properties from */
	var findIframe = function() {
		var frames = document.getElementsByTagName('iframe');
		for (var x = 0; x < frames.length; x++) {
			if (frames[x].getAttribute('AtD_active') == 'true') {
				return frames[x];
			}
		}
		return undefined;
	};

	/* copy properties to another element */
	var copyProperties = function(properties, target) {
		for (var i = 0; i < properties.length; i++) {
			var property = properties.item(i);
			if (property != 'display' && property != '-webkit-user-modify' && property != 'overflow' && property != 'spellcheck')
				target.style.setProperty(property, properties.getPropertyValue(property), properties.getPropertyPriority(property));
		}
	};

	/* this function sets everything up */
	var inheritProperties = function(frame) {
		var _body = document.getElementById("AtD_Content");
		var _html = _body.parentNode;
		var _top  = _html.parentNode;

		/* do the document element */
		var css = frame.contentWindow.document.defaultView.getComputedStyle(frame.contentWindow.document.documentElement, null);
		copyProperties(css, _html);

		/* do the body element */
		css = frame.contentWindow.document.defaultView.getComputedStyle(frame.contentWindow.document.body, null);
		copyProperties(css, _body);
		
		/* make sure highlighted errors on last line always show (regardless of overflow: hidden) */             
		if (css.getPropertyValue('padding-bottom') == '0px' || css.getPropertyValue('padding-bottom') == 0 || css.getPropertyValue('padding-bottom') == '')
			_body.style.setProperty('padding-bottom', '2px', '');

		/* margin-left and margin-right should default to auto, not 0 -- fixes Google Docs not centering content in fixed-width view */
		if (frame.contentWindow.document.body.style.getPropertyValue("margin-left") == "" || frame.contentWindow.document.body.style.getPropertyValue("margin-left") == "auto")
			_body.style.setProperty("margin-left", "auto", "");

		if (frame.contentWindow.document.body.style.getPropertyValue("margin-right") == "" || frame.contentWindow.document.body.style.getPropertyValue("margin-right") == "auto")
			_body.style.setProperty("margin-right", "auto", "");

		/* ok, now let's inherit properties from the IFRAME itself */
		css = frame.ownerDocument.defaultView.getComputedStyle(frame, null);
		copyProperties(css, _top);

		var display = css.getPropertyValue('display');

		// make sure scrollbars show up only in the fake iframe
		_top.style.setProperty('overflow-y', 'auto', '');
		_top.style.setProperty('overflow-x', 'hidden', '');

		_body.style.setProperty('overflow-x', 'hidden', '');
		_body.style.setProperty('overflow-y', 'hidden', '');

		_html.style.setProperty('overflow-x', 'hidden', '');
		_html.style.setProperty('overflow-y', 'hidden', '');

		// do some scrollbar adjustments
		_body.style.removeProperty('height');
		_html.style.removeProperty('height');

		/* some other miscellaneous properties */
		_top.style.setProperty('overflow', 'auto', "");
		_top.style.setProperty('white-space', 'pre-wrap', "");
		_top.style.setProperty('margin-left', 'auto', "");
		_top.style.setProperty('margin-right', 'auto', "");

		_body.setAttribute('contenteditable', 'true');
		_body.setAttribute('spellcheck', false); /* ours is better */

		/* record the scroll value */
		var scrollValue;
		if (frame.contentWindow && frame.contentWindow.scrollbars != undefined && frame.contentWindow.scrollbars.visible) {
			scrollValue = frame.contentWindow.scrollY + 0;
		}
		else {
			scrollValue = frame.contentDocument.documentElement.scrollTop + 0;
		}
		
		/* do the actual swapping now */
		frame.style.setProperty('display', 'none', "");
		_top.style.setProperty('display', display == 'inline' ? 'inline-block' : display,'');

		/* match the proofreader scroll value to the frame value */
		_top.scrollTop = scrollValue;
	};

	var frame = findIframe();
	if (frame != undefined)
		inheritProperties(frame);
};
ATD_INHERIT__();

function AtD_IFRAME_isExempt(nodez) {
        if (typeof CKEditor !== 'undefined')
                return true;

	var node = nodez.context;

	/* disable on draft.blogger.com WYSIWYG editor--too buggy */
	if (node.id == 'postingComposeBox') 
		return true;

        if (node.contentDocument == undefined || node.contentDocument.body == undefined)
                return true;

        if (node.contentDocument.designMode == 'on' || node.contentDocument.body.designMode == 'on')
                return false;

        if (node.contentDocument.body.contentEditable == 'true')
                return false;

        /* hack to make editor work with Yahoo Mail immediately */
        if (/compArea/.test(node.id))
                return false;

	return true;
};

function AtD_IFRAME_Proofreader(container) {
	var AtD            = new AtD_Proofreader(container);

	AtD.setValue = function(component, value) {
		return component.context.contentDocument.body.innerHTML = value;
	};

	AtD.getValue = function(component) {
		return component.context.contentDocument.body.innerHTML.replace(/\&nbsp\;/g, ' ');
	};

	AtD.getCheckValue = function(component) {
		return component.context.contentDocument.body.innerHTML.replace(/\&nbsp\;/g, ' ').replace(/\&lt\;/g, '<').replace(/\&gt\;/g, '>').replace(/\&amp\;/g, '&');
	}

	/* changing/setting scroll position is handled by the injected HTML */
	AtD.getScrollPosition = function() {
		/* update the relevant iframe with an */
		if (AtD.isProofreading()) {
			AtD.getOriginal().attr('AtD_scroll', AtD.getActiveComponent().scrollTop());
		}
	};

	AtD.setScrollPosition = function(value) {
		/* changing the proofreading mode from proofreader -> editor */
		if (!AtD.isProofreading()) {
			jQuery('body').append("<SCRIPT>ATD_SCROLL_ADJUST__();</SCRIPT>");
		}
	};

	AtD.adjustWidget = function(offset) {
		if (AtD.isProofreading()) {
			offset.top += 4;
			offset.left += 3;
		}

		offset.top -= 1;
		offset.left -= 1;

		/* check if there is a scrollbar, if there is, adjust accordingly */
		if (AtD.getOriginal().attr('id') == 'wys_frame') {
			offset.left -= 15; /* this is a google docs hack, there is always a scrollbar */
		}
		else if (AtD.isProofreading()) {
			var target = AtD.getActiveComponent();
			target = target.context == undefined ? target[0] : target.context;

			if (target != undefined && target.scrollHeight > target.clientHeight)
				offset.left -= 15;
		}
		else {
			var target = AtD.getOriginal().context;
			if (target.contentDocument && target.contentDocument.documentElement && (target.contentDocument.documentElement.clientHeight > target.clientHeight))
				offset.left -= 15;
		}
	};

	AtD.showProofreader = function(component, proofreader) {
		component.attr('AtD_active', 'true');
		AtD.displayValue = component.css('display');

		proofreader.css('display', 'none');
		component.after(proofreader);

		jQuery('body').append("<SCRIPT>if (typeof ATD_INHERIT__ == 'undefined') { (function(l) { var res = document.createElement('SCRIPT'); res.type = 'text/javascript'; res.src = l; document.getElementsByTagName('head')[0].appendChild(res); })('"+ chrome.extension.getURL('scripts/inherit-style.js') +"'); } else { ATD_INHERIT__(); }</SCRIPT>");
	};

	AtD.createProofreader = function(contents) {
		return jQuery('<div><div><div id="AtD_Content">' + contents + '</div></div></div>');
	};

	AtD.inheritLookAndFeel = function(component, proofreader) {
		/* load a script to go in like special forces and update some styles */
		return proofreader;
	}

	return AtD;
};


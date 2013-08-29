function AtD_DIV_isExempt(node) {
	if (node.attr('contentEditable') != 'true' && node.attr('contenteditable') != 'true')
		return true;

        /* disable on small editable divs */
        if (node.height() < 24)
		return true;

	/* exclude GMail task list */
	if (node.attr('class') == 'EY')
		return true;

	if (node.attr('id') == 'AtD_Content')
		return true;

	/* webkit likes to use divs for new paragraphs, verify this isn't one of those */
	if (node.closest('#AtD_Content').attr('id') == 'AtD_Content')
		return true;

	return false;
};

function AtD_DIV_Proofreader(container) {
	var AtD            = new AtD_Proofreader(container);

	AtD.setValue = function(component, value) {
		component.html( value );
	};

	AtD.getCheckValue = function(component) {
		return component.html().replace(/\&lt\;/g, '<').replace(/\&gt\;/g, '>').replace(/\&amp\;/g, '&');
	}

	AtD.getValue = function(component) {
		return component.html();
	};

	AtD.adjustWidget = function(offset) {
		if (AtD.isProofreading()) {
			offset.top += 6;
			offset.left += 5;
		}
		else {
			offset.top += 2;
			offset.left += 2;
		}

		/* check if our div has a scrollbar or not */
		var target = AtD.getActiveComponent();
		target = target.context == undefined ? target[0] : target.context;

		if (target != undefined && target.scrollHeight > target.clientHeight)
			offset.left -= 15;
	};

	return AtD;
};


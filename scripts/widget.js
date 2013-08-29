function AtD_Widget(component, parent) {
	var widget = jQuery('<div class="afterthedeadline-button">&nbsp;</div>');
	var _mode  = "edit";
	var my     = this;

	/* attach the widget to the specified component */
	component.before(widget);

	/* attach listeners to make the widget pretty when it's supposed to be */
	var showButton = function(event) {
		widget.attr('class', widget.attr('class') + ' afterthedeadline-hover');
	};

	var hideButton = function(event) {
		widget.attr('class', widget.attr('class').replace(/(\s+|\b)afterthedeadline-hover(\s+|\b)/, '$1$2'));
	};

	component.focusin(showButton);
	component.focusout(hideButton);
	component.mouseover(showButton);
	component.mouseout(hideButton);

	this.mode = function(m) {
		_mode = m;

		if (m == 'edit')
			widget.attr('class', 'afterthedeadline-button');
		else
			widget.attr('class', 'afterthedeadline-button afterthedeadline-done');
	}

	this.getWidget = function() {
		return widget;
	};

	var lastAdjust = 0;
	this.adjustWidget = function(event) {
		if (!parent.isProofreading() && (component.css('display') == 'none' || component.css('visibility') == 'hidden') && !parent.transition) {
			parent.detach();
			return;
		};

		var check = new Date().getTime() - lastAdjust;
		if (check > 200) {
			var target  = parent.getActiveComponent();
			var targetj = jQuery(target);

			var offset = targetj.offset();
			offset.left += target.outerWidth(true) - widget.width();
			offset.top += target.outerHeight(true) - widget.height();

			/* set the offset to deal with scrollbars properly */
			parent.adjustWidget(offset);

			if (targetj.css('z-index') != '0')
				widget.css('z-index', parseInt(targetj.css('z-index'), 10) + 1);
			else
				widget.css('z-index', 0);

			widget.offset(offset);
			lastAdjust += check;
		}
	};

	/* when an attribute related to the textarea is modified... adjust the widget's positioning */
	jQuery(component).bind('DOMAttrModified', this.adjustWidget);
	jQuery(component).mouseover(this.adjustWidget);
	jQuery(component).focusin(this.adjustWidget);
	jQuery(component).focusout(this.adjustWidget);
	jQuery(component).resize(this.adjustWidget);

	/* check if the element is already focused, if it is--make button reflect it */
	if (document.activeElement == component[0] && document.activeElement == component.context)
		showButton();

	return this;
}

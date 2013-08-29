function AtD_TEXTAREA_isExempt(node) {
	if (node.width() == 0 || node.height() == 0)
		return true;

        // exempt hotmail to/cc/bcc fields
        if (/.*?\$[iI]nputBox/.test( node.attr('id') ))
                return true;

        // exempt the facebook status textarea, only the status textarea
        if (/UIComposer_TextArea\s/.test(node.attr('class')) && !/DOMControl_autogrow/.test(node.attr('class'))) {
                return true;
        }

        // exempt paypal checkout seller-notes area
        if (node.attr('id') == 'seller-notes')
                return true;

		/* exclude Yahoo Mail's fields */
		if (/compHeaderField/.test(node.attr('class')))
				return true;

        // exempt cPanel code editor
        if (node.attr('id') == 'codewindow')
                return true;

		if (node.css('display') == 'none')
				return true;

        // exempt gmail's contact fields
        if (node.context != null && node.context.ownerDocument != null && node.context.ownerDocument.location.host == 'mail.google.com' && node.context.parentNode.nodeName == 'TD')
                return true;

	return false;
};

function AtD_Proofreader(container) {
	var AtD            = new AtD_Basic();
	var isProofreading = false;
	var proofreader    = undefined;
	var original       = undefined;
	var widget         = undefined;
	AtD.displayValue   = undefined;
	AtD.transition     = false;
	AtD.position       = 0;
	var parent         = this;
	var hasBeenChecked = false;

	AtD.hasBeenChecked = function() {
		return hasBeenChecked;
	};

	AtD.getOriginal = function() {
		return original;
	};

	AtD.getWidget = function() {
		return widget;
	};

	AtD.adjustWidget = function(offset) {
		if (AtD.isProofreading()) {
			offset.top += 4;
			offset.left += 3;
		}

		offset.top -= 6;
		offset.left -= 6;

		/* detect scrollbars and adjust proofreader position based on it */
		var target = AtD.getActiveComponent();
		target = target.context == undefined ? target[0] : target.context;

		if (target != undefined && target.scrollHeight > target.clientHeight)
			offset.left -= 15;

		/* hack for WordPress comment quick edit which has a bar over the bottom */
		if (original.attr('id') == 'replycontent')
			offset.top -= 15;
	};

	AtD.resizeHandler = function() {
		if (AtD.transition)
			return;

		if (AtD.isProofreading())
			AtD.restore();
		else
			AtD.getWidget().adjustWidget();
	};

	/* returns the current active component */
	AtD.getActiveComponent = function() {
		if (isProofreading)
			return proofreader;
		else
			return original;
	};

	/* get/set scrollbar position */
	AtD.getScrollPosition = function() {
		return AtD.getActiveComponent().scrollTop();
	};

	AtD.setScrollPosition = function(value) {
		AtD.getActiveComponent().scrollTop(value);
	};

	var lastSync = 0;
	/* called to sync the original editor with the updated contents */
	AtD.sync = function() {
		if (AtD.isProofreading) {
			lastSync = new Date().getTime();
			window.setTimeout(function() {
				var current = new Date().getTime() - lastSync;
				if (current >= 1750 && AtD.isProofreading && !AtD.transition) {
					lastSync += current;
					var clone = jQuery(proofreader.parent().find('#AtD_Content').html());
					AtD._removeWords(clone, null);
					var content = clone.html();
					if (content != null)
						AtD.setValue(original, content);
					lastSync = new Date().getTime();
				}
			}, 1750);
		}
	};

	/* convienence method to restore the text area from the preview div */
	AtD.restore = function() {
		var options = AtD.properties;

		/* check if we're in the proofreading mode, if not... then return */
		if (!isProofreading)
			return;

		AtD.transition = true;

		/* get the current position, do it before isProofreading changes. */
		AtD.position = AtD.getScrollPosition();

		/* no longer in proofreading mode */
		isProofreading = false;

		/* swap the preview div for the textarea, notice how I have to restore the appropriate class/id/style attributes */

		AtD.remove(proofreader); /* strip out the AtD markup please */
		var content = proofreader.parent().find('#AtD_Content').html();

		AtD.setValue(original, content);

		/* clear the error HTML out of the preview div */
		proofreader.remove();

		original.css('display', AtD.displayValue);
		original.attr('AtD_active', null);

		/* update the scrollbar position based on the saved position */
		AtD.setScrollPosition(AtD.position);

		/* change the link text back to its original label */
		widget.mode("edit");

        AtD.transition = false;

		widget.adjustWidget();
	};

	/* other proofreader components can override these things */
	AtD.setValue = function(component, value) {
		if (value == null)
			component.val("");
		else
			component.val( value.replace(/\&lt\;/g, '<').replace(/\&gt\;/g, '>').replace(/\&amp\;/g, '&') );
	};

	AtD.getCheckValue = function(component) {
		return component.val();
	}

	AtD.getValue = function(component) {
		return component.val().replace(/\&/g, '&amp;').replace(/\>/g, '&gt;').replace(/\</g, '&lt;');
	};

	AtD.isProofreading = function() {
		return isProofreading;
	};

	AtD.bindShortcut = function(component) {
		component.bind('keydown', function(e) {
			if (e.ctrlKey && e.metaKey)
				e.metaKey = false;

			if (AtD_shortcut[0] == 'true' && !e.shiftKey)
				return;

			if (AtD_shortcut[1] == 'true' && !e.altKey)
				return;

			if (AtD_shortcut[2] == 'true' && !e.ctrlKey)
				return;

			if (AtD_shortcut[3] == 'true' && !e.metaKey)
				return;

			if (AtD_shortcut[4] != e.which)
				return;

			if (AtD.isProofreading()) {
				AtD.restore();
				original.focus();
			}
			else {
				AtD.checkComponent(component);
			}
			e.stopPropagation();
			e.preventDefault();
		});
	};

	AtD.detach = function() {
		if (isProofreading)
			AtD.restore();

		widget.getWidget().remove();
		original.unbind('keyup');
		original.data('AtD', false);
		original.context.ownerDocument.defaultView.removeEventListener('resize', AtD.resizeHandler);
	};

	AtD.attach = function(component) {
		component.data("AtD", true);
		original = component;

		/* attach widget */
		widget = new AtD_Widget(component, this);
		widget.getWidget().click(function(event) {
			AtD.checkComponent(component);
		});

		widget.adjustWidget();

		/* reset proofread mode when component is resized */
		component.context.ownerDocument.defaultView.addEventListener('resize', AtD.resizeHandler, true);

		/* add a keyboard shortcut handler */
		AtD.bindShortcut(component);
	};

	AtD.createProofreader = function(contents) {
		return jQuery('<div id="AtD_Content">' + contents + '</div>' );
	};

	AtD.showProofreader = function(component, proofreader) {
		AtD.displayValue = component.css('display');
		component.css('display', 'none');
		component.attr('AtD_active', 'true');
		component.after(proofreader);

		/* textareas that are inline should be replaced by an inline-block div */
		if (AtD.displayValue == 'inline')
			proofreader.css('display', 'inline-block');
		else
			proofreader.css('display', AtD.displayValue);


		/* update the scrollbar position based on the saved position */
		AtD.setScrollPosition(AtD.position);
	};

	AtD.inheritLookAndFeel = function(component, proofreader) {
		var css = component.context.ownerDocument.defaultView.getComputedStyle(component.context, null);

		for (var i = 0; i < css.length; i++) {
			var property = css.item(i);
			proofreader.css(property, css.getPropertyValue(property));
		}

		proofreader.css( { 'overflow' : 'auto', 'white-space' : 'pre-wrap' } );
		proofreader.attr('spellcheck', false); /* ours is better */
		proofreader.css('-webkit-user-modify', 'read-write-plaintext-only');

		return proofreader;
	}

	AtD.checkSilent = function(callback) {
		/* create a proofreader */
       	var div = jQuery('<div>' + AtD.getValue(container) + '</div>');
		div.data('AtD', true);

		/* check the writing in the textarea */
		AtD.check(div, AtD.getCheckValue(container), {
			ready: function(errorCount) {
				hasBeenChecked = true;
				AtD.hasErrors = errorCount > 0;
				callback(errorCount);
			},

			error: function(reason) {
				AtD.hasErrors = false;
				callback(0);
			}
		});
	};

	AtD.checkComponent = function() {
		/* If the text of the link says edit comment, then restore the textarea so the user can edit the text */
		if (isProofreading) {
			AtD.restore();
		}
		else {
			AtD.position = AtD.getScrollPosition();

			/* we're now proofreading */
			isProofreading = true;

			widget.mode("proofread");

			/* disable the spell check link while an asynchronous call is in progress. if a user tries to make a request while one is in progress
			   they will lose their text. Not cool! */
			var disableClick = function() { return false; };
			widget.getWidget().click(disableClick);

			/* create a proofreader */
       		var div = AtD.createProofreader(AtD.getValue(container));
			div.data('AtD', true);
			proofreader = AtD.inheritLookAndFeel(container, div);

			/* hide the original container and insert the proofreader */
			original = container;
			AtD.showProofreader(container, div);

			/* block the enter key in proofreading mode */
			div.keypress(function (event) {
				return event.keyCode != 13;
			});

			/* tell the editor to sync as you type */
			div.keyup(function (event) {
				AtD.sync();
			});

			/* bind the restore shortcut */
			AtD.bindShortcut(div);

			/* tell the widget to adjust */
			widget.adjustWidget();

			/* check the writing in the textarea */
			AtD.check(div.parent().find('#AtD_Content'), AtD.getCheckValue(container), {
				ready: function(errorCount) {
					/* this function is called when the AtD async service request has finished.
					   this is a good time to allow the user to click the spell check/edit text link again. */
					widget.getWidget().unbind('click', disableClick);
					hasBeenChecked = true;
				},

				explain: function(url) {
					chrome.extension.sendRequest({ command: "open", url: url });
				},

				success: function(errorCount) {
					if (errorCount == 0)
						chrome.extension.sendRequest({ command: "alert", text: AtD.getLang('message_no_errors_found', "No writing errors were found") } );

					/* once all errors are resolved, this function is called, it's an opportune time
					   to restore the textarea */
					AtD.restore();
				},

				error: function(reason) {
					widget.getWidget().unbind('click', disableClick);

					if (reason == undefined)
						alert( AtD.getLang('message_server_error_short', "There was an error communicating with the spell checking service.") );
					else
						alert( AtD.getLang('message_server_error_short', "There was an error communicating with the spell checking service.") + "\n\n" + reason );

					/* restore the text area since there won't be any highlighted spelling errors */
					AtD.restore();
				},

				ignore : function(element) {
					chrome.extension.sendRequest({ command: 'ignore', word: element });
				},

				editSelection : function(element) {
					var text = prompt( AtD.getLang('dialog_replace_selection', "Replace selection with:"), element.text() );
					if (text != null) {
						jQuery(element).html( text );
						AtD.core.removeParent(element);
					}
				}
			});
		}
	}
	return AtD;
}


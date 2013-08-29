/*
 * atd.core.js - A building block to create a front-end for AtD (from http://github.com/Automattic/atd-core, incorporated here).
 * Author      : Raphael Mudge
 * License     : LGPL
 * Project     : http://open.afterthedeadline.com
 * Discuss     : https://groups.google.com/forum/#!forum/atd-developers
 *
 * Derived from:
 *
 * jquery.spellchecker.js - a simple jQuery Spell Checker
 * Copyright (c) 2008 Richard Willis
 * MIT license  : http://www.opensource.org/licenses/mit-license.php
 * Project      : http://jquery-spellchecker.googlecode.com
 * Contact      : willis.rh@gmail.com
 */

function AtD_Basic() {
	this.rpc = ''; /* see the proxy.php that came with the AtD/TinyMCE plugin */
	this.api_key = '';
	this.i18n = {};
	this.listener = {};

	/* callbacks */

	var parent = this;
	this.clickListener = function(event) {
		if (parent.core.isMarkedNode(event.target))
			parent.suggest(event.target);
	};

	this.ignoreSuggestion = function(e) {
		parent.core.removeParent(parent.errorElement);

		parent.counter --;
		if (parent.counter == 0 && parent.callback_f != undefined && parent.callback_f.success != undefined)
			parent.callback_f.success(parent.count);
	};

	this.explainError = function(e) {
		if (parent.callback_f != undefined && parent.callback_f.explain != undefined)
			parent.callback_f.explain(parent.explainURL);
	};



	this.core = (function() {
		var core = new AtDCore();

		core.hasClass = function(node, className) {
			return jQuery(node).hasClass(className);
		};

		core.map = jQuery.map;

		core.contents = function(node) {
			return jQuery(node).contents();
		};

		core.replaceWith = function(old_node, new_node) {
			return jQuery(old_node).replaceWith(new_node);
		};

		core.findSpans = function(parent) {
        		return jQuery.makeArray(parent.find('span'));
		};

		/* taken from AtD/Firefox, thanks Mitcho */
		core.create = function(string) {
			// replace out all tags with &-equivalents so that we preserve tag text.
			string = string.replace(/\&/g,'&amp;');
			string = string.replace(/\</g,'&lt;').replace(/\>/g,'&gt;');

			// find all instances of AtD-created spans
			var matches = string.match(/\&lt\;span class=\"hidden\w+?\" pre="[^"]*"\&gt\;.*?\&lt\;\/span\&gt\;/g);

			// ... and fix the tags in those substrings.
			if (matches) {
				matches.forEach(function(match) {
					string = string.replace(match,match.replace(/\&lt\;/g, '<').replace(/\&gt\;/g, '>'));
				},this);
			}

			var node = jQuery('<span class="mceItemHidden" spellcheck="false"></span>');
			node.html(string);
			return node;
		};

		core.remove = function(node) {
			return jQuery(node).remove();
		};

		core.removeParent = function(node) {
			/* unwrap exists in jQuery 1.4+ only. Thankfully because replaceWith as-used here won't work in 1.4 */
			if (jQuery(node).unwrap)
				return jQuery(node).contents().unwrap();
			else
				return jQuery(node).replaceWith(jQuery(node).html());
		};

		core.getAttrib = function(node, name) {
			return jQuery(node).attr(name);
		};

		return core;
	})();

	this.check = function(container, source, callback_f) {
		chrome.extension.sendRequest({ command: 'options' }, function(o) {
			parent.setIgnoreStrings(o.phrases);
			parent.showTypes(o.options);
			parent._check(container, source, callback_f);
		});
	};

	/* redefine the communication channel */
	this._check = function(container, source, callback_f) {
		parent.callback_f = callback_f; /* remember the callback for later */
		parent.remove(container);

		var text     = jQuery.trim(source);

		chrome.extension.sendRequest({ data: text, url: '/checkDocument' }, function(response) {
			var xml = (new DOMParser()).parseFromString(response, 'text/xml');

			/* check for and display error messages from the server */
			if (parent.core.hasErrorMessage(xml)) {
				if (parent.callback_f != undefined && parent.callback_f.error != undefined)
					parent.callback_f.error(parent.core.getErrorMessage(xml));

				return;
			}

			/* highlight the errors */

			parent.container = container;

			var count = parent.processXML(container, xml);

			if (parent.callback_f != undefined && parent.callback_f.ready != undefined)
				parent.callback_f.ready(count);

			if (count == 0 && parent.callback_f != undefined && parent.callback_f.success != undefined)
				parent.callback_f.success(count);

			parent.counter = count;
			parent.count   = count;
		});
	};
}

AtD_Basic.prototype.getLang = function(key, defaultk) {
	if (this.i18n[key] == undefined)
		return defaultk;

	return this.i18n[key];
};

AtD_Basic.prototype.addI18n = function(localizations) {
	this.i18n = localizations;
	this.core.addI18n(localizations);
};

AtD_Basic.prototype.setIgnoreStrings = function(string) {
	this.core.setIgnoreStrings(string);
};

AtD_Basic.prototype.showTypes = function(string) {
	this.core.showTypes(string);
};

AtD_Basic.prototype.useSuggestion = function(word) {
	this.core.applySuggestion(this.errorElement, word);
	this.counter --;
	if (this.counter == 0 && this.callback_f != undefined && this.callback_f.success != undefined)
		this.callback_f.success(this.count);
	else
		this.sync();
};

AtD_Basic.prototype.remove = function(container) {
	/* destroy the menu when we remove the HTML */
	if (this.lastSuggest)
		this.lastSuggest.remove();
	this.lastSuggest = undefined;

	this._removeWords(container, null);
};

AtD_Basic.prototype.processXML = function(container, responseXML) {

	var results = this.core.processXML(responseXML);

	if (results.count > 0)
		results.count = this.core.markMyWords(container.contents(), results.errors);

	container.unbind('click', this.clickListener);
	container.click(this.clickListener);

	return results.count;
};

AtD_Basic.prototype.editSelection = function() {
	var parent = this.errorElement.parent();

	if (this.callback_f != undefined && this.callback_f.editSelection != undefined)
		this.callback_f.editSelection(this.errorElement);

	if (this.errorElement.parent() != parent) {
		this.counter --;
		if (this.counter == 0 && this.callback_f != undefined && this.callback_f.success != undefined)
			this.callback_f.success(this.count);
	}
};

AtD_Basic.prototype.ignoreAll = function(container) {
	var target = this.errorElement.text();
	var removed = this._removeWords(container, target);

	this.counter -= removed;

	if (this.counter == 0 && this.callback_f != undefined && this.callback_f.success != undefined)
		this.callback_f.success(this.count);

	if (this.callback_f != undefined && this.callback_f.ignore != undefined) {
		this.callback_f.ignore(target);
		this.core.setIgnoreStrings(target);
	}
};

AtD_Basic.prototype.suggest = function(element) {
	var parent = this;

	/* construct the menu if it doesn't already exist */

	var suggest = jQuery('<div class="suggestmenu"></div>');
	suggest.prependTo('body');

	/* make sure there is only one menu at a time */

	if (parent.lastSuggest)
		parent.lastSuggest.remove();

	parent.lastSuggest = suggest;

	/* find the correct suggestions object */

	errorDescription = this.core.findSuggestion(element);

	/* build up the menu y0 */

	this.errorElement = jQuery(element);

	suggest.empty();

	if (errorDescription == undefined) {
		suggest.append('<strong>' + this.getLang('menu_title_no_suggestions', 'No suggestions') + '</strong>');
	}
	else if (errorDescription["suggestions"].length == 0) {
		suggest.append('<strong>' + errorDescription['description'] + '</strong>');
	}
	else {
		suggest.append('<strong>' + errorDescription['description'] + '</strong>');

		var parent = this;
		for (var i = 0; i < errorDescription["suggestions"].length; i++) {
			(function(sugg) {
				var node = jQuery('<div>' + sugg + '</div>');
				node.click(function(e) {
					parent.useSuggestion(sugg);
					suggest.remove();
					e.preventDefault();
					e.stopPropagation();
				});
				suggest.append(node);
			})(errorDescription["suggestions"][i]);
		}
	}

	/* do the explain menu if configured */

	if (this.callback_f != undefined && this.callback_f.explain != undefined && errorDescription['moreinfo'] != undefined) {
		var node = jQuery('<div class="spell_sep_top">' + this.getLang('menu_option_explain', 'Explain...') + '</div>');
		node.click(function(e) {
			parent.explainError();
			suggest.remove();
			e.preventDefault();
			e.stopPropagation();
		});
		suggest.append(node);
		this.explainURL = errorDescription['moreinfo'];
	}

	/* do the ignore option */

	var node = jQuery('<div class="spell_sep_top">' + this.getLang('menu_option_ignore_once', 'Ignore suggestion') + '</div>');
	node.click(function(e) {
		parent.ignoreSuggestion();
		suggest.remove();
		e.preventDefault();
		e.stopPropagation();
	});
	suggest.append(node);

	/* add the edit in place and ignore always option */

	if (this.callback_f != undefined && this.callback_f.editSelection != undefined) {

		if (this.callback_f != undefined && this.callback_f.ignore != undefined)
			node = jQuery('<div>' + this.getLang('menu_option_ignore_always', 'Ignore always') + '</div>');
		else
			node = jQuery('<div>' + this.getLang('menu_option_ignore_all', 'Ignore all') + '</div>');

		suggest.append(node);

		var node2 = jQuery('<div class="spell_sep_bottom spell_sep_top">' + this.getLang('menu_option_edit_selection', 'Edit Selection...') + '</div>');
		node2.click(function(e) {
			parent.editSelection(parent.container);
			suggest.remove();
			e.preventDefault();
			e.stopPropagation();
		});
		suggest.append(node2);
	}
	else {
		if (this.callback_f != undefined && this.callback_f.ignore != undefined)
			node = jQuery('<div class="spell_sep_bottom">' + this.getLang('menu_option_ignore_always', 'Ignore always') + '</div>');
		else
			node = jQuery('<div class="spell_sep_bottom">' + this.getLang('menu_option_ignore_all', 'Ignore all') + '</div>');
		suggest.append(node);
	}

	node.click(function(e) {
		parent.ignoreAll(parent.container);
		suggest.remove();
		e.preventDefault();
		e.stopPropagation();
	});

	/* show the menu */

	var pos = jQuery(element).offset();
	var width = jQuery(element).width();
	jQuery(suggest).css({ left: (pos.left + width) + 'px', top: pos.top + 'px' });

	jQuery(suggest).show();

	/* bind events to make the menu disappear when the user clicks outside of it */

	this.suggestShow = true;
	setTimeout(function() {
		jQuery("body").bind("click", function() {
			if (!parent.suggestShow)
				suggest.remove();
		});
	}, 1);

	setTimeout(function() {
		parent.suggestShow = false;
	}, 10);
};

AtD_Basic.prototype._removeWords = function(container, w) {
	return this.core.removeWords(container, w);
};

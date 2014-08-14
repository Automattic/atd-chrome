
jQuery(function() {
			/* check default values */
			jQuery.map(['options', 'sites', 'phrases', 'language', 'guess', 'shortcut', 'auto', 'button'], function(key) {
				if (localStorage[key] == undefined)
					localStorage[key] = '';
			});

			/* setup a listener for the keystroke */
			var displayKey = function(code) {
				var keys = code.split(/,/);
				var label = (keys[0] == 'true' ? 'shift-' : '')
					+ (keys[1] == 'true' ? 'alt-': '')
					+ (keys[2] == 'true' ? 'ctrl-' : '')
					+ (keys[3] == 'true' ? 'meta-' : '');

				if (keys[4] != 0)
					label += String.fromCharCode(keys[4]).toUpperCase();
				else
					label += String.fromCharCode(keys[5]).toUpperCase();

				return label;
			};

			$('#key').keydown(function(e) {
				/* surprise! it's a chrome/webkit bug, Ctrl+Key flags both of these to true for me */
				if (e.ctrlKey && e.metaKey)
					e.metaKey = false;

				/* these are the charCodes fired when I press Ctrl/Alt/Meta without another key */
				if (e.which == 16 || e.which == 17 || e.which == 18 || e.which == 91)
					return;

				if (e.shiftKey || e.altKey || e.ctrlKey || e.metaKey) {
					var code = [e.shiftKey, e.altKey, e.ctrlKey, e.metaKey, e.which, e.charCode].join(',');
					localStorage['shortcut'] = code;

					$('#key').val( displayKey(code) );
				}
				e.preventDefault();
				e.stopPropagation();
			});

			$('#key').val(displayKey( localStorage['shortcut'] ));

			/* setup a listener for auto-proofread changes */
			$('#auto').change(function(event) {
				localStorage['auto'] = $('#auto').attr('checked') != undefined;
				if (localStorage['auto'] == 'true')
					alert("After the Deadline will now check your spelling, style, and grammar before you submit a form.\n\nThis feature conflicts with a few sites that use JavaScript to prevent multiple form submits.\n\nIf you are unable to submit a form:\n\n1) disable this feature\n\nor\n\n2) click the AtD icon in the address bar and select 'Disable on this site'");
			});

			/* set the auto-proofread settings */
			$('#auto').attr('checked', localStorage['auto'] == 'true' ? true : false);

			/* setup a listener for the page action */
			$('#button').change(function(event) {
				localStorage['button'] = $('#button').attr('checked') != undefined;
				chrome.extension.sendRequest({ command: 'refreshTabs' });
			});

			/* set the page action setting */
			$('#button').attr('checked', localStorage['button'] == 'true' ? true : false);

			/* setup a listener for the warning dialog thing */
			$('#message').change(function(event) {
				localStorage['message'] = $('#message').attr('checked') != undefined;
			});

			/* set the page action setting */
			$('#message').attr('checked', localStorage['message'] == 'true' ? true : false);

			/* setup a listener to capture changes to the proofreader options */
			$('#proofreader li input').click(function(event) {
				var values = [];
				$('#proofreader li :checked').each(function() {
					values.push($(this).attr('name'));
				});
				localStorage['options'] = values.join(', ');
			});

			/* set the proofreader options to their initial value */
			$.map(localStorage['options'].split(/,\s+/), function(item) {
				$('#proofreader li input[name="'+item+'"]').attr('checked', true);
			});

			/* setup a listener to capture changes to the language settings */
			$('#language li select, #language li input').change(function(event) {
				localStorage['language'] = $('#language li select').val();
				localStorage['guess'] = $('#language li input').attr('checked');
			});

			/* set the language settings */
			$('#language li select').val(localStorage['language']);
			$('#language li input').attr('checked', localStorage['guess'] == 'true' ? true : false);

			/* utility functions to make it easier to deal with the add/remove preferences */
			var showItems = function(parent, items) {
				var element = parent.children().remove();
				items.sort();
				for ( var i = 0; i < items.length; i++ ) {
					if ( items[i].length > 0 )
						parent.append($('<li><span class="removeme">&nbsp;</span> ' + items[i] + '</li>'));
				}
			};

			var makeUnique = function(items) {
				var nw = [];
				var seen = {};
				for (var x = 0; x < items.length; x++) {
					var tmp = '__' + items[x].trim();
					if (seen[tmp] == undefined) {
						nw.push(items[x].trim());
						seen[tmp] = 1;
					}
				}
				return nw;
			};

			var removeItem = function(item, items) {
				var nw = [];
				var old = items;
				for (var x = 0; x < items.length; x++) {
					if (items[x] != item)
						nw.push(items[x]);
				}
				return nw;
			};

			var addItem = function(field, key, filter) {
				var values  = localStorage[key].split(/,\s*/);
				var phrases = $(field).val().trim().split(/,\s*/);
				for (var x = 0; x < phrases.length; x++) {
					if (filter != undefined)
						values.push(filter(phrases[x]));
					else
						values.push(phrases[x]);
				}
				$(field).val('');
				values = makeUnique(values);
				localStorage[key] = values.join(', ');
				showItems($('#' + key), values);
			};

      debugger;
			/* setup hooks for the ignored phrases */
			$('#phrases li .removeme').live('click', function(event) {
				localStorage['phrases'] = removeItem($(event.target).parent().text().trim(), localStorage['phrases'].split(/,\s*/)).join(', ');
				$(event.target).parent().remove();
			});

			$('#aphrase').click(function(event) {
				addItem('#phrase', 'phrases');
			});

			/* setup hooks for the ignored sites */
			$('#sites li .removeme').live('click', function(event) {
				localStorage['sites'] = removeItem($(event.target).parent().text().trim(), localStorage['sites'].split(/,\s*/)).join(', ');
				$(event.target).parent().remove();
				chrome.extension.sendRequest({ command: 'refreshTabs' });
			});

			$('#asite').click(function(event) {
				addItem('#site', 'sites', function(url) {
					if (!/https{0,1}:\/\/.*/.test(url))
						url = 'http://' + url;

					var host = new RegExp('(https{0,1}://.*?)/{1}.*').exec(url);
					if (host == null)
						host = url;
					else
						host = host[1];
					return host;
				});

				chrome.extension.sendRequest({ command: 'refreshTabs' });
			});

			/* init the ignored phrases and domains values */
			showItems($('#phrases'), makeUnique(localStorage['phrases'].split(/,\s*/)));
			showItems($('#sites'), makeUnique(localStorage['sites'].split(/,\s*/)));

			/* disable certain options for outdated versions of Chrome */
			if (chrome.pageAction['setPopup'] == undefined)
				$('.newonly').hide();
		});

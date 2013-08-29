### 1.2 - 20100721

*   Auto-proofread is now disabled by default
*   The auto-proofread option now warns users about bad things that could happen (the feature is pretty safe though).
*   AtD now refuses to attach to Google spreadsheets
*   Widget positioning now works with editors that have a z-index set.
*   Disabled AtD in WYSIWYG editor for http://drafts.blogger.com (couldn't get it to work right)
*   Added an option to disable "no writing errors were found" message box.
*   Added a load delay to GMail (should fix widget not showing up sometimes on GMail).

### 1.1 - 20100524

*   Fixed a typo on preferences page.
*   AtD toolbar button is now in the address bar, added an option to hide it
*   Removed auto-proofread feature from Chrome/Stable channel. Upgrade if you want it. A JavaScript
  function AtD relies on does not work as expected in Stable channel. This fixes the Facebook comment
  submit issue many of you reported.
*   AtD now loads CSS after page load and only when AtD is enabled on the current site.
*   Added a hack to prevent AtD from loading on Acid3 test page. Chrome w/ AtD loaded now passes.
*   Auto-proofread no longer activated on Like, Unlike, and Share Facebook events.
*   Updated auto-proofread dialog to get explicit about OK/Cancel buttons.
*   AtD does a better job of removing/restoring its widget when the editor becomes hidden/visible. This fixes an issue that affected blogger users losing the AtD widget after switching editors.
*   Added a check to prevent WYSIWYG editor proofreader from inheriting properties that could mess up the experience. This means you can edit while proofreading on Blogger and should fix the menu cut-off issue in some CMSs
*   AtD widget in proofread mode now lines up with widget in non-proofread mode on Google Docs.
*   _To protect your data_, text sent to AtD server for grammar/spell check is now sent over SSL.

### 1.0 - 20100514

*   initial release
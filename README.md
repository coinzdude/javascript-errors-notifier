JavaScript Errors Notifier
==========================

# FORK NOTES

This is an attempt to bring the most excellent original work of the JavaScript Errors Notifier Chrome extension back into the Chrome Store.  I have obtained a Chrome Store publishing account which anyone can also do for $5 one time charge, as of this writing, so anyone who knows extension development could also re-submit this extension, or I will be happy to act as proxy through this fork.

This extension is so unobtrusive and useful to Web developers that it really should exist as a configurable error handling behavior directly within the browser. Since the browsers don't offer what is in this extension, this seems a worthy endeavor.

Any links removed from documentation or from within the code are merely to comply with the Chrome Store and manifest version 3 requirements. Please feel free to suggest changes.

[![Author](http://img.shields.io/badge/author-@barbushin-blue.svg?style=flat-square)](https://www.linkedin.com/in/barbushin)
<!-- [![Chrome Web Store](https://img.shields.io/chrome-web-store/v/jafmfknfnkoekkdocjiaipcnmkklaajd.svg?maxAge=2592000&style=flat-square)](https://chrome.google.com/webstore/detail/javascript-errors-notifie/jafmfknfnkoekkdocjiaipcnmkklaajd) -->
[![Software License](https://img.shields.io/badge/license-MIT-brightgreen.svg?style=flat-square)](LICENSE)
<!-- [![Chrome Web Store](https://img.shields.io/chrome-web-store/d/jafmfknfnkoekkdocjiaipcnmkklaajd.svg?maxAge=86400&style=flat-square)](https://chrome.google.com/webstore/detail/javascript-errors-notifie/jafmfknfnkoekkdocjiaipcnmkklaajd) -->
v4
[![Author]()](https://www.linkedin.com/in/robert-castles-a9113a/)


## Installation

1. Add extenstion to your browser

* Google Chrome -
 <!-- * https://chrome.google.com/webstore/detail/javascript-errors-notifie/jafmfknfnkoekkdocjiaipcnmkklaajd -->
<!-- * Firefox - <https://addons.mozilla.org/en-US/firefox/addon/javascript-errors> -->

<!-- 2. Check [test page](http://consle.com/instance/examples/#handle_javascript_errors) to see how JavaScript errors will be handled in your browser. -->

## Features

* Change extension icon color in toolbar when JavaScript error occurs
* Show error icon in bottom right page corner
* Show errors details by click on toolbar or notification icon
* Error source URL in popup is clickable
* Show errors details in notification popup
* Show errors stack traces
* Show errors column number
* Error source in notification popups is clickable
* Does not overrides user-defined error handler
* Handle console.error() calls
* Handle missing js/css/other missing files 404 errors
* Ignore 404 errors initiated by AdBlock and etc
* Ignores repeated errors
* Ignores Google Chrome extensions internal errors
* Error text is linked on StackOverflow search
* Copy errors details to clipboard

## Contribution

* Check [Issues](https://github.com/coinzdude/javascript-errors-notifier/issues) page for feature requests.
* Please keep original code style: use VS code prettier for formatting, and all other spacing & braces formatting same as in original.
* Test your code twice :) Thank you!

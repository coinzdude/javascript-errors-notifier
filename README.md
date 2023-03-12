JavaScript Errors Notifier
==========================

# Extension availability

This extension is live at https://chrome.google.com/webstore/detail/javascript-errors-notifie/lplhclpeegjedapdliokcacmphgcnlnd.

# Additional project notes
This is a fork to bring @barbushin's JavaScript Errors Notifier Chrome extension back into the Chrome Store and to provide a vehicle for feature development and bug support. I have obtained a Chrome Store publishing account which anyone can also do for $5 one time charge, as of this writing, so anyone  could also re-submit this extension, or I will act as proxy through this project. Interestingly, while working on this fork, the manifest v2 extension was able to be installed manually in the lastest Chromium in developer mode, but it appears that path is no longer viable, as it appears that developer mode also now blocks manifest v2 projects. This extension, which is working with manifest v3 can be installed manually, or directly from the Chrome Store.

This extension is unobtrusive and useful to Web developers, and ideally, these features should exist as a configurable behavior directly within the browser. Since the browsers don't offer what is in this extension, this seems a worthy endeavor, as I have found this extension to be a nearly invaluable tool for issue detection in the development and test cycle. 

Any links removed from the original project's documentation or from within the code are merely to comply with the Chrome Store and manifest version 3 requirements. Please feel free to suggest changes.

Original extension developer project
[![Author](http://img.shields.io/badge/author-@barbushin-blue.svg?style=flat-square)](https://www.linkedin.com/in/barbushin)
<!-- [![Chrome Web Store](https://img.shields.io/chrome-web-store/v/jafmfknfnkoekkdocjiaipcnmkklaajd.svg?maxAge=2592000&style=flat-square)](https://chrome.google.com/webstore/detail/javascript-errors-notifie/jafmfknfnkoekkdocjiaipcnmkklaajd) -->
[![Software License](https://img.shields.io/badge/license-MIT-brightgreen.svg?style=flat-square)](LICENSE)

v4+ (manifest version 3 based) / 'This' continued effort project maintainer
https://www.linkedin.com/in/robert-castles-a9113a/

## Installation

1. Add extenstion to your browser

* Google Chrome (This project, manifest v3) --> https://chrome.google.com/webstore/detail/javascript-errors-notifie/lplhclpeegjedapdliokcacmphgcnlnd 
* Firefox (not yet ported, original manifest v2) --> https://addons.mozilla.org/en-US/firefox/addon/javascript-errors 

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

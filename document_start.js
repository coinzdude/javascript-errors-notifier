// document_start.js
var s = document.createElement('script');
s.src = chrome.runtime.getURL('code-to-inject.js');
s.onload = function() {
    this.remove();
};
(document.head || document.documentElement).appendChild(s);
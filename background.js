﻿;(() => {
  const readLocalStorage = async (key) => {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get([key], function (result) {
        if (result[key] === undefined) {
          resolve(null)
        } else {
          resolve(result[key])
        }
      })
    })
  }

  chrome.runtime.onInstalled.addListener(function () {
    // initDefaultOptions()
    initDefaultOptions()
  })

  // chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  //   if (changeInfo.status == 'loading') {
  //     chrome.scripting.executeScript({
  //       target: { tabId: tab.id, allFrames: true },
  //       files: ['code-to-inject.js'],
  //     })
  //   }
  // })

  const LS = {
    getAllItems: () => chrome.storage.local.get(),
    getItem: async (key) => (await chrome.storage.local.get(key))[key],
    setItem: (key, val) => chrome.storage.local.set({ [key]: val }),
    removeItems: (keys) => chrome.storage.local.remove(keys),
  }

  function htmlentities(str) {
    var htmlDiv = '<div>' + str + '</div>'
    return htmlDiv
  }

  function getBaseHostByUrl(url) {
    var localUrlRegexp = /(file:\/\/.*)|(:\/\/[^.:]+([\/?:]|$))/ // file:// | local
    var rootHostRegexp = /:\/\/(([\w-]+\.\w+)|(\d+\.\d+\.\d+\.\d+)|(\[[\w:]+\]))([\/?:]|$)/ // domain.com | IPv4 | IPv6
    var subDomainRegexp = /:\/\/[^\/]*\.([\w-]+\.\w+)([\/?:]|$)/ // sub.domain.com
    return localUrlRegexp.exec(url)
      ? 'localhost'
      : (rootHostRegexp.exec(url) || subDomainRegexp.exec(url))[1]
  }

  function setDefaults() {
    var optionsValues = {
      iconSize: 38,
      ignore404css: false,
      ignore404js: false,
      ignore404others: false,
      ignoreConnectionRefused: false,
      ignoreConsoleError: false,
      ignoreBlockedByClient: true,
      ignoreExternal: true,
      includeDomains: '',
      linkStackOverflow: false,
      linkViewSource: false,
      notificationIconOpacity: 100,
      popupMaxHeight: 40,
      popupMaxWidth: 70,
      relativeErrorUrl: true,
      showColumn: false,
      showIcon: true,
      hideInPage: true,
      showPopup: false,
      showPopupOnMouseOver: false,
      showTrace: false,
      showDetailOnIncludeDomains: false,
    }
    for (var option in optionsValues) {
      var value = optionsValues[option]
      value = typeof value == 'boolean' ? (value ? 1 : '') : value
      LS.setItem(option, value)
    }
    LS.setItem('optionsInitialized', true)
  }

  function initDefaultOptions() {
    const optionsInitialized = readLocalStorage('optionsInitialized')
    Promise.resolve(optionsInitialized).then((value) => {
      if (value == null || value == false) {
        setDefaults()
      }
    })
  }

  // Ignore net::ERR_BLOCKED_BY_CLIENT initiated by AdPlus & etc
  var ignoredUrlsHashes = {}
  var ignoredUrlsLimit = 100

  async function isUrlIgnoredByType(url) {
    if (!url.indexOf('chrome-extension://')) {
      // ignore Google Chrome extensions 404 errors
      return true
    }
    var ext = url.split('.').pop().split(/\#|\?/)[0].toLowerCase()
    if (ext == 'js') {
      return await LS.getItem('ignore404js')
    }
    if (ext == 'css') {
      return await LS.getItem('ignore404css')
    }
    return await LS.getItem('ignore404others')
  }

  function getIgnoredUrlHash(url) {
    return url.replace(/\d+/g, '')
  }

  chrome.webRequest.onErrorOccurred.addListener(
    async function (e) {
      if (
        ((await LS.getItem('ignoreBlockedByClient')) &&
          e.error == 'net::ERR_BLOCKED_BY_CLIENT') ||
        (LS.getItem('ignoreConnectionRefused') &&
          e.error == 'net::ERR_CONNECTION_REFUSED')
      ) {
        var url = getIgnoredUrlHash(e.url)
        if (!(await isUrlIgnoredByType(url))) {
          if (ignoredUrlsHashes[url]) {
            // move url in the end of list
            delete ignoredUrlsHashes[url]
          }
          ignoredUrlsHashes[url] = true
          var ignoredUrlsArray = Object.keys(ignoredUrlsHashes)
          if (ignoredUrlsArray.length > ignoredUrlsLimit) {
            delete ignoredUrlsHashes[ignoredUrlsArray[0]]
          }
        }
      }
    },
    { urls: ['<all_urls>'] },
  )

  async function handleInitRequest(data, sender) {
    var tabHost = getBaseHostByUrl(data.url)

    chrome.tabs.get(sender.tab.id, function callback() {
      // mute closed tab error
      if (chrome.runtime.lastError) {
        return
      }
      chrome.action.setTitle({
        tabId: sender.tab.id,
        title: 'No errors on this page',
      })
      chrome.action.setPopup({
        tabId: sender.tab.id,
        popup:
          'popup.html?host=' +
          encodeURIComponent(tabHost) +
          '&tabId=' +
          sender.tab.id,
      })
    })
    return {
      showIcon:
        typeof (await LS.getItem('icon_' + tabHost)) != 'undefined'
          ? await LS.getItem('icon_' + tabHost)
          : await LS.getItem('showIcon'),
      hideInPage: await LS.getItem('hideInPage'),
      showPopup:
        typeof (await LS.getItem('popup_' + tabHost)) != 'undefined'
          ? await LS.getItem('popup_' + tabHost)
          : await LS.getItem('showPopup'),
      showPopupOnMouseOver: await LS.getItem('showPopupOnMouseOver'),
      popupMaxWidth: await LS.getItem('popupMaxWidth'),
      popupMaxHeight: await LS.getItem('popupMaxHeight'),
      includeDomains: await LS.getItem('includeDomains'),
      iconSize: await LS.getItem('iconSize'),
      notificationIconOpacity: await LS.getItem('notificationIconOpacity'),
      showDetailOnIncludeDomains: await LS.getItem('showDetailOnIncludeDomains'),
    }
  }

  async function handleErrorsRequest(data, sender, sendResponse) {
    var popupErrors = []
    var tabHost = getBaseHostByUrl(data.url)
    var tabBaseUrl = (/^([\w-]+:\/\/[^\/?]+)/.exec(data.url) || [null, null])[1]

    for (var i in data.errors) {
      var error = data.errors[i]
      var errorHost = getBaseHostByUrl(error.url)
      if ((await LS.getItem('ignoreExternal')) && errorHost != tabHost) {
        continue
      }
      if (error.is404) {
        if (
          ignoredUrlsHashes[getIgnoredUrlHash(error.url)] ||
          (await isUrlIgnoredByType(error.url))
        ) {
          delete data.errors[i]
          continue
        }
        error.type = 'File not found'
        error.text = error.url
        popupErrors.unshift('File not found: ' + htmlentities(error.url))
      } else {
        error.text = error.text
          .replace(/^Uncaught /, '')
          .replace(/^Error: /, '')

        var errorHtml = (await LS.getItem('linkStackOverflow'))
          ? '<a target="_blank" href="http://www.google.com/search?q=' +
            encodeURIComponent(htmlentities(error.text)) +
            '%20site%3Astackoverflow.com" id="">' +
          htmlentities(error.text) +
          '<svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false" x="0px" y="0px" viewBox="0 0 100 100" width="15" height="15" class="icon outbound"><path fill="currentColor" d="M18.8,85.1h56l0,0c2.2,0,4-1.8,4-4v-32h-8v28h-48v-48h28v-8h-32l0,0c-2.2,0-4,1.8-4,4v56C14.8,83.3,16.6,85.1,18.8,85.1z"></path> <polygon fill="currentColor" points="45.7,48.7 51.3,54.3 77.2,28.5 77.2,37.2 85.2,37.2 85.2,14.9 62.8,14.9 62.8,22.9 71.5,22.9"></polygon></svg></a>'
          : htmlentities(error.text)

        var m = new RegExp('^(\\w+):s*(.+)').exec(error.text)
        error.type = m ? m[1] : 'Uncaught Error'

        if ((await LS.getItem('showColumn')) && error.line && error.col) {
          error.line = error.line + ':' + error.col
        }

        var lines
        if (
          (await LS.getItem('showTrace')) &&
          error.stack &&
          (lines = error.stack.replace(/\n\s*at\s+/g, '\n').split('\n'))
            .length > 2
        ) {
          lines.shift()
          for (var ii in lines) {
            var urlMatch = /^(.*?)\(?(([\w-]+):\/\/.*?)(\)|$)/.exec(lines[ii])
            var url = urlMatch ? urlMatch[2] : null
            var method = urlMatch ? urlMatch[1].trim() : lines[ii]
            var lineMatch = url
              ? ((await LS.getItem('showColumn'))
                  ? /^(.*?):([\d:]+)$/
                  : /^(.*?):(\d+)(:\d+)?$/
                ).exec(url)
              : null
            var line = lineMatch ? lineMatch[2] : null
            url = lineMatch ? lineMatch[1] : url
            if (!url && method == 'Error (native)') {
              continue
            }
            errorHtml += '<br/>&nbsp;'
            if (url) {
              errorHtml +=
                // (await LS.getItem('linkViewSource'))
                // ? '<a href="view-source:' +
                //   url +
                //   (line ? '#' + line : '') +
                //   '" target="_blank">' +
                //   url +
                //   (line ? ':' + line : '') +
                // '</a>'
                // :
                url + (line ? ':' + line : '')
            }
            if (method) {
              errorHtml += ' ' + method + '()'
            }
          }
        } else {
          var url = error.url + (error.line ? ':' + error.line : '')
          errorHtml +=
            '<br/>&nbsp;' +
          (
            // (
            //   await LS.getItem('linkViewSource'))
            //   ? '<a href="view-source:' +
            //     error.url +
            //     (error.line ? '#' + error.line : '') +
            //     '" target="_blank">' +
            //     url +
            //   '</a>' 
            //   :
              url
          )
        }
        popupErrors.push(errorHtml)
      }
    }

    if (!popupErrors.length) {
      return
    }

    chrome.tabs.get(sender.tab.id, async function callback() {
      // mute closed tab error
      if (chrome.runtime.lastError) {
        return
      }

      chrome.action.setTitle({
        tabId: sender.tab.id,
        title: 'There are some errors on this page. Click to see details.',
      })

      chrome.action.setIcon({
        tabId: sender.tab.id,
        path: {
          '19': 'img/error_19.png',
          '38': 'img/error_38.png',
        },
      })

      var errorsHtml = popupErrors.join('<br/><br/>')

      if ((await LS.getItem('relativeErrorUrl')) && tabBaseUrl) {
        errorsHtml = errorsHtml
          .split(tabBaseUrl + '/')
          .join('/')
          .split(tabBaseUrl)
          .join('/')
        // if (await LS.getItem('linkViewSource')) {
        //   errorsHtml = errorsHtml
        //     .split('href="view-source:/')
        //     .join('href="view-source:' + tabBaseUrl + '/')
        // }
      }

      var popupUri =
        'popup.html?errors=' +
        encodeURIComponent(errorsHtml) +
        '&host=' +
        encodeURIComponent(tabHost) +
        '&tabId=' +
        sender.tab.id

      chrome.action.setPopup({
        tabId: sender.tab.id,
        popup: popupUri,
      })

      chrome.tabs.sendMessage(sender.tab.id, {
        message: 'ShowPopupError',
        tabId: sender.tab.id,
        payload: popupUri,
      })

      chrome.runtime.sendMessage({
        message: 'ShowPopupError',
        tabId: sender.tab.id,
        payload: popupUri,
      })
    })
  }

  chrome.runtime.onMessage.addListener((data, sender, sendResponse) => {
    if (data._initPage) {
      handleInitRequest(data, sender).then((data) => {
        sendResponse(data)
      })
    } else if (data._restoreDefaults) {
      chrome.storage.local.clear().then((data) => {
        initDefaultOptions()
        LS.getAllItems().then((data) => {
          sendResponse(data)
        })
      })
    } else if (data._getOptionFromBackground) {
      LS.getItem(data.optionName).then((data) => {
        sendResponse(data)
      })
    } else if (data._getOptions) {
      LS.getAllItems().then((data) => {
        sendResponse(data)
      })
    } else if (data._errors) {
      handleErrorsRequest(data, sender, sendResponse)
    } else if (data._setOption) {
      // TODO See if we can get a message back to CTI.js 
      // if (data.optionName == 'ignoreConsoleError') {
      //      chrome.tabs.sendMessage(sender.tab.id, {
      //     _fromBackground: true,
      //     _forCTI: true,
      //     optionName: data.optionName,
      //     optionValue: data.optionValue,
      //   })
      // }
      LS.setItem(data.optionName, data.optionValue)
    }
    return true
  })
})()

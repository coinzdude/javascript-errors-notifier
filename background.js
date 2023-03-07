chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  if (changeInfo.status == 'loading') {
    chrome.scripting.executeScript({
      target: { tabId: tab.id, allFrames: true },
      files: ['code-to-inject.js'],
    })
  }
})

var optionsEntries = [
  'ignore404css',
  'ignore404js',
  'ignore404others',
  'ignoreBlockedByClient',
  'ignoreConnectionRefused',
  'ignoreExternal',
  'isRecommended',
  'jscrNotified',
  'linkStackOverflow',
  'linkViewSource',
  'popupMaxHeight',
  'popupMaxWidth',
  'relativeErrorUrl',
  'showIcon',
  'showColumn',
  'showPopup',
  'showPopupOnMouseOver',
  'showTrace',
]

const LS = {
  getAllItems: () => chrome.storage.local.get(),
  getItem: async (key) => (await chrome.storage.local.get(key))[key],
  setItem: (key, val) => chrome.storage.local.set({ [key]: val }),
  removeItems: (keys) => chrome.storage.local.remove(keys),
}

function htmlentities(str) {
  console.log('htmlentities ' + str)
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

function initDefaultOptions() {
  console.log('initDefaultOptions')
  var optionsValues = {
    ignore404css: false,
    ignore404js: false,
    ignore404others: true,
    ignoreConnectionRefused: true,
    ignoreBlockedByClient: true,
    ignoreExternal: true,
    linkStackOverflow: false,
    linkViewSource: false,
    popupMaxHeight: 40,
    popupMaxWidth: 70,
    relativeErrorUrl: true,
    showColumn: false,
    showIcon: true,
    showPopup: false,
    showPopupOnMouseOver: false,
    showTrace: false,
  }
  for (var option in optionsValues) {
    var value = optionsValues[option]
    value = typeof value == 'boolean' ? (value ? 1 : '') : value
    LS.setItem(option, value)
  }
}
initDefaultOptions()

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
    console.log(sender.tab.id)
  })
  return {
    showIcon:
      typeof (await LS.getItem('icon_' + tabHost)) != 'undefined'
        ? await LS.getItem('icon_' + tabHost)
        : await LS.getItem('showIcon'),
    showPopup:
      typeof (await LS.getItem('popup_' + tabHost)) != 'undefined'
        ? await LS.getItem('popup_' + tabHost)
        : await LS.getItem('showPopup'),
    showPopupOnMouseOver: await LS.getItem('showPopupOnMouseOver'),
    popupMaxWidth: await LS.getItem('popupMaxWidth'),
    popupMaxHeight: await LS.getItem('popupMaxHeight'),
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
      console.log('handleErrorsRequest')
      popupErrors.unshift('File not found: ' + htmlentities(error.url))
    } else {
      error.text = error.text.replace(/^Uncaught /, '').replace(/^Error: /, '')

      var errorHtml = (await LS.getItem('linkStackOverflow'))
        ? '<a target="_blank" href="http://www.google.com/search?q=' +
          encodeURIComponent(htmlentities(error.text)) +
          '%20site%3Astackoverflow.com" id="">' +
          htmlentities(error.text) +
          '</a>'
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
        (lines = error.stack.replace(/\n\s*at\s+/g, '\n').split('\n')).length >
          2
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
            errorHtml += (await LS.getItem('linkViewSource'))
              ? '<a href="view-source:' +
                url +
                (line ? '#' + line : '') +
                '" target="_blank">' +
                url +
                (line ? ':' + line : '') +
                '</a>'
              : url + (line ? ':' + line : '')
          }
          if (method) {
            errorHtml += ' ' + method + '()'
          }
        }
      } else {
        var url = error.url + (error.line ? ':' + error.line : '')
        errorHtml +=
          '<br/>&nbsp;' +
          ((await LS.getItem('linkViewSource'))
            ? '<a href="view-source:' +
              error.url +
              (error.line ? '#' + error.line : '') +
              '" target="_blank">' +
              url +
              '</a>'
            : url)
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
      if (await LS.getItem('linkViewSource')) {
        errorsHtml = errorsHtml
          .split('href="view-source:/')
          .join('href="view-source:' + tabBaseUrl + '/')
      }
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
  } else if (data._getOptions) {
    LS.getAllItems().then((data) => {
      console.log(data)
      sendResponse(data)
    })
  } else if (data._errors) {
    handleErrorsRequest(data, sender, sendResponse)
  } else if (data._setOption) {
    LS.setItem(data.optionName, data.optionValue)
  }
  return true
})

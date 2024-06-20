new (function () {
  var errors = []
  var errorsLimit = 100
  var tabId
  var timer
  var icon
  var popup
  var options
  var isIFrame = window.top != window

  function showPopup(popupUrl) {
    if (!popup) {
      popup = document.createElement('iframe')
      popup.id = 'js-notifier-alert'
      popup.src = chrome.runtime.getURL(
        popupUrl.payload ? popupUrl.payload : popupUrl,
      ) // TODO this errors on subsequent alert icon clicks because it's an object with the URL inside
      popup.frameBorder = 0
      popup.height = '150px'
      popup.width = '400px'
      popup.style.cssText =
        'min-height: 150px !important; min-width: 400px !important; position: fixed !important; bottom: 50px !important; right: 50px !important; z-index: 2147483647 !important;'
      ;(document.body || document.documentElement).appendChild(popup)
    } else {
      if (typeof popupUrl != 'object') {
        popup.contentWindow.postMessage(
          {
            _reloadPopup: true,
            url: popupUrl,
          },
          '*',
        )
      }
    }
  }

  function showErrorNotification(popupUrl) {
    if (options.showPopup || (options.showDetailOnIncludeDomains && options.includeDomains.indexOf(getBaseHostByUrl(window.location.href)) + 1)) {
      showPopup(popupUrl)
    }
    var includeSite = false
    var includeDomainsArray = options.includeDomains?.split(/\r?\n/)
    for (var i = 0; i < includeDomainsArray.length; i++) {
      if (window.location.hostname.includes(includeDomainsArray[i])) {
        includeSite = true
        break
      }
    }
    if (!icon && !options.hideInPage && (options.showIcon || options.showPopup || includeSite)) {
      icon = document.createElement('img')
      icon.src = chrome.runtime.getURL('img/error_128.png')
      icon.title = 'Some errors occurred on this page. Click to see details.'
      const iconSize = options.iconSize == undefined ? 38 : options.iconSize
      icon.style.cssText = `opacity: ${
        options.notificationIconOpacity / 100
      }; position: fixed !important; bottom: 10px !important; right: 10px !important; cursor: pointer !important; z-index: 2147483647 !important; width: ${iconSize}px !important; height: ${iconSize}px !important; min-height: ${iconSize}px !important; min-width: ${iconSize}px !important; max-height: ${iconSize}px !important; max-width: ${iconSize}px !important;`

      icon.onclick = function () {
        if (!popup) {
          showPopup(popupUrl)
        } else {
          popup.remove()
          popup = null
        }
      }
      if (options.showPopupOnMouseOver) {
        icon.onmouseover = function () {
          if (!popup) {
            showPopup(popupUrl)
          }
        }
      }
      ;(document.body || document.documentElement).appendChild(icon)
    }
  }

  function handleNewError(error) {
    var lastError = errors[errors.length - 1]
    var isSameAsLast =
      lastError &&
      lastError.text == error.text &&
      lastError.url == error.url &&
      lastError.line == error.line &&
      lastError.col == error.col
    var isWrongUrl = !error.url || error.url.indexOf('://') === -1
    if (!isSameAsLast && !isWrongUrl) {
      errors.push(error)
      if (errors.length > errorsLimit) {
        errors.shift()
      }
      if (!timer) {
        timer = window.setTimeout(function () {
          timer = null
          chrome.runtime.sendMessage(
            {
              _errors: true,
              errors: errors,
              url: window.top.location.href,
            },
            function (popupUrl) {
              if (popupUrl) {
                showErrorNotification(popupUrl)
              }
            },
          )
        }, 200)
      }
    }
  }

  document.addEventListener('ErrorToExtension', function (e) {
    var error = e.detail
    if (isIFrame) {
      window.top.postMessage(
        {
          _iframeError: true,
          _fromJEN: true,
          error: error,
        },
        '*',
      )
    } else {
      handleNewError(error)
    }
  })

  function handleInternalMessage(data) {
    showErrorNotification(data)
    if (!isIFrame && (!data.tabId || data.tabId == tabId)) {
      if (data._clear) {
        errors = []
        if (popup) {
          popup.remove()
          popup = null
        }
        if (icon) {
          icon.remove()
          icon = null
        }
      } else if (data._resize && popup) {
        var maxHeight =
          Math.round((window.innerHeight * options.popupMaxHeight) / 100) - 60
        var maxWidth =
          Math.round((window.innerWidth * options.popupMaxWidth) / 100) - 60
        var height = data.height < maxHeight ? data.height : maxHeight
        var width = data.width < maxWidth ? data.width : maxWidth
        popup.height = (width == maxWidth ? height + 10 : height) + 'px' // scroll fix
        popup.width = (height == maxHeight ? width + 10 : width) + 'px' // scroll fix
        popup.style.height = popup.height
        popup.style.width = popup.width
      } else if (data._closePopup && popup) {
        popup.style.display = 'none'
      } else if (data._iframeError) {
        handleNewError(data.error)
      }
    }
  }

  chrome.runtime.onMessage.addListener(handleInternalMessage)

  async function getItemFromBackgroundForCTI(optionName) {
    const optionValue = await chrome.runtime.sendMessage({
      _getOptionFromBackground: true,
      optionName: optionName,
    })
    window.postMessage({
      _forCTI: true,
      optionName: optionName,
      optionValue: optionValue,
    })
  }

  window.addEventListener('message', function (event) {
    if (event.data._fromCTI && event.data._getOption) {
      getItemFromBackgroundForCTI(event.data.optionName)
    }
    if (
      typeof event.data === 'object' &&
      event.data &&
      typeof event.data._fromJEN !== 'undefined' &&
      event.data._fromJEN
    ) {
      handleInternalMessage(event.data)
    }
  })

  if (!isIFrame) {
    ;(async () => {
      const response = await chrome.runtime.sendMessage({
        _initPage: true,
        url: window.location.href,
      })
      options = response
    })()
  }

  function getBaseHostByUrl(url) {
    var localUrlRegexp = /(file:\/\/.*)|(:\/\/[^.:]+([\/?:]|$))/ // file:// | local
    var rootHostRegexp = /:\/\/(([\w-]+\.\w+)|(\d+\.\d+\.\d+\.\d+)|(\[[\w:]+\]))([\/?:]|$)/ // domain.com | IPv4 | IPv6
    var subDomainRegexp = /:\/\/[^\/]*\.([\w-]+\.\w+)([\/?:]|$)/ // sub.domain.com
    return localUrlRegexp.exec(url)
      ? 'localhost'
      : (rootHostRegexp.exec(url) || subDomainRegexp.exec(url))[1]
  }
})()

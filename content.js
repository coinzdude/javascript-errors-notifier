new (function () {
  var errors = []
  var errorsLimit = 100
  var tabId
  var timer
  var icon
  var popup
  var options
  var isIFrame = window.top != window

  // alert('content.js')
  console.log('running')

  // alert(chrome.runtime.getURL('popup.html'))

  // sw.evaluate(() => chrome.storage.local.write('key', 'value'))

  function showPopup(popupUrl) {
    console.log(popupUrl)

    if (!popup) {
      popup = document.createElement('iframe')
      popup.src = chrome.runtime.getURL(
        popupUrl.payload ? popupUrl.payload : popupUrl,
      ) // TODO this errors on subsequent alert icon clicks because it's an object with the URL inside
      popup.frameBorder = 0
      popup.style.cssText =
        'position: fixed !important; bottom: 50px !important; right: 50px !important; z-index: 2147483647 !important;'
      popup.height = '50px'
      ;(document.body || document.documentElement).appendChild(popup)
    } else {
      popup.contentWindow.postMessage(
        {
          _reloadPopup: true,
          url: popupUrl,
        },
        '*',
      )
    }
  }

  function showErrorNotification(popupUrl) {
    // if (options.showPopup) {
    if (false) {
      showPopup(popupUrl)
    }

    // if (!icon && (options.showIcon || options.showPopup)) {
    if (!icon) {
      icon = document.createElement('img')
      icon.src = chrome.runtime.getURL('img/error_38.png')
      icon.title = 'Some errors occurred on this page. Click to see details.'
      icon.style.cssText =
        'position: fixed !important; bottom: 10px !important; right: 10px !important; cursor: pointer !important; z-index: 2147483647 !important; width: 38px !important; height: 38px !important; min-height: 38px !important; min-width: 38px !important; max-height: 38px !important; max-width: 38px !important;'
      icon.onclick = function () {
        if (!popup) {
          showPopup(popupUrl)
        } else {
          popup.remove()
          popup = null
        }
      }
      // if (options.showPopupOnMouseOver) {
      if (false) {
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
    // alert('handleNewError')
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
    // debugger
    console.log('handleInternalMessage', data)
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

    chrome.runtime.onMessage.addListener(function (
      request,
      sender,
      sendResponse,
    ) {
      // debugger
      console.log(
        sender.tab
          ? 'from a content script:' + sender.tab.url
          : 'from the extension',
      )
      if (request.greeting === 'hello') sendResponse({ farewell: 'goodbye' })
    })
  }

  chrome.runtime.onMessage.addListener(function (
    request,
    sender,
    sendResponse,
  ) {
    // debugger
    console.log(
      sender.tab
        ? 'from a content script:' + sender.tab.url
        : 'from the extension',
    )
    if (request.greeting === 'hello') sendResponse({ farewell: 'goodbye' })
  })
  chrome.runtime.onMessage.addListener(handleInternalMessage)

  // window.addEventListener('message', function (event) {
  //   if (
  //     typeof event.data === 'object' &&
  //     event.data &&
  //     typeof event.data._fromJEN !== 'undefined' &&
  //     event.data._fromJEN
  //   ) {
  //     console.log('got message ' + event.data)
  //     this.alert('got message ' + event.data)
  //     handleInternalMessage(event.data)
  //   }
  // })

  if (!isIFrame) {
    (async () => {
      const response = await chrome.runtime.sendMessage({
        _initPage: true,
        url: window.location.href,
      })
      console.log('response', response)
      options = response    
      // do something with response here, not outside the function
    })();

    // chrome.runtime.sendMessage(
    //   {
    //     _initPage: true,
    //     url: window.location.href,
    //   },
    //   function (response) {
    //   console.log('response', response)
    //     options = response
    //   }
    // );
  }
})()

// _script = document.createElement('script');
// _script.setAttribute('src', chrome.runtime.getURL('code-to-inject.js'));
// (document.head||document.documentElement).appendChild( _script  );
// _script.parentNode.removeChild(_script);

// var s = document.createElement('script');
// 	s.src = "code-to-inject.js"
// 		chrome.runtime.getURL('code-to-inject.js');
// s.onload = function() {
//     this.remove();
// };
// (document.head || document.documentElement).appendChild(s);

// alert('code-to-inject');
// function codeToInject() {

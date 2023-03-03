; (() => {
  
  debugger

  // alert('cti ' + chrome.runtime.getURL("popup.html"));

  // alert('code-to-inject');
  console.log('code-to-inject loaded')
  console.log(window)
  // function codeToInject() {

  function handleCustomError(message, stack) {
    console.log('handleCustomError')
    if (!stack) {
      stack = new Error().stack.split('\n').splice(2, 4).join('\n')
    }

    var stackLines = stack.split('\n')
    var callSrc = (stackLines.length > 1 &&
      (/^.*?\((.*?):(\d+):(\d+)/.exec(stackLines[1]) ||
        /(\w+:\/\/.*?):(\d+):(\d+)/.exec(stackLines[1]))) || [
      null,
      null,
      null,
      null,
    ]

    document.dispatchEvent(
      new CustomEvent('ErrorToExtension', {
        detail: {
          stack: stackLines.join('\n'),
          url: callSrc[1],
          line: callSrc[2],
          col: callSrc[3],
          text: message,
        },
      }),
    )
  }

  console.log('addEventListener')

  // debugger;

  // handle uncaught promises errors
  window.addEventListener('unhandledrejection', function (e) {
    console.log('eventListener unhandledrejection')
    // this.alert('eventListener unhandledrejection')

    if (typeof e.reason === 'undefined') {
      e.reason = e.detail
    }
    handleCustomError(e.reason.message, e.reason.stack)
  })

  // handle console.error()
  var consoleErrorFunc = window.console.error
  window.console.error = function () {
    console.log('window.console.error function')
    // this.alert('window.console.error')
    var argsArray = []
    for (var i in arguments) {
      // because arguments.join() not working! oO
      argsArray.push(arguments[i])
    }
    consoleErrorFunc.apply(console, argsArray)

    handleCustomError(
      argsArray.length == 1 && typeof argsArray[0] == 'string'
        ? argsArray[0]
        : JSON.stringify(argsArray.length == 1 ? argsArray[0] : argsArray),
    )
  }
  // handle uncaught errors
  window.addEventListener('error', function (e) {
console.log('window.addEventListener error', e);

    if (e.filename) {
      document.dispatchEvent(
        new CustomEvent('ErrorToExtension', {
          detail: {
            stack: e.error ? e.error.stack : null,
            url: e.filename,
            line: e.lineno,
            col: e.colno,
            text: e.message,
          },
        }),
      )
    }
  })

  // handle 404 errors
  window.addEventListener(
    'error',
    function (e) {

      var src = e.target.src || e.target.href
      // this.alert('cti error thing')
      console.log('listener ErrorEvent ' + src)

      var baseUrl = e.target.baseURI
      if (src && baseUrl && src != baseUrl) {
        document.dispatchEvent(
          new CustomEvent('ErrorToExtension', {
            detail: {
              is404: true,
              url: src,
            },
          }),
        )
      }
    },
    true,
  )
  
  console.log('end')
  // }
})()

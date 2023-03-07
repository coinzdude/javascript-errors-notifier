function store(optionName, optionValue) {
  chrome.runtime.sendMessage({
    _setOption: true,
    optionName: optionName,
    optionValue: optionValue,
  })
}

document.addEventListener('DOMContentLoaded', function () {
  ;(async () => {
    const options = await chrome.runtime.sendMessage({
      _getOptions: true,
    })
    console.log('response', options)

    var optionsIds = [
      'showIcon',
      'showPopup',
      'showPopupOnMouseOver',
      'showColumn',
      'showTrace',
      'linkStackOverflow',
      'linkViewSource',
      'relativeErrorUrl',
      'ignore404js',
      'ignore404css',
      'ignore404others',
      'ignoreExternal',
      'ignoreBlockedByClient',
      'ignoreConnectionRefused',
      'popupMaxWidth',
      'popupMaxHeight',
    ]

    for (var i in optionsIds) {
      var option = optionsIds[i]
      var value = options[option]
      var input = document.getElementById(option)

      if (input.type == 'checkbox') {
        if (value) {
          input.checked = true
        }
        input.onchange = (function (option) {
          return function () {
            store(option, this.checked ? 1 : '')
          }
        })(option)
      } else {
        input.value = value
        input.onkeyup = (function (option) {
          return function () {
            store(option, this.value)
          }
        })(option)
      }
    }

    if (options['jscrNotified'] || options['isRecommended']) {
      document.getElementById('recommendation').remove()
    } else {
      var linksIds = ['openRecommendation', 'hideRecommendation']
      for (var i in linksIds) {
        document.getElementById(linksIds[i]).onclick = function () {
          store('isRecommended', 3)
          closePopup()
          return this.id == 'openRecommendation'
        }
      }
    }
  })()

  document.getElementById('close').onclick = function () {
    closePopup()
  }
})

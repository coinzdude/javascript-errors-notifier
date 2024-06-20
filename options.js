var options

function store(optionName, optionValue) {
  chrome.runtime.sendMessage({
    _setOption: true,
    optionName: optionName,
    optionValue: optionValue,
  })
}

async function restoreDefaults() {
  await chrome.runtime.sendMessage({
    _restoreDefaults: true,
    url: window.location.href,
  })
  options = await chrome.runtime.sendMessage({
    _getOptions: true,
  })
  filloutOptions()
}

function filloutOptions() {
  var optionsIds = [
    'iconSize',
    'ignore404css',
    'ignore404js',
    'ignore404others',
    'ignoreBlockedByClient',
    'ignoreConnectionRefused',
    'ignoreConsoleError',
    'ignoreExternal',
    'includeDomains',
    'linkStackOverflow',
    // 'linkViewSource',
    'notificationIconOpacity',
    'popupMaxHeight',
    'popupMaxWidth',
    'relativeErrorUrl',
    'showColumn',
    'showIcon',
    'hideInPage',
    'showPopup',
    'showPopupOnMouseOver',
    'showTrace',
    'showDetailOnIncludeDomains',
  ]

  if (options['notificationIconOpacity'] == undefined) {
    options['notificationIconOpacity'] = 100
  }

  for (var i in optionsIds) {
    var option = optionsIds[i]
    var value = options[option]
    var input = document.getElementById(option)

    if (option == 'notificationIconOpacity') {
      const opacitySlider = document.getElementById('opacityRange')
      opacitySlider.value = options[option]
      continue
    }
    if (input.type == 'textarea' || input.type == 'text') {
      if (value == undefined) {
        value = ''
      }
    }
    if (input.type == 'checkbox') {
      if (value) {
        input.checked = true
      } else {
        input.checked = false
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

  document.getElementById('restore-defaults').onclick = function () {
    let result = window.confirm('Reset all options to default?')
    if (result) restoreDefaults()
  }
}

document.addEventListener('DOMContentLoaded', function () {
  ;(async () => {
    options = await chrome.runtime.sendMessage({
      _getOptions: true,
    })
    filloutOptions()
  })()

  document.getElementById('close').onclick = function () {
    closePopup()
  }

  var opacitySlider = document.getElementById('opacityRange')
  opacitySlider.oninput = function () {
    store('notificationIconOpacity', this.value)
  }
})

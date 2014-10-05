
var JSMN = require('./lib/jsmn.js')
var ace = require('brace')
require('brace/mode/javascript');
require('brace/theme/ambiance');

var NO_TRANSACTION = {}

var watch = require('observ/watch')

module.exports = RawEditor

function RawEditor(file){
  this.file = file
}

RawEditor.prototype.type = 'Widget'

RawEditor.prototype.init = function(){
  var element = document.createElement('div')
  element.className = 'RawEditor'

  var el = document.createElement('div')

  var textEditor = this.editor = ace.edit(el)

  window.editors = window.editors || []
  window.editors.push(textEditor)

  textEditor.setTheme('ace/theme/ambiance');
  textEditor.session.setMode('ace/mode/javascript')
  textEditor.session.setUseWorker(false)
  textEditor.session.setTabSize(2)
  textEditor.renderer.setScrollMargin(20,100)
  textEditor.renderer.setPadding(20)
  textEditor.renderer.setShowGutter(false)

  var currentFile = null
  var release = null
  textEditor.setFile = function(file){
    if (currentFile !== file){
      clearTimeout(saveTimer)

      if (release){
        release()
        release = null
      }

      if (file){
        currentFile = file
        textEditor._currentFile = file
        release = watch(file, update)
      }

    }
  }
  //textEditor.setSize('100%', '100%')

  var lastValue = null
  var currentTransaction = NO_TRANSACTION
  var updating = false

  function save(){
    var value = textEditor.getValue()
    if (!updating && value != lastValue && currentFile){
      lastValue = value
      try {
        var lastTransaction = currentTransaction
        var object = JSON.stringify(JSMN.parse(value))
        currentTransaction = object
        currentFile.set(object)
        currentTransaction = lastTransaction
      } catch (ex) {}
    }
  }

  function update(){
    var lastUpdateValue = updating
    updating = true
    var data = currentFile ? currentFile() : null
    if (data !== currentTransaction){
      var object = {}
      if (data){
        try {
          object = JSON.parse(data || '{}')
        } catch (ex) {}
      }
      textEditor.setValue(JSMN.stringify(object || {}),-1)
    }
    updating = lastUpdateValue
  }

  textEditor.on('blur', update)

  var saveTimer = null
  textEditor.on('change', function(){
    clearTimeout(saveTimer)
    saveTimer = setTimeout(save, 100)
  })

  textEditor.setFile(this.file)

  element.appendChild(el)
  return element
}

RawEditor.prototype.update = function(prev, elem){
  this.editor = prev.editor

  if (!this.editor.isFocused() || prev.file !== elem.file){
    this.editor.setFile(this.file)
  }
  return elem
}
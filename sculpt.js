'use strict'

const events = require('events')
const fs = require('fs')
const os = require('os')
const path = require('path')
const Parse = require('fast-json-parse')

const defaultOptions = {
  path: path.join(os.tmpdir(), 'aborsculpt.json'),
  interval: 60000,
  loggers: []
}

function changeLevels (loggers, levels) {
  const len = (loggers.length === levels.length) ? loggers.length : levels.length
  for (var i = 0; i < len; i += 1) {
    try {
      loggers[i].level = levels[i]
    } catch (e) {
      throw e
    }
  }
}

function Arborsculpt (options) {
  if (!(this instanceof Arborsculpt)) return new Arborsculpt(options)
  const opts = Object.assign({}, defaultOptions, options)
  const resolvedFP = path.resolve(opts.path)
  const emitter = this
  var mtime

  function readFile () {
    fs.open(resolvedFP, 'r', function (err, fd) {
      if (err) return emitter.emit(err)
      fs.readFile(fd, function (err, file) {
        if (err) return emitter.emit(err)
        const result = new Parse(file)
        if (result.err) return emitter.emit(err)

        var levels
        if (result.value.level) {
          levels = new Array(opts.loggers.length)
          levels.fill(result.value.level)
        } else if (result.value.levels) {
          levels = result.value.levels
        } else {
          return emitter.emit(new Error('cannot find level configuration in file'))
        }

        try {
          changeLevels(opts.loggers, levels)
        } catch (e) {
          emitter.emit(e)
        }
      })
    })
  }

  const interval = setInterval(
    function arborsculptPoll () {
      fs.stat(resolvedFP, function (err, stats) {
        if (err) return // either missing or no permissions, so don't care
        if (mtime === stats.mtime) return
        mtime = stats.mtime
        readFile()
      })
    },
    opts.interval
  )
  interval.unref()
}
Arborsculpt.prototype = Object.create(events.EventEmitter.prototype)
Arborsculpt.constructor = Arborsculpt

module.exports = Arborsculpt

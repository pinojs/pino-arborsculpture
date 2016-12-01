'use strict'

const fs = require('fs')
const test = require('tap').test
const pino = require('pino')
const arbor = require('../')
const uuid = require('uuid')
const writeStream = require('flush-write-stream')

test('applies a single level to a single logger', function (t) {
  t.plan(1)
  const fp = '/tmp/arbor.' + uuid.v4()
  const dest = writeStream(function (chunk, enc, cb) {
    const line = JSON.parse(chunk)
    t.is(line.level, 20)
    cb()
  })

  const log = pino(dest)
  arbor({
    path: fp,
    loggers: [log],
    interval: 100
  })

  fs.writeFileSync(fp, JSON.stringify({level: 'debug'}))
  setTimeout(function () {
    log.debug('foo')
    fs.unlink(fp)
  }, 110)
})

test('applies a single level to multiple loggers', function (t) {
  t.plan(2)
  const fp = '/tmp/arbor.' + uuid.v4()
  const dest = writeStream(function (chunk, enc, cb) {
    const line = JSON.parse(chunk)
    t.is(line.level, 20)
    cb()
  })

  const parent = pino(dest)
  const child = parent.child({foo: 'bar'})
  arbor({
    path: fp,
    loggers: [parent, child],
    interval: 100
  })

  fs.writeFileSync(fp, JSON.stringify({level: 'debug'}))
  setTimeout(function () {
    parent.debug('parent')
    child.debug('child')
    fs.unlink(fp)
  }, 110)
})

test('applies multiple levels to corresponding levels', function (t) {
  t.plan(2)
  const fp = '/tmp/arbor.' + uuid.v4()
  const dest = writeStream(function (chunk, enc, cb) {
    const line = JSON.parse(chunk)
    if (line.foo === undefined) {
      t.is(line.level, 20)
    } else {
      t.is(line.level, 10)
    }
    cb()
  })

  const parent = pino(dest)
  const child = parent.child({foo: 'bar'})
  arbor({
    path: fp,
    loggers: [parent, child],
    interval: 100
  })

  fs.writeFileSync(fp, JSON.stringify({levels: ['debug', 'trace']}))
  setTimeout(function () {
    parent.debug('foo')
    child.trace('bar')
    fs.unlink(fp)
  }, 110)
})

test('fails silently if file does not exist', function (t) {
  t.plan(1)
  const log = pino()
  arbor({
    path: '/tmp/arbor.' + uuid.v4(),
    loggers: [log],
    interval: 100
  })
  setTimeout(function () {
    t.is(log.level, 'info')
  }, 110)
})

test('modifies only as many loggers as there are levels', function (t) {
  t.plan(2)
  const fp = '/tmp/arbor.' + uuid.v4()
  const parent = pino()
  const child = parent.child({foo: 'bar'})
  arbor({
    path: fp,
    loggers: [parent, child],
    interval: 100
  })

  fs.writeFileSync(fp, JSON.stringify({levels: ['debug']}))
  setTimeout(function () {
    t.is(parent.level, 'debug')
    t.is(child.level, 'info')
    fs.unlink(fp)
  }, 110)
})

'use strict'

const test = require('node:test')
const assert = require('node:assert')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { randomUUID: uuid } = require('node:crypto')
const writeStream = require('flush-write-stream')
const proxyquire = require('proxyquire')
const pino = require('pino')
const tspl = require('@matteo.collina/tspl')

const arbor = require('../')

test('uses the default temp path for level configuration if not specified', async () => {
  let selectedPath
  const pathStub = {
    resolve (path) {
      selectedPath = path
    }
  }
  const proxiedArbor = proxyquire('../', { 'node:path': pathStub })
  proxiedArbor()
  assert.equal(selectedPath, path.join(os.tmpdir(), 'aborsculpt.json'))
})

test('applies a single level to a single logger', async (t) => {
  const plan = tspl(t, { plan: 1 })
  const fp = '/tmp/arbor.' + uuid()
  const dest = writeStream(function (chunk, enc, cb) {
    const line = JSON.parse(chunk)
    plan.equal(line.level, 20)
    cb()
  })

  const log = pino(dest)
  arbor({
    path: fp,
    loggers: [log],
    interval: 100
  })

  fs.writeFileSync(fp, JSON.stringify({ level: 'debug' }))
  setTimeout(function () {
    log.debug('foo')
    fs.unlink(fp, () => {})
  }, 110)

  await plan
})

test('applies a single level to multiple loggers', async (t) => {
  const plan = tspl(t, { plan: 2 })
  const fp = '/tmp/arbor.' + uuid()
  const dest = writeStream(function (chunk, enc, cb) {
    const line = JSON.parse(chunk)
    plan.equal(line.level, 20)
    cb()
  })

  const parent = pino(dest)
  const child = parent.child({ foo: 'bar' })
  arbor({
    path: fp,
    loggers: [parent, child],
    interval: 100
  })

  fs.writeFileSync(fp, JSON.stringify({ level: 'debug' }))
  setTimeout(function () {
    parent.debug('parent')
    child.debug('child')
    fs.unlink(fp, () => {})
  }, 110)

  await plan
})

test('applies multiple levels to corresponding levels', async (t) => {
  const plan = tspl(t, { plan: 2 })
  const fp = '/tmp/arbor.' + uuid()
  const dest = writeStream(function (chunk, enc, cb) {
    const line = JSON.parse(chunk)
    if (line.foo === undefined) {
      plan.equal(line.level, 20)
    } else {
      plan.equal(line.level, 10)
    }
    cb()
  })

  const parent = pino(dest)
  const child = parent.child({ foo: 'bar' })
  arbor({
    path: fp,
    loggers: [parent, child],
    interval: 100
  })

  fs.writeFileSync(fp, JSON.stringify({ levels: ['debug', 'trace'] }))
  setTimeout(function () {
    parent.debug('foo')
    child.trace('bar')
    fs.unlink(fp, () => {})
  }, 110)

  await plan
})

test('fails silently if file does not exist', async (t) => {
  const plan = tspl(t, { plan: 1 })
  const log = pino()
  arbor({
    path: '/tmp/arbor.' + uuid(),
    loggers: [log],
    interval: 100
  })
  setTimeout(function () {
    plan.equal(log.level, 'info')
  }, 110)

  await plan
})

test('changes child levels because that is what pino does', async (t) => {
  const plan = tspl(t, { plan: 2 })
  const fp = '/tmp/arbor.' + uuid()
  const parent = pino()
  const child = parent.child({ foo: 'bar' })
  arbor({
    path: fp,
    loggers: [parent, child],
    interval: 100
  })

  fs.writeFileSync(fp, JSON.stringify({ levels: ['debug'] }))
  setTimeout(function () {
    plan.equal(parent.level, 'debug')
    plan.equal(child.level, 'debug')
    fs.unlink(fp, () => {})
  }, 110)

  await plan
})

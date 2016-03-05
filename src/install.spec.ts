import test = require('blue-tape')
import Promise = require('any-promise')
import { EOL } from 'os'
import { join, relative } from 'path'
import { install, installDependency } from './install'
import { readFile, readConfig, writeFile, rimraf } from './utils/fs'
import { CONFIG_FILE } from './utils/config'
import { VERSION } from './typings'

test('install', t => {
  t.test('install everything', t => {
    const FIXTURE_DIR = join(__dirname, '__test__/install-fixture')

    return rimraf(join(FIXTURE_DIR, 'typings'))
      .then(() => {
        return install({
          cwd: FIXTURE_DIR,
          production: false
        })
      })
      .then(function () {
        return Promise.all([
          readFile(join(FIXTURE_DIR, 'typings/main.d.ts'), 'utf8'),
          readFile(join(FIXTURE_DIR, 'typings/browser.d.ts'), 'utf8'),
          readFile(join(FIXTURE_DIR, 'typings/main/definitions/test/index.d.ts'), 'utf8'),
          readFile(join(FIXTURE_DIR, 'typings/browser/definitions/test/index.d.ts'), 'utf8'),
          readFile(join(FIXTURE_DIR, 'typings/main/ambient/test/index.d.ts'), 'utf8'),
        ])
      })
      .then(function ([mainDts, browserDts, mainFile, browserFile, ambientMainFile]) {
        t.equal(mainDts, [
          `/// <reference path="main/ambient/test/index.d.ts" />`,
          `/// <reference path="main/definitions/test/index.d.ts" />`,
          ``
        ].join(EOL))
        t.equal(browserDts, [
          `/// <reference path="browser/ambient/test/index.d.ts" />`,
          `/// <reference path="browser/definitions/test/index.d.ts" />`,
          ``
        ].join(EOL))

        t.equal(mainFile, browserFile)
        t.equal(mainFile, [
          `// Generated by typings`,
          `// Source: ${relative(FIXTURE_DIR, join(FIXTURE_DIR, 'custom_typings/definition.d.ts'))}`,
          `declare module \'test\' {`,
          `function test (): boolean`,
          ``,
          `export default test`,
          `}`
        ].join(EOL))

        t.equal(ambientMainFile, [
          `// Generated by typings`,
          `// Source: ${relative(FIXTURE_DIR, join(FIXTURE_DIR, 'custom_typings/ambient.d.ts'))}`,
          `declare module "x" {}`
        ].join(EOL))
      })
  })

  t.test('install dependency', t => {
    const DEPENDENCY = 'file:custom_typings/definition.d.ts'
    const AMBIENT_DEPENDENCY = 'file:custom_typings/ambient.d.ts'
    const FIXTURE_DIR = join(__dirname, '__test__/install-dependency-fixture')
    const CONFIG = join(FIXTURE_DIR, CONFIG_FILE)

    return writeFile(CONFIG, '{}')
      .then(function () {
        return rimraf(join(FIXTURE_DIR, 'typings'))
      })
      .then(function () {
        return Promise.all([
          installDependency(DEPENDENCY, {
            cwd: FIXTURE_DIR,
            saveDev: true,
            name: '@scope/test'
          }),
          installDependency(AMBIENT_DEPENDENCY, {
            cwd: FIXTURE_DIR,
            saveDev: true,
            ambient: true,
            name: 'ambient-test'
          })
        ])
      })
      .then(function () {
        return readConfig(CONFIG)
      })
      .then(function (config) {
        t.deepEqual(config, {
          devDependencies: {
            '@scope/test': DEPENDENCY
          },
          ambientDevDependencies: {
            'ambient-test': AMBIENT_DEPENDENCY
          }
        })
      })
  })

  t.test('install empty', t => {
    const FIXTURE_DIR = join(__dirname, '__test__/install-empty')

    return install({
      cwd: FIXTURE_DIR,
      production: false
    })
      .then(function () {
        return Promise.all([
          readFile(join(FIXTURE_DIR, 'typings/main.d.ts'), 'utf8'),
          readFile(join(FIXTURE_DIR, 'typings/browser.d.ts'), 'utf8')
        ])
      })
      .then(function ([main, browser]) {
        t.equal(main, '')
        t.equal(browser, '')
      })
  })
})
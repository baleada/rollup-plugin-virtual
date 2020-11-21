import { existsSync, unlinkSync, readFileSync } from 'fs'
import { resolve } from 'path'
import { rollup } from 'rollup'
import test from 'ava';
import plugin from '../src/index.js'

const outputOptions = {
        file: 'tests/plugin-output/rollup.js',
        format: 'esm',
      },
      withVirtualSourceRegexp = new RegExp(`tests/stubs/virtual`)

test('uses the transform callback', async t => {
  // Remove any previous plugin output
  if (existsSync('tests/plugin-output/rollup.js')) {
    unlinkSync('tests/plugin-output/rollup.js', err => {
      throw err
    })
  }

  const bundle = await rollup({
    input: 'tests/stubs/virtual',
    plugins: [
      plugin({
        test: ({ id }) => id.endsWith('virtual'),
        transform: ({ id }) => `export default '${id}'`
      })
    ]
  })

  await bundle.write(outputOptions)

  const value = readFileSync('./tests/plugin-output/rollup.js', 'utf8')

  t.assert(withVirtualSourceRegexp.test(value))
})

test('passes the id without the internally added prefix recommend by Rollup',  async t => {
  // Remove any previous plugin output
  if (existsSync('tests/plugin-output/rollup.js')) {
    unlinkSync('tests/plugin-output/rollup.js', err => {
      throw err
    })
  }

  let passedId

  const bundle = await rollup({
    input: 'tests/stubs/virtual',
    plugins: [
      plugin({
        test: ({ id }) => {
          passedId = id
          return id.endsWith('virtual')
        },
        transform: ({ id }) => `export default '${id}'`
      })
    ]
  })

  await bundle.write(outputOptions)

  t.is(passedId, 'tests/stubs/virtual')
})

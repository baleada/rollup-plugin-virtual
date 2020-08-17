import { existsSync, unlinkSync, readFileSync } from 'fs'
import { resolve } from 'path'
import { rollup } from 'rollup'
import test from 'ava';
import plugin from '../src/index.js'

const inputOptions = {
        input: 'tests/stubs/virtual',
        plugins: [
          plugin({
            test: ({ id }) => id.endsWith('virtual'),
            transform: ({ id }) => `export default '${id}'`
          })
        ]
      },
      outputOptions = {
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

  const bundle = await rollup(inputOptions)
  await bundle.write(outputOptions)

  const value = readFileSync('./tests/plugin-output/rollup.js', 'utf8')

  t.assert(withVirtualSourceRegexp.test(value))
})

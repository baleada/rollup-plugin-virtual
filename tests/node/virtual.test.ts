import { suite as createSuite } from 'uvu'
import * as assert from 'uvu/assert'
import { virtual } from '../../src/index'
import { unlinkSync, readFileSync } from 'fs'
import { rollup } from 'rollup'

const suite = createSuite('virtual (node)')

const outputOptions = {
        file: 'tests/fixtures/output.js',
        format: 'esm' as const,
      },
      withVirtualSourceRegexp = new RegExp(`tests/stubs/virtual`)

suite(`transforms virtual sources`, async () => {
  // Remove any previous output
  try {
    unlinkSync('tests/fixtures/output.js')
  } catch (error) {
    if (!/no such file/.test(error.message)) {
      throw error
    }
  }

  const bundle = await rollup({
    input: 'tests/stubs/virtual',
    plugins: [
      virtual({
        test: ({ id }) => id.endsWith('virtual'),
        transform: ({ id }) => `export default '${id}'`
      })
    ]
  })
  await bundle.write(outputOptions)

  const value = readFileSync('./tests/fixtures/output.js', 'utf8')

  assert.ok(withVirtualSourceRegexp.test(value))
})

suite(`passes the id without the internally added prefix recommend by Rollup`, async () => {
  // Remove any previous output
  try {
    unlinkSync('tests/fixtures/output.js')
  } catch (error) {
    if (!/no such file/.test(error.message)) {
      throw error
    }
  }

  let passedId: string
  
  const bundle = await rollup({
    input: 'tests/stubs/virtual',
    plugins: [
      virtual({
        test: ({ id }) => {
          passedId = id
          return id.endsWith('virtual')
        },
        transform: ({ id }) => `export default '${id}'`
      })
    ]
  })
  
  await bundle.write(outputOptions)
  
  assert.is(passedId, 'tests/stubs/virtual')
})

suite.run()

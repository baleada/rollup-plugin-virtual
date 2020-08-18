// Adapted from https://github.com/rollup/plugins/blob/master/packages/virtual/src/index.js
import { parse, resolve } from 'path'
import { existsSync } from 'fs'
import pluginUtils from '@rollup/pluginutils'
import { clipable } from '@baleada/logic'

const { createFilter } = pluginUtils

export default function virtual (options = {}) {
  const { transform, include, exclude, test: rawTest } = options,
        test = resolveTest(include, exclude, rawTest)

  return {
    name: 'virtual',
    resolveId (rawId, rawImporter) {
      const id = withoutQuery(rawId)

      // Handle absolute paths
      if (test({ id, createFilter })) {
        return withPrefix(id)
      }

      // Handle relative paths
      if (rawImporter) {
        const importer = withoutQuery(withoutPrefix(rawImporter)),
              // If importer looks like a dir and exists, it's a dir.
              //
              // If importer looks like a dir but doesn't exist, it's a
              // fuzzy path to a virtual file
              dir = existsSync(id) ? id : fromFile(importer),
              resolved = resolve(dir, id)
        
        if (test({ id: resolved, createFilter })) {
          return withPrefix(resolved)
        }
      }

      return null // Defer to other resolveId functions
    },
    async load (id) {
      if (test({ id: withoutQuery(withoutPrefix(id)), createFilter })) {
        return await transform({
          id: withoutQuery(withoutPrefix(id)),
          context: this,
          utils: pluginUtils,
        })
      }

      return null // Defer to other load functions
    }
  }
}

function resolveTest (include, exclude, test) {
  return typeof test === 'function'
    ? test
    : ({ id, createFilter }) => createFilter(include, exclude)(id)
}

const queryRE = /\?.*$/
function withoutQuery (id) {
  return clipable(id).clip(queryRE).toString()
}

function withPrefix (id) {
  return `\0virtual:` + id // As recommended by https://rollupjs.org/guide/en/#conventions
}

function withoutPrefix (id) {
  return clipable(id).clip(/^\0virtual:/).toString() // As recommended by https://rollupjs.org/guide/en/#conventions
}

function fromFile (id) {
  const { base } = parse(id),
        baseRE = new RegExp(`/${base}$`)
  return clipable(id).clip(baseRE).toString()
}

// Adapted from https://github.com/rollup/plugins/blob/master/packages/virtual/src/index.js
import { parse, resolve } from 'path'
import { existsSync } from 'fs'
import pluginUtils from '@rollup/pluginutils'
import { parse as parseQuery } from 'query-string'
import type { ParsedQuery } from 'query-string'
import type { LoadResult, Plugin, PluginContext } from 'rollup'
import type { FilterPattern } from '@rollup/pluginutils'

const { createFilter } = pluginUtils

export type Options = {
  transform?: ((api: Api) => LoadResult) | ((api: Api) => Promise<LoadResult>),
  include?: FilterPattern,
  exclude?: FilterPattern,
  test?: Test,
  prefixesId?: boolean,
}

type Test = (api: TestApi) => boolean

type TestApi = {
  id?: string,
  source?: string,
  query?: ParsedQuery<string>,
}

export type Api = {
  id: string,
  context: PluginContext,
  utils: typeof pluginUtils
}

const defaultOptions: Options = {
  transform: () => '',
  prefixesId: false,
}

export function virtual (options: Options = {}): Plugin {
  const { transform, include, exclude, test: rawTest, prefixesId } = { ...defaultOptions, ...options },
        test = ensureTest({ include, exclude, rawTest })

  return {
    name: 'virtual',
    resolveId (rawId, rawImporter) {
      const id = withoutQuery(rawId),
            query = toQuery(rawId)

      // Handle absolute paths
      if (test({ id, query })) {
        return prefixesId ? withPrefix(id) : id
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
        
        if (test({ id: resolved, query })) {
          return prefixesId ? withPrefix(resolved) : resolved
        }
      }

      return null // Defer to other resolveId functions
    },
    async load (id) {
      if (test({ id: withoutQuery(withoutPrefix(id)), query: toQuery(id) })) {
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

function ensureTest ({ include, exclude, rawTest }: { include?: FilterPattern, exclude?: FilterPattern, rawTest?: Test }): Test {
  if (typeof rawTest === 'function') {
    return rawTest
  }

  const filter = createFilter(include, exclude)
  return ({ id }) => filter(id)
}

const queryRE = /(\?.*$)/
function withoutQuery (id: string): string {
  return id.replace(queryRE, '')
}

function toQuery (id: string): ParsedQuery<string> {
  return parseQuery(id.match(queryRE)?.[1])
}

function withPrefix (id: string): string {
  return `\0virtual:` + id
}

const virtualPrefixRE = new RegExp('\0virtual:')
function withoutPrefix (id: string): string {
  return id.replace(virtualPrefixRE, '')
}

function fromFile (id: string): string {
  const { base } = parse(id),
        baseRE = new RegExp(`/${base}$`)
  return id.replace(baseRE, '')
}

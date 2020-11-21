import babel, { getBabelOutputPlugin } from '@rollup/plugin-babel'
import resolve from '@rollup/plugin-node-resolve'

const external = [
        '@rollup/pluginutils',
        'path',
        'fs',
      ],
      plugins = [
        babel({
          exclude: 'node_modules',
          babelHelpers: 'runtime',
        }),
        resolve(),
      ]

export default [
  {
    external,
    input: 'src/index.js',
    output: [
      { file: 'lib/index.esm.js', format: 'esm' },
      {
        file: 'lib/index.js',
        format: 'cjs',
        plugins: [
          getBabelOutputPlugin({
            plugins: [
              ['@babel/plugin-transform-runtime', { useESModules: false }]
            ]
          })
        ]
      },
    ],
    plugins,
  },
]

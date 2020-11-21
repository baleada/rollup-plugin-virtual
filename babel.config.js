const presets = [
        [
          '@babel/preset-env',
          {
            targets: {
              node: true,
            },
          },
        ],
      ],
      plugins = [
        [
          '@babel/plugin-transform-runtime',
          { useESModules: true },
        ]
      ]

module.exports = { presets, plugins }

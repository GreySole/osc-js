import babel from 'rollup-plugin-babel'
import cleanup from 'rollup-plugin-cleanup'
import { uglify } from 'rollup-plugin-uglify'

function rollupPlugins(isUglified = false) {
  const plugins = [
    babel({
      exclude: 'node_modules/**',
    }),
    cleanup(),
  ]

  return isUglified ? plugins.concat(uglify()) : plugins
}

function buildOptions(customOptions = {}) {
  const { input, file, isUglified } = customOptions

  const defaultOptions = {
    input: input || 'entry/osc.js',
    plugins: isUglified ? rollupPlugins(true) : rollupPlugins(),
    output: {
      file: file || 'lib/osc.js',
      name: 'OSC',
      format: 'umd',
      sourcemap: isUglified || false,
    },
  }

  return defaultOptions
}

export default [
  buildOptions(),
  buildOptions({
    input: 'entry/osc.browser.js',
    file: 'lib/osc.browser.js',
  }),
  buildOptions({
    input: 'entry/osc.browser.js',
    file: 'lib/osc.browser.min.js',
    isUglified: true,
  }),
]

const {readFileSync} = require('fs')
const process = require('process')

const dotenv = require('dotenv')

function parseDotenvFile(path) {
  let content

  try {
    content = readFileSync(path)
  } catch {
    // The env file does not exist.
    return {}
  }

  return dotenv.parse(content)
}

module.exports = ({types: t}) => ({
  name: 'dotenv-import',

  pre() {
    this.opts = {
      moduleName: '@env',
      path: '.env',
      allowlist: null,
      blocklist: null,
      safe: false,
      allowUndefined: false,
      ...this.opts,
    }

    if (this.opts.safe) {
      this.env = parseDotenvFile(this.opts.path)
    } else {
      dotenv.config({
        path: this.opts.path,
      })
      this.env = process.env
    }
  },

  visitor: {
    ImportDeclaration(path, {opts}) {
      if (path.node.source.value === opts.moduleName) {
        for (const [idx, specifier] of path.node.specifiers.entries()) {
          if (specifier.type === 'ImportDefaultSpecifier') {
            throw path.get('specifiers')[idx].buildCodeFrameError('Default import is not supported')
          }

          if (specifier.type === 'ImportNamespaceSpecifier') {
            throw path
              .get('specifiers')
              [idx].buildCodeFrameError('Wildcard import is not supported')
          }

          const importedId = specifier.imported.name
          const localId = specifier.local.name

          if (Array.isArray(opts.allowlist) && !opts.allowlist.includes(importedId)) {
            throw path
              .get('specifiers')
              [idx].buildCodeFrameError(`"${importedId}" was not allowlisted`)
          }

          if (Array.isArray(opts.blocklist) && opts.blocklist.includes(importedId)) {
            throw path.get('specifiers')[idx].buildCodeFrameError(`"${importedId}" was blocklisted`)
          }

          if (!opts.allowUndefined && !Object.prototype.hasOwnProperty.call(this.env, importedId)) {
            throw path
              .get('specifiers')
              [idx].buildCodeFrameError(`"${importedId}" is not defined in ${opts.path}`)
          }

          const binding = path.scope.getBinding(localId)
          for (const refPath of binding.referencePaths) {
            refPath.replaceWith(t.valueToNode(this.env[importedId]))
          }
        }

        path.remove()
      }
    },
  },
})

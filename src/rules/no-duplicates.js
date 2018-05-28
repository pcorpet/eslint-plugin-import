import resolve from 'eslint-module-utils/resolve'
import docsUrl from '../docsUrl'

function checkImports(imported, context) {
  for (let [module, nodes] of imported.entries()) {
    if (nodes.size > 1) {
      for (let node of nodes) {
        context.report(node, `'${module}' imported multiple times.`)
      }
    }
  }
}

module.exports = {
  meta: {
    docs: {
      url: docsUrl('no-duplicates'),
    },
    schema: [
      {
        type: 'object',
        properties: {
          considerQueryString: {
            type: 'boolean',
          },
        },
        additionalProperties: false,
      },
    ],
  },

  create: function (context) {
    // Prepare the resolver from options.
    const considerQueryStringOption = context.options[0] &&
      context.options[0]['considerQueryString']
    const defaultResolver = sourcePath => resolve(sourcePath, context) || sourcePath
    const resolver = considerQueryStringOption ? (sourcePath => {
      const parts = sourcePath.match(/^([^?]*)\?(.*)$/)
      if (!parts) {
        return defaultResolver(sourcePath)
      }
      return defaultResolver(parts[1]) + '?' + parts[2]
    }) : defaultResolver

    const imported = new Map()
    const typesImported = new Map()
    return {
      'ImportDeclaration': function (n) {
        // resolved path will cover aliased duplicates
        const resolvedPath = resolver(n.source.value)
        const importMap = n.importKind === 'type' ? typesImported : imported

        if (importMap.has(resolvedPath)) {
          importMap.get(resolvedPath).add(n.source)
        } else {
          importMap.set(resolvedPath, new Set([n.source]))
        }
      },

      'Program:exit': function () {
        checkImports(imported, context)
        checkImports(typesImported, context)
      },
    }
  },
}

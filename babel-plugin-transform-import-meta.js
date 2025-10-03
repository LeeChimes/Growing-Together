module.exports = function ({ types: t }) {
  return {
    name: 'transform-import-meta-to-global',
    visitor: {
      MetaProperty(path) {
        if (
          path.node.meta?.name === 'import' &&
          path.node.property?.name === 'meta'
        ) {
          path.replaceWith(
            t.objectExpression([
              t.objectProperty(
                t.identifier('env'),
                t.logicalExpression(
                  '||',
                  t.memberExpression(t.identifier('process'), t.identifier('env')),
                  t.memberExpression(t.identifier('globalThis'), t.identifier('__import_meta_env__'))
                )
              )
            ])
          );
        }
      }
    }
  };
};


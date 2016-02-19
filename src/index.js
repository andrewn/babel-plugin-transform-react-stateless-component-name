import {basename, dirname} from 'path';

export const isArrowFunction = ({type}) => type === 'ArrowFunctionExpression';
export const isFunctionDeclaration = ({type}) => type === 'FunctionDeclaration';
export const isFunction = ({type}) => isArrowFunction({type}) || isFunctionDeclaration({type});

export const isTypeJSX = ({type}) => type === 'JSXElement';

export const doesReturnJSX = ({body}) => {
  if (isTypeJSX(body)) {
    return true;
  }

  const block = body.body;

  if (block.length) {
    return isTypeJSX(block.slice(0).pop().argument);
  }

  return false;
};

export default function({types: t}) {
  return {
    visitor: {
      ExportDefaultDeclaration(path, state) {
        const node = path.node;
        if (isFunction(node.declaration)) {
          if (doesReturnJSX(node.declaration)) {
            let displayName = state.file.opts.basename;

            // ./{module name}/index.js
            if (displayName === 'index') {
              displayName = basename(dirname(state.file.opts.filename));
            }

            // set display name
            node.declaration.id = t.identifier(displayName);

            // ArrowExpressions are fine, Function Declarations
            // need to be converted to expressions
            // e.g. export default function () {}
            //
            let declaration = node.declaration;
            if (t.isFunctionDeclaration(node.declaration)) {
              declaration = t.functionExpression(declaration.id, declaration.params, declaration.body);
            }

            const displayNameIdentifier = t.identifier(displayName);

            // Assign the stateless component function to
            // a let variable
            // Turns: exports default () => <img />;
            // into:  let X = () => <img />
            const letVariable = t.variableDeclaration(
              'let',
              [
                t.variableDeclarator(
                  displayNameIdentifier,
                  declaration
                ),
              ]
            );

            // Assign the display name to the new variables
            // displayName property
            const left = t.memberExpression(
              displayNameIdentifier,
              t.identifier('displayName')
            );
            const right = t.stringLiteral(displayName);

            const assignment = t.expressionStatement(
              t.assignmentExpression('=', left, right)
            );

            // Export the variable
            const exportDeclaration = t.exportDefaultDeclaration(displayNameIdentifier);

            // Replace the existing export with our new set
            // of statements
            path.replaceWithMultiple([
              letVariable,
              assignment,
              exportDeclaration,
            ]);
          }
        }
      },
    },
  };
}

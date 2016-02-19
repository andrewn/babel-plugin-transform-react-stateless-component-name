'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.doesReturnJSX = exports.isTypeJSX = exports.isFunction = exports.isFunctionDeclaration = exports.isArrowFunction = undefined;

exports.default = function (_ref6) {
  var t = _ref6.types;

  return {
    visitor: {
      ExportDefaultDeclaration: function ExportDefaultDeclaration(path, state) {
        var node = path.node;
        if (isFunction(node.declaration)) {
          if (doesReturnJSX(node.declaration)) {
            var displayName = state.file.opts.basename;

            // ./{module name}/index.js
            if (displayName === 'index') {
              displayName = (0, _path.basename)((0, _path.dirname)(state.file.opts.filename));
            }

            // set display name
            node.declaration.id = t.identifier(displayName);

            // ArrowExpressions are fine, Function Declarations
            // need to be converted to expressions
            // e.g. export default function () {}
            //
            var declaration = node.declaration;
            if (t.isFunctionDeclaration(node.declaration)) {
              declaration = t.functionExpression(declaration.id, declaration.params, declaration.body);
            }

            var displayNameIdentifier = t.identifier(displayName);

            // Assign the stateless component function to
            // a let variable
            // Turns: exports default () => <img />;
            // into:  let X = () => <img />
            var letVariable = t.variableDeclaration('let', [t.variableDeclarator(displayNameIdentifier, declaration)]);

            // Assign the display name to the new variables
            // displayName property
            var left = t.memberExpression(displayNameIdentifier, t.identifier('displayName'));
            var right = t.stringLiteral(displayName);

            var assignment = t.expressionStatement(t.assignmentExpression('=', left, right));

            // Export the variable
            var exportDeclaration = t.exportDefaultDeclaration(displayNameIdentifier);

            // Replace the existing export with our new set
            // of statements
            path.replaceWithMultiple([letVariable, assignment, exportDeclaration]);
          }
        }
      }
    }
  };
};

var _path = require('path');

var isArrowFunction = exports.isArrowFunction = function isArrowFunction(_ref) {
  var type = _ref.type;
  return type === 'ArrowFunctionExpression';
};
var isFunctionDeclaration = exports.isFunctionDeclaration = function isFunctionDeclaration(_ref2) {
  var type = _ref2.type;
  return type === 'FunctionDeclaration';
};
var isFunction = exports.isFunction = function isFunction(_ref3) {
  var type = _ref3.type;
  return isArrowFunction({ type: type }) || isFunctionDeclaration({ type: type });
};

var isTypeJSX = exports.isTypeJSX = function isTypeJSX(_ref4) {
  var type = _ref4.type;
  return type === 'JSXElement';
};

var doesReturnJSX = exports.doesReturnJSX = function doesReturnJSX(_ref5) {
  var body = _ref5.body;

  if (isTypeJSX(body)) {
    return true;
  }

  var block = body.body;

  if (block.length) {
    return isTypeJSX(block.slice(0).pop().argument);
  }

  return false;
};
/**
 * Function Analyzer
 * Extracts information from JavaScript/TypeScript functions
 */

import type { NodePath } from '@babel/traverse';
import * as t from '@babel/types';
import { extractTypes } from '../parser/typeExtractor';
import type { FunctionInfo, ParamInfo } from '../types';

/**
 * Analyze a function and extract its information
 */
export function analyzeFunction(
  nodePath: NodePath<t.FunctionDeclaration | t.VariableDeclarator>,
  filePath: string
): FunctionInfo | null {
  let name: string;
  let funcNode: t.FunctionDeclaration | t.ArrowFunctionExpression | t.FunctionExpression;

  if (t.isFunctionDeclaration(nodePath.node)) {
    if (!nodePath.node.id) return null;
    name = nodePath.node.id.name;
    funcNode = nodePath.node;
  } else if (t.isVariableDeclarator(nodePath.node)) {
    if (!t.isIdentifier(nodePath.node.id)) return null;
    if (
      !t.isArrowFunctionExpression(nodePath.node.init) &&
      !t.isFunctionExpression(nodePath.node.init)
    ) {
      return null;
    }
    name = nodePath.node.id.name;
    funcNode = nodePath.node.init;
  } else {
    return null;
  }

  // Extract parameters
  const params = extractParams(funcNode);

  // Extract return type
  const returnType = extractReturnType(funcNode);

  // Check if async
  const isAsync = funcNode.async || false;

  // Check if exported
  const parent = nodePath.parent;
  const isExported =
    t.isExportNamedDeclaration(parent) ||
    t.isExportDefaultDeclaration(parent) ||
    (t.isVariableDeclaration(parent) &&
      nodePath.parentPath &&
      (t.isExportNamedDeclaration(nodePath.parentPath.parent) ||
        t.isExportDefaultDeclaration(nodePath.parentPath.parent)));

  return {
    name,
    params,
    returnType,
    isAsync,
    isExported,
    imports: [], // Filled by file analyzer
    filePath,
  };
}

/**
 * Extract function parameters
 */
function extractParams(
  node: t.FunctionDeclaration | t.ArrowFunctionExpression | t.FunctionExpression
): ParamInfo[] {
  const params: ParamInfo[] = [];

  for (const param of node.params) {
    // Simple identifier: (name)
    if (t.isIdentifier(param)) {
      params.push({
        name: param.name,
        type: extractTypes(param.typeAnnotation),
        optional: false,
      });
    }

    // Assignment pattern with default: (name = 'default')
    if (t.isAssignmentPattern(param)) {
      if (t.isIdentifier(param.left)) {
        params.push({
          name: param.left.name,
          type: extractTypes(param.left.typeAnnotation),
          optional: true,
          defaultValue: getDefaultValueString(param.right),
        });
      }
    }

    // Rest parameter: (...args)
    if (t.isRestElement(param)) {
      if (t.isIdentifier(param.argument)) {
        params.push({
          name: `...${param.argument.name}`,
          type: extractTypes(param.typeAnnotation) || 'any[]',
          optional: true,
        });
      }
    }

    // Object pattern: ({ a, b })
    if (t.isObjectPattern(param)) {
      const propNames = param.properties
        .filter((p): p is t.ObjectProperty => t.isObjectProperty(p))
        .map((p) => (t.isIdentifier(p.key) ? p.key.name : ''))
        .filter(Boolean)
        .join(', ');

      params.push({
        name: `{ ${propNames} }`,
        type: extractTypes(param.typeAnnotation),
        optional: false,
      });
    }

    // Array pattern: ([a, b])
    if (t.isArrayPattern(param)) {
      params.push({
        name: '[...]',
        type: extractTypes(param.typeAnnotation),
        optional: false,
      });
    }
  }

  return params;
}

/**
 * Extract return type from function
 */
function extractReturnType(
  node: t.FunctionDeclaration | t.ArrowFunctionExpression | t.FunctionExpression
): string {
  if (node.returnType) {
    return extractTypes(node.returnType);
  }

  // For async functions, wrap in Promise
  if (node.async) {
    return 'Promise<any>';
  }

  return 'any';
}

/**
 * Get string representation of a default value
 */
function getDefaultValueString(node: t.Expression): string {
  if (t.isStringLiteral(node)) return `'${node.value}'`;
  if (t.isNumericLiteral(node)) return String(node.value);
  if (t.isBooleanLiteral(node)) return String(node.value);
  if (t.isNullLiteral(node)) return 'null';
  if (t.isIdentifier(node) && node.name === 'undefined') return 'undefined';
  if (t.isArrayExpression(node)) return '[]';
  if (t.isObjectExpression(node)) return '{}';
  return 'undefined';
}


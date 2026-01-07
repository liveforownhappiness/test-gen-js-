/**
 * Component Analyzer
 * Extracts information from React/React Native components
 */

import type { NodePath } from '@babel/traverse';
import traverse from '@babel/traverse';
import * as t from '@babel/types';
import { extractTypes } from '../parser/typeExtractor';
import type { ComponentInfo, PropInfo } from '../types';

/**
 * Analyze a component and extract its information
 */
export function analyzeComponent(
  nodePath: NodePath<t.FunctionDeclaration | t.VariableDeclarator>,
  filePath: string
): ComponentInfo | null {
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

  // Extract props
  const props = extractProps(funcNode);

  // Extract hooks
  const hooks = extractHooks(funcNode);

  // Extract event handlers
  const events = extractEvents(funcNode);

  // Check if component accepts children
  const children = props.some((p) => p.name === 'children');

  return {
    name,
    type: t.isFunctionDeclaration(funcNode)
      ? 'function'
      : t.isArrowFunctionExpression(funcNode)
        ? 'arrow'
        : 'function',
    props,
    hooks,
    events,
    children,
    imports: [], // Filled by file analyzer
    filePath,
  };
}

/**
 * Extract props from a function component
 */
function extractProps(
  node: t.FunctionDeclaration | t.ArrowFunctionExpression | t.FunctionExpression
): PropInfo[] {
  const props: PropInfo[] = [];
  const firstParam = node.params[0];

  if (!firstParam) return props;

  // Destructured props: ({ title, onPress })
  if (t.isObjectPattern(firstParam)) {
    for (const prop of firstParam.properties) {
      if (t.isObjectProperty(prop) && t.isIdentifier(prop.key)) {
        const propInfo: PropInfo = {
          name: prop.key.name,
          type: 'any',
          required: true,
        };

        // Check for default value
        if (t.isAssignmentPattern(prop.value)) {
          propInfo.required = false;
          propInfo.defaultValue = getDefaultValueString(prop.value.right);
        }

        // Check for type annotation
        if (t.isIdentifier(prop.value) && prop.value.typeAnnotation) {
          propInfo.type = extractTypes(prop.value.typeAnnotation);
        }

        props.push(propInfo);
      }
    }

    // Check for TypeScript type annotation on the parameter
    if (firstParam.typeAnnotation && t.isTSTypeAnnotation(firstParam.typeAnnotation)) {
      const typeNode = firstParam.typeAnnotation.typeAnnotation;
      if (t.isTSTypeLiteral(typeNode)) {
        for (const member of typeNode.members) {
          if (t.isTSPropertySignature(member)) {
            const key = member.key;
            if (t.isIdentifier(key)) {
              const existingProp = props.find((p) => p.name === key.name);
              if (existingProp && member.typeAnnotation) {
                existingProp.type = extractTypes(member.typeAnnotation);
                existingProp.required = !member.optional;
              }
            }
          }
        }
      }
    }
  }

  // Props as identifier: (props)
  if (t.isIdentifier(firstParam)) {
    // Can't extract individual props without type info
    // Check for TypeScript type annotation
    if (firstParam.typeAnnotation && t.isTSTypeAnnotation(firstParam.typeAnnotation)) {
      const typeNode = firstParam.typeAnnotation.typeAnnotation;
      if (t.isTSTypeLiteral(typeNode)) {
        for (const member of typeNode.members) {
          if (t.isTSPropertySignature(member)) {
            const key = member.key;
            if (t.isIdentifier(key)) {
              props.push({
                name: key.name,
                type: extractTypes(member.typeAnnotation),
                required: !member.optional,
              });
            }
          }
        }
      }
    }
  }

  return props;
}

/**
 * Extract hooks used in the component
 */
function extractHooks(
  node: t.FunctionDeclaration | t.ArrowFunctionExpression | t.FunctionExpression
): string[] {
  const hooks: Set<string> = new Set();

  const body = t.isBlockStatement(node.body) ? node.body : null;
  if (!body) return [];

  traverse(
    body,
    {
      CallExpression(path) {
        if (t.isIdentifier(path.node.callee)) {
          const name = path.node.callee.name;
          if (name.startsWith('use')) {
            hooks.add(name);
          }
        }
      },
    },
    undefined,
    { node: body }
  );

  return Array.from(hooks);
}

/**
 * Extract event handler props (onPress, onClick, etc.)
 */
function extractEvents(
  node: t.FunctionDeclaration | t.ArrowFunctionExpression | t.FunctionExpression
): string[] {
  const events: Set<string> = new Set();
  const props = extractProps(node);

  // Check props for event handlers
  for (const prop of props) {
    if (
      prop.name.startsWith('on') &&
      prop.name.length > 2 &&
      prop.name[2] === prop.name[2].toUpperCase()
    ) {
      events.add(prop.name);
    }
  }

  return Array.from(events);
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


/**
 * Component Analyzer
 * Extracts information from React/React Native components
 */

import type { NodePath } from '@babel/traverse';
import * as t from '@babel/types';
import { extractTypes } from '../parser/typeExtractor';
import type { ComponentInfo, PropInfo } from '../types';

/**
 * Analyze a HOC-wrapped component (memo, forwardRef, etc.)
 */
export function analyzeHOCComponent(
  funcNode: t.ArrowFunctionExpression | t.FunctionExpression,
  componentName: string,
  filePath: string,
  hocName: string
): ComponentInfo {
  // For forwardRef, the second parameter is the ref
  // For memo, it's just the regular props
  const isForwardRef = hocName === 'forwardRef';

  // Extract props (first parameter)
  const props = extractPropsFromFunc(funcNode, isForwardRef);

  // Extract hooks
  const hooks = extractHooks(funcNode);

  // Extract event handlers
  const events = extractEventsFromProps(props);

  // Check if component accepts children
  const children = props.some((p) => p.name === 'children');

  return {
    name: componentName,
    type: 'arrow',
    props,
    hooks,
    events,
    children,
    imports: [],
    filePath,
  };
}

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
  return extractPropsFromFunc(node, false);
}

/**
 * Extract props from a function (can handle forwardRef which has ref as second param)
 */
function extractPropsFromFunc(
  node: t.FunctionDeclaration | t.ArrowFunctionExpression | t.FunctionExpression,
  _isForwardRef: boolean = false
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

  // Use recursive walk instead of traverse to avoid scope issues
  findHooks(body, hooks);

  return Array.from(hooks);
}

/**
 * Recursively find hook calls in a node
 */
function findHooks(node: t.Node, hooks: Set<string>): void {
  // Check if this is a hook call
  if (t.isCallExpression(node)) {
    if (t.isIdentifier(node.callee)) {
      const name = node.callee.name;
      if (name.startsWith('use')) {
        hooks.add(name);
      }
    }
  }

  // Recursively check all child nodes
  const keys = t.VISITOR_KEYS[node.type] || [];
  for (const key of keys) {
    const child = (node as unknown as Record<string, unknown>)[key];
    if (Array.isArray(child)) {
      for (const c of child) {
        if (c && typeof c === 'object' && 'type' in c) {
          findHooks(c as t.Node, hooks);
        }
      }
    } else if (child && typeof child === 'object' && 'type' in child) {
      findHooks(child as t.Node, hooks);
    }
  }
}

/**
 * Extract event handler props (onPress, onClick, etc.)
 */
function extractEvents(
  node: t.FunctionDeclaration | t.ArrowFunctionExpression | t.FunctionExpression
): string[] {
  const props = extractProps(node);
  return extractEventsFromProps(props);
}

/**
 * Extract event handlers from props array
 */
function extractEventsFromProps(props: PropInfo[]): string[] {
  const events: Set<string> = new Set();

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


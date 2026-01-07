/**
 * Type Extractor
 * Extracts TypeScript type information from AST nodes
 */

import * as t from '@babel/types';

/**
 * Extract type string from a TypeScript type annotation
 */
export function extractTypes(node: t.Node | null | undefined): string {
  if (!node) {
    return 'any';
  }

  // Type annotation wrapper
  if (t.isTSTypeAnnotation(node)) {
    return extractTypes(node.typeAnnotation);
  }

  // Basic types
  if (t.isTSStringKeyword(node)) return 'string';
  if (t.isTSNumberKeyword(node)) return 'number';
  if (t.isTSBooleanKeyword(node)) return 'boolean';
  if (t.isTSAnyKeyword(node)) return 'any';
  if (t.isTSVoidKeyword(node)) return 'void';
  if (t.isTSNullKeyword(node)) return 'null';
  if (t.isTSUndefinedKeyword(node)) return 'undefined';
  if (t.isTSNeverKeyword(node)) return 'never';
  if (t.isTSUnknownKeyword(node)) return 'unknown';
  if (t.isTSObjectKeyword(node)) return 'object';

  // Array type
  if (t.isTSArrayType(node)) {
    return `${extractTypes(node.elementType)}[]`;
  }

  // Type reference (e.g., React.FC, CustomType)
  if (t.isTSTypeReference(node)) {
    if (t.isIdentifier(node.typeName)) {
      return node.typeName.name;
    }
    if (t.isTSQualifiedName(node.typeName)) {
      return `${extractQualifiedName(node.typeName)}`;
    }
    return 'unknown';
  }

  // Union type (e.g., string | number)
  if (t.isTSUnionType(node)) {
    return node.types.map(extractTypes).join(' | ');
  }

  // Intersection type (e.g., A & B)
  if (t.isTSIntersectionType(node)) {
    return node.types.map(extractTypes).join(' & ');
  }

  // Literal types (e.g., 'success' | 'error')
  if (t.isTSLiteralType(node)) {
    if (t.isStringLiteral(node.literal)) {
      return `'${node.literal.value}'`;
    }
    if (t.isNumericLiteral(node.literal)) {
      return String(node.literal.value);
    }
    if (t.isBooleanLiteral(node.literal)) {
      return String(node.literal.value);
    }
    return 'literal';
  }

  // Function type
  if (t.isTSFunctionType(node)) {
    return 'Function';
  }

  // Tuple type
  if (t.isTSTupleType(node)) {
    return `[${node.elementTypes.map(extractTypes).join(', ')}]`;
  }

  // Object/Interface type
  if (t.isTSTypeLiteral(node)) {
    return 'object';
  }

  return 'any';
}

/**
 * Extract qualified name (e.g., React.FC -> "React.FC")
 */
function extractQualifiedName(node: t.TSQualifiedName): string {
  const parts: string[] = [];

  if (t.isIdentifier(node.left)) {
    parts.push(node.left.name);
  } else if (t.isTSQualifiedName(node.left)) {
    parts.push(extractQualifiedName(node.left));
  }

  parts.push(node.right.name);

  return parts.join('.');
}

/**
 * Generate a mock value based on type
 */
export function generateMockValue(type: string): string {
  const typeMap: Record<string, string> = {
    string: "'test-string'",
    number: '42',
    boolean: 'true',
    any: 'undefined',
    unknown: 'undefined',
    void: 'undefined',
    null: 'null',
    undefined: 'undefined',
    object: '{}',
    Function: 'jest.fn()',
    array: '[]',
  };

  // Check for array types
  if (type.endsWith('[]')) {
    return '[]';
  }

  // Check for function types
  if (type.includes('=>') || type === 'Function') {
    return 'jest.fn()';
  }

  return typeMap[type] || '{}';
}


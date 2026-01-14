/**
 * File Analyzer
 * Analyzes a file to extract components, functions, and their information
 */

import traverse from '@babel/traverse';
import * as t from '@babel/types';
import path from 'path';
import { parseFile } from '../parser';
import { analyzeComponent, analyzeHOCComponent } from './componentAnalyzer';
import { analyzeFunction } from './functionAnalyzer';
import type {
  FileAnalysis,
  ComponentInfo,
  FunctionInfo,
  ImportInfo,
  Framework,
  FileType,
} from '../types';

// Known React HOC names
const HOC_NAMES = ['memo', 'forwardRef', 'React.memo', 'React.forwardRef', 'lazy', 'React.lazy'];

/**
 * Analyze a single file
 */
export async function analyzeFile(filePath: string): Promise<FileAnalysis> {
  const absolutePath = path.resolve(filePath);
  const ast = await parseFile(absolutePath);

  const components: ComponentInfo[] = [];
  const functions: FunctionInfo[] = [];
  const imports: ImportInfo[] = [];
  const analyzedNames = new Set<string>(); // Track already analyzed components

  // Extract imports
  traverse(ast, {
    ImportDeclaration(nodePath) {
      const source = nodePath.node.source.value;
      const specifiers = nodePath.node.specifiers.map((spec) => {
        if (t.isImportDefaultSpecifier(spec)) {
          return spec.local.name;
        }
        if (t.isImportSpecifier(spec)) {
          return t.isIdentifier(spec.imported) ? spec.imported.name : spec.local.name;
        }
        if (t.isImportNamespaceSpecifier(spec)) {
          return `* as ${spec.local.name}`;
        }
        return '';
      });

      imports.push({
        source,
        specifiers,
        isDefault: nodePath.node.specifiers.some((s) => t.isImportDefaultSpecifier(s)),
      });
    },
  });

  // Analyze components and functions
  traverse(ast, {
    // Function declarations (function MyComponent() {})
    FunctionDeclaration(nodePath) {
      if (!nodePath.node.id) return;

      const name = nodePath.node.id.name;
      if (analyzedNames.has(name)) return;

      const isExported =
        t.isExportNamedDeclaration(nodePath.parent) ||
        t.isExportDefaultDeclaration(nodePath.parent);

      if (isReactComponent(nodePath.node)) {
        const componentInfo = analyzeComponent(nodePath, absolutePath);
        if (componentInfo) {
          components.push(componentInfo);
          analyzedNames.add(name);
        }
      } else if (isExported) {
        const functionInfo = analyzeFunction(nodePath, absolutePath);
        if (functionInfo) {
          functions.push(functionInfo);
          analyzedNames.add(name);
        }
      }
    },

    // Arrow function expressions (const MyComponent = () => {})
    VariableDeclarator(nodePath) {
      if (!t.isIdentifier(nodePath.node.id)) return;
      const name = nodePath.node.id.name;
      if (analyzedNames.has(name)) return;

      const init = nodePath.node.init;
      
      // Check if it's a HOC call: const Component = memo(() => {})
      if (t.isCallExpression(init)) {
        const hocResult = analyzeHOCCall(init, name, absolutePath);
        if (hocResult) {
          components.push(hocResult);
          analyzedNames.add(name);
          return;
        }
      }

      // Regular arrow function or function expression
      if (!t.isArrowFunctionExpression(init) && !t.isFunctionExpression(init)) {
        return;
      }

      // Check if exported
      const variableDeclaration = nodePath.parentPath;
      const isExported =
        variableDeclaration &&
        (t.isExportNamedDeclaration(variableDeclaration.parent) ||
          t.isExportDefaultDeclaration(variableDeclaration.parent));

      if (isReactComponent(init)) {
        const componentInfo = analyzeComponent(nodePath, absolutePath);
        if (componentInfo) {
          components.push(componentInfo);
          analyzedNames.add(name);
        }
      } else if (isExported) {
        const functionInfo = analyzeFunction(nodePath, absolutePath);
        if (functionInfo) {
          functions.push(functionInfo);
          analyzedNames.add(name);
        }
      }
    },

    // Export default with HOC: export default memo(MyComponent)
    ExportDefaultDeclaration(nodePath) {
      const declaration = nodePath.node.declaration;
      
      // export default memo(Component) or export default memo(() => {})
      if (t.isCallExpression(declaration)) {
        const hocResult = analyzeHOCCall(declaration, 'default', absolutePath);
        if (hocResult && !analyzedNames.has(hocResult.name)) {
          components.push(hocResult);
          analyzedNames.add(hocResult.name);
        }
      }
      
      // export default identifier (already handled by FunctionDeclaration)
    },
  });

  // Determine framework and file type
  const framework = detectFramework(imports);
  const fileType = determineFileType(components, functions);

  return {
    filePath: absolutePath,
    fileType,
    framework,
    components,
    functions,
    imports,
  };
}

/**
 * Check if a CallExpression is a HOC call and extract the component
 */
function analyzeHOCCall(
  callExpr: t.CallExpression,
  fallbackName: string,
  filePath: string
): ComponentInfo | null {
  const hocName = getHOCName(callExpr.callee);
  if (!hocName) return null;

  // Get the inner function from HOC arguments
  const innerFunc = extractInnerFunction(callExpr);
  if (!innerFunc) {
    // HOC wrapping an identifier: memo(MyComponent)
    // The actual component will be analyzed separately
    return null;
  }

  // Analyze the inner function as a component
  return analyzeHOCComponent(innerFunc, fallbackName, filePath, hocName);
}

/**
 * Get HOC name from callee
 */
function getHOCName(callee: t.Expression | t.V8IntrinsicIdentifier): string | null {
  // memo(), forwardRef()
  if (t.isIdentifier(callee)) {
    if (HOC_NAMES.includes(callee.name)) {
      return callee.name;
    }
  }

  // React.memo(), React.forwardRef()
  if (t.isMemberExpression(callee)) {
    if (
      t.isIdentifier(callee.object) &&
      callee.object.name === 'React' &&
      t.isIdentifier(callee.property)
    ) {
      const fullName = `React.${callee.property.name}`;
      if (HOC_NAMES.includes(fullName)) {
        return callee.property.name;
      }
    }
  }

  return null;
}

/**
 * Extract the inner function from a HOC call
 * Handles nested HOCs: memo(forwardRef((props, ref) => {}))
 */
function extractInnerFunction(
  callExpr: t.CallExpression
): t.ArrowFunctionExpression | t.FunctionExpression | null {
  const firstArg = callExpr.arguments[0];

  if (!firstArg) return null;

  // Direct function: memo(() => {})
  if (t.isArrowFunctionExpression(firstArg) || t.isFunctionExpression(firstArg)) {
    return firstArg;
  }

  // Nested HOC: memo(forwardRef(() => {}))
  if (t.isCallExpression(firstArg)) {
    const nestedHocName = getHOCName(firstArg.callee);
    if (nestedHocName) {
      return extractInnerFunction(firstArg);
    }
  }

  return null;
}

/**
 * Analyze all files in a directory
 */
export async function analyzeDirectory(
  _dirPath: string,
  _options?: { pattern?: string; exclude?: string[] }
): Promise<FileAnalysis[]> {
  // TODO: Implement directory scanning
  throw new Error('Directory scanning is not yet implemented');
}

/**
 * Check if a function/arrow function is a React component
 */
function isReactComponent(
  node: t.FunctionDeclaration | t.ArrowFunctionExpression | t.FunctionExpression
): boolean {
  // Arrow function with direct JSX return
  if (t.isJSXElement(node.body) || t.isJSXFragment(node.body)) {
    return true;
  }

  // Check if the function body contains JSX using recursive walk
  if (t.isBlockStatement(node.body)) {
    return containsJSX(node.body);
  }

  return false;
}

/**
 * Recursively check if a node contains JSX elements
 */
function containsJSX(node: t.Node): boolean {
  if (t.isJSXElement(node) || t.isJSXFragment(node)) {
    return true;
  }

  // Recursively check all child nodes
  const keys = t.VISITOR_KEYS[node.type] || [];
  for (const key of keys) {
    const child = (node as unknown as Record<string, unknown>)[key];
    if (Array.isArray(child)) {
      for (const c of child) {
        if (c && typeof c === 'object' && 'type' in c && containsJSX(c as t.Node)) {
          return true;
        }
      }
    } else if (child && typeof child === 'object' && 'type' in child) {
      if (containsJSX(child as t.Node)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Detect the framework based on imports
 */
function detectFramework(imports: ImportInfo[]): Framework {
  for (const imp of imports) {
    if (imp.source === 'react-native' || imp.source.startsWith('react-native')) {
      return 'react-native';
    }
    if (imp.source === 'react' || imp.source.startsWith('react')) {
      return 'react';
    }
  }
  return 'vanilla';
}

/**
 * Determine the file type based on contents
 */
function determineFileType(components: ComponentInfo[], functions: FunctionInfo[]): FileType {
  if (components.length > 0) {
    return 'component';
  }
  if (functions.length > 0) {
    return 'function';
  }
  return 'unknown';
}


/**
 * File Analyzer
 * Analyzes a file to extract components, functions, and their information
 */

import traverse from '@babel/traverse';
import * as t from '@babel/types';
import path from 'path';
import { parseFile } from '../parser';
import { analyzeComponent } from './componentAnalyzer';
import { analyzeFunction } from './functionAnalyzer';
import type {
  FileAnalysis,
  ComponentInfo,
  FunctionInfo,
  ImportInfo,
  Framework,
  FileType,
} from '../types';

/**
 * Analyze a single file
 */
export async function analyzeFile(filePath: string): Promise<FileAnalysis> {
  const absolutePath = path.resolve(filePath);
  const ast = await parseFile(absolutePath);

  const components: ComponentInfo[] = [];
  const functions: FunctionInfo[] = [];
  const imports: ImportInfo[] = [];

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
    // Function declarations
    FunctionDeclaration(nodePath) {
      if (!nodePath.node.id) return;

      const name = nodePath.node.id.name;
      const isExported =
        t.isExportNamedDeclaration(nodePath.parent) ||
        t.isExportDefaultDeclaration(nodePath.parent);

      if (isReactComponent(nodePath.node)) {
        const componentInfo = analyzeComponent(nodePath, absolutePath);
        if (componentInfo) {
          components.push(componentInfo);
        }
      } else if (isExported) {
        const functionInfo = analyzeFunction(nodePath, absolutePath);
        if (functionInfo) {
          functions.push(functionInfo);
        }
      }
    },

    // Arrow function expressions (const MyComponent = () => {})
    VariableDeclarator(nodePath) {
      if (!t.isIdentifier(nodePath.node.id)) return;
      if (!t.isArrowFunctionExpression(nodePath.node.init) && !t.isFunctionExpression(nodePath.node.init)) {
        return;
      }

      const name = nodePath.node.id.name;
      const funcNode = nodePath.node.init;

      // Check if exported
      const variableDeclaration = nodePath.parentPath;
      const isExported =
        variableDeclaration &&
        (t.isExportNamedDeclaration(variableDeclaration.parent) ||
          t.isExportDefaultDeclaration(variableDeclaration.parent));

      if (isReactComponent(funcNode)) {
        const componentInfo = analyzeComponent(nodePath, absolutePath);
        if (componentInfo) {
          components.push(componentInfo);
        }
      } else if (isExported) {
        const functionInfo = analyzeFunction(nodePath, absolutePath);
        if (functionInfo) {
          functions.push(functionInfo);
        }
      }
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
  let hasJSX = false;

  // Check if the function body contains JSX
  if (t.isBlockStatement(node.body)) {
    // Function with block body
    traverse(
      node.body,
      {
        JSXElement() {
          hasJSX = true;
        },
        JSXFragment() {
          hasJSX = true;
        },
      },
      undefined,
      { node }
    );
  } else if (t.isJSXElement(node.body) || t.isJSXFragment(node.body)) {
    // Arrow function with direct JSX return
    hasJSX = true;
  }

  return hasJSX;
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


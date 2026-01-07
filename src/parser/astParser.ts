/**
 * AST Parser using Babel
 * Parses JavaScript/TypeScript files into AST for analysis
 */

import * as parser from '@babel/parser';
import type { ParseResult, ParserOptions } from '@babel/parser';
import type { File } from '@babel/types';
import fs from 'fs-extra';
import path from 'path';

/** Parser options for different file types */
const getParserOptions = (filePath: string): ParserOptions => {
  const ext = path.extname(filePath).toLowerCase();
  const isTypeScript = ext === '.ts' || ext === '.tsx';
  const isJSX = ext === '.tsx' || ext === '.jsx';

  return {
    sourceType: 'module',
    plugins: [
      isTypeScript ? 'typescript' : null,
      isJSX || isTypeScript ? 'jsx' : null,
      'decorators-legacy',
      'classProperties',
      'classPrivateProperties',
      'classPrivateMethods',
      'exportDefaultFrom',
      'exportNamespaceFrom',
      'dynamicImport',
      'nullishCoalescingOperator',
      'optionalChaining',
      'objectRestSpread',
    ].filter(Boolean) as ParserOptions['plugins'],
  };
};

/**
 * Parse a file and return the AST
 */
export async function parseFile(filePath: string): Promise<ParseResult<File>> {
  const absolutePath = path.resolve(filePath);

  // Check if file exists
  const exists = await fs.pathExists(absolutePath);
  if (!exists) {
    throw new Error(`File not found: ${absolutePath}`);
  }

  // Read file content
  const code = await fs.readFile(absolutePath, 'utf-8');

  return parseCode(code, filePath);
}

/**
 * Parse code string and return the AST
 */
export function parseCode(code: string, filePath: string = 'unknown.ts'): ParseResult<File> {
  const options = getParserOptions(filePath);

  try {
    return parser.parse(code, options);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to parse ${filePath}: ${error.message}`);
    }
    throw error;
  }
}


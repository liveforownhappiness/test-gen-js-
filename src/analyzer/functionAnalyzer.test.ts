/**
 * Function Analyzer Tests
 */

import { analyzeFunction } from './functionAnalyzer';
import { parseCode } from '../parser/astParser';
import traverse from '@babel/traverse';
import type { NodePath } from '@babel/traverse';
import * as t from '@babel/types';

// Helper to get function node path from code
function getFunctionNodePath(
  code: string,
  functionName?: string
): NodePath<t.FunctionDeclaration | t.VariableDeclarator> | null {
  const ast = parseCode(code, 'test.ts');
  let result: NodePath<t.FunctionDeclaration | t.VariableDeclarator> | null = null;

  traverse(ast, {
    FunctionDeclaration(path) {
      if (!functionName || path.node.id?.name === functionName) {
        result = path as NodePath<t.FunctionDeclaration>;
        path.stop();
      }
    },
    VariableDeclarator(path) {
      if (t.isIdentifier(path.node.id)) {
        if (!functionName || path.node.id.name === functionName) {
          if (
            t.isArrowFunctionExpression(path.node.init) ||
            t.isFunctionExpression(path.node.init)
          ) {
            result = path as NodePath<t.VariableDeclarator>;
            path.stop();
          }
        }
      }
    },
  });

  return result;
}

describe('analyzeFunction', () => {
  const testFilePath = '/test/file.ts';

  describe('Function Declaration', () => {
    it('should analyze simple function declaration', () => {
      const code = `function add(a: number, b: number): number { return a + b; }`;
      const nodePath = getFunctionNodePath(code);

      const result = analyzeFunction(nodePath!, testFilePath);

      expect(result).not.toBeNull();
      expect(result!.name).toBe('add');
      expect(result!.params.length).toBe(2);
      expect(result!.params[0].name).toBe('a');
      expect(result!.params[0].type).toBe('number');
      expect(result!.returnType).toBe('number');
      expect(result!.isAsync).toBe(false);
    });

    it('should analyze async function declaration', () => {
      const code = `async function fetchData(url: string): Promise<any> { return fetch(url); }`;
      const nodePath = getFunctionNodePath(code);

      const result = analyzeFunction(nodePath!, testFilePath);

      expect(result).not.toBeNull();
      expect(result!.name).toBe('fetchData');
      expect(result!.isAsync).toBe(true);
      expect(result!.returnType).toBe('Promise');
    });

    it('should return null for function without id', () => {
      // This case is hard to test directly as parser requires function name
      // We test via anonymous function expression instead
      const code = `const fn = function() {}`;
      const nodePath = getFunctionNodePath(code);

      const result = analyzeFunction(nodePath!, testFilePath);
      expect(result).not.toBeNull();
      expect(result!.name).toBe('fn');
    });
  });

  describe('Arrow Function', () => {
    it('should analyze arrow function', () => {
      const code = `const multiply = (x: number, y: number): number => x * y;`;
      const nodePath = getFunctionNodePath(code);

      const result = analyzeFunction(nodePath!, testFilePath);

      expect(result).not.toBeNull();
      expect(result!.name).toBe('multiply');
      expect(result!.params.length).toBe(2);
      expect(result!.returnType).toBe('number');
    });

    it('should analyze async arrow function', () => {
      const code = `const fetchUser = async (id: string): Promise<User> => { return api.get(id); };`;
      const nodePath = getFunctionNodePath(code);

      const result = analyzeFunction(nodePath!, testFilePath);

      expect(result).not.toBeNull();
      expect(result!.isAsync).toBe(true);
    });

    it('should analyze arrow function without return type', () => {
      const code = `const greet = (name: string) => 'Hello ' + name;`;
      const nodePath = getFunctionNodePath(code);

      const result = analyzeFunction(nodePath!, testFilePath);

      expect(result).not.toBeNull();
      expect(result!.returnType).toBe('any');
    });

    it('should analyze async arrow function without return type', () => {
      const code = `const fetch = async () => { return data; };`;
      const nodePath = getFunctionNodePath(code);

      const result = analyzeFunction(nodePath!, testFilePath);

      expect(result).not.toBeNull();
      expect(result!.returnType).toBe('Promise<any>');
    });
  });

  describe('Function Expression', () => {
    it('should analyze function expression', () => {
      const code = `const divide = function(a: number, b: number): number { return a / b; };`;
      const nodePath = getFunctionNodePath(code);

      const result = analyzeFunction(nodePath!, testFilePath);

      expect(result).not.toBeNull();
      expect(result!.name).toBe('divide');
      expect(result!.params.length).toBe(2);
    });
  });

  describe('Parameter Types', () => {
    it('should handle simple identifier parameters', () => {
      const code = `function test(a: string, b: number, c: boolean) {}`;
      const nodePath = getFunctionNodePath(code);

      const result = analyzeFunction(nodePath!, testFilePath);

      expect(result!.params.length).toBe(3);
      expect(result!.params[0]).toEqual({ name: 'a', type: 'string', optional: false });
      expect(result!.params[1]).toEqual({ name: 'b', type: 'number', optional: false });
      expect(result!.params[2]).toEqual({ name: 'c', type: 'boolean', optional: false });
    });

    it('should handle default parameter values', () => {
      const code = `function greet(name: string = 'World') {}`;
      const nodePath = getFunctionNodePath(code);

      const result = analyzeFunction(nodePath!, testFilePath);

      expect(result!.params.length).toBe(1);
      expect(result!.params[0].name).toBe('name');
      expect(result!.params[0].optional).toBe(true);
      expect(result!.params[0].defaultValue).toBe("'World'");
    });

    it('should handle numeric default values', () => {
      const code = `function count(start: number = 0) {}`;
      const nodePath = getFunctionNodePath(code);

      const result = analyzeFunction(nodePath!, testFilePath);

      expect(result!.params[0].defaultValue).toBe('0');
    });

    it('should handle boolean default values', () => {
      const code = `function toggle(enabled: boolean = true) {}`;
      const nodePath = getFunctionNodePath(code);

      const result = analyzeFunction(nodePath!, testFilePath);

      expect(result!.params[0].defaultValue).toBe('true');
    });

    it('should handle null default value', () => {
      const code = `function init(value: any = null) {}`;
      const nodePath = getFunctionNodePath(code);

      const result = analyzeFunction(nodePath!, testFilePath);

      expect(result!.params[0].defaultValue).toBe('null');
    });

    it('should handle undefined default value', () => {
      const code = `function init(value: any = undefined) {}`;
      const nodePath = getFunctionNodePath(code);

      const result = analyzeFunction(nodePath!, testFilePath);

      expect(result!.params[0].defaultValue).toBe('undefined');
    });

    it('should handle array default value', () => {
      const code = `function init(items: any[] = []) {}`;
      const nodePath = getFunctionNodePath(code);

      const result = analyzeFunction(nodePath!, testFilePath);

      expect(result!.params[0].defaultValue).toBe('[]');
    });

    it('should handle object default value', () => {
      const code = `function init(options: object = {}) {}`;
      const nodePath = getFunctionNodePath(code);

      const result = analyzeFunction(nodePath!, testFilePath);

      expect(result!.params[0].defaultValue).toBe('{}');
    });

    it('should handle rest parameters', () => {
      const code = `function sum(...numbers: number[]) {}`;
      const nodePath = getFunctionNodePath(code);

      const result = analyzeFunction(nodePath!, testFilePath);

      expect(result!.params.length).toBe(1);
      expect(result!.params[0].name).toBe('...numbers');
      expect(result!.params[0].optional).toBe(true);
    });

    it('should handle object destructuring parameters', () => {
      const code = `function process({ name, age }: { name: string; age: number }) {}`;
      const nodePath = getFunctionNodePath(code);

      const result = analyzeFunction(nodePath!, testFilePath);

      expect(result!.params.length).toBe(1);
      expect(result!.params[0].name).toBe('{ name, age }');
    });

    it('should handle array destructuring parameters', () => {
      const code = `function first([a, b]: [string, number]) {}`;
      const nodePath = getFunctionNodePath(code);

      const result = analyzeFunction(nodePath!, testFilePath);

      expect(result!.params.length).toBe(1);
      expect(result!.params[0].name).toBe('[...]');
    });

    it('should handle parameters without type annotation', () => {
      const code = `function test(a, b) {}`;
      const nodePath = getFunctionNodePath(code);

      const result = analyzeFunction(nodePath!, testFilePath);

      expect(result!.params.length).toBe(2);
      expect(result!.params[0].type).toBe('any');
      expect(result!.params[1].type).toBe('any');
    });
  });

  describe('Export Detection', () => {
    it('should detect exported function declaration', () => {
      const code = `export function helper() {}`;
      const ast = parseCode(code, 'test.ts');
      let nodePath: NodePath<t.FunctionDeclaration> | null = null;

      traverse(ast, {
        FunctionDeclaration(path) {
          nodePath = path;
          path.stop();
        },
      });

      const result = analyzeFunction(nodePath!, testFilePath);
      expect(result!.isExported).toBe(true);
    });

    it('should detect export default function', () => {
      const code = `export default function main() {}`;
      const ast = parseCode(code, 'test.ts');
      let nodePath: NodePath<t.FunctionDeclaration> | null = null;

      traverse(ast, {
        FunctionDeclaration(path) {
          nodePath = path;
          path.stop();
        },
      });

      const result = analyzeFunction(nodePath!, testFilePath);
      expect(result!.isExported).toBe(true);
    });

    it('should detect exported arrow function', () => {
      const code = `export const handler = () => {};`;
      const ast = parseCode(code, 'test.ts');
      let nodePath: NodePath<t.VariableDeclarator> | null = null;

      traverse(ast, {
        VariableDeclarator(path) {
          nodePath = path;
          path.stop();
        },
      });

      const result = analyzeFunction(nodePath!, testFilePath);
      expect(result!.isExported).toBe(true);
    });

    it('should detect non-exported function', () => {
      const code = `function internal() {}`;
      const nodePath = getFunctionNodePath(code);

      const result = analyzeFunction(nodePath!, testFilePath);
      expect(result!.isExported).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should return null for non-function variable', () => {
      const code = `const x = 5;`;
      const ast = parseCode(code, 'test.ts');
      let nodePath: NodePath<t.VariableDeclarator> | null = null;

      traverse(ast, {
        VariableDeclarator(path) {
          nodePath = path;
          path.stop();
        },
      });

      const result = analyzeFunction(nodePath!, testFilePath);
      expect(result).toBeNull();
    });

    it('should handle function with no parameters', () => {
      const code = `function noParams(): void {}`;
      const nodePath = getFunctionNodePath(code);

      const result = analyzeFunction(nodePath!, testFilePath);

      expect(result!.params).toEqual([]);
      expect(result!.returnType).toBe('void');
    });

    it('should handle complex return type', () => {
      const code = `function getData(): { name: string; age: number } { return { name: '', age: 0 }; }`;
      const nodePath = getFunctionNodePath(code);

      const result = analyzeFunction(nodePath!, testFilePath);

      expect(result!.returnType).toBe('object');
    });

    it('should handle union return type', () => {
      const code = `function parse(input: string): string | null { return input || null; }`;
      const nodePath = getFunctionNodePath(code);

      const result = analyzeFunction(nodePath!, testFilePath);

      expect(result!.returnType).toBe('string | null');
    });

    it('should handle array return type', () => {
      const code = `function getItems(): string[] { return []; }`;
      const nodePath = getFunctionNodePath(code);

      const result = analyzeFunction(nodePath!, testFilePath);

      expect(result!.returnType).toBe('string[]');
    });

    it('should set filePath correctly', () => {
      const code = `function test() {}`;
      const nodePath = getFunctionNodePath(code);

      const result = analyzeFunction(nodePath!, '/custom/path.ts');

      expect(result!.filePath).toBe('/custom/path.ts');
    });

    it('should initialize imports as empty array', () => {
      const code = `function test() {}`;
      const nodePath = getFunctionNodePath(code);

      const result = analyzeFunction(nodePath!, testFilePath);

      expect(result!.imports).toEqual([]);
    });
  });
});

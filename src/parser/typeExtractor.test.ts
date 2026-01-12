/**
 * Type Extractor Tests
 */

import { extractTypes, generateMockValue } from './typeExtractor';
import { parseCode } from './astParser';
import * as t from '@babel/types';
import traverse from '@babel/traverse';

describe('extractTypes', () => {
  const getTypeAnnotation = (code: string): t.TSTypeAnnotation | null => {
    const ast = parseCode(code, 'test.ts');
    let typeAnnotation: t.TSTypeAnnotation | null = null;

    traverse(ast, {
      VariableDeclarator(path) {
        const id = path.node.id;
        if (t.isIdentifier(id) && id.typeAnnotation) {
          typeAnnotation = id.typeAnnotation as t.TSTypeAnnotation;
        }
      },
    });

    return typeAnnotation;
  };

  it('should return "any" for null/undefined input', () => {
    expect(extractTypes(null)).toBe('any');
    expect(extractTypes(undefined)).toBe('any');
  });

  it('should extract string type', () => {
    const typeAnnotation = getTypeAnnotation('const x: string = "";');
    expect(extractTypes(typeAnnotation)).toBe('string');
  });

  it('should extract number type', () => {
    const typeAnnotation = getTypeAnnotation('const x: number = 0;');
    expect(extractTypes(typeAnnotation)).toBe('number');
  });

  it('should extract boolean type', () => {
    const typeAnnotation = getTypeAnnotation('const x: boolean = true;');
    expect(extractTypes(typeAnnotation)).toBe('boolean');
  });

  it('should extract any type', () => {
    const typeAnnotation = getTypeAnnotation('const x: any = null;');
    expect(extractTypes(typeAnnotation)).toBe('any');
  });

  it('should extract void type', () => {
    const typeAnnotation = getTypeAnnotation('const x: void = undefined;');
    expect(extractTypes(typeAnnotation)).toBe('void');
  });

  it('should extract null type', () => {
    const typeAnnotation = getTypeAnnotation('const x: null = null;');
    expect(extractTypes(typeAnnotation)).toBe('null');
  });

  it('should extract undefined type', () => {
    const typeAnnotation = getTypeAnnotation('const x: undefined = undefined;');
    expect(extractTypes(typeAnnotation)).toBe('undefined');
  });

  it('should extract array type', () => {
    const typeAnnotation = getTypeAnnotation('const x: string[] = [];');
    expect(extractTypes(typeAnnotation)).toBe('string[]');
  });

  it('should extract union type', () => {
    const typeAnnotation = getTypeAnnotation('const x: string | number = "";');
    expect(extractTypes(typeAnnotation)).toBe('string | number');
  });

  it('should extract intersection type', () => {
    const typeAnnotation = getTypeAnnotation('const x: A & B = {} as any;');
    expect(extractTypes(typeAnnotation)).toBe('A & B');
  });

  it('should extract literal type', () => {
    const typeAnnotation = getTypeAnnotation(`const x: 'success' = 'success';`);
    expect(extractTypes(typeAnnotation)).toBe("'success'");
  });

  it('should extract type reference', () => {
    const typeAnnotation = getTypeAnnotation('const x: MyType = {};');
    expect(extractTypes(typeAnnotation)).toBe('MyType');
  });

  it('should extract tuple type', () => {
    const typeAnnotation = getTypeAnnotation('const x: [string, number] = ["", 0];');
    expect(extractTypes(typeAnnotation)).toBe('[string, number]');
  });

  it('should extract object type as object', () => {
    const typeAnnotation = getTypeAnnotation('const x: { a: string } = { a: "" };');
    expect(extractTypes(typeAnnotation)).toBe('object');
  });
});

describe('generateMockValue', () => {
  it('should generate mock for string', () => {
    expect(generateMockValue('string')).toBe("'test-string'");
  });

  it('should generate mock for number', () => {
    expect(generateMockValue('number')).toBe('42');
  });

  it('should generate mock for boolean', () => {
    expect(generateMockValue('boolean')).toBe('true');
  });

  it('should generate mock for any', () => {
    expect(generateMockValue('any')).toBe('undefined');
  });

  it('should generate mock for unknown', () => {
    expect(generateMockValue('unknown')).toBe('undefined');
  });

  it('should generate mock for void', () => {
    expect(generateMockValue('void')).toBe('undefined');
  });

  it('should generate mock for null', () => {
    expect(generateMockValue('null')).toBe('null');
  });

  it('should generate mock for undefined', () => {
    expect(generateMockValue('undefined')).toBe('undefined');
  });

  it('should generate mock for object', () => {
    expect(generateMockValue('object')).toBe('{}');
  });

  it('should generate mock for Function', () => {
    expect(generateMockValue('Function')).toBe('jest.fn()');
  });

  it('should generate mock for array types', () => {
    expect(generateMockValue('string[]')).toBe('[]');
    expect(generateMockValue('number[]')).toBe('[]');
    expect(generateMockValue('any[]')).toBe('[]');
  });

  it('should generate mock for arrow function types', () => {
    expect(generateMockValue('() => void')).toBe('jest.fn()');
    expect(generateMockValue('(x: number) => string')).toBe('jest.fn()');
  });

  it('should return empty object for unknown types', () => {
    expect(generateMockValue('SomeCustomType')).toBe('{}');
  });
});

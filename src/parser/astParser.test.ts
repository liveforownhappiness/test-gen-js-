/**
 * AST Parser Tests
 */

import { parseCode, parseFile } from './astParser';
import path from 'path';

describe('parseCode', () => {
  it('should parse simple JavaScript code', () => {
    const code = `const x = 1;`;
    const ast = parseCode(code, 'test.js');

    expect(ast).toBeDefined();
    expect(ast.type).toBe('File');
    expect(ast.program.body.length).toBeGreaterThan(0);
  });

  it('should parse TypeScript code', () => {
    const code = `const x: number = 1;`;
    const ast = parseCode(code, 'test.ts');

    expect(ast).toBeDefined();
    expect(ast.type).toBe('File');
  });

  it('should parse JSX code', () => {
    const code = `const App = () => <div>Hello</div>;`;
    const ast = parseCode(code, 'test.jsx');

    expect(ast).toBeDefined();
    expect(ast.type).toBe('File');
  });

  it('should parse TSX code', () => {
    const code = `
      interface Props { name: string; }
      const App = ({ name }: Props) => <div>{name}</div>;
    `;
    const ast = parseCode(code, 'test.tsx');

    expect(ast).toBeDefined();
    expect(ast.type).toBe('File');
  });

  it('should parse arrow functions', () => {
    const code = `export const add = (a: number, b: number) => a + b;`;
    const ast = parseCode(code, 'test.ts');

    expect(ast).toBeDefined();
    expect(ast.program.body.length).toBe(1);
  });

  it('should parse async functions', () => {
    const code = `
      export async function fetchData(url: string): Promise<any> {
        const response = await fetch(url);
        return response.json();
      }
    `;
    const ast = parseCode(code, 'test.ts');

    expect(ast).toBeDefined();
  });

  it('should parse React component with hooks', () => {
    const code = `
      import React, { useState, useEffect } from 'react';
      
      export const Counter = () => {
        const [count, setCount] = useState(0);
        
        useEffect(() => {
          console.log(count);
        }, [count]);
        
        return <div>{count}</div>;
      };
    `;
    const ast = parseCode(code, 'test.tsx');

    expect(ast).toBeDefined();
  });

  it('should throw error for invalid syntax', () => {
    const code = `const x = {`;

    expect(() => parseCode(code, 'test.js')).toThrow();
  });

  it('should parse optional chaining', () => {
    const code = `const value = obj?.property?.nested;`;
    const ast = parseCode(code, 'test.ts');

    expect(ast).toBeDefined();
  });

  it('should parse nullish coalescing', () => {
    const code = `const value = obj ?? 'default';`;
    const ast = parseCode(code, 'test.ts');

    expect(ast).toBeDefined();
  });

  it('should parse class components', () => {
    const code = `
      class MyComponent extends React.Component {
        render() {
          return <div>Hello</div>;
        }
      }
    `;
    const ast = parseCode(code, 'test.tsx');

    expect(ast).toBeDefined();
  });

  it('should parse decorators', () => {
    const code = `
      @decorator
      class MyClass {
        @log
        method() {}
      }
    `;
    const ast = parseCode(code, 'test.ts');

    expect(ast).toBeDefined();
  });
});

describe('parseFile', () => {
  it('should parse a real file', async () => {
    const filePath = path.join(__dirname, '../../examples/utils.ts');
    const ast = await parseFile(filePath);

    expect(ast).toBeDefined();
    expect(ast.type).toBe('File');
  });

  it('should throw error for non-existent file', async () => {
    const filePath = '/non/existent/file.ts';

    await expect(parseFile(filePath)).rejects.toThrow('File not found');
  });

  it('should parse Button component example', async () => {
    const filePath = path.join(__dirname, '../../examples/Button.tsx');
    const ast = await parseFile(filePath);

    expect(ast).toBeDefined();
    expect(ast.program.body.length).toBeGreaterThan(0);
  });
});

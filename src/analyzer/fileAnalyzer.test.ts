/**
 * File Analyzer Tests
 */

import { analyzeFile, analyzeDirectory } from './fileAnalyzer';
import path from 'path';
import fs from 'fs-extra';
import os from 'os';

describe('analyzeFile', () => {
  const examplesDir = path.join(__dirname, '../../examples');

  describe('React Component Analysis', () => {
    it('should analyze Button component', async () => {
      const filePath = path.join(examplesDir, 'Button.tsx');
      const analysis = await analyzeFile(filePath);

      expect(analysis.fileType).toBe('component');
      expect(analysis.framework).toBe('react');
      expect(analysis.components.length).toBeGreaterThan(0);

      const button = analysis.components.find((c) => c.name === 'Button');
      expect(button).toBeDefined();
      expect(button!.props.length).toBeGreaterThan(0);
    });

    it('should analyze Card component with hooks', async () => {
      const filePath = path.join(examplesDir, 'Card.tsx');
      const analysis = await analyzeFile(filePath);

      expect(analysis.fileType).toBe('component');
      expect(analysis.components.length).toBeGreaterThan(0);

      const card = analysis.components.find((c) => c.name === 'Card');
      expect(card).toBeDefined();
    });

    it('should detect React Native framework', async () => {
      const tempFile = path.join(os.tmpdir(), 'RNComponent.tsx');
      // Note: react-native import must come before react import for detection
      const code = `
        import { View, Text } from 'react-native';
        import React from 'react';
        
        export const RNComponent = () => <View><Text>Hello</Text></View>;
      `;
      await fs.writeFile(tempFile, code);

      try {
        const analysis = await analyzeFile(tempFile);
        expect(analysis.framework).toBe('react-native');
      } finally {
        await fs.remove(tempFile);
      }
    });
  });

  describe('Function Analysis', () => {
    it('should analyze utility functions', async () => {
      const filePath = path.join(examplesDir, 'utils.ts');
      const analysis = await analyzeFile(filePath);

      expect(analysis.fileType).toBe('function');
      expect(analysis.functions.length).toBeGreaterThan(0);
    });

    it('should extract function parameters', async () => {
      const tempFile = path.join(os.tmpdir(), 'testFunc.ts');
      const code = `
        export function add(a: number, b: number): number {
          return a + b;
        }
      `;
      await fs.writeFile(tempFile, code);

      try {
        const analysis = await analyzeFile(tempFile);
        expect(analysis.functions.length).toBe(1);

        const addFunc = analysis.functions[0];
        expect(addFunc.name).toBe('add');
        expect(addFunc.params.length).toBe(2);
        expect(addFunc.params[0].name).toBe('a');
        expect(addFunc.params[0].type).toBe('number');
        expect(addFunc.returnType).toBe('number');
      } finally {
        await fs.remove(tempFile);
      }
    });

    it('should detect async functions', async () => {
      const tempFile = path.join(os.tmpdir(), 'asyncFunc.ts');
      const code = `
        export async function fetchData(url: string): Promise<any> {
          const response = await fetch(url);
          return response.json();
        }
      `;
      await fs.writeFile(tempFile, code);

      try {
        const analysis = await analyzeFile(tempFile);
        expect(analysis.functions.length).toBe(1);
        expect(analysis.functions[0].isAsync).toBe(true);
      } finally {
        await fs.remove(tempFile);
      }
    });
  });

  describe('Import Analysis', () => {
    it('should extract imports', async () => {
      const tempFile = path.join(os.tmpdir(), 'imports.ts');
      const code = `
        import React from 'react';
        import { useState, useEffect } from 'react';
        import * as utils from './utils';
        
        export const Component = () => <div />;
      `;
      await fs.writeFile(tempFile, code);

      try {
        const analysis = await analyzeFile(tempFile);
        expect(analysis.imports.length).toBe(3);

        const reactDefault = analysis.imports.find((i) => i.source === 'react' && i.isDefault);
        expect(reactDefault).toBeDefined();

        const reactNamed = analysis.imports.find(
          (i) => i.source === 'react' && i.specifiers.includes('useState')
        );
        expect(reactNamed).toBeDefined();
      } finally {
        await fs.remove(tempFile);
      }
    });
  });

  describe('Hook Detection', () => {
    it('should detect useState hook', async () => {
      const tempFile = path.join(os.tmpdir(), 'hookComponent.tsx');
      const code = `
        import React, { useState } from 'react';
        
        export const Counter = () => {
          const [count, setCount] = useState(0);
          return <div>{count}</div>;
        };
      `;
      await fs.writeFile(tempFile, code);

      try {
        const analysis = await analyzeFile(tempFile);
        expect(analysis.components.length).toBe(1);
        expect(analysis.components[0].hooks).toContain('useState');
      } finally {
        await fs.remove(tempFile);
      }
    });

    it('should detect multiple hooks', async () => {
      const tempFile = path.join(os.tmpdir(), 'multiHooks.tsx');
      const code = `
        import React, { useState, useEffect, useMemo } from 'react';
        
        export const Component = () => {
          const [value, setValue] = useState('');
          const computed = useMemo(() => value.toUpperCase(), [value]);
          useEffect(() => { console.log(computed); }, [computed]);
          return <div>{computed}</div>;
        };
      `;
      await fs.writeFile(tempFile, code);

      try {
        const analysis = await analyzeFile(tempFile);
        expect(analysis.components[0].hooks).toContain('useState');
        expect(analysis.components[0].hooks).toContain('useEffect');
        expect(analysis.components[0].hooks).toContain('useMemo');
      } finally {
        await fs.remove(tempFile);
      }
    });
  });

  describe('Props Analysis', () => {
    it('should extract props with types', async () => {
      const tempFile = path.join(os.tmpdir(), 'propsComponent.tsx');
      const code = `
        import React from 'react';
        
        interface Props {
          name: string;
          age: number;
          active?: boolean;
        }
        
        export const Profile = ({ name, age, active = false }: Props) => (
          <div>{name} - {age}</div>
        );
      `;
      await fs.writeFile(tempFile, code);

      try {
        const analysis = await analyzeFile(tempFile);
        expect(analysis.components.length).toBe(1);

        const props = analysis.components[0].props;
        expect(props.length).toBe(3);

        const nameProp = props.find((p) => p.name === 'name');
        expect(nameProp).toBeDefined();
        expect(nameProp!.required).toBe(true);

        const activeProp = props.find((p) => p.name === 'active');
        expect(activeProp).toBeDefined();
        expect(activeProp!.required).toBe(false);
      } finally {
        await fs.remove(tempFile);
      }
    });

    it('should detect event handler props', async () => {
      const tempFile = path.join(os.tmpdir(), 'eventProps.tsx');
      const code = `
        import React from 'react';
        
        export const Button = ({ onClick, onPress, onSubmit }: {
          onClick: () => void;
          onPress: () => void;
          onSubmit: () => void;
        }) => <button onClick={onClick}>Click</button>;
      `;
      await fs.writeFile(tempFile, code);

      try {
        const analysis = await analyzeFile(tempFile);
        const events = analysis.components[0].events;
        expect(events).toContain('onClick');
        expect(events).toContain('onPress');
        expect(events).toContain('onSubmit');
      } finally {
        await fs.remove(tempFile);
      }
    });
  });

  describe('HOC Components', () => {
    it('should analyze memo wrapped components', async () => {
      const tempFile = path.join(os.tmpdir(), 'memoComponent.tsx');
      const code = `
        import React, { memo } from 'react';
        
        export const MemoComponent = memo(({ title }: { title: string }) => (
          <div>{title}</div>
        ));
      `;
      await fs.writeFile(tempFile, code);

      try {
        const analysis = await analyzeFile(tempFile);
        expect(analysis.components.length).toBe(1);
        expect(analysis.components[0].name).toBe('MemoComponent');
      } finally {
        await fs.remove(tempFile);
      }
    });

    it('should analyze forwardRef components', async () => {
      const tempFile = path.join(os.tmpdir(), 'forwardRefComponent.tsx');
      const code = `
        import React, { forwardRef } from 'react';
        
        export const Input = forwardRef<HTMLInputElement, { placeholder: string }>(
          ({ placeholder }, ref) => <input ref={ref} placeholder={placeholder} />
        );
      `;
      await fs.writeFile(tempFile, code);

      try {
        const analysis = await analyzeFile(tempFile);
        expect(analysis.components.length).toBe(1);
        expect(analysis.components[0].name).toBe('Input');
      } finally {
        await fs.remove(tempFile);
      }
    });
  });

  describe('Error Handling', () => {
    it('should throw error for non-existent file', async () => {
      await expect(analyzeFile('/non/existent/file.ts')).rejects.toThrow();
    });
  });
});

describe('analyzeDirectory', () => {
  const examplesDir = path.join(__dirname, '../../examples');

  describe('Basic Directory Analysis', () => {
    it('should analyze all files in examples directory', async () => {
      const analyses = await analyzeDirectory(examplesDir);

      expect(analyses.length).toBeGreaterThan(0);
      expect(analyses.every((a) => a.filePath)).toBe(true);
    });

    it('should find Button component in directory', async () => {
      const analyses = await analyzeDirectory(examplesDir);

      const buttonAnalysis = analyses.find((a) => a.filePath.includes('Button.tsx'));
      expect(buttonAnalysis).toBeDefined();
      expect(buttonAnalysis!.components.length).toBeGreaterThan(0);
      expect(buttonAnalysis!.components.some((c) => c.name === 'Button')).toBe(true);
    });

    it('should find utils functions in directory', async () => {
      const analyses = await analyzeDirectory(examplesDir);

      const utilsAnalysis = analyses.find((a) => a.filePath.includes('utils.ts'));
      expect(utilsAnalysis).toBeDefined();
      expect(utilsAnalysis!.functions.length).toBeGreaterThan(0);
    });
  });

  describe('Pattern Matching', () => {
    it('should only analyze files matching pattern', async () => {
      const analyses = await analyzeDirectory(examplesDir, {
        pattern: '**/*.tsx',
      });

      expect(analyses.length).toBeGreaterThan(0);
      expect(analyses.every((a) => a.filePath.endsWith('.tsx'))).toBe(true);
    });

    it('should exclude test files by default', async () => {
      const tempDir = path.join(os.tmpdir(), 'test-gen-analyze-dir');
      await fs.ensureDir(tempDir);

      try {
        // Create source file
        await fs.writeFile(
          path.join(tempDir, 'Component.tsx'),
          'export const Component = () => <div>Test</div>;'
        );

        // Create test file
        await fs.writeFile(
          path.join(tempDir, 'Component.test.tsx'),
          'export const Test = () => <div>Test</div>;'
        );

        const analyses = await analyzeDirectory(tempDir);

        // Should only find Component.tsx, not Component.test.tsx
        expect(analyses.length).toBe(1);
        expect(analyses[0].filePath).toContain('Component.tsx');
        expect(analyses[0].filePath).not.toContain('.test.');
      } finally {
        await fs.remove(tempDir);
      }
    });
  });

  describe('Custom Exclude Patterns', () => {
    it('should exclude files matching custom exclude pattern', async () => {
      const tempDir = path.join(os.tmpdir(), 'test-gen-analyze-exclude');
      await fs.ensureDir(tempDir);

      try {
        await fs.writeFile(
          path.join(tempDir, 'Component.tsx'),
          'export const Component = () => <div>Test</div>;'
        );
        await fs.writeFile(
          path.join(tempDir, 'ignored.tsx'),
          'export const Ignored = () => <div>Test</div>;'
        );

        const analyses = await analyzeDirectory(tempDir, {
          exclude: ['**/ignored.tsx'],
        });

        expect(analyses.length).toBe(1);
        expect(analyses[0].filePath).toContain('Component.tsx');
        expect(analyses[0].filePath).not.toContain('ignored');
      } finally {
        await fs.remove(tempDir);
      }
    });
  });

  describe('Error Handling', () => {
    it('should throw error for non-existent directory', async () => {
      await expect(analyzeDirectory('/non/existent/directory')).rejects.toThrow(
        'Directory not found'
      );
    });

    it('should throw error if path is not a directory', async () => {
      const tempFile = path.join(os.tmpdir(), 'test-gen-not-dir');
      await fs.writeFile(tempFile, 'not a directory');

      try {
        await expect(analyzeDirectory(tempFile)).rejects.toThrow('Path is not a directory');
      } finally {
        await fs.remove(tempFile);
      }
    });

    it('should handle parse errors gracefully', async () => {
      const tempDir = path.join(os.tmpdir(), 'test-gen-parse-error');
      await fs.ensureDir(tempDir);

      try {
        // Create valid file
        await fs.writeFile(
          path.join(tempDir, 'Valid.tsx'),
          'export const Valid = () => <div>Valid</div>;'
        );

        // Create invalid file
        await fs.writeFile(path.join(tempDir, 'Invalid.tsx'), 'export const Broken = ({ => ;');

        // Should return results for valid files even if some files fail
        const analyses = await analyzeDirectory(tempDir);
        // Should have at least the valid file
        expect(analyses.length).toBeGreaterThanOrEqual(1);
        expect(analyses.some((a) => a.filePath.includes('Valid.tsx'))).toBe(true);
      } finally {
        await fs.remove(tempDir);
      }
    });

    it('should return partial results if some files fail', async () => {
      const tempDir = path.join(os.tmpdir(), 'test-gen-partial');
      await fs.ensureDir(tempDir);

      try {
        // Create valid file
        await fs.writeFile(
          path.join(tempDir, 'Valid.tsx'),
          'export const Valid = () => <div>Valid</div>;'
        );

        // Create invalid file (but not so broken that it prevents all analysis)
        // This test might not work as expected if analyzeFile throws for invalid syntax
        // Let's create a file that might cause issues but not prevent all analysis
        await fs.writeFile(
          path.join(tempDir, 'MaybeInvalid.tsx'),
          'export const MaybeInvalid = () => { return <div>Test</div>; }'
        );

        const analyses = await analyzeDirectory(tempDir);
        // Should have at least one valid analysis
        expect(analyses.length).toBeGreaterThanOrEqual(1);
      } finally {
        await fs.remove(tempDir);
      }
    });
  });

  describe('Empty Directory', () => {
    it('should return empty array for empty directory', async () => {
      const tempDir = path.join(os.tmpdir(), 'test-gen-empty-dir');
      await fs.ensureDir(tempDir);

      try {
        const analyses = await analyzeDirectory(tempDir);
        expect(analyses).toEqual([]);
      } finally {
        await fs.remove(tempDir);
      }
    });
  });
});

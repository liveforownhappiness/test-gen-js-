/**
 * Test Generator Tests
 */

import { generateTest, generateTests } from './testGenerator';
import { analyzeFile } from '../analyzer';
import path from 'path';
import fs from 'fs-extra';
import os from 'os';

describe('generateTest', () => {
  const examplesDir = path.join(__dirname, '../../examples');
  const tempDir = path.join(os.tmpdir(), 'test-gen-tests');

  beforeEach(async () => {
    await fs.ensureDir(tempDir);
  });

  afterEach(async () => {
    await fs.remove(tempDir);
  });

  describe('Component Test Generation', () => {
    it('should generate test for Button component', async () => {
      const filePath = path.join(examplesDir, 'Button.tsx');
      const analysis = await analyzeFile(filePath);
      const outputPath = path.join(tempDir, 'Button.test.tsx');

      const result = await generateTest(analysis, {
        output: outputPath,
        overwrite: true,
      });

      expect(result.action).toBe('created');
      expect(await fs.pathExists(outputPath)).toBe(true);

      const content = await fs.readFile(outputPath, 'utf-8');
      expect(content).toContain("describe('Button'");
      expect(content).toContain('renders without crashing');
      expect(content).toContain('defaultProps');
    });

    it('should generate test for Card component', async () => {
      const filePath = path.join(examplesDir, 'Card.tsx');
      const analysis = await analyzeFile(filePath);
      const outputPath = path.join(tempDir, 'Card.test.tsx');

      const result = await generateTest(analysis, {
        output: outputPath,
        overwrite: true,
      });

      expect(result.action).toBe('created');

      const content = await fs.readFile(outputPath, 'utf-8');
      expect(content).toContain("describe('Card'");
    });

    it('should include snapshot test when option is enabled', async () => {
      const filePath = path.join(examplesDir, 'Button.tsx');
      const analysis = await analyzeFile(filePath);
      const outputPath = path.join(tempDir, 'ButtonSnapshot.test.tsx');

      await generateTest(analysis, {
        output: outputPath,
        snapshot: true,
        overwrite: true,
      });

      const content = await fs.readFile(outputPath, 'utf-8');
      expect(content).toContain('toMatchSnapshot');
    });

    it('should generate test with proper imports', async () => {
      const filePath = path.join(examplesDir, 'Button.tsx');
      const analysis = await analyzeFile(filePath);
      const outputPath = path.join(tempDir, 'ButtonImports.test.tsx');

      await generateTest(analysis, {
        output: outputPath,
        overwrite: true,
      });

      const content = await fs.readFile(outputPath, 'utf-8');
      expect(content).toContain("import React from 'react'");
      expect(content).toContain('@testing-library/react');
      expect(content).toContain('render');
    });
  });

  describe('Function Test Generation', () => {
    it('should generate test for utility functions', async () => {
      const filePath = path.join(examplesDir, 'utils.ts');
      const analysis = await analyzeFile(filePath);
      const outputPath = path.join(tempDir, 'utils.test.ts');

      const result = await generateTest(analysis, {
        output: outputPath,
        overwrite: true,
      });

      expect(result.action).toBe('created');

      const content = await fs.readFile(outputPath, 'utf-8');
      expect(content).toContain('describe');
      expect(content).toContain('expect');
    });

    it('should handle async function tests', async () => {
      const tempSourceFile = path.join(tempDir, 'asyncUtils.ts');
      const code = `
        export async function fetchUser(id: string): Promise<{ name: string }> {
          const response = await fetch(\`/api/users/\${id}\`);
          return response.json();
        }
      `;
      await fs.writeFile(tempSourceFile, code);

      const analysis = await analyzeFile(tempSourceFile);
      const outputPath = path.join(tempDir, 'asyncUtils.test.ts');

      await generateTest(analysis, {
        output: outputPath,
        overwrite: true,
      });

      const content = await fs.readFile(outputPath, 'utf-8');
      expect(content).toContain('async');
      expect(content).toContain('await');
    });
  });

  describe('Skip Behavior', () => {
    it('should skip if test file exists and overwrite is false', async () => {
      const filePath = path.join(examplesDir, 'Button.tsx');
      const analysis = await analyzeFile(filePath);
      const outputPath = path.join(tempDir, 'ExistingButton.test.tsx');

      // Create existing file
      await fs.writeFile(outputPath, '// existing test');

      const result = await generateTest(analysis, {
        output: outputPath,
        overwrite: false,
      });

      expect(result.action).toBe('skipped');

      const content = await fs.readFile(outputPath, 'utf-8');
      expect(content).toBe('// existing test');
    });

    it('should overwrite if overwrite option is true', async () => {
      const filePath = path.join(examplesDir, 'Button.tsx');
      const analysis = await analyzeFile(filePath);
      const outputPath = path.join(tempDir, 'OverwriteButton.test.tsx');

      // Create existing file
      await fs.writeFile(outputPath, '// existing test');

      const result = await generateTest(analysis, {
        output: outputPath,
        overwrite: true,
      });

      expect(result.action).toBe('updated');

      const content = await fs.readFile(outputPath, 'utf-8');
      expect(content).not.toBe('// existing test');
      expect(content).toContain('describe');
    });
  });

  describe('Error Handling', () => {
    it('should throw error for file with no components or functions', async () => {
      const tempSourceFile = path.join(tempDir, 'empty.ts');
      await fs.writeFile(tempSourceFile, 'const x = 1;'); // Not exported

      const analysis = await analyzeFile(tempSourceFile);
      const outputPath = path.join(tempDir, 'empty.test.ts');

      await expect(generateTest(analysis, { output: outputPath })).rejects.toThrow(
        'No components or functions found'
      );
    });
  });
});

describe('generateTests', () => {
  const examplesDir = path.join(__dirname, '../../examples');
  const tempDir = path.join(os.tmpdir(), 'test-gen-batch-tests');

  beforeEach(async () => {
    await fs.ensureDir(tempDir);
  });

  afterEach(async () => {
    await fs.remove(tempDir);
  });

  it('should generate tests for multiple files', async () => {
    const files = ['Button.tsx', 'Card.tsx', 'utils.ts'];
    const analyses = await Promise.all(files.map((f) => analyzeFile(path.join(examplesDir, f))));

    const results = await generateTests(
      analyses.map((a, i) => ({
        ...a,
        filePath: path.join(tempDir, files[i]),
      })),
      { overwrite: true }
    );

    expect(results.length).toBe(3);
    expect(results.filter((r) => r.action === 'created').length).toBe(3);
  });
});

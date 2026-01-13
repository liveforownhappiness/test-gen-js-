/**
 * CLI Integration Tests
 * Tests the CLI commands end-to-end by executing actual commands
 */

import { execSync, exec } from 'child_process';
import path from 'path';
import fs from 'fs-extra';
import os from 'os';

describe('CLI Integration Tests', () => {
  const tempDir = path.join(os.tmpdir(), 'test-gen-cli-test');
  const cliPath = path.resolve(__dirname, '../bin/cli.js');
  const projectRoot = path.resolve(__dirname, '..');

  beforeAll(async () => {
    // Ensure CLI is built
    if (!(await fs.pathExists(path.join(projectRoot, 'dist/cli.js')))) {
      execSync('npm run build', { cwd: projectRoot, stdio: 'pipe' });
    }
  });

  beforeEach(async () => {
    await fs.ensureDir(tempDir);
  });

  afterEach(async () => {
    await fs.remove(tempDir);
  });

  describe('generate command', () => {
    it('should generate test file for a React component', async () => {
      // Create a sample component
      const componentCode = `
import React from 'react';

interface ButtonProps {
  title: string;
  onClick: () => void;
  disabled?: boolean;
}

export const Button = ({ title, onClick, disabled = false }: ButtonProps) => {
  return (
    <button onClick={onClick} disabled={disabled}>
      {title}
    </button>
  );
};
`;
      const componentPath = path.join(tempDir, 'Button.tsx');
      await fs.writeFile(componentPath, componentCode);

      // Run the CLI
      execSync(`node ${cliPath} generate ${componentPath}`, {
        cwd: tempDir,
        stdio: 'pipe',
      });

      // Verify test file was created
      const testFilePath = path.join(tempDir, 'Button.test.tsx');
      expect(await fs.pathExists(testFilePath)).toBe(true);

      // Verify test file content
      const testContent = await fs.readFile(testFilePath, 'utf-8');
      expect(testContent).toContain("describe('Button'");
      expect(testContent).toContain('defaultProps');
      expect(testContent).toContain('renders without crashing');
      expect(testContent).toContain('onClick');
    });

    it('should generate test file for utility functions', async () => {
      // Create a sample utility file
      const utilCode = `
export function add(a: number, b: number): number {
  return a + b;
}

export async function fetchData(url: string): Promise<any> {
  const response = await fetch(url);
  return response.json();
}
`;
      const utilPath = path.join(tempDir, 'utils.ts');
      await fs.writeFile(utilPath, utilCode);

      // Run the CLI
      execSync(`node ${cliPath} generate ${utilPath}`, {
        cwd: tempDir,
        stdio: 'pipe',
      });

      // Verify test file was created
      const testFilePath = path.join(tempDir, 'utils.test.ts');
      expect(await fs.pathExists(testFilePath)).toBe(true);

      // Verify test file content
      const testContent = await fs.readFile(testFilePath, 'utf-8');
      expect(testContent).toContain("describe('add'");
      expect(testContent).toContain("describe('fetchData'");
      expect(testContent).toContain('async');
    });

    it('should include snapshot tests when --snapshot flag is used', async () => {
      const componentCode = `
import React from 'react';
export const Card = ({ title }: { title: string }) => <div>{title}</div>;
`;
      const componentPath = path.join(tempDir, 'Card.tsx');
      await fs.writeFile(componentPath, componentCode);

      // Run the CLI with snapshot flag
      execSync(`node ${cliPath} generate ${componentPath} --snapshot`, {
        cwd: tempDir,
        stdio: 'pipe',
      });

      const testFilePath = path.join(tempDir, 'Card.test.tsx');
      const testContent = await fs.readFile(testFilePath, 'utf-8');
      expect(testContent).toContain('toMatchSnapshot');
    });

    it('should use custom output path with -o flag', async () => {
      const componentCode = `
import React from 'react';
export const Header = () => <header>Header</header>;
`;
      const componentPath = path.join(tempDir, 'Header.tsx');
      await fs.writeFile(componentPath, componentCode);

      const customOutputPath = path.join(tempDir, '__tests__', 'Header.test.tsx');

      // Run the CLI with custom output
      execSync(`node ${cliPath} generate ${componentPath} -o ${customOutputPath}`, {
        cwd: tempDir,
        stdio: 'pipe',
      });

      expect(await fs.pathExists(customOutputPath)).toBe(true);
    });

    it('should not overwrite existing test file without --overwrite flag', async () => {
      const componentCode = `
import React from 'react';
export const Modal = () => <div>Modal</div>;
`;
      const componentPath = path.join(tempDir, 'Modal.tsx');
      await fs.writeFile(componentPath, componentCode);

      // Create existing test file
      const testFilePath = path.join(tempDir, 'Modal.test.tsx');
      const existingContent = '// Existing test file - should not be overwritten';
      await fs.writeFile(testFilePath, existingContent);

      // Run the CLI without overwrite flag
      execSync(`node ${cliPath} generate ${componentPath}`, {
        cwd: tempDir,
        stdio: 'pipe',
      });

      // Verify file was not overwritten
      const testContent = await fs.readFile(testFilePath, 'utf-8');
      expect(testContent).toBe(existingContent);
    });

    it('should overwrite existing test file with --overwrite flag', async () => {
      const componentCode = `
import React from 'react';
export const Footer = () => <footer>Footer</footer>;
`;
      const componentPath = path.join(tempDir, 'Footer.tsx');
      await fs.writeFile(componentPath, componentCode);

      // Create existing test file
      const testFilePath = path.join(tempDir, 'Footer.test.tsx');
      await fs.writeFile(testFilePath, '// Old test');

      // Run the CLI with overwrite flag
      execSync(`node ${cliPath} generate ${componentPath} --overwrite`, {
        cwd: tempDir,
        stdio: 'pipe',
      });

      // Verify file was overwritten
      const testContent = await fs.readFile(testFilePath, 'utf-8');
      expect(testContent).toContain("describe('Footer'");
    });

    it('should fail gracefully for non-existent file', () => {
      const nonExistentPath = path.join(tempDir, 'NonExistent.tsx');

      expect(() => {
        execSync(`node ${cliPath} generate ${nonExistentPath}`, {
          cwd: tempDir,
          stdio: 'pipe',
        });
      }).toThrow();
    });
  });

  describe('scan command', () => {
    beforeEach(async () => {
      // Create a sample project structure
      await fs.ensureDir(path.join(tempDir, 'src/components'));
      await fs.ensureDir(path.join(tempDir, 'src/utils'));

      // Create sample files
      await fs.writeFile(
        path.join(tempDir, 'src/components/Button.tsx'),
        `import React from 'react';
export const Button = ({ label }: { label: string }) => <button>{label}</button>;`
      );

      await fs.writeFile(
        path.join(tempDir, 'src/components/Card.tsx'),
        `import React from 'react';
export const Card = ({ title }: { title: string }) => <div>{title}</div>;`
      );

      await fs.writeFile(
        path.join(tempDir, 'src/utils/helpers.ts'),
        `export const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);`
      );

      // Create an index file (should be skipped - no exports)
      await fs.writeFile(
        path.join(tempDir, 'src/index.ts'),
        `export * from './components/Button';`
      );
    });

    it('should scan directory and report files in dry-run mode', () => {
      const output = execSync(`node ${cliPath} scan ${tempDir}/src --dry-run`, {
        cwd: tempDir,
        encoding: 'utf-8',
      });

      expect(output).toContain('Scanning directory');
      expect(output).toContain('Button.tsx');
      expect(output).toContain('Card.tsx');
      expect(output).toContain('helpers.ts');
      expect(output).toContain('dry run');
    });

    it('should generate tests for all files in directory', async () => {
      execSync(`node ${cliPath} scan ${tempDir}/src`, {
        cwd: tempDir,
        stdio: 'pipe',
      });

      // Verify test files were created
      expect(await fs.pathExists(path.join(tempDir, 'src/components/Button.test.tsx'))).toBe(true);
      expect(await fs.pathExists(path.join(tempDir, 'src/components/Card.test.tsx'))).toBe(true);
      expect(await fs.pathExists(path.join(tempDir, 'src/utils/helpers.test.ts'))).toBe(true);
    });

    it('should include snapshot tests with --snapshot flag', async () => {
      execSync(`node ${cliPath} scan ${tempDir}/src/components --snapshot`, {
        cwd: tempDir,
        stdio: 'pipe',
      });

      const buttonTest = await fs.readFile(
        path.join(tempDir, 'src/components/Button.test.tsx'),
        'utf-8'
      );
      expect(buttonTest).toContain('toMatchSnapshot');
    });

    it('should show summary after scanning', () => {
      const output = execSync(`node ${cliPath} scan ${tempDir}/src`, {
        cwd: tempDir,
        encoding: 'utf-8',
      });

      expect(output).toContain('Summary');
      expect(output).toContain('Total files');
      expect(output).toContain('Created');
    });
  });

  describe('CLI help and version', () => {
    it('should display help information', () => {
      const output = execSync(`node ${cliPath} --help`, {
        encoding: 'utf-8',
      });

      expect(output).toContain('test-gen-js');
      expect(output).toContain('generate');
      expect(output).toContain('scan');
      expect(output).toContain('init');
    });

    it('should display version', () => {
      const output = execSync(`node ${cliPath} --version`, {
        encoding: 'utf-8',
      });

      expect(output.trim()).toMatch(/^\d+\.\d+\.\d+$/);
    });

    it('should display generate command help', () => {
      const output = execSync(`node ${cliPath} generate --help`, {
        encoding: 'utf-8',
      });

      expect(output).toContain('--output');
      expect(output).toContain('--snapshot');
      expect(output).toContain('--overwrite');
    });

    it('should display scan command help', () => {
      const output = execSync(`node ${cliPath} scan --help`, {
        encoding: 'utf-8',
      });

      expect(output).toContain('--dry-run');
      expect(output).toContain('--pattern');
      expect(output).toContain('--exclude');
    });
  });

  describe('alias commands', () => {
    it('should work with "g" alias for generate', async () => {
      const componentCode = `
import React from 'react';
export const Alias = () => <div>Alias</div>;
`;
      const componentPath = path.join(tempDir, 'Alias.tsx');
      await fs.writeFile(componentPath, componentCode);

      // Run with alias
      execSync(`node ${cliPath} g ${componentPath}`, {
        cwd: tempDir,
        stdio: 'pipe',
      });

      expect(await fs.pathExists(path.join(tempDir, 'Alias.test.tsx'))).toBe(true);
    });

    it('should work with "s" alias for scan', () => {
      const output = execSync(`node ${cliPath} s ${tempDir} --dry-run`, {
        cwd: tempDir,
        encoding: 'utf-8',
      });

      expect(output).toContain('Scanning');
    });
  });
});

describe('Error Handling', () => {
  const tempDir = path.join(os.tmpdir(), 'test-gen-error-test');
  const cliPath = path.resolve(__dirname, '../bin/cli.js');

  beforeEach(async () => {
    await fs.ensureDir(tempDir);
  });

  afterEach(async () => {
    await fs.remove(tempDir);
  });

  it('should handle invalid file syntax gracefully', async () => {
    const invalidCode = `
export const Broken = ({ => <div>Broken</div>;
`;
    const filePath = path.join(tempDir, 'Broken.tsx');
    await fs.writeFile(filePath, invalidCode);

    expect(() => {
      execSync(`node ${cliPath} generate ${filePath}`, {
        cwd: tempDir,
        stdio: 'pipe',
      });
    }).toThrow();
  });

  it('should handle empty directory gracefully', () => {
    const output = execSync(`node ${cliPath} scan ${tempDir} --dry-run`, {
      cwd: tempDir,
      encoding: 'utf-8',
    });

    expect(output).toContain('No files found');
  });

  it('should handle non-existent directory', () => {
    expect(() => {
      execSync(`node ${cliPath} scan /non/existent/path`, {
        cwd: tempDir,
        stdio: 'pipe',
      });
    }).toThrow();
  });
});

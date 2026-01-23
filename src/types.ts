/**
 * Core types for test-gen-js
 */

/** Supported file types */
export type FileType = 'function' | 'component' | 'hook' | 'class' | 'unknown';

/** Supported frameworks */
export type Framework = 'react' | 'react-native' | 'node' | 'vanilla';

/** Supported test runners */
export type TestRunner = 'jest' | 'vitest';

/** Information about a prop */
export interface PropInfo {
  name: string;
  type: string;
  required: boolean;
  defaultValue?: string;
}

/** Information about an import statement */
export interface ImportInfo {
  source: string;
  specifiers: string[];
  isDefault: boolean;
}

/** Information about a function parameter */
export interface ParamInfo {
  name: string;
  type: string;
  optional: boolean;
  defaultValue?: string;
}

/** Analyzed component information */
export interface ComponentInfo {
  name: string;
  type: 'function' | 'arrow' | 'class';
  props: PropInfo[];
  hooks: string[];
  events: string[];
  children: boolean;
  imports: ImportInfo[];
  filePath: string;
}

/** Analyzed function information */
export interface FunctionInfo {
  name: string;
  params: ParamInfo[];
  returnType: string;
  isAsync: boolean;
  isExported: boolean;
  imports: ImportInfo[];
  filePath: string;
}

/** Analyzed file information */
export interface FileAnalysis {
  filePath: string;
  fileType: FileType;
  framework: Framework;
  components: ComponentInfo[];
  functions: FunctionInfo[];
  imports: ImportInfo[];
}

/** Test generation options */
export interface GeneratorOptions {
  /** Output path for the test file */
  output?: string;
  /** Template type to use */
  template?: 'component' | 'function' | 'hook';
  /** Include snapshot tests */
  snapshot?: boolean;
  /** Auto-generate mocks for dependencies */
  mock?: boolean;
  /** Test file suffix (default: .test) */
  testSuffix?: string;
  /** Overwrite existing test file */
  overwrite?: boolean;
  /** Test runner to use (default: jest) */
  testRunner?: TestRunner;
  /** Custom templates directory */
  templatesDir?: string;
}

/** Generated test result */
export interface GeneratedTest {
  /** Generated test code */
  code: string;
  /** Output file path */
  outputPath: string;
  /** Original source file path */
  sourcePath: string;
  /** Whether the file was created or updated */
  action: 'created' | 'updated' | 'skipped';
}

/** Configuration options */
export interface Config {
  /** File patterns to include */
  include?: string[];
  /** File patterns to exclude */
  exclude?: string[];
  /** Default generator options */
  generator?: GeneratorOptions;
  /** Custom templates directory */
  templatesDir?: string;
}


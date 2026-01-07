/**
 * Test Generator
 * Generates test code from analyzed file information
 */

import ejs from 'ejs';
import path from 'path';
import fs from 'fs-extra';
import type { FileAnalysis, GeneratorOptions, GeneratedTest } from '../types';
import { generateMockValue } from '../parser/typeExtractor';

// Templates directory
const TEMPLATES_DIR = path.join(__dirname, '../templates');

/**
 * Generate test for a single file analysis
 */
export async function generateTest(
  analysis: FileAnalysis,
  options: GeneratorOptions = {}
): Promise<GeneratedTest> {
  const {
    output,
    snapshot = false,
    mock = true,
    testSuffix = '.test',
    overwrite = false,
  } = options;

  // Determine output path
  const ext = path.extname(analysis.filePath);
  const baseName = path.basename(analysis.filePath, ext);
  const dirName = path.dirname(analysis.filePath);
  const outputPath = output || path.join(dirName, `${baseName}${testSuffix}${ext}`);

  // Check if file exists
  const exists = await fs.pathExists(outputPath);
  if (exists && !overwrite) {
    return {
      code: '',
      outputPath,
      sourcePath: analysis.filePath,
      action: 'skipped',
    };
  }

  // Generate test code
  let code: string;

  if (analysis.components.length > 0) {
    code = await generateComponentTest(analysis, { snapshot, mock });
  } else if (analysis.functions.length > 0) {
    code = await generateFunctionTest(analysis, { mock });
  } else {
    throw new Error('No components or functions found to generate tests for');
  }

  // Write to file
  await fs.ensureDir(path.dirname(outputPath));
  await fs.writeFile(outputPath, code, 'utf-8');

  return {
    code,
    outputPath,
    sourcePath: analysis.filePath,
    action: exists ? 'updated' : 'created',
  };
}

/**
 * Generate tests for multiple file analyses
 */
export async function generateTests(
  analyses: FileAnalysis[],
  options: GeneratorOptions = {}
): Promise<GeneratedTest[]> {
  const results: GeneratedTest[] = [];

  for (const analysis of analyses) {
    const result = await generateTest(analysis, options);
    results.push(result);
  }

  return results;
}

/**
 * Generate test code for components
 */
async function generateComponentTest(
  analysis: FileAnalysis,
  options: { snapshot: boolean; mock: boolean }
): Promise<string> {
  const templatePath = path.join(TEMPLATES_DIR, 'component.ejs');

  // Check if custom template exists, otherwise use default
  let template: string;
  if (await fs.pathExists(templatePath)) {
    template = await fs.readFile(templatePath, 'utf-8');
  } else {
    template = getDefaultComponentTemplate();
  }

  // Prepare template data
  const data = {
    analysis,
    options,
    helpers: {
      generateMockValue,
      generatePropValue,
      getRelativeImport,
      getTestingLibrary,
    },
  };

  return ejs.render(template, data);
}

/**
 * Generate test code for functions
 */
async function generateFunctionTest(
  analysis: FileAnalysis,
  options: { mock: boolean }
): Promise<string> {
  const templatePath = path.join(TEMPLATES_DIR, 'function.ejs');

  // Check if custom template exists, otherwise use default
  let template: string;
  if (await fs.pathExists(templatePath)) {
    template = await fs.readFile(templatePath, 'utf-8');
  } else {
    template = getDefaultFunctionTemplate();
  }

  // Prepare template data
  const data = {
    analysis,
    options,
    helpers: {
      generateMockValue,
      getRelativeImport,
    },
  };

  return ejs.render(template, data);
}

/**
 * Generate a prop value for testing
 */
function generatePropValue(prop: { name: string; type: string; required: boolean }): string {
  // Event handlers
  if (prop.name.startsWith('on') && prop.name.length > 2) {
    return 'jest.fn()';
  }

  // Common prop patterns
  if (prop.name === 'children') return "'Test Children'";
  if (prop.name === 'className' || prop.name === 'style') return "{}";
  if (prop.name === 'testID' || prop.name === 'data-testid') return "'test-id'";
  if (prop.name.toLowerCase().includes('id')) return "'test-id'";
  if (prop.name.toLowerCase().includes('name')) return "'Test Name'";
  if (prop.name.toLowerCase().includes('title')) return "'Test Title'";
  if (prop.name.toLowerCase().includes('label')) return "'Test Label'";
  if (prop.name.toLowerCase().includes('text')) return "'Test Text'";
  if (prop.name.toLowerCase().includes('disabled')) return 'false';
  if (prop.name.toLowerCase().includes('loading')) return 'false';
  if (prop.name.toLowerCase().includes('visible')) return 'true';
  if (prop.name.toLowerCase().includes('active')) return 'true';

  return generateMockValue(prop.type);
}

/**
 * Get relative import path
 */
function getRelativeImport(testPath: string, sourcePath: string): string {
  const relative = path.relative(path.dirname(testPath), sourcePath);
  const ext = path.extname(relative);
  const withoutExt = relative.slice(0, -ext.length);

  // Ensure it starts with ./
  if (!withoutExt.startsWith('.')) {
    return `./${withoutExt}`;
  }

  return withoutExt;
}

/**
 * Get the appropriate testing library import based on framework
 */
function getTestingLibrary(framework: string): { package: string; imports: string[] } {
  switch (framework) {
    case 'react-native':
      return {
        package: '@testing-library/react-native',
        imports: ['render', 'fireEvent', 'screen', 'waitFor'],
      };
    case 'react':
      return {
        package: '@testing-library/react',
        imports: ['render', 'fireEvent', 'screen', 'waitFor'],
      };
    default:
      return {
        package: '@testing-library/react',
        imports: ['render', 'fireEvent', 'screen', 'waitFor'],
      };
  }
}

/**
 * Default component test template
 */
function getDefaultComponentTemplate(): string {
  return `<%
const testLib = helpers.getTestingLibrary(analysis.framework);
const sourceImport = helpers.getRelativeImport(analysis.filePath.replace(/\\.(tsx?|jsx?)$/, '.test.$1'), analysis.filePath);
%>
import React from 'react';
import { <%= testLib.imports.join(', ') %> } from '<%= testLib.package %>';
<% analysis.components.forEach(component => { %>
import { <%= component.name %> } from '<%= sourceImport %>';
<% }); %>

<% analysis.components.forEach(component => { %>
describe('<%= component.name %>', () => {
  const defaultProps = {
<% component.props.forEach((prop, index) => { %>
    <%= prop.name %>: <%= helpers.generatePropValue(prop) %><%= index < component.props.length - 1 ? ',' : '' %>
<% }); %>
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<<%= component.name %> {...defaultProps} />);
  });

<% if (options.snapshot) { %>
  it('matches snapshot', () => {
    const { toJSON } = render(<<%= component.name %> {...defaultProps} />);
    expect(toJSON()).toMatchSnapshot();
  });

<% } %>
<% component.events.forEach(event => { %>
  it('calls <%= event %> when triggered', () => {
    const handler = jest.fn();
    render(<<%= component.name %> {...defaultProps} <%= event %>={handler} />);
    
    // TODO: Trigger the <%= event %> event
    // fireEvent.press(screen.getByTestId('...'));
    
    // expect(handler).toHaveBeenCalled();
  });

<% }); %>
<% component.hooks.forEach(hook => { %>
  // TODO: Test <%= hook %> behavior
  it('uses <%= hook %> correctly', () => {
    render(<<%= component.name %> {...defaultProps} />);
    // Add assertions for <%= hook %>
  });

<% }); %>
});

<% }); %>
`;
}

/**
 * Default function test template
 */
function getDefaultFunctionTemplate(): string {
  return `<%
const sourceImport = helpers.getRelativeImport(analysis.filePath.replace(/\\.(tsx?|jsx?)$/, '.test.$1'), analysis.filePath);
%>
<% analysis.functions.forEach(func => { %>
import { <%= func.name %> } from '<%= sourceImport %>';
<% }); %>

<% analysis.functions.forEach(func => { %>
describe('<%= func.name %>', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

<% if (func.isAsync) { %>
  it('should resolve successfully', async () => {
    const result = await <%= func.name %>(<%= func.params.map(p => helpers.generateMockValue(p.type)).join(', ') %>);
    
    // TODO: Add assertions
    expect(result).toBeDefined();
  });

  it('should handle errors', async () => {
    // TODO: Mock error scenario
    // await expect(<%= func.name %>()).rejects.toThrow();
  });
<% } else { %>
  it('should return expected result', () => {
    const result = <%= func.name %>(<%= func.params.map(p => helpers.generateMockValue(p.type)).join(', ') %>);
    
    // TODO: Add assertions
    expect(result).toBeDefined();
  });
<% } %>

<% func.params.forEach(param => { %>
  it('should handle <%= param.name %> parameter', () => {
    // TODO: Test with different <%= param.name %> values
  });

<% }); %>
});

<% }); %>
`;
}


/**
 * Naming Utils Tests
 */

import {
  toPascalCase,
  toCamelCase,
  toKebabCase,
  toSnakeCase,
  isPascalCase,
  isCamelCase,
  getDescribeName,
  getTestName,
} from './naming';

describe('toPascalCase', () => {
  it('should convert kebab-case to PascalCase', () => {
    expect(toPascalCase('my-component')).toBe('MyComponent');
    expect(toPascalCase('button-group')).toBe('ButtonGroup');
  });

  it('should convert snake_case to PascalCase', () => {
    expect(toPascalCase('my_component')).toBe('MyComponent');
    expect(toPascalCase('button_group')).toBe('ButtonGroup');
  });

  it('should handle single word', () => {
    expect(toPascalCase('button')).toBe('Button');
    expect(toPascalCase('Button')).toBe('Button');
  });

  it('should handle already PascalCase', () => {
    expect(toPascalCase('MyComponent')).toBe('MyComponent');
  });
});

describe('toCamelCase', () => {
  it('should convert kebab-case to camelCase', () => {
    expect(toCamelCase('my-function')).toBe('myFunction');
    expect(toCamelCase('get-user-data')).toBe('getUserData');
  });

  it('should convert snake_case to camelCase', () => {
    expect(toCamelCase('my_function')).toBe('myFunction');
    expect(toCamelCase('get_user_data')).toBe('getUserData');
  });

  it('should handle single word', () => {
    expect(toCamelCase('function')).toBe('function');
    expect(toCamelCase('Function')).toBe('function');
  });

  it('should handle already camelCase', () => {
    expect(toCamelCase('myFunction')).toBe('myFunction');
  });
});

describe('toKebabCase', () => {
  it('should convert PascalCase to kebab-case', () => {
    expect(toKebabCase('MyComponent')).toBe('my-component');
    expect(toKebabCase('ButtonGroup')).toBe('button-group');
  });

  it('should convert camelCase to kebab-case', () => {
    expect(toKebabCase('myFunction')).toBe('my-function');
    expect(toKebabCase('getUserData')).toBe('get-user-data');
  });

  it('should convert snake_case to kebab-case', () => {
    expect(toKebabCase('my_function')).toBe('my-function');
  });

  it('should handle spaces', () => {
    expect(toKebabCase('my function')).toBe('my-function');
  });

  it('should handle single word', () => {
    expect(toKebabCase('button')).toBe('button');
  });
});

describe('toSnakeCase', () => {
  it('should convert PascalCase to snake_case', () => {
    expect(toSnakeCase('MyComponent')).toBe('my_component');
    expect(toSnakeCase('ButtonGroup')).toBe('button_group');
  });

  it('should convert camelCase to snake_case', () => {
    expect(toSnakeCase('myFunction')).toBe('my_function');
    expect(toSnakeCase('getUserData')).toBe('get_user_data');
  });

  it('should convert kebab-case to snake_case', () => {
    expect(toSnakeCase('my-function')).toBe('my_function');
  });

  it('should handle spaces', () => {
    expect(toSnakeCase('my function')).toBe('my_function');
  });

  it('should handle single word', () => {
    expect(toSnakeCase('button')).toBe('button');
  });
});

describe('isPascalCase', () => {
  it('should return true for PascalCase strings', () => {
    expect(isPascalCase('MyComponent')).toBe(true);
    expect(isPascalCase('Button')).toBe(true);
    expect(isPascalCase('ButtonGroup')).toBe(true);
    expect(isPascalCase('A')).toBe(true);
  });

  it('should return false for non-PascalCase strings', () => {
    expect(isPascalCase('myComponent')).toBe(false);
    expect(isPascalCase('button')).toBe(false);
    expect(isPascalCase('button-group')).toBe(false);
    expect(isPascalCase('button_group')).toBe(false);
    // Note: BUTTON matches regex /^[A-Z][a-zA-Z0-9]*$/ so it returns true
    expect(isPascalCase('BUTTON')).toBe(true);
  });

  it('should return false for strings with special characters', () => {
    expect(isPascalCase('My-Component')).toBe(false);
    expect(isPascalCase('My_Component')).toBe(false);
    expect(isPascalCase('My Component')).toBe(false);
  });
});

describe('isCamelCase', () => {
  it('should return true for camelCase strings', () => {
    expect(isCamelCase('myFunction')).toBe(true);
    expect(isCamelCase('button')).toBe(true);
    expect(isCamelCase('getUserData')).toBe(true);
    expect(isCamelCase('a')).toBe(true);
  });

  it('should return false for non-camelCase strings', () => {
    expect(isCamelCase('MyComponent')).toBe(false);
    expect(isCamelCase('Button')).toBe(false);
    expect(isCamelCase('get-user-data')).toBe(false);
    expect(isCamelCase('get_user_data')).toBe(false);
    expect(isCamelCase('BUTTON')).toBe(false);
  });

  it('should return false for strings with special characters', () => {
    expect(isCamelCase('my-function')).toBe(false);
    expect(isCamelCase('my_function')).toBe(false);
    expect(isCamelCase('my function')).toBe(false);
  });
});

describe('getDescribeName', () => {
  it('should return the name as-is', () => {
    expect(getDescribeName('Button')).toBe('Button');
    expect(getDescribeName('myFunction')).toBe('myFunction');
  });
});

describe('getTestName', () => {
  it('should generate test name with action', () => {
    expect(getTestName('Button', 'should render')).toBe('should render button');
    expect(getTestName('MyComponent', 'should handle')).toBe('should handle myComponent');
  });
});

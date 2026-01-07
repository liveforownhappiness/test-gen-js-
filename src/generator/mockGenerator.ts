/**
 * Mock Generator
 * Generates mock code for dependencies
 */

import type { ImportInfo } from '../types';

/**
 * Generate mock statements for imports
 */
export function generateMocks(imports: ImportInfo[]): string[] {
  const mocks: string[] = [];

  for (const imp of imports) {
    const mock = generateMockForImport(imp);
    if (mock) {
      mocks.push(mock);
    }
  }

  return mocks;
}

/**
 * Generate mock for a single import
 */
function generateMockForImport(imp: ImportInfo): string | null {
  // Skip React and testing library imports
  if (shouldSkipMock(imp.source)) {
    return null;
  }

  // Navigation mocks
  if (imp.source === '@react-navigation/native') {
    return `jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    reset: jest.fn(),
  }),
  useRoute: () => ({
    params: {},
  }),
  useFocusEffect: jest.fn(),
}));`;
  }

  if (imp.source === '@react-navigation/stack') {
    return `jest.mock('@react-navigation/stack', () => ({
  createStackNavigator: jest.fn(() => ({
    Navigator: ({ children }: any) => children,
    Screen: ({ children }: any) => children,
  })),
}));`;
  }

  // Redux mocks
  if (imp.source === 'react-redux') {
    return `jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
  useDispatch: () => jest.fn(),
  Provider: ({ children }: any) => children,
}));`;
  }

  // Async storage mock
  if (imp.source === '@react-native-async-storage/async-storage') {
    return `jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
}));`;
  }

  // Animated mock for React Native
  if (imp.source === 'react-native' && imp.specifiers.includes('Animated')) {
    return `jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');`;
  }

  // Generic mock for other imports
  if (imp.source.startsWith('.') || imp.source.startsWith('@/') || imp.source.startsWith('~/')) {
    // Local imports - generate basic mock
    const mockExports = imp.specifiers
      .map((spec) => {
        if (spec.startsWith('* as')) {
          return null;
        }
        return `  ${spec}: jest.fn()`;
      })
      .filter(Boolean)
      .join(',\n');

    if (mockExports) {
      return `jest.mock('${imp.source}', () => ({
${mockExports},
}));`;
    }
  }

  return null;
}

/**
 * Check if import should be skipped for mocking
 */
function shouldSkipMock(source: string): boolean {
  const skipList = [
    'react',
    'react-native',
    '@testing-library/react',
    '@testing-library/react-native',
    '@testing-library/jest-native',
    'jest',
    '@jest',
  ];

  return skipList.some((skip) => source === skip || source.startsWith(`${skip}/`));
}

/**
 * Generate mock for a hook
 */
export function generateHookMock(hookName: string): string {
  // Common hooks
  const hookMocks: Record<string, string> = {
    useState: `jest.spyOn(React, 'useState').mockImplementation((init) => [init, jest.fn()]);`,
    useEffect: `jest.spyOn(React, 'useEffect').mockImplementation((f) => f());`,
    useContext: `jest.spyOn(React, 'useContext').mockReturnValue({});`,
    useRef: `jest.spyOn(React, 'useRef').mockReturnValue({ current: null });`,
    useMemo: `jest.spyOn(React, 'useMemo').mockImplementation((f) => f());`,
    useCallback: `jest.spyOn(React, 'useCallback').mockImplementation((f) => f);`,
  };

  return hookMocks[hookName] || `// TODO: Mock ${hookName}`;
}


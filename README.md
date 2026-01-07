# test-gen-js

> 🧪 Auto-generate test boilerplate code for JavaScript/TypeScript, React, and React Native projects

[![npm version](https://badge.fury.io/js/test-gen-js.svg)](https://www.npmjs.com/package/test-gen-js)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub Actions](https://github.com/liveforownhappiness/test-gen-js/actions/workflows/ci.yml/badge.svg)](https://github.com/liveforownhappiness/test-gen-js/actions)

---

## 🎯 Goal

> **"From zero tests to having basic tests"**

This library is not about perfect test automation, but about **lowering the barrier to writing tests**.

### Problems This Tool Solves

| Problem | Solution |
|---------|----------|
| 😫 "Creating test files is tedious" | ✅ Auto-generate boilerplate |
| 🤔 "I don't know how to start" | ✅ Provide a working starting point |
| 😰 "I don't even have basic render tests" | ✅ Provide minimal safety net |
| 📚 "I want to learn how to write tests" | ✅ Use as a learning tool |

### Limitations

```
❌ Auto-generate business logic tests → Developers must write these
❌ Perfect test coverage → Not possible (80% boilerplate, 20% manual)
```

---

## 📦 Installation

```bash
# Global installation
npm install -g test-gen-js

# Or use with npx (no installation required)
npx test-gen-js generate src/components/Button.tsx

# Or install as devDependency
npm install -D test-gen-js
```

---

## 🚀 Quick Start

### 1. Generate React Component Tests

**Input: `src/components/Button.tsx`**

```tsx
import React from 'react';

interface ButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
}

export const Button = ({ title, onPress, disabled = false, loading = false }: ButtonProps) => {
  return (
    <button onClick={onPress} disabled={disabled || loading}>
      {loading ? 'Loading...' : title}
    </button>
  );
};
```

**Run command:**

```bash
npx test-gen-js generate src/components/Button.tsx
```

**Output: `src/components/Button.test.tsx`**

```tsx
import React from 'react';
import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  const defaultProps = {
    title: 'Test Title',
    onPress: jest.fn(),
    disabled: false,
    loading: false
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<Button {...defaultProps} />);
  });

  it('renders with title prop', () => {
    render(<Button {...defaultProps} />);
    // TODO: Add specific assertions for title
  });

  it('calls onPress when triggered', () => {
    const handler = jest.fn();
    render(<Button {...defaultProps} onPress={handler} />);
    
    // TODO: Trigger the onPress event
    // fireEvent.click(screen.getByRole('button'));
    
    // expect(handler).toHaveBeenCalled();
  });
});
```

---

### 2. Generate React Native Component Tests

**Input: `src/components/Card.tsx`**

```tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface CardProps {
  title: string;
  description: string;
  onPress?: () => void;
}

export const Card = ({ title, description, onPress }: CardProps) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <TouchableOpacity onPress={onPress} style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16 },
  title: { fontSize: 18, fontWeight: 'bold' },
  description: { fontSize: 14 },
});
```

**Run command:**

```bash
npx test-gen-js generate src/components/Card.tsx --snapshot
```

**Output: `src/components/Card.test.tsx`**

```tsx
import React from 'react';
import { render, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { Card } from './Card';

describe('Card', () => {
  const defaultProps = {
    title: 'Test Title',
    description: 'Test Text',
    onPress: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<Card {...defaultProps} />);
  });

  it('matches snapshot', () => {
    const { toJSON } = render(<Card {...defaultProps} />);
    expect(toJSON()).toMatchSnapshot();
  });

  it('calls onPress when triggered', () => {
    const handler = jest.fn();
    render(<Card {...defaultProps} onPress={handler} />);
    
    // fireEvent.press(screen.getByTestId('card'));
    // expect(handler).toHaveBeenCalled();
  });

  // Hook: useState
  it('uses useState correctly', () => {
    render(<Card {...defaultProps} />);
    // TODO: Add assertions for useState behavior
  });
});
```

---

### 3. Generate Function Tests

**Input: `src/utils/calculate.ts`**

```typescript
export function calculateDiscount(price: number, discountRate: number): number {
  if (discountRate < 0 || discountRate > 1) {
    throw new Error('Invalid discount rate');
  }
  return price * (1 - discountRate);
}

export async function fetchUserData(userId: string): Promise<User> {
  const response = await fetch(`/api/users/${userId}`);
  return response.json();
}
```

**Run command:**

```bash
npx test-gen-js generate src/utils/calculate.ts
```

**Output: `src/utils/calculate.test.ts`**

```typescript
import { calculateDiscount, fetchUserData } from './calculate';

describe('calculateDiscount', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return expected result', () => {
    const result = calculateDiscount(42, 42);
    
    // TODO: Add assertions
    expect(result).toBeDefined();
  });

  describe('price parameter', () => {
    it('should handle valid price', () => {
      // TODO: Test with valid price values
    });
  });

  describe('discountRate parameter', () => {
    it('should handle valid discountRate', () => {
      // TODO: Test with valid discountRate values
    });
  });
});

describe('fetchUserData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should resolve successfully', async () => {
    const result = await fetchUserData('test-string');
    
    // TODO: Add assertions
    expect(result).toBeDefined();
  });

  it('should handle errors gracefully', async () => {
    // TODO: Mock error scenario
    // jest.spyOn(global, 'fetch').mockRejectedValue(new Error('Network error'));
    // await expect(fetchUserData('123')).rejects.toThrow('Network error');
  });
});
```

---

## 📋 CLI Commands

### `generate` (alias: `g`)

Generate tests for a single file

```bash
# Basic usage
test-gen-js generate <file>
tgjs g <file>

# Options
--output, -o <path>    # Specify output file path
--template, -t <type>  # Template type (component | function | hook)
--snapshot             # Include snapshot tests
--mock                 # Auto-generate mocks (default: true)
--overwrite            # Overwrite existing file
```

**Examples:**

```bash
# Basic generation
tgjs g src/components/Header.tsx

# Include snapshot tests
tgjs g src/components/Header.tsx --snapshot

# Custom output path
tgjs g src/components/Header.tsx -o __tests__/Header.test.tsx

# Overwrite existing file
tgjs g src/components/Header.tsx --overwrite
```

### `scan` (alias: `s`) - Coming in v0.2.0

Scan directory and generate tests for all files

```bash
# Basic usage
test-gen-js scan <directory>

# Options
--dry-run              # Preview without creating files
--pattern <glob>       # File pattern (default: **/*.{ts,tsx,js,jsx})
--exclude <patterns>   # Patterns to exclude
```

### `init` - Coming in v0.2.0

Initialize configuration file

```bash
test-gen-js init
```

---

## 📊 Supported Types

| Type | Support | Test Framework | Notes |
|------|---------|----------------|-------|
| JavaScript functions | ✅ | Jest | |
| TypeScript functions | ✅ | Jest | Type analysis supported |
| React components | ✅ | Jest + @testing-library/react | |
| React Native components | ✅ | Jest + @testing-library/react-native | |
| Custom Hooks | ✅ | Jest + @testing-library/react-hooks | |
| Node.js modules | 🔜 v0.2 | Jest | |
| Express handlers | 🔜 v0.2 | Jest + supertest | |
| Vue components | 🔜 Plugin | Vitest | |
| Angular components | 🔜 Plugin | Jasmine | |

---

## 🔧 How It Works

### AST (Abstract Syntax Tree) Analysis

```
┌─────────────────────────────────────────────────────────────────┐
│  1. Input: Button.tsx                                           │
├─────────────────────────────────────────────────────────────────┤
│  export const Button = ({ title, onPress, disabled }) => {      │
│    const [loading, setLoading] = useState(false);               │
│    return (                                                     │
│      <TouchableOpacity onPress={onPress} disabled={disabled}>   │
│        <Text>{title}</Text>                                     │
│      </TouchableOpacity>                                        │
│    );                                                           │
│  }                                                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ Babel Parser
┌─────────────────────────────────────────────────────────────────┐
│  2. AST Analysis Result                                         │
├─────────────────────────────────────────────────────────────────┤
│  {                                                              │
│    name: "Button",                                              │
│    type: "arrow",                                               │
│    props: [                                                     │
│      { name: "title", type: "string", required: true },         │
│      { name: "onPress", type: "function", required: true },     │
│      { name: "disabled", type: "boolean", required: false }     │
│    ],                                                           │
│    hooks: ["useState"],                                         │
│    events: ["onPress"],                                         │
│    framework: "react-native"                                    │
│  }                                                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ EJS Template
┌─────────────────────────────────────────────────────────────────┐
│  3. Output: Button.test.tsx                                     │
├─────────────────────────────────────────────────────────────────┤
│  describe('Button', () => {                                     │
│    const defaultProps = { title: '...', onPress: jest.fn() };   │
│    it('renders without crashing', () => { ... });               │
│    it('calls onPress when pressed', () => { ... });             │
│    it('uses useState correctly', () => { ... });                │
│  });                                                            │
└─────────────────────────────────────────────────────────────────┘
```

### Automation Coverage

| Area | Automation Level | Description |
|------|------------------|-------------|
| Import statements | ✅ 100% | Auto-detect framework |
| describe/it structure | ✅ 100% | Based on component/function name |
| defaultProps generation | ✅ 80% | TypeScript type analysis |
| Mock setup | ✅ 70% | Auto-detect major libraries |
| Render tests | ✅ 100% | Always provided |
| Event handler tests | ✅ 60% | Detect onPress, onClick, etc. |
| Hook tests | ✅ 50% | Detect useState, useEffect, etc. |
| **Business logic tests** | ❌ 0% | **Developer must write** |

---

## 🗺️ Roadmap

### ✅ Phase 1: MVP (v0.1.x) - Current

- [x] Project structure setup
- [x] AST parser implementation (Babel-based)
- [x] CLI interface (commander)
- [x] Basic test generator
  - [x] React components
  - [x] React Native components
  - [x] JavaScript/TypeScript functions
- [x] EJS template system
- [x] GitHub Actions CI/CD
- [x] Automated npm publishing

### 🔜 Phase 2: Extended Features (v0.2.x)

- [ ] Directory scanning and batch generation (`scan` command)
- [ ] Configuration file support (`.testgenrc.js`)
- [ ] Node.js backend support
- [ ] Improved mock generation
- [ ] Prettier/ESLint integration
- [ ] Watch mode
- [ ] Custom template support

### 🔮 Phase 3: Plugin System (v0.3.x+)

- [ ] Plugin architecture
- [ ] Vue.js plugin
- [ ] Angular plugin
- [ ] VS Code extension
- [ ] AI integration (optional)

---

## 📁 Project Structure

```
test-gen-js/
├── bin/
│   └── cli.js                    # CLI entry point
├── src/
│   ├── index.ts                  # Main exports
│   ├── cli.ts                    # CLI logic (commander)
│   ├── types.ts                  # TypeScript type definitions
│   ├── analyzer/
│   │   ├── index.ts
│   │   ├── fileAnalyzer.ts       # Main file analysis
│   │   ├── componentAnalyzer.ts  # React component analysis
│   │   └── functionAnalyzer.ts   # Function analysis
│   ├── parser/
│   │   ├── index.ts
│   │   ├── astParser.ts          # Babel AST parsing
│   │   └── typeExtractor.ts      # TypeScript type extraction
│   ├── generator/
│   │   ├── index.ts
│   │   ├── testGenerator.ts      # Test code generation
│   │   └── mockGenerator.ts      # Mock code generation
│   ├── templates/
│   │   ├── component.ejs         # Component test template
│   │   ├── function.ejs          # Function test template
│   │   └── snapshot.ejs          # Snapshot test template
│   └── utils/
│       ├── fileUtils.ts          # File utilities
│       └── naming.ts             # Naming utilities
├── .github/
│   └── workflows/
│       ├── ci.yml                # CI (build/test)
│       └── publish.yml           # Automated npm publish
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🤝 Contributing

Contributions are always welcome!

### How to Contribute

1. 🍴 Fork the repository
2. 🌿 Create your feature branch (`git checkout -b feature/amazing-feature`)
3. 💾 Commit your changes (`git commit -m 'Add some amazing feature'`)
4. 📤 Push to the branch (`git push origin feature/amazing-feature`)
5. 🔃 Open a Pull Request

### Types of Contributions

- 🐛 Bug reports
- 💡 Feature requests
- 📝 Documentation improvements
- 🔧 Code contributions
- 🌍 Translations

---

## 📄 License

MIT License - Feel free to use, modify, and distribute.

---

## 🙏 Acknowledgments

- [Babel](https://babeljs.io/) - JavaScript AST parsing
- [Jest](https://jestjs.io/) - Testing framework
- [Testing Library](https://testing-library.com/) - Testing utilities
- [Commander.js](https://github.com/tj/commander.js) - CLI framework
- [EJS](https://ejs.co/) - Template engine

---

## 📞 Contact

- GitHub Issues: [https://github.com/liveforownhappiness/test-gen-js/issues](https://github.com/liveforownhappiness/test-gen-js/issues)
- npm: [https://www.npmjs.com/package/test-gen-js](https://www.npmjs.com/package/test-gen-js)

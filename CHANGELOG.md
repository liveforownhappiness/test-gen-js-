# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned
- Node.js backend support
- Custom templates
- Watch mode
- Vitest template support

---

## [0.3.3] - 2026-01-20

### Added
- 🧪 **Comprehensive Test Suite** - 194 test cases covering all major modules
  - Unit tests for parser, analyzer, generator, utils
  - Integration tests for CLI commands
  - Test coverage improved from 0% to ~60%
- 🔧 **GitHub Actions CI/CD** - Automated testing and publishing
  - `ci.yml` - Runs tests on Node.js 18, 20, 22
  - `publish.yml` - Auto-publish to npm on release
- 📝 **ESLint/Prettier Configuration** - Code quality tools
  - `.eslintrc.js` - TypeScript linting rules
  - `.prettierrc` - Code formatting rules
  - `.eslintignore` / `.prettierignore` - Ignore patterns

### Changed
- 🔄 **Dynamic Version Loading** - CLI version now reads from package.json
  - No more hardcoded version strings
  - Prevents version mismatch issues

### Tests Added
- `astParser.test.ts` - 15 tests for AST parsing
- `typeExtractor.test.ts` - 28 tests for type extraction
- `fileAnalyzer.test.ts` - 14 tests for file analysis
- `functionAnalyzer.test.ts` - 31 tests for function analysis
- `testGenerator.test.ts` - 10 tests for test generation
- `mockGenerator.test.ts` - 24 tests for mock generation
- `fileUtils.test.ts` - 26 tests for file utilities
- `naming.test.ts` - 26 tests for naming utilities
- `cli.integration.test.ts` - 20 tests for CLI integration

---

## [0.3.0] - 2026-01-09

### Added
- 🎉 **HOC Pattern Support** - Now correctly detects and analyzes components wrapped with Higher-Order Components
  - `memo()` and `React.memo()` support
  - `forwardRef()` and `React.forwardRef()` support
  - `lazy()` and `React.lazy()` support
  - Nested HOCs: `memo(forwardRef(() => {}))` support
  - `export default memo(Component)` pattern support
  - `const Wrapped = memo(() => {})` pattern support

### Fixed
- 🐛 Fixed EJS template HTML escaping issue (`'` → `&#39;`)
  - Changed `<%= %>` to `<%- %>` for code generation
- 📝 Added Prerequisites section to README

---

## [0.2.1] - 2026-01-08

### Fixed
- 🐛 Fixed AST traversal error "You must pass a scope and parentPath unless traversing a Program/File"
  - Replaced `@babel/traverse` with recursive node walking for BlockStatement analysis
  - Fixed `isReactComponent` function in `fileAnalyzer.ts`
  - Fixed `extractHooks` function in `componentAnalyzer.ts`
  - Now correctly handles components wrapped with `memo()`, `forwardRef()`, etc.

---

## [0.2.0] - 2026-01-07

### Added
- 🎉 `init` command - Initialize test-gen-js configuration
  - Creates `.testgenrc.js` configuration file
  - Sets up Git hooks with husky and lint-staged
  - Pre-commit hook runs tests automatically before each commit
- 🎉 `scan` command - Scan directory and generate tests for all files
  - Batch generate tests for entire directories
  - Dry-run mode to preview without creating files
  - Progress tracking and summary report
  - Skip files with no components/functions
- Configuration file support (`.testgenrc.js`)

### Commands
- `test-gen-js init` - Initialize configuration and Git hooks
  - `--no-hooks` - Skip Git hooks setup
  - `--force` - Overwrite existing configuration
- `test-gen-js scan <directory>` - Scan and generate tests
  - `--dry-run` - Preview without creating files
  - `--pattern` - File pattern to match
  - `--exclude` - Patterns to exclude
  - `--snapshot` - Include snapshot tests
  - `--overwrite` - Overwrite existing files

### How Pre-commit Testing Works
1. Run `npx test-gen-js init` in your project
2. Husky and lint-staged are automatically installed
3. When you run `git commit`, tests run for staged files
4. If tests pass, commit proceeds; if tests fail, commit is blocked

---

## [0.1.0] - 2024-01-07

### Added
- 🎉 Initial release
- CLI interface with `generate` command
- AST parsing using Babel
- React component analysis
  - Props extraction
  - Hooks detection (useState, useEffect, etc.)
  - Event handlers detection (onPress, onClick, etc.)
- React Native component support
- TypeScript function analysis
  - Parameters extraction
  - Return type detection
  - Async function support
- EJS template system
  - Component test template
  - Function test template
  - Snapshot test template
- Auto-detection of testing library
  - `@testing-library/react` for React
  - `@testing-library/react-native` for React Native
- Mock generation for common libraries
  - React Navigation
  - React Redux
  - AsyncStorage
- GitHub Actions CI/CD
  - Automated testing
  - Automated npm publishing

### Commands
- `test-gen-js generate <file>` - Generate test file
- `tgjs g <file>` - Shorthand alias

### Options
- `--output, -o` - Custom output path
- `--snapshot` - Include snapshot tests
- `--mock` - Auto-generate mocks (default: true)
- `--overwrite` - Overwrite existing files

---

## [0.0.1] - 2024-01-07

### Added
- Project initialization
- Basic project structure

---

[Unreleased]: https://github.com/liveforownhappiness/test-gen-js/compare/v0.3.3...HEAD
[0.3.3]: https://github.com/liveforownhappiness/test-gen-js/compare/v0.3.0...v0.3.3
[0.3.0]: https://github.com/liveforownhappiness/test-gen-js/compare/v0.2.1...v0.3.0
[0.2.1]: https://github.com/liveforownhappiness/test-gen-js/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/liveforownhappiness/test-gen-js/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/liveforownhappiness/test-gen-js/releases/tag/v0.1.0
[0.0.1]: https://github.com/liveforownhappiness/test-gen-js/releases/tag/v0.0.1


# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned
- Directory scanning (`scan` command)
- Configuration file support (`.testgenrc.js`)
- Node.js backend support
- Custom templates

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

[Unreleased]: https://github.com/liveforownhappiness/test-gen-js-/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/liveforownhappiness/test-gen-js-/releases/tag/v0.1.0
[0.0.1]: https://github.com/liveforownhappiness/test-gen-js-/releases/tag/v0.0.1


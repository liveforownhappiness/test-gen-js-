# test-gen-js

> 🧪 Auto-generate test boilerplate code for JavaScript/TypeScript, React, and React Native projects

[![npm version](https://badge.fury.io/js/test-gen-js.svg)](https://www.npmjs.com/package/test-gen-js)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub Actions](https://github.com/liveforownhappiness/test-gen-js-/actions/workflows/ci.yml/badge.svg)](https://github.com/liveforownhappiness/test-gen-js-/actions)

---

## 🎯 목표 (Goal)

> **"테스트 0개 → 기본 테스트라도 있는 상태"**

이 라이브러리는 완벽한 테스트 자동화가 아닌, **테스트 작성의 진입 장벽을 낮추는 것**을 목표로 합니다.

### 이 도구가 해결하는 문제

| 문제 | 해결 |
|------|------|
| 😫 "테스트 파일 만들기 귀찮아요" | ✅ 보일러플레이트 자동 생성 |
| 🤔 "어떻게 시작해야 할지 모르겠어요" | ✅ 실행 가능한 시작점 제공 |
| 😰 "렌더링 기본 테스트도 없어요" | ✅ 최소한의 안전망 제공 |
| 📚 "테스트 작성법을 배우고 싶어요" | ✅ 학습 도구로 활용 가능 |

### 이 도구의 한계

```
❌ 비즈니스 로직 테스트 자동 생성 → 개발자가 직접 작성 필요
❌ 완벽한 테스트 커버리지 → 불가능 (80% 보일러플레이트, 20% 직접 작성)
```

---

## 📦 설치 (Installation)

```bash
# 전역 설치
npm install -g test-gen-js

# 또는 npx로 바로 사용 (설치 없이)
npx test-gen-js generate src/components/Button.tsx

# 또는 프로젝트 devDependency로 설치
npm install -D test-gen-js
```

---

## 🚀 빠른 시작 (Quick Start)

### 1. React 컴포넌트 테스트 생성

**입력: `src/components/Button.tsx`**

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

**명령어 실행:**

```bash
npx test-gen-js generate src/components/Button.tsx
```

**출력: `src/components/Button.test.tsx`**

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

### 2. React Native 컴포넌트 테스트 생성

**입력: `src/components/Card.tsx`**

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

**명령어 실행:**

```bash
npx test-gen-js generate src/components/Card.tsx --snapshot
```

**출력: `src/components/Card.test.tsx`**

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

### 3. 일반 함수 테스트 생성

**입력: `src/utils/calculate.ts`**

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

**명령어 실행:**

```bash
npx test-gen-js generate src/utils/calculate.ts
```

**출력: `src/utils/calculate.test.ts`**

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

## 📋 CLI 명령어

### `generate` (별칭: `g`)

단일 파일에서 테스트 생성

```bash
# 기본 사용
test-gen-js generate <file>
tgjs g <file>

# 옵션
--output, -o <path>    # 출력 파일 경로 지정
--template, -t <type>  # 템플릿 타입 (component | function | hook)
--snapshot             # 스냅샷 테스트 포함
--mock                 # Mock 자동 생성 (기본: true)
--overwrite            # 기존 파일 덮어쓰기
```

**예시:**

```bash
# 기본 생성
tgjs g src/components/Header.tsx

# 스냅샷 테스트 포함
tgjs g src/components/Header.tsx --snapshot

# 커스텀 출력 경로
tgjs g src/components/Header.tsx -o __tests__/Header.test.tsx

# 기존 파일 덮어쓰기
tgjs g src/components/Header.tsx --overwrite
```

### `scan` (별칭: `s`) - v0.2.0 예정

디렉토리 전체 스캔 및 일괄 생성

```bash
# 기본 사용
test-gen-js scan <directory>

# 옵션
--dry-run              # 미리보기 (파일 생성 안 함)
--pattern <glob>       # 파일 패턴 (기본: **/*.{ts,tsx,js,jsx})
--exclude <patterns>   # 제외 패턴
```

### `init` - v0.2.0 예정

설정 파일 초기화

```bash
test-gen-js init
```

---

## 📊 지원 범위

| 타입 | 지원 여부 | 테스트 프레임워크 | 비고 |
|------|----------|-----------------|------|
| JavaScript 함수 | ✅ | Jest | |
| TypeScript 함수 | ✅ | Jest | 타입 분석 지원 |
| React 컴포넌트 | ✅ | Jest + @testing-library/react | |
| React Native 컴포넌트 | ✅ | Jest + @testing-library/react-native | |
| Custom Hooks | ✅ | Jest + @testing-library/react-hooks | |
| Node.js 모듈 | 🔜 v0.2 | Jest | |
| Express 핸들러 | 🔜 v0.2 | Jest + supertest | |
| Vue 컴포넌트 | 🔜 플러그인 | Vitest | |
| Angular 컴포넌트 | 🔜 플러그인 | Jasmine | |

---

## 🔧 작동 원리

### AST (Abstract Syntax Tree) 분석

```
┌─────────────────────────────────────────────────────────────────┐
│  1. 입력: Button.tsx                                            │
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
│  2. AST 분석 결과                                               │
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
│  3. 출력: Button.test.tsx                                       │
├─────────────────────────────────────────────────────────────────┤
│  describe('Button', () => {                                     │
│    const defaultProps = { title: '...', onPress: jest.fn() };   │
│    it('renders without crashing', () => { ... });               │
│    it('calls onPress when pressed', () => { ... });             │
│    it('uses useState correctly', () => { ... });                │
│  });                                                            │
└─────────────────────────────────────────────────────────────────┘
```

### 자동화 범위

| 영역 | 자동화 수준 | 설명 |
|------|------------|------|
| import 문 | ✅ 100% | 프레임워크 자동 감지 |
| describe/it 구조 | ✅ 100% | 컴포넌트/함수명 기반 |
| defaultProps 생성 | ✅ 80% | TypeScript 타입 분석 |
| Mock 설정 | ✅ 70% | 주요 라이브러리 자동 감지 |
| 렌더링 테스트 | ✅ 100% | 기본 제공 |
| 이벤트 핸들러 테스트 | ✅ 60% | onPress, onClick 등 감지 |
| Hook 테스트 | ✅ 50% | useState, useEffect 등 감지 |
| **비즈니스 로직 테스트** | ❌ 0% | **개발자 직접 작성 필요** |

---

## 🗺️ 로드맵 (Roadmap)

### ✅ 1단계: MVP (v0.1.x) - 현재

- [x] 프로젝트 구조 설정
- [x] AST 파서 구현 (Babel 기반)
- [x] CLI 인터페이스 (commander)
- [x] 기본 테스트 생성기
  - [x] React 컴포넌트
  - [x] React Native 컴포넌트
  - [x] JavaScript/TypeScript 함수
- [x] EJS 템플릿 시스템
- [x] GitHub Actions CI/CD
- [x] npm 자동 퍼블리시

### 🔜 2단계: 확장 (v0.2.x)

- [ ] 디렉토리 스캔 및 일괄 생성 (`scan` 명령어)
- [ ] 설정 파일 지원 (`.testgenrc.js`)
- [ ] Node.js 백엔드 지원
- [ ] Mock 자동 생성 개선
- [ ] Prettier/ESLint 연동
- [ ] Watch 모드
- [ ] 커스텀 템플릿 지원

### 🔮 3단계: 플러그인 시스템 (v0.3.x+)

- [ ] 플러그인 아키텍처
- [ ] Vue.js 플러그인
- [ ] Angular 플러그인
- [ ] VS Code 확장
- [ ] AI 통합 (선택적)

---

## 📁 프로젝트 구조

```
test-gen-js/
├── bin/
│   └── cli.js                    # CLI 진입점
├── src/
│   ├── index.ts                  # 메인 export
│   ├── cli.ts                    # CLI 로직 (commander)
│   ├── types.ts                  # TypeScript 타입 정의
│   ├── analyzer/
│   │   ├── index.ts
│   │   ├── fileAnalyzer.ts       # 파일 분석 메인
│   │   ├── componentAnalyzer.ts  # React 컴포넌트 분석
│   │   └── functionAnalyzer.ts   # 함수 분석
│   ├── parser/
│   │   ├── index.ts
│   │   ├── astParser.ts          # Babel AST 파싱
│   │   └── typeExtractor.ts      # TypeScript 타입 추출
│   ├── generator/
│   │   ├── index.ts
│   │   ├── testGenerator.ts      # 테스트 코드 생성
│   │   └── mockGenerator.ts      # Mock 코드 생성
│   ├── templates/
│   │   ├── component.ejs         # 컴포넌트 테스트 템플릿
│   │   ├── function.ejs          # 함수 테스트 템플릿
│   │   └── snapshot.ejs          # 스냅샷 테스트 템플릿
│   └── utils/
│       ├── fileUtils.ts          # 파일 유틸리티
│       └── naming.ts             # 네이밍 유틸리티
├── .github/
│   └── workflows/
│       ├── ci.yml                # CI (빌드/테스트)
│       └── publish.yml           # npm 자동 퍼블리시
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🤝 기여하기 (Contributing)

기여는 언제나 환영합니다!

### 기여 방법

1. 🍴 Fork the repository
2. 🌿 Create your feature branch (`git checkout -b feature/amazing-feature`)
3. 💾 Commit your changes (`git commit -m 'Add some amazing feature'`)
4. 📤 Push to the branch (`git push origin feature/amazing-feature`)
5. 🔃 Open a Pull Request

### 기여 유형

- 🐛 버그 리포트
- 💡 기능 제안
- 📝 문서 개선
- 🔧 코드 기여
- 🌍 번역

---

## 📄 라이선스 (License)

MIT License - 자유롭게 사용, 수정, 배포할 수 있습니다.

---

## 🙏 감사의 글 (Acknowledgments)

- [Babel](https://babeljs.io/) - JavaScript AST 파싱
- [Jest](https://jestjs.io/) - 테스트 프레임워크
- [Testing Library](https://testing-library.com/) - 테스트 유틸리티
- [Commander.js](https://github.com/tj/commander.js) - CLI 프레임워크
- [EJS](https://ejs.co/) - 템플릿 엔진

---

## 📞 문의 (Contact)

- GitHub Issues: [https://github.com/liveforownhappiness/test-gen-js-/issues](https://github.com/liveforownhappiness/test-gen-js-/issues)
- npm: [https://www.npmjs.com/package/test-gen-js](https://www.npmjs.com/package/test-gen-js)

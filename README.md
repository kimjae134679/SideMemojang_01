# 사이드메모장 v1.0.0

화면 가장자리에 붙는 개인용 플로팅 메모장입니다.

## 가장 쉬운 exe 생성 방법

1. Node.js LTS 설치: https://nodejs.org
2. 이 폴더의 `build.bat` 더블클릭
3. 완료되면 `release` 폴더가 열림
4. `사이드메모장 Setup 1.0.0.exe` 실행

## 개발 실행

`run-dev.bat`을 더블클릭하거나 아래 명령을 사용합니다.

```bash
npm install
npm start
```

## 수동 빌드

```bash
npm install
npm run dist
```

빌드 결과물은 `release/` 폴더에 생성됩니다.

## 기능

- 항상 위 플로팅 패널
- 오른쪽/왼쪽 가장자리 고정
- 접힌 탭 / 펼친 패널
- 메모 슬롯 3개
- 자동 저장
- URL 자동 감지 및 외부 브라우저 열기
- 테마 색상 선택
- 단축키 기본값: `Ctrl + Shift + M`
- Windows 시작 시 자동 실행 옵션
- JSON 데이터 내보내기/가져오기
- 설치형 Setup.exe / 포터블 exe 빌드 설정 포함

## 데이터 저장 위치

Windows 기준:

```txt
C:\Users\사용자명\AppData\Roaming\side-memojang\side-memojang-data.json
```

## 보안 방향

- 렌더러에서 Node.js 직접 접근 차단
- `contextIsolation: true`
- 허용된 preload API만 사용
- 외부 링크는 `http`, `https`, `mailto`만 허용
- 데이터는 로컬 JSON 파일로만 저장
- 자동 업데이트 없음


## 앱 정보

- Developer: Seokryu
- Contact: kjseokryu@gmail.com

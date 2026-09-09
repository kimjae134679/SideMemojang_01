# 사이드메모장 (SideMemojang_01)

화면 좌/우 가장자리에 붙여 쓰는 Windows용 개인 플로팅 메모장입니다.

## 프로젝트 목적

- 항상 위에 둘 수 있는 작고 빠른 사이드 메모장.
- 여러 메모 자동 저장.
- 텍스트 서식과 이미지 삽입 지원.
- 가로/세로 메모 탭.
- 설치/업데이트/삭제를 해도 사용자 메모와 설정은 유지.

## 현재 상태 — 2026-09-09

현재 GitHub에는 **v1.1.3 정식 Release가 실제 게시되어 있습니다.**

- Release: `https://github.com/kimjae134679/SideMemojang_01/releases/tag/v1.1.3`
- Setup: `side-memojang-setup-1.1.3.exe`
- Update metadata: `latest.yml`

다만 소스 쪽은 아직 정리가 필요합니다.

- 현재 `main/package.json` version = `1.1.2`
- 현재 `main/package-lock.json` root version = `1.0.6`
- `v1.1.3` 태그의 `package.json`도 `1.1.2`
- repo 안의 v1.1.3 source bundle은 현재 확인상 `part01`만 존재

즉 **배포물 v1.1.3은 존재하지만, 그 배포물과 정확히 대응하는 개발 소스 기준점이 현재 repo에서 깔끔하게 정리되어 있지는 않습니다.** 다음 수정 전에 이 부분을 먼저 복구/확인해야 합니다.

또한 v1.1.3 게시 후 사용자가 전체 설치/업데이트 회귀 QA를 끝냈다는 기록은 현재 확인되지 않았습니다.

## 실제 구현되어 있는 주요 기능

- 화면 좌/우 가장자리 도킹
- 펼침/접힘
- 항상 위
- 외부 클릭 시 접기
- Windows 시작 시 자동 실행 옵션
- 여러 메모 및 자동 저장
- 메모 이름 변경/삭제
- 데이터 가져오기/내보내기
- 글자 크기, 굵게/기울임/밑줄/취소선, 색상, 정렬, 목록/체크리스트
- 이미지 삽입/선택/크기 조절
- 이미지 Ctrl+C / Ctrl+X / Ctrl+V / Ctrl+Z
- 가로/세로 메모 탭
- 업데이트 확인
- 완전 재설치
- 프로그램 삭제

일부 기능은 코드에 구현되어 있어도 최신 설치본에서 전체 QA가 다시 필요합니다.

## 중요한 결정

- 확정한 버전은 동결하고, 다음 수정은 다음 patch 버전으로 진행.
- v1.1.3 이후 새 앱 코드 수정은 **1.1.4**로 진행하되, 먼저 v1.1.3 소스 기준점을 복구해야 함.
- 프로그램 삭제/재설치/업데이트 시 메모와 설정 데이터는 유지.
- 데이터 위치: `%APPDATA%\side-memojang\side-memojang-data.json`
- 이미지 **드래그 이동 기능은 폐기**. 다시 넣지 않음.
- 이미지 Ctrl+C/X/V 성공 시 `복사됨/잘라냄/붙여넣음` 토스트를 띄우지 않음.
- Delete/Backspace는 직접 선택한 이미지만 삭제해야 함.
- 세로 탭에서 `+`만 남고 메모 목록이 사라지는 회귀 금지.
- GitHub PAT를 Electron 앱/JS/ASAR에 하드코딩하지 않음.
- 과거 별도 public update repo 구상이 있었지만, **현재 실제 구조는 `SideMemojang_01` 자체가 public이고 같은 repo의 Releases를 사용**함.

## 다음 할 일

1. 과거 `SideMemojang_01-v1.1.3-source.zip` 또는 이에 대응하는 정확한 v1.1.3 소스를 다시 확보.
2. 현재 `main`, v1.1.3 Release 설치본, `package.json`, `package-lock.json`, `src/` 내용을 비교해 기준점 확정.
3. 실제 Windows에서 v1.1.2 → v1.1.3 업데이트 확인/설치/데이터 유지 QA.
4. 좌측 도킹, Ctrl+B/첫 글자 선택, Ctrl+Shift+X, 이미지 C/X/V/Z, 이미지 오삭제/빈줄, 세로 탭, uninstall/reinstall 회귀 QA.
5. 위 기준이 정리된 뒤 새 수정은 v1.1.4로 진행.
6. 기능 안정화 뒤에만 `node_modules/`, release trigger, `.gitignore` 등 repo 정리 검토.

세부 작업 규칙과 QA 체크리스트는 루트의 `AGENTS.md`를 우선 참고하세요.

## 사용 중인 주요 도구·서비스

### 현재 실제 사용

- JavaScript / HTML / CSS
- Node.js + npm
- Electron `^31.7.7`
- electron-builder `^24.13.3`
- electron-updater `^6.3.9`
- Windows NSIS installer
- ASAR packaging
- GitHub source repository + GitHub Releases

### 개발/운영 보조 — 앱 자체 의존성 아님

- ChatGPT GitHub connector/MCP: repo 조회·수정·Release 확인
- ChatGPT Work / Cloud Browser: 과거 GitHub Release UI 작업 경로
- Remote Desktop Commander: 승인된 Windows PC 파일/환경 확인용

## 내가 미리 준비하거나 로그인/승인해야 하는 것

- Windows PC에서 실제 설치/업데이트 QA 가능 환경
- Node.js LTS
- npm/GitHub 접속 가능한 인터넷
- GitHub에 commit/push/Release 수정이 필요할 때 GitHub 로그인 및 repo write 권한

현재 확인된 별도 API key, 비밀 환경변수, GitHub PAT, 코드서명 인증서 필수 조건은 없습니다.

오히려 **PAT를 앱 안에 넣으면 안 됩니다.** 현재 빌드는 개인용 미서명 앱 흐름이며 기존 updater에는 미서명 업데이트 호환 처리가 들어간 이력이 있습니다.

## 빌드·실행

권장: ZIP을 완전히 풀고 영문 경로에서 작업. 기존 가이드 예시는 `C:\side-memojang`이며, 이 경로가 현재 실제 checkout 경로라는 뜻은 아닙니다.

의존성 설치:

`npm install`

개발 실행:

`npm start`

NSIS Setup 빌드:

`npm run dist`

포터블 빌드:

`npm run dist:portable`

unpacked directory:

`npm run pack`

또는 루트의 `build.bat`을 사용할 수 있습니다. 결과는 `release/`에 생성됩니다.

현재 자동화된 `test`/`lint` 스크립트는 확인되지 않았으므로 실제 Windows 수동 QA가 중요합니다.

## 다시 쓸 만한 팁

- `npm start` 개발 실행만으로 auto-update 정상 여부를 판단하지 말 것. 업데이트는 Setup.exe 설치본으로 확인.
- `win-unpacked`는 정식 installer가 아니므로 `Uninstall 사이드메모장.exe`가 없는 것이 정상.
- 정식 Setup 설치본 삭제는 NSIS uninstaller를 우선 사용.
- 삭제 시 설치 폴더와 `%APPDATA%\side-memojang`을 혼동하지 말 것.
- 이미지 뒤에 강제 `<br>`를 넣으면 과거의 빈 줄 문제가 되살아날 수 있음.
- 텍스트 커서 근처 이미지를 추측해 Backspace/Delete로 지우는 로직을 만들지 말 것.
- `build.bat`은 `node_modules`가 있으면 `npm install`을 건너뜀. 현재 repo에는 `node_modules/`가 추적되어 있으므로 오래된 의존성을 그대로 믿지 말 것.
- `package.json`과 `package-lock.json` 버전을 항상 같이 확인.
- 이미 게시된 v1.1.3 tag/Release를 이유 없이 force 이동하거나 덮어쓰지 말 것.
- 과거 GitHub Actions 실험이 반복 실패 메일을 보낸 이력이 있으므로 실패 workflow를 무한 재시도하지 말 것.

## 주요 링크·경로

- GitHub: `https://github.com/kimjae134679/SideMemojang_01`
- Clone: `https://github.com/kimjae134679/SideMemojang_01.git`
- v1.1.3 Release: `https://github.com/kimjae134679/SideMemojang_01/releases/tag/v1.1.3`
- v1.1.3 Setup: `https://github.com/kimjae134679/SideMemojang_01/releases/download/v1.1.3/side-memojang-setup-1.1.3.exe`
- v1.1.3 latest.yml: `https://github.com/kimjae134679/SideMemojang_01/releases/download/v1.1.3/latest.yml`
- 사용자 데이터: `%APPDATA%\side-memojang\side-memojang-data.json`
- 빌드 결과: `release/`
- 주요 코드: `src/main/main.js`, `src/preload/preload.js`, `src/renderer/`
- 빌드 가이드: `docs/BUILD.md`
- 업데이트 가이드: `docs/AUTO_UPDATE.md`
- 보안 메모: `docs/SECURITY.md`

## 🧰 꿀팁 링크함

### 현재 실제 사용하는 도구의 공식 링크

- Node.js: `https://nodejs.org/`
- Electron: `https://www.electronjs.org/`
- electron-builder: `https://www.electron.build/`
- electron-builder auto-update 문서: `https://www.electron.build/auto-update.html`
- 현재 프로젝트 GitHub: `https://github.com/kimjae134679/SideMemojang_01`

### 참고/후보로만 남겨둘 것

- `SideMemojang_Releases`
- `SideMemojang_Update`

위 두 이름은 과거 private repo의 업데이트 404를 피하기 위해 **별도 public update repo 후보**로 제안된 이름입니다. 현재 실제 사용 중인 저장소로 확인된 것이 아니며, 현재 구조는 `SideMemojang_01` 자체를 public으로 두고 같은 repo의 Releases를 사용합니다.

이 프로젝트 자료에서 그 외 별도로 저장된 오픈소스/자료 링크는 현재 확인되지 않았으므로, 다른 프로젝트의 링크를 섞어 넣지 않았습니다.

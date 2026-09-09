# AGENTS.md

> 기준 시각: 2026-09-09 KST  
> 대상 프로젝트: `kimjae134679/SideMemojang_01` / 사이드메모장  
> 이 문서는 다음 AI/작업자가 새 채팅에서 바로 이어서 작업하기 위한 실제 인수인계다. 확인되지 않은 내용을 사실처럼 가정하지 말 것.

## 0. 가장 먼저 읽을 결론

- 사이드메모장은 Electron 기반 Windows 플로팅 메모장이다.
- GitHub에는 **v1.1.3 Release가 실제 게시되어 있고** `side-memojang-setup-1.1.3.exe`와 `latest.yml`이 존재한다.
- 그러나 **현재 `main` 소스 메타데이터는 Release와 일치하지 않는다.**
  - `package.json` = `1.1.2`
  - `package-lock.json` 루트 = `1.0.6`
  - `v1.1.3` 태그의 `package.json`도 = `1.1.2`
  - `release-bundles/`의 v1.1.3 소스 묶음은 현재 확인상 `part01`만 존재한다.
- 따라서 다음 코드 수정부터 바로 `1.1.4`를 만들기 전에, **실제 v1.1.3 설치본과 일치하는 소스 기준점을 먼저 복구/확정**해야 한다.
- v1.1.3 Release 게시 이후 사용자가 설치본 전체 QA를 완료했다는 근거는 현재 자료에서 확인되지 않았다. 업데이트·데이터 보존·UI·이미지·삭제 기능을 실제 Windows에서 다시 검증해야 한다.
- 이 AGENTS.md/README.md 추가는 문서 정리 작업일 뿐이며 앱 코드나 앱 버전을 변경하는 작업이 아니다.

## 1. 현재 목표

현재 최우선 목표는 **v1.1.3 배포물을 재현 가능한 정상 기준판으로 정리하고 실제 설치 환경에서 검증하는 것**이다.

완료 조건:

1. v1.1.3 Release에 대응하는 정확한 소스를 확보한다.
2. `package.json`, `package-lock.json`, 실제 `src/` 코드의 버전/내용 관계를 정리한다.
3. 이미 게시된 v1.1.3 Release 자산과 `latest.yml`의 일치 여부를 확인한다.
4. 기존 v1.1.2 설치본에서 업데이트 확인 → v1.1.3 감지 → 다운로드/설치 → v1.1.3 실행까지 실제로 확인한다.
5. 기존 메모/설정 데이터가 유지되는지 확인한다.
6. 최근 수정 기능의 회귀 테스트를 통과한다.
7. 그 뒤 새 기능/버그 수정이 필요하면 **1.1.4**로 진행한다.

## 2. 2026-09-09 현재 확인된 GitHub 상태

### 저장소

- Repo: `https://github.com/kimjae134679/SideMemojang_01`
- Clone: `https://github.com/kimjae134679/SideMemojang_01.git`
- 기본 브랜치: `main`
- 현재 visibility: **public**
- 현재 연결된 GitHub 권한: repo에 admin/push 가능 상태가 확인됨.

과거 인수인계에는 repo가 private라고 기록되어 있으나, **현재 실제 GitHub 상태는 public**이다. 과거의 “private source repo + 별도 public update repo” 계획을 현재 구조로 착각하지 말 것.

### 현재 Release

- Release: `https://github.com/kimjae134679/SideMemojang_01/releases/tag/v1.1.3`
- Tag: `v1.1.3`
- Title: `SideMemojang v1.1.3`
- Draft: OFF
- Prerelease: OFF
- 게시 시각: 2026-08-28

Release assets:

- `side-memojang-setup-1.1.3.exe`
  - size: `114150912` bytes
  - GitHub SHA-256 digest: `7062f841a122518dc2993a0a118e330db2047f990957a714071fd131f0cac81a`
  - URL: `https://github.com/kimjae134679/SideMemojang_01/releases/download/v1.1.3/side-memojang-setup-1.1.3.exe`
- `latest.yml`
  - size: `358` bytes
  - GitHub SHA-256 digest: `684f14234d2c51abfc8ec49ecdf7fbe0b093ab16f22f3d6afcb93b326d343843`
  - URL: `https://github.com/kimjae134679/SideMemojang_01/releases/download/v1.1.3/latest.yml`

별도로 보관된 `latest-1.1.3.yml` 내용에서 확인된 값:

- version: `1.1.3`
- path: `side-memojang-setup-1.1.3.exe`
- size: `114150912`
- sha512: `93W5wjQcicqnmNx6yU1vERu76yAEzXoCHalJ3C5LjspoeUFBdVBY4lU6uZ+kXst4gLruM6D0ohoB60zxgtaRvA==`
- releaseDate: `2026-08-26T16:33:42.865769Z`

### 현재 소스 불일치

반드시 먼저 해결/이해할 것:

- `main/package.json`의 version은 `1.1.2`.
- `main/package-lock.json`의 root version 및 `packages[""]` version은 `1.0.6`.
- `v1.1.3` 태그의 `package.json`도 `1.1.2`.
- `release-bundles/`에는 현재:
  - `v1.1.2-source.tar.xz.b64`
  - `v1.1.3-source.tar.xz.b64.part01`
  만 확인되며, v1.1.3 전체 묶음이 repo 안에 완전하게 존재한다고 확인할 수 없다.
- 과거 대화에는 `SideMemojang_01-v1.1.3-source.zip`이 생성/전달된 이력이 기록되어 있으나, 현재 확인 가능한 저장 파일 검색에서는 그 ZIP 자체가 발견되지 않았다.
- 따라서 **v1.1.3 Release가 존재한다는 사실과, 현재 `main`이 정확한 v1.1.3 소스라는 주장은 별개**다.

최근 주요 커밋 이력:

- `5383fd8e553bbd38e747c104e16b71cbe4d34e68` — `Remove temporary release workflow from main`
- `ca0f11b7f4573aa36baa1c7b0a4e5005163d378f` — `Prepare v1.1.3 source bundle part 01`

## 3. 버전 운용 규칙 — 변경 금지

사용자가 확정한 규칙:

1. 확정한 버전은 동결한다.
2. 확정 이후의 수정은 다음 patch 버전으로 진행한다.
3. 개발 중에는 같은 patch 버전으로 계속 수정한다.
4. 사용자가 확정하면 GitHub/Release에 반영한다.
5. 그 다음 신규 수정은 다시 다음 patch 버전으로 진행한다.

현재 흐름:

- `1.1.1` = 과거 확정판
- `1.1.2` = 이후 수정/배포 단계
- `1.1.3` = 현재 GitHub Release로 실제 게시됨
- **v1.1.3 기준 소스/QA를 먼저 복구·확인**
- 그 뒤 새로운 앱 코드 수정은 `1.1.4`

주의:

- 문서 정리만 했다고 앱 버전을 임의로 올리지 않는다.
- 이미 게시된 `v1.1.3` 태그를 임의로 force-move/rewrite하지 않는다. 필요하면 먼저 사용자에게 변경 이유를 명확히 설명하고 결정한다.
- `1.1.01` 같은 버전 표기는 사용하지 않는다.

## 4. 확정된 제품 요구사항

### 기본 동작

- Windows 화면 좌/우 가장자리에 붙는 플로팅 메모장.
- 펼침/접힘.
- 항상 위.
- 다른 곳 클릭 시 접기.
- Windows 시작 시 자동 실행 옵션.
- 화면 위치/크기 설정.
- 접힌 탭 크기/색감 조정.
- 여러 메모.
- 메모 자동 저장.
- 메모 이름 변경/삭제.
- 데이터 가져오기/내보내기.
- 업데이트 확인.
- 완전 재설치.
- 프로그램 삭제.
- 가로/세로 메모 탭 배치 전환.

### 서식

- pt 글자 크기.
- B 굵게.
- I 기울임.
- U 밑줄.
- S 취소선.
- 글자 색상.
- 왼쪽/가운데/오른쪽 정렬 등 정렬 계열.
- 목록/체크리스트.
- 이미지 임베드.

### 좌측 도킹

- left dock 시 화면 작업 영역의 왼쪽 경계에 정확히 붙어야 한다.
- 불필요한 여백/투명 픽셀/transform 오프셋이 없어야 한다.
- 오른쪽 도킹 기존 동작을 깨지 말 것.

### 텍스트 선택/서식

과거 문제:

- 첫 글자까지 드래그 선택하면 Ctrl+B 등 서식이 적용되지 않는 경우.
- 서식 버튼 클릭 시 selection이 풀리는 경우.

유지해야 할 수정 방향:

- contenteditable 경계 밖으로 살짝 넘어간 selection을 무조건 폐기하지 않는다.
- selection range를 editor 내부로 clamp한다.
- first/last character 포함 선택을 처리한다.
- toolbar `mousedown` 시 selection 저장.
- 버튼 실행 전 saved range 복원.

반드시 확인:

- Ctrl+B / Ctrl+I / Ctrl+U / Ctrl+Shift+X
- B / I / U / S 버튼
- 글자 크기 / 글자 색상
- 정렬
- 목록 / 체크리스트

### Ctrl+Shift+X 취소선

사용자가 직접 미동작을 보고한 이력이 있다.

유지해야 할 조건:

- `event.code === 'KeyX'`까지 고려.
- 한글 IME/Shift 상태에서도 안정적으로 인식.
- 이미지 Ctrl+X 분기가 Ctrl+Shift+X를 먼저 먹지 않게 한다.
- 이미지 잘라내기 = Ctrl+X + Shift 없음.
- 취소선 = Ctrl+Shift+X.
- S 버튼과 동일한 취소선 동작을 사용.

### 이미지 기능 — 매우 중요

**폐기된 기능:**

- 이미지 드래그 이동 기능 전체.
- 이미지 자체를 잡아서 위치를 옮기는 기능을 다시 넣지 말 것.
- 예전에 있던 `✥` 이동 아이콘/“선택됨 · 이미지를 끌어 이동” 계열 UI도 되살리지 않는다.

**남겨야 할 기능:**

- 이미지 클릭 선택.
- 선택 테두리.
- 오른쪽 아래 원형 resize handle.
- Ctrl+C 이미지 복사.
- Ctrl+X 이미지 잘라내기.
- Ctrl+V 이미지 붙여넣기.
- Ctrl+Z 이미지 변경 실행취소.
- Delete/Backspace는 **직접 선택된 이미지에만** 적용.

**사용자가 원하지 않는 것:**

- 이미지 Ctrl+C/X/V 성공 시 하단 `복사됨`, `잘라냄`, `붙여넣음` 토스트를 띄우지 않는다.

**이미지 빈칸/오삭제 방지:**

- 이미지 뒤 강제 `<br>` 추가 로직을 되살리지 않는다.
- 연속 이미지 사이에 불필요한 빈 줄/블록이 생기지 않게 한다.
- 텍스트 커서의 Backspace/Delete가 인접 이미지를 추측 삭제하면 안 된다.

### 세로 메모 탭

설정 키:

- `state.settings.memoTabLayout`
- 값: `horizontal` / `vertical`

세로 모드 요구:

- 오른쪽 가장자리에 탭 세로 나열.
- `+` 버튼만 보이고 기존 메모 목록이 사라지는 회귀 금지.
- 탭이 많으면 세로 scroll.
- active tab 강조.
- 편집 영역을 과도하게 침범하지 않는다.
- `...` 버튼이 공간을 많이 먹으면 숨길 수 있다.
- 대신 탭 우클릭 → 이름 변경/삭제 메뉴.
- 가로 탭도 우클릭 메뉴 사용 가능.

### 하단 툴바

- 본문과 `pt / B / I / U / S / 색상 / 정렬` 툴바 사이 vertical whitespace 최소화.
- 툴바는 compact.
- 버튼이 조금 작아져도 됨.
- 불필요하게 공간을 먹는 표시 최소화.

### 삭제 / 재설치

설정 화면의 복구 영역:

- `사이드메모장 완전 재설치`
- `사이드메모장 삭제`

요구:

- 프로그램 파일은 제거.
- 메모/설정 데이터는 유지.
- 삭제 버튼은 재설치 버튼과 같은 둥근 UI 계열.
- 삭제 버튼 아래 `문제가 계속될 때 사용하세요.` 같은 불필요 안내문은 넣지 않는다.

정식 NSIS 설치본:

- 설치 폴더의 `Uninstall 사이드메모장.exe`를 우선 사용.

`win-unpacked`:

- installer가 아니므로 NSIS uninstaller가 원래 없다.
- 테스트용 자체삭제와 정식 Setup uninstall을 혼동하지 않는다.

과거 삭제 스크립트에서 `tasklist | find` 때문에 검은 CMD 창이 뜬 이력이 있다. 정식 사용자 흐름에서는 CMD/PowerShell 콘솔 창이 보이면 안 된다.

## 5. 데이터 보존 — 절대 깨뜨리지 말 것

기본 userData 파일:

`%APPDATA%\side-memojang\side-memojang-data.json`

필수 규칙:

- 설치 폴더와 userData 폴더를 혼동하지 않는다.
- 프로그램 uninstall 시 `%APPDATA%\side-memojang`을 삭제하지 않는다.
- 아래 상황에서도 메모/설정을 유지해야 한다.
  - 업데이트
  - Setup 재설치
  - uninstall 후 재설치
  - 업데이트 확인 실패
  - 업데이트 다운로드 실패

기존 state 구조 기록:

- schema version: `2`
- `appVersion`
- `settings`
- `memos`
- `activeMemoId`

새 설정 키를 추가할 때는 `normalizeState()`에서 기존 데이터와 새 기본 설정을 병합하는 호환 구조를 유지한다.

## 6. 정확한 프로젝트 경로/파일

### Canonical root

현재 확실한 기준 루트는 **GitHub 저장소 루트**다.

`https://github.com/kimjae134679/SideMemojang_01`

현재 로컬 checkout의 절대 경로는 확인되지 않았다. 2026-09-09 연결된 Windows PC에서 SideMemojang 명칭으로 검색했지만 현재 checkout 경로를 특정하지 못했다. 과거 다운로드 폴더 경로를 현재 기준으로 가정하지 말 것.

프로젝트 문서의 빌드 가이드는 영문 경로 예시로 다음을 권장한다.

`C:\side-memojang`

이 경로는 **권장 예시일 뿐 현재 실제 checkout 경로로 확인된 것은 아니다.**

### 주요 파일

- `package.json`
- `package-lock.json`
- `src/main/main.js`
- `src/preload/preload.js`
- `src/renderer/index.html`
- `src/renderer/panel.js`
- `src/renderer/settings.html`
- `src/renderer/settings.js`
- `src/renderer/style.css`
- `assets/icon.ico`
- `assets/trayTemplate.png`
- `docs/AUTO_UPDATE.md`
- `docs/BUILD.md`
- `docs/CHANGELOG.md`
- `docs/SECURITY.md`
- `build.bat`
- `build-visible.bat`
- `build-visible-korean.ps1`
- `dev-patches/`
- `release-bundles/`

현재 repo에는 `node_modules/`도 Git에 추적된 상태가 확인된다.

## 7. 언어 / SDK / 패키징 / 도구

### 앱 기술

- JavaScript / HTML / CSS
- Node.js + npm
- Electron `^31.7.7`
- electron-builder `^24.13.3`
- electron-updater `^6.3.9`

### Windows 패키징

- target: NSIS
- ASAR: enabled
- compression: maximum
- appId: `com.local.sidememojang`
- output: `release/`
- 설치형 artifact: `side-memojang-setup-${version}.exe`
- portable build script도 존재.
- unpacked directory build도 존재.

### 빌드/실행 명령

의존성 설치:

`npm install`

개발 실행:

`npm start`

정식 NSIS 빌드:

`npm run dist`

현재 `dist` 실제 명령:

`electron-builder --win nsis --publish never`

포터블:

`npm run dist:portable`

unpacked directory:

`npm run pack`

Setup alias:

`npm run dist:setup`

`build.bat`은 현재 다음 환경변수를 설정한다.

- `CI=1`
- `ELECTRON_BUILDER_DISABLE_PUBLISH=true`
- `CSC_IDENTITY_AUTO_DISCOVERY=false`

그 뒤 `node_modules`가 없을 때만 `npm install`을 실행하고 `npm run dist`를 호출하며, 성공하면 `release/`를 연다.

### 테스트 명령

현재 `package.json`에 **자동화된 `test`/`lint` 스크립트가 확인되지 않는다.**

따라서 현재 release gate는 실제 Windows 수동 QA다. 자동 테스트가 있다고 가정하거나 `npm test`를 완료 조건으로 보고하지 말 것.

## 8. 빌드/실행 환경

확정 요구 환경:

- Windows 64-bit 데스크톱 앱.
- Node.js LTS 설치 권장.
- npm 다운로드 및 GitHub Releases 접근을 위한 인터넷 연결.

과거 빌드 로그에서 정상적으로 사용된 이력이 있는 환경은 Node `24.16.0`, npm `11.13.0`, Electron `31.7.7`, Windows x64였으나, 이것을 반드시 고정해야 하는 현재 공식 요구 버전으로 오해하지 말 것. 프로젝트 문서는 Node.js LTS를 권장한다.

빌드는 ZIP 내부에서 직접 하지 말고 완전히 압축 해제한 영문 경로에서 진행하는 것이 기존 가이드다.

## 9. GitHub / 로그인 / OAuth / 권한 / 인증 / 서명

### GitHub

- repo 읽기: 현재 public이므로 일반 읽기에는 로그인 불필요.
- commit/push/Release 수정: GitHub 로그인 및 해당 repo write 권한 필요.
- 현재 ChatGPT GitHub 연결에서는 admin/push 권한이 확인되었다.

### 앱 업데이트 인증

- 과거 private repo 시절, 설치된 Electron 앱이 브라우저 GitHub 로그인 세션을 공유하지 않아 Releases 조회가 404가 된 이력이 있다.
- 현재 repo 자체가 public으로 바뀌어 있고 `package.json`의 publish target도 `SideMemojang_01`이다.
- 과거 제안이었던 `SideMemojang_Releases` / `SideMemojang_Update` 별도 public repo는 **현재 실제 사용 구조로 확인되지 않는다.**
- 현재 공개 repo 구조를 임의로 예전 설계로 되돌리지 말 것.
- v1.1.2 → v1.1.3 업데이트 확인 404가 실제 사용자 설치본에서 완전히 해결됐는지는 아직 별도 QA 필요.

### PAT / 토큰

**GitHub PAT를 Electron 앱, JS, ASAR 안에 하드코딩하지 말 것.**

Electron 배포물은 사용자가 코드를 추출할 수 있으므로 토큰 유출 위험이 있다.

현재 앱 동작에 필요한 비밀 환경변수/API 키/PAT은 확인되지 않았다.

### 코드 서명

- 현재 별도의 코드서명 인증서 요구/비밀값은 확인되지 않았다.
- 기존 문서와 코드에는 개인용 미서명 업데이트 호환을 위해 `autoUpdater.verifyUpdateCodeSignature = async () => null`을 사용하는 구조가 기록되어 있다.
- 이 우회는 보안상 장기 검토 대상이지만, 업데이트 흐름을 이해하지 않고 임의 제거하면 기존 미서명 업데이트가 깨질 수 있다.

## 10. 플러그인 / MCP / 외부 서비스 구분

### 프로젝트가 실제 사용하는 외부 서비스

- GitHub 저장소 / GitHub Releases
- npm registry

앱 데이터 자체는 로컬 JSON 저장이 기본이며, 별도 서버/DB/API가 필수라는 근거는 확인되지 않았다.

### 개발/운영에 사용된 도구 — 앱 런타임 의존성 아님

- ChatGPT GitHub connector/MCP: 저장소 조회·수정·Release 상태 확인에 사용.
- ChatGPT Work / Cloud Browser: 과거 GitHub 웹 UI로 Release 작업을 진행하는 운영 경로로 사용/권장된 이력.
- Remote Desktop Commander: 승인된 Windows PC의 파일/환경 확인에 사용할 수 있으며 이번 인수인계에서 로컬 경로 검색에 사용. 앱 자체는 이 도구에 의존하지 않는다.

## 11. 업데이트 관련 주의

- `npm start` 개발 실행에서는 자동 업데이트를 정상 release QA로 판단하지 않는다.
- 자동 업데이트는 Setup.exe로 설치한 패키지 앱에서 실제 검증해야 한다.
- 과거 `win-unpacked`에는 `resources/app-update.yml`이 없어 electron-updater ENOENT가 난 이력이 있다.
- 압축 실행본과 정식 NSIS 설치본의 updater/uninstaller 동작을 구분한다.
- 팝업에는 “최신 버전”인데 설정 화면 하단에는 빨간 “업데이트 상태를 확인하지 못했습니다”가 남는 상태 불일치 버그 이력이 있다. 같은 상태 소스를 사용하도록 유지/검증한다.

현재 코드 검색상:

- preload API에 `checkForUpdates`, `getUpdateStatus`, `onUpdateStatus`가 존재.
- main에 `checkForUpdates({ manual = false })`가 존재.
- settings UI에서 GitHub Releases 업데이트 확인 상태를 표시한다.

## 12. GitHub Actions — 실패 메일 주의

과거 임시 workflow로 Windows 자동 빌드/Release를 여러 번 시도했고, step 실행 전 실패하거나 `No jobs were run`이 발생해 사용자의 메일로 실패 알림이 반복 발송된 이력이 있다.

현재 최근 커밋에서 임시 release workflow를 제거한 상태다.

따라서:

- 실패하는 Actions workflow를 무한 재시도하지 않는다.
- runner probe 같은 실험용 workflow를 사용자 repo에 반복 push하지 않는다.
- Actions를 다시 도입하려면 먼저 원인을 작은 범위에서 확인하고, 사용자에게 불필요한 실패 알림이 가지 않도록 설계한다.
- 단순 Release 자산 업로드는 GitHub UI/연결 도구를 통한 직접 작업이 더 안전했던 이력이 있다.

## 13. 현재 repo 정리 관련 함정

현재 `main`에는 아래가 남아 있다.

- Git 추적된 `node_modules/`
- `dev-patches/`
- `release-bundles/`
- 과거 release trigger 파일들

주의:

- v1.1.3 소스 기준점이 복구되기 전에 대규모 cleanup을 먼저 하지 않는다.
- `build.bat`은 `node_modules` 폴더가 있으면 `npm install`을 건너뛴다. 현재 repo에 `node_modules/`가 추적되어 있으므로, 깨끗한 환경에서도 “폴더가 있으니 의존성이 맞다”고 착각할 수 있다.
- source/version 정합성을 먼저 맞춘 뒤, 별도 작업으로 `.gitignore`와 `node_modules/`, release 산출물, 로그/trigger 정리를 검토한다.

## 14. 실제 Windows QA 체크리스트

### A. 업데이트/배포

1. 기존 v1.1.2 설치본 준비.
2. 기존 메모/설정 하나 이상 저장.
3. 설정 → 업데이트 확인.
4. 404/인증 오류 없이 v1.1.3을 감지하는지 확인.
5. 다운로드/설치 완료.
6. 재실행 후 실제 표시 버전이 v1.1.3인지 확인.
7. 기존 메모/설정 유지 확인.
8. 팝업과 설정 화면의 업데이트 상태 문구가 서로 모순되지 않는지 확인.

### B. 좌/우 도킹

- 왼쪽 가장자리에 투명 틈/여백 없음.
- 오른쪽 도킹 회귀 없음.
- 접힘/펼침/항상 위/외부 클릭 시 접기 정상.

### C. 텍스트 서식

- 첫 글자 포함 선택 → Ctrl+B 정상.
- Ctrl+I 정상.
- Ctrl+U 정상.
- Ctrl+Shift+X 정상.
- B/I/U/S 버튼 정상.
- 글자 크기/색상/정렬/목록/체크리스트 정상.
- 툴바 클릭 뒤 selection 유지/복원 정상.

### D. 이미지

1. 이미지 선택 → Ctrl+C → 다른 위치 → Ctrl+V → 복제.
2. 이미지 선택 → Ctrl+X → 원본 삭제 → Ctrl+V → 붙여넣기.
3. 이미지 삽입 → Ctrl+Z → 삽입 취소.
4. 이미지 Ctrl+X → Ctrl+Z → 원본 복원.
5. 선택 이미지 Delete → Ctrl+Z → 복원.
6. resize → 저장 → 앱 재시작 → 크기 유지.
7. 이미지 선택 안 함 → 텍스트에서 Backspace/Delete → 이미지 오삭제 없음.
8. 여러 이미지 연속 삽입 → 이상한 빈 줄/빈 블록 없음.
9. 이미지 drag-move 기능이 다시 생기지 않았는지 확인.
10. Ctrl+C/X/V 성공 토스트가 뜨지 않는지 확인.

### E. 세로 탭

- vertical 모드에서 기존 메모 탭 목록이 모두 보임.
- `+`만 남는 회귀 없음.
- active memo 유지.
- 탭 많을 때 세로 scroll.
- 우클릭 이름 변경/삭제 메뉴 정상.
- 가로/세로 전환 후 active memo 유지.

### F. 삭제/재설치

정식 Setup 설치본 기준:

1. 메모 저장.
2. `사이드메모장 삭제` 실행.
3. 프로그램 파일 제거 확인.
4. 검은 CMD/PowerShell 창이 보이지 않는지 확인.
5. `%APPDATA%\side-memojang\side-memojang-data.json` 유지 확인.
6. 재설치.
7. 기존 메모/설정 복원 확인.

`win-unpacked` 테스트는 별도 시나리오로 취급한다.

## 15. 다음 작업 우선순위

### P0 — v1.1.3 소스 기준점 복구

1. 우선 과거 대화/파일 저장소에서 `SideMemojang_01-v1.1.3-source.zip`의 실제 파일을 다시 찾는다.
2. 찾으면 Release v1.1.3 설치본과 주요 `src/` 파일을 비교한다.
3. 못 찾으면 마지막 수단으로 v1.1.3 설치/배포물의 ASAR에서 실제 포함된 앱 코드를 추출해 현재 repo와 비교할 수 있다. 단, 이것은 “원본 개발 소스가 확실히 있다”는 가정을 대신하는 복구 절차일 뿐이다.
4. 어떤 소스가 실제 v1.1.3 기준인지 확인되기 전에는 대규모 리팩터링 금지.

### P0.5 — 소스/메타데이터 정합성

- `package.json` version.
- `package-lock.json` root / `packages[""]` version.
- 실제 `src/` 코드.
- v1.1.3 Release 자산.
- `latest.yml`.

서로 관계를 확인한다.

이미 게시된 v1.1.3 Release를 조용히 덮어쓰거나 태그를 force 이동하지 않는다.

### P1 — v1.1.2 → v1.1.3 실제 업데이트 QA

- 404 없음.
- 1.1.3 감지.
- 설치 성공.
- 실행 버전 1.1.3.
- 데이터 유지.

### P2 — 회귀 QA

- 좌측 도킹.
- 텍스트 selection/서식.
- Ctrl+Shift+X.
- 이미지 C/X/V/Z/resize/오삭제/빈줄.
- 세로 탭/우클릭/스크롤.
- uninstall/reinstall 데이터 유지.

### P3 — 다음 코드 수정

위 기준점과 QA가 정리된 뒤에만 새 수정은 `1.1.4`로 진행한다.

### P4 — repo hygiene

기능 안정화 후 별도 작업으로 검토:

- `node_modules/` Git 추적 제거.
- `.gitignore` 정리 (`node_modules/`, `release/`, `dist/`, `*.log` 등).
- 임시 release trigger/불완전 bundle 정리.
- 오래된 dev-patches 정리.

이 정리는 사용자 요청 없이 v1.1.3 복구 작업과 섞어서 대규모로 하지 말 것.

## 16. 완료라고 말할 수 있는 기준

다음을 직접 확인하기 전에는 “전부 완료”라고 보고하지 않는다.

- [ ] v1.1.3에 대응하는 정확한 소스 기준점 확보
- [ ] package/package-lock/source 관계 설명 가능
- [ ] v1.1.3 Release asset 존재 및 메타데이터 검증
- [ ] v1.1.2에서 업데이트 확인 성공
- [ ] v1.1.3 감지 성공
- [ ] 업데이트 설치 성공
- [ ] v1.1.3 실행 확인
- [ ] 기존 메모/설정 유지
- [ ] Ctrl+B 첫 글자 포함 선택 정상
- [ ] Ctrl+Shift+X 정상
- [ ] 왼쪽 도킹 여백 해결 상태 확인
- [ ] 이미지 Ctrl+C/X/V/Z 정상
- [ ] 이미지 오삭제 없음
- [ ] 연속 이미지 빈 줄 문제 없음
- [ ] 세로 탭 정상
- [ ] uninstall/reinstall 정상 + 데이터 유지
- [ ] 검은 콘솔 창 노출 없음
- [ ] 실패 GitHub Actions를 반복 실행하지 않음

## 17. 다음 AI에게

새로 기획하지 말고 이 상태에서 이어간다.

가장 먼저 할 일은 **“v1.1.3 Release는 존재하지만 현재 main/tag의 소스 버전이 맞지 않는 이유와 실제 v1.1.3 소스 기준점을 찾는 것”**이다. 그 다음 실제 Windows 업데이트/회귀 QA를 수행한다.

사용자가 `ㄱ`, `진행`, `마저해`, `그렇게해`라고 하면 위 우선순위의 미완료 항목을 이어서 진행한다. 추측으로 완료 처리하지 말고 실제 파일·코드·Release·실행 결과로 검증한다.

# SideMemojang v1.1.2 개발 패치 상태

기준 원본: `SideMemojang_01-v1.1.2-uninstall-image-clipboard-fixed-source.zip`

현재까지의 1.1.2 개발 수정:
- 좌측 도킹 시 화면 가장자리 여백/투명 픽셀 제거 보강
- 에디터 맨 앞/맨 끝까지 드래그한 선택 범위를 에디터 내부 범위로 보정
- Ctrl+B / Ctrl+I / Ctrl+U 선택 영역 서식 안정화
- 서식 툴바 버튼 mousedown 시 선택 범위 보존
- Ctrl+Shift+X 취소선 단축키를 `event.key` + 물리 `KeyX` 양쪽으로 판정
- Ctrl+Shift+X 실행 전 최신 선택 범위를 다시 저장하도록 수정
- 이미지 선택 상태의 Ctrl+X가 Ctrl+Shift+X까지 가로채던 충돌 제거
- 취소선 버튼과 Ctrl+Shift+X가 동일한 안정화된 취소선 처리 함수를 사용

현재 로컬 빌드 산출물:
- `SideMemojang-v1.1.2-setup-shortcut-fixed-win-unpacked.zip`
- SHA-256: `28aa282f9cff8ae46efff1bdf61d13b5162ffd10c36aaff5cf9dec2222be6231`

현재 로컬 소스 산출물:
- `SideMemojang_01-v1.1.2-setup-shortcut-fixed-source.zip`
- SHA-256: `268ae0259df8d1f0098729abbd2500a3eac6f761d15ffd9aa1a688d789cea6c0`

현재 테스트용 Setup:
- `side-memojang-setup-1.1.2.exe`
- SHA-256: `7f6e603c198b1661fd0979398f851c26be59ca81244dc8f1fa8b214095b26f07`
- Setup은 프로그램 파일을 `%LOCALAPPDATA%\Programs\SideMemojang`에 설치한다.
- `Uninstall 사이드메모장.exe`를 별도 설치하며 제거 시 프로그램 파일/바로가기/제거 등록만 삭제하고 `%APPDATA%\side-memojang` 메모 데이터는 보존한다.

자동 빌드/배포:
- `.github/workflows/release-windows.yml` 추가
- 수동 실행(`workflow_dispatch`) 시 Windows NSIS 빌드 Artifact 생성
- 확정 버전 태그(`v*`) 푸시 시 Setup.exe/latest.yml/blockmap을 GitHub Release에 자동 업로드하도록 구성

중요: `1.1.1`은 확정 버전이고 `1.1.2`는 아직 개발 중이다. 따라서 이 브랜치는 `dev/1.1.2` 전용이며 main 확정 반영이 아니다. 사용자가 `1.1.2 확정`이라고 말하기 전에는 main/tag/정식 Release를 만들지 않는다.

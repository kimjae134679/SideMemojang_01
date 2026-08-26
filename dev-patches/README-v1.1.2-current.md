# SideMemojang v1.1.2 개발 패치 상태

기준 원본: `SideMemojang_01-v1.1.2-uninstall-image-clipboard-fixed-source.zip`

이번 패치:
- 좌측 도킹 시 화면 가장자리 여백/투명 픽셀 제거 보강
- 에디터 맨 앞/맨 끝까지 드래그한 선택 범위를 에디터 내부 범위로 보정
- Ctrl+B / Ctrl+I / Ctrl+U / Ctrl+Shift+X 선택 영역 서식 안정화
- 서식 툴바 버튼 mousedown 시 선택 범위 보존

로컬 빌드 산출물:
- `SideMemojang-v1.1.2-leftdock-format-selection-fixed-win-unpacked.zip`
- SHA-256: `0bb61a5a54ca13777ae3586ae5dfe0b3dc5f0698354872486072d5962c84fc04`

로컬 소스 산출물:
- `SideMemojang_01-v1.1.2-leftdock-format-selection-fixed-source.zip`
- SHA-256: `c3834a1a772b7877d8d2a871b688f5d6f1641f502d708ddd75c66fae1fec0c01`

중요: `1.1.1`은 확정 버전이고 `1.1.2`는 아직 개발 중이다. 따라서 이 브랜치는 `dev/1.1.2` 전용이며 main 확정 반영이 아니다.

현재 연결된 GitHub 도구는 저장소 소스/브랜치 푸시는 가능하지만 100MB가 넘는 Windows `win-unpacked.zip`을 GitHub Release asset으로 직접 업로드하는 전용 write 기능은 제공하지 않는다. 정식 자동 배포는 GitHub Actions에서 Windows 빌드 후 Release/Artifact 업로드 방식으로 구성하는 것이 적합하다.

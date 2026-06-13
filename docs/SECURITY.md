# 보안 노트

## v1.0.4 보안 적용 사항

- `BrowserWindow` `sandbox: true` 활성화
- IPC 호출자가 앱 내부 로컬 렌더러인지 URL 검증 (`isTrustedIpcEvent`)
- 외부 창/탭 열기 차단 후 `http` / `https` / `mailto` 만 외부 브라우저로 열기
- `file://` 로컬 렌더러 이외의 페이지 이동 차단 (`will-navigate` 처리)
- 데이터 가져오기 파일 크기 제한 (10 MB)
- 메모 HTML sanitize 강화 (이벤트 핸들러 속성, 위험 태그, href 프로토콜 검증)

## 미서명 자동업데이트

```js
// src/main/main.js - setupAutoUpdater()
autoUpdater.verifyUpdateCodeSignature = async () => null;
```

개인/미서명 빌드에서 업데이트 설치 시 서명 검증 오류를 방지하기 위한 설정입니다.  
GitHub 계정 2FA, Release 파일 직접 업로드(exe + latest.yml 세트)를 유지할 것을 권장합니다.

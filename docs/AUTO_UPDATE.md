# 자동 업데이트 가이드

## 동작 방식

- 앱 실행 3초 후 GitHub Releases에서 최신 버전을 자동 확인합니다.
- 상위 버전이 있으면 업데이트 여부를 묻는 창이 표시됩니다.
- 버전 비교는 앞 3자리(major.minor.patch)만 사용합니다.
  - 현재 `1.0.0` / 새 버전 `1.0.0.01` → 알림 없음
  - 현재 `1.0.0` / 새 버전 `1.0.1` → 알림 표시

## 설정 방법

`package.json`의 `build.publish` 항목을 실제 GitHub 정보로 수정합니다.

```json
"publish": [
  {
    "provider": "github",
    "owner": "YOUR_GITHUB_ID",
    "repo": "side-memojang"
  }
]
```

## 배포 순서

1. `package.json`의 `owner` / `repo` 수정
2. `npm install`
3. `npm run dist`
4. `release/` 폴더의 `Setup.exe`, `latest.yml`, `.blockmap` 파일을 GitHub Releases에 업로드

## 주의사항

- `npm start` 개발 실행 중에는 자동 업데이트가 작동하지 않습니다.
- Setup.exe로 설치한 패키지 앱에서만 작동합니다.
- 미서명 빌드는 `autoUpdater.verifyUpdateCodeSignature = async () => null` 설정이 필요합니다 (현재 적용됨).

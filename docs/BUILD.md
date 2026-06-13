# 빌드 가이드

## 순서

1. ZIP을 완전히 압축 해제한 후, 영문 경로로 폴더를 이동합니다. (예: `C:\side-memojang`)
2. [Node.js LTS](https://nodejs.org) 설치
3. `build.bat` 더블클릭
4. 완료 후 `release/` 폴더 확인

## 빌드 명령어

```bash
npm install
npm run dist          # NSIS 설치 인스톨러
npm run dist:portable # 포터블 exe
npm run pack          # 압축 없이 디렉터리 출력
```

## 문제 발생 시

- 창을 바로 닫지 말고 오류 메시지를 확인하세요.
- 회사 네트워크에서는 npm 다운로드가 차단될 수 있습니다.
- build.bat은 ZIP 안에서 직접 실행하면 안 됩니다.

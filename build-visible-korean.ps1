# SideMemojang Visible Build Helper
# 한글 출력은 PowerShell에서만 처리합니다.
# 일반 빌드는 build.bat, 자세한 진행 빌드는 build-visible.bat를 사용하세요.

$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $Root
$SummaryLog = Join-Path $Root "build-log.txt"
$RawLog = Join-Path $Root "build-raw-log.txt"

function Write-Line([string]$text = "") {
  Write-Host $text
  Add-Content -Path $SummaryLog -Value $text -Encoding UTF8
}

function Step([string]$code, [string]$title) {
  Write-Line ""
  Write-Line "[$code] $title"
  Write-Line "------------------------------------------------------------"
}

function Run-LoggedCommand([string]$code, [string]$title, [string]$commandText, [string]$successText) {
  Step $code $title
  Write-Line "실행 명령: $commandText"
  Write-Line "자세한 실제 출력은 build-raw-log.txt에 저장합니다."
  Write-Line "창을 닫지 말고 기다려주세요."
  Add-Content -Path $RawLog -Value "" -Encoding UTF8
  Add-Content -Path $RawLog -Value "============================================================" -Encoding UTF8
  Add-Content -Path $RawLog -Value "[$code] $title" -Encoding UTF8
  Add-Content -Path $RawLog -Value "Command: $commandText" -Encoding UTF8
  Add-Content -Path $RawLog -Value "Started: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -Encoding UTF8
  Add-Content -Path $RawLog -Value "============================================================" -Encoding UTF8

  cmd.exe /d /c "set CI=1&& set ELECTRON_BUILDER_DISABLE_PUBLISH=true&& set CSC_IDENTITY_AUTO_DISCOVERY=false&& $commandText 1>> `"$RawLog`" 2>>&1 <NUL"
  $exitCode = $LASTEXITCODE

  Add-Content -Path $RawLog -Value "" -Encoding UTF8
  Add-Content -Path $RawLog -Value "ExitCode: $exitCode" -Encoding UTF8
  Add-Content -Path $RawLog -Value "Finished: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -Encoding UTF8

  if ($exitCode -ne 0) {
    Write-Line "명령 실패. 종료 코드: $exitCode"
    Write-Line "마지막 로그 일부:"
    if (Test-Path $RawLog) {
      Get-Content $RawLog -Tail 25 -Encoding UTF8 | ForEach-Object { Write-Line ("  " + $_) }
    }
    throw "명령 실패: $commandText"
  }

  Write-Line $successText
}

function Read-TextFileUtf8([string]$path) {
  return [System.IO.File]::ReadAllText($path, [System.Text.Encoding]::UTF8)
}

Clear-Host
"[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] 빌드 시작" | Set-Content -Path $SummaryLog -Encoding UTF8
"[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] RAW 빌드 로그 시작" | Set-Content -Path $RawLog -Encoding UTF8

Write-Line "============================================================"
Write-Line "  사이드메모장 빌드 도우미 - 자세한 진행 표시"
Write-Line "============================================================"
Write-Line "프로젝트 폴더: $Root"
Write-Line "요약 로그: $SummaryLog"
Write-Line "실제 명령 로그: $RawLog"
Write-Line ""

try {
  Step "1.1" "작업 폴더 확인"
  Write-Line "현재 위치를 프로젝트 폴더로 맞췄습니다."
  Write-Line "위치: $Root"

  Step "1.2" "필수 파일 확인"
  foreach ($name in @("package.json", "src", "assets")) {
    $target = Join-Path $Root $name
    if (!(Test-Path $target)) { throw "필수 항목이 없습니다: $name" }
    Write-Line "확인됨: $name"
  }

  Step "2.1" "Node.js 확인"
  $nodeCmd = Get-Command node -ErrorAction SilentlyContinue
  if (!$nodeCmd) { throw "Node.js를 찾을 수 없습니다. Node.js 설치 후 다시 실행하세요." }
  $nodeVersion = (& node -v).Trim()
  Write-Line "Node 경로: $($nodeCmd.Source)"
  Write-Line "Node 버전: $nodeVersion"

  Step "2.2" "npm 확인"
  $npmCmd = Get-Command npm.cmd -ErrorAction SilentlyContinue
  if (!$npmCmd) { $npmCmd = Get-Command npm -ErrorAction SilentlyContinue }
  if (!$npmCmd) { throw "npm을 찾을 수 없습니다. Node.js 설치 상태를 확인하세요." }
  $npmVersion = (& npm.cmd -v).Trim()
  Write-Line "npm 경로: $($npmCmd.Source)"
  Write-Line "npm 버전: $npmVersion"

  Step "3.1" "package.json 읽기"
  $pkgPath = Join-Path $Root "package.json"
  $pkgText = Read-TextFileUtf8 $pkgPath
  $pkg = $pkgText | ConvertFrom-Json
  Write-Line "앱 이름: $($pkg.productName)"
  Write-Line "버전: $($pkg.version)"

  Step "3.2" "빌드 설정 확인"
  if (!$pkg.build) { throw "package.json에 build 설정이 없습니다." }
  Write-Line "appId: $($pkg.build.appId)"
  Write-Line "출력 폴더: $($pkg.build.directories.output)"
  Write-Line "설치파일 이름 규칙: side-memojang-setup-$($pkg.version).exe"

  Step "4.1" "릴리즈 폴더 준비"
  $releaseDir = Join-Path $Root "release"
  if (!(Test-Path $releaseDir)) {
    New-Item -ItemType Directory -Path $releaseDir | Out-Null
    Write-Line "release 폴더를 새로 만들었습니다."
  } else {
    Write-Line "release 폴더가 이미 있습니다."
  }

  Step "4.2" "이전 빌드 파일 확인"
  $oldFiles = Get-ChildItem $releaseDir -ErrorAction SilentlyContinue
  if ($oldFiles.Count -eq 0) {
    Write-Line "기존 빌드 파일 없음."
  } else {
    Write-Line "기존 빌드 파일 수: $($oldFiles.Count)"
    $oldFiles | ForEach-Object { Write-Line (" - " + $_.Name) }
  }

  Step "5.1" "의존성 기본 상태 확인"
  $nodeModules = Join-Path $Root "node_modules"
  $lockFile = Join-Path $Root "package-lock.json"
  if (Test-Path $lockFile) { Write-Line "package-lock.json 확인됨." } else { Write-Line "package-lock.json 없음. npm install에서 생성될 수 있습니다." }
  if (Test-Path $nodeModules) { Write-Line "node_modules 폴더 확인됨." } else { Write-Line "node_modules 폴더 없음. npm install이 필요합니다." }

  Step "6.1" "npm install 필요 여부 판단"
  $needInstall = $false
  if (!(Test-Path $nodeModules)) { $needInstall = $true }
  $builderCli = Join-Path $Root "node_modules\electron-builder\out\cli\cli.js"
  if (!(Test-Path $builderCli)) { $needInstall = $true }
  if ($needInstall) { Write-Line "판단: npm install 실행 필요." } else { Write-Line "판단: npm install 생략 가능." }

  if ($needInstall) {
    Step "7.1" "npm install 준비 - 인터넷/패키지"
    Write-Line "처음 실행이거나 node_modules가 없어서 패키지를 설치합니다."
    Write-Line "npm 경고가 나와도 종료 코드가 0이면 실패가 아닙니다."

    Step "7.2" "npm install 준비 - 로그 분리"
    Write-Line "화면에는 요약만 표시합니다."
    Write-Line "npm의 긴 실제 출력은 build-raw-log.txt에 저장합니다."

    Step "7.3" "npm install 준비 - 실행 전 확인"
    Write-Line "실행할 명령: npm.cmd install"
    Write-Line "오래 걸릴 수 있습니다."

    Run-LoggedCommand "7.4" "npm install 실행" "npm.cmd install" "npm install 완료. 경고가 있어도 설치 자체는 성공했습니다."

    Step "7.5" "npm install 결과 확인"
    if (!(Test-Path $nodeModules)) { throw "npm install 후에도 node_modules가 없습니다." }
    if (!(Test-Path $builderCli)) { throw "electron-builder CLI가 설치되지 않았습니다." }
    Write-Line "node_modules 확인 완료."
    Write-Line "electron-builder CLI 확인 완료."
  } else {
    Step "7.1" "npm install 생략"
    Write-Line "이미 필요한 폴더와 빌드 도구가 있어서 npm install을 생략합니다."
  }

  Step "8.1" "electron-builder CLI 위치 확인"
  $builderCli = Join-Path $Root "node_modules\electron-builder\out\cli\cli.js"
  if (!(Test-Path $builderCli)) { throw "electron-builder 실행 파일을 찾을 수 없습니다: $builderCli" }
  Write-Line "CLI 확인됨: $builderCli"

  Step "8.2" "빌드 대상 확인"
  Write-Line "대상 OS: Windows"
  Write-Line "설치 방식: NSIS Setup.exe"
  Write-Line "자동업데이트 파일: latest.yml"

  Step "9.1" "빌드 전 파일명 예상"
  $expectedExe = Join-Path $releaseDir "side-memojang-setup-$($pkg.version).exe"
  $latestYml = Join-Path $releaseDir "latest.yml"
  Write-Line "예상 exe: $expectedExe"
  Write-Line "예상 yml: $latestYml"

  Step "9.2" "빌드 명령 구성"
  $buildCommand = "node `"$builderCli`" --win nsis --publish never"
  Write-Line "실행할 명령: $buildCommand"
  Write-Line "자동 업로드/대기 입력 방지를 위해 --publish never 옵션을 사용합니다."

  Step "10.1" "electron-builder 준비 - asar/압축/NSIS"
  Write-Line "앱 파일을 묶고 설치파일 생성을 준비합니다."

  Step "10.2" "electron-builder 준비 - GitHub 업데이트 메타데이터"
  Write-Line "latest.yml 생성을 위한 publish 설정을 확인합니다."
  Write-Line "repo: kimjae134679 / SideMemojang_01"

  Step "10.3" "electron-builder 실행 시작"
  Write-Line "이제 실제 설치파일 빌드를 시작합니다."
  Write-Line "진행 상세 출력은 build-raw-log.txt에 저장합니다."

  Run-LoggedCommand "10.4" "electron-builder 실제 실행" $buildCommand "electron-builder 실행 완료."

  Step "10.5" "electron-builder 종료 후 정리"
  Write-Line "빌드 명령이 정상 종료되었습니다. 결과 파일을 확인합니다."

  Step "11.1" "생성 파일 확인"
  if (Test-Path $expectedExe) { Write-Line "확인됨: side-memojang-setup-$($pkg.version).exe" } else { Write-Line "주의: 예상 exe 이름을 찾지 못했습니다. release 폴더를 직접 확인하세요." }
  if (Test-Path $latestYml) { Write-Line "확인됨: latest.yml" } else { Write-Line "주의: latest.yml을 찾지 못했습니다." }

  Step "11.2" "release 폴더 목록"
  Get-ChildItem $releaseDir | ForEach-Object { Write-Line (" - " + $_.Name + " / " + $_.Length + " bytes") }

  Step "12.1" "GitHub 업로드 안내"
  Write-Line "GitHub Release v$($pkg.version)에 올릴 파일:"
  Write-Line "1) side-memojang-setup-$($pkg.version).exe"
  Write-Line "2) latest.yml"

  Step "12.2" "빌드 완료"
  Write-Line "완료되었습니다. release 폴더를 엽니다."
  Start-Process explorer.exe $releaseDir
}
catch {
  Write-Line ""
  Write-Line "빌드 실패"
  Write-Line $_.Exception.Message
  Write-Line ""
  Write-Line "요약 로그: build-log.txt"
  Write-Line "실제 명령 전체 로그: build-raw-log.txt"
  Write-Line "build-raw-log.txt에는 npm/electron-builder의 원본 출력이 저장됩니다."
  exit 1
}

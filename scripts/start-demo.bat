@echo off
echo ==========================================
echo   스테이지박스 데모 서버 시작
echo ==========================================
echo.

REM 백엔드 ngrok 터널 시작 (백그라운드)
echo [1/3] 백엔드 ngrok 터널 시작 중...
start "ngrok-backend" cmd /c "ngrok http 3001"

REM 잠시 대기 (ngrok 시작 시간)
timeout /t 5 /nobreak > nul

REM ngrok API에서 백엔드 URL 가져오기
echo [2/3] ngrok URL 확인 중...
for /f "tokens=*" %%i in ('curl -s http://localhost:4040/api/tunnels ^| findstr /r "https://[^\"]*\.ngrok.*\.app"') do set NGROK_OUTPUT=%%i

echo.
echo ==========================================
echo   설정 완료!
echo ==========================================
echo.
echo 1. http://localhost:4040 에서 ngrok 대시보드 확인
echo 2. 백엔드 ngrok URL을 복사하세요
echo 3. 프론트엔드도 공개하려면 새 터미널에서:
echo    ngrok http 3000
echo.
echo ==========================================
pause

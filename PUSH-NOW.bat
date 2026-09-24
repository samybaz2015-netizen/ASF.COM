@echo off
chcp 65001 >nul
cd /d "%USERPROFILE%\Downloads\ASF-GitHub-Upload"
echo Pushing to GitHub...
git push --force origin main
if errorlevel 1 (
    echo.
    echo FAILED - Make sure Git is installed and you're logged in to GitHub.
    echo Try running: git credential-manager github login
) else (
    echo.
    echo Done! Code pushed successfully.
)
pause

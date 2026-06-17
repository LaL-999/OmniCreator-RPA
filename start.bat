@echo off
title OmniCreator 控制台 · 一键启动器

rem 让后端及其调度派生的脚本统一使用 UTF-8 输出，避免中文/emoji 报错（子进程会继承）
set "PYTHONUTF8=1"
set "PYTHONIOENCODING=utf-8"

echo.
echo  ============================================================
echo    OmniCreator 控制台  -  一键启动器
echo  ============================================================
echo.

rem 切换到脚本所在目录下的 omni-dashboard
cd /d "%~dp0omni-dashboard"
if errorlevel 1 (
  echo [错误] 找不到 omni-dashboard 目录，请确认 start.bat 位于项目根目录。
  goto end
)

rem ---------- 1. 定位 Python ----------
set "PY="
where py >nul 2>nul && set "PY=py"
if not defined PY (
  where python >nul 2>nul && set "PY=python"
)
if not defined PY (
  echo [错误] 未检测到 Python，请先安装 Python 3.10+ 并勾选 "Add to PATH"。
  echo        下载地址： https://www.python.org/downloads/
  goto end
)
echo [1/4] Python 启动器: %PY%

rem ---------- 2. 后端虚拟环境 ----------
if not exist "venv\Scripts\python.exe" (
  echo [2/4] 首次运行，正在创建 Python 虚拟环境 venv ...
  %PY% -m venv venv
  if errorlevel 1 (
    echo [错误] 创建虚拟环境失败，请检查 Python 安装是否完整。
    goto end
  )
)
echo [2/4] 正在安装 / 校验后端依赖（首次较慢，请耐心等待）...
"venv\Scripts\python.exe" -m pip install --disable-pip-version-check -q --upgrade pip
"venv\Scripts\python.exe" -m pip install --disable-pip-version-check -q -r requirements.txt
if errorlevel 1 (
  echo [警告] 后端依赖安装可能未完成，请检查网络后重试。
)

rem ---------- 3. 前端依赖 ----------
where npm >nul 2>nul
if errorlevel 1 (
  echo [错误] 未检测到 Node.js / npm，请先安装 Node.js 16+ 。
  echo        下载地址： https://nodejs.org/
  goto end
)
if not exist "node_modules" (
  echo [3/4] 首次运行，正在安装前端依赖 npm install（首次较慢）...
  call npm install
  if errorlevel 1 (
    echo [错误] 前端依赖安装失败，请检查网络后重试。
    goto end
  )
) else (
  echo [3/4] 前端依赖已就绪。
)

rem ---------- 4. 启动前后端 ----------
echo [4/4] 正在启动后端 :8000 与前端 :5173 ...
start "OmniCreator 后端 :8000" cmd /k venv\Scripts\python.exe -m uvicorn main:app --reload --port 8000
start "OmniCreator 前端 :5173" cmd /k npm run dev

echo.
echo  服务已在两个新窗口中启动，数秒后将自动打开浏览器：
echo    http://localhost:5173
echo  关闭那两个新弹出的窗口即可停止服务。
echo  ============================================================

timeout /t 6 /nobreak >nul
start "" http://localhost:5173

:end
echo.
echo  按任意键关闭本窗口（不影响已启动的服务）...
pause >nul

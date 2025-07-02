@echo off
echo ========================================
echo    网站实时编辑器服务器启动脚本
echo ========================================
echo.

cd /d "%~dp0"

echo 检查Node.js环境...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ 错误: 未找到Node.js
    echo 请先安装Node.js: https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js环境正常

echo.
echo 检查依赖包...
if not exist "node_modules" (
    echo 📦 首次运行，正在安装依赖包...
    npm install
    if errorlevel 1 (
        echo ❌ 依赖包安装失败
        pause
        exit /b 1
    )
    echo ✅ 依赖包安装完成
) else (
    echo ✅ 依赖包已存在
)

echo.
echo 🚀 启动编辑服务器...
echo 服务器地址: http://localhost:3001
echo 按 Ctrl+C 停止服务器
echo.

node server.js

pause

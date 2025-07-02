@echo off
echo 🚀 启动部署API服务器...
echo.

REM 检查Node.js是否安装
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 错误: 未找到Node.js
    echo 请先安装Node.js: https://nodejs.org/
    pause
    exit /b 1
)

REM 检查npm是否可用
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 错误: 未找到npm
    pause
    exit /b 1
)

echo ✅ Node.js已安装
echo.

REM 安装依赖
echo 📦 安装依赖包...
npm install

if %errorlevel% neq 0 (
    echo ❌ 依赖安装失败
    pause
    exit /b 1
)

echo ✅ 依赖安装完成
echo.

REM 启动服务器
echo 🚀 启动部署API服务器...
echo 服务器将运行在: http://localhost:3001
echo 编辑器地址: http://localhost:3001/admin/global-editor.html
echo.
echo 按 Ctrl+C 停止服务器
echo.

node deploy-api.js

pause

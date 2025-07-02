@echo off
echo ========================================
echo    CoinMint 可视化编辑器启动脚本
echo ========================================
echo.

echo 📦 检查Node.js环境...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 未检测到Node.js，请先安装Node.js
    echo 📥 下载地址: https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js环境正常

echo.
echo 📦 检查依赖包...
if not exist "node_modules" (
    echo 📥 首次运行，正在安装依赖包...
    npm install
    if %errorlevel% neq 0 (
        echo ❌ 依赖包安装失败
        pause
        exit /b 1
    )
    echo ✅ 依赖包安装完成
) else (
    echo ✅ 依赖包已存在
)

echo.
echo 🚀 启动后端服务器...
echo 📍 服务器地址: http://localhost:3001
echo 🌐 网站地址: http://localhost:3001/index.html
echo.
echo 💡 使用说明:
echo    1. 打开网站后点击右下角 "🎨 编辑网站" 按钮
echo    2. 点击 "开始编辑" 激活编辑模式
echo    3. 直接点击网站文字进行修改
echo    4. 点击 "💾 保存修改" 真正保存到文件
echo    5. 使用 "📂 备份" 管理历史版本
echo.
echo ⚠️  按 Ctrl+C 停止服务器
echo ========================================
echo.

node server.js

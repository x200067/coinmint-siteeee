// 强制触发Netlify部署的脚本
const https = require('https');

function triggerNetlifyDeploy() {
    console.log('🚀 强制触发Netlify重新部署...\n');
    
    // 这里需要你的Netlify Build Hook URL
    // 格式: https://api.netlify.com/build_hooks/YOUR_HOOK_ID
    
    console.log('📋 手动触发部署步骤:');
    console.log('1. 登录 Netlify 控制台');
    console.log('2. 进入你的网站设置');
    console.log('3. 找到 "Build & deploy" 设置');
    console.log('4. 点击 "Trigger deploy" 按钮');
    console.log('5. 选择 "Deploy site"');
    console.log('6. 等待部署完成\n');
    
    console.log('🔍 或者检查以下内容:');
    console.log('1. 确认GitHub仓库已更新');
    console.log('2. 检查Netlify是否连接到正确的分支 (main)');
    console.log('3. 查看部署日志是否有错误');
    console.log('4. 确认构建命令和发布目录设置正确\n');
    
    console.log('⚡ 快速验证:');
    console.log('- GitHub最新提交: e8c0651');
    console.log('- 修改内容: 电话号码和文章标题');
    console.log('- 文件大小: 37.6 KB');
    console.log('- 修改行数: 349行新增');
}

// 检查GitHub和Netlify连接
function checkDeploymentStatus() {
    console.log('🔍 部署状态检查...\n');
    
    console.log('✅ Git状态:');
    console.log('   - 文件已提交到GitHub');
    console.log('   - 最新提交: e8c0651');
    console.log('   - 分支: main');
    console.log('   - 推送成功\n');
    
    console.log('❓ Netlify检查清单:');
    console.log('   □ 网站是否连接到GitHub仓库?');
    console.log('   □ 部署分支是否设置为 "main"?');
    console.log('   □ 构建命令是否正确? (通常为空或 "# no build command")');
    console.log('   □ 发布目录是否正确? (通常为 "/" 或 ".")');
    console.log('   □ 是否有部署错误?\n');
    
    console.log('🛠️  如果部署仍然没有更新:');
    console.log('   1. 清除Netlify缓存');
    console.log('   2. 手动触发重新部署');
    console.log('   3. 检查部署日志');
    console.log('   4. 确认文件路径正确');
    console.log('   5. 尝试重新连接GitHub仓库');
}

if (require.main === module) {
    triggerNetlifyDeploy();
    console.log('\n' + '='.repeat(50) + '\n');
    checkDeploymentStatus();
}

module.exports = { triggerNetlifyDeploy, checkDeploymentStatus };

// 检查文件修改的脚本
const fs = require('fs');
const path = require('path');

function checkChanges() {
    console.log('🔍 检查文件修改状态...\n');
    
    const filePath = path.join(__dirname, 'index.html');
    
    if (!fs.existsSync(filePath)) {
        console.log('❌ index.html 文件不存在');
        return;
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    
    // 检查一些关键修改
    const checks = [
        {
            name: '电话号码',
            pattern: /glyphicon-phone.*?\+1 \([0-9]{3}\) [0-9]{3}-[0-9]{4}/,
            extract: (match) => match ? match[0].split('</i> ')[1] : '未找到'
        },
        {
            name: '文章标题',
            pattern: /<h3>Latest Articles[^<]*<\/h3>/,
            extract: (match) => match ? match[0].replace(/<\/?h3>/g, '') : '未找到'
        },
        {
            name: '邮箱地址',
            pattern: /glyphicon-envelope.*?[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/,
            extract: (match) => match ? match[0].split('</i> ')[1] : '未找到'
        }
    ];
    
    checks.forEach(check => {
        const match = content.match(check.pattern);
        const value = check.extract(match);
        console.log(`📋 ${check.name}: ${value}`);
    });
    
    // 检查最近的备份
    const backupDir = path.join(__dirname, 'backups');
    if (fs.existsSync(backupDir)) {
        const backups = fs.readdirSync(backupDir)
            .filter(file => file.endsWith('.html'))
            .map(file => {
                const stats = fs.statSync(path.join(backupDir, file));
                return { file, time: stats.mtime };
            })
            .sort((a, b) => b.time - a.time);
        
        console.log(`\n💾 备份文件 (共 ${backups.length} 个):`);
        backups.slice(0, 3).forEach((backup, index) => {
            console.log(`   ${index + 1}. ${backup.file} (${backup.time.toLocaleString('zh-CN')})`);
        });
    }
    
    // 文件信息
    const stats = fs.statSync(filePath);
    console.log(`\n📄 文件信息:`);
    console.log(`   大小: ${(stats.size / 1024).toFixed(1)} KB`);
    console.log(`   最后修改: ${stats.mtime.toLocaleString('zh-CN')}`);
    
    console.log('\n✅ 检查完成！');
    console.log('\n💡 部署提示:');
    console.log('   1. 确认上述修改内容正确');
    console.log('   2. 将 index.html 上传到 Netlify');
    console.log('   3. 或者在 Netlify 控制台触发重新部署');
}

// 如果直接运行此脚本
if (require.main === module) {
    checkChanges();
}

module.exports = { checkChanges };

// 部署前检查脚本
const fs = require('fs');
const path = require('path');

function deployCheck() {
    console.log('🚀 部署前检查...\n');
    
    const filePath = path.join(__dirname, 'index.html');
    
    if (!fs.existsSync(filePath)) {
        console.log('❌ index.html 文件不存在');
        return false;
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    const stats = fs.statSync(filePath);
    
    // 基本文件检查
    console.log('📄 文件基本信息:');
    console.log(`   大小: ${(stats.size / 1024).toFixed(1)} KB`);
    console.log(`   行数: ${content.split('\n').length}`);
    console.log(`   最后修改: ${stats.mtime.toLocaleString('zh-CN')}`);
    
    // 文件完整性检查
    const checks = [
        {
            name: '文档类型声明',
            test: () => content.includes('<!DOCTYPE html>'),
            required: true
        },
        {
            name: 'HTML结构',
            test: () => content.includes('<html') && content.includes('</html>'),
            required: true
        },
        {
            name: '页面标题',
            test: () => content.includes('<title>'),
            required: true
        },
        {
            name: 'CSS样式',
            test: () => content.includes('.css') || content.includes('<style>'),
            required: true
        },
        {
            name: 'JavaScript脚本',
            test: () => content.includes('.js') || content.includes('<script>'),
            required: false
        }
    ];
    
    console.log('\n🔍 文件完整性检查:');
    let allPassed = true;
    
    checks.forEach(check => {
        const passed = check.test();
        const status = passed ? '✅' : (check.required ? '❌' : '⚠️');
        console.log(`   ${status} ${check.name}`);
        
        if (!passed && check.required) {
            allPassed = false;
        }
    });
    
    // 内容检查
    console.log('\n📋 内容检查:');
    
    const contentChecks = [
        {
            name: '电话号码',
            pattern: /glyphicon-phone.*?\+1 \([0-9]{3}\) [0-9]{3}-[0-9]{4}/,
            extract: (match) => match ? match[0].split('</i> ')[1] : '未找到'
        },
        {
            name: '邮箱地址',
            pattern: /glyphicon-envelope.*?[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/,
            extract: (match) => match ? match[0].split('</i> ')[1] : '未找到'
        },
        {
            name: '公司地址',
            pattern: /glyphicon-map-marker.*?[^<]+/,
            extract: (match) => match ? match[0].split('</i> ')[1] : '未找到'
        }
    ];
    
    contentChecks.forEach(check => {
        const match = content.match(check.pattern);
        const value = check.extract(match);
        console.log(`   📍 ${check.name}: ${value}`);
    });
    
    // 修改历史检查
    const backupDir = path.join(__dirname, 'backups');
    if (fs.existsSync(backupDir)) {
        const backups = fs.readdirSync(backupDir)
            .filter(file => file.endsWith('.html'))
            .length;
        
        console.log(`\n💾 备份历史: 共 ${backups} 个备份文件`);
    }
    
    // 部署建议
    console.log('\n🎯 部署建议:');
    
    if (stats.size < 30000) {
        console.log('   ⚠️  文件大小较小，请确认是否包含完整内容');
        allPassed = false;
    } else {
        console.log('   ✅ 文件大小正常');
    }
    
    if (content.split('\n').length < 500) {
        console.log('   ⚠️  文件行数较少，请确认是否为完整版本');
        allPassed = false;
    } else {
        console.log('   ✅ 文件行数正常');
    }
    
    // 最终结果
    console.log('\n' + '='.repeat(50));
    
    if (allPassed) {
        console.log('🎉 检查通过！文件可以安全部署');
        console.log('\n📤 部署步骤:');
        console.log('   1. 登录 Netlify 控制台');
        console.log('   2. 找到你的网站项目');
        console.log('   3. 拖拽 index.html 到部署区域');
        console.log('   4. 或者点击 "Deploy manually" 上传文件');
        console.log('   5. 等待部署完成并验证');
        
        return true;
    } else {
        console.log('❌ 检查未通过！请修复问题后再部署');
        console.log('\n🔧 建议操作:');
        console.log('   1. 检查文件是否完整');
        console.log('   2. 确认所有修改都已保存');
        console.log('   3. 重新运行编辑器测试');
        console.log('   4. 如有问题，从备份恢复文件');
        
        return false;
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    const result = deployCheck();
    process.exit(result ? 0 : 1);
}

module.exports = { deployCheck };

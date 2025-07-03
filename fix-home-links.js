const fs = require('fs');
const path = require('path');

// 获取所有HTML文件
const files = fs.readdirSync('.').filter(file => file.endsWith('.html'));

console.log('🔧 修复所有页面的Home链接...\n');

let totalFixed = 0;

files.forEach(file => {
    try {
        let content = fs.readFileSync(file, 'utf8');
        let originalContent = content;
        
        // 替换所有指向 index-2.html 的链接为 index.html
        content = content.replace(/href=['"]index-2\.html['"]/g, 'href=\'index.html\'');
        
        // 计算修改次数
        const matches = originalContent.match(/href=['"]index-2\.html['"]/g);
        const fixCount = matches ? matches.length : 0;
        
        if (fixCount > 0) {
            fs.writeFileSync(file, content);
            console.log(`✅ ${file}: 修复了 ${fixCount} 个链接`);
            totalFixed += fixCount;
        }
    } catch (error) {
        console.log(`❌ 处理 ${file} 时出错:`, error.message);
    }
});

console.log(`\n🎯 总计修复了 ${totalFixed} 个Home链接`);
console.log('✨ 现在所有页面的Home按钮都指向 index.html');

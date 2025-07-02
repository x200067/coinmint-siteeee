const fs = require('fs');
const path = require('path');

function removeHostedMiningButtons() {
    console.log('🔍 正在删除所有 Hosted Mining 顶级导航按钮...\n');
    
    // 获取所有 HTML 文件
    const files = fs.readdirSync(__dirname)
        .filter(file => file.endsWith('.html') && file.startsWith('index'));
    
    let totalModified = 0;
    
    files.forEach(file => {
        const filePath = path.join(__dirname, file);
        let content = fs.readFileSync(filePath, 'utf8');
        const originalContent = content;
        
        // 删除直接的 Hosted Mining 顶级导航链接
        // 匹配: <li><a href='https://www.nicehash.com/mining' >Hosted Mining</a></li>
        // 或: <li><a href='https://www.nicehash.com/mining'>Hosted Mining</a></li>
        content = content.replace(
            /<li><a\s+href=['"]https:\/\/www\.nicehash\.com\/mining['"][^>]*>Hosted Mining<\/a><\/li>/g,
            ''
        );
        
        // 删除可能的换行和空白
        content = content.replace(/\n\s*\n\s*\n/g, '\n\n');
        
        if (content !== originalContent) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`✅ 已修改: ${file}`);
            totalModified++;
        }
    });
    
    console.log(`\n🎉 完成！共修改了 ${totalModified} 个文件`);
    console.log('✅ 所有 Hosted Mining 顶级导航按钮已删除');
}

removeHostedMiningButtons();

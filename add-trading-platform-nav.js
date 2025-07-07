const fs = require('fs');
const path = require('path');

// 获取所有HTML文件
const htmlFiles = fs.readdirSync('.').filter(file => 
    file.endsWith('.html') && 
    file !== 'index.html' && 
    file !== 'trading-platform.html' && 
    file !== 'admin-access.html' &&
    file !== 'pc.html' &&
    file !== 'test-deploy.html' &&
    file !== 'verify-button.html'
);

console.log('Found HTML files to update:', htmlFiles);

htmlFiles.forEach(file => {
    try {
        let content = fs.readFileSync(file, 'utf8');
        let updated = false;

        // 检查侧边导航是否需要添加Trading Platform链接
        const sideNavPattern = /(<li><a href='trading-platform\.html'>About the Trading Platform<\/a><\/li>)/;
        if (content.match(sideNavPattern) && !content.includes("href='https://pc.coinmint.cc/' target='_blank'>Trading Platform")) {
            content = content.replace(
                sideNavPattern,
                "<li><a href='https://pc.coinmint.cc/' target='_blank'>Trading Platform</a></li>\n    $1"
            );
            updated = true;
            console.log(`Updated side navigation in ${file}`);
        }

        // 检查主导航是否需要添加Trading Platform链接
        const mainNavPattern = /(<li[^>]*><a href='trading-platform\.html'>About the Trading Platform<\/a><\/li>)/;
        if (content.match(mainNavPattern) && !content.includes("href='https://pc.coinmint.cc/' target='_blank'>Trading Platform")) {
            content = content.replace(
                mainNavPattern,
                "<li><a href='https://pc.coinmint.cc/' target='_blank'>Trading Platform</a></li>\n      $1"
            );
            updated = true;
            console.log(`Updated main navigation in ${file}`);
        }

        // 如果有更新，保存文件
        if (updated) {
            fs.writeFileSync(file, content, 'utf8');
            console.log(`✅ Successfully updated ${file}`);
        } else {
            console.log(`ℹ️  No updates needed for ${file}`);
        }

    } catch (error) {
        console.error(`❌ Error processing ${file}:`, error.message);
    }
});

console.log('\n🎉 Trading Platform navigation update completed!');

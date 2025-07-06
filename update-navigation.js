const fs = require('fs');
const path = require('path');

// 获取所有HTML文件
const htmlFiles = fs.readdirSync('.').filter(file => 
    file.endsWith('.html') && 
    file.startsWith('index') && 
    !file.includes('backup') &&
    file !== 'index.html' &&
    file !== 'index7f127f127f12.html' &&
    file !== 'trading-platform.html'
);

console.log('找到的HTML文件:', htmlFiles);

// 更新每个文件的导航
htmlFiles.forEach(filename => {
    try {
        let content = fs.readFileSync(filename, 'utf8');
        let updated = false;

        // 更新移动导航 - 模式1: Contact Us 和 Crypto Trading/Trading Platform 在一起
        const mobilePattern1 = /(\s*<li\s*><a\s+href='https:\/\/direct\.lc\.chat\/19126558\/'\s*>Contact Us<\/a>\s*<\/li>\s*\n\s*<li\s*><a\s+href='https:\/\/pc\.coinmint\.cc\/#\/home'\s*>(?:Crypto Trading|Trading Platform)<\/a>\s*<\/li>)/g;
        if (mobilePattern1.test(content)) {
            content = content.replace(mobilePattern1, 
                "    <li><a href='trading-platform.html'>About the Trading Platform</a></li>\n    <li><a href='https://direct.lc.chat/19126558/'>Contact Us</a></li>");
            updated = true;
            console.log(`${filename}: 更新了移动导航模式1`);
        }

        // 更新桌面导航 - 模式1
        const desktopPattern1 = /(\s*<li><a\s+href='https:\/\/direct\.lc\.chat\/19126558\/'>Contact Us<\/a>\s*<\/li>\s*\n\s*<li><a\s+href='https:\/\/pc\.coinmint\.cc\/#\/home'>(?:Crypto Trading|Trading Platform)<\/a>\s*<\/li>)/g;
        if (desktopPattern1.test(content)) {
            content = content.replace(desktopPattern1, 
                "      <li><a href='trading-platform.html'>About the Trading Platform</a></li>\n      <li><a href='https://direct.lc.chat/19126558/'>Contact Us</a></li>");
            updated = true;
            console.log(`${filename}: 更新了桌面导航模式1`);
        }

        // 更新移动导航 - 模式2: 只有Contact Us
        const mobilePattern2 = /(\s*<li\s*><a\s+href='https:\/\/direct\.lc\.chat\/19126558\/'\s*>Contact Us<\/a>\s*<\/li>)(?!\s*\n\s*<li[^>]*>.*?About the Trading Platform)/g;
        if (mobilePattern2.test(content) && !content.includes('About the Trading Platform')) {
            content = content.replace(mobilePattern2, 
                "    <li><a href='trading-platform.html'>About the Trading Platform</a></li>\n$1");
            updated = true;
            console.log(`${filename}: 更新了移动导航模式2`);
        }

        // 更新桌面导航 - 模式2: 只有Contact Us
        const desktopPattern2 = /(\s*<li><a\s+href='https:\/\/direct\.lc\.chat\/19126558\/'>Contact Us<\/a>\s*<\/li>)(?!\s*\n\s*<li[^>]*>.*?About the Trading Platform)/g;
        if (desktopPattern2.test(content) && !content.includes('About the Trading Platform')) {
            content = content.replace(desktopPattern2, 
                "      <li><a href='trading-platform.html'>About the Trading Platform</a></li>\n$1");
            updated = true;
            console.log(`${filename}: 更新了桌面导航模式2`);
        }

        if (updated) {
            fs.writeFileSync(filename, content, 'utf8');
            console.log(`✅ ${filename} 导航更新完成`);
        } else {
            console.log(`⚠️ ${filename} 未找到匹配的导航模式或已经包含About the Trading Platform`);
        }

    } catch (error) {
        console.error(`❌ 处理 ${filename} 时出错:`, error.message);
    }
});

console.log('\n导航更新完成！');

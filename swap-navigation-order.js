const fs = require('fs');
const path = require('path');

// 获取所有需要更新的HTML文件
const htmlFiles = [
    'index074d074d074d.html',
    'index0bc00bc00bc0.html', 
    'index0c760c760c76.html',
    'index-2.html',
    'index470e470e470e.html',
    'index4c5f4c5f4c5f.html',
    'index556855685568.html',
    'index5b675b675b67.html',
    'index7db57db57db5.html',
    'index7f127f127f12.html',
    'index82b382b382b3.html',
    'index932e932e932e.html',
    'index9a149a149a14.html',
    'indexb2beb2beb2be.html',
    'indexbe3ebe3ebe3e.html',
    'indexc1a5c1a5c1a5.html',
    'indexcd9ccd9ccd9c.html',
    'indexd7ebd7ebd7eb.html',
    'indexdd4edd4edd4e.html',
    'indexdd9fdd9fdd9f.html',
    'indexebf0ebf0ebf0.html'
];

console.log('开始交换导航按钮位置...');

htmlFiles.forEach(filename => {
    if (!fs.existsSync(filename)) {
        console.log(`⚠️ 文件不存在: ${filename}`);
        return;
    }

    try {
        let content = fs.readFileSync(filename, 'utf8');
        let updated = false;

        // 模式1: 标准格式 - Trading Platform 在前，About the Trading Platform 在后
        const pattern1 = /<li><a href='https:\/\/pc\.coinmint\.cc\/' target='_blank'>Trading Platform<\/a><\/li>\s*\n\s*<li[^>]*><a href='trading-platform\.html'>About the Trading Platform<\/a><\/li>/g;
        if (pattern1.test(content)) {
            content = content.replace(pattern1, 
                "<li><a href='trading-platform.html'>About the Trading Platform</a></li>\n    <li><a href='https://pc.coinmint.cc/' target='_blank'>Trading Platform</a></li>");
            updated = true;
            console.log(`${filename}: 更新了标准导航格式`);
        }

        // 模式2: 带class的格式
        const pattern2 = /<li[^>]*><a href='https:\/\/pc\.coinmint\.cc\/' target='_blank'>Trading Platform<\/a><\/li>\s*\n\s*<li[^>]*><a href='trading-platform\.html'>About the Trading Platform<\/a><\/li>/g;
        if (pattern2.test(content)) {
            content = content.replace(pattern2, 
                "<li><a href='trading-platform.html'>About the Trading Platform</a></li>\n      <li><a href='https://pc.coinmint.cc/' target='_blank'>Trading Platform</a></li>");
            updated = true;
            console.log(`${filename}: 更新了带class的导航格式`);
        }

        // 模式3: 移动端导航格式
        const pattern3 = /(\s*)<li><a href='https:\/\/pc\.coinmint\.cc\/' target='_blank'>Trading Platform<\/a><\/li>\s*\n(\s*)<li><a href='trading-platform\.html'>About the Trading Platform<\/a><\/li>/g;
        if (pattern3.test(content)) {
            content = content.replace(pattern3, 
                "$1<li><a href='trading-platform.html'>About the Trading Platform</a></li>\n$2<li><a href='https://pc.coinmint.cc/' target='_blank'>Trading Platform</a></li>");
            updated = true;
            console.log(`${filename}: 更新了移动端导航格式`);
        }

        // 模式4: 特殊格式 - 可能有额外的空格或属性
        const pattern4 = /(\s*)<li[^>]*>\s*<a\s+href='https:\/\/pc\.coinmint\.cc\/'\s+target='_blank'[^>]*>Trading Platform<\/a>\s*<\/li>\s*\n(\s*)<li[^>]*>\s*<a\s+href='trading-platform\.html'[^>]*>About the Trading Platform<\/a>\s*<\/li>/g;
        if (pattern4.test(content)) {
            content = content.replace(pattern4, 
                "$1<li><a href='trading-platform.html'>About the Trading Platform</a></li>\n$2<li><a href='https://pc.coinmint.cc/' target='_blank'>Trading Platform</a></li>");
            updated = true;
            console.log(`${filename}: 更新了特殊导航格式`);
        }

        if (updated) {
            fs.writeFileSync(filename, content, 'utf8');
            console.log(`✅ ${filename} 导航位置交换完成`);
        } else {
            console.log(`ℹ️ ${filename} 未找到需要交换的导航模式`);
        }

    } catch (error) {
        console.error(`❌ 处理 ${filename} 时出错:`, error.message);
    }
});

console.log('\n导航位置交换完成！');

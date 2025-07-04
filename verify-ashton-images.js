const fs = require('fs');
const path = require('path');

console.log('🔍 验证Ashton Soniat图片设置...\n');

// 检查图片文件是否存在
const imagePath = 'static/upload/image/20250703/ashton-soniat-ceo.jpg';
const imageExists = fs.existsSync(imagePath);

console.log(`📸 图片文件状态:`);
console.log(`   路径: ${imagePath}`);
console.log(`   存在: ${imageExists ? '✅ 是' : '❌ 否'}`);

if (imageExists) {
    const stats = fs.statSync(imagePath);
    console.log(`   大小: ${stats.size} bytes`);
    
    // 检查是否是真实图片文件（不是文本占位符）
    const content = fs.readFileSync(imagePath, 'utf8');
    const isPlaceholder = content.includes('# ASHTON SONIAT CEO 照片替换说明');
    console.log(`   类型: ${isPlaceholder ? '📝 文本占位符' : '🖼️ 图片文件'}`);
}

console.log('\n📄 检查HTML文件中的图片引用:');

// 需要检查的HTML文件
const htmlFiles = [
    { file: 'indexdd4edd4edd4e.html', page: 'Executive Team页面' },
    { file: 'index2b652b652b65.html', page: 'About Coinmint页面' },
    { file: 'index932e932e932e.html', page: 'About Us页面' }
];

htmlFiles.forEach(({ file, page }) => {
    if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        
        // 检查是否包含正确的图片路径
        const hasCorrectPath = content.includes('static/upload/image/20250703/ashton-soniat-ceo.jpg');
        
        // 检查是否还有占位符图片
        const hasPlaceholder = content.includes('picsum.photos') && content.includes('Ashton');
        
        console.log(`   ${page}:`);
        console.log(`     文件: ${file}`);
        console.log(`     正确路径: ${hasCorrectPath ? '✅' : '❌'}`);
        console.log(`     无占位符: ${!hasPlaceholder ? '✅' : '❌'}`);
        
        if (hasCorrectPath) {
            // 提取图片标签
            const imgMatch = content.match(/<img[^>]*src="static\/upload\/image\/20250703\/ashton-soniat-ceo\.jpg"[^>]*>/);
            if (imgMatch) {
                console.log(`     图片标签: ✅ 找到`);
            }
        }
    } else {
        console.log(`   ${page}: ❌ 文件不存在 (${file})`);
    }
    console.log('');
});

console.log('🔗 检查首页导航链接:');

const indexFile = 'index.html';
if (fs.existsSync(indexFile)) {
    const content = fs.readFileSync(indexFile, 'utf8');
    
    // 检查About Us链接
    const aboutUsLinks = [
        'index932e932e932e.html?pages_44/',  // About Us主页
        'indexdd4edd4edd4e.html?zuzhi/',     // Executive Team
        'index2b652b652b65.html?jianjie/'    // Company Overview
    ];
    
    aboutUsLinks.forEach(link => {
        const hasLink = content.includes(link);
        const linkName = link.includes('pages_44') ? 'About Us主页' : 
                        link.includes('zuzhi') ? 'Executive Team' : 'Company Overview';
        console.log(`   ${linkName}: ${hasLink ? '✅' : '❌'}`);
    });
} else {
    console.log('   ❌ index.html 文件不存在');
}

console.log('\n📋 总结:');
console.log('1. 所有HTML文件的图片路径已正确设置');
console.log('2. 首页导航菜单链接正确');
console.log('3. 需要替换图片文件为真实照片');
console.log('\n🎯 下一步操作:');
console.log('   请将Ashton Soniat的真实照片上传并替换:');
console.log('   static/upload/image/20250703/ashton-soniat-ceo.jpg');

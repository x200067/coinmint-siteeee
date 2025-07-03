const fs = require('fs');
const path = require('path');

function findMissingCTAButtons() {
    console.log('🔍 查找所有需要更新的CTA按钮...\n');
    
    // 获取所有 HTML 文件
    const files = fs.readdirSync(__dirname)
        .filter(file => file.endsWith('.html') && file.startsWith('index'));
    
    // CTA按钮关键词（应该跳转到外部网站的）
    const ctaKeywords = [
        'Get Started',
        'Start Mining',
        'Start Trading', 
        'Trade Now',
        'Calculate',
        'Explore',
        'Connect',
        'Join',
        'Contact Sales',
        'Contact Our',
        'Contact Team',
        'Get in Touch',
        'Partnership',
        'Hosting Journey',
        'Yield'
    ];
    
    // 应该保持内部链接的按钮
    const internalKeywords = [
        'Learn More',
        'Read More', 
        'View All',
        'Subscribe',
        'Contact Us'  // 导航中的联系我们
    ];
    
    let foundIssues = [];
    
    files.forEach(file => {
        const filePath = path.join(__dirname, file);
        const content = fs.readFileSync(filePath, 'utf8');
        
        // 查找所有按钮
        const buttonRegex = /<a[^>]*class="[^"]*btn[^"]*"[^>]*href="([^"]*)"[^>]*>([^<]*)</g;
        let match;
        
        while ((match = buttonRegex.exec(content)) !== null) {
            const href = match[1];
            const text = match[2].trim();
            
            // 检查是否是CTA按钮
            const isCTA = ctaKeywords.some(keyword => text.includes(keyword));
            const isInternal = internalKeywords.some(keyword => text.includes(keyword));
            
            if (isCTA && !href.includes('pc.coinmint.cc')) {
                foundIssues.push({
                    file: file,
                    text: text,
                    href: href,
                    type: 'CTA需要更新'
                });
            }
            
            // 特殊检查：Learn More按钮在服务页面应该跳转到外部
            if (text.includes('Learn More') && 
                (file.includes('7f12') || file.includes('service')) && 
                !href.includes('pc.coinmint.cc')) {
                foundIssues.push({
                    file: file,
                    text: text,
                    href: href,
                    type: '服务页面Learn More需要更新'
                });
            }
        }
    });
    
    if (foundIssues.length > 0) {
        console.log('❌ 发现需要更新的按钮:\n');
        foundIssues.forEach((issue, index) => {
            console.log(`${index + 1}. 文件: ${issue.file}`);
            console.log(`   按钮文本: "${issue.text}"`);
            console.log(`   当前链接: ${issue.href}`);
            console.log(`   问题类型: ${issue.type}`);
            console.log('');
        });
    } else {
        console.log('✅ 所有CTA按钮都已正确更新！');
    }
    
    return foundIssues;
}

// 运行检查
const issues = findMissingCTAButtons();

if (issues.length > 0) {
    console.log(`\n📋 总计发现 ${issues.length} 个需要更新的按钮`);
    console.log('建议将这些按钮的链接更新为: https://pc.coinmint.cc/');
} else {
    console.log('\n🎉 所有CTA按钮检查完成，无需进一步更新！');
}

const fs = require('fs');
const path = require('path');

function removeAllPhoneNumbers() {
    console.log('🔍 正在删除网站上所有电话号码和电话相关功能...\n');
    
    // 获取所有 HTML 文件
    const files = fs.readdirSync(__dirname)
        .filter(file => file.endsWith('.html') && file.startsWith('index'));
    
    let totalModified = 0;
    
    files.forEach(file => {
        const filePath = path.join(__dirname, file);
        let content = fs.readFileSync(filePath, 'utf8');
        const originalContent = content;
        
        console.log(`🔍 处理文件: ${file}`);
        
        // 1. 删除显示的电话号码 +1 (888) 123-4567
        const phoneDisplayPatterns = [
            // 匹配: <li><i class="fa fa-phone mr-2"></i> +1 (888) 123-4567</li>
            /<li><i class="fa fa-phone[^"]*"><\/i>\s*\+1 \(888\) 123-4567<\/li>/g,
            // 匹配: <li><i class="glyphicon glyphicon-phone"></i> +1 (888) 123-4567</li>
            /<li><i class="glyphicon glyphicon-phone"><\/i>\s*\+1 \(888\) 123-4567<\/li>/g,
            // 更通用的匹配
            /<li[^>]*><i[^>]*phone[^>]*><\/i>[^<]*\+1 \(888\) 123-4567[^<]*<\/li>/g
        ];
        
        phoneDisplayPatterns.forEach(pattern => {
            content = content.replace(pattern, '');
        });
        
        // 2. 删除电话链接按钮 tel: 链接
        const phoneLinkPatterns = [
            // 匹配: <li><a href="tel:coinmintcc@gmail.com"><span class="icon-phone"></span>Call</a></li>
            /<li><a href="tel:[^"]*"><span class="icon-phone"><\/span>Call<\/a><\/li>/g,
            // 更通用的 tel: 链接匹配
            /<li><a href="tel:[^"]*"[^>]*>[^<]*<\/a><\/li>/g
        ];
        
        phoneLinkPatterns.forEach(pattern => {
            content = content.replace(pattern, '');
        });
        
        // 3. 删除可能的其他电话相关内容
        // 删除包含 "Phone：" 的行
        content = content.replace(/<span>Phone：[^<]*<\/span>/g, '');
        
        // 4. 清理多余的空行和空白
        content = content.replace(/\n\s*\n\s*\n/g, '\n\n');
        content = content.replace(/\s+\n/g, '\n');
        
        if (content !== originalContent) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`✅ 已修改: ${file}`);
            totalModified++;
        } else {
            console.log(`⚪ 无需修改: ${file}`);
        }
    });
    
    console.log(`\n🎉 完成！共修改了 ${totalModified} 个文件`);
    console.log('✅ 所有电话号码和电话相关功能已彻底删除');
    console.log('📋 删除的内容包括:');
    console.log('   - 显示的电话号码: +1 (888) 123-4567');
    console.log('   - 电话链接按钮: tel: 链接');
    console.log('   - Call 按钮');
    console.log('   - Phone: 标签');
}

removeAllPhoneNumbers();

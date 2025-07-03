const fs = require('fs');
const path = require('path');

function optimizeAllPages() {
    console.log('🚀 开始批量优化所有页面...\n');
    
    // 获取所有 HTML 文件
    const files = fs.readdirSync(__dirname)
        .filter(file => file.endsWith('.html') && file.startsWith('index'));
    
    let totalOptimized = 0;
    
    files.forEach(file => {
        const filePath = path.join(__dirname, file);
        let content = fs.readFileSync(filePath, 'utf8');
        const originalContent = content;
        
        console.log(`🔍 优化文件: ${file}`);
        
        // 1. 优化头部标签
        content = content.replace(
            /<!DOCTYPE html>\s*<html lang="en">\s*<!-- Mirrored[^>]*-->\s*<!-- Added by HTTrack -->\s*<!-- Mirrored[^>]*-->\s*<!-- Added by HTTrack --><meta[^>]*\/>\s*<meta[^>]*\/>\s*<head>\s*<meta charset="utf-8">\s*<meta name="viewport"[^>]*>\s*<meta http-equiv="Content-Type"[^>]*\/>/g,
            '<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">\n<meta http-equiv="X-UA-Compatible" content="IE=edge">'
        );
        
        // 2. 优化作者标签
        content = content.replace(
            /<meta name="author" content="admnbuy\.cn k357" \/>/g,
            '<meta name="author" content="Coinmint">'
        );
        
        // 3. 添加SEO优化标签
        if (!content.includes('meta name="robots"')) {
            content = content.replace(
                /<meta name="author" content="Coinmint">/,
                '<meta name="author" content="Coinmint">\n<meta name="robots" content="index, follow">\n<meta name="theme-color" content="#667eea">'
            );
        }
        
        // 4. 优化CSS和JS加载
        content = content.replace(
            /<link href="skin\/css\/bootstrap\.min\.css" type="text\/css" rel="stylesheet" \/>/g,
            '<link rel="preload" href="skin/css/bootstrap.min.css" as="style">\n<link href="skin/css/bootstrap.min.css" type="text/css" rel="stylesheet">'
        );
        
        content = content.replace(
            /<script type="text\/javascript" src="skin\/js\/jquery\.min\.js"><\/script>/g,
            '<script src="skin/js/jquery.min.js" defer></script>'
        );
        
        content = content.replace(
            /<script type="text\/javascript" src="skin\/js\/bootstrap\.min\.js"><\/script>/g,
            '<script src="skin/js/bootstrap.min.js" defer></script>'
        );
        
        // 5. 优化图片加载
        content = content.replace(
            /<img([^>]*src="[^"]*"[^>]*)>/g,
            (match, attrs) => {
                if (!attrs.includes('loading=')) {
                    // 对于首屏重要图片使用 eager，其他使用 lazy
                    const isLogo = attrs.includes('Logo') || attrs.includes('logo');
                    const loading = isLogo ? 'loading="eager"' : 'loading="lazy" decoding="async"';
                    return `<img${attrs} ${loading}>`;
                }
                return match;
            }
        );
        
        // 6. 优化JavaScript错误处理
        content = content.replace(
            /new WOW\(\)\.init\(\);/g,
            'try { if (typeof WOW !== "undefined") { new WOW().init(); } } catch (e) { console.warn("WOW init failed:", e); }'
        );
        
        // 7. 优化返回顶部功能
        content = content.replace(
            /\$\("#gotop"\)\.click\(function\(\)\{\s*\$\("html,body"\)\.animate\(\{scrollTop:0\}\);\s*\}\);/g,
            '$("#gotop").click(function(e){ e.preventDefault(); $("html,body").animate({scrollTop:0}, 800, "swing"); });'
        );
        
        if (content !== originalContent) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`✅ 已优化: ${file}`);
            totalOptimized++;
        } else {
            console.log(`⚪ 无需优化: ${file}`);
        }
    });
    
    console.log(`\n🎉 优化完成！共优化了 ${totalOptimized} 个文件`);
}

// 运行优化
optimizeAllPages();

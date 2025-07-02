/**
 * 网站内容编辑服务器
 * 提供API接口用于直接修改HTML文件内容
 */

const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3001;

// 网站根目录
const WEBSITE_ROOT = path.join(__dirname, '..');

// 中间件
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

// 静态文件服务
app.use(express.static(WEBSITE_ROOT));

// 日志中间件
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

/**
 * 获取HTML文件内容
 */
app.get('/api/content/:filename', async (req, res) => {
    try {
        const filename = req.params.filename;
        const filePath = path.join(WEBSITE_ROOT, filename);
        
        // 安全检查：确保文件在网站根目录内
        if (!filePath.startsWith(WEBSITE_ROOT)) {
            return res.status(403).json({ error: '访问被拒绝' });
        }
        
        const content = await fs.readFile(filePath, 'utf8');
        res.json({ 
            success: true, 
            content: content,
            filename: filename,
            lastModified: (await fs.stat(filePath)).mtime
        });
    } catch (error) {
        console.error('读取文件错误:', error);
        res.status(500).json({ 
            success: false, 
            error: '读取文件失败: ' + error.message 
        });
    }
});

/**
 * 更新HTML文件中的特定元素内容
 */
app.post('/api/update-element', async (req, res) => {
    try {
        const { filename, selector, newContent, oldContent } = req.body;
        
        if (!filename || !selector || newContent === undefined) {
            return res.status(400).json({ 
                success: false, 
                error: '缺少必要参数' 
            });
        }
        
        const filePath = path.join(WEBSITE_ROOT, filename);
        
        // 安全检查
        if (!filePath.startsWith(WEBSITE_ROOT)) {
            return res.status(403).json({ error: '访问被拒绝' });
        }
        
        // 读取原文件
        let content = await fs.readFile(filePath, 'utf8');
        
        // 创建备份
        const backupPath = path.join(__dirname, 'backups', `${filename}.${Date.now()}.bak`);
        await fs.mkdir(path.dirname(backupPath), { recursive: true });
        await fs.writeFile(backupPath, content);
        
        // 使用简单的字符串替换（更安全的方法）
        if (oldContent && content.includes(oldContent)) {
            content = content.replace(oldContent, newContent);
        } else {
            // 如果没有提供oldContent，尝试智能替换
            content = smartReplace(content, selector, newContent);
        }
        
        // 写入文件
        await fs.writeFile(filePath, content, 'utf8');
        
        res.json({ 
            success: true, 
            message: '内容更新成功',
            backup: backupPath
        });
        
        console.log(`✅ 已更新 ${filename} 中的 ${selector}`);
        
    } catch (error) {
        console.error('更新文件错误:', error);
        res.status(500).json({ 
            success: false, 
            error: '更新文件失败: ' + error.message 
        });
    }
});

/**
 * 批量更新多个元素
 */
app.post('/api/batch-update', async (req, res) => {
    try {
        const { filename, updates } = req.body;
        
        if (!filename || !Array.isArray(updates)) {
            return res.status(400).json({ 
                success: false, 
                error: '缺少必要参数' 
            });
        }
        
        const filePath = path.join(WEBSITE_ROOT, filename);
        
        // 安全检查
        if (!filePath.startsWith(WEBSITE_ROOT)) {
            return res.status(403).json({ error: '访问被拒绝' });
        }
        
        // 读取原文件
        let content = await fs.readFile(filePath, 'utf8');
        
        // 创建备份
        const backupPath = path.join(__dirname, 'backups', `${filename}.${Date.now()}.bak`);
        await fs.mkdir(path.dirname(backupPath), { recursive: true });
        await fs.writeFile(backupPath, content);
        
        // 批量更新
        let updateCount = 0;
        for (const update of updates) {
            const { selector, newContent, oldContent } = update;
            
            if (oldContent && content.includes(oldContent)) {
                content = content.replace(oldContent, newContent);
                updateCount++;
            } else {
                const updated = smartReplace(content, selector, newContent);
                if (updated !== content) {
                    content = updated;
                    updateCount++;
                }
            }
        }
        
        // 写入文件
        await fs.writeFile(filePath, content, 'utf8');
        
        res.json({ 
            success: true, 
            message: `批量更新成功，共更新 ${updateCount} 个元素`,
            updateCount: updateCount,
            backup: backupPath
        });
        
        console.log(`✅ 批量更新 ${filename}，共 ${updateCount} 个元素`);
        
    } catch (error) {
        console.error('批量更新错误:', error);
        res.status(500).json({ 
            success: false, 
            error: '批量更新失败: ' + error.message 
        });
    }
});

/**
 * 获取备份列表
 */
app.get('/api/backups', async (req, res) => {
    try {
        const backupDir = path.join(__dirname, 'backups');
        
        try {
            const files = await fs.readdir(backupDir);
            const backups = [];
            
            for (const file of files) {
                if (file.endsWith('.bak')) {
                    const filePath = path.join(backupDir, file);
                    const stats = await fs.stat(filePath);
                    backups.push({
                        filename: file,
                        size: stats.size,
                        created: stats.mtime,
                        originalFile: file.split('.')[0]
                    });
                }
            }
            
            // 按时间排序
            backups.sort((a, b) => new Date(b.created) - new Date(a.created));
            
            res.json({ success: true, backups });
        } catch (error) {
            res.json({ success: true, backups: [] });
        }
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: '获取备份列表失败: ' + error.message 
        });
    }
});

/**
 * 智能替换函数
 * 根据选择器和新内容智能替换HTML中的内容
 */
function smartReplace(html, selector, newContent) {
    // 这里实现简单的文本替换逻辑
    // 在实际应用中，你可能需要使用更复杂的HTML解析器
    
    // 处理常见的HTML标签
    const tagPatterns = {
        'h1': /<h1[^>]*>(.*?)<\/h1>/gi,
        'h2': /<h2[^>]*>(.*?)<\/h2>/gi,
        'h3': /<h3[^>]*>(.*?)<\/h3>/gi,
        'h4': /<h4[^>]*>(.*?)<\/h4>/gi,
        'p': /<p[^>]*>(.*?)<\/p>/gi,
        'span': /<span[^>]*>(.*?)<\/span>/gi,
        'div': /<div[^>]*>(.*?)<\/div>/gi
    };
    
    // 提取标签名
    const tagMatch = selector.match(/^([a-z]+)/i);
    if (tagMatch) {
        const tagName = tagMatch[1].toLowerCase();
        const pattern = tagPatterns[tagName];
        
        if (pattern) {
            // 简单替换第一个匹配的标签内容
            return html.replace(pattern, (match, content) => {
                return match.replace(content, newContent);
            });
        }
    }
    
    return html;
}

/**
 * 健康检查
 */
app.get('/api/health', (req, res) => {
    res.json({ 
        success: true, 
        message: '服务器运行正常',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// 错误处理中间件
app.use((error, req, res, next) => {
    console.error('服务器错误:', error);
    res.status(500).json({ 
        success: false, 
        error: '服务器内部错误' 
    });
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`🚀 网站编辑服务器已启动`);
    console.log(`📍 地址: http://localhost:${PORT}`);
    console.log(`📁 网站根目录: ${WEBSITE_ROOT}`);
    console.log(`⚡ API端点:`);
    console.log(`   GET  /api/health - 健康检查`);
    console.log(`   GET  /api/content/:filename - 获取文件内容`);
    console.log(`   POST /api/update-element - 更新单个元素`);
    console.log(`   POST /api/batch-update - 批量更新`);
    console.log(`   GET  /api/backups - 获取备份列表`);
});

module.exports = app;

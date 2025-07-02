// 可视化编辑器后端服务器
const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3001;

// 中间件
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static('.'));

// 备份目录
const BACKUP_DIR = path.join(__dirname, 'backups');
if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR);
}

// 创建备份文件
function createBackup(filePath) {
    try {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const fileName = path.basename(filePath, '.html');
        const backupFileName = `${fileName}_backup_${timestamp}.html`;
        const backupPath = path.join(BACKUP_DIR, backupFileName);
        
        if (fs.existsSync(filePath)) {
            fs.copyFileSync(filePath, backupPath);
            console.log(`✅ 备份已创建: ${backupFileName}`);
            return backupFileName;
        }
    } catch (error) {
        console.error('❌ 创建备份失败:', error);
        throw error;
    }
}

// 获取文件内容
app.get('/api/file/:filename', (req, res) => {
    try {
        const filename = req.params.filename;
        const filePath = path.join(__dirname, filename);
        
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: '文件不存在' });
        }
        
        const content = fs.readFileSync(filePath, 'utf8');
        res.json({ 
            success: true, 
            content: content,
            filename: filename 
        });
        
    } catch (error) {
        console.error('读取文件失败:', error);
        res.status(500).json({ error: '读取文件失败: ' + error.message });
    }
});

// 保存文件内容
app.post('/api/file/:filename', (req, res) => {
    try {
        const filename = req.params.filename;
        const { content, changes } = req.body;
        const filePath = path.join(__dirname, filename);
        
        console.log(`📝 开始保存文件: ${filename}`);
        console.log(`📊 修改数量: ${changes ? changes.length : 0}`);
        
        // 创建备份
        let backupFileName = null;
        if (fs.existsSync(filePath)) {
            backupFileName = createBackup(filePath);
        }
        
        // 保存新内容
        fs.writeFileSync(filePath, content, 'utf8');
        
        console.log(`✅ 文件保存成功: ${filename}`);
        
        res.json({ 
            success: true, 
            message: '文件保存成功',
            filename: filename,
            backup: backupFileName,
            changesCount: changes ? changes.length : 0
        });
        
    } catch (error) {
        console.error('❌ 保存文件失败:', error);
        res.status(500).json({ error: '保存文件失败: ' + error.message });
    }
});

// 应用文本修改到HTML内容
app.post('/api/apply-changes/:filename', (req, res) => {
    try {
        const filename = req.params.filename;
        const { changes } = req.body;
        const filePath = path.join(__dirname, filename);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: '文件不存在' });
        }

        console.log(`🔄 应用修改到文件: ${filename}`);
        console.log(`📊 修改数量: ${changes.length}`);

        // 读取原始文件
        let content = fs.readFileSync(filePath, 'utf8');
        const originalSize = content.length;

        // 文件完整性检查
        if (originalSize < 30000) { // 如果文件太小，可能是错误的文件
            console.log(`⚠️  警告: 文件大小异常 (${originalSize} 字符)，检查是否为正确文件`);
        }

        // 创建备份
        const backupFileName = createBackup(filePath);
        
        // 应用每个修改
        changes.forEach((change, index) => {
            const { originalText, newText, selector } = change;

            if (originalText && newText && originalText !== newText) {
                // 转义特殊字符
                const escapedOriginal = originalText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const escapedNew = newText.replace(/\$/g, '$$$$'); // 转义替换字符串中的$

                // 多种匹配模式
                const patterns = [
                    // 1. 标准的 >text< 模式
                    new RegExp(`>${escapedOriginal}<`, 'g'),
                    // 2. 直接文本匹配（用于没有标签包围的情况）
                    new RegExp(`\\b${escapedOriginal}\\b`, 'g'),
                    // 3. 更宽松的匹配（处理空格和换行）
                    new RegExp(escapedOriginal.replace(/\s+/g, '\\s+'), 'g')
                ];

                let replaced = false;
                let replaceCount = 0;

                // 尝试每种模式
                for (let i = 0; i < patterns.length && !replaced; i++) {
                    const pattern = patterns[i];
                    const matches = content.match(pattern);

                    if (matches && matches.length > 0) {
                        if (i === 0) {
                            // >text< 模式
                            content = content.replace(pattern, `>${escapedNew}<`);
                        } else {
                            // 直接替换
                            content = content.replace(pattern, escapedNew);
                        }
                        replaceCount = matches.length;
                        replaced = true;
                        console.log(`  ${index + 1}. "${originalText}" → "${newText}" (模式${i+1}, 替换了 ${replaceCount} 处)`);
                    }
                }

                if (!replaced) {
                    console.log(`  ${index + 1}. "${originalText}" → "${newText}" (未找到匹配)`);
                    // 尝试最后的备用方案：简单字符串替换
                    if (content.includes(originalText)) {
                        content = content.replace(originalText, newText);
                        console.log(`  ${index + 1}. "${originalText}" → "${newText}" (使用简单替换)`);
                    }
                }
            }
        });
        
        // 保存修改后的文件
        fs.writeFileSync(filePath, content, 'utf8');
        
        console.log(`✅ 修改应用成功: ${filename}`);
        
        res.json({ 
            success: true, 
            message: `成功应用 ${changes.length} 处修改`,
            filename: filename,
            backup: backupFileName,
            changesCount: changes.length
        });
        
    } catch (error) {
        console.error('❌ 应用修改失败:', error);
        res.status(500).json({ error: '应用修改失败: ' + error.message });
    }
});

// 获取备份列表
app.get('/api/backups', (req, res) => {
    try {
        const backups = fs.readdirSync(BACKUP_DIR)
            .filter(file => file.endsWith('.html'))
            .map(file => {
                const stats = fs.statSync(path.join(BACKUP_DIR, file));
                return {
                    filename: file,
                    created: stats.mtime,
                    size: stats.size
                };
            })
            .sort((a, b) => b.created - a.created);
        
        res.json({ success: true, backups });
    } catch (error) {
        console.error('获取备份列表失败:', error);
        res.status(500).json({ error: '获取备份列表失败: ' + error.message });
    }
});

// 恢复备份
app.post('/api/restore/:backupFilename', (req, res) => {
    try {
        const backupFilename = req.params.backupFilename;
        const { targetFilename } = req.body;
        
        const backupPath = path.join(BACKUP_DIR, backupFilename);
        const targetPath = path.join(__dirname, targetFilename || 'index.html');
        
        if (!fs.existsSync(backupPath)) {
            return res.status(404).json({ error: '备份文件不存在' });
        }
        
        // 创建当前文件的备份
        if (fs.existsSync(targetPath)) {
            createBackup(targetPath);
        }
        
        // 恢复备份
        fs.copyFileSync(backupPath, targetPath);
        
        console.log(`✅ 备份恢复成功: ${backupFilename} → ${targetFilename}`);
        
        res.json({ 
            success: true, 
            message: '备份恢复成功',
            restored: backupFilename,
            target: targetFilename
        });
        
    } catch (error) {
        console.error('恢复备份失败:', error);
        res.status(500).json({ error: '恢复备份失败: ' + error.message });
    }
});

// 健康检查
app.get('/api/health', (req, res) => {
    res.json({ 
        success: true, 
        message: '可视化编辑器后端服务正常运行',
        timestamp: new Date().toISOString(),
        port: PORT
    });
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`
🚀 可视化编辑器后端服务器已启动
📍 地址: http://localhost:${PORT}
📁 工作目录: ${__dirname}
💾 备份目录: ${BACKUP_DIR}
⚡ 准备接收编辑请求...
    `);
});

module.exports = app;

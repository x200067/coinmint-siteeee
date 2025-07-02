// 部署API - 处理文件修改和部署
const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const { Octokit } = require('@octokit/rest');
const fetch = require('node-fetch');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, '..')));

// 允许跨域
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});

// 应用修改到文件
app.post('/api/apply-changes', async (req, res) => {
    try {
        const { changes, targetFile = 'index.html' } = req.body;
        
        if (!changes || !Array.isArray(changes)) {
            return res.status(400).json({ error: '无效的修改数据' });
        }
        
        // 读取目标文件
        const filePath = path.join(__dirname, '..', targetFile);
        let content = await fs.readFile(filePath, 'utf8');
        
        // 应用所有修改
        changes.forEach(change => {
            if (change.oldText && change.newText) {
                // 使用更精确的替换策略
                content = content.replace(new RegExp(escapeRegExp(change.oldText), 'g'), change.newText);
            }
        });
        
        // 创建备份
        const backupPath = path.join(__dirname, '..', `${targetFile}.backup.${Date.now()}`);
        await fs.copyFile(filePath, backupPath);
        
        // 写入修改后的内容
        await fs.writeFile(filePath, content, 'utf8');
        
        res.json({ 
            success: true, 
            message: `成功应用 ${changes.length} 项修改到 ${targetFile}`,
            backupFile: path.basename(backupPath)
        });
        
    } catch (error) {
        console.error('应用修改失败:', error);
        res.status(500).json({ error: '应用修改失败: ' + error.message });
    }
});

// 部署到GitHub
app.post('/api/deploy/github', async (req, res) => {
    try {
        const { token, owner, repo, branch = 'main', message, changes } = req.body;
        
        if (!token || !owner || !repo) {
            return res.status(400).json({ error: '缺少必要的GitHub配置' });
        }
        
        // 先应用修改到本地文件
        if (changes && changes.length > 0) {
            await applyChangesToFile(changes, 'index.html');
        }
        
        const octokit = new Octokit({ auth: token });
        
        // 读取修改后的文件
        const filePath = path.join(__dirname, '..', 'index.html');
        const content = await fs.readFile(filePath, 'utf8');
        const encodedContent = Buffer.from(content).toString('base64');
        
        // 获取当前文件的SHA
        let sha = '';
        try {
            const { data } = await octokit.rest.repos.getContent({
                owner,
                repo,
                path: 'index.html',
                ref: branch
            });
            sha = data.sha;
        } catch (error) {
            // 文件不存在，创建新文件
            console.log('文件不存在，将创建新文件');
        }
        
        // 更新或创建文件
        const result = await octokit.rest.repos.createOrUpdateFileContents({
            owner,
            repo,
            path: 'index.html',
            message: message || `Update content via Global Editor - ${new Date().toISOString()}`,
            content: encodedContent,
            sha: sha || undefined,
            branch
        });
        
        res.json({
            success: true,
            message: '成功部署到GitHub',
            commitUrl: result.data.commit.html_url,
            sha: result.data.commit.sha
        });
        
    } catch (error) {
        console.error('GitHub部署失败:', error);
        res.status(500).json({ error: 'GitHub部署失败: ' + error.message });
    }
});

// 部署到Netlify
app.post('/api/deploy/netlify', async (req, res) => {
    try {
        const { token, siteId, changes } = req.body;
        
        if (!token || !siteId) {
            return res.status(400).json({ error: '缺少必要的Netlify配置' });
        }
        
        // 先应用修改到本地文件
        if (changes && changes.length > 0) {
            await applyChangesToFile(changes, 'index.html');
        }
        
        // 创建部署包
        const FormData = require('form-data');
        const form = new FormData();
        
        // 添加修改后的文件
        const filePath = path.join(__dirname, '..', 'index.html');
        const content = await fs.readFile(filePath);
        form.append('index.html', content, 'index.html');
        
        // 部署到Netlify
        const response = await fetch(`https://api.netlify.com/api/v1/sites/${siteId}/deploys`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                ...form.getHeaders()
            },
            body: form
        });
        
        if (!response.ok) {
            throw new Error(`Netlify API错误: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        res.json({
            success: true,
            message: '成功部署到Netlify',
            deployUrl: result.deploy_ssl_url || result.deploy_url,
            deployId: result.id
        });
        
    } catch (error) {
        console.error('Netlify部署失败:', error);
        res.status(500).json({ error: 'Netlify部署失败: ' + error.message });
    }
});

// 获取部署状态
app.get('/api/deploy/status/:platform/:id', async (req, res) => {
    try {
        const { platform, id } = req.params;
        
        if (platform === 'netlify') {
            const { token } = req.query;
            const response = await fetch(`https://api.netlify.com/api/v1/deploys/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.ok) {
                const data = await response.json();
                res.json({
                    status: data.state,
                    url: data.deploy_ssl_url || data.deploy_url,
                    createdAt: data.created_at
                });
            } else {
                res.status(404).json({ error: '部署状态未找到' });
            }
        } else {
            res.status(400).json({ error: '不支持的平台' });
        }
        
    } catch (error) {
        res.status(500).json({ error: '获取状态失败: ' + error.message });
    }
});

// 辅助函数：转义正则表达式特殊字符
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// 辅助函数：应用修改到文件
async function applyChangesToFile(changes, targetFile) {
    const filePath = path.join(__dirname, '..', targetFile);
    let content = await fs.readFile(filePath, 'utf8');
    
    changes.forEach(change => {
        if (change.oldText && change.newText) {
            content = content.replace(new RegExp(escapeRegExp(change.oldText), 'g'), change.newText);
        }
    });
    
    await fs.writeFile(filePath, content, 'utf8');
    return content;
}

// 健康检查
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`🚀 部署API服务器运行在端口 ${PORT}`);
    console.log(`📝 编辑器地址: http://localhost:${PORT}/admin/global-editor.html`);
});

module.exports = app;

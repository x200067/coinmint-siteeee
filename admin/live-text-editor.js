/**
 * 实时文字编辑器 - 直接输入文字立即修改网站
 * Live Text Editor - Direct text input with real-time website modification
 */

(function() {
    'use strict';
    
    // GitHub配置
    let githubConfig = {
        token: '',
        owner: '',
        repo: '',
        branch: 'main',
        filePath: 'index.html'
    };
    
    let isEditMode = false;
    let originalHTML = '';
    let isConnected = false;
    
    // 初始化实时编辑器
    function initLiveEditor() {
        loadGitHubConfig();
        createLiveToolbar();
        if (githubConfig.token) {
            testConnection();
        }
        console.log('🔥 实时文字编辑器已启动');
    }
    
    // 创建实时编辑工具栏
    function createLiveToolbar() {
        const toolbar = document.createElement('div');
        toolbar.id = 'live-toolbar';
        toolbar.innerHTML = `
            <div class="live-toolbar-content">
                <div class="toolbar-left">
                    <div class="connection-status ${isConnected ? 'connected' : 'disconnected'}" id="connection-status">
                        <span class="status-dot"></span>
                        <span class="status-text">检查连接中...</span>
                    </div>
                    <button id="start-live-edit" class="live-btn primary">
                        <span class="icon">🔥</span>
                        <span class="text">开始实时编辑</span>
                    </button>
                    <button id="publish-changes" class="live-btn success" disabled>
                        <span class="icon">🚀</span>
                        <span class="text">发布到网站</span>
                    </button>
                </div>
                <div class="toolbar-right">
                    <button id="setup-github" class="live-btn">
                        <span class="icon">⚙️</span>
                        <span class="text">设置</span>
                    </button>
                    <button id="close-live-editor" class="live-btn danger">
                        <span class="icon">✖️</span>
                        <span class="text">关闭</span>
                    </button>
                </div>
            </div>
            <div class="live-hint" id="live-hint" style="display: none;">
                🔥 实时编辑模式：直接点击文字输入新内容，立即看到效果！修改完成后点击"发布到网站"保存。
            </div>
        `;
        
        // 添加样式
        const style = document.createElement('style');
        style.textContent = `
            #live-toolbar {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                background: linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%);
                color: white;
                z-index: 10000;
                box-shadow: 0 2px 15px rgba(0,0,0,0.3);
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }
            
            .live-toolbar-content {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 12px 20px;
                max-width: 1200px;
                margin: 0 auto;
            }
            
            .toolbar-left, .toolbar-right {
                display: flex;
                gap: 15px;
                align-items: center;
            }
            
            .connection-status {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 6px 12px;
                background: rgba(255,255,255,0.15);
                border-radius: 20px;
                font-size: 12px;
                font-weight: 600;
            }
            
            .status-dot {
                width: 10px;
                height: 10px;
                border-radius: 50%;
                background: #e74c3c;
            }
            
            .connection-status.connected .status-dot {
                background: #27ae60;
                animation: pulse 2s infinite;
            }
            
            @keyframes pulse {
                0% { opacity: 1; transform: scale(1); }
                50% { opacity: 0.7; transform: scale(1.1); }
                100% { opacity: 1; transform: scale(1); }
            }
            
            .live-btn {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 10px 18px;
                background: rgba(255,255,255,0.2);
                border: 2px solid rgba(255,255,255,0.3);
                border-radius: 8px;
                color: white;
                cursor: pointer;
                transition: all 0.3s;
                font-size: 14px;
                font-weight: 600;
            }
            
            .live-btn:hover:not(:disabled) {
                background: rgba(255,255,255,0.3);
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            }
            
            .live-btn:disabled {
                opacity: 0.5;
                cursor: not-allowed;
                transform: none;
            }
            
            .live-btn.primary {
                background: #3498db;
                border-color: #2980b9;
            }
            
            .live-btn.success {
                background: #27ae60;
                border-color: #229954;
                animation: glow 2s infinite;
            }
            
            @keyframes glow {
                0% { box-shadow: 0 0 5px rgba(39, 174, 96, 0.5); }
                50% { box-shadow: 0 0 20px rgba(39, 174, 96, 0.8); }
                100% { box-shadow: 0 0 5px rgba(39, 174, 96, 0.5); }
            }
            
            .live-btn.danger {
                background: #e74c3c;
                border-color: #c0392b;
            }
            
            .live-btn .icon {
                font-size: 16px;
            }
            
            .live-hint {
                background: rgba(255,255,255,0.95);
                color: #e74c3c;
                padding: 10px 20px;
                text-align: center;
                font-weight: 600;
                font-size: 14px;
                animation: slideDown 0.3s;
            }
            
            @keyframes slideDown {
                from { height: 0; opacity: 0; }
                to { height: auto; opacity: 1; }
            }
            
            /* 实时编辑模式样式 */
            .live-edit-mode [data-live-editable] {
                background: linear-gradient(45deg, #FFE082, #FFCC02) !important;
                border: 2px solid #FF9800 !important;
                border-radius: 4px !important;
                padding: 8px !important;
                cursor: text !important;
                transition: all 0.3s !important;
                position: relative !important;
                min-height: 30px !important;
                display: inline-block !important;
            }
            
            .live-edit-mode [data-live-editable]:hover {
                background: linear-gradient(45deg, #FFF176, #FFD54F) !important;
                border-color: #F57C00 !important;
                box-shadow: 0 0 0 3px rgba(255, 152, 0, 0.3) !important;
                transform: scale(1.02) !important;
            }
            
            .live-edit-mode [data-live-editable]:focus {
                background: rgba(255, 255, 255, 0.95) !important;
                border-color: #4CAF50 !important;
                box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.3) !important;
                outline: none !important;
            }
            
            .live-edit-mode [data-live-editable]:empty:before {
                content: '点击输入文字...';
                color: #999;
                font-style: italic;
            }
            
            /* 编辑提示标签 */
            .edit-label {
                position: absolute;
                top: -25px;
                left: 0;
                background: #FF5722;
                color: white;
                padding: 2px 8px;
                border-radius: 3px;
                font-size: 11px;
                font-weight: 600;
                pointer-events: none;
                z-index: 10001;
                opacity: 0;
                transition: opacity 0.3s;
                white-space: nowrap;
            }
            
            .live-edit-mode [data-live-editable]:hover .edit-label {
                opacity: 1;
            }
            
            /* 页面偏移 */
            body.live-editor-active {
                padding-top: 70px;
            }
            
            body.live-editor-active.with-hint {
                padding-top: 110px;
            }
            
            /* 响应式 */
            @media (max-width: 768px) {
                .live-toolbar-content {
                    flex-direction: column;
                    gap: 10px;
                    padding: 10px;
                }
                
                .toolbar-left, .toolbar-right {
                    flex-wrap: wrap;
                    justify-content: center;
                }
                
                .live-btn .text {
                    display: none;
                }
                
                body.live-editor-active {
                    padding-top: 120px;
                }
                
                body.live-editor-active.with-hint {
                    padding-top: 160px;
                }
                
                .live-hint {
                    font-size: 12px;
                    padding: 8px 15px;
                }
            }
        `;
        
        document.head.appendChild(style);
        document.body.appendChild(toolbar);
        document.body.classList.add('live-editor-active');
        
        // 绑定事件
        bindToolbarEvents();
    }
    
    // 绑定工具栏事件
    function bindToolbarEvents() {
        document.getElementById('start-live-edit').addEventListener('click', toggleLiveEdit);
        document.getElementById('publish-changes').addEventListener('click', publishChanges);
        document.getElementById('setup-github').addEventListener('click', showGitHubSetup);
        document.getElementById('close-live-editor').addEventListener('click', closeLiveEditor);
    }

    // 切换实时编辑模式
    function toggleLiveEdit() {
        if (!isConnected) {
            showMessage('请先设置GitHub连接！', 'error');
            showGitHubSetup();
            return;
        }

        isEditMode = !isEditMode;
        const startBtn = document.getElementById('start-live-edit');
        const publishBtn = document.getElementById('publish-changes');
        const hint = document.getElementById('live-hint');

        if (isEditMode) {
            // 进入实时编辑模式
            document.body.classList.add('live-edit-mode', 'with-hint');
            startBtn.innerHTML = '<span class="icon">👁️</span><span class="text">退出编辑</span>';
            startBtn.classList.remove('primary');
            startBtn.classList.add('danger');
            publishBtn.disabled = false;
            hint.style.display = 'block';

            // 保存原始HTML
            originalHTML = document.documentElement.outerHTML;

            // 让文字可编辑
            makeTextLiveEditable();

            showMessage('🔥 实时编辑模式已开启！直接点击文字输入新内容', 'success');

        } else {
            // 退出实时编辑模式
            document.body.classList.remove('live-edit-mode', 'with-hint');
            startBtn.innerHTML = '<span class="icon">🔥</span><span class="text">开始实时编辑</span>';
            startBtn.classList.remove('danger');
            startBtn.classList.add('primary');
            publishBtn.disabled = true;
            hint.style.display = 'none';

            // 禁用编辑
            disableLiveEditing();

            showMessage('👁️ 实时编辑模式已关闭', 'info');
        }
    }

    // 让文字实时可编辑
    function makeTextLiveEditable() {
        // 选择所有文字元素
        const textElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, div, a, li, td, th');

        textElements.forEach(element => {
            // 跳过工具栏和特殊元素
            if (element.closest('#live-toolbar') ||
                element.closest('script') ||
                element.closest('style') ||
                element.querySelector('img') ||
                element.querySelector('input') ||
                element.querySelector('button') ||
                element.querySelector('select') ||
                element.querySelector('textarea') ||
                element.children.length > 1 ||
                element.textContent.trim() === '') {
                return;
            }

            // 只处理直接包含文字的元素
            if (element.children.length === 0 ||
                (element.children.length === 1 && element.children[0].tagName === 'BR')) {

                element.setAttribute('data-live-editable', 'true');
                element.setAttribute('data-original-text', element.textContent);
                element.contentEditable = true;

                // 添加编辑标签
                element.style.position = 'relative';
                const label = document.createElement('div');
                label.className = 'edit-label';
                label.textContent = '点击输入文字';
                element.appendChild(label);

                // 绑定实时编辑事件
                element.addEventListener('input', handleLiveInput);
                element.addEventListener('focus', handleFocus);
                element.addEventListener('blur', handleBlur);
            }
        });
    }

    // 禁用实时编辑
    function disableLiveEditing() {
        document.querySelectorAll('[data-live-editable]').forEach(element => {
            element.contentEditable = false;
            element.removeEventListener('input', handleLiveInput);
            element.removeEventListener('focus', handleFocus);
            element.removeEventListener('blur', handleBlur);

            const label = element.querySelector('.edit-label');
            if (label) label.remove();
        });
    }

    // 处理实时输入
    function handleLiveInput(event) {
        const element = event.target;
        const newText = element.textContent;

        // 实时更新显示
        element.setAttribute('data-current-text', newText);

        // 启用发布按钮
        const publishBtn = document.getElementById('publish-changes');
        publishBtn.style.animation = 'glow 1s infinite';
        publishBtn.innerHTML = '<span class="icon">🚀</span><span class="text">有更改 - 点击发布</span>';

        // 显示实时提示
        showMessage('✏️ 内容已修改，点击"发布到网站"保存更改', 'info', 2000);
    }

    // 处理焦点
    function handleFocus(event) {
        const element = event.target;
        element.style.transform = 'scale(1.02)';
        showMessage('📝 正在编辑: ' + element.tagName.toLowerCase(), 'info', 1000);
    }

    // 处理失焦
    function handleBlur(event) {
        const element = event.target;
        element.style.transform = '';
    }

    // 发布更改到GitHub
    async function publishChanges() {
        if (!isConnected) {
            showMessage('GitHub未连接！', 'error');
            return;
        }

        try {
            const publishBtn = document.getElementById('publish-changes');
            const originalText = publishBtn.innerHTML;
            publishBtn.innerHTML = '<span class="icon">🚀</span><span class="text">发布中...</span>';
            publishBtn.disabled = true;

            // 获取当前HTML
            const currentHTML = document.documentElement.outerHTML;

            // 清理HTML（移除编辑器相关的属性和元素）
            const cleanHTML = cleanHTMLForSave(currentHTML);

            // 提交到GitHub
            await updateGitHubFile(cleanHTML, '实时编辑更新网站内容');

            // 更新原始HTML
            originalHTML = currentHTML;

            // 重置按钮
            publishBtn.innerHTML = '<span class="icon">🚀</span><span class="text">发布到网站</span>';
            publishBtn.style.animation = '';
            publishBtn.disabled = false;

            showMessage('🎉 更改已发布到网站！Netlify将自动部署更新。', 'success');

        } catch (error) {
            console.error('发布错误:', error);
            showMessage('发布失败: ' + error.message, 'error');

            const publishBtn = document.getElementById('publish-changes');
            publishBtn.innerHTML = '<span class="icon">🚀</span><span class="text">发布到网站</span>';
            publishBtn.disabled = false;
        }
    }

    // 清理HTML用于保存
    function cleanHTMLForSave(html) {
        // 创建临时DOM来清理
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;

        // 移除编辑器工具栏
        const toolbar = tempDiv.querySelector('#live-toolbar');
        if (toolbar) toolbar.remove();

        // 移除编辑器相关的类
        tempDiv.querySelectorAll('.live-editor-active, .live-edit-mode, .with-hint').forEach(el => {
            el.classList.remove('live-editor-active', 'live-edit-mode', 'with-hint');
        });

        // 移除编辑器相关的属性
        tempDiv.querySelectorAll('[data-live-editable]').forEach(el => {
            el.removeAttribute('data-live-editable');
            el.removeAttribute('data-original-text');
            el.removeAttribute('data-current-text');
            el.removeAttribute('contenteditable');
            el.style.position = '';
            el.style.transform = '';

            // 移除编辑标签
            const label = el.querySelector('.edit-label');
            if (label) label.remove();
        });

        // 移除编辑器样式
        tempDiv.querySelectorAll('style').forEach(style => {
            if (style.textContent.includes('live-toolbar') ||
                style.textContent.includes('live-edit-mode')) {
                style.remove();
            }
        });

        return tempDiv.innerHTML;
    }

    // 更新GitHub文件
    async function updateGitHubFile(content, message) {
        // 获取文件信息
        const fileResponse = await fetch(`https://api.github.com/repos/${githubConfig.owner}/${githubConfig.repo}/contents/${githubConfig.filePath}?ref=${githubConfig.branch}`, {
            headers: {
                'Authorization': `token ${githubConfig.token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        if (!fileResponse.ok) {
            throw new Error(`获取文件信息失败: ${fileResponse.status}`);
        }

        const fileData = await fileResponse.json();

        // 更新文件
        const updateResponse = await fetch(`https://api.github.com/repos/${githubConfig.owner}/${githubConfig.repo}/contents/${githubConfig.filePath}`, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${githubConfig.token}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: message,
                content: btoa(unescape(encodeURIComponent(content))),
                sha: fileData.sha,
                branch: githubConfig.branch
            })
        });

        if (!updateResponse.ok) {
            const errorData = await updateResponse.json();
            throw new Error(`更新文件失败: ${errorData.message || updateResponse.status}`);
        }

        return await updateResponse.json();
    }

    // 测试GitHub连接
    async function testConnection() {
        if (!githubConfig.token || !githubConfig.owner || !githubConfig.repo) {
            updateConnectionStatus(false, '未配置');
            return;
        }

        try {
            const response = await fetch(`https://api.github.com/repos/${githubConfig.owner}/${githubConfig.repo}`, {
                headers: {
                    'Authorization': `token ${githubConfig.token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            if (response.ok) {
                isConnected = true;
                updateConnectionStatus(true, 'GitHub已连接');
                showMessage('✅ GitHub连接成功！', 'success');
            } else {
                throw new Error(`HTTP ${response.status}`);
            }
        } catch (error) {
            isConnected = false;
            updateConnectionStatus(false, 'GitHub连接失败');
            showMessage('❌ GitHub连接失败: ' + error.message, 'error');
        }
    }

    // 更新连接状态
    function updateConnectionStatus(connected, text) {
        const statusElement = document.getElementById('connection-status');
        if (statusElement) {
            statusElement.className = `connection-status ${connected ? 'connected' : 'disconnected'}`;
            statusElement.querySelector('.status-text').textContent = text;
        }
    }

    // 显示GitHub设置
    function showGitHubSetup() {
        const dialog = document.createElement('div');
        dialog.id = 'github-setup-dialog';
        dialog.innerHTML = `
            <div class="setup-overlay">
                <div class="setup-modal">
                    <h2>🔧 GitHub连接设置</h2>
                    <p>配置GitHub连接以实现实时网站编辑：</p>

                    <div class="setup-form">
                        <div class="form-group">
                            <label>GitHub Personal Access Token:</label>
                            <input type="password" id="github-token" placeholder="ghp_xxxxxxxxxxxx" value="${githubConfig.token}">
                            <small>需要repo权限的GitHub Token</small>
                        </div>

                        <div class="form-group">
                            <label>仓库所有者:</label>
                            <input type="text" id="repo-owner" placeholder="your-username" value="${githubConfig.owner}">
                        </div>

                        <div class="form-group">
                            <label>仓库名称:</label>
                            <input type="text" id="repo-name" placeholder="your-repo-name" value="${githubConfig.repo}">
                        </div>

                        <div class="form-group">
                            <label>分支名称:</label>
                            <input type="text" id="repo-branch" placeholder="main" value="${githubConfig.branch}">
                        </div>
                    </div>

                    <div class="setup-buttons">
                        <button onclick="saveGitHubConfig()" class="setup-btn primary">保存并测试连接</button>
                        <button onclick="closeGitHubSetup()" class="setup-btn">取消</button>
                    </div>

                    <div class="setup-help">
                        <h3>📖 获取GitHub Token：</h3>
                        <ol>
                            <li>访问 <a href="https://github.com/settings/tokens" target="_blank">GitHub Settings > Personal access tokens</a></li>
                            <li>点击 "Generate new token (classic)"</li>
                            <li>选择 "repo" 权限</li>
                            <li>复制生成的token</li>
                        </ol>
                    </div>
                </div>
            </div>
        `;

        // 添加设置对话框样式
        const setupStyle = document.createElement('style');
        setupStyle.textContent = `
            .setup-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0,0,0,0.8);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10010;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }

            .setup-modal {
                background: white;
                border-radius: 12px;
                padding: 30px;
                max-width: 500px;
                width: 90%;
                max-height: 80vh;
                overflow-y: auto;
            }

            .setup-modal h2 {
                margin: 0 0 20px 0;
                color: #2c3e50;
            }

            .setup-form {
                margin: 20px 0;
            }

            .form-group {
                margin-bottom: 20px;
            }

            .form-group label {
                display: block;
                margin-bottom: 5px;
                font-weight: 600;
                color: #2c3e50;
            }

            .form-group input {
                width: 100%;
                padding: 10px;
                border: 2px solid #ecf0f1;
                border-radius: 6px;
                font-size: 14px;
                box-sizing: border-box;
            }

            .form-group input:focus {
                outline: none;
                border-color: #FF6B6B;
            }

            .form-group small {
                display: block;
                margin-top: 5px;
                color: #7f8c8d;
                font-size: 12px;
            }

            .setup-buttons {
                display: flex;
                gap: 10px;
                margin: 20px 0;
            }

            .setup-btn {
                padding: 10px 20px;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-weight: 600;
                transition: all 0.3s;
            }

            .setup-btn.primary {
                background: #FF6B6B;
                color: white;
            }

            .setup-btn.primary:hover {
                background: #FF5252;
            }

            .setup-btn {
                background: #95a5a6;
                color: white;
            }

            .setup-btn:hover {
                background: #7f8c8d;
            }

            .setup-help {
                background: #f8f9fa;
                padding: 15px;
                border-radius: 6px;
                margin-top: 20px;
            }

            .setup-help h3 {
                margin: 0 0 10px 0;
                color: #2c3e50;
                font-size: 16px;
            }

            .setup-help ol {
                margin: 0;
                padding-left: 20px;
            }

            .setup-help li {
                margin-bottom: 5px;
                color: #34495e;
            }

            .setup-help a {
                color: #FF6B6B;
                text-decoration: none;
            }

            .setup-help a:hover {
                text-decoration: underline;
            }
        `;

        document.head.appendChild(setupStyle);
        document.body.appendChild(dialog);
    }

    // 保存GitHub配置
    window.saveGitHubConfig = async function() {
        const token = document.getElementById('github-token').value.trim();
        const owner = document.getElementById('repo-owner').value.trim();
        const name = document.getElementById('repo-name').value.trim();
        const branch = document.getElementById('repo-branch').value.trim() || 'main';

        if (!token || !owner || !name) {
            alert('请填写所有必需的配置项');
            return;
        }

        // 保存配置
        githubConfig = { token, owner, repo: name, branch, filePath: 'index.html' };

        // 保存到localStorage（不包含token）
        localStorage.setItem('live-editor-config', JSON.stringify({
            owner, repo: name, branch
        }));

        // 关闭对话框
        closeGitHubSetup();

        // 测试连接
        showMessage('正在测试GitHub连接...', 'info');
        await testConnection();
    };

    // 关闭GitHub设置
    window.closeGitHubSetup = function() {
        const dialog = document.getElementById('github-setup-dialog');
        if (dialog) dialog.remove();
    };

    // 加载GitHub配置
    function loadGitHubConfig() {
        const saved = localStorage.getItem('live-editor-config');
        if (saved) {
            try {
                const config = JSON.parse(saved);
                githubConfig.owner = config.owner;
                githubConfig.repo = config.repo;
                githubConfig.branch = config.branch || 'main';
            } catch (error) {
                console.warn('加载配置失败:', error);
            }
        }
    }

    // 关闭实时编辑器
    function closeLiveEditor() {
        if (confirm('确定要关闭实时编辑器吗？未发布的更改将会丢失。')) {
            document.getElementById('live-toolbar').remove();
            document.body.classList.remove('live-editor-active', 'live-edit-mode', 'with-hint');

            // 清理编辑状态
            disableLiveEditing();

            showMessage('实时编辑器已关闭', 'info');
        }
    }

    // 显示消息
    function showMessage(message, type = 'success', duration = 3000) {
        const colors = {
            success: '#27ae60',
            error: '#e74c3c',
            info: '#3498db'
        };

        const toast = document.createElement('div');
        toast.innerHTML = `
            <div style="position: fixed; top: 90px; right: 20px; background: ${colors[type]}; color: white;
                        padding: 15px 20px; border-radius: 8px; z-index: 10005;
                        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                        animation: slideInRight 0.3s; max-width: 350px; font-weight: 500;
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                ${message}
            </div>
        `;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideOutRight 0.3s';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    // 添加动画样式
    const animationStyle = document.createElement('style');
    animationStyle.textContent = `
        @keyframes slideInRight {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }

        @keyframes slideOutRight {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(animationStyle);

    // 初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initLiveEditor);
    } else {
        initLiveEditor();
    }

    // 暴露全局函数
    window.liveEditor = {
        toggle: toggleLiveEdit,
        publish: publishChanges,
        setup: showGitHubSetup,
        close: closeLiveEditor
    };

})();

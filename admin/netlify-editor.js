/**
 * Netlify可视化编辑器 - 通过GitHub API直接修改线上内容
 * Netlify Visual Editor - Direct content modification via GitHub API
 */

(function() {
    'use strict';
    
    // 配置 - 需要用户设置
    const CONFIG = {
        GITHUB_TOKEN: '', // 需要用户设置GitHub Personal Access Token
        REPO_OWNER: '', // GitHub用户名或组织名
        REPO_NAME: '', // 仓库名
        BRANCH: 'main', // 分支名，通常是main或master
        FILE_PATH: 'index.html' // 要编辑的文件路径
    };
    
    let isEditMode = false;
    let currentEditElement = null;
    let editHistory = [];
    let historyIndex = -1;
    let githubConnected = false;
    
    // 可编辑元素选择器
    const EDITABLE_SELECTORS = [
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'p', 'span:not(.icon)', 'div.slide-text h2', 'div.slide-text p',
        '.service_item_title div', '.service-overlay h4', '.service-overlay p',
        '.author-name', '.author-title', '.news-date'
    ];
    
    // 初始化编辑器
    function initNetlifyEditor() {
        // 检查配置
        if (!CONFIG.GITHUB_TOKEN) {
            showConfigDialog();
            return;
        }
        
        createEditToolbar();
        createEditOverlay();
        bindEvents();
        testGitHubConnection();
        console.log('🌐 Netlify编辑器已启动');
    }
    
    // 显示配置对话框
    function showConfigDialog() {
        const dialog = document.createElement('div');
        dialog.id = 'config-dialog';
        dialog.innerHTML = `
            <div class="config-overlay">
                <div class="config-modal">
                    <h2>🔧 配置GitHub连接</h2>
                    <p>要使用Netlify编辑器，需要配置GitHub API访问权限：</p>
                    
                    <div class="config-form">
                        <div class="form-group">
                            <label>GitHub Personal Access Token:</label>
                            <input type="password" id="github-token" placeholder="ghp_xxxxxxxxxxxx">
                            <small>需要repo权限的GitHub Token</small>
                        </div>
                        
                        <div class="form-group">
                            <label>仓库所有者 (用户名或组织):</label>
                            <input type="text" id="repo-owner" placeholder="your-username">
                        </div>
                        
                        <div class="form-group">
                            <label>仓库名称:</label>
                            <input type="text" id="repo-name" placeholder="your-repo-name">
                        </div>
                        
                        <div class="form-group">
                            <label>分支名称:</label>
                            <input type="text" id="repo-branch" value="main" placeholder="main">
                        </div>
                    </div>
                    
                    <div class="config-buttons">
                        <button onclick="saveConfig()" class="btn-primary">保存配置</button>
                        <button onclick="showHelp()" class="btn-secondary">获取帮助</button>
                    </div>
                    
                    <div class="config-help">
                        <h3>📖 如何获取GitHub Token：</h3>
                        <ol>
                            <li>访问 <a href="https://github.com/settings/tokens" target="_blank">GitHub Settings > Developer settings > Personal access tokens</a></li>
                            <li>点击 "Generate new token (classic)"</li>
                            <li>选择 "repo" 权限</li>
                            <li>复制生成的token</li>
                        </ol>
                    </div>
                </div>
            </div>
        `;
        
        // 添加样式
        const style = document.createElement('style');
        style.textContent = `
            .config-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0,0,0,0.8);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }
            
            .config-modal {
                background: white;
                border-radius: 12px;
                padding: 30px;
                max-width: 500px;
                width: 90%;
                max-height: 80vh;
                overflow-y: auto;
            }
            
            .config-modal h2 {
                margin: 0 0 20px 0;
                color: #2c3e50;
            }
            
            .config-form {
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
                border-color: #3498db;
            }
            
            .form-group small {
                display: block;
                margin-top: 5px;
                color: #7f8c8d;
                font-size: 12px;
            }
            
            .config-buttons {
                display: flex;
                gap: 10px;
                margin: 20px 0;
            }
            
            .btn-primary, .btn-secondary {
                padding: 10px 20px;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-weight: 600;
                transition: all 0.3s;
            }
            
            .btn-primary {
                background: #3498db;
                color: white;
            }
            
            .btn-primary:hover {
                background: #2980b9;
            }
            
            .btn-secondary {
                background: #95a5a6;
                color: white;
            }
            
            .btn-secondary:hover {
                background: #7f8c8d;
            }
            
            .config-help {
                background: #f8f9fa;
                padding: 15px;
                border-radius: 6px;
                margin-top: 20px;
            }
            
            .config-help h3 {
                margin: 0 0 10px 0;
                color: #2c3e50;
                font-size: 16px;
            }
            
            .config-help ol {
                margin: 0;
                padding-left: 20px;
            }
            
            .config-help li {
                margin-bottom: 5px;
                color: #34495e;
            }
            
            .config-help a {
                color: #3498db;
                text-decoration: none;
            }
            
            .config-help a:hover {
                text-decoration: underline;
            }
        `;
        
        document.head.appendChild(style);
        document.body.appendChild(dialog);
    }
    
    // 保存配置
    window.saveConfig = function() {
        const token = document.getElementById('github-token').value.trim();
        const owner = document.getElementById('repo-owner').value.trim();
        const name = document.getElementById('repo-name').value.trim();
        const branch = document.getElementById('repo-branch').value.trim() || 'main';
        
        if (!token || !owner || !name) {
            alert('请填写所有必需的配置项');
            return;
        }
        
        // 保存配置
        CONFIG.GITHUB_TOKEN = token;
        CONFIG.REPO_OWNER = owner;
        CONFIG.REPO_NAME = name;
        CONFIG.BRANCH = branch;
        
        // 保存到localStorage
        localStorage.setItem('netlify-editor-config', JSON.stringify({
            owner: owner,
            name: name,
            branch: branch
        }));
        
        // 关闭对话框
        document.getElementById('config-dialog').remove();
        
        // 初始化编辑器
        createEditToolbar();
        createEditOverlay();
        bindEvents();
        testGitHubConnection();
        
        showSuccess('配置已保存，正在连接GitHub...');
    };
    
    // 显示帮助
    window.showHelp = function() {
        window.open('https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token', '_blank');
    };
    
    // 测试GitHub连接
    async function testGitHubConnection() {
        try {
            const response = await fetch(`https://api.github.com/repos/${CONFIG.REPO_OWNER}/${CONFIG.REPO_NAME}`, {
                headers: {
                    'Authorization': `token ${CONFIG.GITHUB_TOKEN}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            
            if (response.ok) {
                githubConnected = true;
                updateConnectionStatus(true);
                showSuccess('✅ GitHub连接成功！');
            } else {
                throw new Error(`HTTP ${response.status}`);
            }
        } catch (error) {
            githubConnected = false;
            updateConnectionStatus(false);
            showError('❌ GitHub连接失败: ' + error.message);
        }
    }
    
    // 更新连接状态
    function updateConnectionStatus(connected) {
        const statusElement = document.querySelector('.github-status');
        if (statusElement) {
            statusElement.className = `github-status ${connected ? 'connected' : 'disconnected'}`;
            statusElement.innerHTML = `
                <span class="status-dot"></span>
                <span class="status-text">${connected ? 'GitHub已连接' : 'GitHub未连接'}</span>
            `;
        }
    }

    // 创建编辑工具栏
    function createEditToolbar() {
        const toolbar = document.createElement('div');
        toolbar.id = 'netlify-toolbar';
        toolbar.innerHTML = `
            <div class="toolbar-content">
                <div class="toolbar-left">
                    <div class="github-status disconnected">
                        <span class="status-dot"></span>
                        <span class="status-text">检查连接中...</span>
                    </div>
                    <button id="toggle-edit-mode" class="toolbar-btn primary">
                        <span class="icon">✏️</span>
                        <span class="text">开始编辑</span>
                    </button>
                    <button id="save-to-github" class="toolbar-btn success" disabled>
                        <span class="icon">🚀</span>
                        <span class="text">发布到网站</span>
                    </button>
                    <button id="undo-change" class="toolbar-btn" disabled>
                        <span class="icon">↶</span>
                        <span class="text">撤销</span>
                    </button>
                </div>
                <div class="toolbar-right">
                    <button id="preview-changes" class="toolbar-btn">
                        <span class="icon">👁️</span>
                        <span class="text">预览</span>
                    </button>
                    <button id="reset-config" class="toolbar-btn">
                        <span class="icon">⚙️</span>
                        <span class="text">设置</span>
                    </button>
                    <button id="close-editor" class="toolbar-btn danger">
                        <span class="icon">✖️</span>
                        <span class="text">关闭</span>
                    </button>
                </div>
            </div>
        `;

        // 添加样式
        const style = document.createElement('style');
        style.textContent = `
            #netlify-toolbar {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                z-index: 10000;
                box-shadow: 0 2px 10px rgba(0,0,0,0.3);
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }

            .toolbar-content {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 12px 20px;
                max-width: 1200px;
                margin: 0 auto;
            }

            .toolbar-left, .toolbar-right {
                display: flex;
                gap: 12px;
                align-items: center;
            }

            .github-status {
                display: flex;
                align-items: center;
                gap: 6px;
                padding: 6px 12px;
                background: rgba(255,255,255,0.1);
                border-radius: 20px;
                font-size: 12px;
                font-weight: 500;
            }

            .status-dot {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: #e74c3c;
            }

            .github-status.connected .status-dot {
                background: #27ae60;
                animation: pulse 2s infinite;
            }

            @keyframes pulse {
                0% { opacity: 1; }
                50% { opacity: 0.5; }
                100% { opacity: 1; }
            }

            .toolbar-btn {
                display: flex;
                align-items: center;
                gap: 6px;
                padding: 8px 14px;
                background: rgba(255,255,255,0.1);
                border: 1px solid rgba(255,255,255,0.2);
                border-radius: 6px;
                color: white;
                cursor: pointer;
                transition: all 0.3s;
                font-size: 13px;
                font-weight: 500;
            }

            .toolbar-btn:hover:not(:disabled) {
                background: rgba(255,255,255,0.2);
                transform: translateY(-1px);
            }

            .toolbar-btn:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }

            .toolbar-btn.primary {
                background: #3498db;
                border-color: #2980b9;
            }

            .toolbar-btn.success {
                background: #27ae60;
                border-color: #229954;
            }

            .toolbar-btn.danger {
                background: #e74c3c;
                border-color: #c0392b;
            }

            .toolbar-btn .icon {
                font-size: 14px;
            }

            /* 编辑模式样式 */
            .netlify-edit-mode .editable-element {
                position: relative;
                cursor: pointer;
                transition: all 0.3s;
            }

            .netlify-edit-mode .editable-element:hover {
                background: rgba(52, 152, 219, 0.15) !important;
                outline: 2px dashed #3498db !important;
                outline-offset: 2px;
                box-shadow: 0 0 0 4px rgba(52, 152, 219, 0.1) !important;
            }

            .netlify-edit-mode .editable-element.editing {
                background: rgba(46, 204, 113, 0.15) !important;
                outline: 2px solid #2ecc71 !important;
                outline-offset: 2px;
                box-shadow: 0 0 0 4px rgba(46, 204, 113, 0.1) !important;
            }

            /* 编辑提示 */
            .edit-tooltip {
                position: absolute;
                top: -30px;
                left: 0;
                background: #3498db;
                color: white;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 11px;
                font-weight: 600;
                pointer-events: none;
                z-index: 10001;
                opacity: 0;
                transition: opacity 0.3s;
                white-space: nowrap;
            }

            .netlify-edit-mode .editable-element:hover .edit-tooltip {
                opacity: 1;
            }

            /* 内联编辑器 */
            .netlify-inline-editor {
                position: absolute;
                background: white;
                border: 3px solid #3498db;
                border-radius: 10px;
                padding: 20px;
                box-shadow: 0 15px 35px rgba(0,0,0,0.2);
                z-index: 10002;
                min-width: 350px;
                max-width: 600px;
            }

            .netlify-inline-editor .editor-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 15px;
                padding-bottom: 10px;
                border-bottom: 1px solid #ecf0f1;
            }

            .netlify-inline-editor .editor-title {
                font-weight: 600;
                color: #2c3e50;
                font-size: 14px;
            }

            .netlify-inline-editor .publish-note {
                font-size: 12px;
                color: #e74c3c;
                font-weight: 500;
            }

            .netlify-inline-editor textarea,
            .netlify-inline-editor input {
                width: 100%;
                padding: 12px;
                border: 2px solid #ecf0f1;
                border-radius: 6px;
                font-size: 14px;
                font-family: inherit;
                resize: vertical;
                min-height: 80px;
                transition: border-color 0.3s;
            }

            .netlify-inline-editor textarea:focus,
            .netlify-inline-editor input:focus {
                outline: none;
                border-color: #3498db;
            }

            .netlify-inline-editor .editor-buttons {
                display: flex;
                gap: 10px;
                margin-top: 15px;
                justify-content: flex-end;
            }

            .netlify-inline-editor .btn {
                padding: 8px 16px;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-size: 13px;
                font-weight: 600;
                transition: all 0.3s;
            }

            .netlify-inline-editor .btn-publish {
                background: #e74c3c;
                color: white;
            }

            .netlify-inline-editor .btn-publish:hover {
                background: #c0392b;
                transform: translateY(-1px);
            }

            .netlify-inline-editor .btn-cancel {
                background: #95a5a6;
                color: white;
            }

            .netlify-inline-editor .btn-cancel:hover {
                background: #7f8c8d;
            }

            /* 页面偏移 */
            body.netlify-editor-active {
                padding-top: 60px;
            }

            /* 响应式 */
            @media (max-width: 768px) {
                .toolbar-content {
                    flex-direction: column;
                    gap: 10px;
                    padding: 10px;
                }

                .toolbar-left, .toolbar-right {
                    flex-wrap: wrap;
                    justify-content: center;
                }

                .toolbar-btn .text {
                    display: none;
                }

                body.netlify-editor-active {
                    padding-top: 100px;
                }

                .netlify-inline-editor {
                    position: fixed !important;
                    top: 50% !important;
                    left: 50% !important;
                    transform: translate(-50%, -50%) !important;
                    width: 90% !important;
                    max-width: none !important;
                }
            }
        `;

        document.head.appendChild(style);
        document.body.appendChild(toolbar);
        document.body.classList.add('netlify-editor-active');
    }

    // 创建编辑覆盖层
    function createEditOverlay() {
        EDITABLE_SELECTORS.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
                if (!element.closest('#netlify-toolbar') &&
                    !element.closest('.netlify-inline-editor') &&
                    element.textContent.trim() !== '') {

                    element.classList.add('editable-element');
                    element.setAttribute('data-editable', 'true');
                    element.setAttribute('data-original-content', element.textContent);
                    element.setAttribute('data-selector', getElementSelector(element));

                    // 添加编辑提示
                    const tooltip = document.createElement('div');
                    tooltip.className = 'edit-tooltip';
                    tooltip.textContent = '点击编辑';
                    element.style.position = 'relative';
                    element.appendChild(tooltip);
                }
            });
        });
    }

    // 绑定事件
    function bindEvents() {
        document.getElementById('toggle-edit-mode').addEventListener('click', toggleEditMode);
        document.getElementById('save-to-github').addEventListener('click', saveToGitHub);
        document.getElementById('undo-change').addEventListener('click', undoChange);
        document.getElementById('preview-changes').addEventListener('click', previewChanges);
        document.getElementById('reset-config').addEventListener('click', resetConfig);
        document.getElementById('close-editor').addEventListener('click', closeEditor);

        document.addEventListener('click', handleElementClick);
        document.addEventListener('keydown', handleKeyboardShortcuts);
    }

    // 切换编辑模式
    function toggleEditMode() {
        if (!githubConnected) {
            showError('请先配置GitHub连接');
            return;
        }

        isEditMode = !isEditMode;
        const button = document.getElementById('toggle-edit-mode');
        const saveButton = document.getElementById('save-to-github');

        if (isEditMode) {
            document.body.classList.add('netlify-edit-mode');
            button.innerHTML = '<span class="icon">👁️</span><span class="text">退出编辑</span>';
            button.classList.remove('primary');
            button.classList.add('danger');
            saveButton.disabled = false;
            showSuccess('编辑模式已开启 - 点击任何文字开始编辑');
        } else {
            document.body.classList.remove('netlify-edit-mode');
            button.innerHTML = '<span class="icon">✏️</span><span class="text">开始编辑</span>';
            button.classList.remove('danger');
            button.classList.add('primary');
            closeInlineEditor();
            showSuccess('编辑模式已关闭');
        }
    }

    // 处理元素点击
    function handleElementClick(e) {
        if (!isEditMode) return;

        const element = e.target.closest('.editable-element');
        if (!element) return;

        e.preventDefault();
        e.stopPropagation();

        startInlineEdit(element);
    }

    // 开始内联编辑
    function startInlineEdit(element) {
        if (currentEditElement) {
            closeInlineEditor();
        }

        currentEditElement = element;
        element.classList.add('editing');

        const rect = element.getBoundingClientRect();
        const editor = createInlineEditor(element);

        // 定位编辑器
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

        editor.style.left = Math.min(rect.left + scrollLeft, window.innerWidth - 370) + 'px';
        editor.style.top = (rect.bottom + scrollTop + 15) + 'px';

        document.body.appendChild(editor);

        // 聚焦到输入框
        const input = editor.querySelector('textarea, input');
        input.focus();
        input.select();
    }

    // 创建内联编辑器
    function createInlineEditor(element) {
        const editor = document.createElement('div');
        editor.className = 'netlify-inline-editor';

        const isMultiline = element.tagName === 'P' || element.tagName === 'DIV' ||
                           element.textContent.length > 50;

        const inputType = isMultiline ? 'textarea' : 'input';
        const currentText = element.textContent || element.innerText;
        const elementType = element.tagName.toLowerCase();

        editor.innerHTML = `
            <div class="editor-header">
                <div class="editor-title">编辑 ${elementType.toUpperCase()} 元素</div>
                <div class="publish-note">将发布到线上网站</div>
            </div>
            <${inputType} id="netlify-input" placeholder="输入内容...">${currentText}</${inputType}>
            <div class="editor-buttons">
                <button class="btn btn-publish" onclick="publishToGitHub()">🚀 发布到网站</button>
                <button class="btn btn-cancel" onclick="cancelNetlifyEdit()">❌ 取消</button>
            </div>
        `;

        return editor;
    }

    // 发布到GitHub
    window.publishToGitHub = async function() {
        if (!currentEditElement || !githubConnected) return;

        const input = document.getElementById('netlify-input');
        const newContent = input.value.trim();
        const oldContent = currentEditElement.getAttribute('data-original-content');

        if (newContent === oldContent) {
            showSuccess('内容未更改');
            closeInlineEditor();
            return;
        }

        try {
            // 显示发布状态
            const publishBtn = document.querySelector('.btn-publish');
            const originalText = publishBtn.innerHTML;
            publishBtn.innerHTML = '🚀 发布中...';
            publishBtn.disabled = true;

            // 获取当前文件内容
            const fileContent = await getFileFromGitHub();

            // 替换内容
            const updatedContent = replaceContentInHTML(fileContent, oldContent, newContent);

            // 提交到GitHub
            await updateFileInGitHub(updatedContent, `更新内容: ${currentEditElement.tagName.toLowerCase()}`);

            // 更新页面元素
            currentEditElement.textContent = newContent;
            currentEditElement.setAttribute('data-original-content', newContent);

            // 添加到历史记录
            addToHistory({
                element: currentEditElement,
                oldContent: oldContent,
                newContent: newContent,
                timestamp: Date.now()
            });

            showSuccess('✅ 内容已发布到网站！Netlify将自动部署更新。');
            closeInlineEditor();

        } catch (error) {
            console.error('发布错误:', error);
            showError('发布失败: ' + error.message);

            // 恢复按钮状态
            const publishBtn = document.querySelector('.btn-publish');
            if (publishBtn) {
                publishBtn.innerHTML = originalText;
                publishBtn.disabled = false;
            }
        }
    };

    // 从GitHub获取文件内容
    async function getFileFromGitHub() {
        const response = await fetch(`https://api.github.com/repos/${CONFIG.REPO_OWNER}/${CONFIG.REPO_NAME}/contents/${CONFIG.FILE_PATH}?ref=${CONFIG.BRANCH}`, {
            headers: {
                'Authorization': `token ${CONFIG.GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        if (!response.ok) {
            throw new Error(`获取文件失败: ${response.status}`);
        }

        const data = await response.json();
        return atob(data.content); // 解码base64内容
    }

    // 更新GitHub文件
    async function updateFileInGitHub(content, message) {
        // 先获取文件的SHA值
        const fileResponse = await fetch(`https://api.github.com/repos/${CONFIG.REPO_OWNER}/${CONFIG.REPO_NAME}/contents/${CONFIG.FILE_PATH}?ref=${CONFIG.BRANCH}`, {
            headers: {
                'Authorization': `token ${CONFIG.GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        if (!fileResponse.ok) {
            throw new Error(`获取文件信息失败: ${fileResponse.status}`);
        }

        const fileData = await fileResponse.json();

        // 更新文件
        const updateResponse = await fetch(`https://api.github.com/repos/${CONFIG.REPO_OWNER}/${CONFIG.REPO_NAME}/contents/${CONFIG.FILE_PATH}`, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${CONFIG.GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: message,
                content: btoa(unescape(encodeURIComponent(content))), // 编码为base64
                sha: fileData.sha,
                branch: CONFIG.BRANCH
            })
        });

        if (!updateResponse.ok) {
            const errorData = await updateResponse.json();
            throw new Error(`更新文件失败: ${errorData.message || updateResponse.status}`);
        }

        return await updateResponse.json();
    }

    // 在HTML中替换内容
    function replaceContentInHTML(html, oldContent, newContent) {
        // 简单的文本替换
        // 注意：这是一个简化的实现，实际应用中可能需要更复杂的HTML解析
        return html.replace(oldContent, newContent);
    }

    // 取消编辑
    window.cancelNetlifyEdit = function() {
        closeInlineEditor();
    };

    // 关闭内联编辑器
    function closeInlineEditor() {
        const editor = document.querySelector('.netlify-inline-editor');
        if (editor) {
            editor.remove();
        }

        if (currentEditElement) {
            currentEditElement.classList.remove('editing');
            currentEditElement = null;
        }
    }

    // 批量保存到GitHub
    async function saveToGitHub() {
        if (!githubConnected) {
            showError('GitHub未连接');
            return;
        }

        try {
            const changes = getAllChanges();
            if (changes.length === 0) {
                showSuccess('没有需要保存的更改');
                return;
            }

            showSuccess('正在发布更改到GitHub...');

            // 获取当前文件内容
            let fileContent = await getFileFromGitHub();

            // 应用所有更改
            changes.forEach(change => {
                fileContent = replaceContentInHTML(fileContent, change.oldContent, change.newContent);
            });

            // 提交到GitHub
            await updateFileInGitHub(fileContent, `批量更新内容 (${changes.length}项更改)`);

            // 更新所有元素的原始内容
            changes.forEach(change => {
                const element = document.querySelector(`[data-selector="${change.selector}"]`);
                if (element) {
                    element.setAttribute('data-original-content', change.newContent);
                }
            });

            showSuccess(`✅ 已发布 ${changes.length} 项更改到网站！`);

        } catch (error) {
            console.error('批量保存错误:', error);
            showError('批量保存失败: ' + error.message);
        }
    }

    // 获取所有更改
    function getAllChanges() {
        const changes = [];
        document.querySelectorAll('.editable-element').forEach(element => {
            const original = element.getAttribute('data-original-content');
            const current = element.textContent;
            const selector = element.getAttribute('data-selector');

            if (original !== current) {
                changes.push({
                    selector: selector,
                    oldContent: original,
                    newContent: current
                });
            }
        });
        return changes;
    }

    // 获取元素选择器
    function getElementSelector(element) {
        if (element.id) return `#${element.id}`;

        let selector = element.tagName.toLowerCase();

        if (element.className) {
            const classes = element.className.split(' ').filter(c =>
                c && !c.includes('editable') && !c.includes('editing')
            );
            if (classes.length > 0) {
                selector += '.' + classes.join('.');
            }
        }

        let parent = element.parentElement;
        if (parent && parent.id) {
            selector = `#${parent.id} ${selector}`;
        } else if (parent && parent.className) {
            const parentClass = parent.className.split(' ')[0];
            if (parentClass && !parentClass.includes('editable')) {
                selector = `.${parentClass} ${selector}`;
            }
        }

        return selector;
    }

    // 添加到历史记录
    function addToHistory(change) {
        editHistory = editHistory.slice(0, historyIndex + 1);
        editHistory.push(change);
        historyIndex++;

        if (editHistory.length > 20) {
            editHistory.shift();
            historyIndex--;
        }

        document.getElementById('undo-change').disabled = historyIndex < 0;
    }

    // 撤销更改
    function undoChange() {
        if (historyIndex >= 0) {
            const change = editHistory[historyIndex];
            change.element.textContent = change.oldContent;
            change.element.setAttribute('data-original-content', change.oldContent);
            historyIndex--;
            document.getElementById('undo-change').disabled = historyIndex < 0;
            showSuccess('已撤销更改');
        }
    }

    // 预览更改
    function previewChanges() {
        const changes = getAllChanges();
        if (changes.length === 0) {
            showSuccess('没有更改可预览');
            return;
        }

        let preview = '即将发布的更改：\n\n';
        changes.forEach((change, index) => {
            preview += `${index + 1}. ${change.selector}\n`;
            preview += `   原内容: "${change.oldContent}"\n`;
            preview += `   新内容: "${change.newContent}"\n\n`;
        });

        alert(preview);
    }

    // 重置配置
    function resetConfig() {
        if (confirm('确定要重置GitHub配置吗？')) {
            localStorage.removeItem('netlify-editor-config');
            CONFIG.GITHUB_TOKEN = '';
            CONFIG.REPO_OWNER = '';
            CONFIG.REPO_NAME = '';
            githubConnected = false;
            updateConnectionStatus(false);
            showConfigDialog();
        }
    }

    // 关闭编辑器
    function closeEditor() {
        if (confirm('确定要关闭编辑器吗？未发布的更改将会丢失。')) {
            document.getElementById('netlify-toolbar').remove();
            document.body.classList.remove('netlify-editor-active', 'netlify-edit-mode');
            closeInlineEditor();

            document.querySelectorAll('.editable-element').forEach(element => {
                element.classList.remove('editable-element', 'editing');
                element.removeAttribute('data-editable');
                const tooltip = element.querySelector('.edit-tooltip');
                if (tooltip) tooltip.remove();
            });

            showSuccess('编辑器已关闭');
        }
    }

    // 键盘快捷键
    function handleKeyboardShortcuts(e) {
        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case 's':
                    e.preventDefault();
                    if (currentEditElement) {
                        publishToGitHub();
                    } else {
                        saveToGitHub();
                    }
                    break;
                case 'z':
                    e.preventDefault();
                    undoChange();
                    break;
                case 'e':
                    e.preventDefault();
                    toggleEditMode();
                    break;
            }
        }

        if (e.key === 'Escape') {
            if (currentEditElement) {
                closeInlineEditor();
            }
        }
    }

    // 显示成功消息
    function showSuccess(message) {
        showMessage(message, 'success');
    }

    // 显示错误消息
    function showError(message) {
        showMessage(message, 'error');
    }

    // 显示消息
    function showMessage(message, type = 'success') {
        const toast = document.createElement('div');
        const bgColor = type === 'success' ? '#27ae60' : '#e74c3c';
        const icon = type === 'success' ? '✅' : '❌';

        toast.innerHTML = `
            <div style="position: fixed; top: 80px; right: 20px; background: ${bgColor}; color: white;
                        padding: 15px 20px; border-radius: 8px; z-index: 10005;
                        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                        animation: slideInRight 0.3s; max-width: 350px; font-weight: 500;">
                ${icon} ${message}
            </div>
        `;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideOutRight 0.3s';
            setTimeout(() => toast.remove(), 300);
        }, 4000);
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

    // 加载保存的配置
    function loadSavedConfig() {
        const saved = localStorage.getItem('netlify-editor-config');
        if (saved) {
            try {
                const config = JSON.parse(saved);
                CONFIG.REPO_OWNER = config.owner;
                CONFIG.REPO_NAME = config.name;
                CONFIG.BRANCH = config.branch || 'main';
                return true;
            } catch (error) {
                console.warn('加载配置失败:', error);
            }
        }
        return false;
    }

    // 初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            if (loadSavedConfig()) {
                // 如果有保存的配置但没有token，提示用户输入
                if (!CONFIG.GITHUB_TOKEN) {
                    showConfigDialog();
                } else {
                    initNetlifyEditor();
                }
            } else {
                initNetlifyEditor();
            }
        });
    } else {
        if (loadSavedConfig()) {
            if (!CONFIG.GITHUB_TOKEN) {
                showConfigDialog();
            } else {
                initNetlifyEditor();
            }
        } else {
            initNetlifyEditor();
        }
    }

    // 暴露全局函数
    window.netlifyEditor = {
        toggle: toggleEditMode,
        save: saveToGitHub,
        close: closeEditor,
        config: showConfigDialog
    };

})();

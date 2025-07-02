/**
 * 一键部署编辑器 - 修改后直接部署到Netlify
 * One-Click Deploy Editor - Edit and deploy directly to Netlify
 */

(function() {
    'use strict';
    
    // 配置
    let deployConfig = {
        netlifyToken: '',
        siteId: '',
        githubToken: '',
        githubOwner: '',
        githubRepo: '',
        githubBranch: 'main'
    };
    
    let isEditMode = false;
    let changes = [];
    let isConnected = false;
    
    // 初始化一键编辑器
    function initOneClickEditor() {
        loadDeployConfig();
        createOneClickToolbar();
        if (deployConfig.netlifyToken || deployConfig.githubToken) {
            testConnection();
        }
        console.log('🚀 一键部署编辑器已启动');
    }
    
    // 创建一键编辑工具栏
    function createOneClickToolbar() {
        const toolbar = document.createElement('div');
        toolbar.id = 'oneclick-toolbar';
        toolbar.innerHTML = `
            <div class="oneclick-toolbar-content">
                <div class="toolbar-left">
                    <div class="deploy-status ${isConnected ? 'connected' : 'disconnected'}" id="deploy-status">
                        <span class="status-dot"></span>
                        <span class="status-text">检查连接中...</span>
                    </div>
                    <button id="start-oneclick-edit" class="oneclick-btn primary">
                        <span class="icon">🚀</span>
                        <span class="text">开始编辑</span>
                    </button>
                    <button id="deploy-now" class="oneclick-btn deploy" disabled>
                        <span class="icon">⚡</span>
                        <span class="text">一键部署</span>
                    </button>
                    <div class="deploy-count" id="deploy-count" style="display: none;">
                        准备部署 <span id="change-count">0</span> 项修改
                    </div>
                </div>
                <div class="toolbar-right">
                    <button id="setup-deploy" class="oneclick-btn">
                        <span class="icon">⚙️</span>
                        <span class="text">配置部署</span>
                    </button>
                    <button id="deploy-diagnostics" class="oneclick-btn" onclick="window.open('admin/deploy-diagnostics.html', '_blank')" title="诊断工具">
                        <span class="icon">🔧</span>
                        <span class="text">诊断</span>
                    </button>
                    <button id="close-oneclick-editor" class="oneclick-btn danger">
                        <span class="icon">✖️</span>
                        <span class="text">关闭</span>
                    </button>
                </div>
            </div>
            <div class="oneclick-hint" id="oneclick-hint" style="display: none;">
                🚀 一键部署模式：直接点击紫色文字输入新内容，修改完成后点击"一键部署"立即更新网站！
            </div>
        `;
        
        // 添加样式
        const style = document.createElement('style');
        style.textContent = `
            #oneclick-toolbar {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                background: linear-gradient(135deg, #8B5CF6 0%, #A855F7 50%, #C084FC 100%);
                color: white;
                z-index: 10000;
                box-shadow: 0 2px 20px rgba(139, 92, 246, 0.3);
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }
            
            .oneclick-toolbar-content {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 15px 20px;
                max-width: 1200px;
                margin: 0 auto;
            }
            
            .toolbar-left, .toolbar-right {
                display: flex;
                gap: 15px;
                align-items: center;
            }
            
            .deploy-status {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 8px 15px;
                background: rgba(255,255,255,0.15);
                border-radius: 25px;
                font-size: 12px;
                font-weight: 600;
            }
            
            .status-dot {
                width: 10px;
                height: 10px;
                border-radius: 50%;
                background: #ef4444;
            }
            
            .deploy-status.connected .status-dot {
                background: #10b981;
                animation: deployPulse 2s infinite;
            }
            
            @keyframes deployPulse {
                0% { opacity: 1; transform: scale(1); }
                50% { opacity: 0.7; transform: scale(1.2); }
                100% { opacity: 1; transform: scale(1); }
            }
            
            .oneclick-btn {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 12px 20px;
                background: rgba(255,255,255,0.2);
                border: 2px solid rgba(255,255,255,0.3);
                border-radius: 10px;
                color: white;
                cursor: pointer;
                transition: all 0.3s;
                font-size: 14px;
                font-weight: 600;
            }
            
            .oneclick-btn:hover:not(:disabled) {
                background: rgba(255,255,255,0.3);
                transform: translateY(-3px);
                box-shadow: 0 8px 25px rgba(0,0,0,0.2);
            }
            
            .oneclick-btn:disabled {
                opacity: 0.5;
                cursor: not-allowed;
                transform: none;
            }
            
            .oneclick-btn.primary {
                background: #3b82f6;
                border-color: #2563eb;
            }
            
            .oneclick-btn.deploy {
                background: linear-gradient(45deg, #f59e0b, #d97706);
                border-color: #b45309;
                animation: deployGlow 3s infinite;
                font-size: 16px;
                padding: 14px 24px;
            }
            
            @keyframes deployGlow {
                0% { box-shadow: 0 0 5px rgba(245, 158, 11, 0.5); }
                50% { box-shadow: 0 0 25px rgba(245, 158, 11, 0.8), 0 0 35px rgba(245, 158, 11, 0.6); }
                100% { box-shadow: 0 0 5px rgba(245, 158, 11, 0.5); }
            }
            
            .oneclick-btn.danger {
                background: #ef4444;
                border-color: #dc2626;
            }
            
            .oneclick-btn .icon {
                font-size: 16px;
            }
            
            .deploy-count {
                background: rgba(255,255,255,0.9);
                color: #7c3aed;
                padding: 8px 15px;
                border-radius: 20px;
                font-size: 13px;
                font-weight: 700;
                animation: bounce 0.6s;
            }
            
            @keyframes bounce {
                0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
                40% { transform: translateY(-8px); }
                60% { transform: translateY(-4px); }
            }
            
            .oneclick-hint {
                background: rgba(255,255,255,0.95);
                color: #7c3aed;
                padding: 12px 20px;
                text-align: center;
                font-weight: 600;
                font-size: 14px;
                animation: slideDown 0.4s;
            }
            
            @keyframes slideDown {
                from { height: 0; opacity: 0; }
                to { height: auto; opacity: 1; }
            }
            
            /* 一键编辑模式样式 */
            .oneclick-edit-mode [data-oneclick-editable] {
                background: linear-gradient(45deg, #DDD6FE, #C4B5FD) !important;
                border: 3px solid #8B5CF6 !important;
                border-radius: 8px !important;
                padding: 12px !important;
                cursor: text !important;
                transition: all 0.3s !important;
                position: relative !important;
                min-height: 40px !important;
                display: inline-block !important;
                box-shadow: 0 4px 15px rgba(139, 92, 246, 0.3) !important;
            }
            
            .oneclick-edit-mode [data-oneclick-editable]:hover {
                background: linear-gradient(45deg, #C4B5FD, #A78BFA) !important;
                border-color: #7C3AED !important;
                box-shadow: 0 6px 20px rgba(139, 92, 246, 0.4) !important;
                transform: scale(1.03) !important;
            }
            
            .oneclick-edit-mode [data-oneclick-editable]:focus {
                background: rgba(255, 255, 255, 0.95) !important;
                border-color: #10b981 !important;
                box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.3) !important;
                outline: none !important;
            }
            
            .oneclick-edit-mode [data-oneclick-editable]:empty:before {
                content: '点击输入文字...';
                color: #9ca3af;
                font-style: italic;
            }
            
            .oneclick-edit-mode [data-oneclick-editable].modified {
                background: linear-gradient(45deg, #D1FAE5, #A7F3D0) !important;
                border-color: #10b981 !important;
                animation: modifiedGlow 2s infinite alternate;
            }
            
            @keyframes modifiedGlow {
                from { box-shadow: 0 0 10px rgba(16, 185, 129, 0.5); }
                to { box-shadow: 0 0 20px rgba(16, 185, 129, 0.8); }
            }
            
            /* 编辑提示标签 */
            .edit-label {
                position: absolute;
                top: -35px;
                left: 0;
                background: #8B5CF6;
                color: white;
                padding: 5px 12px;
                border-radius: 6px;
                font-size: 11px;
                font-weight: 600;
                pointer-events: none;
                z-index: 10001;
                opacity: 0;
                transition: opacity 0.3s;
                white-space: nowrap;
            }
            
            .oneclick-edit-mode [data-oneclick-editable]:hover .edit-label {
                opacity: 1;
            }
            
            /* 页面偏移 */
            body.oneclick-editor-active {
                padding-top: 85px;
            }
            
            body.oneclick-editor-active.with-hint {
                padding-top: 135px;
            }
            
            /* 响应式 */
            @media (max-width: 768px) {
                .oneclick-toolbar-content {
                    flex-direction: column;
                    gap: 12px;
                    padding: 12px;
                }
                
                .toolbar-left, .toolbar-right {
                    flex-wrap: wrap;
                    justify-content: center;
                }
                
                .oneclick-btn .text {
                    display: none;
                }
                
                .oneclick-btn.deploy {
                    font-size: 14px;
                    padding: 12px 20px;
                }
                
                body.oneclick-editor-active {
                    padding-top: 150px;
                }
                
                body.oneclick-editor-active.with-hint {
                    padding-top: 190px;
                }
                
                .oneclick-hint {
                    font-size: 12px;
                    padding: 10px 15px;
                }
            }
        `;
        
        document.head.appendChild(style);
        document.body.appendChild(toolbar);
        document.body.classList.add('oneclick-editor-active');
        
        // 绑定事件
        bindOneClickEvents();
    }
    
    // 绑定事件
    function bindOneClickEvents() {
        document.getElementById('start-oneclick-edit').addEventListener('click', toggleOneClickEdit);
        document.getElementById('deploy-now').addEventListener('click', deployNow);
        document.getElementById('setup-deploy').addEventListener('click', showDeploySetup);
        document.getElementById('close-oneclick-editor').addEventListener('click', closeOneClickEditor);
    }

    // 切换一键编辑模式
    function toggleOneClickEdit() {
        if (!isConnected) {
            showMessage('请先配置部署连接！', 'error');
            showDeploySetup();
            return;
        }

        isEditMode = !isEditMode;
        const startBtn = document.getElementById('start-oneclick-edit');
        const deployBtn = document.getElementById('deploy-now');
        const hint = document.getElementById('oneclick-hint');

        if (isEditMode) {
            // 进入编辑模式
            document.body.classList.add('oneclick-edit-mode', 'with-hint');
            startBtn.innerHTML = '<span class="icon">👁️</span><span class="text">退出编辑</span>';
            startBtn.classList.remove('primary');
            startBtn.classList.add('danger');
            deployBtn.disabled = false;
            hint.style.display = 'block';

            // 让文字可编辑
            makeTextOneClickEditable();

            showMessage('🚀 一键编辑模式已开启！点击紫色文字直接输入新内容', 'success');

        } else {
            // 退出编辑模式
            document.body.classList.remove('oneclick-edit-mode', 'with-hint');
            startBtn.innerHTML = '<span class="icon">🚀</span><span class="text">开始编辑</span>';
            startBtn.classList.remove('danger');
            startBtn.classList.add('primary');
            hint.style.display = 'none';

            // 禁用编辑
            disableOneClickEditing();

            showMessage('👁️ 编辑模式已关闭', 'info');
        }
    }

    // 让文字一键可编辑
    function makeTextOneClickEditable() {
        // 选择所有文字元素
        const textElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, div, a, li, td, th, button');

        textElements.forEach(element => {
            // 跳过工具栏和特殊元素
            if (element.closest('#oneclick-toolbar') ||
                element.closest('script') ||
                element.closest('style') ||
                element.querySelector('img') ||
                element.querySelector('input') ||
                element.querySelector('select') ||
                element.querySelector('textarea') ||
                element.children.length > 1 ||
                element.textContent.trim() === '') {
                return;
            }

            // 只处理直接包含文字的元素
            if (element.children.length === 0 ||
                (element.children.length === 1 && element.children[0].tagName === 'BR')) {

                element.setAttribute('data-oneclick-editable', 'true');
                element.setAttribute('data-original-text', element.textContent);
                element.contentEditable = true;

                // 添加编辑标签
                element.style.position = 'relative';
                const label = document.createElement('div');
                label.className = 'edit-label';
                label.textContent = '点击输入文字';
                element.appendChild(label);

                // 绑定编辑事件
                element.addEventListener('input', handleOneClickInput);
                element.addEventListener('focus', handleOneClickFocus);
                element.addEventListener('blur', handleOneClickBlur);
            }
        });
    }

    // 禁用一键编辑
    function disableOneClickEditing() {
        document.querySelectorAll('[data-oneclick-editable]').forEach(element => {
            element.contentEditable = false;
            element.removeEventListener('input', handleOneClickInput);
            element.removeEventListener('focus', handleOneClickFocus);
            element.removeEventListener('blur', handleOneClickBlur);

            const label = element.querySelector('.edit-label');
            if (label) label.remove();

            element.style.position = '';
            element.classList.remove('modified');
        });
    }

    // 处理一键输入
    function handleOneClickInput(event) {
        const element = event.target;
        const originalText = element.getAttribute('data-original-text');
        const currentText = element.textContent;

        // 标记为已修改
        if (originalText !== currentText) {
            element.classList.add('modified');
            element.setAttribute('data-current-text', currentText);

            // 更新更改记录
            updateOneClickChanges(element, originalText, currentText);
        } else {
            element.classList.remove('modified');
            removeFromOneClickChanges(element);
        }

        // 更新计数器
        updateOneClickCount();
    }

    // 处理焦点
    function handleOneClickFocus(event) {
        const element = event.target;
        showMessage('📝 正在编辑: ' + element.tagName.toLowerCase(), 'info', 1000);
    }

    // 处理失焦
    function handleOneClickBlur(event) {
        // 可以在这里添加自动保存逻辑
    }

    // 更新一键更改记录
    function updateOneClickChanges(element, originalText, currentText) {
        // 查找是否已存在
        const existingIndex = changes.findIndex(change => change.element === element);

        if (existingIndex >= 0) {
            // 更新现有记录
            changes[existingIndex].currentText = currentText;
        } else {
            // 添加新记录
            changes.push({
                element: element,
                originalText: originalText,
                currentText: currentText,
                selector: getElementSelector(element)
            });
        }
    }

    // 从一键更改记录中移除
    function removeFromOneClickChanges(element) {
        const index = changes.findIndex(change => change.element === element);
        if (index >= 0) {
            changes.splice(index, 1);
        }
    }

    // 获取元素选择器
    function getElementSelector(element) {
        if (element.id) return `#${element.id}`;

        let selector = element.tagName.toLowerCase();

        if (element.className) {
            const classes = element.className.split(' ').filter(c =>
                c && !c.includes('modified') && !c.includes('oneclick')
            );
            if (classes.length > 0) {
                selector += '.' + classes.join('.');
            }
        }

        // 添加父元素信息
        let parent = element.parentElement;
        if (parent && parent.id) {
            selector = `#${parent.id} ${selector}`;
        } else if (parent && parent.className) {
            const parentClass = parent.className.split(' ')[0];
            if (parentClass && !parentClass.includes('oneclick')) {
                selector = `.${parentClass} ${selector}`;
            }
        }

        return selector;
    }

    // 更新一键计数
    function updateOneClickCount() {
        const countElement = document.getElementById('change-count');
        const deployCountElement = document.getElementById('deploy-count');
        const deployBtn = document.getElementById('deploy-now');

        if (changes.length > 0) {
            countElement.textContent = changes.length;
            deployCountElement.style.display = 'block';
            deployBtn.style.animation = 'deployGlow 2s infinite';
            deployBtn.innerHTML = '<span class="icon">⚡</span><span class="text">一键部署 (' + changes.length + ')</span>';
        } else {
            deployCountElement.style.display = 'none';
            deployBtn.style.animation = 'deployGlow 3s infinite';
            deployBtn.innerHTML = '<span class="icon">⚡</span><span class="text">一键部署</span>';
        }
    }

    // 一键部署
    async function deployNow() {
        if (changes.length === 0) {
            showMessage('没有需要部署的更改', 'info');
            return;
        }

        // 诊断配置
        if (!diagnoseDeploy()) {
            showDeploySetup();
            return;
        }

        if (!isConnected) {
            showMessage('部署服务未连接！请检查配置', 'error');
            showDeploySetup();
            return;
        }

        try {
            const deployBtn = document.getElementById('deploy-now');
            const originalText = deployBtn.innerHTML;
            deployBtn.innerHTML = '<span class="icon">🚀</span><span class="text">部署中...</span>';
            deployBtn.disabled = true;

            showMessage('🚀 开始部署...', 'info');

            // 获取当前HTML
            const currentHTML = document.documentElement.outerHTML;

            // 清理HTML
            const cleanHTML = cleanHTMLForDeploy(currentHTML);

            // 选择部署方式
            if (deployConfig.netlifyToken && deployConfig.siteId) {
                // 使用Netlify API部署
                await deployToNetlify(cleanHTML);
            } else if (deployConfig.githubToken) {
                // 使用GitHub API部署
                await deployToGitHub(cleanHTML);
            } else {
                throw new Error('未配置有效的部署方式');
            }

            // 重置状态
            deployBtn.innerHTML = originalText;
            deployBtn.disabled = false;

            // 清空更改记录
            changes.forEach(change => {
                change.element.setAttribute('data-original-text', change.currentText);
                change.element.classList.remove('modified');
            });
            changes = [];
            updateOneClickCount();

            showMessage('🎉 部署成功！网站已更新，请等待1-3分钟生效。', 'success', 5000);

        } catch (error) {
            console.error('部署错误:', error);
            showMessage('部署失败: ' + error.message, 'error');

            const deployBtn = document.getElementById('deploy-now');
            deployBtn.innerHTML = '<span class="icon">⚡</span><span class="text">一键部署</span>';
            deployBtn.disabled = false;
        }
    }

    // 部署到Netlify
    async function deployToNetlify(html) {
        try {
            showMessage('📤 正在上传到Netlify...', 'info');

            // 方法1: 尝试使用文件上传API
            try {
                const formData = new FormData();
                const blob = new Blob([html], { type: 'text/html' });
                formData.append('index.html', blob, 'index.html');

                const response = await fetch(`https://api.netlify.com/api/v1/sites/${deployConfig.siteId}/deploys`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${deployConfig.netlifyToken}`
                    },
                    body: formData
                });

                if (response.ok) {
                    const deployData = await response.json();
                    console.log('Netlify部署成功:', deployData);
                    return deployData;
                }

                throw new Error(`HTTP ${response.status}: ${response.statusText}`);

            } catch (error) {
                console.warn('文件上传方式失败，尝试其他方式:', error);

                // 方法2: 使用简化的部署API
                const deployResponse = await fetch(`https://api.netlify.com/api/v1/sites/${deployConfig.siteId}/deploys`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${deployConfig.netlifyToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        files: {
                            'index.html': html
                        }
                    })
                });

                if (!deployResponse.ok) {
                    const errorText = await deployResponse.text();
                    throw new Error(`Netlify API错误 ${deployResponse.status}: ${errorText}`);
                }

                const deployData = await deployResponse.json();
                console.log('Netlify部署成功:', deployData);
                return deployData;
            }

        } catch (error) {
            console.error('Netlify部署详细错误:', error);

            // 提供详细的错误信息和解决方案
            let errorMessage = '部署失败: ';
            let solution = '';

            if (error.message.includes('401') || error.message.includes('Unauthorized')) {
                errorMessage += 'Token无效或已过期';
                solution = '请检查Netlify Token是否正确，或重新生成Token';
            } else if (error.message.includes('404') || error.message.includes('Not Found')) {
                errorMessage += 'Site ID不存在';
                solution = '请检查Site ID是否正确';
            } else if (error.message.includes('403') || error.message.includes('Forbidden')) {
                errorMessage += 'Token权限不足';
                solution = '请确保Token有部署权限';
            } else if (error.message.includes('429')) {
                errorMessage += 'API调用频率过高';
                solution = '请稍等几分钟后重试';
            } else {
                errorMessage += error.message;
                solution = '请尝试使用GitHub部署方式，或检查网络连接';
            }

            // 显示详细错误和解决方案
            showDeployError(errorMessage, solution);
            throw new Error(errorMessage);
        }
    }

    // 部署到GitHub
    async function deployToGitHub(html) {
        try {
            showMessage('📤 正在提交到GitHub...', 'info');

            // 获取文件信息
            const fileResponse = await fetch(`https://api.github.com/repos/${deployConfig.githubOwner}/${deployConfig.githubRepo}/contents/index.html?ref=${deployConfig.githubBranch}`, {
                headers: {
                    'Authorization': `token ${deployConfig.githubToken}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            if (!fileResponse.ok) {
                const errorText = await fileResponse.text();
                throw new Error(`获取文件信息失败 ${fileResponse.status}: ${errorText}`);
            }

            const fileData = await fileResponse.json();

            // 编码HTML内容
            let encodedContent;
            try {
                encodedContent = btoa(unescape(encodeURIComponent(html)));
            } catch (encodeError) {
                // 如果编码失败，尝试简单的base64编码
                encodedContent = btoa(html);
            }

            // 更新文件
            const updateResponse = await fetch(`https://api.github.com/repos/${deployConfig.githubOwner}/${deployConfig.githubRepo}/contents/index.html`, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${deployConfig.githubToken}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: `一键部署更新: ${changes.length}项修改 - ${new Date().toLocaleString()}`,
                    content: encodedContent,
                    sha: fileData.sha,
                    branch: deployConfig.githubBranch
                })
            });

            if (!updateResponse.ok) {
                const errorData = await updateResponse.json();
                throw new Error(`GitHub更新失败 ${updateResponse.status}: ${errorData.message || errorData.errors?.[0]?.message || 'Unknown error'}`);
            }

            const result = await updateResponse.json();
            console.log('GitHub部署成功:', result);

            showMessage('✅ GitHub提交成功，Netlify将自动部署...', 'success');
            return result;

        } catch (error) {
            console.error('GitHub部署详细错误:', error);

            // 提供详细的错误信息和解决方案
            let errorMessage = 'GitHub部署失败: ';
            let solution = '';

            if (error.message.includes('401') || error.message.includes('Bad credentials')) {
                errorMessage += 'GitHub Token无效';
                solution = '请检查GitHub Token是否正确，确保Token有repo权限';
            } else if (error.message.includes('404')) {
                errorMessage += '仓库不存在或无权限访问';
                solution = '请检查仓库所有者和仓库名称是否正确';
            } else if (error.message.includes('403')) {
                errorMessage += 'Token权限不足';
                solution = '请确保Token有repo权限，或检查仓库是否为私有仓库';
            } else if (error.message.includes('409')) {
                errorMessage += '文件冲突';
                solution = '请刷新页面重新尝试，或检查是否有其他人同时在修改';
            } else if (error.message.includes('422')) {
                errorMessage += '请求格式错误';
                solution = '请检查分支名称是否正确';
            } else {
                errorMessage += error.message;
                solution = '请检查网络连接，或尝试使用Netlify直接部署';
            }

            // 显示详细错误和解决方案
            showDeployError(errorMessage, solution);
            throw new Error(errorMessage);
        }
    }

    // 创建ZIP文件（简化版）
    function createZipFromFiles(files) {
        // 这里使用简化的方式，实际项目中可能需要使用JSZip库
        // 目前先返回HTML内容，Netlify也支持直接上传HTML
        return files['index.html'];
    }

    // 清理HTML用于部署
    function cleanHTMLForDeploy(html) {
        // 创建临时DOM
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        // 移除编辑器工具栏
        const toolbar = doc.querySelector('#oneclick-toolbar');
        if (toolbar) toolbar.remove();

        // 移除编辑器相关的类
        doc.body.classList.remove('oneclick-editor-active', 'oneclick-edit-mode', 'with-hint');

        // 清理所有可编辑元素
        doc.querySelectorAll('[data-oneclick-editable]').forEach(element => {
            element.removeAttribute('data-oneclick-editable');
            element.removeAttribute('data-original-text');
            element.removeAttribute('data-current-text');
            element.removeAttribute('contenteditable');
            element.classList.remove('modified');
            element.style.position = '';

            // 移除编辑标签
            const label = element.querySelector('.edit-label');
            if (label) label.remove();
        });

        // 移除编辑器样式
        doc.querySelectorAll('style').forEach(style => {
            if (style.textContent.includes('oneclick-toolbar') ||
                style.textContent.includes('oneclick-edit-mode')) {
                style.remove();
            }
        });

        // 移除编辑器脚本
        doc.querySelectorAll('script').forEach(script => {
            if (script.src && script.src.includes('one-click-editor.js')) {
                script.remove();
            }
        });

        return '<!DOCTYPE html>\n' + doc.documentElement.outerHTML;
    }

    // 测试连接
    async function testConnection() {
        if (!deployConfig.netlifyToken && !deployConfig.githubToken) {
            updateDeployStatus(false, '未配置');
            return;
        }

        try {
            let connected = false;

            // 测试Netlify连接
            if (deployConfig.netlifyToken && deployConfig.siteId) {
                const netlifyResponse = await fetch(`https://api.netlify.com/api/v1/sites/${deployConfig.siteId}`, {
                    headers: {
                        'Authorization': `Bearer ${deployConfig.netlifyToken}`
                    }
                });
                connected = netlifyResponse.ok;
            }

            // 测试GitHub连接
            if (!connected && deployConfig.githubToken) {
                const githubResponse = await fetch(`https://api.github.com/repos/${deployConfig.githubOwner}/${deployConfig.githubRepo}`, {
                    headers: {
                        'Authorization': `token ${deployConfig.githubToken}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                });
                connected = githubResponse.ok;
            }

            if (connected) {
                isConnected = true;
                updateDeployStatus(true, '部署服务已连接');
                showMessage('✅ 部署服务连接成功！', 'success');
            } else {
                throw new Error('连接测试失败');
            }
        } catch (error) {
            isConnected = false;
            updateDeployStatus(false, '连接失败');
            showMessage('❌ 部署服务连接失败: ' + error.message, 'error');
        }
    }

    // 更新部署状态
    function updateDeployStatus(connected, text) {
        const statusElement = document.getElementById('deploy-status');
        if (statusElement) {
            statusElement.className = `deploy-status ${connected ? 'connected' : 'disconnected'}`;
            statusElement.querySelector('.status-text').textContent = text;
        }
    }

    // 显示部署配置
    function showDeploySetup() {
        const dialog = document.createElement('div');
        dialog.id = 'deploy-setup-dialog';
        dialog.innerHTML = `
            <div class="deploy-setup-overlay">
                <div class="deploy-setup-modal">
                    <h2>🚀 一键部署配置</h2>
                    <p>配置部署服务以实现一键部署到网站：</p>

                    <div class="deploy-tabs">
                        <button class="tab-btn active" onclick="showNetlifyTab()">Netlify部署</button>
                        <button class="tab-btn" onclick="showGitHubTab()">GitHub部署</button>
                    </div>

                    <div id="netlify-tab" class="tab-content active">
                        <h3>🌐 Netlify直接部署（推荐）</h3>
                        <div class="deploy-form">
                            <div class="form-group">
                                <label>Netlify Personal Access Token:</label>
                                <input type="password" id="netlify-token" placeholder="nfp_xxxxxxxxxxxx" value="${deployConfig.netlifyToken}">
                                <small>在Netlify User Settings > Personal access tokens中获取</small>
                            </div>

                            <div class="form-group">
                                <label>Site ID:</label>
                                <input type="text" id="site-id" placeholder="your-site-id" value="${deployConfig.siteId}">
                                <small>在Netlify Site Settings > General中找到</small>
                            </div>
                        </div>
                    </div>

                    <div id="github-tab" class="tab-content">
                        <h3>📁 GitHub部署（通过Netlify自动部署）</h3>
                        <div class="deploy-form">
                            <div class="form-group">
                                <label>GitHub Personal Access Token:</label>
                                <input type="password" id="github-token" placeholder="ghp_xxxxxxxxxxxx" value="${deployConfig.githubToken}">
                                <small>需要repo权限的GitHub Token</small>
                            </div>

                            <div class="form-group">
                                <label>仓库所有者:</label>
                                <input type="text" id="github-owner" placeholder="your-username" value="${deployConfig.githubOwner}">
                            </div>

                            <div class="form-group">
                                <label>仓库名称:</label>
                                <input type="text" id="github-repo" placeholder="your-repo-name" value="${deployConfig.githubRepo}">
                            </div>

                            <div class="form-group">
                                <label>分支名称:</label>
                                <input type="text" id="github-branch" placeholder="main" value="${deployConfig.githubBranch}">
                            </div>
                        </div>
                    </div>

                    <div class="deploy-buttons">
                        <button onclick="saveDeployConfig()" class="deploy-setup-btn primary">保存并测试连接</button>
                        <button onclick="closeDeploySetup()" class="deploy-setup-btn">取消</button>
                    </div>

                    <div class="deploy-help">
                        <h3>📖 获取Token指南：</h3>
                        <div class="help-tabs">
                            <div class="help-section">
                                <h4>Netlify Token:</h4>
                                <ol>
                                    <li>登录 <a href="https://app.netlify.com" target="_blank">Netlify</a></li>
                                    <li>点击头像 > User settings</li>
                                    <li>选择 Personal access tokens</li>
                                    <li>点击 New access token</li>
                                    <li>复制生成的token</li>
                                </ol>
                            </div>
                            <div class="help-section">
                                <h4>GitHub Token:</h4>
                                <ol>
                                    <li>访问 <a href="https://github.com/settings/tokens" target="_blank">GitHub Settings</a></li>
                                    <li>点击 Generate new token (classic)</li>
                                    <li>选择 repo 权限</li>
                                    <li>复制生成的token</li>
                                </ol>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // 添加配置对话框样式
        const setupStyle = document.createElement('style');
        setupStyle.textContent = `
            .deploy-setup-overlay {
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

            .deploy-setup-modal {
                background: white;
                border-radius: 15px;
                padding: 30px;
                max-width: 600px;
                width: 90%;
                max-height: 85vh;
                overflow-y: auto;
                box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            }

            .deploy-setup-modal h2 {
                margin: 0 0 20px 0;
                color: #7c3aed;
                text-align: center;
            }

            .deploy-tabs {
                display: flex;
                gap: 10px;
                margin: 20px 0;
                border-bottom: 2px solid #f3f4f6;
            }

            .tab-btn {
                padding: 10px 20px;
                border: none;
                background: none;
                cursor: pointer;
                font-weight: 600;
                color: #6b7280;
                border-bottom: 3px solid transparent;
                transition: all 0.3s;
            }

            .tab-btn.active {
                color: #7c3aed;
                border-bottom-color: #7c3aed;
            }

            .tab-content {
                display: none;
                margin: 20px 0;
            }

            .tab-content.active {
                display: block;
            }

            .tab-content h3 {
                margin: 0 0 15px 0;
                color: #374151;
            }

            .deploy-form {
                margin: 20px 0;
            }

            .form-group {
                margin-bottom: 20px;
            }

            .form-group label {
                display: block;
                margin-bottom: 5px;
                font-weight: 600;
                color: #374151;
            }

            .form-group input {
                width: 100%;
                padding: 12px;
                border: 2px solid #e5e7eb;
                border-radius: 8px;
                font-size: 14px;
                box-sizing: border-box;
                transition: border-color 0.3s;
            }

            .form-group input:focus {
                outline: none;
                border-color: #7c3aed;
                box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1);
            }

            .form-group small {
                display: block;
                margin-top: 5px;
                color: #6b7280;
                font-size: 12px;
            }

            .deploy-buttons {
                display: flex;
                gap: 15px;
                margin: 30px 0 20px 0;
                justify-content: center;
            }

            .deploy-setup-btn {
                padding: 12px 24px;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                font-weight: 600;
                transition: all 0.3s;
                font-size: 14px;
            }

            .deploy-setup-btn.primary {
                background: linear-gradient(45deg, #7c3aed, #8b5cf6);
                color: white;
            }

            .deploy-setup-btn.primary:hover {
                background: linear-gradient(45deg, #6d28d9, #7c3aed);
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(124, 58, 237, 0.3);
            }

            .deploy-setup-btn {
                background: #e5e7eb;
                color: #374151;
            }

            .deploy-setup-btn:hover {
                background: #d1d5db;
            }

            .deploy-help {
                background: #f9fafb;
                padding: 20px;
                border-radius: 10px;
                margin-top: 20px;
            }

            .deploy-help h3 {
                margin: 0 0 15px 0;
                color: #374151;
                font-size: 16px;
            }

            .help-section {
                margin-bottom: 20px;
            }

            .help-section h4 {
                margin: 0 0 10px 0;
                color: #7c3aed;
                font-size: 14px;
            }

            .help-section ol {
                margin: 0;
                padding-left: 20px;
            }

            .help-section li {
                margin-bottom: 5px;
                color: #4b5563;
                font-size: 13px;
            }

            .help-section a {
                color: #7c3aed;
                text-decoration: none;
            }

            .help-section a:hover {
                text-decoration: underline;
            }
        `;

        document.head.appendChild(setupStyle);
        document.body.appendChild(dialog);
    }

    // 显示Netlify标签页
    window.showNetlifyTab = function() {
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

        document.querySelector('.tab-btn').classList.add('active');
        document.getElementById('netlify-tab').classList.add('active');
    };

    // 显示GitHub标签页
    window.showGitHubTab = function() {
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

        document.querySelectorAll('.tab-btn')[1].classList.add('active');
        document.getElementById('github-tab').classList.add('active');
    };

    // 保存部署配置
    window.saveDeployConfig = async function() {
        // 获取当前活跃的标签页
        const isNetlifyTab = document.getElementById('netlify-tab').classList.contains('active');

        if (isNetlifyTab) {
            // Netlify配置
            const netlifyToken = document.getElementById('netlify-token').value.trim();
            const siteId = document.getElementById('site-id').value.trim();

            if (!netlifyToken || !siteId) {
                alert('请填写Netlify Token和Site ID');
                return;
            }

            deployConfig.netlifyToken = netlifyToken;
            deployConfig.siteId = siteId;

            // 清空GitHub配置
            deployConfig.githubToken = '';
            deployConfig.githubOwner = '';
            deployConfig.githubRepo = '';

        } else {
            // GitHub配置
            const githubToken = document.getElementById('github-token').value.trim();
            const githubOwner = document.getElementById('github-owner').value.trim();
            const githubRepo = document.getElementById('github-repo').value.trim();
            const githubBranch = document.getElementById('github-branch').value.trim() || 'main';

            if (!githubToken || !githubOwner || !githubRepo) {
                alert('请填写所有GitHub配置项');
                return;
            }

            deployConfig.githubToken = githubToken;
            deployConfig.githubOwner = githubOwner;
            deployConfig.githubRepo = githubRepo;
            deployConfig.githubBranch = githubBranch;

            // 清空Netlify配置
            deployConfig.netlifyToken = '';
            deployConfig.siteId = '';
        }

        // 保存到localStorage（不包含敏感信息）
        localStorage.setItem('oneclick-deploy-config', JSON.stringify({
            siteId: deployConfig.siteId,
            githubOwner: deployConfig.githubOwner,
            githubRepo: deployConfig.githubRepo,
            githubBranch: deployConfig.githubBranch
        }));

        // 关闭对话框
        closeDeploySetup();

        // 测试连接
        showMessage('正在测试部署连接...', 'info');
        await testConnection();
    };

    // 关闭部署配置
    window.closeDeploySetup = function() {
        const dialog = document.getElementById('deploy-setup-dialog');
        if (dialog) dialog.remove();
    };

    // 加载部署配置
    function loadDeployConfig() {
        const saved = localStorage.getItem('oneclick-deploy-config');
        if (saved) {
            try {
                const config = JSON.parse(saved);
                deployConfig.siteId = config.siteId || '';
                deployConfig.githubOwner = config.githubOwner || '';
                deployConfig.githubRepo = config.githubRepo || '';
                deployConfig.githubBranch = config.githubBranch || 'main';
            } catch (error) {
                console.warn('加载部署配置失败:', error);
            }
        }
    }

    // 关闭一键编辑器
    function closeOneClickEditor() {
        if (changes.length > 0) {
            if (!confirm(`你有 ${changes.length} 项未部署的更改，确定要关闭编辑器吗？`)) {
                return;
            }
        }

        // 移除工具栏
        document.getElementById('oneclick-toolbar').remove();
        document.body.classList.remove('oneclick-editor-active', 'oneclick-edit-mode', 'with-hint');

        // 清理编辑状态
        disableOneClickEditing();

        showMessage('一键部署编辑器已关闭', 'info');
    }

    // 显示消息
    function showMessage(message, type = 'success', duration = 3000) {
        const colors = {
            success: '#10b981',
            error: '#ef4444',
            info: '#3b82f6',
            warning: '#f59e0b'
        };

        // 错误消息显示更长时间
        if (type === 'error') duration = 8000;

        const toast = document.createElement('div');
        toast.innerHTML = `
            <div style="position: fixed; top: 110px; right: 20px; background: ${colors[type]}; color: white;
                        padding: 15px 20px; border-radius: 10px; z-index: 10005;
                        box-shadow: 0 6px 20px rgba(0,0,0,0.2);
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

    // 显示详细错误信息
    function showDeployError(errorMessage, solution) {
        // 移除之前的错误弹窗
        const existingError = document.getElementById('deploy-error-modal');
        if (existingError) {
            existingError.remove();
        }

        const errorModal = document.createElement('div');
        errorModal.id = 'deploy-error-modal';
        errorModal.innerHTML = `
            <div style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.7);
                z-index: 20000;
                display: flex;
                align-items: center;
                justify-content: center;
            ">
                <div style="
                    background: white;
                    padding: 30px;
                    border-radius: 10px;
                    max-width: 500px;
                    width: 90%;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                ">
                    <h3 style="color: #ef4444; margin-top: 0;">🚫 部署失败</h3>
                    <p style="color: #333; margin: 15px 0;"><strong>错误原因:</strong><br>${errorMessage}</p>
                    <p style="color: #666; margin: 15px 0;"><strong>解决方案:</strong><br>${solution}</p>

                    <div style="margin-top: 25px; text-align: center;">
                        <button onclick="this.closest('#deploy-error-modal').remove()" style="
                            background: #3b82f6;
                            color: white;
                            border: none;
                            padding: 10px 20px;
                            border-radius: 5px;
                            cursor: pointer;
                            margin-right: 10px;
                        ">确定</button>

                        <button onclick="showDeploySetup(); this.closest('#deploy-error-modal').remove();" style="
                            background: #10b981;
                            color: white;
                            border: none;
                            padding: 10px 20px;
                            border-radius: 5px;
                            cursor: pointer;
                            margin-right: 10px;
                        ">重新配置</button>

                        <button onclick="window.open('admin/deploy-diagnostics.html', '_blank'); this.closest('#deploy-error-modal').remove();" style="
                            background: #f59e0b;
                            color: white;
                            border: none;
                            padding: 10px 20px;
                            border-radius: 5px;
                            cursor: pointer;
                        ">诊断工具</button>
                    </div>

                    <div style="margin-top: 20px; padding: 15px; background: #f5f5f5; border-radius: 5px; font-size: 12px; color: #666;">
                        <strong>常见问题:</strong><br>
                        • Token过期: 重新生成Token<br>
                        • 权限不足: 确保Token有repo权限<br>
                        • 网络问题: 检查网络连接<br>
                        • 配置错误: 检查仓库名称和分支
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(errorModal);
    }

    // 诊断部署配置
    function diagnoseDeploy() {
        const issues = [];

        if (!deployConfig.githubToken) {
            issues.push('❌ 缺少GitHub Token');
        } else if (deployConfig.githubToken.length < 20) {
            issues.push('⚠️ GitHub Token格式可能不正确');
        }

        if (!deployConfig.githubOwner) {
            issues.push('❌ 缺少GitHub用户名');
        }

        if (!deployConfig.githubRepo) {
            issues.push('❌ 缺少GitHub仓库名');
        }

        if (!deployConfig.githubBranch) {
            issues.push('❌ 缺少GitHub分支名');
        }

        if (!deployConfig.netlifyToken && !deployConfig.siteId) {
            issues.push('⚠️ 未配置Netlify（可选）');
        }

        if (issues.length > 0) {
            showMessage(`配置问题: ${issues.join(', ')}`, 'warning');
            return false;
        }

        showMessage('✅ 配置检查通过', 'success');
        return true;
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
        document.addEventListener('DOMContentLoaded', initOneClickEditor);
    } else {
        initOneClickEditor();
    }

    // 暴露全局函数
    window.oneClickEditor = {
        toggle: toggleOneClickEdit,
        deploy: deployNow,
        setup: showDeploySetup,
        close: closeOneClickEditor
    };

})();

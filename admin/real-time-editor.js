/**
 * 实时网站编辑器 - 直接修改源文件版本
 * Real-time Website Editor - Direct File Modification Version
 */

(function() {
    'use strict';
    
    // 配置
    const CONFIG = {
        API_BASE: 'http://localhost:3001/api',
        CURRENT_FILE: 'index.html',
        AUTO_SAVE: true,
        SAVE_DELAY: 1000 // 1秒后自动保存
    };
    
    let isEditMode = false;
    let currentEditElement = null;
    let editHistory = [];
    let historyIndex = -1;
    let saveTimeout = null;
    let serverAvailable = false;
    
    // 可编辑元素选择器
    const EDITABLE_SELECTORS = [
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'p', 'span:not(.icon)', 'div.slide-text h2', 'div.slide-text p',
        '.service_item_title div', '.service-overlay h4', '.service-overlay p',
        '.author-name', '.author-title', '.news-date',
        'a[href^="mailto:"] span', 'a[href^="tel:"] span'
    ];
    
    // 初始化编辑器
    function initRealTimeEditor() {
        checkServerStatus().then(() => {
            createEditToolbar();
            createEditOverlay();
            bindEvents();
            console.log('🎨 实时编辑器已启动');
        }).catch(() => {
            showError('无法连接到编辑服务器，请先启动服务器');
        });
    }
    
    // 检查服务器状态
    async function checkServerStatus() {
        try {
            const response = await fetch(`${CONFIG.API_BASE}/health`);
            const data = await response.json();
            if (data.success) {
                serverAvailable = true;
                console.log('✅ 编辑服务器连接成功');
                return true;
            }
        } catch (error) {
            console.error('❌ 编辑服务器连接失败:', error);
            serverAvailable = false;
            throw error;
        }
    }
    
    // 创建编辑工具栏
    function createEditToolbar() {
        const toolbar = document.createElement('div');
        toolbar.id = 'real-time-toolbar';
        toolbar.innerHTML = `
            <div class="toolbar-content">
                <div class="toolbar-left">
                    <div class="server-status ${serverAvailable ? 'online' : 'offline'}">
                        <span class="status-dot"></span>
                        <span class="status-text">${serverAvailable ? '服务器在线' : '服务器离线'}</span>
                    </div>
                    <button id="toggle-edit-mode" class="toolbar-btn primary">
                        <span class="icon">✏️</span>
                        <span class="text">开始编辑</span>
                    </button>
                    <button id="save-to-file" class="toolbar-btn success" disabled>
                        <span class="icon">💾</span>
                        <span class="text">保存到文件</span>
                    </button>
                    <button id="undo-change" class="toolbar-btn" disabled>
                        <span class="icon">↶</span>
                        <span class="text">撤销</span>
                    </button>
                </div>
                <div class="toolbar-right">
                    <button id="view-backups" class="toolbar-btn">
                        <span class="icon">📋</span>
                        <span class="text">备份</span>
                    </button>
                    <button id="refresh-page" class="toolbar-btn">
                        <span class="icon">🔄</span>
                        <span class="text">刷新</span>
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
            #real-time-toolbar {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
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
            
            .server-status {
                display: flex;
                align-items: center;
                gap: 6px;
                padding: 6px 10px;
                background: rgba(255,255,255,0.1);
                border-radius: 20px;
                font-size: 12px;
            }
            
            .status-dot {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: #e74c3c;
            }
            
            .server-status.online .status-dot {
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
            .real-time-edit-mode .editable-element {
                position: relative;
                cursor: pointer;
                transition: all 0.3s;
            }
            
            .real-time-edit-mode .editable-element:hover {
                background: rgba(52, 152, 219, 0.15) !important;
                outline: 2px dashed #3498db !important;
                outline-offset: 2px;
                box-shadow: 0 0 0 4px rgba(52, 152, 219, 0.1) !important;
            }
            
            .real-time-edit-mode .editable-element.editing {
                background: rgba(46, 204, 113, 0.15) !important;
                outline: 2px solid #2ecc71 !important;
                outline-offset: 2px;
                box-shadow: 0 0 0 4px rgba(46, 204, 113, 0.1) !important;
            }
            
            /* 编辑提示标签 */
            .edit-label {
                position: absolute;
                top: -25px;
                left: 0;
                background: #3498db;
                color: white;
                padding: 2px 8px;
                border-radius: 3px;
                font-size: 11px;
                font-weight: 600;
                pointer-events: none;
                z-index: 10001;
                opacity: 0;
                transition: opacity 0.3s;
            }
            
            .real-time-edit-mode .editable-element:hover .edit-label {
                opacity: 1;
            }
            
            /* 内联编辑器 */
            .real-time-inline-editor {
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
            
            .real-time-inline-editor .editor-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 15px;
                padding-bottom: 10px;
                border-bottom: 1px solid #ecf0f1;
            }
            
            .real-time-inline-editor .editor-title {
                font-weight: 600;
                color: #2c3e50;
                font-size: 14px;
            }
            
            .real-time-inline-editor .save-indicator {
                font-size: 12px;
                color: #7f8c8d;
            }
            
            .real-time-inline-editor textarea,
            .real-time-inline-editor input {
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
            
            .real-time-inline-editor textarea:focus,
            .real-time-inline-editor input:focus {
                outline: none;
                border-color: #3498db;
            }
            
            .real-time-inline-editor .editor-buttons {
                display: flex;
                gap: 10px;
                margin-top: 15px;
                justify-content: flex-end;
            }
            
            .real-time-inline-editor .btn {
                padding: 8px 16px;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-size: 13px;
                font-weight: 600;
                transition: all 0.3s;
            }
            
            .real-time-inline-editor .btn-save {
                background: #27ae60;
                color: white;
            }
            
            .real-time-inline-editor .btn-save:hover {
                background: #229954;
                transform: translateY(-1px);
            }
            
            .real-time-inline-editor .btn-cancel {
                background: #95a5a6;
                color: white;
            }
            
            .real-time-inline-editor .btn-cancel:hover {
                background: #7f8c8d;
            }
            
            /* 页面偏移 */
            body.real-time-editor-active {
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
                
                body.real-time-editor-active {
                    padding-top: 100px;
                }
                
                .real-time-inline-editor {
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
        document.body.classList.add('real-time-editor-active');
    }

    // 创建编辑覆盖层
    function createEditOverlay() {
        EDITABLE_SELECTORS.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
                if (!element.closest('#real-time-toolbar') &&
                    !element.closest('.real-time-inline-editor') &&
                    element.textContent.trim() !== '') {

                    element.classList.add('editable-element');
                    element.setAttribute('data-editable', 'true');
                    element.setAttribute('data-original-content', element.textContent);
                    element.setAttribute('data-selector', getElementSelector(element));

                    // 添加编辑提示标签
                    const label = document.createElement('div');
                    label.className = 'edit-label';
                    label.textContent = '点击编辑';
                    element.style.position = 'relative';
                    element.appendChild(label);
                }
            });
        });
    }

    // 绑定事件
    function bindEvents() {
        document.getElementById('toggle-edit-mode').addEventListener('click', toggleEditMode);
        document.getElementById('save-to-file').addEventListener('click', saveToFile);
        document.getElementById('undo-change').addEventListener('click', undoChange);
        document.getElementById('view-backups').addEventListener('click', viewBackups);
        document.getElementById('refresh-page').addEventListener('click', () => location.reload());
        document.getElementById('close-editor').addEventListener('click', closeEditor);

        document.addEventListener('click', handleElementClick);
        document.addEventListener('keydown', handleKeyboardShortcuts);
    }

    // 切换编辑模式
    function toggleEditMode() {
        if (!serverAvailable) {
            showError('服务器未连接，无法进入编辑模式');
            return;
        }

        isEditMode = !isEditMode;
        const button = document.getElementById('toggle-edit-mode');
        const saveButton = document.getElementById('save-to-file');

        if (isEditMode) {
            document.body.classList.add('real-time-edit-mode');
            button.innerHTML = '<span class="icon">👁️</span><span class="text">退出编辑</span>';
            button.classList.remove('primary');
            button.classList.add('danger');
            saveButton.disabled = false;
            showSuccess('编辑模式已开启 - 点击任何文字开始编辑');
        } else {
            document.body.classList.remove('real-time-edit-mode');
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
        editor.className = 'real-time-inline-editor';

        const isMultiline = element.tagName === 'P' || element.tagName === 'DIV' ||
                           element.textContent.length > 50;

        const inputType = isMultiline ? 'textarea' : 'input';
        const currentText = element.textContent || element.innerText;
        const elementType = element.tagName.toLowerCase();

        editor.innerHTML = `
            <div class="editor-header">
                <div class="editor-title">编辑 ${elementType.toUpperCase()} 元素</div>
                <div class="save-indicator">修改后自动保存到文件</div>
            </div>
            <${inputType} id="real-time-input" placeholder="输入内容...">${currentText}</${inputType}>
            <div class="editor-buttons">
                <button class="btn btn-save" onclick="saveRealTimeEdit()">💾 保存到文件</button>
                <button class="btn btn-cancel" onclick="cancelRealTimeEdit()">❌ 取消</button>
            </div>
        `;

        return editor;
    }

    // 保存实时编辑
    window.saveRealTimeEdit = async function() {
        if (!currentEditElement || !serverAvailable) return;

        const input = document.getElementById('real-time-input');
        const newContent = input.value.trim();
        const oldContent = currentEditElement.getAttribute('data-original-content');
        const selector = currentEditElement.getAttribute('data-selector');

        if (newContent === oldContent) {
            showSuccess('内容未更改');
            closeInlineEditor();
            return;
        }

        try {
            // 显示保存状态
            const saveBtn = document.querySelector('.btn-save');
            const originalText = saveBtn.innerHTML;
            saveBtn.innerHTML = '⏳ 保存中...';
            saveBtn.disabled = true;

            // 发送到服务器
            const response = await fetch(`${CONFIG.API_BASE}/update-element`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    filename: CONFIG.CURRENT_FILE,
                    selector: selector,
                    newContent: newContent,
                    oldContent: oldContent
                })
            });

            const result = await response.json();

            if (result.success) {
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

                showSuccess('✅ 内容已保存到文件！');
                closeInlineEditor();

                // 可选：刷新页面以确保显示最新内容
                if (confirm('内容已保存！是否刷新页面查看最新效果？')) {
                    location.reload();
                }
            } else {
                throw new Error(result.error || '保存失败');
            }

        } catch (error) {
            console.error('保存错误:', error);
            showError('保存失败: ' + error.message);

            // 恢复按钮状态
            const saveBtn = document.querySelector('.btn-save');
            if (saveBtn) {
                saveBtn.innerHTML = originalText;
                saveBtn.disabled = false;
            }
        }
    };

    // 取消实时编辑
    window.cancelRealTimeEdit = function() {
        closeInlineEditor();
    };

    // 关闭内联编辑器
    function closeInlineEditor() {
        const editor = document.querySelector('.real-time-inline-editor');
        if (editor) {
            editor.remove();
        }

        if (currentEditElement) {
            currentEditElement.classList.remove('editing');
            currentEditElement = null;
        }
    }

    // 保存到文件（批量保存）
    async function saveToFile() {
        if (!serverAvailable) {
            showError('服务器未连接');
            return;
        }

        try {
            const changes = getAllChanges();
            if (changes.length === 0) {
                showSuccess('没有需要保存的更改');
                return;
            }

            const response = await fetch(`${CONFIG.API_BASE}/batch-update`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    filename: CONFIG.CURRENT_FILE,
                    updates: changes
                })
            });

            const result = await response.json();

            if (result.success) {
                showSuccess(`✅ 已保存 ${result.updateCount} 项更改到文件！`);

                if (confirm('内容已保存！是否刷新页面查看最新效果？')) {
                    location.reload();
                }
            } else {
                throw new Error(result.error || '批量保存失败');
            }

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

        // 添加类名
        if (element.className) {
            const classes = element.className.split(' ').filter(c =>
                c && !c.includes('editable') && !c.includes('editing')
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

    // 查看备份
    async function viewBackups() {
        try {
            const response = await fetch(`${CONFIG.API_BASE}/backups`);
            const result = await response.json();

            if (result.success) {
                const backups = result.backups;
                if (backups.length === 0) {
                    showSuccess('暂无备份文件');
                    return;
                }

                let message = '备份文件列表：\n\n';
                backups.slice(0, 10).forEach((backup, index) => {
                    const date = new Date(backup.created).toLocaleString();
                    const size = (backup.size / 1024).toFixed(1);
                    message += `${index + 1}. ${backup.originalFile}\n`;
                    message += `   时间: ${date}\n`;
                    message += `   大小: ${size} KB\n\n`;
                });

                alert(message);
            } else {
                throw new Error(result.error || '获取备份列表失败');
            }
        } catch (error) {
            showError('获取备份列表失败: ' + error.message);
        }
    }

    // 键盘快捷键
    function handleKeyboardShortcuts(e) {
        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case 's':
                    e.preventDefault();
                    if (currentEditElement) {
                        saveRealTimeEdit();
                    } else {
                        saveToFile();
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

    // 关闭编辑器
    function closeEditor() {
        if (confirm('确定要关闭实时编辑器吗？')) {
            document.getElementById('real-time-toolbar').remove();
            document.body.classList.remove('real-time-editor-active', 'real-time-edit-mode');
            closeInlineEditor();

            document.querySelectorAll('.editable-element').forEach(element => {
                element.classList.remove('editable-element', 'editing');
                element.removeAttribute('data-editable');
                const label = element.querySelector('.edit-label');
                if (label) label.remove();
            });

            showSuccess('实时编辑器已关闭');
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
        }, 3000);
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
        document.addEventListener('DOMContentLoaded', initRealTimeEditor);
    } else {
        initRealTimeEditor();
    }

    // 暴露全局函数
    window.realTimeEditor = {
        toggle: toggleEditMode,
        save: saveToFile,
        close: closeEditor
    };

})();

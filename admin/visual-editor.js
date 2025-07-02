/**
 * 可视化编辑器 - 直接在网站上点击编辑
 * Visual Editor - Click to edit directly on the website
 */

(function() {
    'use strict';
    
    let isEditMode = false;
    let currentEditElement = null;
    let originalContent = {};
    let editHistory = [];
    let historyIndex = -1;
    
    // 可编辑元素的选择器
    const EDITABLE_SELECTORS = [
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'p', 'span', 'div.slide-text h2', 'div.slide-text p',
        '.service_item_title div', '.service-overlay h4', '.service-overlay p',
        '.author-name', '.author-title', '.news-date',
        '[href^="mailto:"]', '[href^="tel:"]',
        'title', 'meta[name="description"]', 'meta[name="keywords"]'
    ];
    
    // 初始化可视化编辑器
    function initVisualEditor() {
        createEditToolbar();
        createEditOverlay();
        bindEvents();
        loadSavedContent();
        console.log('🎨 可视化编辑器已启动');
    }
    
    // 创建编辑工具栏
    function createEditToolbar() {
        const toolbar = document.createElement('div');
        toolbar.id = 'visual-edit-toolbar';
        toolbar.innerHTML = `
            <div class="toolbar-content">
                <div class="toolbar-left">
                    <button id="toggle-edit-mode" class="toolbar-btn primary">
                        <span class="icon">✏️</span>
                        <span class="text">开始编辑</span>
                    </button>
                    <button id="save-changes" class="toolbar-btn success" disabled>
                        <span class="icon">💾</span>
                        <span class="text">保存</span>
                    </button>
                    <button id="undo-change" class="toolbar-btn" disabled>
                        <span class="icon">↶</span>
                        <span class="text">撤销</span>
                    </button>
                    <button id="redo-change" class="toolbar-btn" disabled>
                        <span class="icon">↷</span>
                        <span class="text">重做</span>
                    </button>
                </div>
                <div class="toolbar-right">
                    <button id="preview-mode" class="toolbar-btn">
                        <span class="icon">👁️</span>
                        <span class="text">预览</span>
                    </button>
                    <button id="export-changes" class="toolbar-btn">
                        <span class="icon">📤</span>
                        <span class="text">导出</span>
                    </button>
                    <button id="close-editor" class="toolbar-btn danger">
                        <span class="icon">✖️</span>
                        <span class="text">关闭</span>
                    </button>
                </div>
            </div>
        `;
        
        // 添加工具栏样式
        const style = document.createElement('style');
        style.textContent = `
            #visual-edit-toolbar {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                z-index: 10000;
                box-shadow: 0 2px 10px rgba(0,0,0,0.2);
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }
            
            .toolbar-content {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 10px 20px;
                max-width: 1200px;
                margin: 0 auto;
            }
            
            .toolbar-left, .toolbar-right {
                display: flex;
                gap: 10px;
            }
            
            .toolbar-btn {
                display: flex;
                align-items: center;
                gap: 5px;
                padding: 8px 12px;
                background: rgba(255,255,255,0.1);
                border: 1px solid rgba(255,255,255,0.2);
                border-radius: 6px;
                color: white;
                cursor: pointer;
                transition: all 0.3s;
                font-size: 14px;
                font-weight: 500;
            }
            
            .toolbar-btn:hover {
                background: rgba(255,255,255,0.2);
                transform: translateY(-1px);
            }
            
            .toolbar-btn:disabled {
                opacity: 0.5;
                cursor: not-allowed;
                transform: none;
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
                font-size: 16px;
            }
            
            /* 编辑模式样式 */
            .edit-mode .editable-element {
                position: relative;
                cursor: pointer;
                transition: all 0.3s;
            }
            
            .edit-mode .editable-element:hover {
                background: rgba(52, 152, 219, 0.1) !important;
                outline: 2px dashed #3498db !important;
                outline-offset: 2px;
            }
            
            .edit-mode .editable-element.editing {
                background: rgba(46, 204, 113, 0.1) !important;
                outline: 2px solid #2ecc71 !important;
                outline-offset: 2px;
            }
            
            /* 编辑提示 */
            .edit-tooltip {
                position: absolute;
                background: #2c3e50;
                color: white;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 12px;
                pointer-events: none;
                z-index: 10001;
                white-space: nowrap;
            }
            
            .edit-tooltip::after {
                content: '';
                position: absolute;
                top: 100%;
                left: 50%;
                transform: translateX(-50%);
                border: 4px solid transparent;
                border-top-color: #2c3e50;
            }
            
            /* 内联编辑器 */
            .inline-editor {
                position: absolute;
                background: white;
                border: 2px solid #3498db;
                border-radius: 8px;
                padding: 15px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.2);
                z-index: 10002;
                min-width: 300px;
                max-width: 500px;
            }
            
            .inline-editor textarea,
            .inline-editor input {
                width: 100%;
                padding: 8px;
                border: 1px solid #ddd;
                border-radius: 4px;
                font-size: 14px;
                font-family: inherit;
                resize: vertical;
                min-height: 60px;
            }
            
            .inline-editor .editor-buttons {
                display: flex;
                gap: 8px;
                margin-top: 10px;
                justify-content: flex-end;
            }
            
            .inline-editor .btn {
                padding: 6px 12px;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
                font-weight: 500;
            }
            
            .inline-editor .btn-save {
                background: #27ae60;
                color: white;
            }
            
            .inline-editor .btn-cancel {
                background: #95a5a6;
                color: white;
            }
            
            /* 响应式设计 */
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
                
                .inline-editor {
                    position: fixed !important;
                    top: 50% !important;
                    left: 50% !important;
                    transform: translate(-50%, -50%) !important;
                    width: 90% !important;
                    max-width: none !important;
                }
            }
            
            /* 页面内容向下偏移 */
            body.visual-editor-active {
                padding-top: 70px;
            }
            
            @media (max-width: 768px) {
                body.visual-editor-active {
                    padding-top: 120px;
                }
            }
        `;
        
        document.head.appendChild(style);
        document.body.appendChild(toolbar);
        document.body.classList.add('visual-editor-active');
    }
    
    // 创建编辑覆盖层
    function createEditOverlay() {
        // 为所有可编辑元素添加标记
        EDITABLE_SELECTORS.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
                if (!element.closest('#visual-edit-toolbar') &&
                    !element.closest('.inline-editor') &&
                    element.textContent.trim() !== '') {
                    element.classList.add('editable-element');
                    element.setAttribute('data-editable', 'true');
                    element.setAttribute('data-original-content', element.innerHTML);
                }
            });
        });
    }

    // 绑定事件
    function bindEvents() {
        // 工具栏按钮事件
        document.getElementById('toggle-edit-mode').addEventListener('click', toggleEditMode);
        document.getElementById('save-changes').addEventListener('click', saveChanges);
        document.getElementById('undo-change').addEventListener('click', undoChange);
        document.getElementById('redo-change').addEventListener('click', redoChange);
        document.getElementById('preview-mode').addEventListener('click', togglePreviewMode);
        document.getElementById('export-changes').addEventListener('click', exportChanges);
        document.getElementById('close-editor').addEventListener('click', closeEditor);

        // 可编辑元素点击事件
        document.addEventListener('click', handleElementClick);

        // 键盘快捷键
        document.addEventListener('keydown', handleKeyboardShortcuts);

        // 阻止默认链接行为在编辑模式下
        document.addEventListener('click', function(e) {
            if (isEditMode && e.target.closest('a')) {
                e.preventDefault();
            }
        });
    }

    // 切换编辑模式
    function toggleEditMode() {
        isEditMode = !isEditMode;
        const button = document.getElementById('toggle-edit-mode');
        const saveButton = document.getElementById('save-changes');

        if (isEditMode) {
            document.body.classList.add('edit-mode');
            button.innerHTML = '<span class="icon">👁️</span><span class="text">退出编辑</span>';
            button.classList.remove('primary');
            button.classList.add('danger');
            saveButton.disabled = false;
            showEditHint();
        } else {
            document.body.classList.remove('edit-mode');
            button.innerHTML = '<span class="icon">✏️</span><span class="text">开始编辑</span>';
            button.classList.remove('danger');
            button.classList.add('primary');
            closeInlineEditor();
            hideEditHint();
        }

        updateToolbarState();
    }

    // 显示编辑提示
    function showEditHint() {
        const hint = document.createElement('div');
        hint.id = 'edit-hint';
        hint.innerHTML = `
            <div style="position: fixed; top: 80px; right: 20px; background: #2ecc71; color: white;
                        padding: 10px 15px; border-radius: 8px; z-index: 10003;
                        box-shadow: 0 4px 12px rgba(0,0,0,0.2); animation: slideInRight 0.3s;">
                <strong>💡 编辑模式已开启</strong><br>
                点击任何文字即可编辑
            </div>
        `;
        document.body.appendChild(hint);

        setTimeout(() => {
            const hintElement = document.getElementById('edit-hint');
            if (hintElement) {
                hintElement.style.animation = 'slideOutRight 0.3s';
                setTimeout(() => hintElement.remove(), 300);
            }
        }, 3000);
    }

    // 隐藏编辑提示
    function hideEditHint() {
        const hint = document.getElementById('edit-hint');
        if (hint) hint.remove();
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

        editor.style.left = Math.min(rect.left + scrollLeft, window.innerWidth - 320) + 'px';
        editor.style.top = (rect.bottom + scrollTop + 10) + 'px';

        document.body.appendChild(editor);

        // 聚焦到输入框
        const input = editor.querySelector('textarea, input');
        input.focus();
        input.select();
    }

    // 创建内联编辑器
    function createInlineEditor(element) {
        const editor = document.createElement('div');
        editor.className = 'inline-editor';

        const isMultiline = element.tagName === 'P' || element.tagName === 'DIV' ||
                           element.innerHTML.includes('<br>') || element.innerHTML.length > 100;

        const inputType = isMultiline ? 'textarea' : 'input';
        const currentText = element.textContent || element.innerText;

        editor.innerHTML = `
            <div style="margin-bottom: 8px; font-weight: 600; color: #2c3e50;">
                编辑 ${element.tagName.toLowerCase()} 元素
            </div>
            <${inputType} id="inline-input" placeholder="输入内容...">${currentText}</${inputType}>
            <div class="editor-buttons">
                <button class="btn btn-save" onclick="saveInlineEdit()">保存</button>
                <button class="btn btn-cancel" onclick="cancelInlineEdit()">取消</button>
            </div>
        `;

        return editor;
    }

    // 保存内联编辑
    window.saveInlineEdit = function() {
        if (!currentEditElement) return;

        const input = document.getElementById('inline-input');
        const newContent = input.value.trim();
        const oldContent = currentEditElement.textContent;

        if (newContent !== oldContent) {
            // 保存到历史记录
            addToHistory({
                element: currentEditElement,
                oldContent: oldContent,
                newContent: newContent,
                timestamp: Date.now()
            });

            // 更新元素内容
            currentEditElement.textContent = newContent;

            // 保存到本地存储
            saveToLocalStorage();

            showSuccessMessage('内容已更新！');
        }

        closeInlineEditor();
    };

    // 取消内联编辑
    window.cancelInlineEdit = function() {
        closeInlineEditor();
    };

    // 关闭内联编辑器
    function closeInlineEditor() {
        const editor = document.querySelector('.inline-editor');
        if (editor) {
            editor.remove();
        }

        if (currentEditElement) {
            currentEditElement.classList.remove('editing');
            currentEditElement = null;
        }
    }

    // 添加到历史记录
    function addToHistory(change) {
        // 移除当前位置之后的历史记录
        editHistory = editHistory.slice(0, historyIndex + 1);
        editHistory.push(change);
        historyIndex++;

        // 限制历史记录数量
        if (editHistory.length > 50) {
            editHistory.shift();
            historyIndex--;
        }

        updateToolbarState();
    }

    // 撤销更改
    function undoChange() {
        if (historyIndex >= 0) {
            const change = editHistory[historyIndex];
            change.element.textContent = change.oldContent;
            historyIndex--;
            updateToolbarState();
            saveToLocalStorage();
            showSuccessMessage('已撤销更改');
        }
    }

    // 重做更改
    function redoChange() {
        if (historyIndex < editHistory.length - 1) {
            historyIndex++;
            const change = editHistory[historyIndex];
            change.element.textContent = change.newContent;
            updateToolbarState();
            saveToLocalStorage();
            showSuccessMessage('已重做更改');
        }
    }

    // 更新工具栏状态
    function updateToolbarState() {
        document.getElementById('undo-change').disabled = historyIndex < 0;
        document.getElementById('redo-change').disabled = historyIndex >= editHistory.length - 1;
    }

    // 保存所有更改
    function saveChanges() {
        const changes = getAllChanges();
        if (changes.length === 0) {
            showSuccessMessage('没有需要保存的更改');
            return;
        }

        // 生成配置文件
        const config = {
            timestamp: Date.now(),
            changes: changes,
            version: '1.0.0'
        };

        // 下载配置文件
        downloadConfig(config);
        showSuccessMessage(`已保存 ${changes.length} 项更改！`);
    }

    // 获取所有更改
    function getAllChanges() {
        const changes = [];
        document.querySelectorAll('.editable-element').forEach(element => {
            const original = element.getAttribute('data-original-content');
            const current = element.innerHTML;

            if (original !== current) {
                changes.push({
                    selector: getElementSelector(element),
                    originalContent: original,
                    newContent: current,
                    tagName: element.tagName,
                    textContent: element.textContent
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
            selector += '.' + element.className.split(' ').join('.');
        }

        // 添加父元素信息以提高精确性
        let parent = element.parentElement;
        if (parent && parent.id) {
            selector = `#${parent.id} ${selector}`;
        } else if (parent && parent.className) {
            selector = `.${parent.className.split(' ')[0]} ${selector}`;
        }

        return selector;
    }

    // 下载配置文件
    function downloadConfig(config) {
        const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `website-changes-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    // 保存到本地存储
    function saveToLocalStorage() {
        const changes = getAllChanges();
        localStorage.setItem('visualEditorChanges', JSON.stringify({
            changes: changes,
            timestamp: Date.now()
        }));
    }

    // 从本地存储加载
    function loadSavedContent() {
        const saved = localStorage.getItem('visualEditorChanges');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                applyChanges(data.changes);
                console.log(`已加载 ${data.changes.length} 项保存的更改`);
            } catch (error) {
                console.warn('加载保存的更改失败:', error);
            }
        }
    }

    // 应用更改
    function applyChanges(changes) {
        changes.forEach(change => {
            const elements = document.querySelectorAll(change.selector);
            elements.forEach(element => {
                if (element.getAttribute('data-original-content') === change.originalContent) {
                    element.innerHTML = change.newContent;
                }
            });
        });
    }

    // 导出更改
    function exportChanges() {
        const changes = getAllChanges();
        if (changes.length === 0) {
            showSuccessMessage('没有更改可导出');
            return;
        }

        const exportData = {
            website: window.location.hostname,
            timestamp: new Date().toISOString(),
            changes: changes,
            totalChanges: changes.length
        };

        downloadConfig(exportData);
        showSuccessMessage('更改已导出！');
    }

    // 切换预览模式
    function togglePreviewMode() {
        const isPreview = document.body.classList.contains('preview-mode');

        if (isPreview) {
            document.body.classList.remove('preview-mode');
            document.getElementById('visual-edit-toolbar').style.display = 'block';
            showSuccessMessage('已退出预览模式');
        } else {
            document.body.classList.add('preview-mode');
            document.getElementById('visual-edit-toolbar').style.display = 'none';
            closeInlineEditor();
            showSuccessMessage('预览模式 - 按ESC键退出');
        }
    }

    // 关闭编辑器
    function closeEditor() {
        if (confirm('确定要关闭可视化编辑器吗？未保存的更改将会丢失。')) {
            document.getElementById('visual-edit-toolbar').remove();
            document.body.classList.remove('visual-editor-active', 'edit-mode', 'preview-mode');
            closeInlineEditor();

            // 移除所有编辑相关的类和属性
            document.querySelectorAll('.editable-element').forEach(element => {
                element.classList.remove('editable-element', 'editing');
                element.removeAttribute('data-editable');
            });

            showSuccessMessage('可视化编辑器已关闭');
        }
    }

    // 键盘快捷键
    function handleKeyboardShortcuts(e) {
        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case 's':
                    e.preventDefault();
                    saveChanges();
                    break;
                case 'z':
                    e.preventDefault();
                    if (e.shiftKey) {
                        redoChange();
                    } else {
                        undoChange();
                    }
                    break;
                case 'e':
                    e.preventDefault();
                    toggleEditMode();
                    break;
            }
        }

        if (e.key === 'Escape') {
            if (document.body.classList.contains('preview-mode')) {
                togglePreviewMode();
            } else if (currentEditElement) {
                closeInlineEditor();
            }
        }
    }

    // 显示成功消息
    function showSuccessMessage(message) {
        const toast = document.createElement('div');
        toast.innerHTML = `
            <div style="position: fixed; top: 80px; right: 20px; background: #27ae60; color: white;
                        padding: 12px 20px; border-radius: 8px; z-index: 10004;
                        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                        animation: slideInRight 0.3s; max-width: 300px;">
                <strong>✅ ${message}</strong>
            </div>
        `;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideOutRight 0.3s';
            setTimeout(() => toast.remove(), 300);
        }, 2000);
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

    // 初始化编辑器
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initVisualEditor);
    } else {
        initVisualEditor();
    }

    // 暴露全局函数
    window.visualEditor = {
        toggle: toggleEditMode,
        save: saveChanges,
        export: exportChanges,
        close: closeEditor
    };

})();

/**
 * 直接编辑器 - 无需API，直接生成文件
 * Direct Editor - No API required, generates files directly
 */

(function() {
    'use strict';
    
    let isEditMode = false;
    let changes = [];
    let originalHTML = '';
    
    // 初始化直接编辑器
    function initDirectEditor() {
        createDirectToolbar();
        console.log('⚡ 直接编辑器已启动');
    }
    
    // 创建直接编辑工具栏
    function createDirectToolbar() {
        const toolbar = document.createElement('div');
        toolbar.id = 'direct-toolbar';
        toolbar.innerHTML = `
            <div class="direct-toolbar-content">
                <div class="toolbar-left">
                    <button id="start-direct-edit" class="direct-btn primary">
                        <span class="icon">⚡</span>
                        <span class="text">开始编辑</span>
                    </button>
                    <button id="download-changes" class="direct-btn success" disabled>
                        <span class="icon">📥</span>
                        <span class="text">下载修改后的文件</span>
                    </button>
                    <div class="edit-count" id="edit-count" style="display: none;">
                        已修改 <span id="change-count">0</span> 处文字
                    </div>
                </div>
                <div class="toolbar-right">
                    <button id="reset-changes" class="direct-btn" disabled>
                        <span class="icon">🔄</span>
                        <span class="text">重置</span>
                    </button>
                    <button id="close-direct-editor" class="direct-btn danger">
                        <span class="icon">✖️</span>
                        <span class="text">关闭</span>
                    </button>
                </div>
            </div>
            <div class="direct-hint" id="direct-hint" style="display: none;">
                ⚡ 直接编辑模式：点击任何蓝色文字直接输入新内容，编辑完成后下载文件替换到你的网站！
            </div>
        `;
        
        // 添加样式
        const style = document.createElement('style');
        style.textContent = `
            #direct-toolbar {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                z-index: 10000;
                box-shadow: 0 2px 15px rgba(0,0,0,0.3);
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }
            
            .direct-toolbar-content {
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
            
            .direct-btn {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 12px 20px;
                background: rgba(255,255,255,0.2);
                border: 2px solid rgba(255,255,255,0.3);
                border-radius: 8px;
                color: white;
                cursor: pointer;
                transition: all 0.3s;
                font-size: 14px;
                font-weight: 600;
            }
            
            .direct-btn:hover:not(:disabled) {
                background: rgba(255,255,255,0.3);
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            }
            
            .direct-btn:disabled {
                opacity: 0.5;
                cursor: not-allowed;
                transform: none;
            }
            
            .direct-btn.primary {
                background: #3498db;
                border-color: #2980b9;
            }
            
            .direct-btn.success {
                background: #27ae60;
                border-color: #229954;
                animation: pulse 2s infinite;
            }
            
            @keyframes pulse {
                0% { box-shadow: 0 0 0 0 rgba(39, 174, 96, 0.7); }
                70% { box-shadow: 0 0 0 10px rgba(39, 174, 96, 0); }
                100% { box-shadow: 0 0 0 0 rgba(39, 174, 96, 0); }
            }
            
            .direct-btn.danger {
                background: #e74c3c;
                border-color: #c0392b;
            }
            
            .direct-btn .icon {
                font-size: 16px;
            }
            
            .edit-count {
                background: rgba(255,255,255,0.9);
                color: #2c3e50;
                padding: 8px 15px;
                border-radius: 20px;
                font-size: 13px;
                font-weight: 600;
                animation: bounce 0.5s;
            }
            
            @keyframes bounce {
                0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
                40% { transform: translateY(-10px); }
                60% { transform: translateY(-5px); }
            }
            
            .direct-hint {
                background: rgba(255,255,255,0.95);
                color: #2c3e50;
                padding: 12px 20px;
                text-align: center;
                font-weight: 600;
                font-size: 14px;
                animation: slideDown 0.3s;
            }
            
            @keyframes slideDown {
                from { height: 0; opacity: 0; }
                to { height: auto; opacity: 1; }
            }
            
            /* 直接编辑模式样式 */
            .direct-edit-mode [data-direct-editable] {
                background: linear-gradient(45deg, #E3F2FD, #BBDEFB) !important;
                border: 3px solid #2196F3 !important;
                border-radius: 6px !important;
                padding: 10px !important;
                cursor: text !important;
                transition: all 0.3s !important;
                position: relative !important;
                min-height: 35px !important;
                display: inline-block !important;
                box-shadow: 0 2px 8px rgba(33, 150, 243, 0.3) !important;
            }
            
            .direct-edit-mode [data-direct-editable]:hover {
                background: linear-gradient(45deg, #BBDEFB, #90CAF9) !important;
                border-color: #1976D2 !important;
                box-shadow: 0 4px 12px rgba(33, 150, 243, 0.4) !important;
                transform: scale(1.02) !important;
            }
            
            .direct-edit-mode [data-direct-editable]:focus {
                background: rgba(255, 255, 255, 0.95) !important;
                border-color: #4CAF50 !important;
                box-shadow: 0 0 0 4px rgba(76, 175, 80, 0.3) !important;
                outline: none !important;
            }
            
            .direct-edit-mode [data-direct-editable]:empty:before {
                content: '点击输入文字...';
                color: #999;
                font-style: italic;
            }
            
            .direct-edit-mode [data-direct-editable].changed {
                background: linear-gradient(45deg, #C8E6C9, #A5D6A7) !important;
                border-color: #4CAF50 !important;
                animation: glow 1s infinite alternate;
            }
            
            @keyframes glow {
                from { box-shadow: 0 0 5px rgba(76, 175, 80, 0.5); }
                to { box-shadow: 0 0 15px rgba(76, 175, 80, 0.8); }
            }
            
            /* 编辑提示标签 */
            .edit-tip {
                position: absolute;
                top: -30px;
                left: 0;
                background: #2196F3;
                color: white;
                padding: 4px 10px;
                border-radius: 4px;
                font-size: 11px;
                font-weight: 600;
                pointer-events: none;
                z-index: 10001;
                opacity: 0;
                transition: opacity 0.3s;
                white-space: nowrap;
            }
            
            .direct-edit-mode [data-direct-editable]:hover .edit-tip {
                opacity: 1;
            }
            
            /* 页面偏移 */
            body.direct-editor-active {
                padding-top: 80px;
            }
            
            body.direct-editor-active.with-hint {
                padding-top: 130px;
            }
            
            /* 响应式 */
            @media (max-width: 768px) {
                .direct-toolbar-content {
                    flex-direction: column;
                    gap: 10px;
                    padding: 10px;
                }
                
                .toolbar-left, .toolbar-right {
                    flex-wrap: wrap;
                    justify-content: center;
                }
                
                .direct-btn .text {
                    display: none;
                }
                
                body.direct-editor-active {
                    padding-top: 140px;
                }
                
                body.direct-editor-active.with-hint {
                    padding-top: 180px;
                }
                
                .direct-hint {
                    font-size: 12px;
                    padding: 10px 15px;
                }
            }
        `;
        
        document.head.appendChild(style);
        document.body.appendChild(toolbar);
        document.body.classList.add('direct-editor-active');
        
        // 绑定事件
        bindDirectEvents();
    }
    
    // 绑定事件
    function bindDirectEvents() {
        document.getElementById('start-direct-edit').addEventListener('click', toggleDirectEdit);
        document.getElementById('download-changes').addEventListener('click', downloadChanges);
        document.getElementById('reset-changes').addEventListener('click', resetChanges);
        document.getElementById('close-direct-editor').addEventListener('click', closeDirectEditor);
    }

    // 切换直接编辑模式
    function toggleDirectEdit() {
        isEditMode = !isEditMode;
        const startBtn = document.getElementById('start-direct-edit');
        const downloadBtn = document.getElementById('download-changes');
        const resetBtn = document.getElementById('reset-changes');
        const hint = document.getElementById('direct-hint');

        if (isEditMode) {
            // 进入编辑模式
            document.body.classList.add('direct-edit-mode', 'with-hint');
            startBtn.innerHTML = '<span class="icon">👁️</span><span class="text">退出编辑</span>';
            startBtn.classList.remove('primary');
            startBtn.classList.add('danger');
            downloadBtn.disabled = false;
            resetBtn.disabled = false;
            hint.style.display = 'block';

            // 保存原始HTML
            originalHTML = document.documentElement.outerHTML;

            // 让文字可编辑
            makeTextDirectEditable();

            showMessage('⚡ 直接编辑模式已开启！点击蓝色文字直接输入新内容', 'success');

        } else {
            // 退出编辑模式
            document.body.classList.remove('direct-edit-mode', 'with-hint');
            startBtn.innerHTML = '<span class="icon">⚡</span><span class="text">开始编辑</span>';
            startBtn.classList.remove('danger');
            startBtn.classList.add('primary');
            hint.style.display = 'none';

            // 禁用编辑
            disableDirectEditing();

            showMessage('👁️ 编辑模式已关闭', 'info');
        }
    }

    // 让文字直接可编辑
    function makeTextDirectEditable() {
        // 选择所有文字元素
        const textElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, div, a, li, td, th, button');

        textElements.forEach(element => {
            // 跳过工具栏和特殊元素
            if (element.closest('#direct-toolbar') ||
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

                element.setAttribute('data-direct-editable', 'true');
                element.setAttribute('data-original-text', element.textContent);
                element.contentEditable = true;

                // 添加编辑提示
                element.style.position = 'relative';
                const tip = document.createElement('div');
                tip.className = 'edit-tip';
                tip.textContent = '点击输入文字';
                element.appendChild(tip);

                // 绑定编辑事件
                element.addEventListener('input', handleDirectInput);
                element.addEventListener('focus', handleDirectFocus);
                element.addEventListener('blur', handleDirectBlur);
            }
        });
    }

    // 禁用直接编辑
    function disableDirectEditing() {
        document.querySelectorAll('[data-direct-editable]').forEach(element => {
            element.contentEditable = false;
            element.removeEventListener('input', handleDirectInput);
            element.removeEventListener('focus', handleDirectFocus);
            element.removeEventListener('blur', handleDirectBlur);

            const tip = element.querySelector('.edit-tip');
            if (tip) tip.remove();

            element.style.position = '';
            element.classList.remove('changed');
        });
    }

    // 处理直接输入
    function handleDirectInput(event) {
        const element = event.target;
        const originalText = element.getAttribute('data-original-text');
        const currentText = element.textContent;

        // 标记为已更改
        if (originalText !== currentText) {
            element.classList.add('changed');
            element.setAttribute('data-current-text', currentText);

            // 更新更改记录
            updateChanges(element, originalText, currentText);
        } else {
            element.classList.remove('changed');
            removeFromChanges(element);
        }

        // 更新计数器
        updateChangeCount();
    }

    // 处理焦点
    function handleDirectFocus(event) {
        const element = event.target;
        showMessage('📝 正在编辑: ' + element.tagName.toLowerCase(), 'info', 1000);
    }

    // 处理失焦
    function handleDirectBlur(event) {
        // 可以在这里添加自动保存逻辑
    }

    // 更新更改记录
    function updateChanges(element, originalText, currentText) {
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

    // 从更改记录中移除
    function removeFromChanges(element) {
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
                c && !c.includes('changed') && !c.includes('direct')
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
            if (parentClass && !parentClass.includes('direct')) {
                selector = `.${parentClass} ${selector}`;
            }
        }

        return selector;
    }

    // 更新更改计数
    function updateChangeCount() {
        const countElement = document.getElementById('change-count');
        const editCountElement = document.getElementById('edit-count');
        const downloadBtn = document.getElementById('download-changes');

        if (changes.length > 0) {
            countElement.textContent = changes.length;
            editCountElement.style.display = 'block';
            downloadBtn.style.animation = 'pulse 2s infinite';
            downloadBtn.innerHTML = '<span class="icon">📥</span><span class="text">下载修改后的文件 (' + changes.length + ')</span>';
        } else {
            editCountElement.style.display = 'none';
            downloadBtn.style.animation = '';
            downloadBtn.innerHTML = '<span class="icon">📥</span><span class="text">下载修改后的文件</span>';
        }
    }

    // 下载修改后的文件
    function downloadChanges() {
        if (changes.length === 0) {
            showMessage('没有需要下载的更改', 'info');
            return;
        }

        try {
            // 获取当前HTML
            const currentHTML = document.documentElement.outerHTML;

            // 清理HTML
            const cleanHTML = cleanHTMLForDownload(currentHTML);

            // 创建下载
            const blob = new Blob([cleanHTML], { type: 'text/html;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'index.html';
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            showMessage(`📥 已下载修改后的文件！包含 ${changes.length} 项更改`, 'success');

            // 显示使用说明
            setTimeout(() => {
                showUploadInstructions();
            }, 1000);

        } catch (error) {
            console.error('下载错误:', error);
            showMessage('下载失败: ' + error.message, 'error');
        }
    }

    // 清理HTML用于下载
    function cleanHTMLForDownload(html) {
        // 创建临时DOM
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        // 移除编辑器工具栏
        const toolbar = doc.querySelector('#direct-toolbar');
        if (toolbar) toolbar.remove();

        // 移除编辑器相关的类
        doc.body.classList.remove('direct-editor-active', 'direct-edit-mode', 'with-hint');

        // 清理所有可编辑元素
        doc.querySelectorAll('[data-direct-editable]').forEach(element => {
            element.removeAttribute('data-direct-editable');
            element.removeAttribute('data-original-text');
            element.removeAttribute('data-current-text');
            element.removeAttribute('contenteditable');
            element.classList.remove('changed');
            element.style.position = '';

            // 移除编辑提示
            const tip = element.querySelector('.edit-tip');
            if (tip) tip.remove();
        });

        // 移除编辑器样式
        doc.querySelectorAll('style').forEach(style => {
            if (style.textContent.includes('direct-toolbar') ||
                style.textContent.includes('direct-edit-mode')) {
                style.remove();
            }
        });

        // 移除编辑器脚本
        doc.querySelectorAll('script').forEach(script => {
            if (script.src && script.src.includes('direct-editor.js')) {
                script.remove();
            }
        });

        return '<!DOCTYPE html>\n' + doc.documentElement.outerHTML;
    }

    // 显示上传说明
    function showUploadInstructions() {
        const instructions = `
📥 文件下载成功！

接下来的步骤：

1. 📁 找到下载的 index.html 文件
2. 🌐 登录你的 Netlify 控制台
3. 📤 将新文件拖拽到 Netlify 部署区域
4. ⏳ 等待 Netlify 自动部署（1-3分钟）
5. ✅ 访问你的网站查看更新效果

或者：
- 将文件上传到你的 GitHub 仓库
- Netlify 会自动检测并部署更新

修改内容：
${changes.map((change, index) =>
    `${index + 1}. ${change.selector}: "${change.originalText}" → "${change.currentText}"`
).join('\n')}
        `;

        alert(instructions);
    }

    // 重置更改
    function resetChanges() {
        if (changes.length === 0) {
            showMessage('没有需要重置的更改', 'info');
            return;
        }

        if (confirm(`确定要重置所有 ${changes.length} 项更改吗？这将恢复到原始内容。`)) {
            // 恢复所有更改
            changes.forEach(change => {
                change.element.textContent = change.originalText;
                change.element.classList.remove('changed');
                change.element.removeAttribute('data-current-text');
            });

            // 清空更改记录
            changes = [];
            updateChangeCount();

            showMessage('🔄 所有更改已重置', 'info');
        }
    }

    // 关闭直接编辑器
    function closeDirectEditor() {
        if (changes.length > 0) {
            if (!confirm(`你有 ${changes.length} 项未下载的更改，确定要关闭编辑器吗？`)) {
                return;
            }
        }

        // 移除工具栏
        document.getElementById('direct-toolbar').remove();
        document.body.classList.remove('direct-editor-active', 'direct-edit-mode', 'with-hint');

        // 清理编辑状态
        disableDirectEditing();

        showMessage('直接编辑器已关闭', 'info');
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
            <div style="position: fixed; top: 100px; right: 20px; background: ${colors[type]}; color: white;
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
        document.addEventListener('DOMContentLoaded', initDirectEditor);
    } else {
        initDirectEditor();
    }

    // 暴露全局函数
    window.directEditor = {
        toggle: toggleDirectEdit,
        download: downloadChanges,
        reset: resetChanges,
        close: closeDirectEditor
    };

})();

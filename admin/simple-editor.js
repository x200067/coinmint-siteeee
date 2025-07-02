/**
 * 超简单文字编辑器 - 像编辑Word一样简单
 * Super Simple Text Editor - As easy as editing Word
 */

(function() {
    'use strict';
    
    let isEditMode = false;
    let changes = [];
    
    // 初始化简单编辑器
    function initSimpleEditor() {
        createSimpleToolbar();
        makeTextEditable();
        console.log('📝 超简单编辑器已启动');
    }
    
    // 创建简单工具栏
    function createSimpleToolbar() {
        const toolbar = document.createElement('div');
        toolbar.id = 'simple-toolbar';
        toolbar.innerHTML = `
            <div class="simple-toolbar-content">
                <div class="toolbar-left">
                    <button id="start-edit" class="simple-btn primary">
                        <span class="icon">✏️</span>
                        <span class="text">开始编辑</span>
                    </button>
                    <button id="save-changes" class="simple-btn success" disabled>
                        <span class="icon">💾</span>
                        <span class="text">保存修改</span>
                    </button>
                    <div class="edit-hint" id="edit-hint" style="display: none;">
                        💡 直接点击文字就能编辑，就像编辑Word一样简单！
                    </div>
                </div>
                <div class="toolbar-right">
                    <button id="cancel-edit" class="simple-btn" disabled>
                        <span class="icon">❌</span>
                        <span class="text">取消</span>
                    </button>
                </div>
            </div>
        `;
        
        // 添加样式
        const style = document.createElement('style');
        style.textContent = `
            #simple-toolbar {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
                color: white;
                z-index: 10000;
                box-shadow: 0 2px 10px rgba(0,0,0,0.2);
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }
            
            .simple-toolbar-content {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 15px 20px;
                max-width: 1200px;
                margin: 0 auto;
            }
            
            .toolbar-left {
                display: flex;
                gap: 15px;
                align-items: center;
            }
            
            .toolbar-right {
                display: flex;
                gap: 10px;
            }
            
            .simple-btn {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 10px 20px;
                background: rgba(255,255,255,0.2);
                border: 2px solid rgba(255,255,255,0.3);
                border-radius: 8px;
                color: white;
                cursor: pointer;
                transition: all 0.3s;
                font-size: 14px;
                font-weight: 600;
            }
            
            .simple-btn:hover:not(:disabled) {
                background: rgba(255,255,255,0.3);
                transform: translateY(-2px);
                box-shadow: 0 4px 8px rgba(0,0,0,0.2);
            }
            
            .simple-btn:disabled {
                opacity: 0.5;
                cursor: not-allowed;
                transform: none;
            }
            
            .simple-btn.primary {
                background: #2196F3;
                border-color: #1976D2;
            }
            
            .simple-btn.success {
                background: #FF5722;
                border-color: #D84315;
            }
            
            .simple-btn .icon {
                font-size: 16px;
            }
            
            .edit-hint {
                background: rgba(255,255,255,0.9);
                color: #2E7D32;
                padding: 8px 15px;
                border-radius: 20px;
                font-size: 13px;
                font-weight: 500;
                animation: pulse 2s infinite;
            }
            
            @keyframes pulse {
                0% { opacity: 0.8; }
                50% { opacity: 1; }
                100% { opacity: 0.8; }
            }
            
            /* 编辑模式样式 */
            .simple-edit-mode [contenteditable="true"] {
                background: rgba(255, 235, 59, 0.3) !important;
                border: 2px dashed #FFC107 !important;
                border-radius: 4px !important;
                padding: 5px !important;
                cursor: text !important;
                transition: all 0.3s !important;
            }
            
            .simple-edit-mode [contenteditable="true"]:hover {
                background: rgba(255, 235, 59, 0.5) !important;
                border-color: #FF9800 !important;
                box-shadow: 0 0 0 3px rgba(255, 193, 7, 0.2) !important;
            }
            
            .simple-edit-mode [contenteditable="true"]:focus {
                background: rgba(255, 255, 255, 0.9) !important;
                border-color: #4CAF50 !important;
                box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.3) !important;
                outline: none !important;
            }
            
            /* 编辑提示 */
            .edit-tooltip {
                position: absolute;
                background: #4CAF50;
                color: white;
                padding: 5px 10px;
                border-radius: 4px;
                font-size: 12px;
                font-weight: 600;
                pointer-events: none;
                z-index: 10001;
                opacity: 0;
                transition: opacity 0.3s;
                white-space: nowrap;
                top: -35px;
                left: 0;
            }
            
            .simple-edit-mode [contenteditable="true"]:hover .edit-tooltip {
                opacity: 1;
            }
            
            /* 页面偏移 */
            body.simple-editor-active {
                padding-top: 80px;
            }
            
            /* 响应式 */
            @media (max-width: 768px) {
                .simple-toolbar-content {
                    flex-direction: column;
                    gap: 10px;
                    padding: 10px;
                }
                
                .toolbar-left {
                    flex-wrap: wrap;
                    justify-content: center;
                }
                
                .simple-btn .text {
                    display: none;
                }
                
                body.simple-editor-active {
                    padding-top: 120px;
                }
                
                .edit-hint {
                    font-size: 12px;
                    text-align: center;
                }
            }
        `;
        
        document.head.appendChild(style);
        document.body.appendChild(toolbar);
        document.body.classList.add('simple-editor-active');
        
        // 绑定事件
        document.getElementById('start-edit').addEventListener('click', toggleEditMode);
        document.getElementById('save-changes').addEventListener('click', saveChanges);
        document.getElementById('cancel-edit').addEventListener('click', cancelEdit);
    }
    
    // 让文字可编辑
    function makeTextEditable() {
        // 选择所有文字元素
        const textElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, div, a');
        
        textElements.forEach(element => {
            // 跳过工具栏和特殊元素
            if (element.closest('#simple-toolbar') || 
                element.closest('script') || 
                element.closest('style') ||
                element.querySelector('img') ||
                element.querySelector('input') ||
                element.querySelector('button') ||
                element.textContent.trim() === '') {
                return;
            }
            
            // 只处理直接包含文字的元素
            if (element.children.length === 0 || 
                (element.children.length === 1 && element.children[0].tagName === 'BR')) {
                
                element.setAttribute('data-original-text', element.textContent);
                element.setAttribute('data-editable', 'true');
                
                // 添加编辑提示
                element.style.position = 'relative';
                const tooltip = document.createElement('div');
                tooltip.className = 'edit-tooltip';
                tooltip.textContent = '点击编辑文字';
                element.appendChild(tooltip);
            }
        });
    }
    
    // 切换编辑模式
    function toggleEditMode() {
        isEditMode = !isEditMode;
        const startBtn = document.getElementById('start-edit');
        const saveBtn = document.getElementById('save-changes');
        const cancelBtn = document.getElementById('cancel-edit');
        const hint = document.getElementById('edit-hint');
        
        if (isEditMode) {
            // 进入编辑模式
            document.body.classList.add('simple-edit-mode');
            startBtn.innerHTML = '<span class="icon">👁️</span><span class="text">退出编辑</span>';
            startBtn.classList.remove('primary');
            saveBtn.disabled = false;
            cancelBtn.disabled = false;
            hint.style.display = 'block';
            
            // 让所有文字可编辑
            document.querySelectorAll('[data-editable="true"]').forEach(element => {
                element.contentEditable = true;
                element.addEventListener('input', trackChanges);
            });
            
            showMessage('✏️ 编辑模式已开启！直接点击文字就能编辑', 'success');
            
        } else {
            // 退出编辑模式
            document.body.classList.remove('simple-edit-mode');
            startBtn.innerHTML = '<span class="icon">✏️</span><span class="text">开始编辑</span>';
            startBtn.classList.add('primary');
            saveBtn.disabled = true;
            cancelBtn.disabled = true;
            hint.style.display = 'none';
            
            // 禁用编辑
            document.querySelectorAll('[data-editable="true"]').forEach(element => {
                element.contentEditable = false;
                element.removeEventListener('input', trackChanges);
            });
            
            showMessage('👁️ 编辑模式已关闭', 'info');
        }
    }
    
    // 跟踪更改
    function trackChanges(event) {
        const element = event.target;
        const originalText = element.getAttribute('data-original-text');
        const currentText = element.textContent;
        
        if (originalText !== currentText) {
            // 记录更改
            const existingChange = changes.find(change => change.element === element);
            if (existingChange) {
                existingChange.newText = currentText;
            } else {
                changes.push({
                    element: element,
                    originalText: originalText,
                    newText: currentText
                });
            }
            
            // 更新保存按钮状态
            const saveBtn = document.getElementById('save-changes');
            saveBtn.style.background = '#FF5722';
            saveBtn.style.animation = 'pulse 1s infinite';
        }
    }
    
    // 保存更改
    function saveChanges() {
        if (changes.length === 0) {
            showMessage('📝 没有需要保存的更改', 'info');
            return;
        }
        
        // 这里可以集成GitHub API或其他保存方式
        // 现在先更新原始文本属性
        changes.forEach(change => {
            change.element.setAttribute('data-original-text', change.newText);
        });
        
        showMessage(`💾 已保存 ${changes.length} 项更改！`, 'success');
        
        // 清空更改记录
        changes = [];
        
        // 重置保存按钮
        const saveBtn = document.getElementById('save-changes');
        saveBtn.style.background = '';
        saveBtn.style.animation = '';
        
        // 可以在这里添加实际的保存逻辑
        // 比如调用GitHub API或发送到服务器
    }
    
    // 取消编辑
    function cancelEdit() {
        if (changes.length > 0) {
            if (confirm(`你有 ${changes.length} 项未保存的更改，确定要取消吗？`)) {
                // 恢复原始文本
                changes.forEach(change => {
                    change.element.textContent = change.originalText;
                });
                changes = [];
                showMessage('❌ 已取消所有更改', 'info');
            } else {
                return;
            }
        }
        
        // 退出编辑模式
        toggleEditMode();
    }
    
    // 显示消息
    function showMessage(message, type = 'success') {
        const colors = {
            success: '#4CAF50',
            error: '#F44336',
            info: '#2196F3'
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
        document.addEventListener('DOMContentLoaded', initSimpleEditor);
    } else {
        initSimpleEditor();
    }
    
    // 暴露全局函数
    window.simpleEditor = {
        toggle: toggleEditMode,
        save: saveChanges,
        getChanges: () => changes
    };
    
})();

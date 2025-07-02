// 全局可视化编辑器 - 直接在网站上编辑文字
(function() {
    'use strict';
    
    let isEditMode = false;
    let editableElements = [];
    let changes = [];
    
    // 创建编辑器控制面板
    function createEditorPanel() {
        const panel = document.createElement('div');
        panel.id = 'visual-editor-panel';
        panel.innerHTML = `
            <div style="
                position: fixed;
                top: 20px;
                right: 20px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 15px 20px;
                border-radius: 10px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                z-index: 999999;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                font-size: 14px;
                min-width: 200px;
            ">
                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                    <span style="font-weight: bold;">🎨 可视化编辑</span>
                    <button id="toggle-edit-btn" style="
                        background: rgba(255,255,255,0.2);
                        border: 1px solid rgba(255,255,255,0.3);
                        color: white;
                        padding: 5px 12px;
                        border-radius: 5px;
                        cursor: pointer;
                        font-size: 12px;
                    ">开始编辑</button>
                </div>
                <div id="edit-status" style="font-size: 12px; opacity: 0.9;">点击"开始编辑"激活实时保存模式</div>
                <div id="edit-actions" style="margin-top: 10px; display: none;">
                    <button id="save-changes-btn" style="
                        background: #48bb78;
                        border: none;
                        color: white;
                        padding: 8px 15px;
                        border-radius: 5px;
                        cursor: pointer;
                        font-size: 12px;
                        margin-right: 8px;
                    ">💾 保存修改</button>
                    <button id="reset-changes-btn" style="
                        background: #f56565;
                        border: none;
                        color: white;
                        padding: 8px 15px;
                        border-radius: 5px;
                        cursor: pointer;
                        font-size: 12px;
                        margin-right: 8px;
                    ">🔄 重置</button>
                    <button id="backup-manager-btn" style="
                        background: #805ad5;
                        border: none;
                        color: white;
                        padding: 8px 15px;
                        border-radius: 5px;
                        cursor: pointer;
                        font-size: 12px;
                    ">📂 备份</button>
                </div>
                <div id="changes-count" style="font-size: 11px; margin-top: 8px; opacity: 0.8;"></div>
            </div>
        `;
        
        document.body.appendChild(panel);
        
        // 绑定事件
        document.getElementById('toggle-edit-btn').onclick = toggleEditMode;
        document.getElementById('save-changes-btn').onclick = saveChanges;
        document.getElementById('reset-changes-btn').onclick = resetChanges;
        document.getElementById('backup-manager-btn').onclick = showBackupManager;
    }
    
    // 添加编辑器样式
    function addEditorStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .visual-editable {
                outline: 2px dashed #667eea !important;
                cursor: pointer !important;
                position: relative !important;
                transition: all 0.3s ease !important;
                min-height: 20px !important;
            }
            .visual-editable:hover {
                outline-color: #48bb78 !important;
                background: rgba(72, 187, 120, 0.1) !important;
            }
            .visual-editing {
                outline: 2px solid #ed8936 !important;
                background: rgba(237, 137, 54, 0.1) !important;
            }
            .visual-edit-tooltip {
                position: absolute;
                top: -30px;
                left: 0;
                background: #2d3748;
                color: white;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 11px;
                z-index: 999998;
                pointer-events: none;
                white-space: nowrap;
            }
            .visual-changed {
                outline-color: #48bb78 !important;
                background: rgba(72, 187, 120, 0.05) !important;
            }
        `;
        document.head.appendChild(style);
    }
    
    // 切换编辑模式
    function toggleEditMode() {
        if (isEditMode) {
            stopEditMode();
        } else {
            startEditMode();
        }
    }
    
    // 开始编辑模式
    function startEditMode() {
        isEditMode = true;
        
        // 更新UI
        const btn = document.getElementById('toggle-edit-btn');
        const status = document.getElementById('edit-status');
        const actions = document.getElementById('edit-actions');
        
        btn.textContent = '停止编辑';
        btn.style.background = '#f56565';
        status.textContent = '实时保存模式已激活 - 修改会自动保存到本地文件';
        actions.style.display = 'block';
        
        // 找到所有可编辑的文本元素
        findEditableElements();
        
        // 使元素可编辑
        makeElementsEditable();
        
        updateChangesCount();
    }
    
    // 停止编辑模式
    function stopEditMode() {
        isEditMode = false;
        
        // 更新UI
        const btn = document.getElementById('toggle-edit-btn');
        const status = document.getElementById('edit-status');
        const actions = document.getElementById('edit-actions');
        
        btn.textContent = '开始编辑';
        btn.style.background = 'rgba(255,255,255,0.2)';
        status.textContent = '编辑模式已关闭';
        actions.style.display = 'none';
        
        // 移除编辑状态
        removeEditableState();
    }
    
    // 找到可编辑元素
    function findEditableElements() {
        editableElements = [];
        
        // 选择所有包含文本的元素
        const textSelectors = [
            'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
            'p', 'span', 'a', 'li', 'td', 'th',
            'div', 'section', 'article', 'header',
            'footer', 'nav', 'aside', 'main'
        ];
        
        textSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
                // 跳过编辑器面板本身
                if (element.closest('#visual-editor-panel')) return;
                
                // 只选择直接包含文本的元素（没有子元素或只有简单子元素）
                if (hasEditableText(element) && !element.classList.contains('visual-editable')) {
                    editableElements.push(element);
                }
            });
        });
        
        console.log(`找到 ${editableElements.length} 个可编辑元素`);
    }
    
    // 检查元素是否包含可编辑文本
    function hasEditableText(element) {
        const text = element.textContent.trim();
        if (!text) return false;
        
        // 如果元素只包含文本，直接可编辑
        if (element.children.length === 0) return true;
        
        // 如果包含子元素，检查是否主要是文本内容
        const childElements = Array.from(element.children);
        const hasComplexChildren = childElements.some(child => 
            child.tagName.toLowerCase() !== 'span' && 
            child.tagName.toLowerCase() !== 'strong' && 
            child.tagName.toLowerCase() !== 'em' &&
            child.tagName.toLowerCase() !== 'b' &&
            child.tagName.toLowerCase() !== 'i'
        );
        
        return !hasComplexChildren && text.length > 0;
    }
    
    // 使元素可编辑
    function makeElementsEditable() {
        editableElements.forEach(element => {
            element.classList.add('visual-editable');
            element.contentEditable = true;
            element.setAttribute('data-original-text', element.textContent.trim());
            
            // 添加事件监听器
            addElementEvents(element);
        });
    }
    
    // 添加元素事件
    function addElementEvents(element) {
        // 鼠标悬停提示
        element.addEventListener('mouseenter', function() {
            if (!isEditMode) return;
            
            if (!this.querySelector('.visual-edit-tooltip')) {
                const tooltip = document.createElement('div');
                tooltip.className = 'visual-edit-tooltip';
                tooltip.textContent = '点击编辑 - 实时保存';
                this.appendChild(tooltip);
            }
        });
        
        element.addEventListener('mouseleave', function() {
            const tooltip = this.querySelector('.visual-edit-tooltip');
            if (tooltip) tooltip.remove();
        });
        
        // 编辑状态
        element.addEventListener('focus', function() {
            this.classList.add('visual-editing');
            const tooltip = this.querySelector('.visual-edit-tooltip');
            if (tooltip) tooltip.remove();
        });
        
        element.addEventListener('blur', function() {
            this.classList.remove('visual-editing');
            recordChange(this);
            // 实时保存修改到本地文件
            autoSaveChange(this);
        });
        
        // 键盘事件
        element.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.blur();
            }
            if (e.key === 'Escape') {
                this.textContent = this.getAttribute('data-original-text');
                this.blur();
            }
        });
        
        // 输入事件
        element.addEventListener('input', function() {
            recordChange(this);
        });
    }
    
    // 记录修改
    function recordChange(element) {
        const originalText = element.getAttribute('data-original-text');
        const currentText = element.textContent.trim();
        
        if (originalText !== currentText) {
            element.classList.add('visual-changed');
            
            // 更新或添加修改记录
            const existingChange = changes.find(change => change.element === element);
            if (existingChange) {
                existingChange.newText = currentText;
            } else {
                changes.push({
                    element: element,
                    originalText: originalText,
                    newText: currentText,
                    selector: getElementSelector(element)
                });
            }
        } else {
            element.classList.remove('visual-changed');
            // 移除修改记录
            changes = changes.filter(change => change.element !== element);
        }
        
        updateChangesCount();
    }
    
    // 获取元素选择器
    function getElementSelector(element) {
        if (element.id) return `#${element.id}`;
        
        let selector = element.tagName.toLowerCase();
        if (element.className) {
            selector += '.' + element.className.split(' ').join('.');
        }
        
        return selector;
    }
    
    // 更新修改计数
    function updateChangesCount() {
        const countElement = document.getElementById('changes-count');
        if (changes.length > 0) {
            countElement.textContent = `已修改 ${changes.length} 处文字`;
            countElement.style.color = '#48bb78';
        } else {
            countElement.textContent = '暂无修改';
            countElement.style.color = 'rgba(255,255,255,0.6)';
        }
    }
    
    // 保存修改
    async function saveChanges() {
        if (changes.length === 0) {
            alert('没有需要保存的修改');
            return;
        }

        const confirmSave = confirm(`确定要保存 ${changes.length} 处修改吗？\n\n修改将永久应用到网站文件中。`);
        if (!confirmSave) return;

        // 更新状态
        updateStatus('正在保存修改...');

        try {
            // 准备修改数据
            const changesData = changes.map(change => ({
                originalText: change.originalText,
                newText: change.newText,
                selector: change.selector
            }));

            console.log('发送修改到后端:', changesData);

            // 发送到后端API
            const response = await fetch('http://localhost:3001/api/apply-changes/index.html', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    changes: changesData
                })
            });

            const result = await response.json();

            if (result.success) {
                alert(`✅ 保存成功！\n\n• 已保存 ${result.changesCount} 处修改\n• 备份文件: ${result.backup}\n• 修改已应用到 ${result.filename}`);

                // 更新原始文本
                changes.forEach(change => {
                    change.element.setAttribute('data-original-text', change.newText);
                    change.element.classList.remove('visual-changed');
                });

                changes = [];
                updateChangesCount();
                updateStatus('修改已保存');

                // 提示刷新页面查看效果
                const refresh = confirm('修改已保存到文件！\n\n是否刷新页面查看最新效果？');
                if (refresh) {
                    window.location.reload();
                }

            } else {
                throw new Error(result.error || '保存失败');
            }

        } catch (error) {
            console.error('保存失败:', error);

            let errorMessage = '保存失败: ' + error.message;
            if (error.message.includes('fetch')) {
                errorMessage = '无法连接到后端服务器！\n\n请确保:\n1. 已安装Node.js依赖 (npm install)\n2. 后端服务器正在运行 (npm start)\n3. 服务器地址: http://localhost:3001';
            }

            alert('❌ ' + errorMessage);
            updateStatus('保存失败');
        }
    }

    // 更新状态显示
    function updateStatus(message) {
        const status = document.getElementById('edit-status');
        if (status) {
            status.textContent = message;
        }
    }

    // 实时自动保存单个修改
    async function autoSaveChange(element) {
        const originalText = element.getAttribute('data-original-text');
        const currentText = element.textContent.trim();

        // 如果没有实际修改，不保存
        if (originalText === currentText) {
            return;
        }

        try {
            updateStatus('正在保存修改...');

            // 准备单个修改数据
            const changeData = [{
                originalText: originalText,
                newText: currentText,
                selector: getElementSelector(element)
            }];

            console.log('实时保存修改:', changeData);

            // 发送到后端API
            const response = await fetch('http://localhost:3001/api/apply-changes/index.html', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    changes: changeData
                })
            });

            const result = await response.json();

            if (result.success) {
                // 更新原始文本，避免重复保存
                element.setAttribute('data-original-text', currentText);
                element.classList.remove('visual-changed');

                // 从changes数组中移除这个修改
                changes = changes.filter(change => change.element !== element);
                updateChangesCount();

                updateStatus(`✅ 已保存: "${currentText.substring(0, 20)}${currentText.length > 20 ? '...' : ''}"`);

                // 3秒后恢复状态
                setTimeout(() => {
                    updateStatus('编辑模式已激活 - 修改会实时保存到本地文件');
                }, 3000);

                console.log('✅ 实时保存成功:', result);

            } else {
                throw new Error(result.error || '保存失败');
            }

        } catch (error) {
            console.error('实时保存失败:', error);

            // 保存失败时保持修改状态
            element.classList.add('visual-changed');

            let errorMessage = '实时保存失败: ' + error.message;
            if (error.message.includes('fetch')) {
                errorMessage = '无法连接到后端服务器';
            }

            updateStatus('❌ ' + errorMessage);

            // 5秒后恢复状态
            setTimeout(() => {
                updateStatus('编辑模式已激活 - 点击文字进行编辑');
            }, 5000);
        }
    }
    
    // 重置修改
    function resetChanges() {
        if (changes.length === 0) {
            alert('没有需要重置的修改');
            return;
        }
        
        const confirmReset = confirm(`确定要重置所有修改吗？\n\n这将撤销 ${changes.length} 处修改。`);
        if (confirmReset) {
            changes.forEach(change => {
                change.element.textContent = change.originalText;
                change.element.classList.remove('visual-changed');
            });
            
            changes = [];
            updateChangesCount();
        }
    }
    
    // 移除编辑状态
    function removeEditableState() {
        editableElements.forEach(element => {
            element.classList.remove('visual-editable', 'visual-editing', 'visual-changed');
            element.contentEditable = false;
            element.removeAttribute('data-original-text');
            
            // 移除提示
            const tooltip = element.querySelector('.visual-edit-tooltip');
            if (tooltip) tooltip.remove();
        });
    }
    
    // 初始化编辑器
    function initEditor() {
        // 等待页面完全加载
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function() {
                setTimeout(initEditor, 1000);
            });
            return;
        }
        
        addEditorStyles();
        createEditorPanel();
        
        console.log('🎨 全局可视化编辑器已加载');
    }
    
    // 显示备份管理器
    async function showBackupManager() {
        try {
            // 获取备份列表
            const response = await fetch('http://localhost:3001/api/backups');
            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error || '获取备份列表失败');
            }

            // 创建备份管理器窗口
            const modal = document.createElement('div');
            modal.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.5);
                z-index: 1000000;
                display: flex;
                align-items: center;
                justify-content: center;
            `;

            const backupList = result.backups.map(backup => {
                const date = new Date(backup.created).toLocaleString('zh-CN');
                const size = (backup.size / 1024).toFixed(1) + ' KB';
                return `
                    <div style="
                        padding: 10px;
                        border: 1px solid #e2e8f0;
                        border-radius: 5px;
                        margin-bottom: 10px;
                        background: white;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    ">
                        <div>
                            <div style="font-weight: bold; color: #2d3748;">${backup.filename}</div>
                            <div style="font-size: 12px; color: #718096;">${date} • ${size}</div>
                        </div>
                        <button onclick="restoreBackup('${backup.filename}')" style="
                            background: #48bb78;
                            color: white;
                            border: none;
                            padding: 5px 10px;
                            border-radius: 3px;
                            cursor: pointer;
                            font-size: 12px;
                        ">恢复</button>
                    </div>
                `;
            }).join('');

            modal.innerHTML = `
                <div style="
                    background: white;
                    border-radius: 10px;
                    padding: 20px;
                    max-width: 600px;
                    width: 90%;
                    max-height: 80%;
                    overflow-y: auto;
                ">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                        <h3 style="margin: 0; color: #2d3748;">📂 备份管理器</h3>
                        <button onclick="this.closest('.backup-modal').remove()" style="
                            background: none;
                            border: none;
                            font-size: 20px;
                            cursor: pointer;
                            color: #718096;
                        ">×</button>
                    </div>

                    <div style="margin-bottom: 15px; padding: 10px; background: #f7fafc; border-radius: 5px;">
                        <div style="font-size: 14px; color: #2d3748; margin-bottom: 5px;">
                            📊 备份统计: 共 ${result.backups.length} 个备份文件
                        </div>
                        <div style="font-size: 12px; color: #718096;">
                            💡 每次保存修改时会自动创建备份，确保数据安全
                        </div>
                    </div>

                    <div style="max-height: 400px; overflow-y: auto;">
                        ${backupList || '<div style="text-align: center; color: #718096; padding: 20px;">暂无备份文件</div>'}
                    </div>
                </div>
            `;

            modal.className = 'backup-modal';
            document.body.appendChild(modal);

            // 全局恢复函数
            window.restoreBackup = async function(backupFilename) {
                const confirmRestore = confirm(`确定要恢复备份吗？\n\n备份文件: ${backupFilename}\n\n当前网站内容将被替换，此操作不可撤销！`);
                if (!confirmRestore) return;

                try {
                    const response = await fetch(`http://localhost:3001/api/restore/${backupFilename}`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            targetFilename: 'index.html'
                        })
                    });

                    const result = await response.json();

                    if (result.success) {
                        alert(`✅ 备份恢复成功！\n\n已恢复: ${result.restored}\n目标文件: ${result.target}`);
                        modal.remove();

                        // 刷新页面
                        const refresh = confirm('备份已恢复！\n\n是否刷新页面查看恢复后的内容？');
                        if (refresh) {
                            window.location.reload();
                        }
                    } else {
                        throw new Error(result.error || '恢复失败');
                    }

                } catch (error) {
                    console.error('恢复备份失败:', error);
                    alert('❌ 恢复备份失败: ' + error.message);
                }
            };

            // 点击背景关闭
            modal.onclick = function(e) {
                if (e.target === modal) {
                    modal.remove();
                }
            };

        } catch (error) {
            console.error('获取备份列表失败:', error);

            let errorMessage = '获取备份列表失败: ' + error.message;
            if (error.message.includes('fetch')) {
                errorMessage = '无法连接到后端服务器！\n\n请确保后端服务器正在运行。';
            }

            alert('❌ ' + errorMessage);
        }
    }

    // 启动编辑器
    initEditor();

})();

# 🌐 Netlify可视化编辑器部署指南

## 🎯 概述

这个编辑器专为Netlify部署的静态网站设计，通过GitHub API直接修改仓库文件，实现真正的线上内容编辑。

### ✨ 核心优势
- **无需服务器** - 纯前端解决方案，完美适配Netlify
- **直接修改源码** - 通过GitHub API修改仓库文件
- **自动部署** - Netlify检测到更改后自动重新部署
- **可视化编辑** - 直接在网站上点击编辑
- **安全可靠** - 使用GitHub Personal Access Token认证

## 🚀 部署步骤

### 第一步：准备GitHub仓库
1. 确保你的网站代码已推送到GitHub仓库
2. 记录仓库信息：
   - 仓库所有者（用户名或组织名）
   - 仓库名称
   - 主分支名称（通常是`main`或`master`）

### 第二步：获取GitHub Personal Access Token
1. 访问 [GitHub Settings > Developer settings > Personal access tokens](https://github.com/settings/tokens)
2. 点击 **"Generate new token (classic)"**
3. 设置Token名称，如：`Netlify Editor Token`
4. 选择权限：
   - ✅ **repo** (完整仓库访问权限)
   - ✅ **repo:status** (访问提交状态)
   - ✅ **public_repo** (访问公共仓库)
5. 点击 **"Generate token"**
6. **重要**：立即复制Token，页面刷新后将无法再次查看

### 第三步：部署到Netlify
1. 将整个项目推送到GitHub仓库
2. 在Netlify中连接你的GitHub仓库
3. 设置构建配置：
   ```
   Build command: (留空或根据需要设置)
   Publish directory: . (或你的网站根目录)
   ```
4. 部署网站

### 第四步：配置编辑器
1. 访问你的Netlify网站：`https://your-site.netlify.app/admin/`
2. 选择 **"Netlify编辑器"**
3. 在配置对话框中输入：
   - **GitHub Personal Access Token**: 第二步获取的Token
   - **仓库所有者**: 你的GitHub用户名或组织名
   - **仓库名称**: 仓库名称
   - **分支名称**: 主分支名称（通常是`main`）
4. 点击 **"保存配置"**

## 🎨 使用方法

### 开始编辑
1. 访问 `https://your-site.netlify.app/admin/`
2. 选择 **"Netlify编辑器"**
3. 等待GitHub连接成功（绿色状态点）
4. 点击 **"开始编辑"** 按钮

### 编辑内容
1. **点击任何文字** - 页面上的可编辑文字会有蓝色虚线框
2. **修改内容** - 在弹出的编辑框中输入新内容
3. **发布到网站** - 点击 **"🚀 发布到网站"** 按钮
4. **自动部署** - Netlify检测到更改后自动重新部署（1-3分钟）

### 支持编辑的内容
- ✅ 网站标题和副标题
- ✅ 轮播图文字
- ✅ 关于我们内容
- ✅ 服务项目标题和描述
- ✅ 新闻标题和内容
- ✅ 联系信息
- ✅ 导航菜单文字

## 🔧 高级功能

### 批量编辑
1. 在编辑模式下修改多个内容
2. 点击工具栏的 **"发布到网站"** 按钮
3. 所有更改将一次性提交到GitHub

### 预览更改
- 点击 **"预览"** 按钮查看即将发布的更改列表
- 确认无误后再发布

### 撤销功能
- 点击 **"撤销"** 按钮撤销最近的更改
- 支持多步撤销

### 快捷键
- `Ctrl + S` - 发布当前编辑或批量发布
- `Ctrl + Z` - 撤销上一次更改
- `Ctrl + E` - 切换编辑模式
- `ESC` - 取消当前编辑

## 🔒 安全注意事项

### Token安全
- **妥善保管** GitHub Personal Access Token
- **定期更换** Token以提高安全性
- **最小权限** 只授予必要的仓库权限
- **及时撤销** 不再使用时立即删除Token

### 权限控制
- Token具有仓库写入权限，请谨慎使用
- 建议为编辑器创建专用的GitHub账户
- 考虑使用GitHub的分支保护规则

## 🔍 故障排除

### 常见问题

**Q: GitHub连接失败？**
A: 
1. 检查Token是否正确
2. 确认Token具有repo权限
3. 验证仓库信息是否正确
4. 检查网络连接

**Q: 发布失败？**
A: 
1. 确认GitHub连接状态为绿色
2. 检查仓库是否存在
3. 验证分支名称是否正确
4. 查看浏览器控制台错误信息

**Q: Netlify没有自动部署？**
A: 
1. 检查Netlify的部署设置
2. 确认GitHub webhook配置正确
3. 查看Netlify的部署日志
4. 手动触发部署测试

**Q: 编辑器无法加载？**
A: 
1. 检查网络连接
2. 清除浏览器缓存
3. 确认JavaScript已启用
4. 查看浏览器控制台错误

### 调试技巧
1. 打开浏览器开发者工具
2. 查看Console标签页的错误信息
3. 检查Network标签页的API请求
4. 验证GitHub API响应状态

## 📋 部署清单

### 部署前检查
- [ ] GitHub仓库已创建并推送代码
- [ ] 获得GitHub Personal Access Token
- [ ] Netlify账户已准备就绪
- [ ] 网站域名已配置（可选）

### 部署后验证
- [ ] 网站可以正常访问
- [ ] 管理面板可以打开
- [ ] GitHub连接成功
- [ ] 编辑功能正常工作
- [ ] 自动部署正常触发

## 🆘 获取帮助

如果遇到问题：
1. 查看本文档的故障排除部分
2. 检查浏览器控制台错误信息
3. 验证GitHub和Netlify的配置
4. 确认网络连接正常

## 📚 相关资源

- [GitHub Personal Access Tokens 文档](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)
- [Netlify 部署文档](https://docs.netlify.com/site-deploys/create-deploys/)
- [GitHub API 文档](https://docs.github.com/en/rest)

---

**重要提示**：这个编辑器直接修改GitHub仓库文件，请在使用前做好备份！

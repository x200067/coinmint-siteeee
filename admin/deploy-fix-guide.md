# 🚀 一键部署编辑器 - 问题修复指南

## 📋 常见问题快速诊断

### 1. 🔑 Token权限问题

**症状：** 显示"401 Unauthorized"或"403 Forbidden"错误

**解决方案：**
1. **GitHub Token问题：**
   - 确保Token有`repo`权限
   - 检查Token是否过期（GitHub Token默认有效期1年）
   - 重新生成Token：GitHub Settings → Developer settings → Personal access tokens

2. **Netlify Token问题：**
   - 确保Token有`site:write`权限
   - 检查Token是否被撤销
   - 重新生成Token：Netlify User settings → Applications → Personal access tokens

### 2. 🌐 网络连接问题

**症状：** 显示"Network Error"或"Failed to fetch"

**解决方案：**
1. 检查网络连接
2. 确认可以访问GitHub和Netlify
3. 检查防火墙设置
4. 尝试使用VPN或更换网络

### 3. 📝 配置错误

**症状：** 显示"404 Not Found"或"Repository not found"

**解决方案：**
1. **GitHub配置检查：**
   - 用户名：确保是GitHub用户名，不是邮箱
   - 仓库名：确保仓库存在且有访问权限
   - 分支名：确保分支存在（通常是`main`或`master`）

2. **Netlify配置检查：**
   - Site ID：在Netlify站点设置中查找
   - 确保站点已连接到GitHub仓库

### 4. ⏰ Token过期

**症状：** 之前能用，现在突然不能用了

**解决方案：**
1. 重新生成GitHub Token
2. 重新生成Netlify Token
3. 更新配置中的Token

### 5. 🔄 部署状态检查

**症状：** 部署成功但网站没有更新

**解决方案：**
1. 等待1-3分钟（Netlify需要时间构建）
2. 检查Netlify部署日志
3. 清除浏览器缓存
4. 检查GitHub仓库是否有新的commit

## 🛠️ 逐步修复流程

### 步骤1：检查基本配置
```
1. 打开诊断工具
2. 查看配置状态
3. 确认所有必需字段已填写
```

### 步骤2：测试连接
```
1. 点击"测试配置"
2. 查看GitHub和Netlify连接状态
3. 根据错误信息调整配置
```

### 步骤3：重新配置
```
1. 如果测试失败，重新生成Token
2. 更新配置
3. 再次测试
```

### 步骤4：尝试部署
```
1. 进行小的文字修改
2. 点击一键部署
3. 观察错误信息
```

## 🔧 高级故障排除

### GitHub API限制
- GitHub API有速率限制
- 如果频繁部署可能触发限制
- 等待一小时后重试

### Netlify构建失败
- 检查Netlify构建日志
- 确认网站配置正确
- 检查依赖项是否完整

### 浏览器兼容性
- 使用现代浏览器（Chrome、Firefox、Safari、Edge）
- 启用JavaScript
- 禁用广告拦截器

## 📞 获取帮助

如果以上方法都无法解决问题：

1. **查看浏览器控制台：**
   - 按F12打开开发者工具
   - 查看Console标签页的错误信息
   - 截图发送给技术支持

2. **收集诊断信息：**
   - 使用诊断工具导出配置
   - 记录具体的错误信息
   - 说明操作步骤

3. **联系技术支持：**
   - 提供详细的错误描述
   - 包含浏览器和操作系统信息
   - 附上诊断工具的截图

## ✅ 预防措施

1. **定期检查Token状态**
2. **备份配置文件**
3. **测试部署流程**
4. **保持浏览器更新**
5. **定期清理浏览器缓存**

---

💡 **提示：** 大多数问题都是由Token权限或配置错误引起的。使用诊断工具可以快速定位问题！

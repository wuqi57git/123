# 启用 GitHub Pages 步骤

代码已成功推送到 GitHub！现在请按以下步骤启用在线访问：

## 方法1：通过网页界面（推荐）

1. 访问 https://github.com/wuqi57git/123
2. 点击 **Settings**（设置）选项卡
3. 滚动到 **GitHub Pages** 部分
4. 在 **Source** 下拉菜单中选择：
   - **Deploy from a branch**
5. 在 **Branch** 下拉菜单中选择：
   - **main** / **/(root)**
6. 点击 **Save**（保存）按钮

## 方法2：通过 GitHub API（可选）

如果方法1失败，可以使用以下API：

```bash
curl -X POST \
  -H "Authorization: token YOUR_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/repos/wuqi57git/123/pages \
  -d '{"build_type": "deploy"}'
```

## 访问游戏

启用后，等待约 2-5 分钟让 GitHub 部署完成，然后访问：

**https://wuqi57git.github.io/123/**

## 故障排除

如果 10 分钟后仍然无法访问：
1. 检查仓库 Settings → Pages 是否显示 "Your site is ready to be published"
2. 确认显示绿色 ✓ 图标
3. 尝试清除浏览器缓存或使用无痕模式

祝您游戏愉快！🎮

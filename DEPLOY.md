# Vercel 部署指南

## 步骤 1: 访问 Vercel
访问 [vercel.com](https://vercel.com) 并使用 GitHub 账号登录

## 步骤 2: 导入项目
1. 点击 "Add New..." → "Project"
2. 选择 `yuge1924/image-background-remover` 仓库
3. 点击 "Import"

## 步骤 3: 配置环境变量
在部署配置页面，添加环境变量：
- Key: `REMOVEBG_API_KEY`
- Value: `rCwUYGVSboZDnDAV2GZLPyeN`

## 步骤 4: 部署
点击 "Deploy" 按钮，等待部署完成（约2-3分钟）

## 步骤 5: 访问
部署完成后，Vercel 会提供一个 `.vercel.app` 域名，直接访问即可使用

## 注意事项
- 首次部署可能需要几分钟
- 每次 push 到 GitHub 会自动重新部署
- 免费版有使用限制，但足够个人使用

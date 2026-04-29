<p align="center">
  <img src="public/banner.png" alt="趣影 QuYing" width="720">
</p>

<h1 align="center">趣影 · QuYing</h1>

<p align="center">
  <strong>用一句话，拍一部片。</strong><br>
  一站式 AI 短剧 / 漫画影视创作平台 — 从小说文本到分镜成片，一气呵成。
</p>

<p align="center">
  <a href="README_en.md">English</a>
</p>

---

## ✨ 核心能力

- 🎬 **AI 剧本分析** — 自动解析小说，提取角色、场景、剧情线索
- 🎨 **角色 / 场景生成** — 高一致性的 AI 人物与场景图，支持系列化设定
- 📽️ **分镜制片** — 文字一键生成分镜，自动合成完整短剧视频
- 🎙️ **AI 配音** — 多角色语音合成，情感化朗读
- 🌐 **中英双语界面** — 右上角一键切换

---

## 🚀 快速部署

**前提条件**：[Docker Desktop](https://docs.docker.com/get-docker/)

### 方式一：克隆仓库 + Docker 自构建（推荐）

```bash
git clone <your-repo-url> quying
cd quying
docker compose up -d --build
```

更新版本：
```bash
git pull
docker compose down && docker compose up -d --build
```

> ⚠️ 当前为内测阶段，不同版本之间的数据库结构可能不兼容。升级前请先清理旧数据：
> ```bash
> docker compose down -v
> docker compose up -d --build
> ```
> 启动后请**清空浏览器缓存**并重新登录，避免旧版本前端缓存导致异常。

### 方式二：本地开发模式

```bash
git clone <your-repo-url> quying
cd quying

# 复制环境变量配置文件（必须在 npm install 之前完成）
cp .env.example .env
# ⚠️ 编辑 .env，填入你的 AI API Key（NEXTAUTH_URL 默认为 http://localhost:3000，无需修改）

npm install

# 只启动基础设施（MySQL / Redis / MinIO）
# 注意：docker-compose.yml 将服务映射到非标准端口，.env.example 已按此预设
# mysql:13306  redis:16379  minio:19000
docker compose up mysql redis minio -d

# 初始化数据库表结构（首次必须执行）
npx prisma db push

# 启动开发服务器
npm run dev
```

> [!WARNING]
> 跳过 `npx prisma db push` 会导致数据库表不存在，启动后报错 `The table 'tasks' does not exist`。请务必先执行此命令。

访问 [http://localhost:13000](http://localhost:13000)（Docker 模式）或 [http://localhost:3000](http://localhost:3000)（本地开发）开始使用！

> [!TIP]
> **如果遇到网页卡顿**：HTTP 模式下浏览器可能限制并发连接。可安装 [Caddy](https://caddyserver.com/docs/install) 启用 HTTPS：
> ```bash
> caddy run --config Caddyfile
> ```
> 然后访问 [https://localhost:1443](https://localhost:1443)

---

## 🔧 API 配置

启动后进入**设置中心**配置 AI 服务的 API Key，内置详细的配置教程。

> 💡 **建议**：目前推荐使用各服务商的官方 API。第三方兼容格式（OpenAI Compatible）的支持还在打磨中，后续版本会持续优化。

---

## 📦 技术栈

- **框架**：Next.js 15 + React 19
- **数据库**：MySQL + Prisma ORM
- **任务队列**：Redis + BullMQ
- **样式**：Tailwind CSS v4 + 趣影自有视觉系统
- **认证**：NextAuth.js
- **AI Providers**：OpenAI · Google Gemini · OpenRouter · fal.ai · 等

---

## 🎨 设计语言

趣影使用「胶片感 · 暖纸 · 夕阳橙」的视觉系统，与传统蓝紫 SaaS 风格刻意拉开距离：

| 角色 | 色值 |
|---|---|
| 画布 | `#F5F1EA` 米纸 |
| 主文 | `#1A1A1F` 胶片黑 |
| 品牌色 | `#FF6A3D` 夕阳橙 |
| 副色 | `#2F4A3F` 胶片绿 |

中文 Display 字体使用思源宋体（电影海报感），UI 字体使用 Geist Sans。

---

## 🤝 反馈

- 提交 Issue 反馈 Bug 或功能建议
- 提交 Pull Request 参与共建

---

**Made with ❤️ — 趣影 QuYing 团队**

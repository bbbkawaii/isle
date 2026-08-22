# 岛屿人格测试 · 黑客松 Demo

互动情境游戏 × 人格匹配 × 线下活动。你的选择会把你带到岛屿的不同角落——你住在哪，你就是谁；两个人的匹配，看的是动线会不会天然相遇。

## 产品链路（评委 5 分钟路径）

```
登岛开局（五幕游戏，测评藏在剧情里）
→ 岛屿人格报告（七种岛民身份 + 恋爱画像 + "你会遇见谁"钩子）
→ 登岛登记（硬门槛：性别/年龄/城市双向判定，先玩后登记）
→ 候选池（第一层：航线检查）
→ 心动 → 双向心动 → 匹配详情
   （相遇指数 + 相遇叙事 + ★迷雾夜对照：TA 的慌有没有人接）
→ 发起邀约（AI 活动卡 + AI 邀请语）
→ 切换到 TA 的视角（接受 / 换一个附理由 / 婉拒）
→ 成局 · 赴约卡（线下终章锁定，到达现场解锁）
```

## 技术栈

- Next.js 16（App Router）+ TypeScript + Tailwind CSS 4 + Framer Motion + lucide-react
- Prisma + Supabase Postgres（生产）；Vercel 通过 Supavisor transaction pooler 连接
- LLM：OpenAI 兼容 API（可选），未配置或超时 8s 自动回退预生成文案，演示永不翻车

## 本地运行

```bash
pnpm install
pnpm db:push        # 建库
pnpm db:seed        # 3 条活动 + 21 个种子岛民（七种身份 × 3）
pnpm build && pnpm start   # 生产模式（推荐演示用）
# 或 pnpm dev
```

手机同 WiFi 访问：`pnpm start -- -H 0.0.0.0`，手机访问 `http://<电脑IP>:3000`。

## 上场前重置

```bash
pnpm demo:reset     # 删库重建 + 重新 seed，评委看到的是干净数据
```

## LLM 配置（可选）

`.env.local` 填入任意 OpenAI 兼容服务（含 /v1 写全路径）：

```
LLM_BASE_URL=https://api.xxx.com/v1
LLM_API_KEY=sk-xxx
LLM_MODEL=xxx
```

不填 = 全部走预生成兜底（身份画像用 identities.ts 内置文案，叙事用动线+判词拼接）。调用的三个文案：恋爱画像、相遇叙事、邀请语。

## 线上部署（Vercel + Supabase）

本仓库已使用 PostgreSQL schema。生产项目连接 `Supabase`，Vercel 环境变量仅需保存：

- `DATABASE_URL`：Supavisor transaction pooler（端口 6543），并带 `pgbouncer=true&connection_limit=1&sslmode=require`；适合无服务器 API 路由。
- `LLM_*`、`AVATAR_*`：可选；未配置时会回退到内置文案和默认头像流程。

初始化数据时，使用同一项目的 Session pooler（端口 5432）运行：

```bash
DATABASE_URL="<5432 session pooler>" pnpm db:push
DATABASE_URL="<5432 session pooler>" pnpm db:seed
```

用户转绘头像以 data URL 存入数据库，兼容 Vercel 的只读文件系统。

## 邮箱账号说明

- 注册：登岛登记时填邮箱 + 密码（≥6 位，无验证码），bcrypt 哈希存库，email 唯一
- 登录：`/login`（捏脸页右上角、退出登录后可进），成功后恢复 userId/形象/性别/最新一局
- 种子 NPC 无邮箱，不受影响

## 演示技巧

- 评委手机扫码直接玩；单人也能走通全链路（种子岛民会自动回应心动）
- 两位评委各玩一条线后互刷心动 = 真双向匹配现场
- 切 TA 视角是演示双向确认的手法；「换一个 + 附理由」体现协商而非拒绝
- 答辩重点：迷雾夜对照（互补匹配的差异化）、先玩后登记的转化设计、双向门槛

## 双引擎游戏体系

**① 登岛五幕**（主线，首页入口 `/play`）：岛灵台词 + 选项 → 岛屿人格报告 → 登岛登记（邮箱+密码）→ 按契合指数配对。规则/判词/文案在 `src/data/game.json`。

**② 游戏广场**（Tab「游戏」`/games`）：来自 vane 项目的 DAG 剧情引擎——`dialog` 点击推进 / `choice` 分支选择（`match_point` 参与匹配）/ `ending` 多结局，男女双视角（选项 id 一致保证可比）。玩完按**选择重合度**匹配异性（相同选择 ÷ 匹配点），重合度 ≥66% 可直接心动进入屿见配对链路。

- 剧情 JSON：`src/data/vane/*.json`（新增游戏=丢一个 JSON 进目录）
- 引擎/加载层：`src/lib/content/vane-games.ts`；答案表 `VaneAnswer`（幂等）
- 匹配接口：`POST /api/vane/submit`（与 vane 的 Supabase RPC 同算法）
- 刷新续玩：进度存 localStorage，提交后清除

## 目录导览

```
src/data/game.json             ★ 全部游戏内容配置（见下）
src/lib/content/scenes.ts      五幕加载层（类型化 + 查询）
src/lib/content/identities.ts  岛民身份加载层（含判定函数）
src/lib/scoring.ts             匹配规则解释器（规则在 JSON）
src/lib/fogContrast.ts         迷雾对照加载层
src/lib/llm.ts                 LLM 调用 + 兜底（persona 在 JSON）
src/app/play                   GalGame 游戏页
src/app/                       首页推荐流 / 游戏 / 我的（底部 Tab）
src/app/report/[sessionId]     人格报告
src/app/register               登岛登记
src/app/candidates             候选池
src/app/match/[id]             匹配详情（迷雾夜对照）
src/app/invite/[matchId]       邀约全流程
src/app/islander/[userId]      岛民五幕轨迹页
prisma/seed.ts                 种子数据（内容读自 game.json）
public/bg, public/sprites      AI 生成的背景图与立绘
```

## game.json：一份文件改整个游戏

`src/data/game.json` 集中了所有可复用、可修改的游戏数据：

| 区块 | 内容 |
|---|---|
| `scenes` | 五幕：剧情、岛灵台词、提问、背景图路径、每个选项（文案/独白/图标/维度加分） |
| `identities` | 七种岛民：标签、兜底画像、预告钩子、动线、判定矩阵 |
| `fogContrast` | 迷雾夜 4×4 对照判词 |
| `matchRules` | 匹配规则（combo/pair/either/same 四种命中方式 + 加减分 + 解释文案） |
| `config` | 相遇指数基分与上下限 |
| `activities` | 预置活动（标题/时间/地点/破冰任务/适配身份） |
| `seed` | 种子岛民的昵称/城市/年份/学历 |
| `llm` | AI 文案的人设 prompt |

改完 `game.json` 后：`pnpm build` 生效；若改了 `identities`/`seed` 相关内容，跑 `pnpm demo:reset` 重建种子。换一套题材（宫斗/悬疑/职场）理论上只需替换此文件 + 背景图。

# Agentic Factory OS — TODO

## 设计系统与基础
- [x] 深空晶体暗色主题 CSS 变量体系（#0B0B0F 背景、#7C5CFC 品牌紫）
- [x] 全局 Framer Motion 动画集成
- [x] DashboardLayout 侧边栏导航（覆盖所有核心模块）
- [x] 响应式布局基础

## 数据库 Schema
- [x] projects 表（多租户项目）
- [x] agents 表（14职业代理人配置）
- [x] builds 表（构建历史记录）
- [x] build_logs 表（SSE构建日志）
- [x] evolution_cycles 表（自进化周期）
- [x] bug_reports 表（自愈扫描结果）
- [x] fix_proposals 表（自动修复PR）
- [x] subscriptions 表（订阅套餐）
- [x] earnings 表（收益记录）
- [x] moe_configs 表（MoE模型路由配置）

## 后端 tRPC 路由
- [x] projects 路由（CRUD、多租户隔离）
- [x] agents 路由（代理人状态、技能开关）
- [x] factory 路由（构建流水线、SSE日志流）
- [x] evolution 路由（进化周期、反馈收集）
- [x] maintenance 路由（扫描、修复PR、确认合并）
- [x] moe 路由（模型配置、智能调度）
- [x] subscription 路由（套餐管理）
- [x] earnings 路由（收益统计）
- [x] i18n 路由（语言切换——已通过 useI18n hook + locale 字段实现）

## 前端页面
- [x] 首页 Landing（品牌展示、CTA、功能亮点）
- [x] AI 构建流水线页（自然语言输入、SSE实时日志）
- [x] 14职业代理人协同面板
- [x] 3D 虚拟工作台（Three.js）
- [x] THMAI 自进化引擎面板
- [x] 自动维护自愈面板
- [x] MoE 多模型路由配置页
- [x] 商业变现模块（订阅、收益、Bazaar入口）
- [x] 项目管理页（多租户、知识库、构建历史）
- [x] 设置页（国际化、主题、API Key）

## 国际化
- [x] 中英双语支持（i18next）
- [x] 语言切换组件

## 测试
- [x] 后端路由单元测试
- [x] 前端关键组件测试

## LobeHub 风格功能模块（新增）
- [x] 助理管理页（Agent Builder - 创建/编辑/删除AI助理，设置系统提示词）
- [x] Skills 技能市场（技能包浏览、安装、管理，含10000+工具库入口）
- [x] MCP 集成管理页（MCP服务器配置、连接状态、工具调用统计）
- [x] 模型管理页（已接入模型列表、参数配置、基准测试）
- [x] 模型服务商配置页（API Key管理、服务商开关、自定义端点）
- [x] 免费AI模型集成（DeepSeek免费额度、Qwen、Gemini Flash、Groq等）
- [x] 助理对话页（基于选定助理和模型的完整对话界面）

## GitHub 自动化工厂（新增）
- [x] GitHub OAuth 授权集成（用户授权GitHub访问权限）
- [x] 自动创建仓库并推送AI生成代码
- [x] 构建完成后 Telegram 通知推送

## 数据库表（新增）
- [x] assistants 表（AI助理配置）
- [x] skills 表（技能包）
- [x] mcp_servers 表（MCP服务器配置）
- [x] model_providers 表（模型服务商）
- [x] conversations 表（对话历史）
- [x] messages 表（消息记录）

## 真实AI模型接入（新增）
- [x] 真实 DeepSeek API 调用（按所选模型路由）
- [x] 真实 Groq API 调用（超高速免费）
- [x] 真实 Gemini API 调用
- [x] GitHub OAuth 登录集成

## 管理后台（新增）
- [x] 管理后台路由保护（仅 admin 角色可访问）
- [x] 数据看板（用户数、构建数、收益统计、活跃趋势图）
- [x] 用户管理（列表、角色修改、订阅管理、封禁）
- [x] 订阅管理（套餐配置、用户订阅记录）
- [x] 支付配置（Stripe Key、支付宝/微信配置、手动充値）
- [x] 系统设置（平台名称、公告、模型白名单、API限流配置）
- [x] 构建日志监控（全局构建历史、错误统计）
- [x] admin_settings 数据库表

## 3D 工作台重构（新增）
- [x] 精美职业人型 Agent 3D 模型（每个 Agent 独特外观）
- [x] 多办公场景（会议室/开放办公/服务器机房/创意工作室）随机切换
- [x] Agent 对话气泡（构建时 Agent 说话动画）
- [x] 3D 工作台嵌入 AI 工厂页（输入框下方）
- [x] 场景切换动画效果

## 3D工作台终极升级
- [x] 每个Agent独特职业服装（安全架构师黑色风衣/合规法务官法袍/后端工程师工程服/AI导师卫衣/数据分析师白大褂/安全审计师战术背心）
- [x] Agent间项目沟通对话连线动画（发光连线+消息气泡+团队协作模拟）
- [x] ElevenLabs高质量AI语音API集成
- [x] 模型服务商页添加ElevenLabs配置入口
- [x] Agent语音ID映射配置

## 免费AI模型集成
- [x] 服务端多模型路由（DeepSeek/Groq/Gemini/Qwen/SiliconFlow）
- [x] 免费AI对话页面（全功能聊天+流式输出+模型切换）
- [x] 用户API Key管理（本地存储+服务端代理两种模式）
- [x] 免费额度展示（每个模型的免费限制说明）
- [x] AI工厂使用真实免费模型
- [x] 助理页面使用真实免费模型
- [x] 模型服务商页面添加一键测试功能

## 免费AI中心升级
- [x] conversations 表（对话历史）
- [x] messages 表（消息记录含图片）
- [x] SSE 流式输出后端接口（Express SSE endpoint）
- [x] 对话历史持久化（保存/加载/删除）
- [x] 对话历史侧边栏（列表+搜索+新建）
- [x] 图片上传与预览（支持 PNG/JPG/WebP）
- [x] Gemini 多模态图片理解（发送图片+文字给 Gemini）
- [x] 流式逐字显示效果

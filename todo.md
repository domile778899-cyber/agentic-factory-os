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

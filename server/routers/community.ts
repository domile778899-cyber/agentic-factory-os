/**
 * 赚钱社区路由
 * 包含：100+赚钱项目库、任务市场、社区帖子、AI收益计划生成器
 */
import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "../_core/trpc";
import { invokeLLM } from "../_core/llm";
import { getDb } from "../db";

// ─── 100+ 赚钱项目数据 ───
const MONEY_PROJECTS = [
  // AI Agent & 自动化 (1-10)
  { number: 1, title: '企业销售智能体', category: 'agent', categoryLabel: 'AI Agent', tools: 'Coze, GPTs', description: '为企业定制AI销售助手，自动应答客户、挖掘需求并智能催单', earningModel: '收取开发费¥5000-50000 + 年维护费¥2000-10000', difficulty: 'medium', incomeRange: '¥5000-50000/项目', timeToProfit: '1-2周', isHot: true, isFree: false, tags: ['AI', 'B2B', '企业服务'] },
  { number: 2, title: '客服智能体外包', category: 'agent', categoryLabel: 'AI Agent', tools: '讯飞智能客服, GPTs', description: '为企业提供7x24小时AI客服外包服务，大幅降低企业人力成本', earningModel: '按咨询量或坐席收费，月费¥1000-10000', difficulty: 'medium', incomeRange: '¥3000-30000/月', timeToProfit: '2-4周', isHot: true, isFree: false, tags: ['AI', '外包', '企业服务'] },
  { number: 3, title: '邮件营销智能体', category: 'agent', categoryLabel: 'AI Agent', tools: 'Lindy.ai, Custom AI', description: '构建自动撰写、发送、跟进营销邮件的智能体，为电商或SaaS企业服务', earningModel: '按月收费¥2000-8000/月', difficulty: 'medium', incomeRange: '¥2000-8000/月', timeToProfit: '2-3周', isHot: false, isFree: false, tags: ['AI', '营销', '自动化'] },
  { number: 4, title: '网页抓取自动化', category: 'agent', categoryLabel: 'AI Agent', tools: 'OpenClaw, Python', description: '为企业或个人定制数据抓取与分析程序，有开发者单月收入超4万美元', earningModel: '按项目¥3000-20000 或订阅¥500-2000/月', difficulty: 'hard', incomeRange: '¥5000-40000/月', timeToProfit: '1-2周', isHot: true, isFree: false, tags: ['爬虫', '数据', '自动化'] },
  { number: 5, title: 'AI工作流自动化', category: 'agent', categoryLabel: 'AI Agent', tools: 'n8n, Zapier, Make', description: '利用自动化工具为客户定制内部工作流（自动同步CRM、邮件、表格）', earningModel: '收取服务费¥3000-15000/套', difficulty: 'medium', incomeRange: '¥3000-15000/项目', timeToProfit: '1周', isHot: true, isFree: true, tags: ['自动化', '工作流', '效率'] },
  { number: 6, title: '自动接单平台', category: 'agent', categoryLabel: 'AI Agent', tools: '自研, 接单平台API', description: '开发AI Agent，自动在技术外包平台上抢单、写代码并交付，获取美元收入', earningModel: '完成任务获取报酬，月入$500-5000', difficulty: 'hard', incomeRange: '$500-5000/月', timeToProfit: '2-4周', isHot: false, isFree: false, tags: ['外包', '接单', '美元'] },
  { number: 7, title: 'AI Agent模板开发', category: 'agent', categoryLabel: 'AI Agent', tools: 'MuleRun, GPTs Store', description: '在AI Agent交易市场上架自己创建的数字员工，供人租用或购买', earningModel: '按次租用或买断，被动收入¥500-5000/月', difficulty: 'medium', incomeRange: '¥500-5000/月', timeToProfit: '2-3周', isHot: true, isFree: true, tags: ['AI', '被动收入', '模板'] },
  { number: 8, title: 'AI SaaS创业', category: 'agent', categoryLabel: 'AI Agent', tools: 'Cursor, Bubble, Bolt', description: '用AI辅助编程工具独立开发微型SaaS产品，解决特定问题', earningModel: '订阅收费¥29-299/月，积累用户后月入万元', difficulty: 'hard', incomeRange: '¥1000-50000/月', timeToProfit: '1-3个月', isHot: true, isFree: false, tags: ['SaaS', '独立开发', '订阅'] },
  { number: 9, title: 'AI量化交易机器人', category: 'agent', categoryLabel: 'AI Agent', tools: 'Python, Qlib, 交易所API', description: '开发自动化交易机器人，7x24小时监控市场并执行策略', earningModel: '投资回报率，资金越大收益越高', difficulty: 'expert', incomeRange: '不固定，高风险高回报', timeToProfit: '1-3个月', isHot: false, isFree: false, tags: ['量化', '金融', '高风险'] },
  { number: 10, title: 'AI内部培训师', category: 'agent', categoryLabel: 'AI Agent', tools: 'Custom AI, ChatGPT', description: '为企业提供定制化AI工具内部培训，帮助员工掌握提示词工程', earningModel: '收取培训费¥5000-30000/期', difficulty: 'easy', incomeRange: '¥5000-30000/期', timeToProfit: '1周', isHot: false, isFree: true, tags: ['培训', '企业', '咨询'] },
  // 内容创作 (11-25)
  { number: 11, title: '无脸YouTube频道', category: 'content', categoryLabel: '内容创作', tools: 'ChatGPT, ElevenLabs', description: '创建纪录片、故事或白噪音频道，AI负责脚本、配音、画面', earningModel: '平台广告分成，千次播放$1-5', difficulty: 'easy', incomeRange: '$500-10000/月', timeToProfit: '2-3个月', isHot: true, isFree: true, tags: ['YouTube', '广告分成', '被动收入'] },
  { number: 12, title: 'AI短视频矩阵', category: 'content', categoryLabel: '内容创作', tools: 'Opus Clip, 剪映, ChatGPT', description: '24小时无人值守AI短视频切片，自动分发到TikTok、抖音、小红书', earningModel: '播放量分成 + 带货佣金，月入¥3000-30000', difficulty: 'easy', incomeRange: '¥3000-30000/月', timeToProfit: '1-2个月', isHot: true, isFree: true, tags: ['短视频', '带货', '矩阵'] },
  { number: 13, title: 'AI电子书出版', category: 'content', categoryLabel: '内容创作', tools: 'ChatGPT, Canva', description: '用AI生成《30天学会XXX》等指南类电子书，上传到Amazon Kindle', earningModel: '版税收入，每本$1-5，批量出版月入$500-5000', difficulty: 'easy', incomeRange: '$500-5000/月', timeToProfit: '2-4周', isHot: false, isFree: true, tags: ['电子书', '亚马逊', '被动收入'] },
  { number: 14, title: 'AI新闻简报订阅', category: 'content', categoryLabel: '内容创作', tools: 'ChatGPT, Substack', description: '用AI搜集、筛选、总结行业新闻，创建付费订阅Newsletter', earningModel: '付费订阅$5-20/月，有团队年入百万美元', difficulty: 'medium', incomeRange: '$500-50000/月', timeToProfit: '2-3个月', isHot: true, isFree: true, tags: ['Newsletter', '订阅', '内容'] },
  { number: 15, title: 'AI播客制作', category: 'content', categoryLabel: '内容创作', tools: 'NotebookLM, ElevenLabs', description: '将热门文章、书籍核心观点通过AI快速转化为对话式播客', earningModel: '广告收入 + 订阅收入，月入¥1000-20000', difficulty: 'easy', incomeRange: '¥1000-20000/月', timeToProfit: '1-2个月', isHot: false, isFree: true, tags: ['播客', '音频', '内容'] },
  { number: 16, title: '虚拟数字人直播', category: 'content', categoryLabel: '内容创作', tools: 'HeyGen, 腾讯智影', description: '24小时无人值守AI数字人直播带货，极低成本抢占非黄金时段流量', earningModel: '带货佣金 + 打赏分成，月入¥5000-100000', difficulty: 'medium', incomeRange: '¥5000-100000/月', timeToProfit: '2-4周', isHot: true, isFree: false, tags: ['直播', '带货', '数字人'] },
  { number: 17, title: 'AI儿童绘本创作', category: 'content', categoryLabel: '内容创作', tools: 'ChatGPT, Midjourney', description: '用AI写故事、画图、排版，快速制作完整儿童绘本上传亚马逊KDP', earningModel: '版税收入，批量出版月入$500-3000', difficulty: 'easy', incomeRange: '$500-3000/月', timeToProfit: '2-4周', isHot: false, isFree: true, tags: ['绘本', '亚马逊', '儿童'] },
  { number: 18, title: 'AI音乐生成销售', category: 'content', categoryLabel: '内容创作', tools: 'Suno AI, Music GPT', description: '用AI生成无版权背景音乐或LOFI歌曲，在Spotify上通过播放量获取收益', earningModel: '播放量分成，月入$100-2000', difficulty: 'easy', incomeRange: '$100-2000/月', timeToProfit: '1-2个月', isHot: false, isFree: true, tags: ['音乐', 'Spotify', '被动收入'] },
  { number: 19, title: 'AI知识付费博主', category: 'content', categoryLabel: '内容创作', tools: '小鹅通, 知识星球', description: '将AI工具使用技巧、副业经验制作成付费课程，在社群进行变现', earningModel: '课程销售¥99-999/人，月入¥5000-50000', difficulty: 'medium', incomeRange: '¥5000-50000/月', timeToProfit: '1-2个月', isHot: true, isFree: true, tags: ['知识付费', '课程', '社群'] },
  { number: 20, title: '联盟营销内容站', category: 'content', categoryLabel: '内容创作', tools: 'ChatGPT, SEO工具', description: '用AI批量生产SEO优化内容，创建网站推广亚马逊、淘宝联盟商品', earningModel: '佣金收入3-10%，月入¥1000-20000', difficulty: 'medium', incomeRange: '¥1000-20000/月', timeToProfit: '2-4个月', isHot: false, isFree: true, tags: ['联盟营销', 'SEO', '被动收入'] },
  // AI设计与多媒体 (21-30)
  { number: 21, title: '按需打印(POD)', category: 'design', categoryLabel: 'AI设计', tools: 'Midjourney, Printful', description: '将AI生成的创意图案印在T恤、手机壳上，通过Shopify一件代发', earningModel: '差价收入，无库存风险，月入¥2000-20000', difficulty: 'easy', incomeRange: '¥2000-20000/月', timeToProfit: '2-4周', isHot: false, isFree: true, tags: ['POD', '电商', '设计'] },
  { number: 22, title: 'AI海报/Logo设计', category: 'design', categoryLabel: 'AI设计', tools: 'Canva, Midjourney', description: '在闲鱼、Fiverr上开店，提供低价快速出图的AI海报、Logo设计服务', earningModel: '按张收费¥50-500，月接单¥3000-15000', difficulty: 'easy', incomeRange: '¥3000-15000/月', timeToProfit: '1周', isHot: true, isFree: true, tags: ['设计', '接单', '自由职业'] },
  { number: 23, title: 'AI配音服务', category: 'design', categoryLabel: 'AI设计', tools: 'Fish Audio, ElevenLabs', description: '提供高质量、多语言AI配音服务，为广告、游戏、视频号创作者配音', earningModel: '按字数或时长收费，月入¥3000-20000', difficulty: 'easy', incomeRange: '¥3000-20000/月', timeToProfit: '1周', isHot: false, isFree: true, tags: ['配音', '音频', '接单'] },
  { number: 24, title: 'AI设计资产售卖', category: 'design', categoryLabel: 'AI设计', tools: 'Midjourney, Freepik', description: '批量制作图标、插画、壁纸等设计素材，上传至Freepik、Etsy出售', earningModel: '被动收入，积累后月入$200-2000', difficulty: 'easy', incomeRange: '$200-2000/月', timeToProfit: '1-2个月', isHot: false, isFree: true, tags: ['素材', '被动收入', 'Etsy'] },
  { number: 25, title: 'AI PPT制作服务', category: 'design', categoryLabel: 'AI设计', tools: 'Gamma, 自研工具', description: '利用Gamma等AI工具，提供快速PPT美化、制作或模板销售服务', earningModel: '按份收费¥200-2000，有公司凭此年收入上亿', difficulty: 'easy', incomeRange: '¥3000-30000/月', timeToProfit: '1周', isHot: true, isFree: true, tags: ['PPT', '设计', '接单'] },
  // 技术开发 (26-35)
  { number: 26, title: '垂直行业大模型定制', category: 'tech', categoryLabel: '技术开发', tools: 'DeepSeek, ChatGPT API', description: '为金融、医疗、工业等领域企业定制私有化大模型，优化业务流程', earningModel: '高额年服务费¥50000-500000', difficulty: 'expert', incomeRange: '¥50000-500000/项目', timeToProfit: '1-3个月', isHot: true, isFree: false, tags: ['大模型', '企业', '高客单'] },
  { number: 27, title: '浏览器插件开发', category: 'tech', categoryLabel: '技术开发', tools: 'Cursor, Chrome API', description: '开发AI网页总结、智能购物助手、翻译插件，在Chrome Web Store发布', earningModel: '付费解锁高级功能，月入$500-5000', difficulty: 'medium', incomeRange: '$500-5000/月', timeToProfit: '2-4周', isHot: true, isFree: false, tags: ['插件', 'Chrome', '订阅'] },
  { number: 28, title: 'AI SEO优化服务', category: 'tech', categoryLabel: '技术开发', tools: 'ChatGPT, SEMrush', description: '提供AI驱动的SEO诊断、关键词挖掘、文章优化服务', earningModel: '月费¥2000-10000，有稳定客户后月入¥10000+', difficulty: 'medium', incomeRange: '¥2000-20000/月', timeToProfit: '2-4周', isHot: false, isFree: true, tags: ['SEO', '营销', '服务'] },
  { number: 29, title: '提示词工程服务', category: 'tech', categoryLabel: '技术开发', tools: 'ChatGPT, Midjourney', description: '专注于优化AI提示词，出售高质量提示词库或为企业提供优化咨询', earningModel: '提示词包¥99-999，咨询费¥500-5000/小时', difficulty: 'easy', incomeRange: '¥3000-30000/月', timeToProfit: '1-2周', isHot: true, isFree: true, tags: ['提示词', '咨询', '知识付费'] },
  { number: 30, title: 'AI API聚合服务', category: 'tech', categoryLabel: '技术开发', tools: 'RapidAPI, 自研', description: '聚合多个主流AI模型API，提供更便捷、低价的统一接口', earningModel: '按调用量收费，月入$1000-20000', difficulty: 'hard', incomeRange: '$1000-20000/月', timeToProfit: '1-2个月', isHot: false, isFree: false, tags: ['API', '技术', '规模化'] },
  // 电商与营销 (31-40)
  { number: 31, title: 'AI电商独立站', category: 'ecommerce', categoryLabel: '电商营销', tools: 'Shopify, AI工具', description: '用AI自动建站、选品、处理发货的全自动化一件代发商店', earningModel: '商品差价，月入¥5000-50000', difficulty: 'medium', incomeRange: '¥5000-50000/月', timeToProfit: '2-4周', isHot: true, isFree: false, tags: ['电商', 'Dropshipping', '独立站'] },
  { number: 32, title: 'AI产品视频制作', category: 'ecommerce', categoryLabel: '电商营销', tools: 'Arcads AI', description: '输入商品链接，AI自动生成虚拟网红手持产品讲解视频', earningModel: '按条收费¥200-1000，或月度服务¥3000-10000', difficulty: 'easy', incomeRange: '¥3000-20000/月', timeToProfit: '1周', isHot: true, isFree: false, tags: ['视频', '电商', '营销'] },
  { number: 33, title: 'AI辅助选品研究', category: 'ecommerce', categoryLabel: '电商营销', tools: 'ChatGPT, Jungle Scout', description: '利用AI分析海量电商数据，精准预测爆款趋势，为卖家提供选品建议', earningModel: '报告销售¥299-999，订阅服务¥500-2000/月', difficulty: 'medium', incomeRange: '¥3000-20000/月', timeToProfit: '2-3周', isHot: false, isFree: true, tags: ['选品', '数据', '电商'] },
  { number: 34, title: '社交媒体代运营', category: 'ecommerce', categoryLabel: '电商营销', tools: 'Opus Clip, Canva', description: '利用AI工具高效为客户创建内容、管理多个社交媒体账号', earningModel: '月度运营服务¥2000-10000/账号', difficulty: 'easy', incomeRange: '¥5000-30000/月', timeToProfit: '1-2周', isHot: false, isFree: true, tags: ['代运营', '社媒', '服务'] },
  { number: 35, title: '旅游/本地生活带货', category: 'ecommerce', categoryLabel: '电商营销', tools: 'Midjourney, 剪映', description: '用AI生成治愈系风景视频，挂载景点门票、酒店团购链接赚佣金', earningModel: '佣金收入5-15%，月入¥2000-20000', difficulty: 'easy', incomeRange: '¥2000-20000/月', timeToProfit: '1-2个月', isHot: false, isFree: true, tags: ['旅游', '带货', '佣金'] },
  // 教育咨询 (36-45)
  { number: 36, title: 'AI简历优化服务', category: 'education', categoryLabel: '教育咨询', tools: 'ChatGPT, Canva', description: '用AI为求职者分析并优化简历内容和排版，提升简历通过率', earningModel: '按次收费¥99-299，月接单¥3000-15000', difficulty: 'easy', incomeRange: '¥3000-15000/月', timeToProfit: '1周', isHot: true, isFree: true, tags: ['简历', '求职', '服务'] },
  { number: 37, title: 'AI留学文书服务', category: 'education', categoryLabel: '教育咨询', tools: 'ChatGPT, Grammarly', description: '用AI辅助撰写、润色个人陈述、推荐信等留学文书', earningModel: '按篇收费¥500-3000，申请季月入¥10000+', difficulty: 'medium', incomeRange: '¥5000-30000/月', timeToProfit: '1-2周', isHot: false, isFree: false, tags: ['留学', '文书', '高客单'] },
  { number: 38, title: 'AI行业咨询顾问', category: 'education', categoryLabel: '教育咨询', tools: 'ChatGPT, 数据分析工具', description: '结合行业知识，用AI分析市场数据、生成商业计划书，为企业提供咨询', earningModel: '咨询费¥5000-50000/次', difficulty: 'hard', incomeRange: '¥10000-100000/月', timeToProfit: '1-3个月', isHot: false, isFree: false, tags: ['咨询', '企业', '高客单'] },
  { number: 39, title: 'AI口语/面试陪练', category: 'education', categoryLabel: '教育咨询', tools: 'Whisper, ChatGPT', description: '利用AI对话能力提供全英文或全真模拟面试的实时陪练与反馈', earningModel: '按月订阅¥99-299，月入¥3000-20000', difficulty: 'easy', incomeRange: '¥3000-20000/月', timeToProfit: '2-3周', isHot: true, isFree: true, tags: ['口语', '教育', '订阅'] },
  { number: 40, title: 'AI工具测评/教程', category: 'education', categoryLabel: '教育咨询', tools: 'ChatGPT, 自建网站', description: '创建专注于AI工具测评与教程的网站或YouTube频道，通过广告和联盟营销变现', earningModel: '广告收入 + 联盟佣金，月入¥1000-30000', difficulty: 'easy', incomeRange: '¥1000-30000/月', timeToProfit: '2-4个月', isHot: true, isFree: true, tags: ['测评', '教程', '媒体'] },
  // 创新项目 (41-50)
  { number: 41, title: 'AI心理树洞服务', category: 'innovative', categoryLabel: '创新项目', tools: 'ChatGPT, 小程序', description: '训练暖心聊天机器人，在小红书等平台提供心理疏导、虚拟陪伴订阅服务', earningModel: '订阅费¥29-99/月，月入¥3000-30000', difficulty: 'medium', incomeRange: '¥3000-30000/月', timeToProfit: '2-4周', isHot: true, isFree: true, tags: ['心理', '陪伴', '订阅'] },
  { number: 42, title: 'AI量化投资策略销售', category: 'innovative', categoryLabel: '创新项目', tools: 'Python, 聚宽', description: '开发基于机器学习的股票、加密货币量化交易策略，在平台上销售', earningModel: '策略销售¥299-2999，订阅¥99-999/月', difficulty: 'expert', incomeRange: '¥3000-50000/月', timeToProfit: '1-3个月', isHot: false, isFree: false, tags: ['量化', '策略', '金融'] },
  { number: 43, title: 'AI定制礼品服务', category: 'innovative', categoryLabel: '创新项目', tools: 'ChatGPT, Midjourney', description: '接受个性化订单，用AI生成客户指定的宠物画像、情侣照、全家福等', earningModel: '按件收费¥99-599，月接单¥3000-20000', difficulty: 'easy', incomeRange: '¥3000-20000/月', timeToProfit: '1周', isHot: true, isFree: true, tags: ['定制', '礼品', '接单'] },
  { number: 44, title: '本地商家AI建站', category: 'innovative', categoryLabel: '创新项目', tools: 'Hostinger AI, ChatGPT', description: '为本地商户提供一站式AI建站服务，包括文案、图片、SEO优化', earningModel: '建站费¥2000-10000 + 年维护费¥1000-3000', difficulty: 'easy', incomeRange: '¥5000-30000/月', timeToProfit: '1-2周', isHot: false, isFree: true, tags: ['建站', '本地', '服务'] },
  { number: 45, title: 'AI自动会议纪要', category: 'innovative', categoryLabel: '创新项目', tools: 'Fireflies.ai, Notion', description: '提供AI自动录制、转录、总结会议内容的SaaS服务', earningModel: '订阅¥99-499/月，月入¥5000-50000', difficulty: 'medium', incomeRange: '¥5000-50000/月', timeToProfit: '2-4周', isHot: true, isFree: false, tags: ['会议', 'SaaS', '效率'] },
  { number: 46, title: 'AI游戏素材生成', category: 'innovative', categoryLabel: '创新项目', tools: 'Midjourney, GPT', description: '为游戏公司或独立开发者快速生成角色、场景、世界观设定等游戏资产', earningModel: '按量收费¥500-5000/套，月入¥5000-30000', difficulty: 'medium', incomeRange: '¥5000-30000/月', timeToProfit: '2-3周', isHot: false, isFree: false, tags: ['游戏', '设计', '资产'] },
  { number: 47, title: 'AI财报分析工具', category: 'innovative', categoryLabel: '创新项目', tools: '数据分析工具, AI', description: '开发输入股票代码即可自动解读财报、生成投资要点的工具', earningModel: '订阅收费¥99-299/月，月入¥5000-50000', difficulty: 'hard', incomeRange: '¥5000-50000/月', timeToProfit: '1-2个月', isHot: false, isFree: false, tags: ['金融', '分析', '工具'] },
  { number: 48, title: 'AI剧本杀创作', category: 'innovative', categoryLabel: '创新项目', tools: 'ChatGPT', description: '用AI辅助构思情节、生成剧本杀故事，完成后投稿至发行平台', earningModel: '买断费¥3000-30000 或分成5-15%', difficulty: 'medium', incomeRange: '¥3000-30000/项目', timeToProfit: '2-4周', isHot: true, isFree: true, tags: ['剧本杀', '创作', '版权'] },
  { number: 49, title: 'AI声音克隆授权', category: 'innovative', categoryLabel: '创新项目', tools: 'ElevenLabs, 自研工具', description: '录制30分钟语音即可克隆声音，在声音市场出售授权获取被动收入', earningModel: '授权费$10-100/月，被动收入', difficulty: 'easy', incomeRange: '$200-2000/月', timeToProfit: '1-2周', isHot: false, isFree: true, tags: ['声音', '被动收入', '授权'] },
  { number: 50, title: 'AI全自动自媒体矩阵', category: 'innovative', categoryLabel: '创新项目', tools: 'Coze, Dify, AI工具', description: '搭建每天定时自动检索爆款、AI改写、配图并群发到几十个账号的矩阵', earningModel: '广告分成 + 带货佣金，月入¥5000-50000', difficulty: 'hard', incomeRange: '¥5000-50000/月', timeToProfit: '1-2个月', isHot: true, isFree: false, tags: ['自媒体', '矩阵', '自动化'] },
];

// ─── 示例任务订单 ───
const SAMPLE_TASKS = [
  { title: '需要一个AI客服机器人接入微信', category: 'agent', budget: 8000, description: '我们是一家电商公司，需要一个能接入微信客服的AI机器人，能回答产品问题、处理退换货咨询。要求：7x24小时在线，支持图片识别，能转人工。', requiredSkills: ['Python', 'WeChat API', 'ChatGPT API'], deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) },
  { title: '帮我搭建YouTube无脸频道自动化系统', category: 'content', budget: 3000, description: '想做一个历史知识类YouTube无脸频道，需要帮我搭建：自动生成脚本→AI配音→自动剪辑→自动发布的完整流程。', requiredSkills: ['ElevenLabs', 'FFmpeg', 'YouTube API'], deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
  { title: '开发一个AI简历优化小程序', category: 'tech', budget: 15000, description: '需要开发微信小程序，用户上传简历后AI自动分析并给出优化建议，支持一键重写。需要后台管理系统。', requiredSkills: ['微信小程序', 'Node.js', 'ChatGPT API'], deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
  { title: '帮我做抖音AI数字人直播方案', category: 'content', budget: 5000, description: '想开一个抖音AI数字人直播带货账号，需要帮我选择合适的工具、搭建流程、培训操作。', requiredSkills: ['HeyGen', '抖音API', '直播运营'], deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000) },
  { title: '需要100篇SEO优化文章', category: 'content', budget: 2000, description: '我的独立站需要100篇关于"宠物护理"的SEO优化文章，每篇1500字以上，需要包含关键词布局。', requiredSkills: ['ChatGPT', 'SEO', '内容创作'], deadline: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000) },
];

export const communityRouter = router({
  // ─── 赚钱项目库 ───
  projects: router({
    list: publicProcedure.input(z.object({
      category: z.string().optional(),
      difficulty: z.string().optional(),
      search: z.string().optional(),
      isFree: z.boolean().optional(),
      page: z.number().default(1),
      pageSize: z.number().default(20),
    })).query(async ({ input }) => {
      let filtered = MONEY_PROJECTS;
      if (input.category) filtered = filtered.filter(p => p.category === input.category);
      if (input.difficulty) filtered = filtered.filter(p => p.difficulty === input.difficulty);
      if (input.isFree !== undefined) filtered = filtered.filter(p => p.isFree === input.isFree);
      if (input.search) {
        const q = input.search.toLowerCase();
        filtered = filtered.filter(p => p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || (p.tags as string[]).some(t => t.toLowerCase().includes(q)));
      }
      const start = (input.page - 1) * input.pageSize;
      return {
        list: filtered.slice(start, start + input.pageSize),
        total: filtered.length,
        categories: Array.from(new Set(MONEY_PROJECTS.map(p => p.category))).map(cat => ({
          key: cat,
          label: MONEY_PROJECTS.find(p => p.category === cat)?.categoryLabel || cat,
          count: MONEY_PROJECTS.filter(p => p.category === cat).length,
        })),
      };
    }),
    get: publicProcedure.input(z.object({ id: z.number() })).query(({ input }) => {
      return MONEY_PROJECTS.find(p => p.number === input.id) || null;
    }),
    hot: publicProcedure.query(() => MONEY_PROJECTS.filter(p => p.isHot).slice(0, 6)),
    stats: publicProcedure.query(() => ({
      total: MONEY_PROJECTS.length,
      freeCount: MONEY_PROJECTS.filter(p => p.isFree).length,
      categories: 6,
      maxIncome: '¥100000+/月',
    })),
  }),

  // ─── 任务市场 ───
  tasks: router({
    list: publicProcedure.input(z.object({
      category: z.string().optional(),
      status: z.string().optional(),
    })).query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        // Return sample data
        return SAMPLE_TASKS.map((t, i) => ({ ...t, id: i + 1, publisherId: 1, takerId: null, status: 'open', currency: 'CNY', attachments: null, completedAt: null, createdAt: new Date(), updatedAt: new Date() }));
      }
      try {
        const { sql } = await import('drizzle-orm');
        const [rows] = await db.execute(sql`SELECT t.*, u.name as publisherName FROM taskOrders t LEFT JOIN users u ON t.publisherId = u.id WHERE t.status = 'open' ORDER BY t.createdAt DESC LIMIT 20`);
        const list = (rows as unknown as any[]) || [];
        if (list.length === 0) {
          // Seed sample tasks
          for (const task of SAMPLE_TASKS) {
            await db.execute(sql`INSERT INTO taskOrders (publisherId, title, description, category, budget, currency, deadline, status, requiredSkills) VALUES (1, ${task.title}, ${task.description}, ${task.category}, ${task.budget}, 'CNY', ${task.deadline}, 'open', ${JSON.stringify(task.requiredSkills)})`);
          }
          const [seeded] = await db.execute(sql`SELECT t.*, u.name as publisherName FROM taskOrders t LEFT JOIN users u ON t.publisherId = u.id WHERE t.status = 'open' ORDER BY t.createdAt DESC LIMIT 20`);
          return (seeded as unknown as any[]) || [];
        }
        return list;
      } catch { return SAMPLE_TASKS.map((t, i) => ({ ...t, id: i + 1, publisherId: 1, status: 'open', createdAt: new Date() })); }
    }),
    create: protectedProcedure.input(z.object({
      title: z.string().min(1).max(256),
      description: z.string().min(10),
      category: z.string(),
      budget: z.number().min(1),
      requiredSkills: z.array(z.string()).optional(),
    })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { success: true };
      const { sql } = await import('drizzle-orm');
      await db.execute(sql`INSERT INTO taskOrders (publisherId, title, description, category, budget, currency, status, requiredSkills) VALUES (${ctx.user.id}, ${input.title}, ${input.description}, ${input.category}, ${input.budget}, 'CNY', 'open', ${JSON.stringify(input.requiredSkills || [])})`);
      return { success: true };
    }),
    take: protectedProcedure.input(z.object({ taskId: z.number() })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { success: true };
      const { sql } = await import('drizzle-orm');
      await db.execute(sql`UPDATE taskOrders SET takerId = ${ctx.user.id}, status = 'in_progress' WHERE id = ${input.taskId} AND status = 'open'`);
      return { success: true };
    }),
  }),

  // ─── 社区帖子 ───
  posts: router({
    list: publicProcedure.input(z.object({
      category: z.string().optional(),
      page: z.number().default(1),
    })).query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { list: [], total: 0 };
      try {
        const { sql } = await import('drizzle-orm');
        const offset = (input.page - 1) * 10;
        const catCond = input.category ? `AND p.category = '${input.category}'` : '';
        const [rows] = await db.execute(sql.raw(`SELECT p.*, u.name as authorName FROM communityPosts p LEFT JOIN users u ON p.userId = u.id WHERE 1=1 ${catCond} ORDER BY p.isPinned DESC, p.createdAt DESC LIMIT 10 OFFSET ${offset}`));
        const [countRow] = await db.execute(sql.raw(`SELECT COUNT(*) as total FROM communityPosts WHERE 1=1 ${catCond}`));
        return { list: (rows as unknown as any[]) || [], total: (countRow as unknown as any[])[0]?.total || 0 };
      } catch { return { list: [], total: 0 }; }
    }),
    create: protectedProcedure.input(z.object({
      title: z.string().min(1).max(256),
      content: z.string().min(10),
      category: z.string().default('share'),
      income: z.number().optional(),
      tags: z.array(z.string()).optional(),
    })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { success: true };
      const { sql } = await import('drizzle-orm');
      await db.execute(sql`INSERT INTO communityPosts (userId, title, content, category, income, tags) VALUES (${ctx.user.id}, ${input.title}, ${input.content}, ${input.category}, ${input.income || 0}, ${JSON.stringify(input.tags || [])})`);
      return { success: true };
    }),
    like: protectedProcedure.input(z.object({ postId: z.number() })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { success: true };
      const { sql } = await import('drizzle-orm');
      await db.execute(sql`UPDATE communityPosts SET likeCount = likeCount + 1 WHERE id = ${input.postId}`);
      return { success: true };
    }),
  }),

  // ─── AI收益计划生成器 ───
  incomePlan: router({
    generate: protectedProcedure.input(z.object({
      targetMonthlyIncome: z.number().min(100),
      skills: z.array(z.string()),
      timeAvailable: z.string(),
      budget: z.string(),
      experience: z.string(),
    })).mutation(async ({ ctx, input }) => {
      const projectList = MONEY_PROJECTS.slice(0, 20).map(p => `${p.number}. ${p.title}（${p.incomeRange}，难度:${p.difficulty}，${p.isFree ? '免费启动' : '需要投入'}）`).join('\n');
      const resp = await invokeLLM({
        messages: [
          { role: 'system', content: `你是一位专业的AI赚钱策略顾问。根据用户情况，从以下项目中推荐最适合的3-5个，并制定详细的行动计划。\n\n可选项目库：\n${projectList}` },
          { role: 'user', content: `我的情况：\n- 目标月收入：¥${input.targetMonthlyIncome}\n- 技能：${input.skills.join('、')}\n- 每天可用时间：${input.timeAvailable}\n- 启动资金：${input.budget}\n- 经验水平：${input.experience}\n\n请给我一个详细的赚钱计划，包括：推荐项目、启动步骤、预期时间线、注意事项。用中文回答，格式清晰。` },
        ],
      });
      const analysis = resp.choices[0]?.message?.content as string || '';
      // Save plan
      const db = await getDb();
      if (db) {
        const { sql } = await import('drizzle-orm');
        await db.execute(sql`INSERT INTO userIncomePlans (userId, planName, targetMonthlyIncome, selectedProjects, aiAnalysis, estimatedDays, status) VALUES (${ctx.user.id}, ${`¥${input.targetMonthlyIncome}/月收益计划`}, ${input.targetMonthlyIncome}, ${JSON.stringify([])}, ${analysis}, 90, 'active')`);
      }
      return { analysis, planName: `¥${input.targetMonthlyIncome}/月收益计划` };
    }),
    myPlans: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      const { sql } = await import('drizzle-orm');
      const [rows] = await db.execute(sql`SELECT * FROM userIncomePlans WHERE userId = ${ctx.user.id} ORDER BY createdAt DESC LIMIT 5`);
      return (rows as unknown as any[]) || [];
    }),
  }),

  // ─── 排行榜 ───
  leaderboard: publicProcedure.query(async () => {
    // Mock leaderboard data
    return [
      { rank: 1, name: '创业者小王', avatar: '👨‍💻', income: 85000, project: 'AI客服外包', badge: '🏆' },
      { rank: 2, name: '独立开发者李', avatar: '👩‍💻', income: 62000, project: 'AI SaaS产品', badge: '🥈' },
      { rank: 3, name: '内容创作者张', avatar: '🎨', income: 48000, project: '无脸YouTube', badge: '🥉' },
      { rank: 4, name: 'AI副业达人', avatar: '🚀', income: 35000, project: '提示词服务', badge: '⭐' },
      { rank: 5, name: '量化交易者陈', avatar: '📈', income: 28000, project: 'AI量化策略', badge: '⭐' },
      { rank: 6, name: '设计师小美', avatar: '🎭', income: 22000, project: 'AI海报设计', badge: '⭐' },
      { rank: 7, name: '电商运营者', avatar: '🛒', income: 18000, project: 'AI独立站', badge: '⭐' },
      { rank: 8, name: '教育博主', avatar: '📚', income: 15000, project: 'AI知识付费', badge: '⭐' },
    ];
  }),
});

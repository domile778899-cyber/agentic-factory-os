/**
 * AgentWorkspace3D v3.0 — 终极升级版
 * 新增功能：
 * 1. 每个 Agent 独特职业服装（风衣/法袍/工程服/卫衣/白大褂/战术背心）
 * 2. Agent 间项目沟通对话连线动画（发光连线 + 消息气泡 + 团队协作）
 * 3. ElevenLabs 高质量语音 API 集成（降级到 Web Speech API）
 * 4. 科技感全局加载过渡动画（保留）
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Volume2, VolumeX, Cpu, MessageCircle, Users } from 'lucide-react';
import { trpc } from '@/lib/trpc';

// ─── Agent 职业定义（含服装配色）───
export const AGENT_PROFILES = [
  {
    key: 'security_architect', name: '安全架构师', color: 0xF43F5E, accent: 0xFF6B6B,
    icon: '🔐', pitch: 0.8,
    outfit: 'trench_coat',      // 黑色风衣
    outfitColor: 0x1a1a1a,
    outfitAccent: 0xF43F5E,
    badge: '🔐 SEC',
    elevenlabsVoiceId: 'pNInz6obpgDQGcFmaJgB', // Adam - 低沉男声
    phrases: ['正在分析安全漏洞...', '检查 OAuth 配置...', '加密存储已就绪！', '安全审计通过！', 'JWT 签名验证完成', '零信任架构已部署'],
  },
  {
    key: 'legal_compliance', name: '合规法务官', color: 0xA78BFA, accent: 0xC4B5FD,
    icon: '⚖️', pitch: 0.9,
    outfit: 'robe',             // 法袍
    outfitColor: 0x2D1B69,
    outfitAccent: 0xA78BFA,
    badge: '⚖️ LAW',
    elevenlabsVoiceId: 'EXAVITQu4vr4xnSDxMaL', // Bella - 优雅女声
    phrases: ['审查隐私政策...', '合规框架检查中...', '数据安全法合规！', '用户协议已更新', 'GDPR 检查通过', '合规报告已生成'],
  },
  {
    key: 'backend_engineer', name: '后端工程师', color: 0x60A5FA, accent: 0x93C5FD,
    icon: '🏗️', pitch: 1.0,
    outfit: 'work_jacket',      // 工程夹克
    outfitColor: 0x1E3A5F,
    outfitAccent: 0x60A5FA,
    badge: '🏗️ DEV',
    elevenlabsVoiceId: 'VR6AewLTigWG4xSOukaG', // Arnold - 专业男声
    phrases: ['生成 API 接口...', '数据库设计中...', '微服务架构完成！', 'Docker 容器化就绪', 'tRPC 路由已注册', '负载均衡配置完成'],
  },
  {
    key: 'ai_mentor', name: 'AI编程导师', color: 0x38BDF8, accent: 0x7DD3FC,
    icon: '💻', pitch: 1.1,
    outfit: 'hoodie',           // 连帽卫衣
    outfitColor: 0x0F2744,
    outfitAccent: 0x38BDF8,
    badge: '💻 AI',
    elevenlabsVoiceId: 'MF3mGyEYCl7XYWbV9V6O', // Elli - 活泼女声
    phrases: ['生成单元测试...', '代码质量检查...', '测试覆盖率 95%！', '代码审查完成', 'TypeScript 零错误', '性能优化建议已生成'],
  },
  {
    key: 'data_analyst', name: '数据分析师', color: 0x34D399, accent: 0x6EE7B7,
    icon: '📊', pitch: 1.05,
    outfit: 'lab_coat',         // 白大褂
    outfitColor: 0xF0FDF4,
    outfitAccent: 0x34D399,
    badge: '📊 DATA',
    elevenlabsVoiceId: 'TxGEqnHWrfWFTfGW9XjX', // Josh - 清晰男声
    phrases: ['分析数据模型...', '生成可视化图表...', '数据洞察完成！', '报告已生成', '趋势预测完成', '异常检测通过'],
  },
  {
    key: 'cyber_auditor', name: '安全审计师', color: 0xFB923C, accent: 0xFDBA74,
    icon: '🛡️', pitch: 0.75,
    outfit: 'tactical_vest',    // 战术背心
    outfitColor: 0x1C1917,
    outfitAccent: 0xFB923C,
    badge: '🛡️ AUDIT',
    elevenlabsVoiceId: 'yoZ06aMxZJJ28mfd3POQ', // Sam - 沉稳男声
    phrases: ['扫描代码漏洞...', 'OWASP 检查中...', '安全评分 A+！', '漏洞报告已生成', '渗透测试通过', 'SQL注入防护已加固'],
  },
];

// ─── 办公场景定义 ───
const OFFICE_SCENES = [
  { name: '现代开放办公室', floor: 0x1A1A2E, wall: 0x16213E, accent: 0x0F3460, light: 0x7C5CFC, ambientColor: 0x1a1a2e },
  { name: '高科技服务器机房', floor: 0x0D1B2A, wall: 0x1B2838, accent: 0x00B4D8, light: 0x00B4D8, ambientColor: 0x0d1b2a },
  { name: '创意设计工作室', floor: 0x1A0A2E, wall: 0x2D1B69, accent: 0xF59E0B, light: 0xF59E0B, ambientColor: 0x1a0a2e },
  { name: '企业会议中心', floor: 0x0F1923, wall: 0x1C2B3A, accent: 0x34D399, light: 0x34D399, ambientColor: 0x0f1923 },
];

// ─── Agent 对话连线数据 ───
const COLLABORATION_PAIRS = [
  { from: 'security_architect', to: 'legal_compliance', topic: '合规安全审查' },
  { from: 'backend_engineer', to: 'ai_mentor', topic: '代码质量优化' },
  { from: 'data_analyst', to: 'cyber_auditor', topic: '数据安全分析' },
  { from: 'security_architect', to: 'cyber_auditor', topic: '漏洞修复方案' },
  { from: 'backend_engineer', to: 'data_analyst', topic: '数据库性能优化' },
];

interface AgentWorkspace3DProps {
  activeAgents?: string[];
  agentMessages?: Record<string, string>;
  isBuilding?: boolean;
  height?: number;
  elevenlabsApiKey?: string;
}

// ─── 科技感场景切换覆盖层 ───
function SceneTransitionOverlay({ isTransitioning, sceneName }: { isTransitioning: boolean; sceneName: string }) {
  return (
    <AnimatePresence>
      {isTransitioning && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
          className="absolute inset-0 z-20 flex flex-col items-center justify-center overflow-hidden"
          style={{ background: 'rgba(11,11,15,0.92)', backdropFilter: 'blur(4px)' }}>
          <div className="absolute inset-0">
            {Array.from({ length: 10 }).map((_, i) => (
              <motion.div key={i} className="absolute w-full"
                style={{ top: `${i * 10}%`, height: '1px', background: 'linear-gradient(90deg, transparent, #7C5CFC, transparent)' }}
                initial={{ scaleX: 0, opacity: 0 }}
                animate={{ scaleX: [0, 1, 1, 0], opacity: [0, 0.8, 0.8, 0] }}
                transition={{ duration: 0.5, delay: i * 0.03 }} />
            ))}
          </div>
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
            className="relative z-10 flex flex-col items-center gap-3">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
              <Cpu size={28} className="text-[#7C5CFC]" />
            </motion.div>
            <div className="text-[#A78BFA] text-xs font-bold font-mono tracking-widest uppercase">切换场景</div>
            <div className="text-white text-sm font-semibold">{sceneName}</div>
            <div className="w-40 h-0.5 bg-[rgba(255,255,255,0.1)] rounded-full overflow-hidden">
              <motion.div className="h-full rounded-full" style={{ background: 'linear-gradient(90deg, #7C5CFC, #38BDF8)' }}
                initial={{ width: '0%' }} animate={{ width: '100%' }} transition={{ duration: 0.45 }} />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── 全局加载动画 ───
function GlobalLoadingOverlay({ visible }: { visible: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.6 }}
          className="absolute inset-0 z-30 flex flex-col items-center justify-center" style={{ background: '#0B0B0F' }}>
          <div className="absolute inset-0 overflow-hidden opacity-25">
            {Array.from({ length: 20 }).map((_, i) => (
              <motion.div key={i} className="absolute w-px bg-[#7C5CFC]"
                style={{ left: `${(i / 20) * 100}%`, top: 0, bottom: 0 }}
                initial={{ scaleY: 0, opacity: 0 }}
                animate={{ scaleY: 1, opacity: [0, 0.5, 0] }}
                transition={{ duration: 0.9, delay: i * 0.04 }} />
            ))}
          </div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="relative z-10 flex flex-col items-center gap-4">
            <motion.div animate={{ boxShadow: ['0 0 20px rgba(124,92,252,0.3)', '0 0 40px rgba(124,92,252,0.6)', '0 0 20px rgba(124,92,252,0.3)'] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #7C5CFC, #5B3FD4)' }}>
              <Cpu size={32} className="text-white" />
            </motion.div>
            <div className="text-center">
              <div className="text-white text-sm font-bold mb-1">初始化 3D 工作台</div>
              <div className="text-[#475569] text-xs font-mono">加载职业 Agent 模型...</div>
            </div>
            <div className="w-48 h-1 bg-[rgba(255,255,255,0.08)] rounded-full overflow-hidden">
              <motion.div className="h-full rounded-full" style={{ background: 'linear-gradient(90deg, #7C5CFC, #38BDF8)' }}
                initial={{ width: '0%' }} animate={{ width: '100%' }} transition={{ duration: 1.5, ease: 'easeOut' }} />
            </div>
            <div className="flex gap-2">
              {AGENT_PROFILES.map((p, i) => (
                <motion.div key={p.key} initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + i * 0.1 }} className="text-lg" title={p.name}>{p.icon}</motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function AgentWorkspace3D({
  activeAgents = [], agentMessages = {}, isBuilding = false, height = 400, elevenlabsApiKey = '',
}: AgentWorkspace3DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<any>(null);
  const animFrameRef = useRef<number>(0);
  const agentMeshesRef = useRef<Map<string, any>>(new Map());
  const agentPositionsRef = useRef<Map<string, { x: number; z: number }>>(new Map());
  const clockRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);
  const sceneRef = useRef<any>(null);
  const connectionLinesRef = useRef<any[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [currentScene, setCurrentScene] = useState(0);
  const [sceneTransitioning, setSceneTransitioning] = useState(false);
  const [threeLoaded, setThreeLoaded] = useState(false);
  const [speechBubbles, setSpeechBubbles] = useState<Record<string, string>>({});
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [activeConversation, setActiveConversation] = useState<{ from: string; to: string; topic: string } | null>(null);
  const [showCollabLines, setShowCollabLines] = useState(false);

  // ─── ElevenLabs 语音播报 ───
  const speakElevenLabs = useCallback(async (text: string, voiceId: string) => {
    if (!elevenlabsApiKey || !voiceId) return false;
    try {
      const resp = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`, {
        method: 'POST',
        headers: { 'xi-api-key': elevenlabsApiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, model_id: 'eleven_multilingual_v2', voice_settings: { stability: 0.5, similarity_boost: 0.75, speed: 1.1 } }),
      });
      if (!resp.ok) return false;
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      if (audioRef.current) { audioRef.current.pause(); URL.revokeObjectURL(audioRef.current.src); }
      audioRef.current = new Audio(url);
      audioRef.current.volume = 0.7;
      audioRef.current.play();
      return true;
    } catch { return false; }
  }, [elevenlabsApiKey]);

  // ─── Web Speech API 降级 ───
  const speakWebSpeech = useCallback((text: string, pitch: number = 1.0) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'zh-CN'; u.rate = 1.1; u.pitch = pitch; u.volume = 0.7;
    window.speechSynthesis.speak(u);
  }, []);

  const speak = useCallback(async (text: string, profile: typeof AGENT_PROFILES[0]) => {
    if (!voiceEnabled) return;
    const ok = await speakElevenLabs(text, profile.elevenlabsVoiceId);
    if (!ok) speakWebSpeech(text, profile.pitch);
  }, [voiceEnabled, speakElevenLabs, speakWebSpeech]);

  // ─── 对话气泡 + 语音 + 协作连线 ───
  useEffect(() => {
    if (!isBuilding) {
      setSpeechBubbles({});
      setActiveConversation(null);
      setShowCollabLines(false);
      return;
    }
    const interval = setInterval(() => {
      const newBubbles: Record<string, string> = {};
      activeAgents.forEach(key => {
        const profile = AGENT_PROFILES.find(a => a.key === key);
        if (profile) {
          const phrase = agentMessages[key] || profile.phrases[Math.floor(Math.random() * profile.phrases.length)];
          newBubbles[key] = phrase;
          if (Math.random() < 0.35) speak(phrase, profile);
        }
      });
      setSpeechBubbles(newBubbles);

      // 随机触发协作对话
      if (activeAgents.length >= 2 && Math.random() < 0.5) {
        const validPairs = COLLABORATION_PAIRS.filter(p => activeAgents.includes(p.from) && activeAgents.includes(p.to));
        if (validPairs.length > 0) {
          const pair = validPairs[Math.floor(Math.random() * validPairs.length)];
          setActiveConversation(pair);
          setShowCollabLines(true);
          setTimeout(() => setShowCollabLines(false), 2500);
        }
      }
    }, 3200);
    return () => clearInterval(interval);
  }, [isBuilding, activeAgents, agentMessages, speak]);

  // ─── 场景切换 ───
  const switchScene = useCallback(() => {
    setSceneTransitioning(true);
    if (voiceEnabled) { window.speechSynthesis?.cancel(); audioRef.current?.pause(); }
    setTimeout(() => { setCurrentScene(s => (s + 1) % OFFICE_SCENES.length); setSceneTransitioning(false); }, 500);
  }, [voiceEnabled]);

  useEffect(() => {
    const timer = setInterval(switchScene, 30000);
    return () => clearInterval(timer);
  }, [switchScene]);

  // ─── Three.js 初始化 ───
  useEffect(() => {
    let THREE: any;
    let mounted = true;

    // ── 构建职业服装 ──
    function addOutfit(THREE: any, group: any, profile: typeof AGENT_PROFILES[0]) {
      const c = profile.outfitColor;
      const a = profile.outfitAccent;
      const mat = (color: number, emissive = 0, ei = 0) =>
        new THREE.MeshStandardMaterial({ color, emissive, emissiveIntensity: ei, roughness: 0.65, metalness: 0.2 });

      switch (profile.outfit) {
        case 'trench_coat': {
          // 黑色风衣：长外套 + 腰带 + 翻领
          const coat = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.85, 0.32), mat(c));
          coat.position.set(0, 0.78, 0);
          group.add(coat);
          // 翻领
          const lapelL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.18, 0.04), mat(0x2a2a2a));
          lapelL.position.set(-0.15, 1.05, 0.16); lapelL.rotation.z = 0.3;
          group.add(lapelL);
          const lapelR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.18, 0.04), mat(0x2a2a2a));
          lapelR.position.set(0.15, 1.05, 0.16); lapelR.rotation.z = -0.3;
          group.add(lapelR);
          // 腰带
          const belt = new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.06, 0.34), mat(a, a, 0.3));
          belt.position.set(0, 0.55, 0);
          group.add(belt);
          // 风衣下摆（裙摆效果）
          const hem = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.3, 0.36), mat(c));
          hem.position.set(0, 0.18, 0);
          group.add(hem);
          break;
        }
        case 'robe': {
          // 法袍：深紫色长袍 + 金色装饰 + 白色领口
          const robe = new THREE.Mesh(new THREE.BoxGeometry(0.64, 1.0, 0.34), mat(c));
          robe.position.set(0, 0.7, 0);
          group.add(robe);
          // 金色装饰边
          const trim = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.04, 0.36), mat(a, a, 0.5));
          trim.position.set(0, 0.22, 0);
          group.add(trim);
          // 白色领口
          const collar = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.12, 0.06), mat(0xF8F8F8));
          collar.position.set(0, 1.1, 0.16);
          group.add(collar);
          // 法袍纽扣
          for (let i = 0; i < 3; i++) {
            const btn = new THREE.Mesh(new THREE.SphereGeometry(0.025, 6, 6), mat(a, a, 0.6));
            btn.position.set(0, 0.95 - i * 0.15, 0.17);
            group.add(btn);
          }
          break;
        }
        case 'work_jacket': {
          // 工程夹克：深蓝色夹克 + 反光条 + 工具口袋
          const jacket = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.75, 0.31), mat(c));
          jacket.position.set(0, 0.83, 0);
          group.add(jacket);
          // 反光条（亮蓝色）
          const stripe1 = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.04, 0.33), mat(a, a, 0.7));
          stripe1.position.set(0, 0.72, 0);
          group.add(stripe1);
          const stripe2 = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.04, 0.33), mat(a, a, 0.7));
          stripe2.position.set(0, 0.58, 0);
          group.add(stripe2);
          // 胸口口袋
          const pocket = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.1, 0.03), mat(0x1a2a3f));
          pocket.position.set(-0.18, 0.95, 0.16);
          group.add(pocket);
          // 领子
          const collar = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.1, 0.06), mat(0x0f1f2f));
          collar.position.set(0, 1.12, 0.14);
          group.add(collar);
          break;
        }
        case 'hoodie': {
          // 连帽卫衣：深蓝色卫衣 + 帽子 + 袋鼠口袋
          const hoodie = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.72, 0.3), mat(c));
          hoodie.position.set(0, 0.84, 0);
          group.add(hoodie);
          // 帽子（覆盖在头上）
          const hood = new THREE.Mesh(new THREE.SphereGeometry(0.26, 12, 12), mat(c));
          hood.position.set(0, 1.5, -0.05);
          hood.scale.set(1, 0.7, 0.9);
          group.add(hood);
          // 袋鼠口袋
          const kangaroo = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.12, 0.04), mat(0x0a1a2e));
          kangaroo.position.set(0, 0.72, 0.16);
          group.add(kangaroo);
          // 卫衣字母装饰（发光）
          const logo = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.06, 0.02), mat(a, a, 0.8));
          logo.position.set(0, 0.95, 0.16);
          group.add(logo);
          break;
        }
        case 'lab_coat': {
          // 白大褂：白色实验室外套 + 绿色装饰 + 胸牌
          const coat = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.82, 0.32), mat(0xF0FDF4));
          coat.position.set(0, 0.79, 0);
          group.add(coat);
          // 绿色领口
          const collar = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.1, 0.05), mat(a, a, 0.3));
          collar.position.set(0, 1.1, 0.16);
          group.add(collar);
          // 口袋（左胸）
          const pocket = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.1, 0.03), mat(0xDCFCE7));
          pocket.position.set(-0.17, 0.94, 0.17);
          group.add(pocket);
          // 胸牌（发光）
          const badge = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.07, 0.02), mat(a, a, 0.6));
          badge.position.set(0.17, 0.94, 0.17);
          group.add(badge);
          // 纽扣
          for (let i = 0; i < 4; i++) {
            const btn = new THREE.Mesh(new THREE.SphereGeometry(0.018, 6, 6), mat(0xBBF7D0));
            btn.position.set(0.04, 0.98 - i * 0.14, 0.17);
            group.add(btn);
          }
          break;
        }
        case 'tactical_vest': {
          // 战术背心：深色背心 + 橙色装备 + 口袋
          const vest = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.65, 0.34), mat(c));
          vest.position.set(0, 0.87, 0);
          group.add(vest);
          // 橙色装备带
          const strap1 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.65, 0.36), mat(a, a, 0.4));
          strap1.position.set(-0.2, 0.87, 0);
          group.add(strap1);
          const strap2 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.65, 0.36), mat(a, a, 0.4));
          strap2.position.set(0.2, 0.87, 0);
          group.add(strap2);
          // 多个口袋
          [[-0.18, 0.98], [0.18, 0.98], [-0.18, 0.78], [0.18, 0.78]].forEach(([x, y]) => {
            const pkt = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.09, 0.04), mat(0x292524));
            pkt.position.set(x, y, 0.18);
            group.add(pkt);
          });
          // 领口
          const collar = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.08, 0.06), mat(0x1C1917));
          collar.position.set(0, 1.12, 0.15);
          group.add(collar);
          break;
        }
      }
    }

    async function buildHumanoidAgent(THREE: any, profile: typeof AGENT_PROFILES[0]) {
      const group = new THREE.Group();
      const skinMat = new THREE.MeshStandardMaterial({ color: 0xFFDBAC, roughness: 0.75 });
      const eyeMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, emissive: profile.accent, emissiveIntensity: 1.0 });
      const hairMat = new THREE.MeshStandardMaterial({ color: profile.accent, emissive: profile.accent, emissiveIntensity: 0.15, roughness: 0.9 });
      const legMat = new THREE.MeshStandardMaterial({ color: 0x1E293B, roughness: 0.7 });
      const shoeMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.5, metalness: 0.35 });

      // 头部
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 16), skinMat);
      head.position.y = 1.47; head.scale.set(1, 1.08, 0.95); head.name = 'head';
      group.add(head);

      // 发型
      const hair = new THREE.Mesh(new THREE.SphereGeometry(0.235, 12, 12), hairMat);
      hair.position.set(0, 1.62, -0.02); hair.scale.set(1, 0.55, 1);
      group.add(hair);

      // 眼睛
      [-0.08, 0.08].forEach(x => {
        const eye = new THREE.Mesh(new THREE.SphereGeometry(0.033, 8, 8), eyeMat);
        eye.position.set(x, 1.48, 0.2);
        group.add(eye);
      });

      // 嘴巴（微笑弧）
      const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.01, 4, 8, Math.PI),
        new THREE.MeshStandardMaterial({ color: 0x8B4513 }));
      mouth.position.set(0, 1.39, 0.21); mouth.rotation.z = Math.PI;
      group.add(mouth);

      // 颈部
      const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 0.14, 8), skinMat);
      neck.position.y = 1.27;
      group.add(neck);

      // 手臂
      const armMat = new THREE.MeshStandardMaterial({ color: profile.outfitColor, roughness: 0.65, metalness: 0.15 });
      [-0.35, 0.35].forEach((x, i) => {
        const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.075, 0.48, 4, 8), armMat);
        arm.position.set(x, 0.76, 0); arm.rotation.z = i === 0 ? 0.18 : -0.18;
        arm.name = `arm_${i}`;
        group.add(arm);
      });

      // 手部
      [{ x: -0.42, y: 0.43 }, { x: 0.42, y: 0.43 }].forEach((pos, i) => {
        const hand = new THREE.Mesh(new THREE.SphereGeometry(0.085, 8, 8), skinMat);
        hand.position.set(pos.x, pos.y, 0); hand.name = `hand_${i}`;
        group.add(hand);
      });

      // 腿部
      [-0.14, 0.14].forEach((x, i) => {
        const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.095, 0.52, 4, 8), legMat);
        leg.position.set(x, 0.22, 0); leg.name = `leg_${i}`;
        group.add(leg);
      });

      // 鞋子
      [-0.14, 0.14].forEach(x => {
        const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.09, 0.26), shoeMat);
        shoe.position.set(x, -0.12, 0.04);
        group.add(shoe);
      });

      // 添加职业服装
      addOutfit(THREE, group, profile);

      // Agent 专属光源
      const agentLight = new THREE.PointLight(profile.color, 0.7, 2.8);
      agentLight.position.set(0, 1.2, 0);
      group.add(agentLight);

      // 办公桌
      const deskMat = new THREE.MeshStandardMaterial({ color: 0x2D3748, metalness: 0.3, roughness: 0.6 });
      const desk = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.06, 0.7), deskMat);
      desk.position.set(0, -0.2, 0.5);
      group.add(desk);

      // 桌腿
      const legDeskMat = new THREE.MeshStandardMaterial({ color: 0x374151, metalness: 0.6 });
      [[-0.55, 0.2], [0.55, 0.2], [-0.55, 0.8], [0.55, 0.8]].forEach(([x, z]) => {
        const dl = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.48, 6), legDeskMat);
        dl.position.set(x, -0.44, z);
        group.add(dl);
      });

      // 显示器
      const monitorMat = new THREE.MeshStandardMaterial({ color: 0x0D1117, emissive: profile.color, emissiveIntensity: 0.35, metalness: 0.8 });
      const monitor = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.43, 0.04), monitorMat);
      monitor.position.set(0, 0.25, 0.5);
      group.add(monitor);

      // 显示器支架
      const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.04, 0.2, 6),
        new THREE.MeshStandardMaterial({ color: 0x374151, metalness: 0.7 }));
      stand.position.set(0, 0.0, 0.5);
      group.add(stand);

      // 键盘
      const kb = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.02, 0.15),
        new THREE.MeshStandardMaterial({ color: 0x1F2937, roughness: 0.8 }));
      kb.position.set(0, -0.16, 0.6);
      group.add(kb);

      // 显示器屏幕光
      const screenLight = new THREE.PointLight(profile.color, 0.4, 1.8);
      screenLight.position.set(0, 0.25, 0.3);
      group.add(screenLight);

      return group;
    }

    async function buildScene(THREE: any, sceneConfig: typeof OFFICE_SCENES[0]) {
      const scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(sceneConfig.ambientColor, 0.035);

      const floorMat = new THREE.MeshStandardMaterial({ color: sceneConfig.floor, metalness: 0.2, roughness: 0.75 });
      const floor = new THREE.Mesh(new THREE.PlaneGeometry(30, 30, 20, 20), floorMat);
      floor.rotation.x = -Math.PI / 2; floor.position.y = -0.75;
      scene.add(floor);

      const grid = new THREE.GridHelper(30, 30, sceneConfig.accent, sceneConfig.wall);
      grid.position.y = -0.74;
      (grid.material as any).opacity = 0.22;
      (grid.material as any).transparent = true;
      scene.add(grid);

      const wallMat = new THREE.MeshStandardMaterial({ color: sceneConfig.wall, roughness: 0.9 });
      const wall = new THREE.Mesh(new THREE.PlaneGeometry(30, 8), wallMat);
      wall.position.set(0, 3, -8);
      scene.add(wall);

      for (let i = -2; i <= 2; i++) {
        const panelMat = new THREE.MeshStandardMaterial({ color: sceneConfig.light, emissive: sceneConfig.light, emissiveIntensity: 0.9 });
        const panel = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.04, 0.45), panelMat);
        panel.position.set(i * 3, 4.5, 0);
        scene.add(panel);
        const ceilLight = new THREE.PointLight(sceneConfig.light, 0.55, 6);
        ceilLight.position.set(i * 3, 4, 0);
        scene.add(ceilLight);
      }

      scene.add(new THREE.AmbientLight(sceneConfig.ambientColor, 2.2));
      scene.add(new THREE.HemisphereLight(sceneConfig.light, sceneConfig.floor, 0.45));

      // 装饰物
      const shelfMat = new THREE.MeshStandardMaterial({ color: 0x2D3748, roughness: 0.7 });
      const shelf = new THREE.Mesh(new THREE.BoxGeometry(2, 3, 0.38), shelfMat);
      shelf.position.set(-6.5, 0.75, -7.8);
      scene.add(shelf);

      const potMat = new THREE.MeshStandardMaterial({ color: 0x2D3748 });
      const leafMat = new THREE.MeshStandardMaterial({ color: 0x166534, emissive: 0x14532D, emissiveIntensity: 0.08 });
      [[-7.5, -7], [7.5, -7]].forEach(([x, z]) => {
        const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 0.38, 8), potMat);
        pot.position.set(x, -0.55, z);
        scene.add(pot);
        const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 8), leafMat);
        leaf.position.set(x, -0.1, z);
        scene.add(leaf);
      });

      return scene;
    }

    async function init() {
      THREE = await import('three');
      if (!canvasRef.current || !mounted) return;

      clockRef.current = new THREE.Clock();

      if (!rendererRef.current) {
        const renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current, antialias: true, alpha: false });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.shadowMap.enabled = true;
        rendererRef.current = renderer;
      }

      const sceneConfig = OFFICE_SCENES[currentScene];
      const scene = await buildScene(THREE, sceneConfig);
      sceneRef.current = scene;
      rendererRef.current.setClearColor(sceneConfig.ambientColor, 1);

      const camera = new THREE.PerspectiveCamera(52, canvasRef.current.clientWidth / canvasRef.current.clientHeight, 0.1, 100);
      camera.position.set(0, 3.5, 9);
      camera.lookAt(0, 0.5, 0);
      cameraRef.current = camera;

      agentMeshesRef.current.clear();
      agentPositionsRef.current.clear();
      connectionLinesRef.current = [];

      for (let i = 0; i < AGENT_PROFILES.length; i++) {
        const profile = AGENT_PROFILES[i];
        const angle = (i / AGENT_PROFILES.length) * Math.PI - Math.PI / 2;
        const radius = 4.5;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius * 0.5;

        const agentGroup = await buildHumanoidAgent(THREE, profile);
        agentGroup.position.set(x, -0.75, z);
        agentGroup.lookAt(new THREE.Vector3(0, 0.5, 0));
        scene.add(agentGroup);
        agentMeshesRef.current.set(profile.key, { group: agentGroup, profile, baseY: -0.75, t: i * 0.8 });
        agentPositionsRef.current.set(profile.key, { x, z });
      }

      const onResize = () => {
        if (!canvasRef.current || !cameraRef.current) return;
        const w = canvasRef.current.clientWidth, h = canvasRef.current.clientHeight;
        cameraRef.current.aspect = w / h;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current?.setSize(w, h);
      };
      window.addEventListener('resize', onResize);
      onResize();

      setTimeout(() => { if (mounted) setIsInitialLoading(false); }, 1300);
      setThreeLoaded(true);

      function animate() {
        if (!mounted) return;
        requestAnimationFrame(animate);
        const t = clockRef.current.getElapsedTime();

        if (cameraRef.current) {
          cameraRef.current.position.x = Math.sin(t * 0.04) * 1.8;
          cameraRef.current.position.y = 3.5 + Math.sin(t * 0.07) * 0.25;
          cameraRef.current.lookAt(0, 0.5, 0);
        }

        agentMeshesRef.current.forEach(({ group, profile, t: offset }) => {
          const isActive = activeAgents.includes(profile.key);
          group.position.y = -0.75 + Math.sin(t * 1.1 + offset) * 0.035;

          if (isActive) {
            group.position.y += Math.sin(t * 2.8 + offset) * 0.045;
            const head = group.children.find((c: any) => c.name === 'head');
            if (head) {
              head.rotation.y = Math.sin(t * 1.8 + offset) * 0.18;
              head.rotation.x = Math.abs(Math.sin(t * 2.2 + offset)) * 0.08;
            }
            group.children.forEach((c: any) => {
              if (c.name === 'arm_0') c.rotation.z = 0.18 + Math.sin(t * 3 + offset) * 0.12;
              if (c.name === 'arm_1') c.rotation.z = -0.18 - Math.sin(t * 3 + offset + 0.5) * 0.12;
            });
          } else {
            const head = group.children.find((c: any) => c.name === 'head');
            if (head) { head.rotation.y = Math.sin(t * 0.5 + offset) * 0.05; head.rotation.x = 0; }
          }

          const light = group.children.find((c: any) => c.isLight && c.position.y > 1);
          if (light) light.intensity = isActive ? 1.1 + Math.sin(t * 3.5) * 0.35 : 0.35;
        });

        // 更新协作连线（在 Three.js 中绘制发光线）
        connectionLinesRef.current.forEach(line => sceneRef.current?.remove(line));
        connectionLinesRef.current = [];

        if (showCollabLines && activeConversation && sceneRef.current) {
          const fromPos = agentPositionsRef.current.get(activeConversation.from);
          const toPos = agentPositionsRef.current.get(activeConversation.to);
          if (fromPos && toPos) {
            const points = [
              new THREE.Vector3(fromPos.x, 1.2, fromPos.z),
              new THREE.Vector3((fromPos.x + toPos.x) / 2, 2.5, (fromPos.z + toPos.z) / 2),
              new THREE.Vector3(toPos.x, 1.2, toPos.z),
            ];
            const curve = new THREE.QuadraticBezierCurve3(points[0], points[1], points[2]);
            const lineGeo = new THREE.BufferGeometry().setFromPoints(curve.getPoints(20));
            const lineMat = new THREE.LineBasicMaterial({
              color: 0x7C5CFC,
              transparent: true,
              opacity: 0.6 + Math.sin(t * 4) * 0.3,
            });
            const line = new THREE.Line(lineGeo, lineMat);
            sceneRef.current.add(line);
            connectionLinesRef.current.push(line);
          }
        }

        rendererRef.current?.render(sceneRef.current, cameraRef.current);
      }
      animate();

      return () => window.removeEventListener('resize', onResize);
    }

    init().catch(console.error);
    return () => { mounted = false; cancelAnimationFrame(animFrameRef.current); };
  }, [currentScene]);

  return (
    <div className="relative w-full rounded-xl overflow-hidden border border-[var(--border-default)]" style={{ height }}>
      <canvas ref={canvasRef} className="w-full h-full" style={{ display: 'block' }} />

      <GlobalLoadingOverlay visible={isInitialLoading} />
      <SceneTransitionOverlay isTransitioning={sceneTransitioning} sceneName={OFFICE_SCENES[currentScene].name} />

      {/* 场景标签 */}
      {!isInitialLoading && (
        <div className="absolute top-3 left-3 flex items-center gap-2">
          <span className="text-[10px] text-[var(--text-muted)] bg-black/50 px-2 py-1 rounded-full backdrop-blur-sm font-mono">
            📍 {OFFICE_SCENES[currentScene].name}
          </span>
          {elevenlabsApiKey && (
            <span className="text-[9px] bg-[var(--brand-primary)]/20 text-[var(--brand-light)] px-1.5 py-0.5 rounded-full border border-[var(--brand-primary)]/30">
              ElevenLabs ✓
            </span>
          )}
        </div>
      )}

      {/* 控制按钮 */}
      {!isInitialLoading && (
        <div className="absolute top-3 right-3 flex gap-1.5">
          <button onClick={() => { setVoiceEnabled(v => !v); if (voiceEnabled) { window.speechSynthesis?.cancel(); audioRef.current?.pause(); } }}
            className={`w-7 h-7 rounded-lg backdrop-blur-sm flex items-center justify-center transition-all ${voiceEnabled ? 'bg-[var(--brand-primary)]/60 text-white' : 'bg-black/40 text-[var(--text-muted)] hover:text-white'}`}
            title={voiceEnabled ? '关闭语音' : '开启语音'}>
            {voiceEnabled ? <Volume2 size={12} /> : <VolumeX size={12} />}
          </button>
          <button onClick={switchScene}
            className="w-7 h-7 rounded-lg bg-black/40 backdrop-blur-sm flex items-center justify-center text-[var(--text-muted)] hover:text-white transition-colors"
            title="切换场景">
            <RefreshCw size={12} />
          </button>
        </div>
      )}

      {/* 协作对话提示 */}
      <AnimatePresence>
        {showCollabLines && activeConversation && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="absolute top-12 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-md"
            style={{ background: 'rgba(124,92,252,0.2)', border: '1px solid rgba(124,92,252,0.4)' }}
          >
            <Users size={11} className="text-[var(--brand-light)]" />
            <span className="text-[10px] text-white font-medium">
              {AGENT_PROFILES.find(a => a.key === activeConversation.from)?.name} ↔ {AGENT_PROFILES.find(a => a.key === activeConversation.to)?.name}
            </span>
            <span className="text-[9px] text-[var(--brand-light)]">· {activeConversation.topic}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 对话气泡 */}
      <div className="absolute bottom-3 left-0 right-0 flex flex-wrap justify-center gap-2 px-3">
        <AnimatePresence>
          {Object.entries(speechBubbles).map(([key, msg]) => {
            const profile = AGENT_PROFILES.find(a => a.key === key);
            if (!profile) return null;
            const colorHex = '#' + profile.color.toString(16).padStart(6, '0');
            return (
              <motion.div key={`${key}-${msg}`}
                initial={{ opacity: 0, y: 10, scale: 0.88 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.92 }}
                transition={{ duration: 0.25 }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[10px] font-medium backdrop-blur-md"
                style={{ background: `${colorHex}28`, border: `1px solid ${colorHex}55`, color: '#F1F5F9', maxWidth: 160 }}>
                <span className="flex-shrink-0">{profile.icon}</span>
                <span className="truncate">{msg}</span>
                {voiceEnabled && (
                  <div className="flex gap-0.5 flex-shrink-0 items-end h-3">
                    {[1, 2, 3].map(i => (
                      <motion.div key={i} className="w-0.5 rounded-full" style={{ background: colorHex }}
                        animate={{ height: ['2px', '8px', '2px'] }}
                        transition={{ duration: 0.5, delay: i * 0.1, repeat: Infinity }} />
                    ))}
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Agent 状态点 */}
      {!isInitialLoading && (
        <div className="absolute bottom-3 right-3 flex gap-1">
          {AGENT_PROFILES.map(p => {
            const colorHex = '#' + p.color.toString(16).padStart(6, '0');
            const isActive = activeAgents.includes(p.key);
            return (
              <div key={p.key} className="w-2 h-2 rounded-full transition-all duration-300"
                style={{ background: colorHex, boxShadow: isActive ? `0 0 6px ${colorHex}` : 'none', opacity: isActive ? 1 : 0.25 }}
                title={p.name} />
            );
          })}
        </div>
      )}
    </div>
  );
}

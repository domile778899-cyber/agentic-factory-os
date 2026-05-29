/**
 * AgentWorkspace3D v2.0 — 精美职业人型 Agent 3D 工作台
 * 新增功能：
 * - Web Speech API 语音播报（每个 Agent 独特音调）
 * - 更丰富的互动动作（点头/摇头/手臂摆动/打字动作）
 * - 科技感全局加载过渡动画（扫描线 + 进度条）
 * - 场景切换淡入淡出 + 粒子扫描效果
 * - 语音开关按钮
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Volume2, VolumeX, Maximize2, Cpu } from 'lucide-react';

// ─── Agent 职业定义 ───
export const AGENT_PROFILES = [
  { key: 'security_architect', name: '安全架构师', color: 0xF43F5E, accent: 0xFF6B6B, icon: '🔐', pitch: 0.8,
    phrases: ['正在分析安全漏洞...', '检查 OAuth 配置...', '加密存储已就绪！', '安全审计通过！', 'JWT 签名验证完成'] },
  { key: 'legal_compliance',   name: '合规法务官', color: 0xA78BFA, accent: 0xC4B5FD, icon: '⚖️', pitch: 0.9,
    phrases: ['审查隐私政策...', '合规框架检查中...', '数据安全法合规！', '用户协议已更新', 'GDPR 检查通过'] },
  { key: 'backend_engineer',   name: '后端工程师', color: 0x60A5FA, accent: 0x93C5FD, icon: '🏗️', pitch: 1.0,
    phrases: ['生成 API 接口...', '数据库设计中...', '微服务架构完成！', 'Docker 容器化就绪', 'tRPC 路由已注册'] },
  { key: 'ai_mentor',          name: 'AI编程导师', color: 0x38BDF8, accent: 0x7DD3FC, icon: '💻', pitch: 1.1,
    phrases: ['生成单元测试...', '代码质量检查...', '测试覆盖率 95%！', '代码审查完成', 'TypeScript 零错误'] },
  { key: 'data_analyst',       name: '数据分析师', color: 0x34D399, accent: 0x6EE7B7, icon: '📊', pitch: 1.05,
    phrases: ['分析数据模型...', '生成可视化图表...', '数据洞察完成！', '报告已生成', '趋势预测完成'] },
  { key: 'cyber_auditor',      name: '安全审计师', color: 0xFB923C, accent: 0xFDBA74, icon: '🛡️', pitch: 0.75,
    phrases: ['扫描代码漏洞...', 'OWASP 检查中...', '安全评分 A+！', '漏洞报告已生成', '渗透测试通过'] },
];

// ─── 办公场景定义 ───
const OFFICE_SCENES = [
  { name: '现代开放办公室', floor: 0x1A1A2E, wall: 0x16213E, accent: 0x0F3460, light: 0x7C5CFC, ambientColor: 0x1a1a2e },
  { name: '高科技服务器机房', floor: 0x0D1B2A, wall: 0x1B2838, accent: 0x00B4D8, light: 0x00B4D8, ambientColor: 0x0d1b2a },
  { name: '创意设计工作室', floor: 0x1A0A2E, wall: 0x2D1B69, accent: 0xF59E0B, light: 0xF59E0B, ambientColor: 0x1a0a2e },
  { name: '企业会议中心', floor: 0x0F1923, wall: 0x1C2B3A, accent: 0x34D399, light: 0x34D399, ambientColor: 0x0f1923 },
];

interface AgentWorkspace3DProps {
  activeAgents?: string[];
  agentMessages?: Record<string, string>;
  isBuilding?: boolean;
  height?: number;
}

// ─── 科技感场景切换覆盖层 ───
function SceneTransitionOverlay({ isTransitioning, sceneName }: { isTransitioning: boolean; sceneName: string }) {
  return (
    <AnimatePresence>
      {isTransitioning && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 z-20 flex flex-col items-center justify-center overflow-hidden"
          style={{ background: 'rgba(11,11,15,0.92)', backdropFilter: 'blur(4px)' }}
        >
          {/* 扫描线动画 */}
          <div className="absolute inset-0">
            {Array.from({ length: 10 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-full"
                style={{ top: `${i * 10}%`, height: '1px', background: 'linear-gradient(90deg, transparent, #7C5CFC, transparent)' }}
                initial={{ scaleX: 0, opacity: 0 }}
                animate={{ scaleX: [0, 1, 1, 0], opacity: [0, 0.8, 0.8, 0] }}
                transition={{ duration: 0.5, delay: i * 0.03, ease: 'easeInOut' }}
              />
            ))}
          </div>
          {/* 中心内容 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="relative z-10 flex flex-col items-center gap-3"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              <Cpu size={28} className="text-[#7C5CFC]" />
            </motion.div>
            <div className="text-[#A78BFA] text-xs font-bold font-mono tracking-widest uppercase">
              切换场景
            </div>
            <div className="text-white text-sm font-semibold">{sceneName}</div>
            {/* 进度条 */}
            <div className="w-40 h-0.5 bg-[rgba(255,255,255,0.1)] rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: 'linear-gradient(90deg, #7C5CFC, #38BDF8)' }}
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 0.45, ease: 'easeOut' }}
              />
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
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0 z-30 flex flex-col items-center justify-center"
          style={{ background: '#0B0B0F' }}
        >
          {/* 粒子网格背景 */}
          <div className="absolute inset-0 overflow-hidden opacity-30">
            {Array.from({ length: 20 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-px bg-[#7C5CFC]"
                style={{ left: `${(i / 20) * 100}%`, top: 0, bottom: 0 }}
                initial={{ scaleY: 0, opacity: 0 }}
                animate={{ scaleY: 1, opacity: [0, 0.5, 0] }}
                transition={{ duration: 0.8, delay: i * 0.04, ease: 'easeOut' }}
              />
            ))}
          </div>
          {/* Logo 区域 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="relative z-10 flex flex-col items-center gap-4"
          >
            <motion.div
              animate={{ boxShadow: ['0 0 20px rgba(124,92,252,0.3)', '0 0 40px rgba(124,92,252,0.6)', '0 0 20px rgba(124,92,252,0.3)'] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #7C5CFC, #5B3FD4)' }}
            >
              <Cpu size={32} className="text-white" />
            </motion.div>
            <div className="text-center">
              <div className="text-white text-sm font-bold mb-1">初始化 3D 工作台</div>
              <div className="text-[#475569] text-xs font-mono">加载 Agent 模型中...</div>
            </div>
            {/* 加载进度条 */}
            <div className="w-48 h-1 bg-[rgba(255,255,255,0.08)] rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: 'linear-gradient(90deg, #7C5CFC, #38BDF8)' }}
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 1.5, ease: 'easeOut' }}
              />
            </div>
            {/* Agent 名称滚动 */}
            <div className="flex gap-2">
              {AGENT_PROFILES.map((p, i) => (
                <motion.div
                  key={p.key}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="text-lg"
                  title={p.name}
                >
                  {p.icon}
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function AgentWorkspace3D({
  activeAgents = [],
  agentMessages = {},
  isBuilding = false,
  height = 380,
}: AgentWorkspace3DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<any>(null);
  const animFrameRef = useRef<number>(0);
  const agentMeshesRef = useRef<Map<string, any>>(new Map());
  const clockRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);
  const currentSceneObjRef = useRef<any>(null);

  const [currentScene, setCurrentScene] = useState(0);
  const [sceneTransitioning, setSceneTransitioning] = useState(false);
  const [threeLoaded, setThreeLoaded] = useState(false);
  const [speechBubbles, setSpeechBubbles] = useState<Record<string, string>>({});
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // ─── 语音播报 ───
  const speak = useCallback((text: string, pitch: number = 1.0) => {
    if (!voiceEnabled || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.rate = 1.1;
    utterance.pitch = pitch;
    utterance.volume = 0.7;
    window.speechSynthesis.speak(utterance);
  }, [voiceEnabled]);

  // ─── 对话气泡 + 语音 ───
  useEffect(() => {
    if (!isBuilding) { setSpeechBubbles({}); return; }
    const interval = setInterval(() => {
      const newBubbles: Record<string, string> = {};
      activeAgents.forEach(key => {
        const profile = AGENT_PROFILES.find(a => a.key === key);
        if (profile) {
          const phrase = agentMessages[key] || profile.phrases[Math.floor(Math.random() * profile.phrases.length)];
          newBubbles[key] = phrase;
          // 随机选一个 Agent 发声
          if (Math.random() < 0.4) speak(phrase, profile.pitch);
        }
      });
      setSpeechBubbles(newBubbles);
    }, 3000);
    return () => clearInterval(interval);
  }, [isBuilding, activeAgents, agentMessages, speak]);

  // ─── 场景切换 ───
  const switchScene = useCallback(() => {
    setSceneTransitioning(true);
    if (voiceEnabled && window.speechSynthesis) window.speechSynthesis.cancel();
    setTimeout(() => {
      setCurrentScene(s => (s + 1) % OFFICE_SCENES.length);
      setSceneTransitioning(false);
    }, 500);
  }, [voiceEnabled]);

  // 30秒自动切换
  useEffect(() => {
    const timer = setInterval(switchScene, 30000);
    return () => clearInterval(timer);
  }, [switchScene]);

  // ─── Three.js 初始化 ───
  useEffect(() => {
    let THREE: any;
    let frameId: number;
    let mounted = true;

    async function buildHumanoidAgent(THREE: any, profile: typeof AGENT_PROFILES[0]) {
      const group = new THREE.Group();
      const c = profile.color;
      const a = profile.accent;

      // 身体
      const bodyMat = new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 0.12, metalness: 0.35, roughness: 0.55 });
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.7, 0.28), bodyMat);
      body.position.y = 0.85;
      group.add(body);

      // 西装领带细节
      const tieGeo = new THREE.BoxGeometry(0.06, 0.35, 0.03);
      const tieMat = new THREE.MeshStandardMaterial({ color: a, emissive: a, emissiveIntensity: 0.3 });
      const tie = new THREE.Mesh(tieGeo, tieMat);
      tie.position.set(0, 0.82, 0.15);
      group.add(tie);

      // 头部
      const headMat = new THREE.MeshStandardMaterial({ color: 0xFFDBAC, roughness: 0.75 });
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 16), headMat);
      head.position.y = 1.47;
      head.scale.set(1, 1.08, 0.95);
      head.name = 'head';
      group.add(head);

      // 发型（使用 accent 颜色）
      const hairMat = new THREE.MeshStandardMaterial({ color: a, emissive: a, emissiveIntensity: 0.15, roughness: 0.9 });
      const hair = new THREE.Mesh(new THREE.SphereGeometry(0.23, 12, 12), hairMat);
      hair.position.set(0, 1.62, -0.02);
      hair.scale.set(1, 0.55, 1);
      group.add(hair);

      // 眼睛（发光）
      const eyeMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, emissive: a, emissiveIntensity: 1.0 });
      [-0.08, 0.08].forEach(x => {
        const eye = new THREE.Mesh(new THREE.SphereGeometry(0.033, 8, 8), eyeMat);
        eye.position.set(x, 1.48, 0.2);
        group.add(eye);
      });

      // 嘴巴（微笑）
      const mouthGeo = new THREE.TorusGeometry(0.05, 0.01, 4, 8, Math.PI);
      const mouthMat = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
      const mouth = new THREE.Mesh(mouthGeo, mouthMat);
      mouth.position.set(0, 1.39, 0.21);
      mouth.rotation.z = Math.PI;
      group.add(mouth);

      // 颈部
      const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 0.14, 8), headMat);
      neck.position.y = 1.27;
      group.add(neck);

      // 手臂（左右）
      const armMat = new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 0.08, metalness: 0.25, roughness: 0.65 });
      [-0.35, 0.35].forEach((x, i) => {
        const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.075, 0.48, 4, 8), armMat);
        arm.position.set(x, 0.76, 0);
        arm.rotation.z = i === 0 ? 0.18 : -0.18;
        arm.name = `arm_${i}`;
        group.add(arm);
      });

      // 手部
      const handMat = new THREE.MeshStandardMaterial({ color: 0xFFDBAC, roughness: 0.8 });
      [{ x: -0.42, y: 0.43 }, { x: 0.42, y: 0.43 }].forEach((pos, i) => {
        const hand = new THREE.Mesh(new THREE.SphereGeometry(0.085, 8, 8), handMat);
        hand.position.set(pos.x, pos.y, 0);
        hand.name = `hand_${i}`;
        group.add(hand);
      });

      // 腿部
      const legMat = new THREE.MeshStandardMaterial({ color: 0x1E293B, roughness: 0.7 });
      [-0.14, 0.14].forEach((x, i) => {
        const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.095, 0.52, 4, 8), legMat);
        leg.position.set(x, 0.22, 0);
        leg.name = `leg_${i}`;
        group.add(leg);
      });

      // 鞋子
      const shoeMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.5, metalness: 0.35 });
      [-0.14, 0.14].forEach(x => {
        const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.09, 0.26), shoeMat);
        shoe.position.set(x, -0.12, 0.04);
        group.add(shoe);
      });

      // 职业徽章（发光）
      const badgeMat = new THREE.MeshStandardMaterial({ color: a, emissive: a, emissiveIntensity: 0.7, metalness: 0.9 });
      const badge = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.07, 0.02), badgeMat);
      badge.position.set(0.18, 0.95, 0.15);
      group.add(badge);

      // 办公桌
      const deskMat = new THREE.MeshStandardMaterial({ color: 0x2D3748, metalness: 0.3, roughness: 0.6 });
      const desk = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.06, 0.7), deskMat);
      desk.position.set(0, -0.2, 0.5);
      group.add(desk);

      // 桌腿
      const legDeskMat = new THREE.MeshStandardMaterial({ color: 0x374151, metalness: 0.6 });
      [[-0.55, 0.2], [0.55, 0.2], [-0.55, 0.8], [0.55, 0.8]].forEach(([x, z]) => {
        const deskLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.48, 6), legDeskMat);
        deskLeg.position.set(x, -0.44, z);
        group.add(deskLeg);
      });

      // 显示器（发光屏幕）
      const monitorMat = new THREE.MeshStandardMaterial({ color: 0x0D1117, emissive: c, emissiveIntensity: 0.35, metalness: 0.8 });
      const monitor = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.43, 0.04), monitorMat);
      monitor.position.set(0, 0.25, 0.5);
      group.add(monitor);

      // 显示器支架
      const standMat = new THREE.MeshStandardMaterial({ color: 0x374151, metalness: 0.7 });
      const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.04, 0.2, 6), standMat);
      stand.position.set(0, 0.0, 0.5);
      group.add(stand);

      // 键盘（小矩形）
      const kbMat = new THREE.MeshStandardMaterial({ color: 0x1F2937, roughness: 0.8 });
      const kb = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.02, 0.15), kbMat);
      kb.position.set(0, -0.16, 0.6);
      group.add(kb);

      // Agent 专属光源
      const agentLight = new THREE.PointLight(c, 0.7, 2.8);
      agentLight.position.set(0, 1.2, 0);
      group.add(agentLight);

      // 显示器屏幕光
      const screenLight = new THREE.PointLight(c, 0.4, 1.8);
      screenLight.position.set(0, 0.25, 0.3);
      group.add(screenLight);

      return group;
    }

    async function buildScene(THREE: any, sceneConfig: typeof OFFICE_SCENES[0]) {
      const scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(sceneConfig.ambientColor, 0.035);

      // 地板
      const floorMat = new THREE.MeshStandardMaterial({ color: sceneConfig.floor, metalness: 0.2, roughness: 0.75 });
      const floor = new THREE.Mesh(new THREE.PlaneGeometry(30, 30, 20, 20), floorMat);
      floor.rotation.x = -Math.PI / 2;
      floor.position.y = -0.75;
      scene.add(floor);

      // 地板网格
      const grid = new THREE.GridHelper(30, 30, sceneConfig.accent, sceneConfig.wall);
      grid.position.y = -0.74;
      (grid.material as any).opacity = 0.25;
      (grid.material as any).transparent = true;
      scene.add(grid);

      // 后墙
      const wallMat = new THREE.MeshStandardMaterial({ color: sceneConfig.wall, roughness: 0.9 });
      const wall = new THREE.Mesh(new THREE.PlaneGeometry(30, 8), wallMat);
      wall.position.set(0, 3, -8);
      scene.add(wall);

      // 天花板灯光面板
      for (let i = -2; i <= 2; i++) {
        const panelMat = new THREE.MeshStandardMaterial({ color: sceneConfig.light, emissive: sceneConfig.light, emissiveIntensity: 0.9 });
        const panel = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.04, 0.45), panelMat);
        panel.position.set(i * 3, 4.5, 0);
        scene.add(panel);
        const ceilLight = new THREE.PointLight(sceneConfig.light, 0.55, 6);
        ceilLight.position.set(i * 3, 4, 0);
        scene.add(ceilLight);
      }

      // 环境光
      scene.add(new THREE.AmbientLight(sceneConfig.ambientColor, 2.2));
      scene.add(new THREE.HemisphereLight(sceneConfig.light, sceneConfig.floor, 0.45));

      // 书架装饰
      const shelfMat = new THREE.MeshStandardMaterial({ color: 0x2D3748, roughness: 0.7 });
      const shelf = new THREE.Mesh(new THREE.BoxGeometry(2, 3, 0.38), shelfMat);
      shelf.position.set(-6.5, 0.75, -7.8);
      scene.add(shelf);

      // 绿植
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

      // 创建或复用 Renderer
      if (!rendererRef.current) {
        const renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current, antialias: true, alpha: false });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        rendererRef.current = renderer;
      }

      const sceneConfig = OFFICE_SCENES[currentScene];
      const scene = await buildScene(THREE, sceneConfig);
      currentSceneObjRef.current = scene;
      rendererRef.current.setClearColor(sceneConfig.ambientColor, 1);

      const camera = new THREE.PerspectiveCamera(52, canvasRef.current.clientWidth / canvasRef.current.clientHeight, 0.1, 100);
      camera.position.set(0, 3.5, 9);
      camera.lookAt(0, 0.5, 0);
      cameraRef.current = camera;

      // 构建 Agent 人型（半圆排列）
      agentMeshesRef.current.clear();
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
      }

      // 响应式调整
      const onResize = () => {
        if (!canvasRef.current || !cameraRef.current) return;
        const w = canvasRef.current.clientWidth;
        const h = canvasRef.current.clientHeight;
        cameraRef.current.aspect = w / h;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current?.setSize(w, h);
      };
      window.addEventListener('resize', onResize);
      onResize();

      // 初始加载完成
      setTimeout(() => { if (mounted) setIsInitialLoading(false); }, 1200);
      setThreeLoaded(true);

      // 动画循环
      function animate() {
        if (!mounted) return;
        frameId = requestAnimationFrame(animate);
        const t = clockRef.current.getElapsedTime();

        // 相机缓慢环绕
        if (cameraRef.current) {
          cameraRef.current.position.x = Math.sin(t * 0.04) * 1.8;
          cameraRef.current.position.y = 3.5 + Math.sin(t * 0.07) * 0.25;
          cameraRef.current.lookAt(0, 0.5, 0);
        }

        // Agent 动画
        agentMeshesRef.current.forEach(({ group, profile, t: offset }) => {
          const isActive = activeAgents.includes(profile.key);

          // 基础呼吸
          group.position.y = -0.75 + Math.sin(t * 1.1 + offset) * 0.035;

          if (isActive) {
            // 弹跳
            group.position.y += Math.sin(t * 2.8 + offset) * 0.045;

            // 头部动作（点头 + 轻微摇头）
            const head = group.children.find((c: any) => c.name === 'head');
            if (head) {
              head.rotation.y = Math.sin(t * 1.8 + offset) * 0.18;
              head.rotation.x = Math.abs(Math.sin(t * 2.2 + offset)) * 0.08;
            }

            // 手臂摆动（打字动作）
            group.children.forEach((c: any) => {
              if (c.name === 'arm_0') c.rotation.z = 0.18 + Math.sin(t * 3 + offset) * 0.12;
              if (c.name === 'arm_1') c.rotation.z = -0.18 - Math.sin(t * 3 + offset + 0.5) * 0.12;
            });
          } else {
            // 待机：轻微摇摆
            const head = group.children.find((c: any) => c.name === 'head');
            if (head) {
              head.rotation.y = Math.sin(t * 0.5 + offset) * 0.05;
              head.rotation.x = 0;
            }
            group.children.forEach((c: any) => {
              if (c.name === 'arm_0') c.rotation.z = 0.18;
              if (c.name === 'arm_1') c.rotation.z = -0.18;
            });
          }

          // 发光强度
          const light = group.children.find((c: any) => c.isLight && c.position.y > 1);
          if (light) light.intensity = isActive ? 1.1 + Math.sin(t * 3.5) * 0.35 : 0.35;
        });

        rendererRef.current?.render(currentSceneObjRef.current, cameraRef.current);
      }
      animate();
      animFrameRef.current = frameId;

      return () => window.removeEventListener('resize', onResize);
    }

    init().catch(console.error);

    return () => {
      mounted = false;
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [currentScene]);

  return (
    <div className="relative w-full rounded-xl overflow-hidden border border-[var(--border-default)]" style={{ height }}>
      {/* Canvas */}
      <canvas ref={canvasRef} className="w-full h-full" style={{ display: 'block' }} />

      {/* 全局初始加载动画 */}
      <GlobalLoadingOverlay visible={isInitialLoading} />

      {/* 场景切换过渡动画 */}
      <SceneTransitionOverlay isTransitioning={sceneTransitioning} sceneName={OFFICE_SCENES[currentScene].name} />

      {/* 场景名称标签 */}
      {!isInitialLoading && (
        <div className="absolute top-3 left-3">
          <span className="text-[10px] text-[var(--text-muted)] bg-black/50 px-2 py-1 rounded-full backdrop-blur-sm font-mono">
            📍 {OFFICE_SCENES[currentScene].name}
          </span>
        </div>
      )}

      {/* 控制按钮 */}
      {!isInitialLoading && (
        <div className="absolute top-3 right-3 flex gap-1.5">
          {/* 语音开关 */}
          <button
            onClick={() => {
              setVoiceEnabled(v => !v);
              if (voiceEnabled && window.speechSynthesis) window.speechSynthesis.cancel();
            }}
            className={`w-7 h-7 rounded-lg backdrop-blur-sm flex items-center justify-center transition-all ${voiceEnabled ? 'bg-[var(--brand-primary)]/60 text-white' : 'bg-black/40 text-[var(--text-muted)] hover:text-white'}`}
            title={voiceEnabled ? '关闭语音播报' : '开启语音播报'}
          >
            {voiceEnabled ? <Volume2 size={12} /> : <VolumeX size={12} />}
          </button>
          {/* 切换场景 */}
          <button
            onClick={switchScene}
            className="w-7 h-7 rounded-lg bg-black/40 backdrop-blur-sm flex items-center justify-center text-[var(--text-muted)] hover:text-white transition-colors"
            title="切换场景"
          >
            <RefreshCw size={12} />
          </button>
        </div>
      )}

      {/* 对话气泡 */}
      <div className="absolute bottom-3 left-0 right-0 flex flex-wrap justify-center gap-2 px-3">
        <AnimatePresence>
          {Object.entries(speechBubbles).map(([key, msg]) => {
            const profile = AGENT_PROFILES.find(a => a.key === key);
            if (!profile) return null;
            const colorHex = '#' + profile.color.toString(16).padStart(6, '0');
            return (
              <motion.div
                key={`${key}-${msg}`}
                initial={{ opacity: 0, y: 10, scale: 0.88 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.92 }}
                transition={{ duration: 0.25 }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[10px] font-medium backdrop-blur-md"
                style={{ background: `${colorHex}28`, border: `1px solid ${colorHex}55`, color: '#F1F5F9', maxWidth: 160 }}
              >
                <span className="flex-shrink-0">{profile.icon}</span>
                <span className="truncate">{msg}</span>
                {/* 语音波形指示器 */}
                {voiceEnabled && (
                  <div className="flex gap-0.5 flex-shrink-0">
                    {[1, 2, 3].map(i => (
                      <motion.div
                        key={i}
                        className="w-0.5 rounded-full"
                        style={{ background: colorHex }}
                        animate={{ height: ['3px', '8px', '3px'] }}
                        transition={{ duration: 0.5, delay: i * 0.1, repeat: Infinity }}
                      />
                    ))}
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Agent 状态指示点 */}
      {!isInitialLoading && (
        <div className="absolute bottom-3 right-3 flex gap-1">
          {AGENT_PROFILES.map(p => {
            const colorHex = '#' + p.color.toString(16).padStart(6, '0');
            const isActive = activeAgents.includes(p.key);
            return (
              <div
                key={p.key}
                className="w-2 h-2 rounded-full transition-all duration-300"
                style={{
                  background: colorHex,
                  boxShadow: isActive ? `0 0 6px ${colorHex}` : 'none',
                  opacity: isActive ? 1 : 0.25,
                }}
                title={p.name}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

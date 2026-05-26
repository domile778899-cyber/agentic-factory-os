/**
 * AgentWorkspace3D — 精美职业人型 Agent 3D 工作台
 * 特性：
 * - 每个 Agent 独特人型外观（颜色/配件/职业标识）
 * - 多办公场景随机切换（会议室/开放办公/机房/创意工作室）
 * - 构建时 Agent 说话气泡
 * - 场景切换淡入淡出动画
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Maximize2 } from 'lucide-react';

// ─── Agent 职业定义 ───
export const AGENT_PROFILES = [
  { key: 'security_architect', name: '安全架构师', color: 0xF43F5E, accent: 0xFF6B6B, icon: '🔐', desk: 'security', phrases: ['正在分析安全漏洞...', '检查 OAuth 配置...', '加密存储已就绪！', '安全审计通过 ✓'] },
  { key: 'legal_compliance',   name: '合规法务官', color: 0xA78BFA, accent: 0xC4B5FD, icon: '⚖️', desk: 'legal',    phrases: ['审查隐私政策...', '合规框架检查中...', '数据安全法合规 ✓', '用户协议已更新'] },
  { key: 'backend_engineer',   name: '后端工程师', color: 0x60A5FA, accent: 0x93C5FD, icon: '🏗️', desk: 'code',     phrases: ['生成 API 接口...', '数据库设计中...', '微服务架构完成！', 'Docker 容器化就绪'] },
  { key: 'ai_mentor',          name: 'AI编程导师', color: 0x38BDF8, accent: 0x7DD3FC, icon: '💻', desk: 'code',     phrases: ['生成单元测试...', '代码质量检查...', '测试覆盖率 95%！', '代码审查完成 ✓'] },
  { key: 'data_analyst',       name: '数据分析师', color: 0x34D399, accent: 0x6EE7B7, icon: '📊', desk: 'data',     phrases: ['分析数据模型...', '生成可视化图表...', '数据洞察完成！', '报告已生成 ✓'] },
  { key: 'cyber_auditor',      name: '安全审计师', color: 0xFB923C, accent: 0xFDBA74, icon: '🛡️', desk: 'security', phrases: ['扫描代码漏洞...', 'OWASP 检查中...', '安全评分: A+！', '漏洞报告已生成'] },
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

export default function AgentWorkspace3D({ activeAgents = [], agentMessages = {}, isBuilding = false, height = 380 }: AgentWorkspace3DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<any>(null);
  const rendererRef = useRef<any>(null);
  const animFrameRef = useRef<number>(0);
  const agentMeshesRef = useRef<Map<string, any>>(new Map());
  const [currentScene, setCurrentScene] = useState(0);
  const [sceneTransitioning, setSceneTransitioning] = useState(false);
  const [threeLoaded, setThreeLoaded] = useState(false);
  const [speechBubbles, setSpeechBubbles] = useState<Record<string, string>>({});

  // Update speech bubbles when agents are active
  useEffect(() => {
    if (!isBuilding) { setSpeechBubbles({}); return; }
    const interval = setInterval(() => {
      const newBubbles: Record<string, string> = {};
      activeAgents.forEach(key => {
        const profile = AGENT_PROFILES.find(a => a.key === key);
        if (profile) {
          const phrase = profile.phrases[Math.floor(Math.random() * profile.phrases.length)];
          newBubbles[key] = agentMessages[key] || phrase;
        }
      });
      setSpeechBubbles(newBubbles);
    }, 2500);
    return () => clearInterval(interval);
  }, [isBuilding, activeAgents, agentMessages]);

  const switchScene = useCallback(() => {
    setSceneTransitioning(true);
    setTimeout(() => {
      setCurrentScene(s => (s + 1) % OFFICE_SCENES.length);
      setSceneTransitioning(false);
    }, 400);
  }, []);

  // Auto-switch scene every 30 seconds
  useEffect(() => {
    const timer = setInterval(switchScene, 30000);
    return () => clearInterval(timer);
  }, [switchScene]);

  useEffect(() => {
    let THREE: any;
    let renderer: any, scene: any, camera: any;
    let frameId: number;
    let clock: any;

    async function buildHumanoidAgent(THREE: any, profile: typeof AGENT_PROFILES[0], sceneConfig: typeof OFFICE_SCENES[0]) {
      const group = new THREE.Group();

      // ── Body (torso) ──
      const bodyGeo = new THREE.BoxGeometry(0.5, 0.7, 0.28);
      const bodyMat = new THREE.MeshStandardMaterial({ color: profile.color, emissive: profile.color, emissiveIntensity: 0.15, metalness: 0.4, roughness: 0.5 });
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.position.y = 0.85;
      group.add(body);

      // ── Suit jacket detail ──
      const jacketGeo = new THREE.BoxGeometry(0.52, 0.72, 0.3);
      const jacketMat = new THREE.MeshStandardMaterial({ color: profile.accent, emissive: profile.accent, emissiveIntensity: 0.05, metalness: 0.2, roughness: 0.7, wireframe: false });
      const jacket = new THREE.Mesh(jacketGeo, jacketMat);
      jacket.position.set(0, 0.85, 0);
      jacket.scale.set(0.6, 0.95, 0.5);
      group.add(jacket);

      // ── Head ──
      const headGeo = new THREE.SphereGeometry(0.22, 16, 16);
      const headMat = new THREE.MeshStandardMaterial({ color: 0xFFDBAC, emissive: 0xFFDBAC, emissiveIntensity: 0.05, roughness: 0.8 });
      const head = new THREE.Mesh(headGeo, headMat);
      head.position.y = 1.47;
      head.scale.set(1, 1.1, 0.95);
      group.add(head);

      // ── Hair ──
      const hairGeo = new THREE.SphereGeometry(0.23, 12, 12);
      const hairMat = new THREE.MeshStandardMaterial({ color: profile.color, emissive: profile.color, emissiveIntensity: 0.2, roughness: 0.9 });
      const hair = new THREE.Mesh(hairGeo, hairMat);
      hair.position.set(0, 1.62, -0.02);
      hair.scale.set(1, 0.6, 1);
      group.add(hair);

      // ── Eyes ──
      const eyeGeo = new THREE.SphereGeometry(0.035, 8, 8);
      const eyeMat = new THREE.MeshStandardMaterial({ color: 0x111111, emissive: profile.accent, emissiveIntensity: 0.8 });
      [-0.08, 0.08].forEach(x => {
        const eye = new THREE.Mesh(eyeGeo, eyeMat);
        eye.position.set(x, 1.48, 0.2);
        group.add(eye);
      });

      // ── Neck ──
      const neckGeo = new THREE.CylinderGeometry(0.08, 0.09, 0.15, 8);
      const neckMat = new THREE.MeshStandardMaterial({ color: 0xFFDBAC, roughness: 0.8 });
      const neck = new THREE.Mesh(neckGeo, neckMat);
      neck.position.y = 1.27;
      group.add(neck);

      // ── Arms ──
      const armGeo = new THREE.CapsuleGeometry(0.08, 0.5, 4, 8);
      const armMat = new THREE.MeshStandardMaterial({ color: profile.color, emissive: profile.color, emissiveIntensity: 0.1, metalness: 0.3, roughness: 0.6 });
      [-0.35, 0.35].forEach((x, i) => {
        const arm = new THREE.Mesh(armGeo, armMat);
        arm.position.set(x, 0.75, 0);
        arm.rotation.z = i === 0 ? 0.2 : -0.2;
        group.add(arm);
      });

      // ── Hands ──
      const handGeo = new THREE.SphereGeometry(0.09, 8, 8);
      const handMat = new THREE.MeshStandardMaterial({ color: 0xFFDBAC, roughness: 0.8 });
      [{ x: -0.42, y: 0.42 }, { x: 0.42, y: 0.42 }].forEach(pos => {
        const hand = new THREE.Mesh(handGeo, handMat);
        hand.position.set(pos.x, pos.y, 0);
        group.add(hand);
      });

      // ── Legs ──
      const legGeo = new THREE.CapsuleGeometry(0.1, 0.55, 4, 8);
      const legMat = new THREE.MeshStandardMaterial({ color: 0x1E293B, roughness: 0.7 });
      [-0.14, 0.14].forEach(x => {
        const leg = new THREE.Mesh(legGeo, legMat);
        leg.position.set(x, 0.22, 0);
        group.add(leg);
      });

      // ── Shoes ──
      const shoeGeo = new THREE.BoxGeometry(0.16, 0.1, 0.28);
      const shoeMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.5, metalness: 0.3 });
      [-0.14, 0.14].forEach(x => {
        const shoe = new THREE.Mesh(shoeGeo, shoeMat);
        shoe.position.set(x, -0.12, 0.04);
        group.add(shoe);
      });

      // ── Profession badge/accessory ──
      const badgeGeo = new THREE.BoxGeometry(0.12, 0.08, 0.02);
      const badgeMat = new THREE.MeshStandardMaterial({ color: profile.accent, emissive: profile.accent, emissiveIntensity: 0.6, metalness: 0.8 });
      const badge = new THREE.Mesh(badgeGeo, badgeMat);
      badge.position.set(0.18, 0.95, 0.15);
      group.add(badge);

      // ── Agent glow light ──
      const agentLight = new THREE.PointLight(profile.color, 0.8, 2.5);
      agentLight.position.set(0, 1.2, 0);
      group.add(agentLight);

      // ── Desk ──
      const deskGeo = new THREE.BoxGeometry(1.2, 0.06, 0.7);
      const deskMat = new THREE.MeshStandardMaterial({ color: 0x2D3748, metalness: 0.3, roughness: 0.6 });
      const desk = new THREE.Mesh(deskGeo, deskMat);
      desk.position.set(0, -0.2, 0.5);
      group.add(desk);

      // ── Monitor ──
      const monitorGeo = new THREE.BoxGeometry(0.7, 0.45, 0.04);
      const monitorMat = new THREE.MeshStandardMaterial({ color: 0x111827, emissive: profile.color, emissiveIntensity: 0.3, metalness: 0.8 });
      const monitor = new THREE.Mesh(monitorGeo, monitorMat);
      monitor.position.set(0, 0.25, 0.5);
      group.add(monitor);

      // Monitor screen glow
      const screenLight = new THREE.PointLight(profile.color, 0.5, 1.5);
      screenLight.position.set(0, 0.25, 0.3);
      group.add(screenLight);

      // ── Desk legs ──
      const deskLegGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.5, 6);
      const deskLegMat = new THREE.MeshStandardMaterial({ color: 0x374151, metalness: 0.6 });
      [[-0.55, 0.2], [0.55, 0.2], [-0.55, 0.8], [0.55, 0.8]].forEach(([x, z]) => {
        const leg = new THREE.Mesh(deskLegGeo, deskLegMat);
        leg.position.set(x, -0.45, z);
        group.add(leg);
      });

      return group;
    }

    async function buildScene(THREE: any, sceneConfig: typeof OFFICE_SCENES[0]) {
      const scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(sceneConfig.ambientColor, 0.04);

      // Floor
      const floorGeo = new THREE.PlaneGeometry(30, 30, 20, 20);
      const floorMat = new THREE.MeshStandardMaterial({ color: sceneConfig.floor, metalness: 0.3, roughness: 0.7 });
      const floor = new THREE.Mesh(floorGeo, floorMat);
      floor.rotation.x = -Math.PI / 2;
      floor.position.y = -0.75;
      scene.add(floor);

      // Floor grid lines
      const gridHelper = new THREE.GridHelper(30, 30, sceneConfig.accent, sceneConfig.wall);
      gridHelper.position.y = -0.74;
      gridHelper.material.opacity = 0.3;
      gridHelper.material.transparent = true;
      scene.add(gridHelper);

      // Back wall
      const wallGeo = new THREE.PlaneGeometry(30, 8);
      const wallMat = new THREE.MeshStandardMaterial({ color: sceneConfig.wall, roughness: 0.9 });
      const wall = new THREE.Mesh(wallGeo, wallMat);
      wall.position.set(0, 3, -8);
      scene.add(wall);

      // Ceiling lights (office panels)
      for (let i = -2; i <= 2; i++) {
        const lightPanelGeo = new THREE.BoxGeometry(1.5, 0.05, 0.5);
        const lightPanelMat = new THREE.MeshStandardMaterial({ color: sceneConfig.light, emissive: sceneConfig.light, emissiveIntensity: 0.8 });
        const panel = new THREE.Mesh(lightPanelGeo, lightPanelMat);
        panel.position.set(i * 3, 4.5, 0);
        scene.add(panel);
        const ceilLight = new THREE.PointLight(sceneConfig.light, 0.6, 6);
        ceilLight.position.set(i * 3, 4, 0);
        scene.add(ceilLight);
      }

      // Ambient + hemisphere light
      scene.add(new THREE.AmbientLight(sceneConfig.ambientColor, 2));
      const hemi = new THREE.HemisphereLight(sceneConfig.light, sceneConfig.floor, 0.5);
      scene.add(hemi);

      // Scene-specific decorations
      // Bookshelf on wall
      const shelfGeo = new THREE.BoxGeometry(2, 3, 0.4);
      const shelfMat = new THREE.MeshStandardMaterial({ color: 0x2D3748, roughness: 0.7 });
      const shelf = new THREE.Mesh(shelfGeo, shelfMat);
      shelf.position.set(-6, 0.75, -7.8);
      scene.add(shelf);

      // Plants
      const plantGeo = new THREE.CylinderGeometry(0.15, 0.2, 0.4, 8);
      const plantMat = new THREE.MeshStandardMaterial({ color: 0x2D3748 });
      const leafGeo = new THREE.SphereGeometry(0.3, 8, 8);
      const leafMat = new THREE.MeshStandardMaterial({ color: 0x166534, emissive: 0x14532D, emissiveIntensity: 0.1 });
      [[-7, -7], [7, -7]].forEach(([x, z]) => {
        const pot = new THREE.Mesh(plantGeo, plantMat);
        pot.position.set(x, -0.55, z);
        scene.add(pot);
        const leaf = new THREE.Mesh(leafGeo, leafMat);
        leaf.position.set(x, -0.1, z);
        scene.add(leaf);
      });

      return scene;
    }

    async function init() {
      THREE = await import('three');
      clock = new THREE.Clock();
      if (!canvasRef.current) return;

      renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current, antialias: true, alpha: false });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      rendererRef.current = renderer;

      const sceneConfig = OFFICE_SCENES[currentScene];
      scene = await buildScene(THREE, sceneConfig);
      sceneRef.current = scene;
      renderer.setClearColor(sceneConfig.ambientColor, 1);

      camera = new THREE.PerspectiveCamera(55, canvasRef.current.clientWidth / canvasRef.current.clientHeight, 0.1, 100);
      camera.position.set(0, 3.5, 9);
      camera.lookAt(0, 0.5, 0);

      // Build agents in a semicircle
      const agentCount = AGENT_PROFILES.length;
      for (let i = 0; i < agentCount; i++) {
        const profile = AGENT_PROFILES[i];
        const angle = (i / agentCount) * Math.PI - Math.PI / 2;
        const radius = 4.5;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius * 0.5;

        const agentGroup = await buildHumanoidAgent(THREE, profile, sceneConfig);
        agentGroup.position.set(x, -0.75, z);
        agentGroup.lookAt(0, 0, 0);
        scene.add(agentGroup);
        agentMeshesRef.current.set(profile.key, { group: agentGroup, profile, baseY: -0.75, t: i * 0.8 });
      }

      // Resize handler
      const onResize = () => {
        if (!canvasRef.current) return;
        const w = canvasRef.current.clientWidth, h = canvasRef.current.clientHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      };
      window.addEventListener('resize', onResize);
      onResize();

      setThreeLoaded(true);

      // Animate
      function animate() {
        frameId = requestAnimationFrame(animate);
        const t = clock.getElapsedTime();

        // Camera gentle orbit
        camera.position.x = Math.sin(t * 0.05) * 1.5;
        camera.position.y = 3.5 + Math.sin(t * 0.08) * 0.3;
        camera.lookAt(0, 0.5, 0);

        // Agent animations
        agentMeshesRef.current.forEach(({ group, profile, t: offset }) => {
          const isActive = activeAgents.includes(profile.key);
          // Idle breathing
          group.position.y = -0.75 + Math.sin(t * 1.2 + offset) * 0.04;
          // Active agents bounce more
          if (isActive) {
            group.position.y += Math.sin(t * 3 + offset) * 0.05;
            // Head bob
            const head = group.children.find((c: any) => c.geometry?.type === 'SphereGeometry' && c.position.y > 1.4);
            if (head) head.rotation.y = Math.sin(t * 2 + offset) * 0.15;
          }
          // Glow intensity
          const light = group.children.find((c: any) => c.isLight);
          if (light) light.intensity = isActive ? 1.2 + Math.sin(t * 4) * 0.4 : 0.4;
        });

        renderer.render(scene, camera);
      }
      animate();
      animFrameRef.current = frameId;
    }

    init().catch(console.error);
    return () => {
      cancelAnimationFrame(animFrameRef.current);
      rendererRef.current?.dispose();
    };
  }, [currentScene]);

  return (
    <div className="relative w-full rounded-xl overflow-hidden border border-[var(--border-default)]" style={{ height }}>
      {/* Canvas */}
      <AnimatePresence>
        <motion.div
          key={currentScene}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="absolute inset-0"
        >
          <canvas ref={canvasRef} className="w-full h-full" style={{ display: 'block' }} />
        </motion.div>
      </AnimatePresence>

      {/* Loading */}
      {!threeLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-[var(--bg-base)]">
          <div className="text-center">
            <div className="w-10 h-10 rounded-full border-2 border-[var(--brand-primary)] border-t-transparent animate-spin mx-auto mb-2" />
            <div className="text-xs text-[var(--text-secondary)]">加载 3D 场景...</div>
          </div>
        </div>
      )}

      {/* Scene Name */}
      <div className="absolute top-3 left-3 flex items-center gap-2">
        <span className="text-[10px] text-[var(--text-muted)] bg-black/40 px-2 py-1 rounded-full backdrop-blur-sm">
          📍 {OFFICE_SCENES[currentScene].name}
        </span>
      </div>

      {/* Controls */}
      <div className="absolute top-3 right-3 flex gap-1.5">
        <button onClick={switchScene} className="w-7 h-7 rounded-lg bg-black/40 backdrop-blur-sm flex items-center justify-center text-[var(--text-secondary)] hover:text-white transition-colors" title="切换场景">
          <RefreshCw size={12} />
        </button>
      </div>

      {/* Speech Bubbles */}
      <div className="absolute bottom-3 left-0 right-0 flex flex-wrap justify-center gap-2 px-3">
        <AnimatePresence>
          {Object.entries(speechBubbles).map(([key, msg]) => {
            const profile = AGENT_PROFILES.find(a => a.key === key);
            if (!profile) return null;
            return (
              <motion.div
                key={`${key}-${msg}`}
                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -5, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[10px] font-medium backdrop-blur-md"
                style={{ background: `${profile.color.toString(16).padStart(6, '0')}30`.replace(/^/, '#'), border: `1px solid #${profile.color.toString(16).padStart(6, '0')}60`, color: '#F1F5F9' }}
              >
                <span>{profile.icon}</span>
                <span className="max-w-[120px] truncate">{msg}</span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Agent Status Dots */}
      <div className="absolute bottom-3 right-3 flex gap-1">
        {AGENT_PROFILES.map(p => (
          <div
            key={p.key}
            className="w-2 h-2 rounded-full transition-all"
            style={{
              background: `#${p.color.toString(16).padStart(6, '0')}`,
              boxShadow: activeAgents.includes(p.key) ? `0 0 6px #${p.color.toString(16).padStart(6, '0')}` : 'none',
              opacity: activeAgents.includes(p.key) ? 1 : 0.3,
            }}
            title={p.name}
          />
        ))}
      </div>
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Box, Zap, RefreshCw, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { trpc } from '@/lib/trpc';

const AGENT_POSITIONS = [
  { key: 'security_architect', x: -2.5, z: -1.5, color: 0xF43F5E, label: '安全架构师' },
  { key: 'backend_engineer',   x:  0,   z: -2.5, color: 0x60A5FA, label: '后端工程师' },
  { key: 'ai_mentor',          x:  2.5, z: -1.5, color: 0x38BDF8, label: 'AI编程导师' },
  { key: 'data_analyst',       x: -2.5, z:  1.5, color: 0x34D399, label: '数据分析师' },
  { key: 'cyber_auditor',      x:  0,   z:  2.5, color: 0xF59E0B, label: '安全审计' },
  { key: 'researcher',         x:  2.5, z:  1.5, color: 0x818CF8, label: '研究员' },
];

export default function WorkspacePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<any>(null);
  const sceneRef = useRef<any>(null);
  const animFrameRef = useRef<number>(0);
  const [isBuilding, setIsBuilding] = useState(false);
  const [activeAgents, setActiveAgents] = useState<string[]>([]);
  const [threeLoaded, setThreeLoaded] = useState(false);

  const { data: agents } = trpc.agents.list.useQuery();

  useEffect(() => {
    let THREE: any;
    let renderer: any, scene: any, camera: any;
    let agentMeshes: Map<string, any> = new Map();
    let particles: any;
    let frameId: number;

    async function init() {
      THREE = await import('three');
      if (!canvasRef.current) return;

      // Renderer
      renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current, antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(canvasRef.current.clientWidth, canvasRef.current.clientHeight);
      renderer.setClearColor(0x0B0B0F, 1);
      rendererRef.current = renderer;

      // Scene
      scene = new THREE.Scene();
      sceneRef.current = scene;

      // Camera
      camera = new THREE.PerspectiveCamera(60, canvasRef.current.clientWidth / canvasRef.current.clientHeight, 0.1, 100);
      camera.position.set(0, 6, 8);
      camera.lookAt(0, 0, 0);

      // Ambient light
      scene.add(new THREE.AmbientLight(0x1a1a2e, 3));

      // Brand glow light
      const brandLight = new THREE.PointLight(0x7C5CFC, 2, 15);
      brandLight.position.set(0, 4, 0);
      scene.add(brandLight);

      // Grid floor
      const gridHelper = new THREE.GridHelper(12, 12, 0x1E1E28, 0x1E1E28);
      scene.add(gridHelper);

      // Central platform
      const platformGeo = new THREE.CylinderGeometry(1.2, 1.2, 0.1, 32);
      const platformMat = new THREE.MeshStandardMaterial({ color: 0x7C5CFC, emissive: 0x7C5CFC, emissiveIntensity: 0.3, metalness: 0.8, roughness: 0.2 });
      const platform = new THREE.Mesh(platformGeo, platformMat);
      platform.position.y = -0.05;
      scene.add(platform);

      // Central core sphere
      const coreGeo = new THREE.SphereGeometry(0.5, 32, 32);
      const coreMat = new THREE.MeshStandardMaterial({ color: 0x7C5CFC, emissive: 0x9B7BFF, emissiveIntensity: 0.8, metalness: 1, roughness: 0 });
      const core = new THREE.Mesh(coreGeo, coreMat);
      core.position.y = 0.8;
      scene.add(core);

      // Agent meshes
      AGENT_POSITIONS.forEach(({ key, x, z, color, label }) => {
        const group = new THREE.Group();

        // Body
        const bodyGeo = new THREE.BoxGeometry(0.6, 0.8, 0.4);
        const bodyMat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.2, metalness: 0.6, roughness: 0.3 });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = 0.4;
        group.add(body);

        // Head
        const headGeo = new THREE.BoxGeometry(0.45, 0.45, 0.45);
        const headMat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.4, metalness: 0.8, roughness: 0.1 });
        const head = new THREE.Mesh(headGeo, headMat);
        head.position.y = 1.05;
        group.add(head);

        // Point light per agent
        const light = new THREE.PointLight(color, 0.5, 3);
        light.position.y = 1;
        group.add(light);

        group.position.set(x, 0, z);
        scene.add(group);
        agentMeshes.set(key, { group, body, head, light, color, baseY: 0 });
      });

      // Particle system (floating dots)
      const particleCount = 200;
      const positions = new Float32Array(particleCount * 3);
      for (let i = 0; i < particleCount; i++) {
        positions[i * 3]     = (Math.random() - 0.5) * 20;
        positions[i * 3 + 1] = Math.random() * 8;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 20;
      }
      const particleGeo = new THREE.BufferGeometry();
      particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const particleMat = new THREE.PointsMaterial({ color: 0x7C5CFC, size: 0.05, transparent: true, opacity: 0.6 });
      particles = new THREE.Points(particleGeo, particleMat);
      scene.add(particles);

      // Orbit controls (manual)
      let isDragging = false, prevMouse = { x: 0, y: 0 };
      let spherical = { theta: 0, phi: Math.PI / 4, radius: 10 };

      canvasRef.current?.addEventListener('mousedown', e => { isDragging = true; prevMouse = { x: e.clientX, y: e.clientY }; });
      window.addEventListener('mouseup', () => { isDragging = false; });
      window.addEventListener('mousemove', e => {
        if (!isDragging) return;
        spherical.theta -= (e.clientX - prevMouse.x) * 0.01;
        spherical.phi = Math.max(0.2, Math.min(Math.PI / 2.2, spherical.phi + (e.clientY - prevMouse.y) * 0.01));
        prevMouse = { x: e.clientX, y: e.clientY };
      });
      canvasRef.current?.addEventListener('wheel', e => {
        spherical.radius = Math.max(5, Math.min(20, spherical.radius + e.deltaY * 0.01));
      });

      // Resize
      const onResize = () => {
        if (!canvasRef.current) return;
        const w = canvasRef.current.clientWidth, h = canvasRef.current.clientHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      };
      window.addEventListener('resize', onResize);

      setThreeLoaded(true);

      // Animation loop
      let t = 0;
      function animate() {
        frameId = requestAnimationFrame(animate);
        t += 0.01;

        // Camera orbit
        camera.position.x = spherical.radius * Math.sin(spherical.theta) * Math.sin(spherical.phi);
        camera.position.y = spherical.radius * Math.cos(spherical.phi);
        camera.position.z = spherical.radius * Math.cos(spherical.theta) * Math.sin(spherical.phi);
        camera.lookAt(0, 0.5, 0);

        // Core pulse
        core.rotation.y += 0.01;
        core.scale.setScalar(1 + Math.sin(t * 2) * 0.05);

        // Agent animations
        agentMeshes.forEach(({ group, head, light }, key) => {
          const isActive = activeAgents.includes(key);
          group.position.y = Math.sin(t + AGENT_POSITIONS.findIndex(a => a.key === key)) * 0.1;
          head.rotation.y += 0.02;
          light.intensity = isActive ? 1.5 + Math.sin(t * 3) * 0.5 : 0.3;
        });

        // Particles
        particles.rotation.y += 0.001;

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
  }, []);

  // Update active agents
  useEffect(() => {
    if (isBuilding) {
      const keys = AGENT_POSITIONS.map(a => a.key);
      let i = 0;
      const interval = setInterval(() => {
        setActiveAgents(keys.slice(0, i + 1));
        i++;
        if (i >= keys.length) { clearInterval(interval); setTimeout(() => { setIsBuilding(false); setActiveAgents([]); }, 2000); }
      }, 800);
      return () => clearInterval(interval);
    }
  }, [isBuilding]);

  return (
    <div className="h-full flex flex-col p-6 gap-4">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--warning)]/20 border border-[var(--warning)]/30 flex items-center justify-center">
            <Box size={20} className="text-[var(--warning)]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">3D 虚拟工作台</h1>
            <p className="text-sm text-[var(--text-secondary)]">实时可视化 AI 代理人协作过程</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => setIsBuilding(true)}
            disabled={isBuilding}
            className="btn-brand gap-2 h-8 text-xs"
          >
            <Zap size={13} />
            {isBuilding ? '构建中...' : '模拟构建'}
          </Button>
        </div>
      </motion.div>

      {/* 3D Canvas */}
      <div className="flex-1 relative rounded-xl overflow-hidden border border-[var(--border-default)] min-h-[400px]">
        <canvas ref={canvasRef} className="w-full h-full" style={{ display: 'block' }} />

        {/* Overlay info */}
        <div className="absolute top-4 left-4 space-y-2">
          {AGENT_POSITIONS.map(a => (
            <motion.div
              key={a.key}
              animate={{ opacity: activeAgents.includes(a.key) ? 1 : 0.4 }}
              className="flex items-center gap-2 text-xs"
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ background: `#${a.color.toString(16).padStart(6, '0')}`, boxShadow: activeAgents.includes(a.key) ? `0 0 8px #${a.color.toString(16).padStart(6, '0')}` : 'none' }}
              />
              <span className={activeAgents.includes(a.key) ? 'text-white font-medium' : 'text-[var(--text-muted)]'}>{a.label}</span>
              {activeAgents.includes(a.key) && <span className="badge-success text-[10px]">执行中</span>}
            </motion.div>
          ))}
        </div>

        {/* Controls hint */}
        <div className="absolute bottom-4 right-4 text-[10px] text-[var(--text-muted)] text-right">
          <div>拖拽旋转视角</div>
          <div>滚轮缩放</div>
        </div>

        {!threeLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-[var(--bg-base)]">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full border-2 border-[var(--brand-primary)] border-t-transparent animate-spin mx-auto mb-3" />
              <div className="text-sm text-[var(--text-secondary)]">加载 3D 场景...</div>
            </div>
          </div>
        )}
      </div>

      {/* Agent Status Bar */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {AGENT_POSITIONS.map(a => (
          <motion.div
            key={a.key}
            animate={{ borderColor: activeAgents.includes(a.key) ? `#${a.color.toString(16).padStart(6, '0')}` : 'var(--border-subtle)' }}
            className="glass-card p-3 text-center"
          >
            <div
              className="w-8 h-8 rounded-lg mx-auto mb-1.5 flex items-center justify-center"
              style={{ background: `#${a.color.toString(16).padStart(6, '0')}20` }}
            >
              <div className="w-3 h-3 rounded-full" style={{ background: `#${a.color.toString(16).padStart(6, '0')}`, boxShadow: activeAgents.includes(a.key) ? `0 0 8px #${a.color.toString(16).padStart(6, '0')}` : 'none' }} />
            </div>
            <div className="text-[10px] text-[var(--text-secondary)] truncate">{a.label}</div>
            <div className="text-[10px] font-medium mt-0.5" style={{ color: activeAgents.includes(a.key) ? `#${a.color.toString(16).padStart(6, '0')}` : 'var(--text-muted)' }}>
              {activeAgents.includes(a.key) ? '执行中' : '待命'}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

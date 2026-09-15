'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { Space, Tag, Typography, Button, Tooltip, Spin } from 'antd';
import {
  RobotOutlined,
  ThunderboltOutlined,
  EyeOutlined,
  CompassOutlined,
  SyncOutlined,
  AimOutlined,
  CameraOutlined,
  FullscreenOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  FireOutlined,
  SlidersOutlined,
  DashboardOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { factoryZones } from './Factory3DTwin';

const { Text } = Typography;

export default function Factory3DThree({ onSelectStation }) {
  const containerRef = useRef(null);
  const [selectedView, setSelectedView] = useState('ALL');
  const [isAutoRotate, setIsAutoRotate] = useState(true);
  const [hoveredZone, setHoveredZone] = useState(null);
  const [screenLabels, setScreenLabels] = useState([]);
  const [isLoadingGLB, setIsLoadingGLB] = useState(true);

  // Three.js References
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const composerRef = useRef(null);

  const isDraggingRef = useRef(false);
  const prevMousePosRef = useRef({ x: 0, y: 0 });
  const cameraAngleRef = useRef({ theta: Math.PI * 0.28, phi: Math.PI * 0.28, radius: 38 });
  const targetCameraPosRef = useRef(null);
  const targetLookAtRef = useRef(new THREE.Vector3(0, 1.5, 0));
  const currentLookAtRef = useRef(new THREE.Vector3(0, 1.5, 0));

  const animObjectsRef = useRef({
    beams: [],
    hologramRings: [],
    particles: null,
    streamPulseConduits: []
  });

  const zoneCoordinates = {
    ZONE_CORE: { x: 0, z: 0 },
    ZONE_INDUSTRY: { x: -11, z: -10 },
    ZONE_SUPERMARKET: { x: 11, z: -10 },
    ZONE_LOGISTICS: { x: -11, z: 10 },
    ZONE_DEXTEROUS: { x: 11, z: 10 },
    ZONE_COCKPIT: { x: 20, z: 0 }
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;

    // --- 1. Scene, Camera & ACESFilmic Renderer Setup ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x060d1d);
    scene.fog = new THREE.FogExp2(0x060d1d, 0.012);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // --- 2. Post-Processing Bloom Pipeline ---
    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(width, height),
      0.65, // strength
      0.35, // radius
      0.85  // threshold
    );
    composer.addPass(bloomPass);
    composerRef.current = composer;

    // Camera Init
    const updateCameraPos = () => {
      const { theta, phi, radius } = cameraAngleRef.current;
      camera.position.x = currentLookAtRef.current.x + radius * Math.sin(phi) * Math.sin(theta);
      camera.position.y = currentLookAtRef.current.y + radius * Math.cos(phi);
      camera.position.z = currentLookAtRef.current.z + radius * Math.sin(phi) * Math.cos(theta);
      camera.lookAt(currentLookAtRef.current);
    };
    updateCameraPos();

    // --- 3. Studio Industrial Lighting ---
    const ambientLight = new THREE.AmbientLight(0x2a3e5c, 2.6);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.4);
    keyLight.position.set(25, 40, 30);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x38bdf8, 1.4);
    fillLight.position.set(-30, 25, -20);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xa855f7, 1.0);
    rimLight.position.set(0, 20, -35);
    scene.add(rimLight);

    const corePointLight = new THREE.PointLight(0x00f2fe, 3.5, 25);
    corePointLight.position.set(0, 2.5, 0);
    scene.add(corePointLight);

    // --- 4. Load GLB Model Generated from Blender MCP ---
    const loader = new GLTFLoader();
    loader.load(
      '/models/factory_full.glb',
      (gltf) => {
        const model = gltf.scene;
        model.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        scene.add(model);
        setIsLoadingGLB(false);
      },
      undefined,
      (err) => {
        console.warn('GLB load error, fallback to runtime scene:', err);
        setIsLoadingGLB(false);
      }
    );

    // --- 5. Central Holographic Light Beams & Data Flow ---
    const beamGeo = new THREE.CylinderGeometry(1.2, 1.8, 7.0, 24, 1, true);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0x00f2fe,
      transparent: true,
      opacity: 0.25,
      side: THREE.DoubleSide
    });
    const beam = new THREE.Mesh(beamGeo, beamMat);
    beam.position.set(0, 3.8, 0);
    scene.add(beam);
    animObjectsRef.current.beams.push(beam);

    [1.8, 2.5, 3.2].forEach((radius, i) => {
      const ringGeo = new THREE.RingGeometry(radius - 0.05, radius, 36);
      const ringMat = new THREE.MeshBasicMaterial({
        color: i % 2 === 0 ? 0x00f2fe : 0x00f5a0,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.8
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.set(0, 1.2 + i * 0.4, 0);
      scene.add(ring);
      animObjectsRef.current.hologramRings.push({ ring, speed: (i + 1) * 0.02 * (i % 2 === 0 ? 1 : -1) });
    });

    // Conduit tubes with traveling pulse packets
    const createStreamConduit = (tx, tz, color = 0x00f2fe) => {
      const points = [
        new THREE.Vector3(0, 0.15, 0),
        new THREE.Vector3(tx * 0.45, 0.15, 0),
        new THREE.Vector3(tx * 0.45, 0.15, tz),
        new THREE.Vector3(tx, 0.15, tz)
      ];
      const curve = new THREE.CatmullRomCurve3(points);
      const tubeGeo = new THREE.TubeGeometry(curve, 36, 0.04, 8, false);
      const tubeMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.7 });
      const tube = new THREE.Mesh(tubeGeo, tubeMat);
      scene.add(tube);

      const pulseSphere = new THREE.Mesh(
        new THREE.SphereGeometry(0.12, 10, 10),
        new THREE.MeshBasicMaterial({ color: 0xffffff })
      );
      scene.add(pulseSphere);
      animObjectsRef.current.streamPulseConduits.push({ curve, pulseSphere, progress: Math.random(), speed: 0.008 });
    };

    createStreamConduit(-11, -10, 0x00f5a0);
    createStreamConduit(11, -10, 0x00f5a0);
    createStreamConduit(-11, 10, 0x00f5a0);
    createStreamConduit(11, 10, 0x00f2fe);
    createStreamConduit(20, 0, 0x00f2fe);

    // Floating Particles
    const particleGeo = new THREE.BufferGeometry();
    const particleCount = 140;
    const posArray = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      posArray[i] = (Math.random() - 0.5) * 60;
      posArray[i + 1] = Math.random() * 16 + 0.5;
      posArray[i + 2] = (Math.random() - 0.5) * 60;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const particleMat = new THREE.PointsMaterial({
      size: 0.25,
      color: 0x00f2fe,
      transparent: true,
      opacity: 0.75
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);
    animObjectsRef.current.particles = particles;

    // --- 6. Mouse Drag Orbit Controls ---
    const onMouseDown = (e) => {
      isDraggingRef.current = true;
      prevMousePosRef.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e) => {
      if (isDraggingRef.current) {
        setIsAutoRotate(false);
        const deltaX = e.clientX - prevMousePosRef.current.x;
        const deltaY = e.clientY - prevMousePosRef.current.y;
        prevMousePosRef.current = { x: e.clientX, y: e.clientY };

        cameraAngleRef.current.theta -= deltaX * 0.005;
        cameraAngleRef.current.phi = Math.max(0.12, Math.min(Math.PI * 0.44, cameraAngleRef.current.phi + deltaY * 0.005));
        updateCameraPos();
      }
    };

    const onMouseUp = () => {
      isDraggingRef.current = false;
    };

    const onWheel = (e) => {
      e.preventDefault();
      cameraAngleRef.current.radius = Math.max(14, Math.min(60, cameraAngleRef.current.radius + e.deltaY * 0.03));
      updateCameraPos();
    };

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    container.addEventListener('wheel', onWheel, { passive: false });

    // --- 7. Animation Loop ---
    let animId;
    let clock = new THREE.Clock();

    const animate = () => {
      const elapsed = clock.getElapsedTime();

      if (isAutoRotate && !isDraggingRef.current && !targetCameraPosRef.current) {
        cameraAngleRef.current.theta += 0.002;
        updateCameraPos();
      }

      if (targetCameraPosRef.current) {
        camera.position.lerp(targetCameraPosRef.current, 0.06);
        currentLookAtRef.current.lerp(targetLookAtRef.current, 0.06);
        camera.lookAt(currentLookAtRef.current);

        if (camera.position.distanceTo(targetCameraPosRef.current) < 0.1) {
          targetCameraPosRef.current = null;
        }
      }

      // Stream Pulse
      animObjectsRef.current.streamPulseConduits.forEach(stream => {
        stream.progress = (stream.progress + stream.speed) % 1;
        const pt = stream.curve.getPoint(stream.progress);
        if (pt) stream.pulseSphere.position.copy(pt);
      });

      // Hologram Rings & Beams
      animObjectsRef.current.hologramRings.forEach(({ ring, speed }) => {
        ring.rotation.z += speed;
      });

      animObjectsRef.current.beams.forEach(b => {
        b.rotation.y = elapsed * 0.6;
        b.scale.set(1 + Math.sin(elapsed * 3) * 0.08, 1, 1 + Math.sin(elapsed * 3) * 0.08);
      });

      // Float Particles
      if (animObjectsRef.current.particles) {
        const positions = animObjectsRef.current.particles.geometry.attributes.position.array;
        for (let i = 1; i < positions.length; i += 3) {
          positions[i] += Math.sin(elapsed + i) * 0.02;
        }
        animObjectsRef.current.particles.geometry.attributes.position.needsUpdate = true;
      }

      // Project 3D Screen Coordinates for Holographic Badges
      const labels = [];
      factoryZones.forEach(zone => {
        const coords = zoneCoordinates[zone.id];
        if (coords) {
          const worldPos = new THREE.Vector3(coords.x, 3.2, coords.z);
          worldPos.project(camera);

          if (worldPos.z < 1) {
            const sx = (worldPos.x * 0.5 + 0.5) * width;
            const sy = (-(worldPos.y * 0.5) + 0.5) * height;
            labels.push({ ...zone, sx, sy });
          }
        }
      });
      setScreenLabels(labels);

      composer.render();
      animId = requestAnimationFrame(animate);
    };

    animate();

    // Resize
    const handleResize = () => {
      if (!container || !renderer || !camera || !composer) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      composer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      container.removeEventListener('wheel', onWheel);
      window.removeEventListener('resize', handleResize);
      if (renderer.domElement && renderer.domElement.parentElement) {
        renderer.domElement.parentElement.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [isAutoRotate]);

  const handleViewChange = (viewId) => {
    setSelectedView(viewId);
    setIsAutoRotate(false);

    if (viewId === 'ALL') {
      targetCameraPosRef.current = new THREE.Vector3(20, 24, 28);
      targetLookAtRef.current = new THREE.Vector3(0, 1.5, 0);
    } else {
      const coords = zoneCoordinates[viewId];
      if (coords) {
        targetCameraPosRef.current = new THREE.Vector3(coords.x + 7, 9, coords.z + 9);
        targetLookAtRef.current = new THREE.Vector3(coords.x, 1.5, coords.z);
      }
    }
  };

  const handleZoneClick = (zone) => {
    handleViewChange(zone.id);
    if (onSelectStation && zone.stationData) {
      onSelectStation(zone.stationData);
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Top 3D Control Bar */}
      <div style={{
        position: 'relative',
        zIndex: 20,
        padding: '10px 18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'linear-gradient(180deg, rgba(8, 20, 48, 0.9) 0%, rgba(6, 12, 28, 0.4) 100%)',
        borderBottom: '1px solid rgba(0, 242, 254, 0.2)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#00f5a0', boxShadow: '0 0 10px #00f5a0' }} />
            <span style={{ fontSize: 13, fontWeight: 800, color: '#ffffff', letterSpacing: 0.5 }}>
              WebGL Three.js 影视级数字孪生数采车间 (Blender 5.2 实时几何资产)
            </span>
          </div>
          <Tag color="cyan" style={{ border: '1px solid rgba(0,242,254,0.3)', background: 'rgba(0,242,254,0.1)' }}>
            <CheckCircleOutlined /> Blender GLB 资产驱动
          </Tag>
          <Tag color="green" style={{ border: '1px solid rgba(0,245,160,0.3)', background: 'rgba(0,245,160,0.1)' }}>
            16 机器人协同在线
          </Tag>
        </div>

        {/* 3D Camera Controls & View Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Button
            size="small"
            type="text"
            icon={isAutoRotate ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
            onClick={() => setIsAutoRotate(!isAutoRotate)}
            style={{
              color: isAutoRotate ? '#00f2fe' : '#8da4c4',
              background: 'rgba(0, 242, 254, 0.1)',
              border: '1px solid rgba(0, 242, 254, 0.25)',
              fontSize: 11
            }}
          >
            {isAutoRotate ? '停止巡航' : '自动巡航'}
          </Button>

          <span style={{ fontSize: 11, color: '#8da4c4', marginLeft: 4 }}><AimOutlined /> 3D运镜:</span>
          {[
            { id: 'ALL', label: '3D全景' },
            { id: 'ZONE_CORE', label: '算力总线' },
            { id: 'ZONE_INDUSTRY', label: '工业装配' },
            { id: 'ZONE_SUPERMARKET', label: '商超冷柜' },
            { id: 'ZONE_LOGISTICS', label: '物流码垛' },
            { id: 'ZONE_DEXTEROUS', label: '精密灵巧' },
            { id: 'ZONE_COCKPIT', label: '质检中控' },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => handleViewChange(item.id)}
              style={{
                padding: '3px 10px',
                fontSize: 11,
                borderRadius: 14,
                border: selectedView === item.id ? '1px solid #00f2fe' : '1px solid rgba(255,255,255,0.15)',
                background: selectedView === item.id ? 'rgba(0, 242, 254, 0.25)' : 'rgba(0, 0, 0, 0.4)',
                color: selectedView === item.id ? '#00f2fe' : '#8da4c4',
                cursor: 'pointer',
                transition: 'all 0.2s',
                fontWeight: selectedView === item.id ? 700 : 400
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* WebGL 3D Canvas Viewport */}
      <div
        ref={containerRef}
        style={{
          position: 'relative',
          flex: 1,
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          cursor: 'grab'
        }}
      >
        {isLoadingGLB && (
          <div style={{
            position: 'absolute',
            inset: 0,
            zIndex: 30,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(6, 13, 29, 0.85)',
            gap: 12
          }}>
            <Spin size="large" />
            <span style={{ fontSize: 13, color: '#00f2fe', fontWeight: 600 }}>
              正在装载 Blender 5.2 渲染生成的 3D 数字孪生资产...
            </span>
          </div>
        )}

        {/* Floating 2D Hologram Labels projected from 3D Coordinates */}
        {screenLabels.map((zone) => {
          const isActive = hoveredZone === zone.id || selectedView === zone.id;
          return (
            <div
              key={zone.id}
              onClick={() => handleZoneClick(zone)}
              onMouseEnter={() => setHoveredZone(zone.id)}
              onMouseLeave={() => setHoveredZone(null)}
              style={{
                position: 'absolute',
                left: zone.sx,
                top: zone.sy,
                transform: 'translate(-50%, -100%)',
                pointerEvents: 'auto',
                cursor: 'pointer',
                zIndex: isActive ? 40 : 10,
                transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              <div style={{
                background: isActive
                  ? 'linear-gradient(135deg, rgba(8, 28, 64, 0.95) 0%, rgba(4, 14, 34, 0.98) 100%)'
                  : 'linear-gradient(135deg, rgba(10, 22, 45, 0.85) 0%, rgba(5, 12, 28, 0.9) 100%)',
                border: isActive ? `1.5px solid ${zone.statusColor}` : '1px solid rgba(0, 242, 254, 0.3)',
                boxShadow: isActive ? `0 12px 30px rgba(0,0,0,0.85), 0 0 25px ${zone.statusColor}` : '0 4px 15px rgba(0,0,0,0.6)',
                borderRadius: 8,
                padding: '6px 12px',
                backdropFilter: 'blur(10px)',
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                minWidth: 140,
                transform: isActive ? 'scale(1.1) translateY(-2px)' : 'scale(1)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ fontSize: 13 }}>{zone.badgeIcon}</span>
                    <span style={{ fontSize: 12, fontWeight: 800, color: '#ffffff', whiteSpace: 'nowrap' }}>
                      {zone.name}
                    </span>
                  </div>
                  <span style={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    background: zone.statusColor,
                    boxShadow: `0 0 8px ${zone.statusColor}`
                  }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 10, color: '#8da4c4', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 3 }}>
                  <span>{Object.keys(zone.stats)[0] === 'throughput' ? '总线:' : '工位:'}</span>
                  <span style={{ color: zone.statusColor, fontWeight: 700 }}>
                    {Object.values(zone.stats)[0]}
                  </span>
                  <span style={{ color: '#00f2fe' }}>
                    {Object.values(zone.stats)[1]}
                  </span>
                </div>
              </div>

              {/* Pin indicator */}
              <div style={{ width: 2, height: 12, background: zone.statusColor, margin: '0 auto' }} />
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: zone.statusColor, margin: '0 auto', boxShadow: `0 0 8px ${zone.statusColor}` }} />
            </div>
          );
        })}
      </div>

      {/* Bottom Hint Banner */}
      <div style={{
        position: 'relative',
        zIndex: 20,
        padding: '6px 20px',
        background: 'rgba(5, 12, 28, 0.85)',
        borderTop: '1px solid rgba(0, 242, 254, 0.18)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: 11,
        color: '#8da4c4'
      }}>
        <span>💡 <b>3D交互</b>：按住鼠标左键可 360° 旋转视角，滚轮缩放；点击任意工作岛可平滑推进下钻详情</span>
        <Space size={14}>
          <span><span style={{ color: '#00f5a0' }}>●</span> 采集中 (4 岛)</span>
          <span><span style={{ color: '#00f2fe' }}>●</span> 质检复核 (1 岛)</span>
          <span><span style={{ color: '#38bdf8' }}>●</span> PTP硬件锁相 (0.032ms)</span>
        </Space>
      </div>
    </div>
  );
}

import React, { useState, useMemo } from 'react';
import {
  X,
  Search,
  ExternalLink,
  ShieldCheck,
  Cpu,
  Layers,
  Sparkles,
  Box,
  Eye,
  PlusCircle,
  CheckCircle2,
  Filter,
  DownloadCloud,
  Compass
} from 'lucide-react';
import {
  SIMREADY_CENTRAL_ASSETS,
  SIMREADY_CATEGORIES,
  SimReadyAssetItem
} from '../../data/simreadyCentralAssets';
import { SceneId } from '../../types';

interface SimReadyCentralModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSceneId: SceneId;
  onMountAsset: (asset: SimReadyAssetItem) => void;
  onInspectAsset: (usdAssetId: string) => void;
}

export const SimReadyCentralModal: React.FC<SimReadyCentralModalProps> = ({
  isOpen,
  onClose,
  currentSceneId,
  onMountAsset,
  onInspectAsset
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [mountedAssetIds, setMountedAssetIds] = useState<Set<string>>(new Set());
  const [activeAsset, setActiveAsset] = useState<SimReadyAssetItem>(SIMREADY_CENTRAL_ASSETS[0]);

  const filteredAssets = useMemo(() => {
    return SIMREADY_CENTRAL_ASSETS.filter((item) => {
      const matchCat = selectedCategory === 'all' || item.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.usdAssetId.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.material.toLowerCase().includes(q);
      return matchCat && matchQuery;
    });
  }, [selectedCategory, searchQuery]);

  if (!isOpen) return null;

  const handleMount = (asset: SimReadyAssetItem) => {
    onMountAsset(asset);
    setMountedAssetIds((prev) => new Set([...prev, asset.id]));
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1100,
        backgroundColor: 'rgba(5, 10, 20, 0.88)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        animation: 'fadeIn 0.25s ease'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '1240px',
          height: '88vh',
          maxHeight: '900px',
          backgroundColor: '#0c1220',
          border: '1px solid rgba(0, 242, 254, 0.35)',
          borderRadius: '16px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7), 0 0 35px rgba(0, 242, 254, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Header Bar */}
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(90deg, rgba(16, 185, 129, 0.12) 0%, rgba(0, 242, 254, 0.12) 100%)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #10b981 0%, #00f2fe 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#000',
                boxShadow: '0 0 16px rgba(0, 242, 254, 0.5)'
              }}
            >
              <Cpu size={24} strokeWidth={2.5} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                  NVIDIA SimReady Central · OpenUSD 3D 资产库
                </h2>
                <span
                  style={{
                    fontSize: '11px',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    background: 'rgba(16, 185, 129, 0.2)',
                    color: '#34d399',
                    border: '1px solid rgba(16, 185, 129, 0.4)',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <ShieldCheck size={13} />
                  Foundation Certified
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    background: 'rgba(0, 242, 254, 0.15)',
                    color: '#00f2fe',
                    border: '1px solid rgba(0, 242, 254, 0.35)',
                    fontWeight: 600
                  }}
                >
                  2,500+ 仿真级资产
                </span>
              </div>
              <p style={{ fontSize: '12px', color: '#94a3b8', margin: '3px 0 0 0' }}>
                来自 Hugging Face 官方空间（<code>nvidia/simready-central</code> 与 <code>nvidia/simready-assets</code>），具备真实质量、质心分布与摩擦刚体碰撞体。
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <a
              href="https://huggingface.co/spaces/nvidia/simready-central"
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                fontSize: '12px',
                color: '#38bdf8',
                background: 'rgba(56, 189, 248, 0.1)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                borderRadius: '6px',
                textDecoration: 'none',
                fontWeight: 500,
                transition: 'all 0.2s ease'
              }}
            >
              <span>HF Space 原生页面</span>
              <ExternalLink size={13} />
            </a>
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: 'none',
                borderRadius: '8px',
                width: '34px',
                height: '34px',
                color: '#94a3b8',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease'
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div
          style={{
            padding: '14px 24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            background: 'rgba(15, 23, 42, 0.6)'
          }}
        >
          {/* Categories */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            {SIMREADY_CATEGORIES.map((cat) => {
              const active = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  style={{
                    padding: '6px 12px',
                    fontSize: '12px',
                    fontWeight: active ? 600 : 500,
                    color: active ? '#00f2fe' : '#94a3b8',
                    background: active ? 'rgba(0, 242, 254, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                    border: active ? '1px solid rgba(0, 242, 254, 0.45)' : '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '8px',
              padding: '6px 12px',
              width: '280px'
            }}
          >
            <Search size={15} color="#94a3b8" />
            <input
              type="text"
              placeholder="搜索 SimReady 3D 资产..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: '#f8fafc',
                fontSize: '13px',
                width: '100%'
              }}
            />
          </div>
        </div>

        {/* Content Body: Left Grid + Right Detail Inspector */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* Left: Asset Cards Grid */}
          <div
            style={{
              flex: 1,
              padding: '20px 24px',
              overflowY: 'auto',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
              gap: '16px',
              alignContent: 'start'
            }}
          >
            {filteredAssets.length === 0 ? (
              <div
                style={{
                  gridColumn: '1 / -1',
                  textAlign: 'center',
                  padding: '60px 0',
                  color: '#64748b'
                }}
              >
                <Box size={40} strokeWidth={1.5} style={{ margin: '0 auto 12px' }} />
                <p style={{ fontSize: '14px', margin: 0 }}>未检索到符合条件的 SimReady 3D 资产</p>
                <p style={{ fontSize: '12px', color: '#475569', marginTop: '6px' }}>可尝试切换分类标签或缩短关键词</p>
              </div>
            ) : (
              filteredAssets.map((asset) => {
                const isSelected = activeAsset.id === asset.id;
                const isMounted = mountedAssetIds.has(asset.id);
                return (
                  <div
                    key={asset.id}
                    onClick={() => setActiveAsset(asset)}
                    style={{
                      backgroundColor: isSelected ? 'rgba(0, 242, 254, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                      border: isSelected ? '1px solid #00f2fe' : '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      flexDirection: 'column'
                    }}
                  >
                    {/* Thumbnail */}
                    <div
                      style={{
                        height: '130px',
                        position: 'relative',
                        backgroundColor: '#161f30',
                        overflow: 'hidden'
                      }}
                    >
                      <img
                        src={asset.previewUrl}
                        alt={asset.name}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          opacity: 0.9
                        }}
                      />
                      <div
                        style={{
                          position: 'absolute',
                          top: '8px',
                          left: '8px',
                          background: 'rgba(12, 18, 32, 0.85)',
                          backdropFilter: 'blur(4px)',
                          padding: '3px 7px',
                          borderRadius: '6px',
                          fontSize: '10px',
                          color: '#34d399',
                          fontWeight: 600,
                          border: '1px solid rgba(16, 185, 129, 0.35)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px'
                        }}
                      >
                        <ShieldCheck size={11} />
                        SimReady
                      </div>
                      <div
                        style={{
                          position: 'absolute',
                          bottom: '6px',
                          right: '8px',
                          background: 'rgba(0, 0, 0, 0.75)',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '10px',
                          color: '#94a3b8',
                          fontFamily: 'monospace'
                        }}
                      >
                        {asset.weight}
                      </div>
                    </div>

                    {/* Card Body */}
                    <div style={{ padding: '12px', flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div>
                        <div style={{ fontSize: '10px', color: '#38bdf8', fontWeight: 600 }}>{asset.categoryLabel}</div>
                        <h4
                          style={{
                            fontSize: '13px',
                            fontWeight: 600,
                            color: '#f8fafc',
                            margin: '3px 0 0 0',
                            lineHeight: 1.3
                          }}
                        >
                          {asset.name}
                        </h4>
                      </div>

                      <div style={{ fontSize: '10px', color: '#64748b', fontFamily: 'monospace' }}>
                        {asset.usdAssetId}
                      </div>

                      <div style={{ marginTop: 'auto', display: 'flex', gap: '6px', paddingTop: '4px' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMount(asset);
                          }}
                          style={{
                            flex: 1,
                            padding: '6px',
                            fontSize: '11px',
                            fontWeight: 600,
                            color: isMounted ? '#34d399' : '#0c1220',
                            background: isMounted ? 'rgba(16, 185, 129, 0.15)' : '#00f2fe',
                            border: isMounted ? '1px solid rgba(16, 185, 129, 0.4)' : 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          {isMounted ? (
                            <>
                              <CheckCircle2 size={12} />
                              已装载
                            </>
                          ) : (
                            <>
                              <PlusCircle size={12} />
                              装配到场景
                            </>
                          )}
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onInspectAsset(asset.usdAssetId);
                          }}
                          title="OpenUSD 3D 原生检视"
                          style={{
                            padding: '6px 8px',
                            fontSize: '11px',
                            color: '#94a3b8',
                            background: 'rgba(255, 255, 255, 0.06)',
                            border: '1px solid rgba(255, 255, 255, 0.12)',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <Eye size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Right: Asset Detail Inspector */}
          <div
            style={{
              width: '380px',
              borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
              backgroundColor: 'rgba(15, 23, 42, 0.4)',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              overflowY: 'auto'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    fontSize: '11px',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: 'rgba(0, 242, 254, 0.12)',
                    color: '#00f2fe',
                    fontWeight: 600
                  }}
                >
                  {activeAsset.categoryLabel}
                </span>
                <span style={{ fontSize: '11px', color: '#64748b' }}>OpenUSD (.usdc)</span>
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc', margin: '8px 0 4px 0' }}>
                {activeAsset.name}
              </h3>
              <p style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.5, margin: 0 }}>
                {activeAsset.description}
              </p>
            </div>

            {/* Asset Preview Image */}
            <div
              style={{
                width: '100%',
                height: '160px',
                borderRadius: '10px',
                overflow: 'hidden',
                backgroundColor: '#161f30',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                position: 'relative'
              }}
            >
              <img
                src={activeAsset.previewUrl}
                alt={activeAsset.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div
                style={{
                  position: 'absolute',
                  bottom: '8px',
                  left: '8px',
                  background: 'rgba(15, 23, 42, 0.85)',
                  backdropFilter: 'blur(4px)',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  color: '#e2e8f0',
                  fontFamily: 'monospace'
                }}
              >
                📐 {activeAsset.dimensions.map((d) => `${(d * 100).toFixed(0)}cm`).join(' × ')}
              </div>
            </div>

            {/* SimReady Physical Properties Table */}
            <div
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '10px',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}
            >
              <div
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#34d399',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <ShieldCheck size={14} />
                NVIDIA 仿真级物理参数认证
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '11px' }}>
                <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '6px 8px', borderRadius: '6px' }}>
                  <div style={{ color: '#64748b' }}>真实质量 (Mass)</div>
                  <div style={{ color: '#f8fafc', fontWeight: 600, marginTop: '2px' }}>
                    {activeAsset.simReady.massKg} kg
                  </div>
                </div>

                <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '6px 8px', borderRadius: '6px' }}>
                  <div style={{ color: '#64748b' }}>碰撞体几何 (Collision)</div>
                  <div style={{ color: '#f8fafc', fontWeight: 600, marginTop: '2px' }}>
                    {activeAsset.simReady.collisionType}
                  </div>
                </div>

                <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '6px 8px', borderRadius: '6px' }}>
                  <div style={{ color: '#64748b' }}>静 / 动摩擦系数 (μ)</div>
                  <div style={{ color: '#f8fafc', fontWeight: 600, marginTop: '2px' }}>
                    {activeAsset.simReady.friction.static} / {activeAsset.simReady.friction.dynamic}
                  </div>
                </div>

                <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '6px 8px', borderRadius: '6px' }}>
                  <div style={{ color: '#64748b' }}>弹性恢复系数 (e)</div>
                  <div style={{ color: '#f8fafc', fontWeight: 600, marginTop: '2px' }}>
                    {activeAsset.simReady.restitution}
                  </div>
                </div>
              </div>

              <div style={{ fontSize: '11px', color: '#94a3b8', borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '8px' }}>
                <span style={{ color: '#64748b' }}>材质构型: </span>
                {activeAsset.material}
              </div>

              <div style={{ fontSize: '10px', color: '#64748b', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                USD 资产 ID: {activeAsset.usdAssetId}
              </div>
            </div>

            {/* Actions */}
            <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                onClick={() => handleMount(activeAsset)}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #10b981 0%, #00f2fe 100%)',
                  color: '#050a14',
                  fontWeight: 700,
                  fontSize: '13px',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 15px rgba(0, 242, 254, 0.35)'
                }}
              >
                <PlusCircle size={16} />
                装配至当前 BiGym 3D 场景
              </button>

              <button
                onClick={() => onInspectAsset(activeAsset.usdAssetId)}
                style={{
                  width: '100%',
                  padding: '9px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  color: '#00f2fe',
                  border: '1px solid rgba(0, 242, 254, 0.35)',
                  fontWeight: 600,
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <Eye size={15} />
                OpenUSD 3D 原生多视角检视
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

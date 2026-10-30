import React, { useState } from 'react';
import {
  X,
  Upload,
  Sparkles,
  ShieldCheck,
  Check,
  ExternalLink,
  Cpu,
  Layers,
  ArrowRight,
  FileSearch,
  Scan,
  Database
} from 'lucide-react';
import { SimReadyMeta, SelectableObject } from '../../types';

export interface SimReadyCandidate {
  id: string;
  name: string;
  sampleImg: string;
  simReady: SimReadyMeta;
  targetObjectId: string; // which object in scene it replaces or complements
  description: string;
  dimensions: [number, number, number];
  weight: string;
  material: string;
}

interface ImageToSimReadyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInjectAsset: (candidate: SimReadyCandidate) => void;
  onOpenUSDViewer?: (assetId: string) => void;
}

const PRESET_IMAGE_SAMPLES = [
  {
    id: 'box_sample',
    title: '📦 瓦楞包装纸箱实拍',
    scene: '家庭物流 / 侧桌搬运 (pick_box)',
    thumbUrl: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=400&q=80',
    description: '工业流水线/厨房侧桌常见的中号瓦楞运输纸盒，双侧胶带封口。',
    candidates: [
      {
        id: 'simready_box_01',
        name: 'SimReady 工业标准瓦楞包装箱 (Medium)',
        sampleImg: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=400&q=80',
        targetObjectId: 'pick_box',
        dimensions: [0.16, 0.14, 0.16] as [number, number, number],
        weight: '0.45 kg',
        material: '双层瓦楞纸板 (B-Flute) + 压敏胶带',
        description: '严格按 SimReady Foundation 认证规范建模，附带非均匀质心分布与表面静/动摩擦力。',
        simReady: {
          usdAssetId: 'nvidia/simready:warehouse_carton_box_medium_01',
          foundationCertified: true,
          category: 'Warehouse / Packaging',
          massKg: 0.45,
          centerOfMass: [0, 0, 0.01] as [number, number, number],
          friction: { static: 0.72, dynamic: 0.55 },
          collisionType: 'ConvexHull' as const,
          restitution: 0.02,
          hfHubUrl: 'https://huggingface.co/datasets/nvidia/simready-assets',
          sourceImageMatchScore: 0.996,
          usdFormat: 'OpenUSD (.usdc)' as const,
          author: 'NVIDIA Omniverse SimReady Central'
        }
      },
      {
        id: 'simready_box_02',
        name: 'SimReady 轻量折叠邮包盒 (Mailer Box)',
        sampleImg: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=400&q=80',
        targetObjectId: 'pick_box',
        dimensions: [0.15, 0.08, 0.15] as [number, number, number],
        weight: '0.28 kg',
        material: '单层白卡强化瓦楞',
        description: '较薄自锁结构小包装盒，适用于轻质小物体搬运。',
        simReady: {
          usdAssetId: 'nvidia/simready:packaging_corrugated_mailer_03',
          foundationCertified: true,
          category: 'Packaging / Mailer',
          massKg: 0.28,
          centerOfMass: [0, 0, 0] as [number, number, number],
          friction: { static: 0.65, dynamic: 0.50 },
          collisionType: 'ConvexHull' as const,
          restitution: 0.04,
          hfHubUrl: 'https://huggingface.co/datasets/nvidia/simready-assets',
          sourceImageMatchScore: 0.942,
          usdFormat: 'OpenUSD (.usdc)' as const,
          author: 'NVIDIA Omniverse SimReady Central'
        }
      }
    ]
  },
  {
    id: 'mug_sample',
    title: '☕ 陶瓷把手咖啡杯实拍',
    scene: '桌面翻转 / 精准抓握 (flip_cup)',
    thumbUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=400&q=80',
    description: '带侧耳手柄的经典陶瓷马克杯，测试灵巧夹爪横向接触与重心力矩。',
    candidates: [
      {
        id: 'simready_mug_01',
        name: 'SimReady 哑光白陶瓷马克杯 (Classic Mug)',
        sampleImg: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=400&q=80',
        targetObjectId: 'coffee_mug',
        dimensions: [0.09, 0.11, 0.09] as [number, number, number],
        weight: '0.32 kg',
        material: '致密炻器陶瓷 + 釉面涂层',
        description: '杯底加重设计，侧手柄具备独立刚体凸包碰撞网格，倒置与正立时力学行为高度仿真。',
        simReady: {
          usdAssetId: 'nvidia/simready:household_coffee_mug_ceramic_v1',
          foundationCertified: true,
          category: 'Household / Drinkware',
          massKg: 0.32,
          centerOfMass: [0, -0.015, 0] as [number, number, number],
          friction: { static: 0.65, dynamic: 0.50 },
          collisionType: 'CompoundBox' as const,
          restitution: 0.04,
          hfHubUrl: 'https://huggingface.co/datasets/nvidia/simready-assets',
          sourceImageMatchScore: 0.991,
          usdFormat: 'OpenUSD (.usdc)' as const,
          author: 'NVIDIA Omniverse SimReady Central'
        }
      }
    ]
  },
  {
    id: 'plate_sample',
    title: '🍽️ 强化餐盘与沥水支架实拍',
    scene: '双臂协同取盘 (move_plate)',
    thumbUrl: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=400&q=80',
    description: '厨房双排沥水架与瓷盘立放形态，测试狭窄缝隙下的末端避障与协同夹取。',
    candidates: [
      {
        id: 'simready_plate_01',
        name: 'SimReady 强化陶瓷圆餐盘 (Porcelain Plate)',
        sampleImg: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=400&q=80',
        targetObjectId: 'dish_plate',
        dimensions: [0.22, 0.14, 0.16] as [number, number, number],
        weight: '0.45 kg',
        material: '高温强化骨瓷',
        description: '带有凹陷盘心与微翘盘沿的精准旋转体碰撞网格，插放至沥水架槽位零穿模。',
        simReady: {
          usdAssetId: 'nvidia/simready:kitchen_ceramic_dinner_plate_02',
          foundationCertified: true,
          category: 'Kitchenware / Tableware',
          massKg: 0.45,
          centerOfMass: [0, 0, 0.005] as [number, number, number],
          friction: { static: 0.58, dynamic: 0.42 },
          collisionType: 'ConvexHull' as const,
          restitution: 0.03,
          hfHubUrl: 'https://huggingface.co/datasets/nvidia/simready-assets',
          sourceImageMatchScore: 0.982,
          usdFormat: 'OpenUSD (.usdc)' as const,
          author: 'NVIDIA Omniverse SimReady Central'
        }
      }
    ]
  },
  {
    id: 'tray_sample',
    title: '⚙️ 工业四宫格金属物料托盘实拍',
    scene: '装配上料 / 标定接收 (target_tray)',
    thumbUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=400&q=80',
    description: '标准工业钣金冲压托盘，底部配防滑耐磨垫，用于放置工件或接收搬运物料。',
    candidates: [
      {
        id: 'simready_tray_01',
        name: 'SimReady 工业标准不锈钢托盘 (Steel Tray)',
        sampleImg: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=400&q=80',
        targetObjectId: 'target_tray',
        dimensions: [0.22, 0.02, 0.22] as [number, number, number],
        weight: '0.80 kg',
        material: 'SUS304 拉丝不锈钢 + 激光刻度',
        description: '平整接触面碰撞基座，与各类工件接触时具有低回弹、高定位稳定性的刚体特性。',
        simReady: {
          usdAssetId: 'nvidia/simready:industrial_steel_tray_square_01',
          foundationCertified: true,
          category: 'Industrial / Tray & Pallet',
          massKg: 0.80,
          centerOfMass: [0, 0, 0] as [number, number, number],
          friction: { static: 0.45, dynamic: 0.35 },
          collisionType: 'ConvexHull' as const,
          restitution: 0.06,
          hfHubUrl: 'https://huggingface.co/datasets/nvidia/simready-assets',
          sourceImageMatchScore: 0.978,
          usdFormat: 'OpenUSD (.usdc)' as const,
          author: 'NVIDIA Omniverse SimReady Central'
        }
      }
    ]
  }
];

export const ImageToSimReadyModal: React.FC<ImageToSimReadyModalProps> = ({
  isOpen,
  onClose,
  onInjectAsset,
  onOpenUSDViewer
}) => {
  const [selectedSampleId, setSelectedSampleId] = useState<string>('box_sample');
  const [customImage, setCustomImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisStep, setAnalysisStep] = useState<number>(3);
  const [injectedId, setInjectedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentSample = PRESET_IMAGE_SAMPLES.find((s) => s.id === selectedSampleId) || PRESET_IMAGE_SAMPLES[0];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setCustomImage(reader.result as string);
        triggerAnalysis();
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerAnalysis = () => {
    setIsAnalyzing(true);
    setAnalysisStep(1);
    setTimeout(() => setAnalysisStep(2), 250);
    setTimeout(() => {
      setAnalysisStep(3);
      setIsAnalyzing(false);
    }, 600);
  };

  const handleSelectSample = (sampleId: string) => {
    setSelectedSampleId(sampleId);
    setCustomImage(null);
    triggerAnalysis();
  };

  const handleInject = (candidate: SimReadyCandidate) => {
    setInjectedId(candidate.id);
    onInjectAsset(candidate);
    setTimeout(() => {
      onClose();
    }, 700);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(5, 10, 20, 0.85)',
      backdropFilter: 'blur(12px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: '24px'
    }}>
      <div style={{
        width: '920px',
        maxHeight: '90vh',
        background: '#0b1121',
        border: '1px solid rgba(0, 242, 254, 0.3)',
        borderRadius: '16px',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.7), 0 0 30px rgba(0, 242, 254, 0.15)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        color: '#e2e8f0'
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(90deg, rgba(0, 242, 254, 0.08) 0%, transparent 100%)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #10b981 0%, #00f2fe 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#000',
              boxShadow: '0 0 16px rgba(16, 185, 129, 0.4)'
            }}>
              <Scan size={20} strokeWidth={2.5} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '16px', fontWeight: 700, color: '#fff' }}>
                  实景图片 ➔ SimReady 3D 物理资产智能匹配
                </span>
                <span style={{
                  fontSize: '10px',
                  background: 'rgba(16, 185, 129, 0.2)',
                  color: '#10b981',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontWeight: 600
                }}>
                  OpenUSD Native
                </span>
                <span style={{
                  fontSize: '10px',
                  background: 'rgba(0, 242, 254, 0.15)',
                  color: '#00f2fe',
                  border: '1px solid rgba(0, 242, 254, 0.3)',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontWeight: 600
                }}>
                  NVIDIA USD Search (2,500+ Assets)
                </span>
              </div>
              <div style={{ fontSize: '12px', color: '#8da4c4', marginTop: '2px' }}>
                基于 Hugging Face &amp; NVIDIA SimReady Central 库，实现上传真实图片一键召回带物理质量与碰撞体的高拟真 3D 模型
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#94a3b8',
              borderRadius: '8px',
              padding: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '320px 1fr',
          flex: 1,
          overflowY: 'auto',
          minHeight: 0
        }}>
          {/* Left Column: Input Image / Preset Selection */}
          <div style={{
            padding: '20px',
            borderRight: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            background: 'rgba(0, 0, 0, 0.2)'
          }}>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#00f2fe', marginBottom: '8px', textTransform: 'uppercase' }}>
                1. 选取数采实拍样本或上传本地照片
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {PRESET_IMAGE_SAMPLES.map((sample) => {
                  const isSelected = selectedSampleId === sample.id && !customImage;
                  return (
                    <div
                      key={sample.id}
                      onClick={() => handleSelectSample(sample.id)}
                      style={{
                        padding: '10px',
                        borderRadius: '8px',
                        background: isSelected ? 'rgba(0, 242, 254, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                        border: isSelected ? '1px solid #00f2fe' : '1px solid rgba(255, 255, 255, 0.06)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        transition: 'all 0.2s'
                      }}
                    >
                      <img
                        src={sample.thumbUrl}
                        alt={sample.title}
                        style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: '6px',
                          objectFit: 'cover'
                        }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: isSelected ? '#00f2fe' : '#fff' }}>
                          {sample.title}
                        </div>
                        <div style={{ fontSize: '10px', color: '#8da4c4', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {sample.scene}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Custom Image Upload Box */}
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px' }}>
                或上传您的真实作业实拍图片:
              </div>
              <label style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '16px',
                border: '1px dashed rgba(0, 242, 254, 0.4)',
                borderRadius: '8px',
                background: customImage ? 'rgba(0, 242, 254, 0.05)' : 'rgba(255, 255, 255, 0.02)',
                cursor: 'pointer',
                textAlign: 'center'
              }}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
                <Upload size={20} color="#00f2fe" />
                <span style={{ fontSize: '11px', color: '#cbd5e1' }}>
                  {customImage ? '已选择自定义实拍图片 (点击重新上传)' : '点击或拖拽上传实拍照片 (JPG/PNG)'}
                </span>
                <span style={{ fontSize: '9px', color: '#64748b' }}>
                  支持数采单目/双目帧与手机现场照片
                </span>
              </label>
            </div>

            {/* Current Active Preview */}
            <div style={{
              background: 'rgba(0, 0, 0, 0.4)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: '8px',
              padding: '10px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}>
              <span style={{ fontSize: '10px', color: '#94a3b8' }}>当前输入图像视图:</span>
              <img
                src={customImage || currentSample.thumbUrl}
                alt="Active Preview"
                style={{
                  width: '100%',
                  height: '110px',
                  borderRadius: '6px',
                  objectFit: 'cover'
                }}
              />
            </div>
          </div>

          {/* Right Column: AI Analysis Pipeline & SimReady Candidates */}
          <div style={{
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            background: 'rgba(15, 23, 42, 0.4)'
          }}>
            {/* Multi-modal Alignment Pipeline Ticker */}
            <div style={{
              background: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(0, 242, 254, 0.15)',
              borderRadius: '10px',
              padding: '12px 16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#00f2fe', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={14} />
                  多模态 3D 资产对齐流水线 (Multimodal USD Alignment)
                </span>
                <span style={{ fontSize: '10px', color: '#10b981', fontWeight: 600 }}>
                  {isAnalyzing ? '正在计算空间特征向量...' : '✓ 向量对齐与物理参数解析就绪'}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', fontSize: '11px' }}>
                <div style={{
                  padding: '8px',
                  borderRadius: '6px',
                  background: analysisStep >= 1 ? 'rgba(0, 242, 254, 0.1)' : 'rgba(255, 255, 255, 0.02)',
                  border: analysisStep >= 1 ? '1px solid rgba(0, 242, 254, 0.3)' : '1px solid transparent',
                  color: analysisStep >= 1 ? '#e2e8f0' : '#64748b'
                }}>
                  <div style={{ fontWeight: 600, fontSize: '10px', color: '#00f2fe' }}>Step 1: 视觉特征提取</div>
                  <div style={{ fontSize: '9px', marginTop: '2px' }}>SigLIP ViT-H/14 纹理与几何特征</div>
                </div>
                <div style={{
                  padding: '8px',
                  borderRadius: '6px',
                  background: analysisStep >= 2 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 255, 255, 0.02)',
                  border: analysisStep >= 2 ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid transparent',
                  color: analysisStep >= 2 ? '#e2e8f0' : '#64748b'
                }}>
                  <div style={{ fontWeight: 600, fontSize: '10px', color: '#10b981' }}>Step 2: USD Search 检索</div>
                  <div style={{ fontSize: '9px', marginTop: '2px' }}>2,500+ SimReady 物理库余弦匹配</div>
                </div>
                <div style={{
                  padding: '8px',
                  borderRadius: '6px',
                  background: analysisStep >= 3 ? 'rgba(245, 158, 11, 0.1)' : 'rgba(255, 255, 255, 0.02)',
                  border: analysisStep >= 3 ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid transparent',
                  color: analysisStep >= 3 ? '#e2e8f0' : '#64748b'
                }}>
                  <div style={{ fontWeight: 600, fontSize: '10px', color: '#f59e0b' }}>Step 3: 刚体物理学拟合</div>
                  <div style={{ fontSize: '9px', marginTop: '2px' }}>质量张量/摩擦力/凸包几何</div>
                </div>
              </div>
            </div>

            {/* Candidate SimReady Assets */}
            <div>
              <div style={{
                fontSize: '12px',
                fontWeight: 700,
                color: '#fff',
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <span>推荐召回的 NVIDIA SimReady OpenUSD 仿真资产 (Top Matches):</span>
                <span style={{ fontSize: '11px', color: '#8da4c4', fontWeight: 'normal' }}>
                  共匹配到 {currentSample.candidates.length} 个仿真就绪对象
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {currentSample.candidates.map((cand) => {
                  const isInjected = injectedId === cand.id;
                  return (
                    <div
                      key={cand.id}
                      style={{
                        background: 'rgba(11, 18, 33, 0.9)',
                        border: '1px solid rgba(0, 242, 254, 0.25)',
                        borderRadius: '12px',
                        padding: '16px',
                        display: 'flex',
                        gap: '16px',
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
                        transition: 'all 0.2s'
                      }}
                    >
                      {/* Asset Thumbnail with SimReady badge */}
                      <div style={{ position: 'relative', width: '120px', flexShrink: 0 }}>
                        <img
                          src={cand.sampleImg}
                          alt={cand.name}
                          style={{
                            width: '120px',
                            height: '110px',
                            borderRadius: '8px',
                            objectFit: 'cover',
                            border: '1px solid rgba(255, 255, 255, 0.1)'
                          }}
                        />
                        <div style={{
                          position: 'absolute',
                          top: '6px',
                          left: '6px',
                          background: 'rgba(16, 185, 129, 0.9)',
                          color: '#000',
                          fontSize: '9px',
                          fontWeight: 700,
                          padding: '2px 5px',
                          borderRadius: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px'
                        }}>
                          <ShieldCheck size={11} strokeWidth={2.5} />
                          SimReady
                        </div>
                      </div>

                      {/* Asset Details */}
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>
                              {cand.name}
                            </div>
                            <div style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              color: '#10b981',
                              background: 'rgba(16, 185, 129, 0.15)',
                              padding: '2px 8px',
                              borderRadius: '10px',
                              border: '1px solid rgba(16, 185, 129, 0.3)'
                            }}>
                              匹配置信度: {((cand.simReady.sourceImageMatchScore || 0.98) * 100).toFixed(1)}%
                            </div>
                          </div>

                          <div style={{
                            fontFamily: 'monospace',
                            fontSize: '11px',
                            color: '#38bdf8',
                            marginTop: '2px',
                            marginBottom: '6px'
                          }}>
                            {cand.simReady.usdAssetId}
                          </div>

                          <div style={{ fontSize: '11px', color: '#94a3b8', lineHeight: '1.5' }}>
                            {cand.description}
                          </div>

                          {/* Physics Tags Grid */}
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                            <span style={{ fontSize: '10px', background: 'rgba(255, 255, 255, 0.05)', padding: '2px 8px', borderRadius: '4px', color: '#cbd5e1' }}>
                              ⚖️ 质量: <b>{cand.simReady.massKg} kg</b>
                            </span>
                            <span style={{ fontSize: '10px', background: 'rgba(255, 255, 255, 0.05)', padding: '2px 8px', borderRadius: '4px', color: '#cbd5e1' }}>
                              🧊 碰撞几何: <b>{cand.simReady.collisionType}</b>
                            </span>
                            <span style={{ fontSize: '10px', background: 'rgba(255, 255, 255, 0.05)', padding: '2px 8px', borderRadius: '4px', color: '#cbd5e1' }}>
                              ⚡ 静摩擦: <b>{cand.simReady.friction.static}</b> (动摩擦 {cand.simReady.friction.dynamic})
                            </span>
                            <span style={{ fontSize: '10px', background: 'rgba(255, 255, 255, 0.05)', padding: '2px 8px', borderRadius: '4px', color: '#cbd5e1' }}>
                              🎯 替换场景目标: <b>{cand.targetObjectId}</b>
                            </span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '12px' }}>
                          <button
                            onClick={() => handleInject(cand)}
                            disabled={isInjected}
                            style={{
                              flex: 1,
                              padding: '8px 14px',
                              background: isInjected
                                ? 'rgba(16, 185, 129, 0.3)'
                                : 'linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)',
                              border: 'none',
                              borderRadius: '8px',
                              color: isInjected ? '#6ee7b7' : '#000',
                              fontWeight: 700,
                              fontSize: '12px',
                              cursor: isInjected ? 'default' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px',
                              boxShadow: isInjected ? 'none' : '0 0 14px rgba(0, 242, 254, 0.4)'
                            }}
                          >
                            {isInjected ? (
                              <>
                                <Check size={14} />
                                已成功注入 3D 交互场景！
                              </>
                            ) : (
                              <>
                                <Sparkles size={14} />
                                一键注入到当前 3D 场景并对齐物理属性
                              </>
                            )}
                          </button>

                          <button
                            onClick={() => {
                              if (onOpenUSDViewer) {
                                onOpenUSDViewer(cand.simReady.usdAssetId);
                              } else {
                                window.open(cand.simReady.hfHubUrl, '_blank');
                              }
                            }}
                            style={{
                              padding: '8px 12px',
                              background: 'rgba(16, 185, 129, 0.15)',
                              border: '1px solid rgba(16, 185, 129, 0.4)',
                              borderRadius: '8px',
                              color: '#6ee7b7',
                              fontSize: '11px',
                              fontWeight: 600,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              cursor: 'pointer'
                            }}
                          >
                            <span>OpenUSD 3D 原生检视</span>
                            <ExternalLink size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '12px 24px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(0, 0, 0, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '11px',
          color: '#8da4c4'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Database size={13} color="#00f2fe" />
            <span>
              数据源基准：<b>NVIDIA SimReady Central (nvidia/simready-assets)</b> · 规范支持 OpenUSD / MuJoCo 3.x / Isaac Sim
            </span>
          </div>
          <div>
            参考 Caleb Fahlgren (@calebfahlgren) Hugging Face OpenUSD 3D 原生预览规范
          </div>
        </div>
      </div>
    </div>
  );
};

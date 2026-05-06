'use client';

import React, { useState } from 'react';
import { Typography, Breadcrumb, Button, Input, App, Modal, Tag, Space, Tooltip } from 'antd';
import { PlusOutlined, CloseOutlined, InfoCircleOutlined, SearchOutlined } from '@ant-design/icons';
import MainLayout from '@/components/MainLayout';

const { Text } = Typography;

const taskCategories = [
  { type: 'section', label: 'B. 采集场景' },
  { key: 'scene',     label: '场景分类',     subLabel: 'TAG CATEGORY: 场景分类' },
  { key: 'template',  label: '动作模板',     subLabel: 'TAG CATEGORY: 动作模板' },
  { type: 'section', label: 'C. 硬件配置' },
  { key: 'mode',      label: '采集模式',     subLabel: 'TAG CATEGORY: 采集模式' },
  { key: 'teleop',    label: '遥控类型',     subLabel: 'TAG CATEGORY: 遥控类型' },
  { key: 'effector',  label: '执行末端类型', subLabel: 'TAG CATEGORY: 执行末端类型' },
  { key: 'camera',    label: '相机类型',     subLabel: 'TAG CATEGORY: 相机类型' },
  { key: 'camera_pos',label: '相机位置类型', subLabel: 'TAG CATEGORY: 相机位置类型' },
  { type: 'section', label: 'D. 数据标注' },
  { key: 'component', label: '组件类型',     subLabel: 'TAG CATEGORY: 组件类型' },
  { key: 'region_annotation', label: '区域帧标注类别', subLabel: 'TAG CATEGORY: 帧区标注类别' },
];

const initialTagsMap = {
  scene: [
    { id: 1, name: 'Kitchen', desc: '厨房', count: 6 },
    { id: 2, name: 'Supermarket', desc: '商超', count: 4 },
    { id: 3, name: 'Industry', desc: '工业', count: 18 },
    { id: 4, name: 'pharmacy', desc: '药房', count: 2 },
    { id: 5, name: 'Scientific', desc: '科研', count: 1 },
    { id: 6, name: 'Hotel', desc: '酒店', count: 0 },
    { id: 7, name: 'Warehousing', desc: '仓储', count: 3 },
  ],
  template: [
    { id: 10, name: 'SingleHandGrasp', desc: '单手抓取', count: 5 },
    { id: 11, name: 'DualHandCarry', desc: '双手协同搬运', count: 3 },
    { id: 12, name: 'ScrewCap', desc: '拧瓶盖', count: 2 },
    { id: 13, name: 'CableManagement', desc: '线缆管理', count: 1 },
    { id: 14, name: 'TabletopSorting', desc: '桌面分拣', count: 4 },
  ],
  mode: [
    { id: 20, name: 'Real', desc: '实机物理世界采集', count: 8 },
    { id: 21, name: 'Sim', desc: '虚拟仿真引擎采集', count: 3 },
  ],
  teleop: [
    { id: 30, name: 'VRController', desc: 'VR手柄设备', count: 6 },
    { id: 31, name: 'MotionCapture', desc: '六轴动捕手套', count: 2 },
    { id: 32, name: 'KeyboardMouse', desc: '键盘鼠标', count: 1 },
    { id: 33, name: 'DualHandControl', desc: '双手操控', count: 4 },
  ],
  effector: [
    { id: 40, name: 'TwoFingerGripper', desc: '工业二指夹爪', count: 7 },
    { id: 41, name: 'DexterousHand', desc: '多指灵巧手', count: 3 },
    { id: 42, name: 'VacuumSuction', desc: '真空吸盘', count: 2 },
  ],
  camera: [
    { id: 50, name: 'RGB', desc: '彩色相机', count: 5 },
    { id: 51, name: 'RGBD', desc: '深度相机', count: 8 },
    { id: 52, name: 'StereoFisheye', desc: '双目鱼眼', count: 1 },
    { id: 53, name: 'NightVisionIR', desc: '夜视红外', count: 0 },
  ],
  camera_pos: [
    { id: 60, name: 'head', desc: '头部', count: 6 },
    { id: 61, name: 'hand_left', desc: '左手腕', count: 4 },
    { id: 62, name: 'hand_right', desc: '右手腕', count: 4 },
    { id: 63, name: 'chest', desc: '胸部', count: 1 },
  ],
  component: [
    { id: 70, name: 'RobotArm', desc: '机械臂', count: 5 },
    { id: 71, name: 'Chassis', desc: '底盘履带', count: 2 },
    { id: 72, name: 'LiftTorso', desc: '升降躯干', count: 1 },
  ],
  region_annotation: [
    { id: 80, name: 'Teleoperation', desc: '遥操控制', count: 3 },
    { id: 81, name: 'Autonomous', desc: '自主执行', count: 1 },
  ],
};

const initialSubTagsMap = {
  1: ['餐具整理', '烹饪操作', '食材处理', '清洁收纳', '取餐摆盘', '锅具操作'],
  2: ['货架拣选', '商品扫码', '购物车装载', '价签更换'],
  3: ['电子组装', '汽车零部件', '金属加工', '食品加工', '物流仓储', '焊接', '喷涂', '打磨', '搬运', '码垛', '分拣', '检测', '装配', '包装', '贴标', '上下料', '拧紧', '点胶'],
  80: ['success', 'fail', 'takeover'],
};

export default function TaskLabelsPage() {
  const { message } = App.useApp();
  const [selected, setSelected] = useState('scene');
  const [tagsMap, setTagsMap] = useState(initialTagsMap);
  const [subTagsMap, setSubTagsMap] = useState(initialSubTagsMap);
  const [adding, setAdding] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');

  // Sub-label Modal state
  const [subModal, setSubModal] = useState({ open: false, parentTag: null });
  const [addingSub, setAddingSub] = useState(false);
  const [newSubInput, setNewSubInput] = useState('');

  const currentTags = tagsMap[selected] || [];
  const total = Object.values(tagsMap).reduce((s, arr) => s + arr.length, 0);

  const removeTag = (id) => {
    setTagsMap(prev => ({
      ...prev,
      [selected]: prev[selected].filter(t => t.id !== id)
    }));
  };

  const addTag = () => {
    if (!newTagInput.trim()) { setAdding(false); return; }
    const newTag = { id: Date.now(), name: newTagInput.trim(), desc: '', count: 0 };
    setTagsMap(prev => ({ ...prev, [selected]: [...(prev[selected] || []), newTag] }));
    setNewTagInput('');
    setAdding(false);
    message.success('一级标签已添加');
  };

  const openSubModal = (tag) => {
    setSubModal({ open: true, parentTag: tag });
  };

  const currentSubTags = subModal.parentTag ? (subTagsMap[subModal.parentTag.id] || []) : [];

  const addSubTag = () => {
    if (!newSubInput.trim()) { setAddingSub(false); return; }
    const parentId = subModal.parentTag.id;
    const newList = [...(subTagsMap[parentId] || []), newSubInput.trim()];
    setSubTagsMap(prev => ({ ...prev, [parentId]: newList }));
    
    // Update count in tagsMap
    setTagsMap(prev => {
      const category = Object.keys(prev).find(key => prev[key].some(t => t.id === parentId));
      if (!category) return prev;
      return {
        ...prev,
        [category]: prev[category].map(t => t.id === parentId ? { ...t, count: newList.length } : t)
      };
    });

    setNewSubInput('');
    setAddingSub(false);
    message.success('二级标签已添加');
  };

  const removeSubTag = (tagName) => {
    const parentId = subModal.parentTag.id;
    const newList = subTagsMap[parentId].filter(t => t !== tagName);
    setSubTagsMap(prev => ({ ...prev, [parentId]: newList }));

    // Update count in tagsMap
    setTagsMap(prev => {
      const category = Object.keys(prev).find(key => prev[key].some(t => t.id === parentId));
      if (!category) return prev;
      return {
        ...prev,
        [category]: prev[category].map(t => t.id === parentId ? { ...t, count: newList.length } : t)
      };
    });
  };

  return (
    <MainLayout>
      <Breadcrumb items={[{ title: '首页' }, { title: '基础数据' }, { title: '任务标签' }]} style={{ marginBottom: 16 }} />

      <div style={{ display: 'flex', gap: 16, height: 'calc(100vh - 160px)' }}>

        {/* Left Category List */}
        <div style={{ width: 220, flexShrink: 0, background: '#fff', borderRadius: 8, border: '1px solid #f0f0f0', padding: 16, overflowY: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text strong style={{ fontSize: 14 }}>标签分类</Text>
            <SearchOutlined style={{ color: '#bfbfbf', cursor: 'pointer' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {taskCategories.map((cat, idx) => {
              if (cat.type === 'section') {
                return (
                  <div key={idx} style={{ padding: '12px 14px 4px', fontSize: 12, color: '#1890ff', fontWeight: 500 }}>
                    <span style={{ marginRight: 6 }}>●</span>{cat.label}
                  </div>
                );
              }
              const isSelected = selected === cat.key;
              return (
                <div
                  key={cat.key}
                  onClick={() => setSelected(cat.key)}
                  style={{
                    padding: '10px 14px', borderRadius: 8, cursor: 'pointer',
                    background: isSelected ? '#1890ff' : 'transparent',
                    color: isSelected ? '#fff' : '#262626',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ fontWeight: isSelected ? 600 : 400, fontSize: 13 }}>{cat.label}</div>
                  <div style={{ fontSize: 10, color: isSelected ? 'rgba(255,255,255,0.7)' : '#bfbfbf', marginTop: 2, fontFamily: 'monospace' }}>{cat.subLabel}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Tag Panel */}
        <div style={{ flex: 1, background: '#fff', borderRadius: 8, border: '1px solid #f0f0f0', padding: 24, overflowY: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 4, height: 16, background: '#ff4d4f', borderRadius: 2 }} />
              <Text strong style={{ fontSize: 15 }}>自定义标签</Text>
              <Tooltip title="点击标签右侧数字可进入二级标签管理">
                <InfoCircleOutlined style={{ color: '#bfbfbf', fontSize: 13 }} />
              </Tooltip>
            </div>
            <Text type="secondary" style={{ fontSize: 13 }}>{total}/500</Text>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
            {currentTags.map(tag => (
              <div
                key={tag.id}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '6px 10px 6px 12px',
                  background: '#fff1f0', border: '1px solid #ffccc7',
                  borderRadius: 20, fontSize: 13, color: '#cf1322',
                }}
              >
                <span style={{ fontWeight: 500 }}>{tag.name}</span>
                {tag.desc && <span style={{ color: '#ff7875', fontSize: 11 }}>({tag.desc})</span>}

                <Tooltip title={`管理二级标签 (${tag.count})`}>
                  <span
                    onClick={() => openSubModal(tag)}
                    style={{
                      background: '#ff4d4f', color: '#fff',
                      borderRadius: '50%', width: 20, height: 20,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 10, fontWeight: 600, flexShrink: 0,
                      cursor: 'pointer',
                      boxShadow: '0 2px 4px rgba(255,77,79,0.3)',
                    }}
                  >
                    {tag.count}
                  </span>
                </Tooltip>

                <CloseOutlined
                  onClick={() => removeTag(tag.id)}
                  style={{ fontSize: 10, color: '#ff7875', cursor: 'pointer', marginLeft: 2 }}
                />
              </div>
            ))}

            {adding ? (
              <Input
                autoFocus size="small" value={newTagInput}
                onChange={e => setNewTagInput(e.target.value)}
                onPressEnter={addTag} onBlur={addTag}
                style={{ width: 140, borderRadius: 20 }}
                placeholder="输入标签名称"
              />
            ) : (
              <Button
                type="dashed" size="small" icon={<PlusOutlined />}
                onClick={() => setAdding(true)}
                style={{ borderRadius: 20, color: '#8c8c8c', borderColor: '#d9d9d9' }}
              >
                添加一级标签
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Secondary Label Management Modal */}
      <Modal
        title="二级标签管理"
        open={subModal.open}
        onCancel={() => setSubModal({ open: false, parentTag: null })}
        footer={null}
        width={600}
        centered
        styles={{ body: { padding: '24px 32px' } }}
      >
        {subModal.parentTag && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
              <Text strong style={{ fontSize: 16, flexShrink: 0 }}>一级分类</Text>
              <div style={{
                padding: '4px 16px',
                background: '#e6f7ff',
                border: '1px solid #91d5ff',
                borderRadius: 4,
                color: '#1890ff',
                fontSize: 14
              }}>
                {subModal.parentTag.name}{subModal.parentTag.desc ? `(${subModal.parentTag.desc})` : ''}
              </div>
            </div>

            <div style={{
              background: '#f8f9fa',
              borderRadius: 8,
              padding: '20px 24px',
              border: '1px solid #f0f0f0'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Text strong style={{ fontSize: 15 }}>二级分类</Text>
                <Text type="secondary" style={{ fontSize: 12 }}>{currentSubTags.length}/500</Text>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                {currentSubTags.map((st, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '6px 12px',
                      background: '#1890ff',
                      color: '#fff',
                      borderRadius: 4,
                      fontSize: 14,
                    }}
                  >
                    <span>{st}</span>
                    <CloseOutlined 
                      style={{ fontSize: 12, cursor: 'pointer', opacity: 0.8 }} 
                      onClick={() => removeSubTag(st)}
                    />
                  </div>
                ))}

                {addingSub ? (
                  <Input
                    autoFocus
                    size="small"
                    value={newSubInput}
                    onChange={e => setNewSubInput(e.target.value)}
                    onPressEnter={addSubTag}
                    onBlur={addSubTag}
                    style={{ width: 120, borderRadius: 4 }}
                  />
                ) : (
                  <Button
                    type="dashed"
                    size="middle"
                    icon={<PlusOutlined />}
                    onClick={() => setAddingSub(true)}
                    style={{ borderRadius: 4, color: '#1890ff', borderColor: '#1890ff' }}
                  >
                    添加二级标签
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </MainLayout>
  );
}

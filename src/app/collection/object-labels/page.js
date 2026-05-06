'use client';

import React, { useState } from 'react';
import { Typography, Breadcrumb, Button, Input, App, Tooltip } from 'antd';
import { PlusOutlined, CloseOutlined, InfoCircleOutlined, SearchOutlined } from '@ant-design/icons';
import MainLayout from '@/components/MainLayout';

const { Text } = Typography;

const objectCategories = [
  { type: 'section', label: 'A. 物体信息' },
  { key: 'obj_type', label: '物体类型', subLabel: 'TAG CATEGORY: 物体类型' },
  { key: 'scene', label: '适用场景', subLabel: 'TAG CATEGORY: 场景分组' },
  { key: 'asset', label: '资产标签', subLabel: 'TAG CATEGORY: 资产归属' },
  { type: 'section', label: 'B. 视觉感知特性' },
  { key: 'color', label: '颜色特性', subLabel: 'TAG CATEGORY: 颜色特性' },
  { key: 'optical', label: '光学特性', subLabel: 'TAG CATEGORY: 光学特性' },
  { key: 'material', label: '材质特性', subLabel: 'TAG CATEGORY: 材质特性' },
  { type: 'section', label: 'C. 物理几何特性' },
  { key: 'shape', label: '形状特性', subLabel: 'TAG CATEGORY: 形状特性' },
  { key: 'morphology', label: '形态特性', subLabel: 'TAG CATEGORY: 形态特性' },
  { type: 'section', label: 'D. 动态行为特性' },
  { key: 'motion', label: '运动特性', subLabel: 'TAG CATEGORY: 运动特性' },
];

const initialTagsMap = {
  obj_type: [
    { id: 1, name: 'RigidBody', desc: '刚体', count: 45 },
    { id: 2, name: 'Articulated', desc: '铰接可动', count: 12 },
    { id: 3, name: 'Deformable', desc: '可变形', count: 8 },
  ],
  scene: [
    { id: 10, name: 'Supermarket', desc: '商超', count: 0 },
    { id: 11, name: 'Industry', desc: '工业', count: 0 },
    { id: 12, name: 'Kitchen', desc: '厨房', count: 0 },
    { id: 13, name: 'Hotel', desc: '酒店', count: 0 },
    { id: 14, name: 'Scientific', desc: '科研', count: 0 },
    { id: 15, name: 'Shelf', desc: '货架', count: 0 },
    { id: 16, name: 'Container', desc: '容器', count: 0 },
    { id: 17, name: 'pharmacy', desc: '药房', count: 0 },
    { id: 18, name: 'Warehousing', desc: '仓储', count: 0 },
    { id: 19, name: 'Region', desc: '区域', count: 0 },
  ],
  asset: [
    { id: 25, name: 'CompanyOwned', desc: '公司自有', count: 0 },
    { id: 26, name: 'ClientProvided', desc: '客户提供', count: 0 },
    { id: 27, name: 'Rented', desc: '租赁资产', count: 0 },
  ],
  color: [
    { id: 30, name: 'Red', desc: '红色', count: 88 },
    { id: 31, name: 'Blue', desc: '蓝色', count: 65 },
    { id: 32, name: 'White', desc: '白色', count: 120 },
    { id: 33, name: 'Black', desc: '黑色', count: 90 },
    { id: 34, name: 'Transparent', desc: '透明', count: 30 },
    { id: 35, name: 'Metallic', desc: '金属光泽', count: 42 },
  ],
  optical: [
    { id: 40, name: 'Transparent', desc: '透明', count: 120 },
    { id: 41, name: 'Reflective', desc: '高反光/镜面', count: 85 },
    { id: 42, name: 'Opaque', desc: '不透明', count: 500 },
    { id: 43, name: 'Translucent', desc: '半透明', count: 40 },
  ],
  material: [
    { id: 50, name: 'Metal', desc: '金属', count: 210 },
    { id: 51, name: 'Plastic', desc: '塑料', count: 340 },
    { id: 52, name: 'Soft', desc: '柔性/海绵', count: 45 },
    { id: 53, name: 'Ceramic', desc: '陶瓷', count: 60 },
    { id: 54, name: 'Wood', desc: '木材', count: 35 },
    { id: 55, name: 'Fabric', desc: '布料', count: 28 },
    { id: 56, name: 'Smooth', desc: '光滑', count: 15 },
  ],
  shape: [
    { id: 60, name: 'Cylinder', desc: '圆柱体', count: 150 },
    { id: 61, name: 'Box', desc: '方盒', count: 200 },
    { id: 62, name: 'Sphere', desc: '球体', count: 40 },
    { id: 63, name: 'Irregular', desc: '不规则', count: 80 },
  ],
  morphology: [
    { id: 70, name: 'Flat', desc: '扁平', count: 55 },
    { id: 71, name: 'Elongated', desc: '细长', count: 70 },
    { id: 72, name: 'Compact', desc: '紧凑', count: 130 },
  ],
  motion: [
    { id: 80, name: 'Rigid', desc: '刚体', count: 400 },
    { id: 81, name: 'Articulated', desc: '有关节/可铰接', count: 50 },
    { id: 82, name: 'Slidable', desc: '可滑动', count: 20 },
  ],
};

export default function ObjectLabelsPage() {
  const { message } = App.useApp();
  const [selected, setSelected] = useState('obj_type');
  const [tagsMap, setTagsMap] = useState(initialTagsMap);
  const [adding, setAdding] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');

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
    message.success('标签已添加');
  };

  return (
    <MainLayout>
      <Breadcrumb items={[{ title: '首页' }, { title: '基础数据' }, { title: '物体标签' }]} style={{ marginBottom: 16 }} />

      <div style={{ display: 'flex', gap: 16, height: 'calc(100vh - 160px)' }}>

        {/* Left Category List */}
        <div style={{ width: 220, flexShrink: 0, background: '#fff', borderRadius: 8, border: '1px solid #f0f0f0', padding: 16, overflowY: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text strong style={{ fontSize: 14 }}>标签分类</Text>
            <SearchOutlined style={{ color: '#bfbfbf', cursor: 'pointer' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {objectCategories.map((item, idx) => {
              if (item.type === 'section') {
                return (<div key={idx} style={{ padding: '12px 14px 4px', fontSize: 12, color: '#1890ff', fontWeight: 500 }}><span style={{ marginRight: 6 }}>●</span>{item.label}</div>);
              }
              const isSelected = selected === item.key;
              return (
                <div key={item.key} onClick={() => setSelected(item.key)} style={{ padding: '10px 14px', borderRadius: 8, cursor: 'pointer', background: isSelected ? '#1890ff' : 'transparent', color: isSelected ? '#fff' : '#262626', transition: 'all 0.2s' }}>
                  <div style={{ fontWeight: isSelected ? 600 : 400, fontSize: 13 }}>{item.label}</div>
                  <div style={{ fontSize: 10, color: isSelected ? 'rgba(255,255,255,0.7)' : '#bfbfbf', marginTop: 2, fontFamily: 'monospace' }}>{item.subLabel}</div>
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
              <Tooltip title="点击标签可管理详细信息"><InfoCircleOutlined style={{ color: '#bfbfbf', fontSize: 13 }} /></Tooltip>
            </div>
            <Text type="secondary" style={{ fontSize: 13 }}>{total}/500</Text>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
            {currentTags.map(tag => (
              <div key={tag.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 10px 6px 12px', background: '#fff1f0', border: '1px solid #ffccc7', borderRadius: 20, fontSize: 13, color: '#cf1322' }}>
                <span style={{ fontWeight: 500 }}>{tag.name}</span>
                {tag.desc && <span style={{ color: '#ff7875', fontSize: 11 }}>({tag.desc})</span>}
                {tag.count > 0 && (
                  <span style={{ background: '#ff4d4f', color: '#fff', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 600, flexShrink: 0 }}>{tag.count}</span>
                )}
                <CloseOutlined onClick={() => removeTag(tag.id)} style={{ fontSize: 10, color: '#ff7875', cursor: 'pointer', marginLeft: 2 }} />
              </div>
            ))}

            {adding ? (
              <Input autoFocus size="small" value={newTagInput} onChange={e => setNewTagInput(e.target.value)} onPressEnter={addTag} onBlur={addTag} style={{ width: 140, borderRadius: 20 }} placeholder="输入标签名称" />
            ) : (
              <Button type="dashed" size="small" icon={<PlusOutlined />} onClick={() => setAdding(true)} style={{ borderRadius: 20, color: '#8c8c8c', borderColor: '#d9d9d9' }}>添加标签</Button>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

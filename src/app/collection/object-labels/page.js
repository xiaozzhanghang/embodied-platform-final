'use client';

import React, { useState } from 'react';
import { Typography, Breadcrumb, Button, Input, App } from 'antd';
import { PlusOutlined, CloseOutlined } from '@ant-design/icons';
import MainLayout from '@/components/MainLayout';

const { Text } = Typography;

const objectCategories = [
  { key: 'scene', label: '场景分类', subLabel: '按采集场景分类' },
  { key: 'obj_type', label: '物体类型', subLabel: '物体形态类型' },
  { key: 'color', label: '颜色特性', subLabel: '颜色描述标签' },
  { key: 'optical', label: '光学特性', subLabel: '光学特性标签' },
  { key: 'material', label: '材质特性', subLabel: '材质描述标签' },
  { key: 'shape', label: '形状特性', subLabel: '形状描述标签' },
  { key: 'morphology', label: '形态特性', subLabel: '形态描述标签' },
  { key: 'motion', label: '运动特性', subLabel: '运动特性标签' },
];

const initialTagsMap = {
  scene: [
    { id: 1, name: 'Supermarket', desc: '超市-工业', count: 0 },
    { id: 2, name: 'Industry', desc: '工业', count: 0 },
    { id: 3, name: 'Household', desc: '民购', count: 0 },
    { id: 4, name: 'Kitchen', desc: '厨房', count: 0 },
    { id: 5, name: 'Hotel', desc: '酒店', count: 0 },
    { id: 6, name: 'Scientific', desc: '科研', count: 0 },
    { id: 7, name: 'Shelf', desc: '货架', count: 0 },
    { id: 8, name: 'Container', desc: '容器', count: 0 },
    { id: 9, name: 'pharmacy', desc: '药房', count: 0 },
    { id: 10, name: 'Warehousing', desc: '仓储', count: 0 },
    { id: 11, name: 'Region', desc: '区域', count: 0 },
  ],
  obj_type: [
    { id: 20, name: 'RigidBody', desc: '刚体', count: 45 },
    { id: 21, name: 'Articulated', desc: '铰接可动', count: 12 },
    { id: 22, name: 'Deformable', desc: '可变形', count: 8 },
  ],
  color: [
    { id: 30, name: 'Red', desc: '红色', count: 88 },
    { id: 31, name: 'Blue', desc: '蓝色', count: 65 },
    { id: 32, name: 'White', desc: '白色', count: 120 },
    { id: 33, name: 'Black', desc: '黑色', count: 90 },
    { id: 34, name: 'Transparent', desc: '透明', count: 30 },
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
    { id: 81, name: 'Articulated', desc: '铰接可动', count: 50 },
    { id: 82, name: 'Slidable', desc: '可滑动', count: 20 },
  ],
};

export default function ObjectLabelsPage() {
  const { message } = App.useApp();
  const [selected, setSelected] = useState('scene');
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
      <Breadcrumb items={[{ title: '首页' }, { title: '标签管理' }, { title: '物体标签' }]} style={{ marginBottom: 16 }} />

      <div style={{ display: 'flex', gap: 16, height: 'calc(100vh - 160px)' }}>

        {/* Left Category List */}
        <div style={{ width: 220, flexShrink: 0, background: '#fff', borderRadius: 8, border: '1px solid #f0f0f0', padding: 16, overflowY: 'auto' }}>
          <Text strong style={{ fontSize: 14, display: 'block', marginBottom: 12 }}>标签分类</Text>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {objectCategories.map(cat => (
              <div
                key={cat.key}
                onClick={() => setSelected(cat.key)}
                style={{
                  padding: '12px 14px',
                  borderRadius: 8,
                  cursor: 'pointer',
                  border: `1px solid ${selected === cat.key ? '#1890ff' : 'transparent'}`,
                  background: selected === cat.key ? '#e6f7ff' : '#fafafa',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ fontWeight: selected === cat.key ? 600 : 400, color: selected === cat.key ? '#1890ff' : '#262626', fontSize: 13 }}>
                  {cat.label}
                </div>
                <div style={{ fontSize: 10, color: '#bfbfbf', marginTop: 2 }}>
                  {cat.subLabel}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Tag Panel */}
        <div style={{ flex: 1, background: '#fff', borderRadius: 8, border: '1px solid #f0f0f0', padding: 24, overflowY: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <Text strong style={{ fontSize: 15 }}>自定义标签</Text>
            <Text type="secondary" style={{ fontSize: 13 }}>{total}/500</Text>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
            {currentTags.map(tag => (
              <div
                key={tag.id}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 10px 6px 12px',
                  background: '#f0f5ff',
                  border: '1px solid #adc6ff',
                  borderRadius: 20,
                  fontSize: 13,
                  color: '#2f54eb',
                  cursor: 'default',
                }}
              >
                <span style={{ fontWeight: 500 }}>{tag.name}</span>
                {tag.desc && <span style={{ color: '#597ef7', fontSize: 11 }}>({tag.desc})</span>}
                <span
                  style={{
                    background: '#4096ff',
                    color: '#fff',
                    borderRadius: 10,
                    padding: '0 6px',
                    fontSize: 10,
                    fontWeight: 600,
                    flexShrink: 0,
                    minWidth: 18,
                    textAlign: 'center',
                    cursor: 'default'
                  }}
                >
                  {tag.count}
                </span>
                <CloseOutlined
                  onClick={() => removeTag(tag.id)}
                  style={{ fontSize: 10, color: '#597ef7', cursor: 'pointer', marginLeft: 2 }}
                />
              </div>
            ))}

            {adding ? (
              <Input
                autoFocus
                size="small"
                value={newTagInput}
                onChange={e => setNewTagInput(e.target.value)}
                onPressEnter={addTag}
                onBlur={addTag}
                style={{ width: 140, borderRadius: 20 }}
                placeholder="输入标签名称"
              />
            ) : (
              <Button
                type="dashed"
                size="small"
                icon={<PlusOutlined />}
                onClick={() => setAdding(true)}
                style={{ borderRadius: 20, color: '#8c8c8c', borderColor: '#d9d9d9' }}
              >
                添加标签
              </Button>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

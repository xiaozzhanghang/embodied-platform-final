'use client';

import React, { useState } from 'react';
import { Typography, Breadcrumb, Button, Input, App, Modal, Tag, Space, Tooltip } from 'antd';
import { PlusOutlined, CloseOutlined, InfoCircleOutlined } from '@ant-design/icons';
import MainLayout from '@/components/MainLayout';

const { Text } = Typography;

const taskCategories = [
  { key: 'project',    label: '项目',        subLabel: 'TAG CATEGORY: 项目' },
  { key: 'purpose',   label: '任务用途',     subLabel: 'TAG CATEGORY: 采集方式名称' },
  { key: 'scene',     label: '场景分类',     subLabel: 'TAG CATEGORY: 场景名称' },
  { key: 'mode',      label: '采集模式',     subLabel: 'TAG CATEGORY: 采集模式名称' },
  { key: 'template',  label: '动作模板',     subLabel: 'TAG CATEGORY: 动作模版' },
  { key: 'teleop',    label: '遥控类型',     subLabel: 'TAG CATEGORY: 采集类型名' },
  { key: 'effector',  label: '执行末端类型', subLabel: 'TAG CATEGORY: 执行末端类型名' },
  { key: 'camera',    label: '相机类型',     subLabel: 'TAG CATEGORY: 相机类型名称' },
  { key: 'camera_pos',label: '相机位置类型', subLabel: 'TAG CATEGORY: 相机位置类型名称' },
  { key: 'component', label: '组件类型',     subLabel: 'TAG CATEGORY: 组件类型名' },
];

const initialTagsMap = {
  project: [
    { id: 1, name: 'InternalCommercial', desc: '内部-商业', count: 5 },
    { id: 2, name: 'ExternalXupaosi', desc: '外部-芯片思', count: 2 },
    { id: 3, name: 'InternalIndustrial', desc: '内部-工业需求', count: 1 },
    { id: 4, name: 'Backflow', desc: '回传问题', count: 0 },
    { id: 5, name: 'SimulatedCollection', desc: '模拟采集', count: 0 },
  ],
  purpose: [
    { id: 10, name: 'Training', desc: '模型训练', count: 3 },
    { id: 11, name: 'Valid', desc: '效果评测', count: 1 },
  ],
  // ... other categories can follow same pattern
};

const initialSubTagsMap = {
  1: ['GroceryVLA', 'TakeOver', 'ZhiYuan', 'GroceryVLA_testback', 'GroceryVLA_takeover'],
  2: ['SubTag_X1', 'SubTag_X2'],
  3: ['Industrial_A1'],
  10: ['Vision', 'Audio', 'Sensor'],
  11: ['Quality'],
};

export default function TaskLabelsPage() {
  const { message } = App.useApp();
  const [selected, setSelected] = useState('project');
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
      <Breadcrumb items={[{ title: '首页' }, { title: '标签管理' }, { title: '任务标签' }]} style={{ marginBottom: 16 }} />

      <div style={{ display: 'flex', gap: 16, height: 'calc(100vh - 160px)' }}>

        {/* Left Category List */}
        <div style={{ width: 220, flexShrink: 0, background: '#fff', borderRadius: 8, border: '1px solid #f0f0f0', padding: 16, overflowY: 'auto' }}>
          <Text strong style={{ fontSize: 14, display: 'block', marginBottom: 12 }}>标签分类</Text>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {taskCategories.map(cat => (
              <div
                key={cat.key}
                onClick={() => setSelected(cat.key)}
                style={{
                  padding: '12px 14px', borderRadius: 8, cursor: 'pointer',
                  border: `1px solid ${selected === cat.key ? '#1890ff' : 'transparent'}`,
                  background: selected === cat.key ? '#e6f7ff' : '#fafafa',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ fontWeight: selected === cat.key ? 600 : 400, color: selected === cat.key ? '#1890ff' : '#262626', fontSize: 13 }}>
                  {cat.label}
                </div>
                <div style={{ fontSize: 10, color: '#bfbfbf', marginTop: 2, fontFamily: 'monospace' }}>
                  {cat.subLabel}
                </div>
              </div>
            ))}
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

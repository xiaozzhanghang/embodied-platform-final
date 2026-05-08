'use client';

import React, { useState } from 'react';
import { Typography, Breadcrumb, Button, Input, App, Tooltip, Modal } from 'antd';
import { PlusOutlined, CloseOutlined, InfoCircleOutlined, SearchOutlined } from '@ant-design/icons';
import MainLayout from '@/components/MainLayout';

const { Text } = Typography;

const categories = [
  { type: 'section', label: '项目身份' },
  { key: 'project_name', label: '项目名称', subLabel: 'TAG CATEGORY: 项目名称' },
  { type: 'section', label: '项目属性' },
  { key: 'task_purpose', label: '任务用途', subLabel: 'TAG CATEGORY: 任务用途' },
  { key: 'taskbook_type', label: '任务书类别', subLabel: 'TAG CATEGORY: 任务书类别' },
];

const initialTagsMap = {
  project_name: [
    { id: 1, name: 'InternalCommercial', desc: '内部-商业', count: 5 },
    { id: 2, name: 'ExternalXupaosi', desc: '外部-芯片思', count: 2 },
    { id: 3, name: 'InternalIndustrial', desc: '内部-工业需求', count: 1 },
    { id: 4, name: 'Backflow', desc: '回传问题', count: 0 },
    { id: 5, name: 'SimulatedCollection', desc: '模拟采集', count: 0 },
  ],
  task_purpose: [
    { id: 10, name: 'Training', desc: '模型训练', count: 3 },
    { id: 11, name: 'Valid', desc: '效果评测', count: 1 },
    { id: 12, name: 'Demo', desc: '展会演示', count: 0 },
  ],
  taskbook_type: [
    { id: 20, name: 'RegularLabeling', desc: '常规打标', count: 4 },
    { id: 21, name: 'Rework', desc: '返工作业', count: 1 },
    { id: 22, name: 'PointCloudOnly', desc: '纯点云标注', count: 0 },
  ],
};

const initialSubTagsMap = {
  1: ['GroceryVLA', 'FoundationModel', 'TakeOver', 'Zhiyuan', 'Nvidia'],
  2: ['SubTag_X1', 'SubTag_X2'],
  3: ['Industrial_A1'],
  10: ['Vision', 'Audio', 'Sensor'],
  11: ['Quality'],
};

export default function ProjectManagementPage() {
  const { message } = App.useApp();
  const [selected, setSelected] = useState('project_name');
  const [tagsMap, setTagsMap] = useState(initialTagsMap);
  const [subTagsMap, setSubTagsMap] = useState(initialSubTagsMap);
  const [adding, setAdding] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');
  const [subModal, setSubModal] = useState({ open: false, parentTag: null });
  const [addingSub, setAddingSub] = useState(false);
  const [newSubInput, setNewSubInput] = useState('');

  const currentTags = tagsMap[selected] || [];
  const total = Object.values(tagsMap).reduce((s, arr) => s + arr.length, 0);
  const currentSubTags = subModal.parentTag ? (subTagsMap[subModal.parentTag.id] || []) : [];

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

  const openSubModal = (tag) => setSubModal({ open: true, parentTag: tag });

  const addSubTag = () => {
    if (!newSubInput.trim()) { setAddingSub(false); return; }
    const parentId = subModal.parentTag.id;
    const newList = [...(subTagsMap[parentId] || []), newSubInput.trim()];
    setSubTagsMap(prev => ({ ...prev, [parentId]: newList }));
    setTagsMap(prev => {
      const category = Object.keys(prev).find(key => prev[key].some(t => t.id === parentId));
      if (!category) return prev;
      return { ...prev, [category]: prev[category].map(t => t.id === parentId ? { ...t, count: newList.length } : t) };
    });
    setNewSubInput('');
    setAddingSub(false);
    message.success('二级标签已添加');
  };

  const removeSubTag = (tagName) => {
    const parentId = subModal.parentTag.id;
    const newList = subTagsMap[parentId].filter(t => t !== tagName);
    setSubTagsMap(prev => ({ ...prev, [parentId]: newList }));
    setTagsMap(prev => {
      const category = Object.keys(prev).find(key => prev[key].some(t => t.id === parentId));
      if (!category) return prev;
      return { ...prev, [category]: prev[category].map(t => t.id === parentId ? { ...t, count: newList.length } : t) };
    });
  };

  return (
    <MainLayout>
      <Breadcrumb items={[{ title: '首页' }, { title: '基础数据' }, { title: '项目管理' }]} style={{ marginBottom: 16 }} />

      <div style={{ display: 'flex', gap: 16, height: 'calc(100vh - 160px)' }}>
        {/* Left Category List */}
        <div style={{ width: 220, flexShrink: 0, background: '#fff', borderRadius: 8, border: '1px solid #f0f0f0', padding: 16, overflowY: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text strong style={{ fontSize: 14 }}>标签分类</Text>
            <SearchOutlined style={{ color: '#bfbfbf', cursor: 'pointer' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {categories.map((item, idx) => {
              if (item.type === 'section') {
                return (
                  <div key={idx} style={{
                    padding: '10px 12px',
                    marginTop: idx === 0 ? 0 : 12,
                    marginBottom: 4,
                    borderLeft: '3px solid #1890ff',
                    background: 'linear-gradient(90deg, #e6f4ff, transparent)',
                    borderRadius: '0 6px 6px 0',
                    fontSize: 12,
                    color: '#1890ff',
                    fontWeight: 600,
                    letterSpacing: '0.5px',
                  }}>
                    {item.label}
                  </div>
                );
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
              <Tooltip title="点击标签右侧数字可进入二级标签管理"><InfoCircleOutlined style={{ color: '#bfbfbf', fontSize: 13 }} /></Tooltip>
            </div>
            <Text type="secondary" style={{ fontSize: 13 }}>{total}/500</Text>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
            {currentTags.map(tag => (
              <div key={tag.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 10px 6px 12px', background: '#fff1f0', border: '1px solid #ffccc7', borderRadius: 20, fontSize: 13, color: '#cf1322' }}>
                <span style={{ fontWeight: 500 }}>{tag.name}</span>
                {tag.desc && <span style={{ color: '#ff7875', fontSize: 11 }}>({tag.desc})</span>}
                <Tooltip title={`管理二级标签 (${tag.count})`}>
                  <span onClick={() => openSubModal(tag)} style={{ background: '#ff4d4f', color: '#fff', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 600, flexShrink: 0, cursor: 'pointer', boxShadow: '0 2px 4px rgba(255,77,79,0.3)' }}>{tag.count}</span>
                </Tooltip>
                <CloseOutlined onClick={() => removeTag(tag.id)} style={{ fontSize: 10, color: '#ff7875', cursor: 'pointer', marginLeft: 2 }} />
              </div>
            ))}
            {adding ? (
              <Input autoFocus size="small" value={newTagInput} onChange={e => setNewTagInput(e.target.value)} onPressEnter={addTag} onBlur={addTag} style={{ width: 140, borderRadius: 20 }} placeholder="输入标签名称" />
            ) : (
              <Button type="dashed" size="small" icon={<PlusOutlined />} onClick={() => setAdding(true)} style={{ borderRadius: 20, color: '#8c8c8c', borderColor: '#d9d9d9' }}>添加一级标签</Button>
            )}
          </div>
        </div>
      </div>

      {/* Sub-tag Modal */}
      <Modal title="二级标签管理" open={subModal.open} onCancel={() => setSubModal({ open: false, parentTag: null })} footer={null} width={600} centered styles={{ body: { padding: '24px 32px' } }}>
        {subModal.parentTag && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
              <Text strong style={{ fontSize: 16, flexShrink: 0 }}>一级分类</Text>
              <div style={{ padding: '4px 16px', background: '#e6f7ff', border: '1px solid #91d5ff', borderRadius: 4, color: '#1890ff', fontSize: 14 }}>
                {subModal.parentTag.name}{subModal.parentTag.desc ? `(${subModal.parentTag.desc})` : ''}
              </div>
            </div>
            <div style={{ background: '#f8f9fa', borderRadius: 8, padding: '20px 24px', border: '1px solid #f0f0f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Text strong style={{ fontSize: 15 }}>二级分类</Text>
                <Text type="secondary" style={{ fontSize: 12 }}>{currentSubTags.length}/500</Text>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                {currentSubTags.map((st, idx) => (
                  <div key={idx} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 12px', background: '#1890ff', color: '#fff', borderRadius: 4, fontSize: 14 }}>
                    <span>{st}</span>
                    <CloseOutlined style={{ fontSize: 12, cursor: 'pointer', opacity: 0.8 }} onClick={() => removeSubTag(st)} />
                  </div>
                ))}
                {addingSub ? (
                  <Input autoFocus size="small" value={newSubInput} onChange={e => setNewSubInput(e.target.value)} onPressEnter={addSubTag} onBlur={addSubTag} style={{ width: 120, borderRadius: 4 }} />
                ) : (
                  <Button type="dashed" size="middle" icon={<PlusOutlined />} onClick={() => setAddingSub(true)} style={{ borderRadius: 4, color: '#1890ff', borderColor: '#1890ff' }}>添加二级标签</Button>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </MainLayout>
  );
}

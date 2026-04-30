'use client';

import React, { useState } from 'react';
import { Table, Button, Input, Select, Space, Tag, Typography, Breadcrumb, App, DatePicker, Image, Empty } from 'antd';
import { PlusOutlined, SearchOutlined, ReloadOutlined, EditOutlined, DeleteOutlined, FolderOutlined, FolderOpenOutlined } from '@ant-design/icons';
import MainLayout from '@/components/MainLayout';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

// ─── Category Tree ─────────────────────────────────────────────────
const categoryTree = [
  { key: 'all', label: '全部分类', scene: null },
  { key: 'drink', label: '饮品类', scene: 'Drink' },
  { key: 'clean', label: '清洁类', scene: 'Clean' },
  {
    key: 'snack', label: '零食类', scene: 'Snack',
    children: [
      { key: 'snack-instant', label: '方便食品类', scene: 'Instant' },
      { key: 'snack-puffed', label: '膨化食品类', scene: 'Puffed' },
    ]
  },
  {
    key: 'daily', label: '日常作品类', scene: 'Daily',
    children: [
      { key: 'daily-hygiene', label: '卫生用品', scene: 'Hygiene' },
      { key: 'daily-medicine', label: '药品类', scene: 'Medicine' },
      { key: 'daily-furniture', label: '家具类', scene: 'Furniture' },
    ]
  },
  { key: 'industry', label: '工业类', scene: 'Industry(工业)' },
  { key: 'kitchen', label: '厨房类', scene: 'Kitchen(厨房)' },
  { key: 'supermarket', label: '超市类', scene: 'Supermarket(超市)' },
  { key: 'robot-body', label: '依据本体', scene: 'RobotBody' },
  { key: 'region', label: '区域', scene: 'Region' },
];

// Flatten tree to get scene by key
const getAllScenes = (tree) => {
  const map = {};
  const walk = (nodes) => nodes.forEach(n => {
    map[n.key] = n.scene;
    if (n.children) walk(n.children);
  });
  walk(tree);
  return map;
};
const sceneByKey = getAllScenes(categoryTree);

// ─── Mock Data ─────────────────────────────────────────────────────
const mockObjects = [
  { key: '1', scene: 'Industry(工业)', name: '网线', enName: 'Network cable', material: '塑料', img: null, creator: '天奇管理员', updater: '天奇管理员', createTime: '2026-03-06 16:40' },
  { key: '2', scene: 'Industry(工业)', name: '毛滚线', enName: 'power cord', material: null, img: null, creator: '大奇管理员', updater: '大奇管理员', createTime: '2026-03-06 16:42' },
  { key: '3', scene: 'Industry(工业)', name: '四零插排板', enName: 'four-compartment board', material: '塑料', img: null, creator: '天奇管理员', updater: '天奇管理员', createTime: '2026-03-06 16:44' },
  { key: '4', scene: 'Industry(工业)', name: 'HDMI主', enName: 'HDMI cable', material: null, img: null, creator: '天奇管理员', updater: '天奇管理员', createTime: '2026-03-06 16:45' },
  { key: '5', scene: 'Industry(工业)', name: 'USB线', enName: 'USB cable', material: null, img: null, creator: '大奇管理员', updater: '大奇管理员', createTime: '2026-03-06 16:47' },
  { key: '6', scene: 'Kitchen(厨房)', name: '水杯', enName: 'Cup', material: '陶瓷', img: null, creator: '管理员', updater: '管理员', createTime: '2026-02-20 10:00' },
  { key: '7', scene: 'Kitchen(厨房)', name: '炒锅', enName: 'Wok', material: '金属', img: null, creator: '管理员', updater: '管理员', createTime: '2026-02-21 09:30' },
  { key: '8', scene: 'Supermarket(超市)', name: '可乐瓶', enName: 'Cola bottle', material: '塑料', img: null, creator: '管理员', updater: '管理员', createTime: '2026-02-18 09:30' },
  { key: '9', scene: 'Supermarket(超市)', name: '薯片桶', enName: 'Chips tube', material: '塑料', img: null, creator: '管理员', updater: '管理员', createTime: '2026-02-19 11:20' },
];

// ─── Category Tree Node ─────────────────────────────────────────────
function CategoryNode({ item, selected, onSelect, depth = 0 }) {
  const [open, setOpen] = useState(true);
  const hasChildren = item.children && item.children.length > 0;
  const isSelected = selected === item.key;

  return (
    <div>
      <div
        onClick={() => {
          onSelect(item.key);
          if (hasChildren) setOpen(!open);
        }}
        style={{
          padding: `8px 12px 8px ${14 + depth * 16}px`,
          cursor: 'pointer',
          borderRadius: 6,
          marginBottom: 2,
          background: isSelected ? '#1890ff' : 'transparent',
          color: isSelected ? '#fff' : '#262626',
          fontWeight: isSelected ? 600 : 400,
          fontSize: 13,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          transition: 'all 0.2s',
        }}
      >
        {hasChildren
          ? (open
            ? <FolderOpenOutlined style={{ fontSize: 13 }} />
            : <FolderOutlined style={{ fontSize: 13 }} />)
          : <span style={{ display: 'inline-block', width: 13 }} />
        }
        <span style={{ flex: 1 }}>{item.label}</span>
        {hasChildren && (
          <span style={{ fontSize: 10, opacity: 0.7 }}>{open ? '▲' : '▼'}</span>
        )}
      </div>
      {hasChildren && open && item.children.map(child => (
        <CategoryNode key={child.key} item={child} selected={selected} onSelect={onSelect} depth={depth + 1} />
      ))}
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────
export default function ObjectLibraryPage() {
  const { message } = App.useApp();
  const [selectedCat, setSelectedCat] = useState('all');
  const [nameFilter, setNameFilter] = useState('');
  const [materialFilter, setMaterialFilter] = useState('');

  // ← KEY INTERACTION: filter by selected category
  const selectedScene = sceneByKey[selectedCat];
  const filtered = mockObjects.filter(o => {
    const matchScene = !selectedScene || o.scene === selectedScene;
    const matchName = !nameFilter || o.name.includes(nameFilter) || o.enName.toLowerCase().includes(nameFilter.toLowerCase());
    const matchMaterial = !materialFilter || (o.material || '').includes(materialFilter);
    return matchScene && matchName && matchMaterial;
  });

  const columns = [
    {
      title: '场景',
      dataIndex: 'scene',
      key: 'scene',
      width: 140,
      render: s => <Tag color="blue" style={{ fontSize: 11 }}>{s}</Tag>
    },
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      width: 120,
      render: t => <Text strong>{t}</Text>
    },
    { title: '英文名称', dataIndex: 'enName', key: 'enName', width: 170, ellipsis: true },
    {
      title: '材质特性',
      dataIndex: 'material',
      key: 'material',
      width: 100,
      render: m => m
        ? <Tag color="geekblue">{m}</Tag>
        : <Text type="secondary" style={{ fontSize: 11 }}>无特性</Text>
    },
    {
      title: '物体图片',
      dataIndex: 'img',
      key: 'img',
      width: 90,
      render: img => img
        ? <Image src={img} width={48} height={48} style={{ objectFit: 'cover', borderRadius: 4 }} />
        : <div style={{
          width: 48, height: 48, background: '#f5f5f5', borderRadius: 4,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 10, color: '#bfbfbf'
        }}>无图片</div>
    },
    { title: '创建人', dataIndex: 'creator', key: 'creator', width: 110 },
    { title: '更新人', dataIndex: 'updater', key: 'updater', width: 110 },
    { title: '创建时间', dataIndex: 'createTime', key: 'createTime', width: 150 },
    {
      title: '操作',
      key: 'action',
      width: 120,
      fixed: 'right',
      render: () => (
        <Space size={4}>
          <Button type="link" size="small" icon={<EditOutlined />} style={{ padding: '0 4px' }}>编辑</Button>
          <Button type="link" size="small" danger icon={<DeleteOutlined />} style={{ padding: '0 4px' }}>删除</Button>
        </Space>
      )
    },
  ];

  return (
    <MainLayout>
      <Breadcrumb items={[{ title: '首页' }, { title: '标签管理' }, { title: '物体库' }]} style={{ marginBottom: 16 }} />

      <div style={{ display: 'flex', gap: 16, height: 'calc(100vh - 160px)' }}>

        {/* Left Category Tree */}
        <div style={{
          width: 200, flexShrink: 0, background: '#fff', borderRadius: 8,
          border: '1px solid #f0f0f0', padding: 12, overflowY: 'auto'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text strong style={{ fontSize: 13 }}>物体类型</Text>
            <Button type="link" size="small" style={{ padding: 0, fontSize: 12 }}>+ 添加</Button>
          </div>
          {categoryTree.map(item => (
            <CategoryNode
              key={item.key}
              item={item}
              selected={selectedCat}
              onSelect={(key) => {
                setSelectedCat(key);
                setNameFilter('');
                setMaterialFilter('');
              }}
            />
          ))}
        </div>

        {/* Right Content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, overflow: 'hidden', minWidth: 0 }}>

          {/* Active filter hint */}
          {selectedCat !== 'all' && (
            <div style={{
              background: '#e6f7ff', border: '1px solid #91d5ff',
              borderRadius: 6, padding: '6px 14px', fontSize: 12, color: '#096dd9',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <span>当前筛选：<strong>{categoryTree.find(c => c.key === selectedCat)?.label || selectedCat}</strong>，共 {filtered.length} 条数据</span>
              <Button type="link" size="small" style={{ padding: 0 }} onClick={() => setSelectedCat('all')}>清除筛选</Button>
            </div>
          )}

          {/* Filter Bar */}
          <div style={{
            background: '#fff', borderRadius: 8, border: '1px solid #f0f0f0',
            padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap'
          }}>
            <Select
              placeholder="场景/下拉选择" allowClear style={{ width: 160 }}
              options={[
                { label: 'Industry(工业)', value: 'Industry(工业)' },
                { label: 'Kitchen(厨房)', value: 'Kitchen(厨房)' },
                { label: 'Supermarket(超市)', value: 'Supermarket(超市)' },
              ]}
            />
            <Input
              placeholder="名称/英文名称" allowClear style={{ width: 160 }}
              value={nameFilter} onChange={e => setNameFilter(e.target.value)}
            />
            <Input
              placeholder="特性 / 材质" allowClear style={{ width: 130 }}
              value={materialFilter} onChange={e => setMaterialFilter(e.target.value)}
            />
            <RangePicker style={{ width: 220 }} placeholder={['开始日期', '结束日期']} />
            <Button type="primary" icon={<SearchOutlined />}>查询</Button>
            <Button icon={<ReloadOutlined />} onClick={() => { setNameFilter(''); setMaterialFilter(''); }}>重置</Button>
            <Button type="primary" icon={<PlusOutlined />} style={{ marginLeft: 'auto' }}>+ 添加</Button>
          </div>

          {/* Table */}
          <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #f0f0f0', flex: 1, overflow: 'hidden' }}>
            {filtered.length === 0
              ? <Empty description="该分类下暂无物体数据" style={{ paddingTop: 80 }} />
              : <Table
                columns={columns}
                dataSource={filtered}
                scroll={{ x: 1000, y: 'calc(100vh - 400px)' }}
                size="middle"
                pagination={{
                  total: filtered.length,
                  pageSize: 20,
                  showSizeChanger: true,
                  showTotal: t => `共 ${t} 条`,
                  pageSizeOptions: ['20', '50'],
                }}
              />
            }
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

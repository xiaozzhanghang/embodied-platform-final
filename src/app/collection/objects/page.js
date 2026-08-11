'use client';

import React, { useState } from 'react';
import { Table, Button, Input, Select, Space, Tag, Typography, Breadcrumb, App, DatePicker, Image, Empty, Modal, Form, Upload, Tooltip, Row, Col, Card, Descriptions } from 'antd';
import { PlusOutlined, SearchOutlined, ReloadOutlined, EditOutlined, DeleteOutlined, FolderOutlined, FolderOpenOutlined, QuestionCircleOutlined, DownOutlined, UpOutlined, EyeOutlined, PictureOutlined } from '@ant-design/icons';
import { QueryFilter, ProFormText, ProFormSelect, ProFormDateRangePicker } from '@ant-design/pro-components';
import MainLayout from '@/components/MainLayout';
import SpecMarker from '@/components/SpecMarker';
import { AppModal, FilterPanel, PageHeader, TableToolbar } from '@/components/ui';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

// ─── Helpers ───────────────────────────────────────────────────────
const mapSceneValueToLabel = (val) => {
  const mapping = {
    'Supermarket': 'Supermarket(超市)',
    'Industry': 'Industry(工业)',
    'Kitchen': 'Kitchen(厨房)',
    'Hotel': 'Hotel(酒店)',
    'Scientific': 'Scientific(科研)',
    'Shelf': 'Shelf(货架)',
    'Container': 'Container(容器)',
    'pharmacy': 'pharmacy(药房)',
    'Warehousing': 'Warehousing(仓储)',
    'Region': 'Region(区域)'
  };
  return mapping[val] || val;
};

const mapLabelToSceneValue = (label) => {
  const mapping = {
    'Supermarket(超市)': 'Supermarket',
    'Supermarket(商超)': 'Supermarket',
    'Industry(工业)': 'Industry',
    'Kitchen(厨房)': 'Kitchen',
    'Hotel(酒店)': 'Hotel',
    'Scientific(科研)': 'Scientific',
    'Shelf(货架)': 'Shelf',
    'Container(容器)': 'Container',
    'pharmacy(药房)': 'pharmacy',
    'Warehousing(仓储)': 'Warehousing',
    'Region(区域)': 'Region'
  };
  return mapping[label] || label;
};

const getBase64 = (img, callback) => {
  const reader = new FileReader();
  reader.addEventListener('load', () => callback(reader.result));
  reader.readAsDataURL(img);
};

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
  { key: '1', scene: 'Industry(工业)', name: '网线', enName: 'Network cable', objType: 'RigidBody', material: '塑料', img: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=150&auto=format&fit=crop&q=80', creator: '天奇管理员', updater: '天奇管理员', createTime: '2026-03-06 16:40' },
  { key: '2', scene: 'Industry(工业)', name: '毛滚线', enName: 'power cord', objType: 'Deformable', material: null, img: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=150&auto=format&fit=crop&q=80', creator: '大奇管理员', updater: '大奇管理员', createTime: '2026-03-06 16:42' },
  { key: '3', scene: 'Industry(工业)', name: '四零插排板', enName: 'four-compartment board', objType: 'RigidBody', material: '塑料', img: 'https://images.unsplash.com/photo-1620288627223-53302f4e8c74?w=150&auto=format&fit=crop&q=80', creator: '天奇管理员', updater: '天奇管理员', createTime: '2026-03-06 16:44' },
  { key: '4', scene: 'Industry(工业)', name: 'HDMI主', enName: 'HDMI cable', objType: 'Deformable', material: null, img: 'https://images.unsplash.com/photo-1600541519468-4a91217b1820?w=150&auto=format&fit=crop&q=80', creator: '天奇管理员', updater: '天奇管理员', createTime: '2026-03-06 16:45' },
  { key: '5', scene: 'Industry(工业)', name: 'USB线', enName: 'USB cable', objType: 'Deformable', material: null, img: 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=150&auto=format&fit=crop&q=80', creator: '大奇管理员', updater: '大奇管理员', createTime: '2026-03-06 16:47' },
  { key: '6', scene: 'Kitchen(厨房)', name: '水杯', enName: 'Cup', objType: 'RigidBody', material: '陶瓷', img: 'https://images.unsplash.com/photo-1517256064527-09c53b2d0bc6?w=150&auto=format&fit=crop&q=80', creator: '管理员', updater: '管理员', createTime: '2026-02-20 10:00' },
  { key: '7', scene: 'Kitchen(厨房)', name: '炒锅', enName: 'Wok', objType: 'RigidBody', material: '金属', img: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=150&auto=format&fit=crop&q=80', creator: '管理员', updater: '管理员', createTime: '2026-02-21 09:30' },
  { key: '8', scene: 'Supermarket(超市)', name: '可乐瓶', enName: 'Cola bottle', objType: 'RigidBody', material: '塑料', img: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=150&auto=format&fit=crop&q=80', creator: '管理员', updater: '管理员', createTime: '2026-02-18 09:30' },
  { key: '9', scene: 'Supermarket(超市)', name: '薯片桶', enName: 'Chips tube', objType: 'RigidBody', material: '塑料', img: 'https://images.unsplash.com/photo-1566478989037-eec170784d20?w=150&auto=format&fit=crop&q=80', creator: '管理员', updater: '管理员', createTime: '2026-02-19 11:20' },
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

  // Stateful list of objects and categories
  const [objects, setObjects] = useState(mockObjects);
  const [categories, setCategories] = useState(categoryTree);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [brokenImages, setBrokenImages] = useState({});

  // Modals and editing state
  const [typeModalVisible, setTypeModalVisible] = useState(false);
  const [typeForm] = Form.useForm();
  const [objectModalVisible, setObjectModalVisible] = useState(false);
  const [objectForm] = Form.useForm();
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedObj, setSelectedObj] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  const [editingObj, setEditingObj] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);

  const handleAddType = () => {
    typeForm.validateFields().then(values => {
      const newType = {
        key: values.enName ? values.enName.toLowerCase() : Date.now().toString(),
        label: values.name,
        scene: values.enName || null,
      };
      setCategories(prev => [...prev, newType]);
      message.success(`成功添加物体类型：${values.name}`);
      setTypeModalVisible(false);
      typeForm.resetFields();
    });
  };

  const beforeUpload = (file) => {
    const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/gif';
    if (!isJpgOrPng) {
      message.error('只支持 JPG/PNG/GIF 格式的图片!');
      return Upload.LIST_IGNORE;
    }
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error('图片大小必须小于 2MB!');
      return Upload.LIST_IGNORE;
    }
    getBase64(file, (url) => {
      setImageUrl(url);
    });
    return false; // Stop upload
  };

  const handleSubmitObject = () => {
    objectForm.validateFields().then(values => {
      const displayScene = mapSceneValueToLabel(values.scene);
      if (editingObj) {
        setObjects(prev => prev.map(o => {
          if (o.key === editingObj.key) {
            return {
              ...o,
              name: values.nameCn,
              enName: values.nameEn || '',
              objType: values.objType,
              scene: displayScene,
              material: values.material || null,
              img: imageUrl,
              updater: '管理员',
            };
          }
          return o;
        }));
        message.success(`成功修改物体：${values.nameCn}`);
      } else {
        const newObj = {
          key: Date.now().toString(),
          scene: displayScene,
          name: values.nameCn,
          enName: values.nameEn || '',
          objType: values.objType,
          material: values.material || null,
          img: imageUrl,
          creator: '管理员',
          updater: '管理员',
          createTime: dayjs().format('YYYY-MM-DD HH:mm'),
        };
        setObjects(prev => [newObj, ...prev]);
        message.success(`成功添加物体：${values.nameCn}`);
      }
      setObjectModalVisible(false);
      setEditingObj(null);
      setImageUrl(null);
      objectForm.resetFields();
    });
  };

  const handleCancelObject = () => {
    setObjectModalVisible(false);
    setEditingObj(null);
    setImageUrl(null);
    objectForm.resetFields();
  };

  // ← KEY INTERACTION: filter by selected category
  const selectedScene = sceneByKey[selectedCat];
  const filtered = objects.filter(o => {
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
      title: (
        <SpecMarker
          id="objects-upload"
          number={4}
          title="物体图片上传与校验"
          rules={[
            "图片上传格式仅限 JPG, JPEG, PNG, GIF。",
            "图片大小限制在 2MB 以内，超出则抛出错误并拦截上传。",
            "支持在弹窗内上传，并可在保存前点击‘删除图片’进行清除操作。"
          ]}
          remark="在新增/编辑表单中使用 Upload 组件上传，本地预览通过 Base64 获取，实际提交时同步发送至服务端 API。"
        >
          物体图片
        </SpecMarker>
      ),
      dataIndex: 'img',
      key: 'img',
      width: 90,
      render: (img, record) => (img && !brokenImages[record.key])
        ? (
          <div
            className="thumb-preview-container-table"
            onClick={() => setPreviewImage(img)}
          >
            <img
              src={img}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={() => setBrokenImages(prev => ({ ...prev, [record.key]: true }))}
            />
            <div className="thumb-preview-mask-table">
              <EyeOutlined style={{ fontSize: 16 }} />
            </div>
          </div>
        )
        : (
          <div style={{
            width: 48,
            height: 48,
            background: 'linear-gradient(135deg, #eff6ff 0%, #e0e7ff 100%)',
            borderRadius: 8,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid #dbeafe',
            boxShadow: '0 2px 4px rgba(79, 70, 229, 0.05)',
            gap: 2
          }}>
            <PictureOutlined style={{ fontSize: 13, color: '#4f46e5', opacity: 0.8 }} />
            <span style={{ fontSize: 8, fontWeight: 500, color: '#4f46e5', opacity: 0.6, transform: 'scale(0.85)', display: 'inline-block', whiteSpace: 'nowrap' }}>暂无图片</span>
          </div>
        )
    },
    { title: '创建人', dataIndex: 'creator', key: 'creator', width: 110 },
    { title: '更新人', dataIndex: 'updater', key: 'updater', width: 110 },
    { title: '创建时间', dataIndex: 'createTime', key: 'createTime', width: 150 },
    {
      title: '操作',
      key: 'action',
      width: 180,
      fixed: 'right',
      render: (_, record) => (
        <Space size={4}>
          <Button type="link" size="small" icon={<EyeOutlined />} style={{ padding: '0 4px' }} onClick={() => { setSelectedObj(record); setDetailOpen(true); }}>查看详情</Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            style={{ padding: '0 4px' }}
            onClick={() => {
              setEditingObj(record);
              objectForm.setFieldsValue({
                nameCn: record.name,
                nameEn: record.enName,
                objType: record.objType,
                scene: mapLabelToSceneValue(record.scene),
                material: record.material,
              });
              setImageUrl(record.img);
              setObjectModalVisible(true);
            }}
          >
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
            style={{ padding: '0 4px' }}
            onClick={() => Modal.confirm({
              title: '确定删除？',
              content: '此操作不可恢复，是否继续？',
              okText: '确定',
              okType: 'danger',
              cancelText: '取消',
              onOk: () => {
                setObjects(prev => prev.filter(o => o.key !== record.key));
                message.success('已删除');
              }
            })}
          >
            删除
          </Button>
        </Space>
      )
    },
  ];

  return (
    <MainLayout>
      <style dangerouslySetInnerHTML={{ __html: `
        .thumb-preview-container-table {
          position: relative;
          width: 48px;
          height: 48px;
          cursor: pointer;
          border-radius: 6px;
          overflow: hidden;
          display: inline-block;
          border: 1px solid #f0f0f0;
          transition: all 0.3s ease;
        }
        .thumb-preview-container-table:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
          border-color: #1890ff;
        }
        .thumb-preview-mask-table {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          opacity: 0;
          transition: opacity 0.25s ease;
        }
        .thumb-preview-container-table:hover .thumb-preview-mask-table {
          opacity: 1;
        }

        .thumb-preview-container-detail {
          position: relative;
          width: 120px;
          height: 120px;
          cursor: pointer;
          border-radius: 8px;
          overflow: hidden;
          display: inline-block;
          border: 1px solid #f0f0f0;
          transition: all 0.3s ease;
        }
        .thumb-preview-container-detail:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          border-color: #1890ff;
        }
        .thumb-preview-mask-detail {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          opacity: 0;
          transition: opacity 0.25s ease;
        }
        .thumb-preview-container-detail:hover .thumb-preview-mask-detail {
          opacity: 1;
        }

        .thumb-preview-container-upload {
          position: relative;
          width: 100%;
          height: 100%;
          overflow: hidden;
          border-radius: 8px;
        }
        .thumb-preview-mask-upload {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          opacity: 0;
          transition: opacity 0.25s ease;
          cursor: pointer;
        }
        .thumb-preview-container-upload:hover .thumb-preview-mask-upload {
          opacity: 1;
        }
      ` }} />
      <div className="ui-page">
        <PageHeader
          title="物体库"
          description="维护物体分类、物理属性、图片资产及采集关联信息。"
          breadcrumbs={[{ title: '首页' }, { title: '基础数据' }, { title: '物体库' }]}
        />

        <div style={{ display: 'flex', gap: 16, height: 'calc(100vh - 210px)' }}>

        {/* Left Category Tree */}
        <div style={{
          width: 200, flexShrink: 0, background: '#fff', borderRadius: 8,
          border: '1px solid #f0f0f0', padding: 12, overflowY: 'auto'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text strong style={{ fontSize: 13 }}>物体类型</Text>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <SpecMarker
                id="objects-type-create"
                number={1}
                title="物体类型维护"
                rules={[
                  "支持新增物体类型分类（名称中文最大 50 字符，可设置英文标识）。",
                  "点击 '+' 按钮弹出弹窗，校验输入名称是否为空。",
                  "提交后局部更新左侧物体分类树目录。"
                ]}
                remark="对应左侧物体类型管理。输入限制 50 字符，支持中英文过滤。"
              >
                <Button
                  type="text"
                  icon={<PlusOutlined />}
                  size="small"
                  onClick={() => setTypeModalVisible(true)}
                  style={{ color: '#1890ff', padding: '0 4px' }}
                  title="添加物体类型"
                />
              </SpecMarker>
              <SearchOutlined style={{ color: '#bfbfbf', cursor: 'pointer' }} />
            </div>
          </div>
          {categories.map(item => (
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
              <span>当前筛选：<strong>{categories.find(c => c.key === selectedCat)?.label || selectedCat}</strong>，共 {filtered.length} 条数据</span>
              <Button type="link" size="small" style={{ padding: 0 }} onClick={() => setSelectedCat('all')}>清除筛选</Button>
            </div>
          )}

          <SpecMarker
            id="objects-query"
            number={2}
            title="场景与多属性条件检索"
            rules={[
              "支持按场景类型、名称/英文名称模糊匹配、特性/材质特性、录入时间段以及物体ID等多重条件联合检索。",
              "每个表单输入项均包含占位符，且需支持‘可清空（allowClear）’属性。",
              "重置操作需同时清空左侧选中的树目录和右侧所有过滤条件，并重载全部数据。"
            ]}
            remark="对接表格任务的‘查询筛选’节点，保证大吞吐量异构数据分类快速过滤。"
            style={{ width: '100%' }}
          >
            <FilterPanel>
              <QueryFilter
                  submitter={{
                      submitButtonProps: { icon: <SearchOutlined /> },
                      resetButtonProps: { icon: <ReloadOutlined /> },
                  }}
                  onFinish={async (values) => {
                      setNameFilter(values.name || '');
                      setMaterialFilter(values.material || '');
                  }}
                  onReset={() => {
                      setNameFilter('');
                      setMaterialFilter('');
                  }}
                  initialValues={{
                      name: nameFilter,
                      material: materialFilter,
                  }}
              >
                  <ProFormSelect
                      name="scene"
                      label="场景选择"
                      placeholder="请选择场景"
                      options={[
                          { label: 'Industry(工业)', value: 'Industry(工业)' },
                          { label: 'Kitchen(厨房)', value: 'Kitchen(厨房)' },
                          { label: 'Supermarket(超市)', value: 'Supermarket(超市)' },
                      ]}
                  />
                  <ProFormText name="name" label="名称搜索" placeholder="名称/英文名称" />
                  <ProFormText name="material" label="特性/材质" placeholder="请输入特性" />
                  <ProFormDateRangePicker name="date" label="录入时间" />
                  <ProFormText name="id" label="物体ID" placeholder="请输入ID" />
              </QueryFilter>
            </FilterPanel>
          </SpecMarker>

          {/* Toolbar & Table */}
          <div className="ui-table-card" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <TableToolbar
              title="物体列表"
              count={filtered.length}
              selectedCount={selectedRowKeys.length}
              actions={[
                <SpecMarker
                  key="create"
                  id="objects-create"
                  number={3}
                  title="新增/编辑物体校验"
                  rules={[
                    "物体中文名称、物体类型、所属场景为必填字段。",
                    "新增或编辑保存时，唯一英文名称在系统全局不能重复，若重复需要抛出错误校验提示。",
                    "编辑模式下需自动回显所有的描述属性和已上传的封面图片。"
                  ]}
                  remark="保存后列表应无刷新局部更新数据，重新加载分类缓存。"
                >
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => {
                      setEditingObj(null);
                      setImageUrl(null);
                      objectForm.resetFields();
                      setObjectModalVisible(true);
                    }}
                  >
                    新增物体
                  </Button>
                </SpecMarker>,

                <SpecMarker
                  key="delete"
                  id="objects-delete"
                  number={5}
                  title="批量删除与引用防错"
                  rules={[
                    "批量删除按钮仅在表格有选中行（selectedRowKeys.length > 0）时激活。",
                    "点击删除触发二次确认模态窗，内容应包含具体选中的项个数。",
                    "物理限制：如该物体正在被任何‘数据采集任务书’或‘未归档的 Episode 轨迹包’所引用，应强拦截并报错，禁止删除。"
                  ]}
                  remark="删除操作需保留确认弹窗。拦截检测通常通过后端 API 切面完成。"
                >
                  <Button
                    danger
                    icon={<DeleteOutlined />}
                    disabled={selectedRowKeys.length === 0}
                    onClick={() => Modal.confirm({
                      title: '确定批量删除？',
                      content: `您已选中了 ${selectedRowKeys.length} 个物体，此操作不可恢复，是否继续？`,
                      okText: '确定',
                      okType: 'danger',
                      cancelText: '取消',
                      onOk: () => {
                        setObjects(prev => prev.filter(o => !selectedRowKeys.includes(o.key)));
                        setSelectedRowKeys([]);
                        message.success('批量删除成功');
                      }
                    })}
                  >
                    批量删除
                  </Button>
                </SpecMarker>,

                <Button key="reset" icon={<ReloadOutlined />} onClick={() => setObjects(mockObjects)}>重置列表数据</Button>,
              ]}
            />

            <div style={{ flex: 1, overflow: 'hidden' }}>
              {filtered.length === 0
                ? <Empty description="该分类下暂无物体数据" style={{ paddingTop: 80 }} />
                : <Table
                  rowSelection={{
                    type: 'checkbox',
                    selectedRowKeys,
                    onChange: (keys) => setSelectedRowKeys(keys),
                  }}
                  columns={columns}
                  dataSource={filtered}
                  scroll={{ x: 1000, y: 'calc(100vh - 460px)' }}
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
      </div>

      <AppModal title="添加物体类型" open={typeModalVisible} onOk={handleAddType} onCancel={() => setTypeModalVisible(false)} widthSize="small">
        <Form form={typeForm} layout="vertical">
          <Form.Item label="名称" name="name" rules={[{ required: true, message: '请输入名称' }]}>
            <Input placeholder="请输入名称" maxLength={50} showCount />
          </Form.Item>
          <Form.Item label={<span>英文名称&nbsp;<Tooltip title="英文标识"><QuestionCircleOutlined style={{ color: '#8c8c8c' }} /></Tooltip></span>} name="enName">
            <Input placeholder="请输入英文名称" maxLength={50} showCount />
          </Form.Item>
        </Form>
      </AppModal>

      <AppModal
        title={editingObj ? "编辑物体" : "添加物体"}
        open={objectModalVisible}
        onOk={handleSubmitObject}
        onCancel={handleCancelObject}
        widthSize="medium"
      >
        <Form form={objectForm} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="名称" name="nameCn" rules={[{ required: true, message: '请输入名称' }]}>
                <Input placeholder="请输入名称" maxLength={50} showCount />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label={<span>英文名称&nbsp;<Tooltip title="英文名称说明"><QuestionCircleOutlined style={{ color: '#8c8c8c' }} /></Tooltip></span>} name="nameEn">
                <Input placeholder="请输入英文名称" maxLength={50} showCount />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="物体类型" name="objType" rules={[{ required: true, message: '请选择物体类型' }]}>
                <Select placeholder="请选择物体类型" options={[
                  { value: 'RigidBody', label: 'RigidBody(刚体)' },
                  { value: 'Articulated', label: 'Articulated(铰接可动)' },
                  { value: 'Deformable', label: 'Deformable(可变形)' },
                ]} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="场景" name="scene" rules={[{ required: true, message: '请选择场景' }]}>
                <Select placeholder="请选择场景" options={[
                  { value: 'Supermarket', label: 'Supermarket(商超)' },
                  { value: 'Industry', label: 'Industry(工业)' },
                  { value: 'Kitchen', label: 'Kitchen(厨房)' },
                  { value: 'Hotel', label: 'Hotel(酒店)' },
                  { value: 'Scientific', label: 'Scientific(科研)' },
                  { value: 'Shelf', label: 'Shelf(货架)' },
                  { value: 'Container', label: 'Container(容器)' },
                  { value: 'pharmacy', label: 'pharmacy(药房)' },
                  { value: 'Warehousing', label: 'Warehousing(仓储)' },
                  { value: 'Region', label: 'Region(区域)' },
                ]} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="材质特性" name="material">
                <Select placeholder="请选择材质特性" options={[
                  { value: 'Metal', label: '金属 (Metal)' },
                  { value: 'Ceramic', label: '陶瓷 (Ceramic)' },
                  { value: 'Plastic', label: '塑料 (Plastic)' },
                  { value: 'Wood', label: '木质 (Wood)' },
                  { value: 'Smooth', label: '光滑 (Smooth)' },
                ]} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="物体图片" name="image">
            <Upload
              listType="picture-card"
              maxCount={1}
              showUploadList={false}
              beforeUpload={beforeUpload}
            >
              {imageUrl ? (
                <div className="thumb-preview-container-upload">
                  <img src={imageUrl} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }} />
                  <div
                    className="thumb-preview-mask-upload"
                    onClick={(e) => { e.stopPropagation(); setImageUrl(null); }}
                  >
                    删除图片
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <PlusOutlined style={{ fontSize: 24, color: '#8c8c8c' }} />
                  <div style={{ marginTop: 8 }}>上传</div>
                </div>
              )}
            </Upload>
            <div style={{ fontSize: 13, color: '#bfbfbf', marginTop: 8 }}>
              支持jpg、jpeg、png、gif格式，文件大小不超过2MB
            </div>
          </Form.Item>
        </Form>
      </AppModal>

      <AppModal title="物体详情" open={detailOpen} onCancel={() => setDetailOpen(false)} footer={null} widthSize="medium">
        {selectedObj && (
          <>
            <Descriptions bordered size="small" column={2} style={{ marginTop: 16 }}>
              <Descriptions.Item label="名称">{selectedObj.name}</Descriptions.Item>
              <Descriptions.Item label="英文名称">{selectedObj.enName}</Descriptions.Item>
              <Descriptions.Item label="物体类型">{selectedObj.objType || '—'}</Descriptions.Item>
              <Descriptions.Item label="场景">{selectedObj.scene}</Descriptions.Item>
              <Descriptions.Item label="材质特性">{selectedObj.material || '—'}</Descriptions.Item>
              <Descriptions.Item label="创建人">{selectedObj.creator}</Descriptions.Item>
              <Descriptions.Item label="更新人">{selectedObj.updater}</Descriptions.Item>
              <Descriptions.Item label="创建时间">{selectedObj.createTime}</Descriptions.Item>
            </Descriptions>
            <div style={{ marginTop: 16 }}>
              <Text strong style={{ display: 'block', marginBottom: 8 }}>物体图片</Text>
              {(selectedObj.img && !brokenImages[selectedObj.key]) ? (
                <div
                  className="thumb-preview-container-detail"
                  onClick={() => setPreviewImage(selectedObj.img)}
                >
                  <img
                    src={selectedObj.img}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={() => setBrokenImages(prev => ({ ...prev, [selectedObj.key]: true }))}
                  />
                  <div className="thumb-preview-mask-detail">
                    <EyeOutlined style={{ fontSize: 20 }} />
                  </div>
                </div>
              ) : (
                <div style={{
                  width: 120,
                  height: 120,
                  background: 'linear-gradient(135deg, #eff6ff 0%, #e0e7ff 100%)',
                  borderRadius: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid #dbeafe',
                  boxShadow: '0 4px 12px rgba(79, 70, 229, 0.08)',
                  gap: 8
                }}>
                  <PictureOutlined style={{ fontSize: 32, color: '#4f46e5', opacity: 0.8 }} />
                  <span style={{ fontSize: 11, fontWeight: 500, color: '#4f46e5', opacity: 0.8 }}>暂无图片</span>
                </div>
              )}
            </div>
          </>
        )}
      </AppModal>

      {/* 图片放大预览弹框 */}
      <AppModal
        open={!!previewImage}
        footer={null}
        onCancel={() => setPreviewImage(null)}
        styles={{ body: { padding: 0 } }}
        widthSize="medium"
        destroyOnHidden
      >
        <div style={{ position: 'relative', width: '100%', borderRadius: 8, overflow: 'hidden' }}>
          <img src={previewImage} alt="preview" style={{ width: '100%', height: 'auto', display: 'block' }} />
        </div>
      </AppModal>

      </div>
    </MainLayout>
  );
}

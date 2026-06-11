'use client';

import React, { useState } from 'react';
import { Typography, Breadcrumb, Button, Input, App, Tooltip, Modal, Form, Select, InputNumber, Radio, Row, Col, Space } from 'antd';
import { PlusOutlined, CloseOutlined, InfoCircleOutlined, SearchOutlined, EditOutlined, DeleteOutlined, ReloadOutlined } from '@ant-design/icons';
import MainLayout from '@/components/MainLayout';
import SpecMarker from '@/components/SpecMarker';

const { Text, Title } = Typography;

const initialCategories = [
  { type: 'section', label: '物体信息' },
  { key: 'obj_type', label: '物体类型', subLabel: 'TAG CATEGORY: 物体类型', group: 'obj_info' },
  { key: 'scene', label: '适用场景', subLabel: 'TAG CATEGORY: 场景分组', group: 'obj_info' },
  { key: 'asset', label: '资产标签', subLabel: 'TAG CATEGORY: 资产归属', group: 'obj_info' },
  { type: 'section', label: '视觉感知特性' },
  { key: 'color', label: '颜色特性', subLabel: 'TAG CATEGORY: 颜色特性', group: 'visual_attr' },
  { key: 'optical', label: '光学特性', subLabel: 'TAG CATEGORY: 光学特性', group: 'visual_attr' },
  { key: 'material', label: '材质特性', subLabel: 'TAG CATEGORY: 材质特性', group: 'visual_attr' },
  { type: 'section', label: '物理几何特性' },
  { key: 'shape', label: '形状特性', subLabel: 'TAG CATEGORY: 形状特性', group: 'physical_attr' },
  { key: 'morphology', label: '形态特性', subLabel: 'TAG CATEGORY: 形态特性', group: 'physical_attr' },
  { type: 'section', label: '动态行为特性' },
  { key: 'motion', label: '运动特性', subLabel: 'TAG CATEGORY: 运动特性', group: 'motion_attr' },
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
  const [categories, setCategories] = useState(initialCategories);
  const [tagsMap, setTagsMap] = useState(initialTagsMap);
  const [adding, setAdding] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');

  // Category Modal state
  const [createCatOpen, setCreateCatOpen] = useState(false);
  const [createCatForm] = Form.useForm();
  const [editingCatKey, setEditingCatKey] = useState(null);
  const [hoveredCat, setHoveredCat] = useState(null);

  const currentTags = tagsMap[selected] || [];
  const total = Object.values(tagsMap).reduce((s, arr) => s + arr.length, 0);

  const handleCreateCategory = () => {
    createCatForm.validateFields().then(values => {
      const newKey = values.identifier || `custom_${Date.now()}`;
      const newCat = {
        key: newKey,
        label: values.name,
        enName: values.enName,
        subLabel: `TAG CATEGORY: ${values.name}`,
        group: values.group,
        multiLevel: values.multiLevel === 'yes',
        sortOrder: values.sortOrder,
        desc: values.desc,
      };

      if (editingCatKey) {
        setCategories(prev => prev.map(c => c.key === editingCatKey ? { ...c, ...newCat, key: editingCatKey } : c));
        message.success('分类修改成功');
      } else {
        setCategories(prev => [...prev, newCat]);
        setTagsMap(prev => ({ ...prev, [newKey]: [] }));
        setSelected(newKey);
        message.success('分类创建成功');
      }
      
      createCatForm.resetFields();
      setCreateCatOpen(false);
      setEditingCatKey(null);
    });
  };

  const handleEditCategory = (cat, e) => {
    e.stopPropagation();
    setEditingCatKey(cat.key);
    createCatForm.setFieldsValue({
      name: cat.label,
      enName: cat.enName || '',
      identifier: cat.key,
      multiLevel: cat.multiLevel ? 'yes' : 'no',
      sortOrder: cat.sortOrder || 0,
      group: cat.group || '',
      desc: cat.desc || '',
    });
    setCreateCatOpen(true);
  };

  const handleDeleteCategory = (catKey, e) => {
    e.stopPropagation();
    setCategories(prev => prev.filter(c => c.key !== catKey));
    if (selected === catKey) setSelected('obj_type');
    message.success('分类已删除');
  };

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
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <SpecMarker
                id="objlabels-cat-create"
                number={1}
                title="新增标签分类"
                rules={[
                  "点击 '+' 按钮弹出创建标签分类弹窗。",
                  "表单字段包含：所属分组、分类名称、英文名称、唯一标识、可添加多级、排序值、描述。",
                  "所属分组、分类名称、英文名称、唯一标识均为必填项。"
                ]}
                remark="分类所属分组目前分为：物体信息、视觉感知特性、物理几何特性和动态行为特性四大板块。"
              >
                <Button
                  type="text"
                  icon={<PlusOutlined />}
                  size="small"
                  onClick={() => { setEditingCatKey(null); createCatForm.resetFields(); setCreateCatOpen(true); }}
                  style={{ color: '#1890ff', padding: '0 4px' }}
                  title="创建分类"
                />
              </SpecMarker>
              <SearchOutlined style={{ color: '#bfbfbf', cursor: 'pointer' }} />
            </div>
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
                <div 
                  key={item.key} 
                  onClick={() => setSelected(item.key)}
                  onMouseEnter={() => setHoveredCat(item.key)}
                  onMouseLeave={() => setHoveredCat(null)}
                  style={{ 
                    padding: '8px 10px', 
                    borderRadius: 8, 
                    cursor: 'pointer', 
                    background: isSelected ? '#1890ff' : 'transparent', 
                    color: isSelected ? '#fff' : '#262626', 
                    transition: 'all 0.2s' 
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: isSelected ? 600 : 400, fontSize: 13, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.label}
                    </span>
                    {hoveredCat === item.key && (
                      <div style={{ display: 'flex', gap: 0, flexShrink: 0, marginLeft: 4 }} onClick={e => e.stopPropagation()}>
                        <Button
                          type="text" size="small"
                          icon={<EditOutlined style={{ fontSize: 11 }} />}
                          onClick={(e) => handleEditCategory(item, e)}
                          style={{ color: isSelected ? 'rgba(255,255,255,0.9)' : '#595959', padding: '0 3px', height: 20, minWidth: 0 }}
                        />
                        <Button
                          type="text" size="small"
                          icon={<DeleteOutlined style={{ fontSize: 11 }} />}
                          onClick={(e) => handleDeleteCategory(item.key, e)}
                          style={{ color: isSelected ? 'rgba(255,255,255,0.9)' : '#ff4d4f', padding: '0 3px', height: 20, minWidth: 0 }}
                        />
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize: 10, color: isSelected ? 'rgba(255,255,255,0.6)' : '#bfbfbf', marginTop: 2, fontFamily: 'monospace' }}>{item.subLabel}</div>
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
                  <SpecMarker
                    id="objlabels-tag-count"
                    number={4}
                    title="标签引用数统计"
                    rules={[
                      "角标数字表示当前物体库中引用并打上了此标签的物理物体记录总数。",
                      "例如：已在‘物体库’给 45 个物体打上了‘刚体’属性，该数字显示 45。",
                      "点击此标签会展示或过滤出关联引用的具体物体。"
                    ]}
                    remark="系统在进行物体重构与动作识别数据清洗时，该参数作为过滤主索引。"
                  >
                    <span style={{ background: '#ff4d4f', color: '#fff', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 600, flexShrink: 0 }}>{tag.count}</span>
                  </SpecMarker>
                )}
                <CloseOutlined onClick={() => removeTag(tag.id)} style={{ fontSize: 10, color: '#ff7875', cursor: 'pointer', marginLeft: 2 }} />
              </div>
            ))}

            {adding ? (
              <Input autoFocus size="small" value={newTagInput} onChange={e => setNewTagInput(e.target.value)} onPressEnter={addTag} onBlur={addTag} style={{ width: 140, borderRadius: 20 }} placeholder="输入标签名称" />
            ) : (
              <SpecMarker
                id="objlabels-tag-create"
                number={3}
                title="添加标签"
                rules={[
                  "点击‘添加标签’后输入标签名称。",
                  "支持按回车键或输入框失去焦点时保存提交。",
                  "新标签会计入当前分类下的 tagsMap 并重新加载渲染组件。"
                ]}
                remark="自动校验空输入，标签名支持中英文及英文下划线组合。"
              >
                <Button type="dashed" size="small" icon={<PlusOutlined />} onClick={() => setAdding(true)} style={{ borderRadius: 20, color: '#8c8c8c', borderColor: '#d9d9d9' }}>添加标签</Button>
              </SpecMarker>
            )}
          </div>
        </div>
      </div>

      {/* Create Category Modal */}
      <Modal
        title={editingCatKey ? "编辑分类" : "创建分类"}
        open={createCatOpen}
        onOk={handleCreateCategory}
        onCancel={() => { setCreateCatOpen(false); createCatForm.resetFields(); setEditingCatKey(null); }}
        okText="确定"
        cancelText="取消"
        width={520}
        centered
      >
        <Form
          form={createCatForm}
          layout="vertical"
          style={{ marginTop: 16 }}
          initialValues={{ multiLevel: 'no', sortOrder: 0 }}
        >
          <Form.Item label="所属分组" name="group" required rules={[{ required: true, message: '请选择分组' }]}>
            <Select placeholder="请选择所属分组" options={[
              { value: 'obj_info', label: '物体信息' },
              { value: 'visual_attr', label: '视觉感知特性' },
              { value: 'physical_attr', label: '物理几何特性' },
              { value: 'motion_attr', label: '动态行为特性' },
            ]} />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="分类名称" name="name" required rules={[{ required: true, message: '请输入分类名称' }]}>
                <Input placeholder="请输入分类名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="英文名称" name="enName" required rules={[{ required: true, message: '请输入英文名称' }]}>
                <Input placeholder="请输入英文名称" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="唯一标识" name="identifier" required rules={[{ required: true, message: '请输入唯一标识' }]}>
            <SpecMarker
              id="objlabels-cat-identifier"
              number={2}
              title="唯一标识校验"
              rules={[
                "唯一标识在数据库中用于关联具体的物理资产（如物体的长宽高、颜色、反光度）。",
                "标识必须为小写字母及下划线，不可重名。",
                "处于编辑状态时该字段只读，禁止任何物理编辑修改。"
              ]}
              remark="关联底层三维空间物体感知算法的特征向量归一化接口字段。"
            >
              <Input placeholder="请输入唯一标识，如 object_tag" disabled={!!editingCatKey} />
            </SpecMarker>
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="可添加多级" name="multiLevel" required>
                <Radio.Group>
                  <Radio.Button value="no">否</Radio.Button>
                  <Radio.Button value="yes">是</Radio.Button>
                </Radio.Group>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="排序值" name="sortOrder" required>
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="分类描述" name="desc">
            <Input.TextArea placeholder="请输入描述" rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </MainLayout>
  );
}

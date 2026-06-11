'use client';

import React, { useState } from 'react';
import { Typography, Breadcrumb, Button, Input, App, Tooltip, Modal, Form, Select, InputNumber, Radio, Row, Col, Space } from 'antd';
import { PlusOutlined, CloseOutlined, InfoCircleOutlined, SearchOutlined, EditOutlined, DeleteOutlined, ReloadOutlined } from '@ant-design/icons';
import MainLayout from '@/components/MainLayout';
import SpecMarker from '@/components/SpecMarker';

const { Text, Title } = Typography;

const initialCategories = [
  { type: 'section', label: '项目身份' },
  { key: 'project_name', label: '项目名称', subLabel: 'TAG CATEGORY: 项目名称', group: 'project_identity' },
  { type: 'section', label: '项目属性' },
  { key: 'task_purpose', label: '任务用途', subLabel: 'TAG CATEGORY: 任务用途', group: 'project_attr' },
  { key: 'taskbook_type', label: '任务书类别', subLabel: 'TAG CATEGORY: 任务书类别', group: 'project_attr' },
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
  const [categories, setCategories] = useState(initialCategories);
  const [tagsMap, setTagsMap] = useState(initialTagsMap);
  const [subTagsMap, setSubTagsMap] = useState(initialSubTagsMap);
  const [adding, setAdding] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');
  const [subModal, setSubModal] = useState({ open: false, parentTag: null });
  const [addingSub, setAddingSub] = useState(false);
  const [newSubInput, setNewSubInput] = useState('');

  // Category Modal state
  const [createCatOpen, setCreateCatOpen] = useState(false);
  const [createCatForm] = Form.useForm();
  const [editingCatKey, setEditingCatKey] = useState(null);
  const [hoveredCat, setHoveredCat] = useState(null);

  const currentTags = tagsMap[selected] || [];
  const total = Object.values(tagsMap).reduce((s, arr) => s + arr.length, 0);
  const currentSubTags = subModal.parentTag ? (subTagsMap[subModal.parentTag.id] || []) : [];

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
    if (selected === catKey) setSelected('project_name');
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <SpecMarker 
                id="projects-create" 
                number={3} 
                title="新增分类/项目" 
                rules={[
                  "从列表或工具栏的 '+' 按钮进入新增/创建入口。",
                  "表单字段与需求描述一致：所属分组、分类名称、英文名称、唯一标识均需输入。",
                  "校验逻辑：唯一标识在前端及后端均需要进行重复校验，防止冲突。"
                ]}
                remark="复用分类维护表单结构，提交时对唯一性标识做数据库排重校验。"
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
              
              <SpecMarker 
                id="projects-query" 
                number={1} 
                title="分类查询筛选" 
                rules={[
                  "支持按分类名称、英文标识等条件对基础数据分类进行模糊搜索。",
                  "页面显示全部筛选字段，默认包含占位符提示，且各输入框均具备可一键清空状态。"
                ]}
                remark="对应表格任务的‘查询筛选’节点，接当前原型项目管理页进行搜索条件整理。"
              >
                <SearchOutlined style={{ color: '#bfbfbf', cursor: 'pointer' }} />
              </SpecMarker>
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
                      <div style={{ display: 'flex', gap: 4, flexShrink: 0, marginLeft: 4 }} onClick={e => e.stopPropagation()}>
                        <SpecMarker 
                          id="projects-edit" 
                          number={4} 
                          title="编辑分类/项目" 
                          rules={[
                            "支持从项目列表/分类项悬浮的编辑入口进入编辑。",
                            "编辑弹窗中，需回显已有的项目/分类数据（所属分组、分类名称、英文名称、唯一标识、是否多级、描述等）。",
                            "唯一标识在编辑状态下为只读/禁用（disabled），不允许修改，以防止破坏已有数据的关联引用。"
                          ]}
                          remark="注意唯一标识在编辑模式下为禁用输入状态。更新后同步刷新分类树。"
                        >
                          <Button
                            type="text" size="small"
                            icon={<EditOutlined style={{ fontSize: 11 }} />}
                            onClick={(e) => handleEditCategory(item, e)}
                            style={{ color: isSelected ? 'rgba(255,255,255,0.9)' : '#595959', padding: '0 3px', height: 20, minWidth: 0 }}
                          />
                        </SpecMarker>
                        
                        <SpecMarker 
                          id="projects-delete" 
                          number={5} 
                          title="删除分类/项目" 
                          rules={[
                            "支持单条删除项目分类，删除操作触发前必须进行‘二次确认弹窗’。",
                            "引用校验拦截：需校验该分类下是否已绑定/引用了任何数据采集任务、物体、或采集标签项。",
                            "如果已被引用，二次确认弹窗需呈现阻断状态（或直接拦截），不允许删除并给出清晰的报错提示；如果未被引用，方可删除。"
                          ]}
                          remark="删除操作需保留确认弹窗。必须先检测关联引用数据，若存在引用则拦截删除动作。"
                        >
                          <Button
                            type="text" size="small"
                            icon={<DeleteOutlined style={{ fontSize: 11 }} />}
                            onClick={(e) => handleDeleteCategory(item.key, e)}
                            style={{ color: isSelected ? 'rgba(255,255,255,0.9)' : '#ff4d4f', padding: '0 3px', height: 20, minWidth: 0 }}
                          />
                        </SpecMarker>
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
              <SpecMarker
                id="projects-list"
                number={2}
                title="自定义标签与列表展示"
                rules={[
                  "列表/卡片形式展示当前分类下的全部自定义标签核心字段（名称、英文标识、关联数、描述）。",
                  "字段排版布局：英文名称加粗，括号包裹中文描述，右侧红色徽标数字显示下属的二级标签个数。",
                  "二级管理联动：点击红色计数徽标，唤起‘二级标签管理’弹窗。",
                  "空值与溢出：若标签描述为空，隐藏括号；长文本时自动换行，不导致标签容器变形。"
                ]}
                remark="列表展示需要与左侧分类高亮状态联动。以原型页面及基础数据管理逻辑为准。"
              >
                <Text strong style={{ fontSize: 15 }}>自定义标签</Text>
              </SpecMarker>
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
              { value: 'project_identity', label: '项目身份' },
              { value: 'project_attr', label: '项目属性' },
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
            <Input placeholder="请输入唯一标识，如 project_tag" disabled={!!editingCatKey} />
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

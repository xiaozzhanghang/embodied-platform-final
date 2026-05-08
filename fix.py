import re

with open('/Users/zhangxiaozhang/Desktop/具身智能平台原型/prototype/src/app/collection/objects/page.js', 'r') as f:
    content = f.read()

good_content = """            <Button icon={<ReloadOutlined />} onClick={() => { setNameFilter(''); setMaterialFilter(''); }}>重置</Button>
            <Button type="primary" icon={<PlusOutlined />} style={{ marginLeft: 'auto' }} onClick={() => setObjectModalVisible(true)}>+ 添加</Button>
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

      <Modal title="添加物体类型" open={typeModalVisible} onOk={handleAddType} onCancel={() => setTypeModalVisible(false)}>
        <Form form={typeForm} layout="horizontal" labelCol={{ span: 5 }} wrapperCol={{ span: 19 }}>
          <Form.Item label="名称" name="name" rules={[{ required: true, message: '请输入名称' }]}>
            <Input placeholder="请输入名称" maxLength={50} showCount />
          </Form.Item>
          <Form.Item label={<span>英文名称&nbsp;<Tooltip title="英文标识"><QuestionCircleOutlined style={{ color: '#8c8c8c' }} /></Tooltip></span>} name="enName">
            <Input placeholder="请输入英文名称" maxLength={50} showCount />
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="添加物体" open={objectModalVisible} onOk={handleAddObject} onCancel={() => setObjectModalVisible(false)} width={560}>
        <Form form={objectForm} layout="horizontal" labelCol={{ span: 5 }} wrapperCol={{ span: 19 }}>
          <Form.Item label="名称" name="nameCn" rules={[{ required: true, message: '请输入名称' }]}>
            <Input placeholder="请输入名称" maxLength={50} showCount />
          </Form.Item>
          <Form.Item label={<span>英文名称&nbsp;<Tooltip title="英文名称说明"><QuestionCircleOutlined style={{ color: '#8c8c8c' }} /></Tooltip></span>} name="nameEn">
            <Input placeholder="请输入英文名称" maxLength={50} showCount />
          </Form.Item>
          <Form.Item label="物体类型" name="objType" rules={[{ required: true, message: '请选择物体类型' }]}>
            <Select placeholder="请选择物体类型" options={[
              { value: 'RigidBody', label: 'RigidBody(刚体)' },
              { value: 'Articulated', label: 'Articulated(铰接可动)' },
              { value: 'Deformable', label: 'Deformable(可变形)' },
            ]} />
          </Form.Item>
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
          <Form.Item label="材质特性" name="material">
            <Select placeholder="请选择材质特性" options={[
              { value: 'Metal', label: '金属 (Metal)' },
              { value: 'Ceramic', label: '陶瓷 (Ceramic)' },
              { value: 'Plastic', label: '塑料 (Plastic)' },
              { value: 'Wood', label: '木质 (Wood)' },
              { value: 'Smooth', label: '光滑 (Smooth)' },
            ]} />
          </Form.Item>
          <Form.Item label="物体图片" name="image">
            <Upload listType="picture-card" maxCount={1} showUploadList={false}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', width: '100%' }}>
                <PlusOutlined style={{ fontSize: 24, color: '#8c8c8c' }} />
              </div>
            </Upload>
            <div style={{ fontSize: 13, color: '#bfbfbf', marginTop: 8 }}>
              支持jpg、jpeg、png、gif格式，文件大小不超过2MB
            </div>
          </Form.Item>
        </Form>
      </Modal>"""

bad_start = '            <Button icon      <Modal title="添加物体类型" open={typeModalVisible}'
bad_end = '      </Modal>'

start_idx = content.find(bad_start)
end_idx = content.find(bad_end, start_idx) + len(bad_end)

if start_idx != -1 and end_idx != -1:
    new_content = content[:start_idx] + good_content + content[end_idx:]
    with open('/Users/zhangxiaozhang/Desktop/具身智能平台原型/prototype/src/app/collection/objects/page.js', 'w') as f:
        f.write(new_content)
    print("Fixed!")
else:
    print("Could not find the bad section.")


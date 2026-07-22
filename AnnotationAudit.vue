<template>
  <!-- 标注审核模块主容器。如果您的项目有全局 Layout，可以用您的 Layout 组件包裹此处 -->
  <div class="annotation-audit-container" style="padding: 24px; background: #f8fafc; min-height: 100vh;">
    
    <!-- 面包屑导航 -->
    <div style="margin-bottom: 16px;">
      <a-breadcrumb>
        <a-breadcrumb-item>数据采集</a-breadcrumb-item>
        <a-breadcrumb-item>标注审核</a-breadcrumb-item>
      </a-breadcrumb>
    </div>

    <!-- 筛选栏 -->
    <a-card
      style="margin-bottom: 16px; border-radius: 8px; background: #fafafa; border: 1px solid #f0f0f0"
      :body-style="{ padding: '24px 24px 16px' }"
    >
      <a-form layout="vertical">
        <a-row :gutter="16">
          <a-col :xs="24" :sm="12" :md="8" :lg="6">
            <a-form-item label="一级项目">
              <a-select v-model:value="filterForm.project" placeholder="请选择" allow-clear>
                <a-select-option v-for="n in projectNames" :key="n" :value="n">{{ n }}</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          
          <a-col :xs="24" :sm="12" :md="8" :lg="6">
            <a-form-item label="任务书">
              <a-select v-model:value="filterForm.taskbook" placeholder="请选择" allow-clear>
                <a-select-option v-for="t in taskbooks" :key="t" :value="t">{{ t }}</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          
          <a-col :xs="24" :sm="12" :md="8" :lg="6">
            <a-form-item label="任务名称">
              <a-input v-model:value="filterForm.name" placeholder="请输入" allow-clear />
            </a-form-item>
          </a-col>
          
          <!-- 收起状态下的操作按钮 -->
          <a-col :xs="24" :sm="12" :md="8" :lg="6" v-if="!isExpanded" class="filter-actions-inline">
            <a-space>
              <a-button type="primary" @click="handleSearch">
                <template #icon><SearchOutlined /></template>查询
              </a-button>
              <a-button @click="handleReset">
                <template #icon><ReloadOutlined /></template>重置
              </a-button>
              <a-button type="link" @click="isExpanded = true">
                展开 <template #icon><DownOutlined /></template>
              </a-button>
            </a-space>
          </a-col>

          <!-- 展开状态下展示的额外筛选项 -->
          <template v-if="isExpanded">
            <a-col :xs="24" :sm="12" :md="8" :lg="6">
              <a-form-item label="任务ID/实例ID">
                <a-input v-model:value="filterForm.taskId" placeholder="请输入" allow-clear />
              </a-form-item>
            </a-col>
            <a-col :xs="24" :sm="12" :md="8" :lg="6">
              <a-form-item label="标注类型">
                <a-select v-model:value="filterForm.annoType" placeholder="请选择" allow-clear>
                  <a-select-option v-for="t in ANNO_TYPES" :key="t" :value="t">{{ t }}</a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
            <a-col :xs="24" :sm="12" :md="8" :lg="6">
              <a-form-item label="任务状态">
                <a-select v-model:value="filterForm.taskStatus" placeholder="请选择" allow-clear>
                  <a-select-option v-for="s in TASK_STATUSES" :key="s" :value="s">{{ s }}</a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
            <a-col :xs="24" :sm="12" :md="8" :lg="6">
              <a-form-item label="标注员">
                <a-select v-model:value="filterForm.annotator" placeholder="请选择" allow-clear>
                  <a-select-option v-for="p in people" :key="p" :value="p">{{ p }}</a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
            <a-col :xs="24" :sm="12" :md="8" :lg="6">
              <a-form-item label="审核员">
                <a-select v-model:value="filterForm.auditor" placeholder="请选择" allow-clear>
                  <a-select-option v-for="p in people" :key="p" :value="p">{{ p }}</a-select-option>
                </a-select>
              </a-form-item>
            </a-col>

            <!-- 展开状态下的操作按钮（独占一行，靠右对齐） -->
            <a-col :span="24" class="filter-actions-block">
              <a-space>
                <a-button type="primary" @click="handleSearch">
                  <template #icon><SearchOutlined /></template>查询
                </a-button>
                <a-button @click="handleReset">
                  <template #icon><ReloadOutlined /></template>重置
                </a-button>
                <a-button type="link" @click="isExpanded = false">
                  收起 <template #icon><UpOutlined /></template>
                </a-button>
              </a-space>
            </a-col>
          </template>
        </a-row>
      </a-form>
    </a-card>

    <!-- 数据表格模块 -->
    <a-card style="border-radius: 4px;" :body-style="{ padding: 0 }">
      
      <!-- 表头及工具栏 -->
      <div style="padding: 16px 24px; border-bottom: 1px solid #f0f0f0; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
        <a-space>
          <span style="font-weight: 600; font-size: 15px; color: #1f1f1f;">审核任务列表</span>
          <a-tag color="blue">{{ filteredData.length }} 条记录</a-tag>
        </a-space>
        
        <a-space>
          <a-button type="primary" style="font-weight: bold;" @click="handleCreateTask">
            <template #icon><PlusOutlined /></template>新建标注任务
          </a-button>
          <a-button :disabled="selectedRowKeys.length === 0" @click="handleBatchAssign">
            <template #icon><UserOutlined /></template>批量分配 {{ selectedRowKeys.length > 0 ? `(${selectedRowKeys.length})` : '' }}
          </a-button>
          <a-button @click="handleExport">
            <template #icon><DownloadOutlined /></template>导出
          </a-button>
        </a-space>
      </div>

      <!-- 表格内容 -->
      <a-table
        :row-selection="rowSelection"
        :columns="columns"
        :data-source="filteredData"
        :scroll="{ x: 3200 }"
        size="small"
        :pagination="pagination"
      >
        <template #bodyCell="{ column, record }">
          <!-- 标注ID / 任务ID / 实例ID -->
          <template v-if="column.key === 'annoId'">
            <span class="monospace-text">{{ record.annoId }}</span>
          </template>
          <template v-else-if="column.key === 'taskId'">
            <span class="monospace-text">{{ record.taskId }}</span>
          </template>
          <template v-else-if="column.key === 'instanceId'">
            <span class="monospace-text">{{ record.instanceId }}</span>
          </template>

          <!-- 数据量与时间 -->
          <template v-else-if="column.key === 'dataCount'">
            <strong>{{ record.dataCount }}</strong>
          </template>
          <template v-else-if="column.key === 'dataMinutes'">
            <span>{{ record.dataMinutes }} min</span>
          </template>

          <!-- 任务状态 -->
          <template v-else-if="column.key === 'taskStatus'">
            <a-badge :status="statusColors[record.taskStatus]" :text="record.taskStatus" />
          </template>

          <!-- 货架任务 -->
          <template v-else-if="column.key === 'isShelfTask'">
            <a-tag v-slot="v" v-if="record.isShelfTask === '是'" color="orange">是</a-tag>
            <span v-else style="color: #bfbfbf;">否</span>
          </template>

          <!-- 设备 SN -->
          <template v-else-if="column.key === 'deviceSN'">
            <span class="monospace-text">{{ record.deviceSN }}</span>
          </template>

          <!-- 质检进度 -->
          <template v-else-if="column.key === 'qaProgress'">
            <a-progress 
              :percent="record.qaProgress" 
              size="small" 
              :stroke-color="record.qaProgress === 100 ? '#52c41a' : '#1677ff'" 
              style="margin: 0;" 
            />
          </template>

          <!-- 进度数量文字 -->
          <template v-else-if="column.key === 'annoProgressBar'">
            <span class="monospace-text">{{ record.annoProgress }}/{{ record.annoTotal }}</span>
          </template>
          <template v-else-if="column.key === 'auditProgressBar'">
            <span class="monospace-text">{{ record.auditProgress }}/{{ record.auditTotal }}</span>
          </template>

          <!-- 标注类型 -->
          <template v-else-if="column.key === 'annoType'">
            <a-tag :color="annoTypeColors[record.annoType]" style="margin: 0;">{{ record.annoType }}</a-tag>
          </template>

          <!-- 操作栏 -->
          <template v-else-if="column.key === 'action'">
            <a-space size="small">
              <a-button type="link" size="small" style="padding: 0;" @click="handleReassign(record)">
                <template #icon><EditOutlined /></template>重新分配
              </a-button>
              <a-button type="link" size="small" style="padding: 0;" @click="enterTask(record)">
                <template #icon><LoginOutlined /></template进入
              </a-button>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- 重新人员分配弹窗 -->
    <a-modal
      v-model:open="reassignModalOpen"
      title="重新分配任务人员"
      ok-text="确定"
      cancel-text="取消"
      @ok="handleReassignSubmit"
    >
      <a-form layout="vertical" style="margin-top: 16px;">
        <a-form-item label="标注员" required>
          <a-select v-model:value="reassignForm.annotator" placeholder="请选择标注员">
            <a-select-option v-for="p in people" :key="p" :value="p">{{ p }}</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="审核员" required>
          <a-select v-model:value="reassignForm.auditor" placeholder="请选择审核员">
            <a-select-option v-for="p in people" :key="p" :value="p">{{ p }}</a-select-option>
          </a-select>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { message } from 'ant-design-vue';
import {
  SearchOutlined,
  ReloadOutlined,
  EditOutlined,
  LoginOutlined,
  DownloadOutlined,
  UserOutlined,
  PlusOutlined,
  DownOutlined,
  UpOutlined
} from '@ant-design/icons-vue';

// ==================== 常量定义 ====================
const ANNO_TYPES = ['框标注', '点标注', '范围标注', '范围&框标注'];
const TASK_STATUSES = ['进行中', '已完成', '待分配', '暂停'];

const projectNames = [
  'SimulatedCollection(模拟采集) sin',
  '天奇-餐盘整理任务',
  '垃圾分类抓取项目',
  'Galbot-厨房场景'
];
const taskbooks = ['TB-抓取红色方块', 'TB-餐盘整理', 'TB-垃圾分类', 'TB-物品摆放'];
const taskTypes = ['垃圾清理', '餐盘整理', '物品搬运', '工具使用'];
const people = ['张三', '李四', '王五', '赵六', '钱七', '孙八'];
const DEVICE_TYPES = ['galbot', '鹿鸣', '真机', '仿真机'];
const COLLECTION_MODES = ['UMI', 'galbot', '标准采集'];
const REMOTE_CONTROL_TYPES = ['双设备', '单设备', '遥操'];

const statusColors = {
  '进行中': 'processing',
  '已完成': 'success',
  '待分配': 'warning',
  '暂停': 'default'
};

const annoTypeColors = {
  '框标注': 'green',
  '点标注': 'blue',
  '范围标注': 'purple',
  '范围&框标注': 'magenta'
};

// ==================== 状态管理 ====================
const router = useRouter();
const isExpanded = ref(false); // 筛选框展开/收起状态
const tableData = ref([]); // 表格核心数据
const selectedRowKeys = ref([]); // 选中的行键

// 过滤表单绑定值
const initialFilters = {
  project: undefined,
  taskbook: undefined,
  name: '',
  taskId: '',
  annoType: undefined,
  taskStatus: undefined,
  annotator: undefined,
  auditor: undefined
};
const filterForm = ref({ ...initialFilters });
const activeFilters = ref({ ...initialFilters }); // 真正用于过滤的表单值

// 重新人员分配表单
const reassignModalOpen = ref(false);
const reassignRecord = ref(null);
const reassignForm = reactive({
  annotator: '',
  auditor: ''
});

// ==================== 表格列配置 ====================
const columns = [
  { title: '项目', dataIndex: 'project', key: 'project', width: 200, ellipsis: true, fixed: 'left' },
  { title: '任务书', dataIndex: 'taskbook', key: 'taskbook', width: 140, ellipsis: true },
  { title: '标注ID', dataIndex: 'annoId', key: 'annoId', width: 80, align: 'center' },
  { title: '任务ID', dataIndex: 'taskId', key: 'taskId', width: 80, align: 'center' },
  { title: '实例ID', dataIndex: 'instanceId', key: 'instanceId', width: 80, align: 'center' },
  { title: '任务名称', dataIndex: 'taskName', key: 'taskName', width: 180, ellipsis: true },
  { title: '标注任务名称', dataIndex: 'annoTaskName', key: 'annoTaskName', width: 180, ellipsis: true },
  { title: '数据量', dataIndex: 'dataCount', key: 'dataCount', width: 80, align: 'right' },
  { title: '数据量(分钟)', dataIndex: 'dataMinutes', key: 'dataMinutes', width: 110, align: 'right' },
  { title: '任务状态', dataIndex: 'taskStatus', key: 'taskStatus', width: 100, align: 'center' },
  { title: '货架任务', dataIndex: 'isShelfTask', key: 'isShelfTask', width: 90, align: 'center' },
  { title: '行列号', dataIndex: 'rowCol', key: 'rowCol', width: 80, align: 'center' },
  { title: '设备SN', dataIndex: 'deviceSN', key: 'deviceSN', width: 120, align: 'center' },
  { title: '质检员', dataIndex: 'qaer', key: 'qaer', width: 80, align: 'center' },
  { title: '标注员', dataIndex: 'annotator', key: 'annotator', width: 80, align: 'center' },
  { title: '审核员', dataIndex: 'auditor', key: 'auditor', width: 80, align: 'center' },
  { title: '采集员', dataIndex: 'collector', key: 'collector', width: 80, align: 'center' },
  { title: '质检进度', dataIndex: 'qaProgress', key: 'qaProgress', width: 110, align: 'center' },
  { title: '标注进度(数量)', dataIndex: 'annoProgressBar', key: 'annoProgressBar', width: 110, align: 'center' },
  { title: '审核进度(数量)', dataIndex: 'auditProgressBar', key: 'auditProgressBar', width: 110, align: 'center' },
  { title: '标注类型', dataIndex: 'annoType', key: 'annoType', width: 110, align: 'center' },
  { title: '任务描述', dataIndex: 'taskDesc', key: 'taskDesc', width: 160, ellipsis: true },
  { title: '创建人', dataIndex: 'creator', key: 'creator', width: 80, align: 'center' },
  { title: '创建时间', dataIndex: 'createTime', key: 'createTime', width: 160, align: 'center' },
  { title: '操作', key: 'action', width: 160, fixed: 'right', align: 'center' }
];

// ==================== 模拟数据生成器 ====================
const makeProgress = (total, type) => {
  if (type === 'full') return total;
  if (type === 'partial') return Math.floor(total * (0.3 + Math.random() * 0.5));
  if (type === 'zero') return 0;
  return Math.floor(Math.random() * total);
};

const generateMockData = () => {
  return Array.from({ length: 20 }).map((_, i) => {
    const dataCount = [186, 240, 312, 156, 420, 198, 88, 520, 164, 276][i % 10];
    const annoType = ANNO_TYPES[i % 4];
    const annoTotal = dataCount;
    const annoDone = makeProgress(annoTotal, i < 5 ? 'full' : i < 12 ? 'partial' : 'zero');
    const auditDone = makeProgress(annoDone, i < 3 ? 'partial' : 'zero');
    const taskStatus = i < 3 ? '已完成' : i < 12 ? '进行中' : i < 16 ? '待分配' : '暂停';
    const deviceType = DEVICE_TYPES[i % DEVICE_TYPES.length];
    const collectionMode = COLLECTION_MODES[i % COLLECTION_MODES.length];
    const remoteControlType = REMOTE_CONTROL_TYPES[i % REMOTE_CONTROL_TYPES.length];

    return {
      key: String(i),
      project: projectNames[i % projectNames.length],
      taskbook: taskbooks[i % taskbooks.length],
      annoId: 16822 - i,
      taskId: 21795 - Math.floor(i / 2),
      instanceId: 19884 - i,
      taskName: `${taskTypes[i % taskTypes.length]}_任务_${String(i + 1).padStart(3, '0')}`,
      taskNameEn: `Task_${taskTypes[i % taskTypes.length]}_${String(i + 1).padStart(3, '0')}`,
      annoTaskName: `${taskTypes[i % taskTypes.length]}_标注_${people[i % people.length]}`,
      dataCount,
      dataMinutes: (dataCount * 0.5 / 60).toFixed(1),
      taskStatus,
      isShelfTask: i % 3 === 0 ? '是' : '否',
      rowCol: `R${Math.floor(i / 4) + 1}C${(i % 4) + 1}`,
      deviceSN: `SN-${String(2024001 + i)}`,
      deviceType,
      collectionMode,
      remoteControlType,
      taskUsage: i % 2 === 0 ? 'OfficialCollection(正式采集)' : 'TrialCollection(试用采集)',
      sceneCategory: i % 2 === 0 ? '真实数据' : '模拟数据',
      subSceneCategory: ['UMI工业', 'UMI家居', 'UMI物流', 'UMI医疗'][i % 4],
      qaer: people[(i + 1) % people.length],
      annotator: people[i % people.length],
      auditor: people[(i + 2) % people.length],
      collector: people[(i + 3) % people.length],
      qaProgress: i < 8 ? 100 : i < 14 ? Math.floor(40 + Math.random() * 50) : 0,
      annoProgress: annoDone,
      annoTotal,
      auditProgress: auditDone,
      auditTotal: annoDone,
      annoType,
      taskDesc: `${taskTypes[i % taskTypes.length]}场景数据标注`,
      creator: people[(i + 4) % people.length],
      createTime: `2026-0${3 + (i % 4)}-${String(10 + (i % 20)).padStart(2, '0')} ${String(8 + (i % 12)).padStart(2, '0')}:${String(i * 3 % 60).padStart(2, '0')}:00`,
    };
  });
};

// ==================== 数据生命周期与过滤 ====================
onMounted(() => {
  // 从 LocalStorage 加载共享的标注任务数据，实现跨框架页面数据互通
  const saved = localStorage.getItem('embodied_anno_tasks');
  if (saved) {
    try {
      tableData.value = JSON.parse(saved);
    } catch (e) {
      console.error(e);
      tableData.value = generateMockData();
    }
  } else {
    tableData.value = generateMockData();
  }
});

// 监听数据改变同步到 LocalStorage
watch(tableData, (newVal) => {
  localStorage.setItem('embodied_anno_tasks', JSON.stringify(newVal));
}, { deep: true });

// 计算过滤后数据
const filteredData = computed(() => {
  return tableData.value.filter(item => {
    const f = activeFilters.value;
    const projectMatch = !f.project || item.project.includes(f.project);
    const taskbookMatch = !f.taskbook || item.taskbook === f.taskbook;
    const nameMatch = !f.name || item.taskName.toLowerCase().includes(f.name.toLowerCase());
    const idMatch = !f.taskId || String(item.taskId).includes(f.taskId) || String(item.instanceId).includes(f.taskId);
    const typeMatch = !f.annoType || item.annoType === f.annoType;
    const statusMatch = !f.taskStatus || item.taskStatus === f.taskStatus;
    const annotatorMatch = !f.annotator || item.annotator === f.annotator;
    const auditorMatch = !f.auditor || item.auditor === f.auditor;
    return projectMatch && taskbookMatch && nameMatch && idMatch && typeMatch && statusMatch && annotatorMatch && auditorMatch;
  });
});

// ==================== 查询与重置 ====================
const handleSearch = () => {
  activeFilters.value = { ...filterForm.value };
  pagination.current = 1;
};

const handleReset = () => {
  filterForm.value = { ...initialFilters };
  activeFilters.value = { ...initialFilters };
  pagination.current = 1;
};

// ==================== 表格行为 ====================
const rowSelection = computed(() => ({
  selectedRowKeys: selectedRowKeys.value,
  onChange: (keys) => {
    selectedRowKeys.value = keys;
  }
}));

const pagination = reactive({
  current: 1,
  pageSize: 20,
  total: computed(() => filteredData.value.length),
  showTotal: (total) => `共 ${total} 条`,
  showSizeChanger: true,
  pageSizeOptions: ['10', '20', '50', '100'],
  onChange: (page, size) => {
    pagination.current = page;
    pagination.pageSize = size;
  }
});

// ==================== 按钮与操作事件 ====================
const handleCreateTask = () => {
  if (router) {
    router.push('/annotation/audit/create');
  } else {
    window.location.href = '/annotation/audit/create';
  }
};

const enterTask = (record) => {
  if (router) {
    router.push(`/annotation/audit/${record.instanceId}`);
  } else {
    window.location.href = `/annotation/audit/${record.instanceId}`;
  }
};

const handleBatchAssign = () => {
  message.info(`已选 ${selectedRowKeys.value.length} 条数据进行批量分配`);
};

const handleExport = () => {
  message.success('数据列表正在导出，请稍后...');
};

// ==================== 分配任务弹框逻辑 ====================
const handleReassign = (record) => {
  reassignRecord.value = record;
  reassignForm.annotator = record.annotator === '待分配' ? undefined : record.annotator;
  reassignForm.auditor = record.auditor === '待分配' ? undefined : record.auditor;
  reassignModalOpen.value = true;
};

const handleReassignSubmit = () => {
  if (!reassignForm.annotator || !reassignForm.auditor) {
    message.warning('请选择标注员和审核员');
    return;
  }
  
  tableData.value = tableData.value.map(item => {
    if (item.key === reassignRecord.value.key) {
      const isPending = reassignForm.annotator === '待分配' || reassignForm.auditor === '待分配';
      return {
        ...item,
        annotator: reassignForm.annotator,
        auditor: reassignForm.auditor,
        taskStatus: isPending ? '待分配' : '进行中'
      };
    }
    return item;
  });

  message.success('人员分配成功！');
  reassignModalOpen.value = false;
};
</script>

<style scoped>
.monospace-text {
  font-family: Consolas, Monaco, monospace, sans-serif;
  font-weight: 500;
}

.filter-actions-inline {
  display: flex;
  align-items: flex-end;
  justify-content: flex-start;
  margin-bottom: 24px;
  height: 56px;
}

.filter-actions-block {
  text-align: right;
  margin-top: 8px;
  margin-bottom: 12px;
}
</style>

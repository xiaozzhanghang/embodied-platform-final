<template>
  <div class="create-project-page">
    <!-- 面包屑 -->
    <div style="margin-bottom: 24px">
      <a-breadcrumb>
        <a-breadcrumb-item>数据标注</a-breadcrumb-item>
        <a-breadcrumb-item>
          <a @click="goBack">标注项目</a>
        </a-breadcrumb-item>
        <a-breadcrumb-item>新建标注项目</a-breadcrumb-item>
      </a-breadcrumb>
    </div>

    <div style="max-width: 1100px; margin: 0 auto">
      <!-- 页面标题 -->
      <div style="display: flex; align-items: center; margin-bottom: 24px">
        <a-button type="text" @click="goBack" style="margin-right: 16px">
          <template #icon><ArrowLeftOutlined /></template>
        </a-button>
        <a-typography-title :level="4" style="margin: 0">新建标注项目</a-typography-title>
      </div>

      <!-- 步骤条 -->
      <div style="display: flex; justify-content: center; margin-bottom: 48px; padding: 0 100px">
        <a-steps :current="step" label-placement="horizontal" style="width: 100%; max-width: 800px">
          <a-step>
            <template #title>
              <span style="font-weight: 600; font-size: 16px">基本信息</span>
            </template>
          </a-step>
          <a-step>
            <template #title>
              <span style="font-weight: 600; font-size: 16px">分配人员</span>
            </template>
          </a-step>
          <a-step>
            <template #title>
              <span style="font-weight: 600; font-size: 16px">确认发布</span>
            </template>
          </a-step>
        </a-steps>
      </div>

      <!-- ==================== Step 1: 基本信息 ==================== -->
      <template v-if="step === 0">
        <a-alert
          message="请填写标注项目基本信息，选择标注类型并关联对应的采集任务"
          type="info"
          show-icon
          style="margin-bottom: 24px; border-radius: 8px"
        >
          <template #icon><InfoCircleOutlined /></template>
        </a-alert>

        <!-- 基本信息卡片 -->
        <a-card
          title="基本信息"
          :bordered="false"
          :head-style="{ background: '#fafafa', borderRadius: '8px 8px 0 0' }"
          style="margin-bottom: 24px; border-radius: 8px"
        >
          <a-row :gutter="24">
            <a-col :span="8">
              <a-form-item label="项目名称" required>
                <a-input
                  v-model:value="projectName"
                  placeholder="请输入标注项目名称"
                />
              </a-form-item>
            </a-col>
            <a-col :span="8">
              <a-form-item label="关联采集任务" required>
                <a-select
                  v-model:value="linkedTask"
                  placeholder="请选择采集任务"
                  :options="taskOptions"
                />
              </a-form-item>
            </a-col>
            <a-col :span="8">
              <a-form-item label="项目描述">
                <a-input placeholder="请输入项目描述（可选）" />
              </a-form-item>
            </a-col>
          </a-row>
        </a-card>

        <!-- 标注类型卡片 -->
        <a-card
          title="标注类型"
          :bordered="false"
          :head-style="{ background: '#fafafa', borderRadius: '8px 8px 0 0' }"
          style="margin-bottom: 24px; border-radius: 8px"
        >
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px">
            <div
              v-for="type in ANNOTATION_TYPES"
              :key="type.value"
              @click="annoType = type.value"
              :style="{
                padding: '16px',
                borderRadius: '8px',
                border: `2px solid ${annoType === type.value ? '#1677ff' : '#f0f0f0'}`,
                background: annoType === type.value ? '#e6f4ff' : '#fff',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }"
            >
              <div style="margin-bottom: 8px">
                <a-tag :color="type.color">{{ type.label }}</a-tag>
                <CheckCircleOutlined
                  v-if="annoType === type.value"
                  style="color: #1677ff; float: right"
                />
              </div>
              <a-typography-text type="secondary" style="font-size: 12px">
                {{ type.desc }}
              </a-typography-text>
            </div>
          </div>
        </a-card>

        <!-- 下一步按钮 -->
        <div style="display: flex; justify-content: flex-end; margin-top: 32px">
          <a-button
            type="primary"
            size="large"
            style="width: 160px"
            :disabled="!canNext"
            @click="step = 1"
          >
            下一步
          </a-button>
        </div>
      </template>

      <!-- ==================== Step 2: 分配人员 ==================== -->
      <template v-if="step === 1">
        <a-alert
          message="请分配标注员与审核员，系统将自动均分数据任务给标注员"
          type="info"
          show-icon
          style="margin-bottom: 24px; border-radius: 8px"
        >
          <template #icon><InfoCircleOutlined /></template>
        </a-alert>

        <!-- 标注员分配 -->
        <a-card
          title="标注员分配"
          :bordered="false"
          :head-style="{ background: '#fafafa', borderRadius: '8px 8px 0 0' }"
          style="margin-bottom: 24px; border-radius: 8px"
        >
          <a-row :gutter="24">
            <a-col :span="24">
              <a-form-item label="分配标注员" required>
                <template #extra>可分配多名标注员，任务将均分给每位标注员</template>
                <a-select
                  v-model:value="selectedAnnotators"
                  mode="multiple"
                  placeholder="请选择标注员"
                  style="width: 100%"
                  option-label-prop="label"
                >
                  <a-select-option
                    v-for="a in annotators"
                    :key="a.value"
                    :value="a.value"
                    :label="a.label"
                  >
                    <div style="display: flex; align-items: center; gap: 8px">
                      <a-avatar :size="24" style="background: #1677ff">
                        <template #icon><UserOutlined /></template>
                      </a-avatar>
                      <div>
                        <div style="font-weight: 500">{{ a.label }}</div>
                        <div style="font-size: 11px; color: #999">{{ a.dept }}</div>
                      </div>
                    </div>
                  </a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
          </a-row>
        </a-card>

        <!-- 审核人员 -->
        <a-card
          title="审核人员（QA）"
          :bordered="false"
          :head-style="{ background: '#fafafa', borderRadius: '8px 8px 0 0' }"
          style="margin-bottom: 24px; border-radius: 8px"
        >
          <a-row :gutter="24">
            <a-col :span="24">
              <a-form-item label="分配审核员">
                <template #extra>审核员负责对标注结果进行抽检与审核</template>
                <a-select
                  v-model:value="selectedReviewer"
                  placeholder="请选择审核员（可选）"
                  style="width: 100%"
                  allow-clear
                  :options="reviewerOptions"
                />
              </a-form-item>
            </a-col>
          </a-row>

          <!-- 分配结果提示 -->
          <a-card
            v-if="selectedAnnotators.length > 0"
            size="small"
            style="background: #f6ffed; border-color: #b7eb8f; margin-top: 16px"
          >
            <a-typography-text type="success">
              <CheckCircleOutlined /> 已选择 {{ selectedAnnotators.length }} 名标注员，
              系统将自动均分数据任务。
              <template v-if="selectedReviewer">审核员：{{ selectedReviewer }}。</template>
            </a-typography-text>
          </a-card>
        </a-card>

        <!-- 上一步 / 下一步 -->
        <div style="display: flex; justify-content: flex-end; gap: 16px; margin-top: 32px">
          <a-button size="large" style="width: 120px" @click="step = 0">上一步</a-button>
          <a-button
            type="primary"
            size="large"
            style="width: 160px"
            :disabled="!canNext"
            @click="step = 2"
          >
            下一步
          </a-button>
        </div>
      </template>

      <!-- ==================== Step 3: 确认发布 ==================== -->
      <template v-if="step === 2">
        <a-alert
          message="请确认以下信息无误后提交创建"
          type="info"
          show-icon
          style="margin-bottom: 24px; border-radius: 8px"
        >
          <template #icon><InfoCircleOutlined /></template>
        </a-alert>

        <!-- 项目信息预览 -->
        <a-card
          title="项目信息预览"
          :bordered="false"
          :head-style="{ background: '#fafafa', borderRadius: '8px 8px 0 0' }"
          style="margin-bottom: 24px; border-radius: 8px"
        >
          <a-row :gutter="24">
            <a-col :span="8">
              <div style="margin-bottom: 16px">
                <a-typography-text type="secondary">项目名称</a-typography-text>
                <div style="font-weight: 600; font-size: 16px; margin-top: 4px">
                  {{ projectName || '(未填写)' }}
                </div>
              </div>
              <div>
                <a-typography-text type="secondary">关联采集任务</a-typography-text>
                <div style="margin-top: 4px">
                  <a-tag color="blue">{{ linkedTask }}</a-tag>
                </div>
              </div>
            </a-col>
            <a-col :span="8">
              <div style="margin-bottom: 16px">
                <a-typography-text type="secondary">标注类型</a-typography-text>
                <div style="margin-top: 4px">
                  <a-tag
                    v-if="annoType"
                    :color="ANNOTATION_TYPES.find(t => t.value === annoType)?.color"
                  >
                    {{ annoType }}
                  </a-tag>
                </div>
              </div>
            </a-col>
            <a-col :span="8">
              <div style="margin-bottom: 16px">
                <a-typography-text type="secondary">
                  标注员（{{ selectedAnnotators.length }} 人）
                </a-typography-text>
                <div style="margin-top: 4px">
                  <a-tag
                    v-for="a in selectedAnnotators"
                    :key="a"
                    style="margin-bottom: 4px"
                  >
                    <template #icon><UserOutlined /></template>
                    {{ a }}
                  </a-tag>
                  <a-typography-text v-if="!selectedAnnotators.length" type="secondary">
                    未分配
                  </a-typography-text>
                </div>
              </div>
              <div>
                <a-typography-text type="secondary">审核员</a-typography-text>
                <div style="margin-top: 4px">
                  <a-tag v-if="selectedReviewer" color="green">
                    <template #icon><UserOutlined /></template>
                    {{ selectedReviewer }}
                  </a-tag>
                  <a-typography-text v-else type="secondary">未分配</a-typography-text>
                </div>
              </div>
            </a-col>
          </a-row>
        </a-card>

        <!-- 创建提示 -->
        <a-card style="background: #e6f4ff; border-color: #91caff; border-radius: 8px">
          <a-typography-text>
            📬 创建成功后，系统将向已分配的
            <strong>{{ selectedAnnotators.length }} 名标注员</strong>
            发送任务通知，标注任务将进入「标注中」状态。
          </a-typography-text>
        </a-card>

        <!-- 上一步 / 保存并创建 -->
        <div style="display: flex; justify-content: flex-end; gap: 16px; margin-top: 32px">
          <a-button size="large" style="width: 120px" @click="step = 1">上一步</a-button>
          <a-button
            type="primary"
            size="large"
            style="width: 160px"
            @click="handleSave"
          >
            <template #icon><CheckCircleOutlined /></template>
            保存并创建
          </a-button>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { message } from 'ant-design-vue'
import {
  ArrowLeftOutlined,
  PlusOutlined,
  UserOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons-vue'

// 如果使用 vue-router，请取消以下注释
// import { useRouter } from 'vue-router'
// const router = useRouter()

// ======================== 常量数据 ========================

const ANNOTATION_TYPES = [
  { value: '点标注', label: '点标注', color: 'purple', desc: '在图像/帧中标注关键点坐标，适用于关节点、目标中心等' },
  { value: '范围标注', label: '范围标注', color: 'blue', desc: '标注动作的起止时间范围，用于动作分段' },
  { value: '框标注', label: '框标注（BBox）', color: 'orange', desc: '用矩形框圈选目标区域，适用于物体检测' },
  { value: '范围&框标注', label: '范围&框标注', color: 'geekblue', desc: '同时标注时间范围与空间边界框，复合任务' },
  { value: '无需标注', label: '无需标注', color: 'default', desc: '仅做质检，无需进行额外标注操作' },
]

const annotators = [
  { value: '标注员A', label: '标注员A', dept: '标注一组' },
  { value: '标注员B', label: '标注员B', dept: '标注一组' },
  { value: '标注员M', label: '标注员M', dept: '标注二组' },
  { value: '标注员X', label: '标注员X', dept: '标注二组' },
  { value: '标注员Z', label: '标注员Z', dept: '外包供应商' },
]

const reviewers = [
  { value: '审核员Y', label: '审核员Y', dept: '质检组' },
  { value: '审核员N', label: '审核员N', dept: '质检组' },
  { value: '审核员P', label: '审核员P', dept: '质检组' },
]

const taskOptions = [
  { value: 'CT-20250301001', label: 'CT-20250301001 — FRANKA-FR3-抓取红色方块' },
  { value: 'CT-20250308007', label: 'CT-20250308007 — G1-整理厨具' },
  { value: 'CT-20250310015', label: 'CT-20250310015 — G1-搬运纸箱' },
]

const reviewerOptions = reviewers.map(r => ({
  value: r.value,
  label: `${r.label} — ${r.dept}`,
}))

// ======================== 响应式状态 ========================

const step = ref(0)
const annoType = ref(null)
const selectedAnnotators = ref([])
const selectedReviewer = ref(null)
const projectName = ref('')
const linkedTask = ref(null)

// ======================== 计算属性 ========================

const canNext = computed(() => {
  if (step.value === 0) return projectName.value && annoType.value && linkedTask.value
  if (step.value === 1) return selectedAnnotators.value.length > 0
  return true
})

// ======================== 方法 ========================

const goBack = () => {
  // 如果使用 vue-router：router.back()  或  router.push('/annotation/projects')
  window.history.back()
}

const handleSave = () => {
  if (!projectName.value) {
    message.warning('请填写项目名称')
    return
  }
  if (!annoType.value) {
    message.warning('请选择标注类型')
    return
  }
  if (!selectedAnnotators.value.length) {
    message.warning('请分配至少一名标注员')
    return
  }
  message.success('标注项目创建成功，已通知标注员开始作业！')
  // 如果使用 vue-router：setTimeout(() => router.push('/annotation/projects'), 800)
}
</script>

<style scoped>
.create-project-page {
  padding: 24px;
}
</style>

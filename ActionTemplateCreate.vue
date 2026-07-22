<template>
  <div class="create-action-template-page" style="padding: 24px;">
    <!-- Breadcrumb -->
    <div style="margin-bottom: 24px;">
      <a-breadcrumb>
        <a-breadcrumb-item>数据采集</a-breadcrumb-item>
        <a-breadcrumb-item>
          <a @click="goBack">模板中心</a>
        </a-breadcrumb-item>
        <a-breadcrumb-item>新建动作模板</a-breadcrumb-item>
      </a-breadcrumb>
    </div>

    <!-- Page Title Header -->
    <div style="display: flex; align-items: center; margin-bottom: 24px;">
      <a-button type="text" @click="goBack" style="margin-right: 16px;">
        <template #icon><ArrowLeftOutlined /></template>
      </a-button>
      <h3 style="margin: 0; font-size: 20px; font-weight: 600; color: #1f1f1f;">新建动作模版</h3>
    </div>

    <!-- Main Form -->
    <a-form :model="formState" layout="vertical" @finish="onFinish">
      <a-row :gutter="24">
        <!-- Left Config Column -->
        <a-col :span="8">
          <a-card title="基础配置" :bordered="false" style="border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.02);">
            <a-form-item label="动作模板名称" name="name" :rules="[{ required: true, message: '请输入模板名称' }]">
              <a-input v-model:value="formState.name" placeholder="请输入模版名称，如：桌面书籍整理与摆放模版" />
            </a-form-item>



            <a-form-item label="适配设备类型" name="device" :rules="[{ required: true }]">
              <a-select v-model:value="formState.device" placeholder="请选择" :options="deviceOptions" />
            </a-form-item>

            <a-form-item label="模板描述" name="desc">
              <a-textarea v-model:value="formState.desc" :rows="4" placeholder="简述该动作模板的适用动作类型和技能点描述" />
            </a-form-item>

            <div style="background: #f8fafc; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0; marginTop: 24px;">
              <h5 style="font-size: 13px; margin: 0 0 8px 0; color: #475569; font-weight: 600;">动作模板说明</h5>
              <p style="font-size: 12px; color: #64748b; margin: 0; line-height: 1.6;">
                动作模板用于定义机器人执行特定动作的SOP流程。在新建宏观任务模板或标注任务时，可以直接导入已建好的动作模板以自动填充原子动作编排步骤。
              </p>
            </div>
          </a-card>
        </a-col>

        <!-- Right SOP Steps Column -->
        <a-col :span="16">
          <a-card :bordered="false" style="border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.02);">
            <template #title>
              <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                <span style="font-weight: bold;">
                  <UnorderedListOutlined style="margin-right: 8px;" />
                  预设SOP动作步骤序列
                </span>
              </div>
            </template>

            <!-- Mode Selector Toggle -->
            <div style="margin-bottom: 20px;">
              <a-radio-group v-model:value="inputMode" button-style="solid">
                <a-radio-button value="structured">结构化步骤</a-radio-button>
                <a-radio-button value="natural">自然语言描述</a-radio-button>
              </a-radio-group>
            </div>

            <!-- Structured Steps List -->
            <div v-if="inputMode === 'structured'">
              <div style="display: flex; flex-direction: column; gap: 16px; margin-bottom: 16px;">
                <div 
                  v-for="(item, index) in steps" 
                  :key="item.key"
                  class="step-card"
                >
                  <!-- Step Number Badge -->
                  <div style="display: flex; flex-direction: column; align-items: center;">
                    <div class="step-badge-gradient">
                      {{ String(index + 1).padStart(2, '0') }}
                    </div>
                  </div>

                  <!-- Dropdowns Row -->
                  <div style="flex: 1;">
                    <a-row :gutter="[12, 12]">
                      <a-col :span="6">
                        <div class="dropdown-label">执行末端类型</div>
                        <a-select v-model:value="item.arm" style="width: 100%;" :options="armOptions" />
                      </a-col>

                      <a-col :span="6">
                        <div class="dropdown-label">原子技能</div>
                        <a-select v-model:value="item.skill" style="width: 100%;" :options="skillOptions" />
                      </a-col>

                      <a-col :span="6">
                        <div class="dropdown-label">操作对象</div>
                        <a-select v-model:value="item.object" style="width: 100%;" :options="objectOptions" />
                      </a-col>

                      <a-col :span="6">
                        <div class="dropdown-label">操作目标</div>
                        <a-select v-model:value="item.goal" style="width: 100%;" :options="goalOptions" />
                      </a-col>
                    </a-row>
                  </div>

                  <!-- Delete Button -->
                  <div style="display: flex; align-items: center; padding-left: 8px;">
                    <a-button 
                      type="text" 
                      danger 
                      :disabled="steps.length <= 1"
                      class="step-delete-btn"
                      @click="removeStep(item.key)"
                    >
                      <template #icon><MinusCircleOutlined /></template>
                    </a-button>
                  </div>
                </div>
              </div>

              <!-- Add Step Button -->
              <a-button
                type="dashed"
                class="step-add-btn"
                @click="addStep"
              >
                <template #icon><PlusOutlined /></template>
                添加结构化步骤
              </a-button>
            </div>

            <!-- Natural Text Mode -->
            <div v-else style="margin-bottom: 16px;">
              <a-textarea 
                v-model:value="naturalText"
                :rows="12" 
                placeholder="请输入自然语言描述的动作步骤流程，每行代表一个步骤。例如：&#10;1. 右手 (Right Arm) 识别 目标物品 (确认位置)&#10;2. 右手 (Right Arm) 靠近 目标物品 (避障靠近)"
                style="font-family: monospace; font-size: 13px;"
              />
              <span style="font-size: 12px; color: #8c8c8c; display: block; margin-top: 8px;">
                支持直接复制大段以空格/符号分隔的动作文本描述，每行文字将自动转换为模板中的独立工作步骤。
              </span>
            </div>

            <!-- SOP Tips Banner -->
            <div style="background: #fafafa; padding: 16px; border-radius: 4px; border: 1px dashed #d9d9d9; margin-top: 16px;">
              <span style="font-size: 13px; color: #8c8c8c;">
                提示：编排后的动作步骤序列将在新建任务模板阶段被引入，作为原子动作编排映射的基础指引。
              </span>
            </div>

            <!-- Actions buttons -->
            <div style="display: flex; justify-content: flex-end; gap: 16px; margin-top: 40px;">
              <a-button @click="goBack" style="width: 120px;">取消</a-button>
              <a-button type="primary" html-type="submit" style="width: 120px;">
                <template #icon><SaveOutlined /></template>
                保存模板
              </a-button>
            </div>
          </a-card>
        </a-col>
      </a-row>
    </a-form>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { message } from 'ant-design-vue';
import { 
  ArrowLeftOutlined, 
  PlusOutlined, 
  SaveOutlined, 
  UnorderedListOutlined,
  MinusCircleOutlined
} from '@ant-design/icons-vue';



const deviceOptions = [
  { value: 'galbot', label: 'Galbot (单臂/双臂)' },
  { value: 'franka_fr3', label: 'Franka FR3' },
  { value: '鹿鸣', label: '鹿鸣' }
];

const armOptions = [
  { value: '右手 (Right Arm)', label: '右手 (Right Arm)' },
  { value: '左手 (Left Arm)', label: '左手 (Left Arm)' },
  { value: '双手 (Dual Arms)', label: '双手 (Dual Arms)' },
  { value: '底盘 (Base)', label: '底盘 (Base)' },
  { value: '相机 (Camera)', label: '相机 (Camera)' }
];

const skillOptions = [
  { value: '识别', label: '识别' },
  { value: '靠近', label: '靠近' },
  { value: '抓取', label: '抓取' },
  { value: '放置', label: '放置' },
  { value: '旋转', label: '旋转' },
  { value: '对准', label: '对准' },
  { value: '松开', label: '松开' }
];

const objectOptions = [
  { value: '目标物品', label: '目标物品' },
  { value: '阀门', label: '阀门' },
  { value: '垃圾桶', label: '垃圾桶' },
  { value: '餐盘', label: '餐盘' },
  { value: '抽屉', label: '抽屉' },
  { value: '螺丝刀', label: '螺丝刀' },
  { value: '桌面', label: '桌面' },
  { value: '纸箱', label: '纸箱' },
  { value: '泡沫填充纸', label: '泡沫填充纸' },
  { value: '工厂部件', label: '工厂部件' },
  { value: '胶带封装器', label: '胶带封装器' }
];

const goalOptions = [
  { value: '确认位置', label: '确认位置' },
  { value: '避障靠近', label: '避障靠近' },
  { value: '牢固夹紧', label: '牢固夹紧' },
  { value: '稳定释放', label: '稳定释放' },
  { value: '扭转至角度', label: '扭转至角度' },
  { value: '对齐插槽', label: '对齐插槽' },
  { value: '推拉合拢', label: '推拉合拢' }
];

// Form and tab states
const formState = reactive({
  name: '',
  type: '服务数据',
  device: 'galbot',
  desc: ''
});

const inputMode = ref('structured');
const naturalText = ref(
  "1. 右手 (Right Arm) 识别 目标物品 (确认位置)\n2. 右手 (Right Arm) 靠近 目标物品 (避障靠近)\n3. 右手 (Right Arm) 抓取 目标物品 (牢固夹紧)"
);

// SOP steps items
const steps = ref([
  { key: '1', arm: '右手 (Right Arm)', skill: '识别', object: '目标物品', goal: '确认位置' },
  { key: '2', arm: '右手 (Right Arm)', skill: '靠近', object: '目标物品', goal: '避障靠近' },
  { key: '3', arm: '右手 (Right Arm)', skill: '抓取', object: '目标物品', goal: '牢固夹紧' }
]);

const addStep = () => {
  const newKey = (steps.value.length + 1).toString();
  steps.value.push({ key: newKey, arm: '右手 (Right Arm)', skill: '识别', object: '目标物品', goal: '确认位置' });
};

const removeStep = (key) => {
  steps.value = steps.value.filter(item => item.key !== key);
};

const onFinish = () => {
  let stepTexts = [];
  if (inputMode.value === 'structured') {
    stepTexts = steps.value.map(s => `${s.arm} ${s.skill} ${s.object} (${s.goal})`);
  } else {
    stepTexts = naturalText.value.split('\n').map(line => line.replace(/^\d+[\.\、\s]*/, '').trim()).filter(Boolean);
  }

  if (stepTexts.length === 0) {
    message.error('动作步骤序列不能为空！');
    return;
  }

  const payload = {
    ...formState,
    stepCount: stepTexts.length,
    steps: stepTexts
  };

  console.log('保存模板负载:', payload);
  message.success('动作模板保存成功！');
};

const goBack = () => {
  window.history.back();
};
</script>

<style scoped>
.step-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.02);
}

.step-badge-gradient {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-weight: bold;
  font-size: 14px;
  box-shadow: 0 2px 6px rgba(37, 99, 235, 0.3);
}

.dropdown-label {
  font-size: 11px;
  color: #64748b;
  margin-bottom: 6px;
  font-weight: 500;
}

.step-delete-btn {
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fef2f2;
  border: 1px solid #fee2e2;
  width: 36px;
  height: 36px;
  margin-top: 16px;
}

.step-add-btn {
  width: 100%;
  height: 48px;
  border-radius: 12px;
  color: #2563eb;
  border-color: #93c5fd;
  background: #f0f7ff;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-bottom: 16px;
}
</style>

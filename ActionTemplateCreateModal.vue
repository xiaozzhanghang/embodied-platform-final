<template>
  <a-modal
    :open="visible"
    title="新建动作模版"
    width="800px"
    ok-text="保存模板"
    cancel-text="取消"
    @ok="handleOk"
    @cancel="handleCancel"
    destroyOnClose
  >
    <a-form :model="formState" layout="vertical" ref="formRef">
      <!-- Top Section: Basic Config -->
      <div style="background: #fafafa; padding: 16px 20px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #f0f0f0;">
        <div style="font-weight: bold; font-size: 13px; margin-bottom: 12px; color: #334155;">基础配置</div>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="动作模板名称" name="name" :rules="[{ required: true, message: '请输入模板名称' }]" style="margin-bottom: 12px;">
              <a-input v-model:value="formState.name" placeholder="请输入模版名称" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="适配设备类型" name="device" :rules="[{ required: true }]" style="margin-bottom: 12px;">
              <a-select v-model:value="formState.device" placeholder="请选择" :options="deviceOptions" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item label="模板描述" name="desc" style="margin-bottom: 0;">
          <a-textarea v-model:value="formState.desc" :rows="2" placeholder="简述该动作模板的适用动作类型及说明" />
        </a-form-item>
      </div>

      <!-- Bottom Section: SOP Steps -->
      <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <span style="font-weight: bold; font-size: 13px; color: #334155;">
            <UnorderedListOutlined style="margin-right: 6px;" />预设SOP动作步骤序列
          </span>
          <a-radio-group v-model:value="inputMode" size="small" button-style="solid">
            <a-radio-button value="structured">结构化步骤</a-radio-button>
            <a-radio-button value="natural">自然语言描述</a-radio-button>
          </a-radio-group>
        </div>

        <!-- Structured Steps List -->
        <div v-if="inputMode === 'structured'">
          <div style="max-height: 280px; overflow-y: auto; padding-right: 4px; margin-bottom: 12px;">
            <div style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 12px;">
              <div 
                v-for="(item, index) in steps" 
                :key="item.key"
                class="step-card"
              >
                <!-- Step Number Badge -->
                <div class="step-badge-gradient">
                  {{ String(index + 1).padStart(2, '0') }}
                </div>

                <!-- Dropdowns Row -->
                <div style="flex: 1;">
                  <a-row :gutter="[8, 8]">
                    <a-col :span="5">
                      <div class="dropdown-label">执行末端类型</div>
                      <a-select v-model:value="item.arm" size="small" style="width: 100%;" :options="armOptions" />
                    </a-col>

                    <a-col :span="4">
                      <div class="dropdown-label">原子技能</div>
                      <a-select v-model:value="item.skill" size="small" style="width: 100%;" :options="skillOptions" />
                    </a-col>

                    <a-col :span="4">
                      <div class="dropdown-label">操作对象</div>
                      <a-select v-model:value="item.object" size="small" style="width: 100%;" :options="objectOptions" />
                    </a-col>

                    <a-col :span="5">
                      <div class="dropdown-label">操作目标</div>
                      <a-select v-model:value="item.goal" size="small" style="width: 100%;" :options="goalOptions" />
                    </a-col>

                    <a-col :span="6">
                      <div class="dropdown-label">默认帧数区间</div>
                      <div style="display: flex; align-items: center; gap: 4px;">
                        <a-input-number v-model:value="item.startFrame" :min="0" size="small" placeholder="起始帧" style="width: 48%;" />
                        <span style="font-size: 10px; color: #94a3b8;">-</span>
                        <a-input-number v-model:value="item.endFrame" :min="0" size="small" placeholder="结束帧" style="width: 48%;" />
                      </div>
                    </a-col>
                  </a-row>
                </div>

                <!-- Delete Button -->
                <a-button 
                  type="text" 
                  danger 
                  size="small"
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
            size="small"
            class="step-add-btn"
            @click="addStep"
          >
            <template #icon><PlusOutlined /></template>
            添加结构化步骤
          </a-button>
        </div>

        <!-- Natural Text Mode -->
        <div v-else style="margin-bottom: 12px;">
          <a-textarea 
            v-model:value="naturalText"
            :rows="6" 
            placeholder="请输入自然语言描述的动作步骤流程，每行代表一个步骤。"
            style="font-family: monospace; font-size: 12px;"
          />
          <span style="font-size: 11px; color: #8c8c8c; display: block; margin-top: 6px;">
            支持直接复制大段以空格/符号分隔的动作文本描述，每行文字将自动转换为模板中的独立工作步骤。
          </span>
        </div>
      </div>
    </a-form>
  </a-modal>
</template>

<script setup>
import { ref, reactive, defineProps, defineEmits } from 'vue';
import { message } from 'ant-design-vue';
import { 
  PlusOutlined, 
  UnorderedListOutlined,
  MinusCircleOutlined
} from '@ant-design/icons-vue';

// Component Props & Emits
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  }
});
const emit = defineEmits(['update:visible', 'submit']);

const formRef = ref(null);

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

// Form states
const formState = reactive({
  name: '',
  type: '服务数据',
  device: 'galbot',
  desc: ''
});

const inputMode = ref('structured');
const naturalText = ref(
  "1. 右手 (Right Arm) 识别 目标物品 (确认位置) [0 - 30 帧]\n2. 右手 (Right Arm) 靠近 目标物品 (避障靠近) [30 - 60 帧]\n3. 右手 (Right Arm) 抓取 目标物品 (牢固夹紧) [60 - 90 帧]"
);

const steps = ref([
  { key: '1', arm: '右手 (Right Arm)', skill: '识别', object: '目标物品', goal: '确认位置', startFrame: 0, endFrame: 30 },
  { key: '2', arm: '右手 (Right Arm)', skill: '靠近', object: '目标物品', goal: '避障靠近', startFrame: 30, endFrame: 60 },
  { key: '3', arm: '右手 (Right Arm)', skill: '抓取', object: '目标物品', goal: '牢固夹紧', startFrame: 60, endFrame: 90 }
]);

const addStep = () => {
  const newKey = (steps.value.length + 1).toString();
  const lastStep = steps.value[steps.value.length - 1];
  const prevEnd = lastStep ? (lastStep.endFrame ?? 0) : 0;
  steps.value.push({ 
    key: newKey, 
    arm: '右手 (Right Arm)', 
    skill: '识别', 
    object: '目标物品', 
    goal: '确认位置',
    startFrame: prevEnd,
    endFrame: prevEnd + 30
  });
};

const removeStep = (key) => {
  steps.value = steps.value.filter(item => item.key !== key);
};

const handleCancel = () => {
  emit('update:visible', false);
};

const handleOk = () => {
  formRef.value.validate().then(() => {
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

    emit('submit', payload);
    emit('update:visible', false);
    message.success('动作模板创建成功！');
  });
};
</script>

<style scoped>
.step-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.01);
}

.step-badge-gradient {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-weight: bold;
  font-size: 12px;
  box-shadow: 0 2px 4px rgba(37, 99, 235, 0.2);
  flex-shrink: 0;
}

.dropdown-label {
  font-size: 10px;
  color: #64748b;
  margin-bottom: 4px;
  font-weight: 500;
}

.step-delete-btn {
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fef2f2;
  border: 1px solid #fee2e2;
  width: 28px;
  height: 28px;
  margin-top: 14px;
  flex-shrink: 0;
}

.step-add-btn {
  width: 100%;
  height: 40px;
  border-radius: 8px;
  color: #2563eb;
  border-color: #93c5fd;
  background: #f0f7ff;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}
</style>

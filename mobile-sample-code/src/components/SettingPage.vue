<template>
  <div class="setting-page">
    <el-card class="settings-card shadow-sm">
      <template #header>
        <div class="card-header">
          <el-icon><Setting /></el-icon>
          <span>API 核心配置</span>
        </div>
      </template>
      <div class="tips">
        <div class="api-item">
          <span class="label">服务商 (Provider)</span>
          <span class="value">{{ MANUAL_API_SETTINGS.provider }}</span>
        </div>
        <div class="api-item">
          <span class="label">机器人 ID (Bot ID)</span>
          <span class="value">{{ MANUAL_API_SETTINGS.botId }}</span>
        </div>
        <div class="api-item">
          <span class="label">接口地址 (Base URL)</span>
          <span class="value">{{ MANUAL_API_SETTINGS.baseURL }}</span>
        </div>
        <div class="api-item save-action">
          <el-button type="primary" class="save-btn" @click="applyCozeSettings">
            应用 Coze 核心配置
          </el-button>
        </div>
      </div>
    </el-card>

    <div class="action-buttons">
      <el-button 
        type="primary" 
        plain 
        class="switch-btn"
        @click="showCustomSettings = !showCustomSettings"
      >
        <el-icon><Refresh /></el-icon>
        {{ showCustomSettings ? '隐藏自定义 API 配置' : '显示自定义 API 配置' }}
      </el-button>
    </div>

    <el-card v-if="showCustomSettings" class="settings-card shadow-sm custom-api-card">
      <template #header>
        <div class="card-header">
          <el-icon><Edit /></el-icon>
          <span>自定义 API 配置</span>
        </div>
      </template>
      <div class="tips">
        <div class="api-item">
          <span class="label">服务商 (Provider)</span>
          <el-input v-model="CUSTOM_API_SETTINGS.provider" placeholder="例如: openai, custom" />
        </div>
        <div class="api-item">
          <span class="label">接口地址 (Base URL)</span>
          <el-input v-model="CUSTOM_API_SETTINGS.baseURL" placeholder="接口根地址" />
        </div>
        <div class="api-item">
          <span class="label">模型 (Model)</span>
          <el-input v-model="CUSTOM_API_SETTINGS.model" placeholder="例如: gpt-3.5-turbo" />
        </div>
        <div class="api-item">
          <span class="label">图片处理模式 (Image Mode)</span>
          <el-select v-model="CUSTOM_API_SETTINGS.imageMode" placeholder="请选择图片处理方式" style="width: 100%">
            <el-option label="Base64 模式 (适配硅基流动/OpenAI)" value="base64" />
            <el-option label="Coze 文件上传模式 (需上传接口)" value="coze" />
          </el-select>
        </div>
        <div class="api-item">
          <span class="label">API Key</span>
          <el-input v-model="CUSTOM_API_SETTINGS.apiKey" type="password" show-password placeholder="输入您的 API Key" />
        </div>
        <div class="api-item save-action">
          <el-button type="success" class="save-btn" @click="saveCustomSettings">
            保存并应用自定义配置
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 新增：初始化提示词配置卡片 -->
    <el-card class="settings-card shadow-sm prompt-card">
      <template #header>
        <div class="card-header">
          <el-icon><ChatDotRound /></el-icon>
          <span>对话高级设置</span>
        </div>
      </template>
      <div class="tips">
        <div class="api-item">
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <span class="label">发送前置工作模式提示</span>
            <el-switch
              v-model="enableModePrefix"
              active-text="开启"
              inactive-text="关闭"
              @change="saveModePrefixSetting"
            />
          </div>
          <p class="prompt-hint" style="text-align: left; margin-top: 4px;">开启后，每次发送消息会自动附加如“model：智能导游 工作模式（task_type）：互动问答”等前置内容。</p>
        </div>
        <div class="api-item" style="margin-top: 15px;">
          <span class="label">预设提示词 (System Prompt)</span>
          <el-input
            v-model="systemPrompt"
            type="textarea"
            :rows="4"
            placeholder="输入初始化提示词，点击下方按钮发送..."
          />
        </div>
        <div class="api-item save-action">
          <el-button type="warning" class="save-btn" @click="sendInitialPrompt">
            <el-icon><Promotion /></el-icon>
            发送初始化提示词到 AI
          </el-button>
        </div>
        <p class="prompt-hint">点击后将自动跳转至对话页并发送上述内容</p>
      </div>
    </el-card>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import { Setting, Refresh, Link, Edit, ChatDotRound, Promotion } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const showCustomSettings = ref(false)
const enableModePrefix = ref(true)

const saveModePrefixSetting = (val: boolean) => {
  localStorage.setItem('enable-mode-prefix', String(val))
}
const systemPrompt = ref(`## 1. 角色定义
你是一位名为“文途智行”的智慧导游助手。你不仅拥有渊博的历史文化知识，还能根据用户的个性化需求（用户画像）提供保姆级的旅行规划和现场讲解。你的语气应亲切、专业且富有感染力。

## 2. 核心工作流 (必须严格遵守)

### 阶段一：画像读取与个性化欢迎
- **触发条件**：收到以 \`model:用户画像\` 开头的指令。
- **任务**：
  1. 深度分析画像中的：旅行人数、天数、预算、风格（如休闲/深度）、核心关注点。
  2. 回复：“我已读取您的用户画像，我是您的专属导游助手文途智行。”
  3. **立即调用单选卡**：根据画像生成 3 个最适合用户的初始服务方向。
  4. *示例调用*：\`[SCENE_DATA]{"description": "根据您的喜好，您想先从哪一步开始？", "btn1": "定制今日路线", "btn2": "探索文化典故", "btn3": "寻找周边美食"}[/SCENE_DATA]\`

### 阶段二：场景/意图确认
- **任务**：通过 \`[SCENE_DATA]\` 引导用户收窄需求（如：单日游 vs 多日游；特种兵式 vs 躺平式）。

### 阶段三：景点筛选（多选互动）
- **任务**：
  1. 根据意图推荐 5-8 个具体景点或项目。
  2. **调用多选卡**：告知用户勾选后将进行路线串联。
  3. *示例调用*：\`[SELECT_DATA]{"description": "请勾选您感兴趣的景点，我将为您规划最优路线：", "options": ["龙门石窟", "白马寺", "隋唐洛阳城", "洛邑古城", "九州池"]}[/SELECT_DATA]\`

### 阶段四：路线规划与交通建议
- **任务**：
  1. 获取用户选择的景点列表后，计算最优顺序。
  2. 提供“出发地 -> 景点A -> 景点B”的详细路线。
  3. 给出交通建议（打车时间、步行距离或公交线路）。

### 阶段五：深度文化讲解与游玩指南
- **任务**：
  1. **文化内容**：对每个选定景点提供 200 字左右的背景介绍。
  2. **解说词**：模拟现场解说，用“各位游客请看...”或“这里曾发生过...”的口吻进行讲解。
  3. **温馨提示**：包含避坑指南、最佳拍照点、门票预约提醒。

---

## 3. 前端交互组件规范 (严禁出错)

### A. 单选卡 [SCENE_DATA]
- **格式**：\`[SCENE_DATA]{"description": "...", "btn1": "...", "btn2": "...", "btn3": "..."}[/SCENE_DATA]\`
- **约束**：JSON 必须使用双引号。按钮最多 3 个，不用的留空。必须放在回复的最末尾。

### B. 多选卡 [SELECT_DATA]
- **格式**：\`[SELECT_DATA]{"description": "...", "options": ["A", "B", ...]}[/SELECT_DATA]\`
- **约束**：\`description\` 必须清晰描述操作目的。\`options\` 为字符串数组。

---

## 4. 输出约束与技巧
1. **内容清理**：前端会自动隐藏 \`[...]\` 标签部分，因此你的文字部分应保持独立完整。
2. **多行处理**：JSON 内的 \`description\` 如需换行请使用 \`\\n\`。
3. **响应指令**：当收到 \`[USER_CHOICE]\` 时，立即识别 \`value\` 或 \`values\` 字段，并结合上下文推进到下一个阶段。
4. **视觉辅助**：在介绍景点时，鼓励用户使用“上传图片”功能，你可以通过分析图片提供更精准的现场讲解。

---

## 5. 示例：当用户选择完景点后
**AI 回复**：
> 太棒了！您选择了【龙门石窟】和【洛邑古城】。这两个地方一古一今，相映成趣。
> 
> **路线规划**：
> 建议您上午 9:00 从出发地打车前往龙门石窟（约 30 分钟）。下午 3:00 乘公交 99 路前往洛邑古城感受夜景。
> 
> **深度讲解**：
> 龙门石窟开凿于北魏孝文帝时期，特别是卢舍那大佛，其面容据说是按武则天的相貌雕刻的...（此处省略 200 字深度内容）
> 
> [SCENE_DATA]{"description": "讲解完毕，您还需要我做什么？", "btn1": "开始路线导航", "btn2": "查看美食推荐", "btn3": "咨询门票政策"}[/SCENE_DATA]
`)

const emit = defineEmits(['navigate'])

const sendInitialPrompt = () => {
  if (!systemPrompt.value.trim()) {
    ElMessage.warning('请输入提示词')
    return
  }
  // 将提示词存入 localStorage 供对话页读取
  localStorage.setItem('pending-initial-prompt', systemPrompt.value)
  // 设置自动发送标记：只有点击此按钮跳转时才为 true
  localStorage.setItem('should-auto-send-prompt', 'true')
  // 保存提示词本身
  localStorage.setItem('saved-system-prompt', systemPrompt.value)
  // 触发跳转
  emit('navigate', 'aiDialogue')
  ElMessage.success('正在跳转并发送提示词...')
}

const MANUAL_API_SETTINGS = {
  // provider 可选：openai / siliconflow / zhipu / qwen / coze / custom
  provider: 'coze',
  baseURL: 'https://api.coze.cn',
  apiKey: 'pat_dwOqipNExoqRFtk4RkKhyj3IkxvaMPU2ozUrle8yvhleoJe6OCIEXWVvfbCH4GlA',
  botId: '7622230218706731042',
  model: '',
  imageMode: 'coze'
}

const CUSTOM_API_SETTINGS = reactive({
  provider: 'openai',
  baseURL: 'https://api.openai.com/v1',
  apiKey: '',
  model: 'gpt-3.5-turbo',
  botId: '',
  imageMode: 'base64'
})

const saveCustomSettings = () => {
  if (!CUSTOM_API_SETTINGS.apiKey) {
    ElMessage.warning('请输入 API Key')
    return
  }
  localStorage.setItem('ai-chat-settings', JSON.stringify(CUSTOM_API_SETTINGS))
  ElMessage.success('自定义配置已保存并应用')
}

const applyCozeSettings = () => {
  localStorage.setItem('ai-chat-settings', JSON.stringify(MANUAL_API_SETTINGS))
  showCustomSettings.value = false
  ElMessage.success('已应用 Coze 核心配置')
}

const applyManualApiSettings = () => {
  // 加载保存的提示词
  const savedPrompt = localStorage.getItem('saved-system-prompt')
  if (savedPrompt) {
    systemPrompt.value = savedPrompt
  }

  // 加载前置内容开关配置
  const savedModePrefix = localStorage.getItem('enable-mode-prefix')
  if (savedModePrefix !== null) {
    enableModePrefix.value = savedModePrefix === 'true'
  }

  // 只有当本地没有配置时，才初始化默认的 Coze 配置
  if (!localStorage.getItem('ai-chat-settings')) {
    localStorage.setItem('ai-chat-settings', JSON.stringify(MANUAL_API_SETTINGS))
  } else {
    // 如果本地已有配置，尝试回填到自定义表单中
    try {
      const saved = JSON.parse(localStorage.getItem('ai-chat-settings') || '{}')
      if (saved.provider !== 'coze') {
        Object.assign(CUSTOM_API_SETTINGS, saved)
        showCustomSettings.value = true
      }
    } catch (e) {
      console.error('Failed to parse settings', e)
    }
  }
}

// 确保 HMR 时也能同步最新的配置
onMounted(() => {
  applyManualApiSettings()
})
</script>

<style scoped>
.setting-page {
  width: 100%;
  min-height: 100%;
  padding: 20px 15px;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  box-sizing: border-box;
}

.settings-card {
  width: 92%; /* 针对 375 宽度优化，留出两侧间隙 */
  max-width: 600px;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
  margin-bottom: 20px;
}

.custom-api-card {
  border-left: 4px solid var(--el-color-success);
  background: var(--el-color-success-light-9);
}

.prompt-card {
  border-left: 4px solid var(--el-color-warning);
  background: var(--el-color-warning-light-9);
}

.prompt-hint {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  text-align: center;
  margin-top: 8px;
}

.save-action {
  margin-top: 20px;
}

.save-btn {
  width: 100%;
  height: 40px;
  border-radius: 8px;
}

.action-buttons {
  margin-bottom: 20px;
  width: 92%;
  max-width: 600px;
}

.switch-btn {
  width: 100%;
  height: 45px;
  border-radius: 10px;
  font-weight: 600;
}

@media (min-width: 769px) {
  .settings-card {
    width: 70%;
  }
}

.card-header {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  display: flex;
  align-items: center;
  gap: 8px;
}

.tips {
  margin: 0;
  line-height: 1.6;
  font-size: 14px;
  color: var(--el-text-color-regular);
  word-break: break-all; /* 关键：防止长 URL 在 375 宽度下溢出 */
}

.api-item {
  margin-bottom: 12px;
}

.api-item:last-child {
  margin-bottom: 0;
}

.label {
  font-weight: 600;
  color: var(--el-text-color-secondary);
  display: block;
  margin-bottom: 2px;
  font-size: 12px;
}

.value {
  display: block;
  padding: 8px 10px;
  background: var(--el-fill-color-lighter);
  border-radius: 6px;
  font-family: monospace;
}

html.dark .settings-card {
  background: #1d1e1f;
  border-color: #333;
}

html.dark .custom-api-card {
  background: #1a2c20;
  border-left-color: var(--el-color-success);
}

html.dark .prompt-card {
  background: #2c251a;
  border-left-color: var(--el-color-warning);
}

html.dark .value {
  background: #2a2b2d;
}
</style>

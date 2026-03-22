<template>
  <div class="ai-dialogue-page">
    <div class="chat-container">
      <div class="chat-messages" ref="messagesRef">
        <div v-if="messages.length === 0 && !isSettingsLoaded" class="empty-tip">
          <el-empty description="加载设置中..." />
        </div>
        <div v-else-if="messages.length === 0" class="empty-tip">
          <el-empty :description="welcomeMessage">
            <el-tag v-if="currentProvider" type="success" effect="dark">当前设置API来源: {{ currentProvider }}</el-tag>
          </el-empty>
        </div>
        
        <div
          v-for="(msg, index) in messages"
          :key="index"
          class="message-item"
          :class="msg.role"
        >
          <div class="message-avatar">
            <el-avatar :size="40" :icon="msg.role === 'user' ? User : ChatDotRound" />
          </div>
          <div class="message-content">
            <div class="message-role">
              {{ msg.role === 'user' ? '你' : 'HPU 智慧导游' }}
            </div>
            <el-card class="message-card" :class="msg.role">
              <div class="message-text" v-html="msg.role === 'assistant' ? formatAssistantMessage(msg.content) : formatMessage(msg.content)"></div>
            </el-card>
          </div>
        </div>
        
        <div v-if="isLoading" class="message-item assistant">
          <div class="message-avatar">
            <el-avatar :size="40" icon="ChatDotRound" />
          </div>
          <div class="message-content">
            <el-card class="message-card loading-card">
              <el-icon class="loading-icon"><Loading /></el-icon>
              <span>HPU 智慧导游正在思考中...</span>
            </el-card>
          </div>
        </div>
      </div>
      
      <div class="chat-input">
        <div class="chat-toolbar">
          <el-select v-model="toolbarSelectA" placeholder="选择智能体工作模式" style="width: 200px">
            <el-option label="工作模式：互动问答" value="a1" />
            <el-option label="工作模式：景点介绍" value="a2" />
          </el-select>
          <el-button 
            class="chat-toolbar-clear"
            type="danger"
            :disabled="messages.length === 0 || isLoading"
            @click="clearChat"
          >
            清空聊天
          </el-button>
        </div>
        <div class="chat-textarea">
          <el-input
            v-model="inputText"
            type="textarea"
            placeholder="输入消息... (Enter 发送，Shift+Enter 换行)"
            :rows="2"
            :disabled="isLoading"
            @keydown.enter.exact.prevent="handleSend"
            @keydown.shift.enter.prevent="handleNewLine"
          />
        </div>
        <div class="chat-actions">
          <el-button 
            type="primary" 
            :loading="isLoading"
            :disabled="!inputText.trim() || isLoading"
            @click="handleSend"
          >
            发送
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, onMounted, computed } from 'vue'
import { Loading, User, ChatDotRound } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'
import MarkdownIt from 'markdown-it'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const messages = ref<Message[]>([])
const inputText = ref('')
const isLoading = ref(false)
const messagesRef = ref<HTMLElement | null>(null)

const toolbarSelectA = ref('a1')
const toolbarSelectB = ref('b1')

const toolbarSelectALabel = computed(() => {
  if (toolbarSelectA.value === 'a1') return '工作模式（task_type）：互动问答'
  if (toolbarSelectA.value === 'a2') return '工作模式（task_type）：景点介绍'
  return ''
})

const apiSettings = ref({
  provider: 'openai',
  baseURL: '',
  apiKey: '',
  model: 'gpt-3.5-turbo'
})

const isSettingsLoaded = ref(false)

const providerConfigs: Record<string, { baseURL: string; model: string; name: string }> = {
  openai: {
    baseURL: 'https://api.openai.com/v1',
    model: 'gpt-3.5-turbo',
    name: 'OpenAI'
  },
  siliconflow: {
    baseURL: 'https://api.siliconflow.cn/v1',
    model: 'Qwen/Qwen2.5-7B-Instruct',
    name: '硅基流动'
  },
  zhipu: {
    baseURL: 'https://open.bigmodel.cn/api/paas/v4',
    model: 'glm-4',
    name: '智谱AI'
  },
  qwen: {
    baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    model: 'qwen-turbo',
    name: '通义千问'
  },
  custom: {
    baseURL: '',
    model: '',
    name: '自定义'
  }
}

const currentProvider = computed(() => {
  return providerConfigs[apiSettings.value.provider]?.name || '自定义'
})

const welcomeMessage = computed(() => {
  return `与 ${currentProvider.value} AI 开始对话`
})

const loadSettings = () => {
  const saved = localStorage.getItem('ai-chat-settings')
  if (saved) {
    try {
      apiSettings.value = { ...apiSettings.value, ...JSON.parse(saved) }
      isSettingsLoaded.value = true
    } catch (e) {
      console.error('加载设置失败', e)
    }
  }
  isSettingsLoaded.value = true
}

const md = new MarkdownIt({
  html: false,
  linkify: true,
  breaks: true
})

md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
  const token = tokens[idx]
  token.attrSet('target', '_blank')
  token.attrSet('rel', 'noopener noreferrer')
  return self.renderToken(tokens, idx, options)
}

const scrollToBottom = async () => {
  await nextTick()
  if (messagesRef.value) {
    messagesRef.value.scrollTop = messagesRef.value.scrollHeight
  }
}

const formatMessage = (text: string): string => {
  if (!text) return ''
  let formatted = text.replace(/</g, '&lt;').replace(/>/g, '&gt;')
  formatted = formatted.replace(/\n/g, '<br>')
  formatted = formatted.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
  formatted = formatted.replace(/`([^`]+)`/g, '<code>$1</code>')
  return formatted
}

const formatAssistantMessage = (text: string): string => {
  if (!text) return ''
  return md.render(text)
}

const handleNewLine = () => {
  inputText.value += '\n'
}

const clearChat = () => {
  if (messages.value.length === 0) return
  
  ElMessageBox.confirm('确定要清空所有聊天记录吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    messages.value = []
    ElMessage.success('聊天记录已清空')
  }).catch(() => {})
}

const sendMessage = async (text: string, showUserMessage: boolean) => {
  if (!text || isLoading.value) return

  if (!apiSettings.value.apiKey) {
    ElMessage.warning('请先在设置中配置 API Key')
    return
  }

  const messagesForRequest: Message[] = [...messages.value, { role: 'user', content: text }]

  if (showUserMessage) {
    messages.value.push({ role: 'user', content: text })
    await scrollToBottom()
  }

  isLoading.value = true

  try {
    const { baseURL, apiKey, model, provider } = apiSettings.value
    
    let finalBaseURL = baseURL || providerConfigs[provider]?.baseURL || ''
    if (!finalBaseURL) {
      throw new Error('API 地址不能为空，请在设置中配置正确的 API 地址')
    }
    
    let requestData: any = {}
    let headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }

    if (provider === 'zhipu') {
      headers['Authorization'] = `Bearer ${apiKey}`
      requestData = {
        model: model,
        messages: messagesForRequest.map(m => ({
          role: m.role,
          content: m.content
        })),
        stream: false
      }
    } else if (provider === 'qwen') {
      headers['Authorization'] = `Bearer ${apiKey}`
      requestData = {
        model: model,
        messages: messagesForRequest.map(m => ({
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: m.content
        })),
        stream: false
      }
    } else {
      headers['Authorization'] = `Bearer ${apiKey}`
      requestData = {
        model: model,
        messages: messagesForRequest.map(m => ({
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: m.content
        })),
        stream: false
      }
    }

    const response = await axios.post(
      `${finalBaseURL}/chat/completions`,
      requestData,
      {
        headers,
        timeout: 120000
      }
    )

    let aiContent = ''
    
    if (provider === 'zhipu') {
      aiContent = response.data.choices?.[0]?.message?.content || ''
    } else {
      aiContent = response.data.choices?.[0]?.message?.content || ''
    }

    if (!aiContent) {
      aiContent = JSON.stringify(response.data, null, 2)
    }
    
    messages.value.push({ role: 'assistant', content: aiContent })
  } catch (error: any) {
    let errorMsg = error.message
    
    if (error.response?.data?.error) {
      errorMsg = error.response.data.error.message || errorMsg
    } else if (error.response?.data) {
      errorMsg = JSON.stringify(error.response.data)
    }
    
    messages.value.push({
      role: 'assistant',
      content: `❌ 请求失败：${errorMsg}\n\n请检查：\n1. API Key 是否正确\n2. API 余额是否充足\n3. 网络是否正常`
    })
  } finally {
    isLoading.value = false
    await scrollToBottom()
  }
}

const handleSend = async () => {
  const text = inputText.value.trim()
  if (!text || isLoading.value) return
  inputText.value = ''
  const prefix = toolbarSelectALabel.value
  const prefixedText = prefix && !text.startsWith(`${prefix}\n`) ? `${prefix}\n${text}` : text
  await sendMessage(prefixedText, true)
}

const handleSendHidden = async (text: string) => {
  await sendMessage(text, false)
}

onMounted(() => {
  loadSettings()
  checkAndSendUserProfile()
})

const checkAndSendUserProfile = () => {
  const savedForm = localStorage.getItem('user-profile-form')
  if (savedForm) {
    try {
      const formData = JSON.parse(savedForm)
      localStorage.removeItem('user-profile-form')
      
      const prompt = `请根据以下用户画像信息，生成一个详细的用户画像总结，后续对话时用于推荐旅游景点：\n\n
                      1. MBTI性格类型（MBTIPersonalityType）: ${formData.MBTIPersonalityType || '未填写'}\n
                      2. 文化价值观倾向（CulturalValueOrientation）: ${formData.CulturalValueOrientation || '未填写'}\n
                      3. 历史旅行类型（HistorialTravelType）: ${formData.HistorialTravelType || '未填写'}\n
                      4. 决策参考渠道（DecisionReferenceChannel）: ${formData.DecisionReferenceChannel || '未填写'}\n
                      5. 文化偏好类型（CulturalPreferenceType）: ${formData.CulturalPreferenceType || '未填写'}\n
                      6. 风险偏好程度（RiskPreferenceLevel）: ${formData.RiskPreferenceLevel || '未填写'}\n
                      7. 出行方式（TravelSocialScale）: ${formData.TravelSocialScale || '未填写'}\n
                      8. 出行频率（TravelBehaviorFrequency）: ${formData.TravelBehaviorFrequency || '未填写'}\n
                      9. 决策自主程度（SocialDecisionInfluenceDegree）: ${formData.SocialDecisionInfluenceDegree || '未填写'}\n
                      10. 学习风格（LearningStyleType）: ${formData.LearningStyleType || '未填写'}\n\n
                      请用调用你的工作流进行用户喜好分析，下面的对话内容要基于此进行。明白回复我：我已读取用户画像，下面根据你的喜好进行对话咨询。`
      
      setTimeout(() => {
        handleSendHidden(prompt)
      }, 500)
    } catch (e) {
      console.error('加载用户画像失败', e)
    }
  }
}
</script>

<style scoped>
.ai-dialogue-page {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.chat-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  min-height: 0;
}

.message-item {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.message-item.user {
  flex-direction: row-reverse;
}

.message-avatar {
  flex-shrink: 0;
}

.message-content {
  flex: 1;
  max-width: 80%;
}

.message-role {
  font-size: 12px;
  /* AI对话页面，用户与AI的昵称颜色 */
  color: #909399;
  margin-bottom: 5px;
}

.message-item.user .message-role {
  text-align: right;
}

.message-card {
  border-radius: 12px;
  padding: 12px 16px;
}


.message-text {
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}



.loading-card {
  display: flex;
  align-items: center;
  gap: 10px;
}

.loading-icon {
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}



.chat-textarea {
  grid-column: 1 / 2;
}

.chat-toolbar {
  grid-column: 1 / -1;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 12px;
}

.chat-toolbar-clear {
  margin-left: auto;
}

.chat-actions {
  grid-column: 2 / 3;
  grid-row: 2 / 3;
  display: flex;
  align-self: stretch;
}

.chat-actions .el-button {
  margin-left: 0;
  height: 100%;
  min-width: 96px;
}

.empty-tip {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 10px;
}

html.dark .chat-container {
  background: transparent;
}

.message-card.user {
  /* ========= 可自定义：用户聊天框背景颜色（浅色模式） ========= */
  background: #9DF29F;
  border-color: #EFEFEF;
}

.message-card.user .message-text {
  /* ========= 可自定义：用户聊天框文字颜色（浅色模式） ========= */
  color: #000000;
}

.message-card.assistant .message-text {
  /* ========= 可自定义：AI聊天框文字颜色（浅色模式） ========= */
  color: #000000;
  line-height: 1.45;
}

.message-card.assistant .message-text :deep(p) {
  margin: 0 0 6px 0;
}

.message-card.assistant .message-text :deep(p:last-child) {
  margin-bottom: 0;
}

.message-card.assistant .message-text :deep(ul),
.message-card.assistant .message-text :deep(ol) {
  margin: 0 0 6px 0;
  padding-left: 18px;
}

.message-card.assistant .message-text :deep(li) {
  margin: 2px 0;
}

.message-card.assistant .message-text :deep(pre) {
  margin: 6px 0;
}

.message-card.assistant .message-text :deep(blockquote) {
  margin: 6px 0;
}

.message-card.assistant .message-text :deep(h1),
.message-card.assistant .message-text :deep(h2),
.message-card.assistant .message-text :deep(h3),
.message-card.assistant .message-text :deep(h4),
.message-card.assistant .message-text :deep(h5),
.message-card.assistant .message-text :deep(h6) {
  margin: 8px 0 6px 0;
  line-height: 1.25;
}

/* ========= 可自定义：用户聊天框（浅色模式）颜色 =========
  - 修改用户气泡背景：background
  - 修改用户气泡边框：border-color
  - 修改用户文字颜色：配合 .message-card.user .message-text 一起改

  例如（取消注释并改颜色值）：
  .message-card.user {
    background: #409eff;
    border-color: #409eff;
  }
*/

.message-card.assistant {
  /* ========= 可自定义：AI聊天框（浅色模式）颜色 =========
    - 修改AI气泡背景：background
    - 修改AI气泡边框：border-color
    - 修改AI文字颜色：配合 .message-text（或单独加 .message-card.assistant .message-text）一起改
  */
  background: #EEEEF0;
}

html.dark .message-card.user {
  /* ========= 可自定义：用户聊天框（深色模式）颜色 ========= */
  background: #35D28D;
  border-color: #29292A;
}

html.dark .message-card.assistant {
  /* ========= 可自定义：AI聊天框（深色模式）颜色 ========= */
  background: #2F2F30;
  border-color: #29292A;
}

html.dark .message-card.user .message-text {
  /* ========= 可自定义：用户聊天框文字颜色（深色模式） ========= */
  color: #000000;
}

html.dark .message-card.assistant .message-text {
  /* ========= 可自定义：AI聊天框文字颜色（深色模式） ========= */
  color: #D4D4D7;
}

/* ========= 可自定义：用户聊天框（深色模式）颜色 =========
  例如（取消注释并改颜色值）：
  html.dark .message-card.user {
    background: #409eff;
    border-color: #409eff;
  }
*/

/* ========= 可自定义：AI聊天框（深色模式）颜色 =========
  例如（取消注释并改颜色值）：
  html.dark .message-card.assistant {
    background: #1d2a4d;
    border-color: #0f3460;
  }
*/

html.dark .chat-input {
  /* ========= 可自定义：底部聊天栏（深色模式）背景颜色 ========= */
  /* 底部输入栏外圈盒子背景颜色 */
  background: #1D1E1F;
  /* 输入栏上方与聊天栏分割线颜色 */
  border-top-color: #29292A;
}
.chat-input {
  /* ========= 可自定义：底部聊天栏（浅色模式）背景颜色 ========= */
  position: sticky;
  bottom: 0;
  display: grid;
  grid-template-columns: 1fr auto;
  grid-template-rows: auto auto;
  gap: 12px;
  padding: 12px 16px;
  background: var(--el-bg-color);
  border-top: 1px solid var(--el-border-color-lighter);
}

/* ========= 可自定义：底部聊天栏按钮颜色（仅聊天区范围） =========
  方式1：通过 Element Plus CSS 变量（推荐，影响范围仅在 chat-input 内）
  - 发送按钮（primary）：修改 --el-color-primary
  - 清空按钮（danger）：修改 --el-color-danger

  例如（取消注释并改颜色值）：
  .chat-input {
    --el-color-primary: #409eff;
    --el-color-danger: #f56c6c;
  }
*/

/* 方式2：精确覆盖按钮样式（需要时再用，取消注释并改颜色值）
  .chat-actions :deep(.el-button--primary) {
    background-color: #409eff;
    border-color: #409eff;
    color: #ffffff;
  }

  .chat-actions :deep(.el-button--danger) {
    background-color: #f56c6c;
    border-color: #f56c6c;
    color: #ffffff;
  }
*/
</style>

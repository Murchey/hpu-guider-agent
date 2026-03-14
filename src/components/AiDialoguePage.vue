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
              <div class="message-text" v-html="formatMessage(msg.content)"></div>
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
              <span>正在思考中...</span>
            </el-card>
          </div>
        </div>
      </div>
      
      <div class="chat-input">
        <el-input
          v-model="inputText"
          type="textarea"
          placeholder="输入消息... (Enter 发送，Shift+Enter 换行)"
          :rows="2"
          :disabled="isLoading"
          @keydown.enter.exact.prevent="handleSend"
          @keydown.shift.enter.prevent="handleNewLine"
        />
        <el-button 
          type="primary" 
          :loading="isLoading"
          :disabled="!inputText.trim() || isLoading"
          @click="handleSend"
        >
          发送
        </el-button>
        <el-button 
          type="danger"
          :disabled="messages.length === 0 || isLoading"
          @click="clearChat"
        >
          清空聊天
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, onMounted, computed } from 'vue'
import { Loading, User, ChatDotRound } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const messages = ref<Message[]>([])
const inputText = ref('')
const isLoading = ref(false)
const messagesRef = ref<HTMLElement | null>(null)

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

const handleSend = async () => {
  const text = inputText.value.trim()
  if (!text || isLoading.value) return

  if (!apiSettings.value.apiKey) {
    ElMessage.warning('请先在设置中配置 API Key')
    return
  }

  messages.value.push({ role: 'user', content: text })
  inputText.value = ''
  await scrollToBottom()

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
        messages: messages.value.map(m => ({
          role: m.role,
          content: m.content
        })),
        stream: false
      }
    } else if (provider === 'qwen') {
      headers['Authorization'] = `Bearer ${apiKey}`
      requestData = {
        model: model,
        messages: messages.value.map(m => ({
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: m.content
        })),
        stream: false
      }
    } else {
      headers['Authorization'] = `Bearer ${apiKey}`
      requestData = {
        model: model,
        messages: messages.value.map(m => ({
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

onMounted(() => {
  loadSettings()
})
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
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
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

.message-card.user {
  background: #409eff;
  border-color: #409eff;
}

.message-card.assistant {
  background: var(--el-bg-color);
}

.message-text {
  color: #303133;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}

.message-card.user .message-text {
  color: #fff;
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

.chat-input {
  display: flex;
  gap: 10px;
  padding: 15px 20px;
  background: var(--el-bg-color);
  border-top: 1px solid var(--el-border-color-lighter);
}

.chat-input .el-textarea {
  flex: 1;
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

html.dark .message-card {
  background: #1d2a4d;
  border-color: #0f3460;
}

html.dark .message-text {
  color: #e4e7ed;
}

html.dark .chat-input {
  background: #1a1a1a;
  border-top-color: #0f3460;
}

html.dark .chat-input .el-textarea__inner {
  background: #1d2a4d;
  border-color: #0f3460;
  color: #e4e7ed;
}
</style>

<template>
  <div class="ai-dialogue-page">
    <div class="chat-container">
      <div class="chat-messages" ref="messagesRef">
        <div v-if="messages.length === 0 && !isSettingsLoaded" class="empty-tip">
          <el-empty :image="agentIcon" :image-size="200" description="加载设置中..." />
        </div>
        <div v-else-if="messages.length === 0" class="empty-tip">
          <el-empty :image="agentIcon" :image-size="200" :description="welcomeMessage">
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
              {{ msg.role === 'user' ? '你' : '文途智行' }}
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
              <span>文途智行正在思考中...</span>
            </el-card>
          </div>
        </div>
      </div>
      
      <div class="chat-input">
        <div class="chat-toolbar">
          <span>工作模式：</span>
            <div class="mode-change-btn">
              <el-segmented v-model="modeValue" :options="modeOptions" />
            </div>
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
    <!-- 单选卡 -->
    <el-dialog
      v-model="sceneDialogVisible"
      title="请选择下列选项"
      width="900px"
      center
      append-to-body
      class="scene-dialog"
      draggable
    >
      <el-card v-if="sceneButtons.description" class="dialog-desc-card">
        <div class="dialog-desc-text">{{ sceneButtons.description }}</div>
      </el-card>
      <div class="scene-buttons-container">
        <el-button 
          v-if="sceneButtons.btn1" 
          type="primary" 
          plain 
          class="scene-btn" 
          @click="handleSceneButtonClick(1, sceneButtons.btn1)"
        >
          {{ sceneButtons.btn1 }}
        </el-button>
        <el-button 
          v-if="sceneButtons.btn2" 
          type="primary" 
          plain 
          class="scene-btn" 
          @click="handleSceneButtonClick(2, sceneButtons.btn2)"
        >
          {{ sceneButtons.btn2 }}
        </el-button>
        <el-button 
          v-if="sceneButtons.btn3" 
          type="primary" 
          plain 
          class="scene-btn" 
          @click="handleSceneButtonClick(3, sceneButtons.btn3)"
        >
          {{ sceneButtons.btn3 }}
        </el-button>
      </div>
    </el-dialog>

    <!-- 多选推荐对话框 -->
    <el-dialog
      v-model="selectDialogVisible"
      title="请从以下选项中选择"
      width="900px"
      center
      append-to-body
      class="select-dialog"
      draggable
    >
      <el-card v-if="selectDescription" class="dialog-desc-card">
        <div class="dialog-desc-text">{{ selectDescription }}</div>
      </el-card>
      <div class="select-options-container">
        <el-checkbox-group v-model="selectedValues" class="select-checkbox-group">
          <el-checkbox 
            v-for="option in selectOptions" 
            :key="option" 
            :label="option" 
            class="select-checkbox-item"
          >
            {{ option }}
          </el-checkbox>
        </el-checkbox-group>
        <div class="select-dialog-footer">
          <el-button @click="selectDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSelectConfirm" :disabled="selectedValues.length === 0">确认选择</el-button>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, onMounted, computed, watch } from 'vue'
import { Loading, User, ChatDotRound } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'
import MarkdownIt from 'markdown-it'
import agentIcon from '../assets/agent_icon.jpg'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const props = defineProps<{
  activeTab?: string
}>()

const messages = ref<Message[]>([])
const inputText = ref('')
const isLoading = ref(false)
const messagesRef = ref<HTMLElement | null>(null)

// 场景推荐对话框状态
const sceneDialogVisible = ref(false)
const sceneButtons = ref({
  description: '',
  btn1: '',
  btn2: '',
  btn3: ''
})

// 多选弹窗状态
const selectDialogVisible = ref(false)
const selectOptions = ref<string[]>([])
const selectDescription = ref('')
const selectedValues = ref<string[]>([])

const modeValue = ref('互动问答')

const modeOptions = ['互动问答', '景点介绍']

const modeOptionsBtnGroup = computed(() => {
  if (modeValue.value === '互动问答') return 'model：智能导游\n工作模式（task_type）：互动问答\n'
  if (modeValue.value === '景点介绍') return 'model：智能导游\n工作模式（task_type）：景点介绍\n'
  return ''
})

const apiSettings = ref({
  provider: 'openai',
  baseURL: '',
  apiKey: '',
  model: 'gpt-3.5-turbo',
  botId: ''
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
  coze: {
    baseURL: 'https://api.coze.cn',
    model: '',
    name: 'Coze'
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
  return `与 文途智行 开始对话`
})

const loadSettings = () => {
  const saved = localStorage.getItem('ai-chat-settings')
  if (saved) {
    try {
      const parsed = JSON.parse(saved)
      console.log('加载到的 API 配置:', { ...parsed, apiKey: parsed.apiKey ? '***' : '未设置' })
      apiSettings.value = { ...apiSettings.value, ...parsed }
      isSettingsLoaded.value = true
    } catch (e) {
      console.error('加载设置失败', e)
    }
  }
  isSettingsLoaded.value = true
}

const md = new MarkdownIt({
  html: true,
  linkify: true,
  breaks: true
})

md.renderer.rules.link_open = function (tokens: any[], idx: number, options: any, env: any, self: any) {
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

// 场景推荐按钮点击处理函数 (占位)
const handleSceneButtonClick = (btnIndex: number, btnText: string) => {
  console.log(`点击了场景按钮 ${btnIndex}: ${btnText}`)
  sceneDialogVisible.value = false
  
  // 隐藏发送用户的选择，格式为 JSON 字符串
  const hiddenPrompt = `model:景点推荐\n[USER_CHOICE]{"value": "${btnText}"}[/USER_CHOICE]\n`
  handleSendHidden(hiddenPrompt).catch(err => {
    ElMessage.error('发送选择失败: ' + err.message)
  })
}

// 多选弹窗确认处理函数 (占位)
const handleSelectConfirm = () => {
  console.log('用户选择了:', selectedValues.value)
  const selections = [...selectedValues.value]
  selectDialogVisible.value = false
  
  // 隐藏发送用户的选择，格式为 JSON 数组
  const hiddenPrompt = `model:确定游览方案\n[USER_CHOICE]{"values": ${JSON.stringify(selections)}}[/USER_CHOICE]`
  handleSendHidden(hiddenPrompt).catch(err => {
    ElMessage.error('发送选择失败: ' + err.message)
  })
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

  // 每次发送前重新加载一次设置，确保读取到最新的 API Key
  loadSettings()

  if (!apiSettings.value.apiKey) {
    ElMessage.warning('请先在设置中配置 API Key')
    return
  }

  // 如果是隐藏发送（如画像），则不将其直接推入对话列表，但需要包含在请求中
  const currentMessages = [...messages.value]
  const requestMessages = currentMessages.map(m => ({
    role: m.role,
    content: m.content
  }))
  
  // 将当前消息加入请求列表
  requestMessages.push({ role: 'user', content: text })

  if (showUserMessage) {
    messages.value.push({ role: 'user', content: text })
    await scrollToBottom()
  }

  isLoading.value = true

  try {
    const { baseURL, apiKey, model, provider, botId } = apiSettings.value
    
    let finalBaseURL = baseURL || providerConfigs[provider]?.baseURL || ''
    if (!finalBaseURL) {
      throw new Error('API 地址不能为空，请在设置中配置正确的 API 地址')
    }

    // 格式化 URL，移除结尾的斜杠和冗余的 /v3/chat
    finalBaseURL = finalBaseURL.replace(/\/+$/, '').replace(/\/v3\/chat$/, '')

    let aiContent = ''

    if (provider === 'coze') {
      if (!botId) {
        throw new Error('Coze 模式下必须配置 Bot ID')
      }
      
      // Coze v3 chat API
      const chatResponse = await axios.post(
        `${finalBaseURL}/v3/chat`,
        {
          bot_id: botId,
          user_id: 'user_' + Math.random().toString(36).substr(2, 9),
          additional_messages: [{
            role: 'user',
            content: text,
            content_type: 'text'
          }],
          stream: false
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 1200000 // 延长至 20 分钟
        }
      )

      const chatData = chatResponse.data.data
      if (!chatData || !chatData.id) {
        throw new Error('Coze 对话创建失败: ' + JSON.stringify(chatResponse.data))
      }

      const chatId = chatData.id
      const conversationId = chatData.conversation_id

      // 轮询查询对话状态
      let status = 'in_progress'
      let pollCount = 0
      while (status === 'in_progress' && pollCount < 1200) { // 轮询上限也增加到 20 分钟 (1200秒)
        await new Promise(resolve => setTimeout(resolve, 1000))
        const retrieveRes = await axios.get(
          `${finalBaseURL}/v3/chat/retrieve?chat_id=${chatId}&conversation_id=${conversationId}`,
          {
            headers: { 'Authorization': `Bearer ${apiKey}` },
            timeout: 30000 // 单次查询超时 30s
          }
        )
        status = retrieveRes.data.data.status
        pollCount++
      }

      if (status === 'completed') {
        const messageListRes = await axios.get(
          `${finalBaseURL}/v3/chat/message/list?chat_id=${chatId}&conversation_id=${conversationId}`,
          {
            headers: { 'Authorization': `Bearer ${apiKey}` },
            timeout: 60000 // 获取列表超时 60s
          }
        )
        const assistantMsg = messageListRes.data.data.find((m: any) => m.role === 'assistant' && m.type === 'answer')
        aiContent = assistantMsg ? assistantMsg.content : '未找到回复内容'
      } else {
        throw new Error('Coze 对话超时或失败: ' + status)
      }

    } else {
      // OpenAI 兼容 API
      let headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      }

      const requestData = {
        model: model,
        messages: requestMessages,
        stream: false
      }

      const response = await axios.post(
        `${finalBaseURL}/chat/completions`,
        requestData,
        {
          headers,
          timeout: 1200000 // 延长至 20 分钟
        }
      )

      aiContent = response.data.choices?.[0]?.message?.content || ''
    }

    if (!aiContent) {
      aiContent = 'AI 未返回有效回复'
    }

    // 解析场景推荐数据 [SCENE_DATA]{...}[/SCENE_DATA]
    // 包含对话框弹出逻辑
    const sceneDataMatch = aiContent.match(/\[SCENE_DATA\]([\s\S]*?)\[\/SCENE_DATA\]/)
    if (sceneDataMatch) {
      try {
        const rawJson = sceneDataMatch[1]
        const parsedData = JSON.parse(rawJson)
        sceneButtons.value = {
          description: parsedData.description || '',
          btn1: parsedData.btn1 || '',
          btn2: parsedData.btn2 || '',
          btn3: parsedData.btn3 || ''
        }
        sceneDialogVisible.value = true
        // 清理显示内容中的原始标签
        aiContent = aiContent.replace(/\[SCENE_DATA\][\s\S]*?\[\/SCENE_DATA\]/, '').trim()
      } catch (e) {
        console.error('解析 SCENE_DATA 失败:', e)
      }
    }

    // 解析多选推荐数据 [SELECT_DATA]{"options": ["A", "B"]}[/SELECT_DATA]
    const selectDataMatch = aiContent.match(/\[SELECT_DATA\]([\s\S]*?)\[\/SELECT_DATA\]/)
    if (selectDataMatch) {
      try {
        const rawJson = selectDataMatch[1]
        const parsedData = JSON.parse(rawJson)
        if (Array.isArray(parsedData.options)) {
          selectOptions.value = parsedData.options
          selectDescription.value = parsedData.description || ''
          selectedValues.value = [] // 重置选择
          selectDialogVisible.value = true
          // 清理显示内容中的原始标签
          aiContent = aiContent.replace(/\[SELECT_DATA\][\s\S]*?\[\/SELECT_DATA\]/, '').trim()
        }
      } catch (e) {
        console.error('解析 SELECT_DATA 失败:', e)
      }
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
  const prefix = modeOptionsBtnGroup.value
  const prefixedText = prefix && !text.startsWith(`${prefix}\n`) ? `${prefix}\n${text}` : text
  await sendMessage(prefixedText, true)
}

const handleSendHidden = async (text: string) => {
  if (isLoading.value) {
    throw new Error('AI 正在处理上一条消息，请稍后')
  }
  await sendMessage(text, false)
}

onMounted(async () => {
  await loadSettings()
  await nextTick()
  await new Promise(resolve => setTimeout(resolve, 300))
  checkAndSendUserProfile()
  checkAndSendSocialRequest()
})

watch(() => props.activeTab, (newTab) => {
  if (newTab === 'aiDialogue') {
    loadSettings() // 切换到 AI 页面时重新加载配置
    checkAndSendUserProfile()
    checkAndSendSocialRequest()
  }
})

const checkAndSendSocialRequest = () => {
  const socialPrompt = localStorage.getItem('social-post-request')
  if (socialPrompt) {
    sendSocialRequestWithRetry(socialPrompt)
  }
}

const sendSocialRequestWithRetry = async (prompt: string) => {
  const maxRetries = 5
  for (let i = 0; i < maxRetries; i++) {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000 + i * 800))
      await handleSendHidden(prompt)
      localStorage.removeItem('social-post-request')
      console.log('社交发布请求发送成功')
      return true
    } catch (error) {
      console.error(`发送社交发布请求失败，第 ${i + 1} 次尝试:`, error)
    }
  }
  return false
}

const checkAndSendUserProfile = () => {
  const savedForm = localStorage.getItem('user-profile-form')
  if (savedForm) {
    try {
      const formData = JSON.parse(savedForm)
      
      const prompt = `model:用户画像\n
                      请根据以下用户画像信息，生成一个详细的用户画像总结，后续对话时用于推荐旅游景点：\n
                      1. 旅行人数（travelNumber）: ${formData.travelNumber || '未填写'} 人\n
                      2. 旅行天数（travelDays）: ${formData.travelDays || '未填写'} 天\n
                      3. 旅行预算（travelBudget）: ${formData.travelBudget || '未填写'} 元\n
                      4. 出行风格（travelStyle）: ${formData.travelStyle || '未填写'}\n
                      5. 行程核心关注点（travelFocus）: ${Array.isArray(formData.travelFocus) ? formData.travelFocus.join('、') : (formData.travelFocus || '未填写')}\n
                      6. 个性化出行习惯（customHabit）: ${(Array.isArray(formData.customHabit) ? formData.customHabit.join('、') : (formData.customHabit || '未填写')) + '。' + formData.additionalRequirements}\n
                      7. 出发日期（startDate）: ${formData.startDate || '未填写'}\n
                      8. 出行方式（travelMethod）: ${formData.travelMethod || '未填写'}\n
                      9. 出发地（originPlace）: ${formData.originPlace || '未填写'}\n
                      请调用你的工作流进行用户喜好分析，下面的对话内容要基于此进行。明白回复我：我已读取用户画像，下面根据你的喜好进行对话咨询。`
      
      sendUserProfileWithRetry(prompt, formData)
    } catch (e) {
      console.error('加载用户画像失败', e)
    }
  }
}

const sendUserProfileWithRetry = async (prompt: string, formData: any) => {
  const maxRetries = 5
  for (let i = 0; i < maxRetries; i++) {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000 + i * 800))
      await handleSendHidden(prompt)
      localStorage.removeItem('user-profile-form')
      console.log('用户画像发送成功')
      return true
    } catch (error) {
      console.error(`发送用户画像失败，第 ${i + 1} 次尝试:`, error)
      if (i === maxRetries - 1) {
        console.error('用户画像发送最终失败，数据保留在 localStorage 中')
      }
    }
  }
  return false
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
  word-break: break-word;
}

.message-text :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  margin: 8px 0;
  display: block;
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

/* 空白状态图片样式：圆角效果 */
.empty-tip :deep(.el-empty__image img) {
  border-radius: 45px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* 暗色模式下给空白状态图片设置偏黑色遮罩效果 */
html.dark .empty-tip :deep(.el-empty__image img) {
  filter: brightness(0.5) contrast(1.2);
  opacity: 0.8;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
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

.scene-buttons-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 10px 0;
}

.scene-btn {
  width: 100%;
  margin-left: 0 !important;
  font-size: 16px;
  padding: 20px 0;
  border-radius: 8px;
}

.scene-dialog :deep(.el-dialog__header) {
  margin-bottom: 0;
}

.scene-dialog :deep(.el-dialog__title) {
  font-weight: bold;
  color: var(--el-color-primary);
}

.dialog-desc-card {
  margin-bottom: 20px;
  background-color: var(--el-fill-color-light);
  border: none;
}

.dialog-desc-text {
  font-size: 15px;
  line-height: 1.6;
  color: var(--el-text-color-primary);
  white-space: pre-wrap;
}

.select-options-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-height: 450px;
  overflow-y: auto;
  padding-right: 8px;
}

/* 优化多选列表滚动条样式 */
.select-options-container::-webkit-scrollbar {
  width: 6px;
}

.select-options-container::-webkit-scrollbar-thumb {
  background-color: var(--el-border-color-darker);
  border-radius: 3px;
}

.select-options-container::-webkit-scrollbar-track {
  background-color: transparent;
}

.select-checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.select-checkbox-item {
  width: 100%;
  margin-left: 0 !important;
  margin-right: 0 !important;
  height: auto !important;
  padding: 12px 20px !important;
}

.select-dialog-footer {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 10px;
}

.select-dialog :deep(.el-dialog__title) {
  font-weight: bold;
  color: var(--el-color-primary);
}
</style>

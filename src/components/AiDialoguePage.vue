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
            <div v-if="msg.imageUrl" class="message-image-wrapper">
              <el-image 
                :src="msg.imageUrl" 
                class="message-image" 
                fit="cover" 
                :preview-src-list="[msg.imageUrl]"
              />
            </div>
            <el-card class="message-card" :class="msg.role">
              <div v-if="editingIndex === index" class="message-edit-area">
                <el-input
                  v-model="editingText"
                  type="textarea"
                  :autosize="{ minRows: 1, maxRows: 10 }"
                  class="edit-input"
                />
                <div class="edit-actions">
                  <el-button size="small" @click="cancelEdit">取消</el-button>
                  <el-button size="small" type="primary" @click="submitEdit(index)">提交并重发</el-button>
                </div>
              </div>
              <div v-else class="message-text" v-html="msg.role === 'assistant' ? formatAssistantMessage(msg.content) : formatMessage(msg.content)"></div>
              <div v-if="msg.role === 'assistant' && hasMapData(msg.content)" class="map-action-wrapper">
                <el-button 
                  type="success" 
                  size="small" 
                  round 
                  :icon="Picture"
                  @click="goToMap(msg.content)"
                >
                  转到地图
                </el-button>
              </div>
            </el-card>
            <div v-if="editingIndex !== index" class="message-tools">
              <el-tooltip content="复制" placement="bottom">
                <el-button link :icon="CopyDocument" @click.stop="handleCopy(msg.content)" />
              </el-tooltip>
              <el-tooltip v-if="msg.role === 'user'" content="修改" placement="bottom">
                <el-button link :icon="Edit" @click.stop="startEdit(index, msg.content)" />
              </el-tooltip>
              <el-tooltip content="删除" placement="bottom">
                <el-button link :icon="DeleteIcon" @click.stop="handleDeleteMessage(index)" />
              </el-tooltip>
            </div>
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
          <el-button
            class="chat-toolbar-history"
            type="info"
            plain
            size="small"
            @click="drawer = true"
          >
            <el-icon><Memo /></el-icon>
            对话历史
          </el-button>
          <span>工作模式：</span>
            <div class="mode-change-btn">
              <el-segmented v-model="modeValue" :options="modeOptions" />
            </div>
          <el-upload
            class="chat-toolbar-upload"
            action="#"
            :auto-upload="false"
            :show-file-list="false"
            accept="image/*"
            :on-change="handleFileChange"
            :disabled="isLoading"
          >
            <el-button
              type="primary"
              :disabled="isLoading"
              size="small"
            >
              <el-icon><Picture /></el-icon>
              上传图片
            </el-button>
          </el-upload>
          <el-button
            class="chat-toolbar-clear"
            type="danger"
            :disabled="messages.length === 0 || isLoading"
            @click="clearChat"
          >
            清空聊天
          </el-button>
        </div>
        <div v-if="uploadedImageUrl" class="image-preview-container">
          <div class="image-preview-wrapper">
            <el-image 
              :src="uploadedImageUrl" 
              class="image-preview" 
              fit="cover"
              :preview-src-list="[uploadedImageUrl]"
            />
            <el-icon class="remove-image-btn" @click="removeUploadedImage"><CircleClose /></el-icon>
          </div>
          <div v-if="isUploadingImage" class="upload-loading-overlay">
            <el-icon class="is-loading"><Loading /></el-icon>
            <span>上传中...</span>
          </div>
        </div>
        <div class="chat-input-row">
          <div class="chat-textarea">
            <el-input
              v-model="inputText"
              type="textarea"
              placeholder="输入消息... (Enter 发送，Shift+Enter 换行)"
              :autosize="{ minRows: 2, maxRows: 6 }"
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
    <!-- 单选卡 -->
    <el-dialog
      v-model="sceneDialogVisible"
      title="请选择下列选项"
      :width="dialogWidth"
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
      :width="dialogWidth"
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

    <!-- 对话历史抽屉 -->
    <el-drawer
      v-model="drawer"
      title="对话历史"
      :direction="direction"
      size="300px"
    >
      <div class="drawer-content">
        <div class="new-chat-container">
          <el-button type="primary" plain class="new-chat-btn" :icon="Plus" @click="handleNewChat">
            新建文途智行对话
          </el-button>
        </div>
        <el-divider content-position="center">历史记录</el-divider>
        <div class="history-list">
          <div 
            v-for="session in chatStore.sessions" 
            :key="session.id"
            class="history-item"
            :class="{ active: chatStore.currentSessionId === session.id }"
            @click="handleSelectSession(session.id)"
          >
            <div class="history-item-content">
              <el-icon><ChatDotRound /></el-icon>
              <span class="history-item-title">{{ session.title }}</span>
            </div>
            <div class="history-item-actions">
              <el-button 
                type="primary" 
                link 
                :icon="Edit" 
                class="history-action-btn"
                @click.stop="handleRenameSession(session.id, session.title)"
              />
              <el-button 
                type="danger" 
                link 
                :icon="CircleClose" 
                class="history-action-btn"
                @click.stop="handleDeleteSession(session.id)"
              />
            </div>
          </div>
          <el-empty v-if="chatStore.sessions.length === 0" description="暂无对话历史" :image-size="80" />
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, onMounted, onUnmounted, computed, watch } from 'vue'
import { Loading, User, ChatDotRound, Picture, CircleClose, Memo, Plus, CopyDocument, Edit, Delete as DeleteIcon } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'
import DOMPurify from 'dompurify'
import MarkdownIt from 'markdown-it'
import agentIcon from '../assets/agent_icon.jpg'
import { useChatStore } from '../stores/chatStore'

interface Message {
  role: 'user' | 'assistant'
  content: string
  imageUrl?: string
}

const props = defineProps<{
  activeTab?: string
}>()

const emit = defineEmits<{
  (e: 'navigate', tabName: string): void
}>()

const chatStore = useChatStore()
const messages = computed(() => chatStore.currentSession?.messages || [])

// 监听消息变化，自动滚动到底部
watch(messages, () => {
  scrollToBottom()
}, { deep: true })

const inputText = ref('')
const isLoading = ref(false)
const messagesRef = ref<HTMLElement | null>(null)

// 消息编辑相关
const editingIndex = ref<number | null>(null)
const editingText = ref('')

const startEdit = (index: number, content: string) => {
  editingIndex.value = index
  editingText.value = content
}

const cancelEdit = () => {
  editingIndex.value = null
  editingText.value = ''
}

const submitEdit = async (index: number) => {
  const text = editingText.value.trim()
  if (!text || isLoading.value) return
  
  // 修改并截断对话
  chatStore.editMessageAndTruncate(index, text)
  editingIndex.value = null
  editingText.value = ''
  
  // 重新发送
  await sendMessage(text, true)
}

const handleCopy = (content: string) => {
  navigator.clipboard.writeText(content).then(() => {
    ElMessage.success('已复制到剪贴板')
  }).catch(() => {
    ElMessage.error('复制失败')
  })
}

const handleDeleteMessage = (index: number) => {
  ElMessageBox.confirm('确定要删除这条消息吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    chatStore.deleteMessage(index)
    ElMessage.success('消息已删除')
  }).catch(() => {})
}

// 图片上传相关
const uploadedImageUrl = ref('')
const uploadedFileId = ref('')
const isUploadingImage = ref(false)

const readFileAsDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    const result = e.target?.result
    if (typeof result === 'string') {
      resolve(result)
      return
    }
    reject(new Error('图片读取失败'))
  }
  reader.onerror = () => reject(new Error('图片读取失败'))
  reader.readAsDataURL(file)
})

const removeUploadedImage = () => {
  if (uploadedImageUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(uploadedImageUrl.value)
  }
  uploadedImageUrl.value = ''
  uploadedFileId.value = ''
}

const getOrCreateCozeUserId = () => {
  let userId = localStorage.getItem('coze_user_id')
  if (!userId) {
    userId = 'user_' + Math.random().toString(36).slice(2, 11)
    localStorage.setItem('coze_user_id', userId)
  }
  return userId
}

const extractResponseText = (payload: any) => {
  return payload?.choices?.[0]?.message?.content
    || payload?.choices?.[0]?.delta?.content
    || payload?.data?.content
    || payload?.message?.content
    || payload?.content
    || ''
}

const handleFileChange = async (file: any) => {
  const rawFile = file.raw
  if (!rawFile) return

  // 限制图片大小 10MB
  if (rawFile.size / 1024 / 1024 > 10) {
    ElMessage.error('图片大小不能超过 10MB')
    return
  }

  // 根据模式处理图片
  const { imageMode, provider, baseURL } = apiSettings.value
  const isCoze = provider === 'coze' || imageMode === 'coze' || (baseURL && (baseURL.includes('coze.cn') || baseURL.includes('coze.com')))
  
  if (isCoze) {
    try {
      uploadedImageUrl.value = await readFileAsDataUrl(rawFile)
      await uploadImageToCoze(rawFile)
    } catch (error: any) {
      console.error('处理 Coze 图片失败:', error)
      removeUploadedImage()
      ElMessage.error(error.message || '图片处理失败')
    }
  } else {
    // Base64 模式 (适配硅基流动等)
    isUploadingImage.value = true
    try {
      const base64 = await readFileAsDataUrl(rawFile)
      uploadedImageUrl.value = base64
      uploadedFileId.value = base64 // 在 base64 模式下，直接存 base64 字符串
      ElMessage.success('图片已就绪')
    } catch (error: any) {
      ElMessage.error(error.message)
    } finally {
      isUploadingImage.value = false
    }
  }
}

const uploadImageToCoze = async (file: File) => {
  if (!apiSettings.value.apiKey) {
    ElMessage.warning('上传图片需要先配置 API Key')
    return
  }

  isUploadingImage.value = true
  try {
    const { baseURL, apiKey } = apiSettings.value
    // Coze 文件上传地址固定为 /v1/files/upload
    const uploadURL = baseURL.replace(/\/v3\/chat$/, '').replace(/\/+$/, '') + '/v1/files/upload'
    
    const formData = new FormData()
    formData.append('file', file)

    const response = await axios.post(uploadURL, formData, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'multipart/form-data'
      }
    })

    if (response.data && response.data.data && response.data.data.id) {
      uploadedFileId.value = response.data.data.id
      ElMessage.success('图片上传成功')
    } else {
      throw new Error(response.data.msg || '上传失败')
    }
  } catch (error: any) {
    console.error('上传图片到 Coze 失败:', error)
    ElMessage.error('上传图片失败: ' + (error.response?.data?.msg || error.message))
    removeUploadedImage()
  } finally {
    isUploadingImage.value = false
  }
}

// 响应式判断
const isMobile = ref(false)
const checkMobile = () => {
  isMobile.value = window.innerWidth <= 768
}

const dialogWidth = computed(() => isMobile.value ? '95%' : '900px')
const emptyImageSize = computed(() => isMobile.value ? 140 : 250) // 针对 375x812 屏幕下调尺寸，避免遮挡输入框

// 场景推荐对话框状态
const sceneDialogVisible = ref(false)
const sceneButtons = ref({
  description: '',
  btn1: '',
  btn2: '',
  btn3: ''
})

// 侧边栏抽屉状态
const drawer = ref(false)
const direction = ref('ltr')

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
  botId: '',
  imageMode: 'base64'
})

const isSettingsLoaded = ref(false)

const providerConfigs: Record<string, { baseURL: string; model: string; name: string; imageMode?: string }> = {
  openai: {
    baseURL: 'https://api.openai.com/v1',
    model: 'gpt-3.5-turbo',
    name: 'OpenAI',
    imageMode: 'base64'
  },
  siliconflow: {
    baseURL: 'https://api.siliconflow.cn/v1',
    model: 'Qwen/Qwen2.5-7B-Instruct',
    name: '硅基流动',
    imageMode: 'base64'
  },
  coze: {
    baseURL: 'https://api.coze.cn',
    model: '',
    name: 'Coze',
    imageMode: 'coze'
  },
  custom: {
    baseURL: '',
    model: '',
    name: '自定义',
    imageMode: 'base64'
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
      
      // 兼容旧配置：如果没设置 imageMode，根据 provider 给默认值
      if (!apiSettings.value.imageMode) {
        apiSettings.value.imageMode = apiSettings.value.provider === 'coze' ? 'coze' : 'base64'
      }
      
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
  // 移除地图数据标签后再渲染，避免显示原始标签
  const cleanText = text.replace(/\[MAP_DATA\][\s\S]*?\[\/MAP_DATA\]/g, '').trim()
  return DOMPurify.sanitize(md.render(cleanText))
}

const hasMapData = (text: string) => {
  return /\[MAP_DATA\][\s\S]*?\[\/MAP_DATA\]/.test(text)
}

const goToMap = (text: string) => {
  const match = text.match(/\[MAP_DATA\]([\s\S]*?)\[\/MAP_DATA\]/)
  if (match) {
    try {
      let rawJson = match[1].trim()
      
      // 1. 移除可能存在的 Markdown 代码块包裹
      if (rawJson.includes('```')) {
        rawJson = rawJson.replace(/```[a-z]*\n?/gi, '').replace(/\n?```/gi, '').trim()
      }
      
      // 2. 移除可能的非法字符（如末尾的多余逗号或文字）
      rawJson = rawJson.replace(/,(\s*[}\]])/g, '$1') // 移除末尾逗号
      
      const mapData = JSON.parse(rawJson)
      chatStore.currentMapData = mapData
      emit('navigate', 'mapPlanning')
    } catch (e) {
      console.error('解析地图数据失败:', e, '\n原始数据:', match[1])
      ElMessage.error('解析地图数据失败，请检查 AI 输出格式')
    }
  }
}

const handleNewLine = () => {
  inputText.value += '\n'
}

// 场景推荐按钮点击处理函数 (占位)
const handleSceneButtonClick = (btnIndex: number, btnText: string) => {
  console.log(`点击了场景按钮 ${btnIndex}: ${btnText}`)
  sceneDialogVisible.value = false
  
  // 隐藏发送用户的选择，格式为 JSON 字符串
  const hiddenPrompt = `[USER_CHOICE]{"value": "${btnText}"}[/USER_CHOICE]\n`
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
  
  ElMessageBox.confirm('确定要清空当前聊天记录吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    chatStore.updateMessages([])
    ElMessage.success('聊天记录已清空')
  }).catch(() => {})
}

// 侧边栏操作
const handleNewChat = () => {
  chatStore.createNewChat()
  drawer.value = false
  ElMessage.success('已开启新对话')
}

const handleSelectSession = (id: string) => {
  chatStore.switchChat(id)
  drawer.value = false
  scrollToBottom()
}

const handleRenameSession = (id: string, oldTitle: string) => {
  ElMessageBox.prompt('请输入新的对话标题', '重命名对话', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    inputValue: oldTitle,
    inputPattern: /\S+/,
    inputErrorMessage: '标题不能为空'
  }).then(({ value }) => {
    chatStore.renameChat(id, value)
    ElMessage.success('重命名成功')
  }).catch(() => {})
}

const handleDeleteSession = (id: string) => {
  chatStore.deleteChat(id)
}

let currentAbortController: AbortController | null = null

const sendMessage = async (text: string, showUserMessage: boolean) => {
  if (!text || isLoading.value) return

  // 确保有一个活跃的会话
  if (!chatStore.currentSession) {
    chatStore.createNewChat()
  }

  // 每次发送前重新加载一次设置，确保读取到最新的 API Key
  loadSettings()

  if (!apiSettings.value.apiKey) {
    ElMessage.warning('请先在设置中配置 API Key')
    return
  }

  // 中断之前可能仍在进行的请求
  if (currentAbortController) {
    currentAbortController.abort()
  }
  const abortController = new AbortController()
  currentAbortController = abortController
  const signal = abortController.signal

  // 如果是隐藏发送（如画像），则不将其直接推入对话列表，但需要包含在请求中
  const currentMessages = [...messages.value]
  const requestMessages = currentMessages.map(m => ({
    role: m.role,
    content: m.content
  }))
  
  // 将当前消息加入请求列表
  requestMessages.push({ role: 'user', content: text })

  // 记录本次发送的图片（如果有）
  const currentImageUrl = uploadedImageUrl.value
  const currentFileId = uploadedFileId.value
  
  // 清除输入区图片状态
  uploadedImageUrl.value = ''
  uploadedFileId.value = ''

  const newMessages = [...messages.value]

  if (showUserMessage) {
    newMessages.push({ 
      role: 'user', 
      content: text,
      imageUrl: currentImageUrl 
    })
    chatStore.updateMessages(newMessages)
    await scrollToBottom()
  }

  // 先在列表中推入一个空的助手回复，用于流式更新
  newMessages.push({ role: 'assistant', content: '' })
  chatStore.updateMessages(newMessages)
  const assistantMsgIndex = newMessages.length - 1
  
  isLoading.value = true

  try {
    const { baseURL, apiKey, model, provider, botId, imageMode } = apiSettings.value
    
    let finalBaseURL = baseURL || providerConfigs[provider]?.baseURL || ''
    if (!finalBaseURL) {
      throw new Error('API 地址不能为空，请在设置中配置正确的 API 地址')
    }

    // 格式化 URL，移除可能误填的具体接口路径
    finalBaseURL = finalBaseURL.replace(/\/+$/, '').replace(/\/v3\/chat$/, '').replace(/\/chat\/completions$/, '')
    
    const isCoze = provider === 'coze' || imageMode === 'coze' || finalBaseURL.includes('coze.cn') || finalBaseURL.includes('coze.com')

    // 兼容漏填 /v1 的情况（仅针对非 Coze 的标准 OpenAI 接口）
    if (!isCoze && !finalBaseURL.endsWith('/v1') && (finalBaseURL.includes('siliconflow.cn') || finalBaseURL.includes('openai.com'))) {
      finalBaseURL += '/v1'
    }

    let aiContent = ''

    const cleanFastGPTTail = (text: string) => {
      // 过滤掉 FastGPT 等中转可能在末尾塞入的调试 JSON 字符串
      return text.replace(/(?:\n*\{"msg_type".*?\})+$/g, '')
                 .replace(/(?:\n*\{"finish_reason".*?\})+$/g, '')
    }

    const waitForPaint = async () => {
      await nextTick()
      await new Promise(resolve => {
        if (typeof requestAnimationFrame === 'function') {
          requestAnimationFrame(() => resolve(null))
          return
        }
        setTimeout(() => resolve(null), 16)
      })
    }

    const renderAssistantContent = async (content: string) => {
      newMessages[assistantMsgIndex].content = cleanFastGPTTail(content)
      chatStore.updateMessages(newMessages)
      await waitForPaint()
      await scrollToBottom()
    }

    const appendWithTypewriter = async (delta: string) => {
      if (!delta) return

      // Electron 中即便拿到整块响应，也强制按字符/双字符逐帧渲染。
      const step = delta.length > 240 ? 2 : 1

      for (let i = 0; i < delta.length; i += step) {
        aiContent += delta.slice(i, i + step)
        await renderAssistantContent(aiContent)
        await new Promise(resolve => setTimeout(resolve, 18))
      }
    }

    if (isCoze) {
      if (!botId) throw new Error('Coze 模式下必须配置 Bot ID')
      
      // 构建 Coze 多模态内容 (object_string)
      const contentList: any[] = [{ type: 'text', text: text }]
      if (currentFileId) {
        contentList.push({ type: 'image', file_id: currentFileId })
      }

      const additionalMessages = requestMessages.slice(0, -1).map(message => ({
        role: message.role,
        content: message.content,
        content_type: 'text'
      }))

      additionalMessages.push({
        role: 'user',
        content: JSON.stringify(contentList),
        content_type: 'object_string'
      })

      const response = await fetch(`${finalBaseURL}/v3/chat`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream'
        },
        body: JSON.stringify({
          bot_id: botId,
          user_id: getOrCreateCozeUserId(),
          additional_messages: additionalMessages,
          stream: true
        }),
        signal
      })

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(`Coze API 错误: ${response.status} ${JSON.stringify(errData)}`)
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      
      if (!reader) throw new Error('无法读取响应流')

      let buffer = ''
      let currentEvent = ''
      
      while (true) {
        const { done, value } = await reader.read()
        if (done) {
          if (buffer.trim() && !aiContent) {
            try {
              const fallbackData = JSON.parse(buffer.trim())
              if (fallbackData.error || (typeof fallbackData.code !== 'undefined' && fallbackData.code !== 0)) {
                throw new Error(`接口隐式报错: ${JSON.stringify(fallbackData)}`)
              }
              const fallbackText = extractResponseText(fallbackData) || JSON.stringify(fallbackData)
              await appendWithTypewriter(fallbackText)
            } catch (err: any) {
              console.warn('尝试非流式兜底解析失败:', err, buffer)
            }
          }
          break
        }

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          const trimmedLine = line.trim()
          if (!trimmedLine) continue
          
          if (trimmedLine.startsWith('event:')) {
            currentEvent = trimmedLine.slice(6).trim()
          } else if (trimmedLine.startsWith('data:')) {
            const dataContent = trimmedLine.slice(5).trim()
            if (dataContent === '[DONE]') continue
            if (!dataContent) continue

            try {
              const data = JSON.parse(dataContent)
              
              if (
                currentEvent === 'conversation.message.delta'
                || currentEvent === 'conversation.message.completed'
                || !currentEvent
              ) {
                const delta = data.content || data.message?.content || data.choices?.[0]?.delta?.content || ''
                if (delta) {
                  if (currentEvent === 'conversation.message.completed' && aiContent.includes(delta)) {
                    continue
                  }
                  await appendWithTypewriter(delta)
                }
              } else if (currentEvent === 'error' || data.event === 'error' || (typeof data.code !== 'undefined' && data.code !== 0)) {
                const errorMsg = data.msg || data.message || JSON.stringify(data)
                throw new Error(`AI 流式错误: ${errorMsg}`)
              }
            } catch (e: any) {
              if (e.message.includes('AI 流式错误')) throw e
              console.warn('JSON 片段解析失败，可能并非错误:', e.message, dataContent)
            }
          }
        }
      }
    } else {
      // OpenAI 兼容 API 流式 (支持 Base64 多模态)
      let finalMessages: any[] = [...requestMessages]
      
      // 如果有图片，替换最后一条消息为多模态格式
      if (currentFileId && currentFileId.startsWith('data:image')) {
        const lastMsg = finalMessages.pop()
        finalMessages.push({
          role: 'user',
          content: [
            { type: 'text', text: lastMsg?.content || text },
            { 
              type: 'image_url', 
              image_url: { url: currentFileId } 
            }
          ]
        })
      }

      const response = await fetch(`${finalBaseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'Accept': 'text/event-stream'
        },
        body: JSON.stringify({
          model: model,
          messages: finalMessages,
          stream: true
        }),
        signal
      })

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(`API 错误: ${response.status} ${JSON.stringify(errData)} (请求地址: ${finalBaseURL}/chat/completions)`)
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      
      if (!reader) throw new Error('无法读取响应流')

      let buffer = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) {
          if (buffer.trim() && !aiContent) {
            try {
              const fallbackData = JSON.parse(buffer.trim())
              if (fallbackData.error || (typeof fallbackData.code !== 'undefined' && fallbackData.code !== 0)) {
                throw new Error(`接口隐式报错: ${JSON.stringify(fallbackData)}`)
              }
              const fallbackText = extractResponseText(fallbackData) || JSON.stringify(fallbackData)
              await appendWithTypewriter(fallbackText)
            } catch (err: any) {
              console.warn('尝试 OpenAI 兼容接口的非流式兜底解析失败:', err, buffer)
            }
          }
          break
        }

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          const trimmedLine = line.trim()
          if (!trimmedLine || !trimmedLine.startsWith('data:')) continue
          
          const dataStr = trimmedLine.slice(5).trim()
          if (dataStr === '[DONE]') break
          
          try {
            const data = JSON.parse(dataStr)
            const delta = data.choices?.[0]?.delta?.content || ''
            if (delta) {
              await appendWithTypewriter(delta)
            }
          } catch (e: any) {
            console.warn('OpenAI 兼容接口 JSON 片段解析失败，可能并非错误:', e.message, dataStr)
          }
        }
      }
    }

    if (!aiContent) {
      aiContent = 'AI 未返回有效回复'
      newMessages[assistantMsgIndex].content = aiContent
      chatStore.updateMessages(newMessages)
    }

    // 处理解析场景推荐数据 [SCENE_DATA]{...}[/SCENE_DATA]
    // 注意：流式结束后再进行解析，因为标签可能被拆分在不同 chunk 中
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
        newMessages[assistantMsgIndex].content = aiContent.replace(/\[SCENE_DATA\][\s\S]*?\[\/SCENE_DATA\]/, '').trim()
        chatStore.updateMessages(newMessages)
      } catch (e) {
        console.error('解析 SCENE_DATA 失败:', e)
      }
    }

    const selectDataMatch = aiContent.match(/\[SELECT_DATA\]([\s\S]*?)\[\/SELECT_DATA\]/)
    if (selectDataMatch) {
      try {
        const rawJson = selectDataMatch[1]
        const parsedData = JSON.parse(rawJson)
        if (Array.isArray(parsedData.options)) {
          selectOptions.value = parsedData.options
          selectDescription.value = parsedData.description || ''
          selectedValues.value = []
          selectDialogVisible.value = true
          newMessages[assistantMsgIndex].content = aiContent.replace(/\[SELECT_DATA\][\s\S]*?\[\/SELECT_DATA\]/, '').trim()
          chatStore.updateMessages(newMessages)
        }
      } catch (e) {
        console.error('解析 SELECT_DATA 失败:', e)
      }
    }
    
  } catch (error: any) {
    if (error?.name === 'AbortError' || String(error?.message || '').toLowerCase().includes('abort')) {
      console.log('用户中断了上一次请求')
      return
    }
    console.error('发送消息失败:', error)
    let errorMsg = error?.message || String(error)
    if (errorMsg === 'Failed to fetch' || error?.name === 'TypeError') {
      errorMsg = '网络连接中断，请检查网络设置或尝试重新发送。'
    }
    newMessages[assistantMsgIndex].content = `❌ 请求失败：${errorMsg}\n\n请检查设置或网络。`
    chatStore.updateMessages(newMessages)
  } finally {
    isLoading.value = false
    if (currentAbortController === abortController) {
      currentAbortController = null
    }
    await scrollToBottom()
  }
}

const handleSend = async () => {
  const text = inputText.value.trim()
  if (!text || isLoading.value) return
  inputText.value = ''
  
  const enableModePrefix = localStorage.getItem('enable-mode-prefix') !== 'false' // 默认开启
  const prefix = enableModePrefix ? modeOptionsBtnGroup.value : ''
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
  checkMobile()
  window.addEventListener('resize', checkMobile)
  await loadSettings()
  await nextTick()
  await new Promise(resolve => setTimeout(resolve, 300))
  checkAndSendInitialPrompt()
  checkAndSendUserProfile()
  checkAndSendSocialRequest()
  checkAndSendMapConfirm()
})

onUnmounted(() => {
  if (currentAbortController) {
    currentAbortController.abort()
    currentAbortController = null
  }
  removeUploadedImage()
  window.removeEventListener('resize', checkMobile)
})

watch(() => props.activeTab, (newTab) => {
  if (newTab === 'aiDialogue') {
    loadSettings() // 切换到 AI 页面时重新加载配置
    checkAndSendInitialPrompt()
    checkAndSendUserProfile()
    checkAndSendSocialRequest()
    checkAndSendMapConfirm()
  }
})

const checkAndSendMapConfirm = () => {
  const pendingConfirm = localStorage.getItem('pending-map-confirm')
  if (pendingConfirm) {
    sendMapConfirmWithRetry(pendingConfirm)
  }
}

const sendMapConfirmWithRetry = async (message: string) => {
  const maxRetries = 3
  for (let i = 0; i < maxRetries; i++) {
    try {
      await new Promise(resolve => setTimeout(resolve, 800 + i * 500))
      await handleSendHidden(message)
      localStorage.removeItem('pending-map-confirm')
      console.log('行程确认消息发送成功')
      return true
    } catch (error) {
      console.error(`发送行程确认消息失败，第 ${i + 1} 次尝试:`, error)
    }
  }
  return false
}

const checkAndSendInitialPrompt = () => {
  const pendingPrompt = localStorage.getItem('pending-initial-prompt')
  const shouldAutoSend = localStorage.getItem('should-auto-send-prompt') === 'true'
  
  if (pendingPrompt) {
    if (shouldAutoSend) {
      // 只有从设置页面点击按钮过来时，才自动发送
      sendInitialPromptWithRetry(pendingPrompt)
      console.log('检测到跳转指令，开始自动发送提示词')
    } else {
      // 否则（如刚进入软件时），仅填入输入框，不自动发送
      inputText.value = pendingPrompt
      console.log('检测到缓存提示词，已填入输入框')
    }
    // 无论哪种情况，都清除自动发送标记，防止刷新页面重复触发
    localStorage.removeItem('should-auto-send-prompt')
    localStorage.removeItem('pending-initial-prompt')
  }
}

const sendInitialPromptWithRetry = async (prompt: string) => {
  const maxRetries = 3
  for (let i = 0; i < maxRetries; i++) {
    try {
      // 等待设置加载完成
      await new Promise(resolve => setTimeout(resolve, 800 + i * 500))
      await handleSendHidden(prompt)
      console.log('初始化提示词自动发送成功')
      return true
    } catch (error) {
      console.error(`自动发送初始化提示词失败，第 ${i + 1} 次尝试:`, error)
    }
  }
  return false
}

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
  position: relative;
}

.message-tools {
  display: flex;
  gap: 4px;
  margin-top: 4px;
  opacity: 0;
  visibility: hidden;
  transition: all 0.2s;
  padding: 0 4px;
}

.message-item:hover .message-tools {
  opacity: 1;
  visibility: visible;
}

.message-item.user .message-tools {
  justify-content: flex-end;
}

.message-edit-area {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 200px;
}

.edit-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.map-action-wrapper {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px dashed var(--el-border-color-lighter);
  display: flex;
  justify-content: center;
}

@media (max-width: 768px) {
  .chat-messages {
    padding: 10px;
  }
  
  .message-content {
    max-width: 90%;
  }
  
  .chat-input {
    grid-template-columns: 1fr auto;
    gap: 8px;
    padding: 8px 12px;
  }
  
  .chat-toolbar {
    font-size: 12px;
    gap: 8px;
  }
  
  .mode-change-btn :deep(.el-segmented) {
    --el-segmented-item-selected-color: var(--el-color-primary);
  }
  
  .chat-textarea :deep(.el-textarea__inner) {
    font-size: 14px;
    padding: 8px;
  }
  
  .chat-actions .el-button {
    min-width: 60px;
    padding: 8px 12px;
  }
  
  .scene-btn {
    font-size: 14px;
    padding: 15px 0;
  }
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

.message-image-wrapper {
  margin-bottom: 8px;
  max-width: 300px;
}

.message-image {
  width: 100%;
  border-radius: 8px;
  cursor: zoom-in;
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

.chat-input-row {
  display: flex;
  gap: 12px;
  align-items: flex-end;
}

.chat-textarea {
  flex: 1;
}

.chat-toolbar {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.drawer-content {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.new-chat-container {
  padding: 0 16px 16px 16px;
}

.new-chat-btn {
  width: 100%;
  height: 40px;
  font-weight: bold;
}

.toolbar-label {
  font-size: 14px;
  color: var(--el-text-color-regular);
}

.history-list {
  flex: 1;
  overflow-y: auto;
  padding: 0 16px;
}

.history-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  margin-bottom: 8px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  background-color: var(--el-fill-color-light);
  border: 1px solid transparent;
}

.history-item:hover {
  background-color: var(--el-fill-color);
}

.history-item.active {
  background-color: var(--el-color-primary-light-9);
  border-color: var(--el-color-primary);
}

.history-item-content {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.history-item-title {
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--el-text-color-primary);
}

.history-item-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.3s;
}

.history-item:hover .history-item-actions {
  opacity: 1;
}

.history-action-btn {
  padding: 4px;
}

.drawer-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.chat-toolbar-upload :deep(.el-upload) {
  display: flex;
  align-items: center;
}

.chat-toolbar-clear {
  margin-left: auto;
}

.image-preview-container {
  padding: 8px;
  background: var(--el-fill-color-lighter);
  border-radius: 8px;
  margin-bottom: 8px;
  display: flex;
  gap: 8px;
}

.image-preview-wrapper {
  position: relative;
  width: 80px;
  height: 80px;
}

.image-preview {
  width: 100%;
  height: 100%;
  border-radius: 4px;
}

.remove-image-btn {
  position: absolute;
  top: -8px;
  right: -8px;
  cursor: pointer;
  color: var(--el-color-danger);
  background: white;
  border-radius: 50%;
  font-size: 18px;
}

.upload-loading-overlay {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.chat-actions {
  display: flex;
  align-self: flex-end;
}

.chat-actions .el-button {
  margin-left: 0;
  height: 40px;
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
  display: flex;
  flex-direction: column;
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

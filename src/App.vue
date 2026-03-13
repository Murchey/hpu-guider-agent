<template>
  <div class="chat-wrapper" :class="darkMode ? 'dark' : 'light'">
    <el-container class="layout-container">
      <!-- 导航栏 -->
      <el-header class="nav-header">
        <el-menu
          :default-active="activeIndex"
          mode="horizontal"
          :ellipsis="false"
          :router="false"
          class="nav-menu"
        >
          <el-menu-item index="1">首页</el-menu-item>
          <el-menu-item index="2">AI 对话</el-menu-item>
          <el-menu-item index="3">知识库</el-menu-item>
          <el-menu-item index="4">设置</el-menu-item>
        </el-menu>
        
        <div class="header-right">
          <el-button 
            :icon="Setting" 
            circle 
            @click="showSettings = true"
            title="API设置"
          />
          <el-button 
            type="danger" 
            :icon="Delete" 
            circle 
            @click="clearChat"
            title="清空对话"
          />
        </div>
      </el-header>
      
      <el-container class="chat-container">
        <el-container>
          <!-- 对话内容 -->
          <el-main class="chat-main" ref="mainRef">
            <div class="messages-wrapper">
              <!-- 欢迎提示 -->
              <div v-if="messages.length === 0" class="welcome-tip">
                <el-empty :description="welcomeMessage">
                  <el-tag type="success" effect="dark">已连接: {{ currentProvider }}</el-tag>
                </el-empty>
              </div>
              
              <!-- 消息列表 -->
              <div
                v-for="(msg, index) in messages"
                :key="index"
                class="message-item"
                :class="msg.role"
              >
                <div class="message-avatar">
                  <el-avatar :size="40" :icon="msg.role === 'user' ? User : Service" />
                </div>
                <div class="message-content">
                  <div class="message-role">
                    {{ msg.role === 'user' ? '你' : 'HPU智能导游' }}
                  </div>
                  <el-card class="message-card" :class="msg.role">
                    <div class="message-text" v-html="formatMessage(msg.content)"></div>
                  </el-card>
                </div>
              </div>
              
              <!-- 加载状态 -->
              <div v-if="isLoading" class="message-item assistant">
                <div class="message-avatar">
                  <el-avatar :size="40" :icon="Service" />
                </div>
                <div class="message-content">
                  <el-card class="message-card loading-card">
                    <el-icon class="loading-icon"><Loading /></el-icon>
                    <span>AI 正在思考中...</span>
                  </el-card>
                </div>
              </div>
            </div>
          </el-main>
          
          <!-- 输入区域 -->
          <el-footer class="chat-footer">
            <div class="input-wrapper">
              <div class="input-area">
                <el-input
                  v-model="inputText"
                  type="textarea"
                  :autosize="{ minRows: 2, maxRows: 6 }"
                  placeholder="输入消息... (Enter 发送，Shift+Enter 换行)"
                  :disabled="isLoading"
                  @keydown.shift.enter.prevent
                  @keydown.enter.exact.prevent="handleSend"
                />
                <el-button 
                  type="primary" 
                  :icon="Promotion" 
                  :loading="isLoading"
                  :disabled="!inputText.trim() || isLoading"
                  @click="handleSend"
                  class="send-btn"
                >
                  发送
                  <template #suffix>
                    {{ sendHotkeyText }}
                  </template>
                </el-button>
              </div>
            </div>
          </el-footer>
        </el-container>
      </el-container>
    </el-container>
    <!-- API设置对话框 -->
    <el-dialog
      v-model="showSettings"
      title="API 设置"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form :model="apiSettings" label-width="100px">
        <el-form-item label="服务提供商">
          <el-select v-model="apiSettings.provider" @change="handleProviderChange" style="width: 100%">
            <el-option label="OpenAI (兼容API)" value="openai" />
            <el-option label="硅基流动 (SiliconFlow)" value="siliconflow" />
            <el-option label="智谱AI (Zhipu)" value="zhipu" />
            <el-option label="通义千问 (Qwen)" value="qwen" />
            <el-option label="自定义 API" value="custom" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="API 地址">
          <el-input v-model="apiSettings.baseURL" placeholder="留空使用默认地址" />
        </el-form-item>
        
        <el-form-item label="API Key">
          <el-input v-model="apiSettings.apiKey" type="password" show-password placeholder="请输入 API Key" />
        </el-form-item>
        
        <el-form-item label="模型名称">
          <el-input v-model="apiSettings.model" placeholder="如: gpt-3.5-turbo" />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showSettings = false">取消</el-button>
        <el-button type="primary" @click="saveSettings">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>
 
<script setup>
import { ref, nextTick, onMounted, computed } from 'vue'
import { 
  ChatDotRound, 
  Delete, 
  User, 
  Service,
  Promotion, 
  Loading,
  Setting,
  Sunny,
  Moon,
  InfoFilled,
  Plus
} from '@element-plus/icons-vue'
import axios from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'

// ==================== 状态变量 ====================
const messages = ref([])
const inputText = ref('')
const isLoading = ref(false)
const showSettings = ref(false)
const mainRef = ref(null)
const activeIndex = ref('2')

// 暗黑模式状态 - 默认设置为true，但不再提供切换功能
const darkMode = ref(true)

// 底部输入区域新增状态
const sendHotkeyText = computed(() => {
  return inputText.value.includes('\n') ? '(Enter)' : '(Shift+Enter)'
})

// API 配置
const apiSettings = ref({
  provider: 'openai',
  baseURL: '',
  apiKey: '',
  model: 'gpt-3.5-turbo'
})
 
// 各提供商配置
const providerConfigs = {
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
 
// ==================== 方法 ====================

// 开始新对话
const startNewChat = () => {
  ElMessage.success('新对话已创建')
  messages.value = []
  // 这里可以添加创建新对话的逻辑
}

// 切换对话
const switchChat = (id) => {
  // 这里可以添加加载指定对话的逻辑
  ElMessage.info(`切换到对话 ${id}`)
}
 
// 切换提供商
const handleProviderChange = (provider) => {
  const config = providerConfigs[provider]
  if (config && provider !== 'custom') {
    apiSettings.value.baseURL = config.baseURL
    apiSettings.value.model = config.model
  }
}
 
// 保存设置
const saveSettings = () => {
  if (!apiSettings.value.apiKey) {
    ElMessage.warning('请输入 API Key')
    return
  }
  if (!apiSettings.value.model) {
    ElMessage.warning('请输入模型名称')
    return
  }
  
  // 保存到本地存储
  localStorage.setItem('ai-chat-settings', JSON.stringify(apiSettings.value))
  showSettings.value = false
  ElMessage.success('设置已保存')
}
 
// 加载保存的设置
const loadSettings = () => {
  const saved = localStorage.getItem('ai-chat-settings')
  if (saved) {
    try {
      const parsed = JSON.parse(saved)
      apiSettings.value = { ...apiSettings.value, ...parsed }
    } catch (e) {
      console.error('加载设置失败', e)
    }
  }
  
  // 强制设置暗黑模式为 true，忽略本地存储的值
  darkMode.value = true;
  document.documentElement.classList.add('dark');
  document.body.classList.add('dark');
  localStorage.setItem('dark-mode-preference', 'true');
}
 
// 滚动到底部
const scrollToBottom = async () => {
  await nextTick()
  if (mainRef.value) {
    const el = mainRef.value.$el || mainRef.value
    el.scrollTop = el.scrollHeight
  }
}
 
// 发送消息
const handleSend = async () => {
  const text = inputText.value.trim()
  if (!text || isLoading.value) return

  if (!apiSettings.value.apiKey) {
    ElMessage.warning('请先在设置中配置 API Key')
    showSettings.value = true
    return
  }

  // 添加用户消息
  messages.value.push({ role: 'user', content: text })
  inputText.value = ''
  await scrollToBottom()

  isLoading.value = true

  try {
    const { baseURL, apiKey, model, provider } = apiSettings.value
    
    // 确保使用正确的baseURL
    let finalBaseURL = baseURL || providerConfigs[provider]?.baseURL || ''
    if (!finalBaseURL) {
      throw new Error('API 地址不能为空，请在设置中配置正确的 API 地址')
    }
    
    // 构建请求
    let requestData = {}
    let headers = {
      'Content-Type': 'application/json'
    }

    // 根据不同提供商调整请求格式
    if (provider === 'zhipu') {
      // 智谱AI格式
      requestData = {
        model: model,
        messages: messages.value.map(m => ({
          role: m.role,
          content: m.content
        })),
        stream: false
      }
      headers['Authorization'] = `Bearer ${apiKey}`
    } else if (provider === 'qwen') {
      // 通义千问格式
      requestData = {
        model: model,
        messages: messages.value.map(m => ({
          role: m.role,
          content: m.content
        })),
        stream: false
      }
      headers['Authorization'] = `Bearer ${apiKey}`
    } else {
      // OpenAI 兼容格式
      requestData = {
        model: model,
        messages: messages.value.map(m => ({
          role: m.role,
          content: m.content
        })),
        stream: false
      }
      headers['Authorization'] = `Bearer ${apiKey}`
    }

    const response = await axios.post(
      `${finalBaseURL}/chat/completions`,
      requestData,
      {
        headers,
        timeout: 120000
      }
    )

    // 提取回复内容
    let aiContent = ''
    
    if (provider === 'zhipu') {
      // 智谱返回格式
      aiContent = response.data.choices?.[0]?.message?.content || ''
    } else {
      // OpenAI 兼容格式
      aiContent = response.data.choices?.[0]?.message?.content || ''
    }

    messages.value.push({ role: 'assistant', content: aiContent })
  } catch (error) {
    let errorMsg = error.message
    
    if (error.response?.data?.error) {
      errorMsg = error.response.data.error.message || errorMsg
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
 
// 处理换行
const handleNewLine = () => {
  inputText.value += '\n'
}
 
// 格式化消息
const formatMessage = (text) => {
  if (!text) return ''
  let formatted = text.replace(/</g, '&lt;').replace(/>/g, '&gt;')
  formatted = formatted.replace(/\n/g, '<br>')
  formatted = formatted.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
  formatted = formatted.replace(/`([^`]+)`/g, '<code>$1</code>')
  return formatted
}
 
// 清空对话
const clearChat = () => {
  if (messages.value.length > 0) {
    ElMessageBox.confirm('确定要清空所有对话记录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(() => {
      messages.value = []
    }).catch(() => {})
  }
}
 
// 页面加载
onMounted(() => {
  loadSettings()
})
</script>

<style scoped>
.chat-wrapper {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f5f7fa;
}

/* 确保暗黑模式生效 */
.chat-wrapper.dark {
  background-color: #1d1e1f;
}

.layout-container {
  height: 100%;
  min-height: 600px;
}

/* 导航栏样式 */
.nav-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(22, 33, 62, 0.95);
  border-bottom: 1px solid #0f3460;
  padding: 0 20px;
  height: 60px;
  flex-shrink: 0;
}

.nav-menu {
  flex: 1;
  max-width: 600px;
  border: none;
  background: transparent;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 15px;
}

/* 主聊天容器 */
.chat-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: calc(100vh - 60px);
  overflow: hidden;
}

/* 聊天主区域 */
.chat-main {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  background: transparent;
  min-height: 0;
  height: 100%;
}

.messages-wrapper {
  max-width: 900px;
  margin: 0 auto;
  height: 100%;
}

.welcome-tip {
  margin-top: 100px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* 消息样式 */
.message-item {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
  animation: fadeIn 0.3s ease;
}

.message-item.user {
  flex-direction: row-reverse;
}

.message-avatar {
  flex-shrink: 0;
}

.message-content {
  max-width: 70%;
  flex: 1;
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
  background: #ffffff;
  border: 1px solid #e4e7ed;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.message-card.user {
  background: #409eff;
  border-color: #409eff;
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

/* 代码块样式 */
.message-text :deep(pre) {
  background: #f6f8fa;
  padding: 12px;
  border-radius: 6px;
  overflow-x: auto;
  margin: 10px 0;
  border: 1px solid #eaecef;
}

.message-text :deep(code) {
  font-family: 'Consolas', monospace;
  font-size: 13px;
}

/* 暗黑模式下的样式 */
.chat-wrapper.dark .message-card {
  background: #1d2a4d;
  border-color: #0f3460;
  color: #e4e7ed;
}

.chat-wrapper.dark .message-text {
  color: #e4e7ed;
}

.chat-wrapper.dark .message-text :deep(pre) {
  background: #0d1117;
  border-color: #303435;
  color: #c9d1d9;
}

.chat-wrapper.dark .nav-header {
  background: #16213e;
  border-bottom-color: #0f3460;
}

.chat-wrapper.dark .nav-menu {
  background: #16213e;
}

.chat-wrapper.dark .chat-footer {
  background: #16213e;
  border-top-color: #0f3460;
}

.chat-wrapper.dark .input-area :deep(.el-textarea__inner) {
  background: #1d2a4d;
  border-color: #0f3460;
  color: #e4e7ed;
}

/* 加载状态 */
.loading-card {
  display: flex;
  align-items: center;
  gap: 10px;
}

.loading-icon {
  font-size: 20px;
  color: #409eff;
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* 底部输入区 */
.chat-footer {
  background: rgba(22, 33, 62, 0.95);
  border-top: 1px solid #0f3460;
  padding: 15px 20px;
  flex-shrink: 0;
  height: auto;
  min-height: 120px; /* 确保底部区域有足够的高度 */
}

.input-wrapper {
  max-width: 900px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.input-area {
  display: flex;
  gap: 15px;
  align-items: flex-end;
}

.input-area :deep(.el-textarea__inner) {
  background: #1d2a4d;
  border-color: #0f3460;
  color: #e4e7ed;
  font-size: 15px;
}

.input-area :deep(.el-textarea__inner:focus) {
  border-color: #409eff;
}

.send-btn {
  height: 56px;
  padding: 0 25px;
  font-size: 16px;
  min-width: 100px;
}

/* 滚动条样式 */
.chat-main::-webkit-scrollbar {
  width: 6px;
}

.chat-main::-webkit-scrollbar-thumb {
  background: #0f3460;
  border-radius: 3px;
}

.chat-main::-webkit-scrollbar-track {
  background: transparent;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .nav-header {
    padding: 0 10px;
  }
  
  .chat-main {
    padding: 10px;
    height: calc(100% - 140px); /* 为移动端调整聊天区域高度 */
  }
  
  .input-area {
    flex-direction: column;
  }
  
  .input-area :deep(.el-textarea__inner) {
    min-height: 100px;
  }
  
  .send-btn {
    width: 100%;
    height: auto;
    padding: 12px;
    margin-top: 10px;
  }
  
  .chat-footer {
    min-height: 130px; /* 移动端确保底部区域足够高 */
  }
}
</style>

import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

interface Message {
  role: 'user' | 'assistant'
  content: string
  imageUrl?: string
}

interface ChatSession {
  id: string
  title: string
  messages: Message[]
  createdAt: number
}

export const useChatStore = defineStore('chat', () => {
  const sessions = ref<ChatSession[]>([])
  const currentSessionId = ref<string | null>(null)

  // 从 localStorage 加载数据
  const loadSessions = () => {
    const saved = localStorage.getItem('ai-chat-sessions')
    if (saved) {
      try {
        sessions.value = JSON.parse(saved)
      } catch (e) {
        console.error('加载对话历史失败:', e)
        sessions.value = []
      }
    }
  }

  // 保存到 localStorage
  const saveSessions = () => {
    localStorage.setItem('ai-chat-sessions', JSON.stringify(sessions.value))
  }

  // 监听 sessions 变化并自动保存
  watch(sessions, saveSessions, { deep: true })

  // 获取当前对话
  const currentSession = ref<ChatSession | null>(null)

  // 新建对话
  const createNewChat = () => {
    const newId = Date.now().toString()
    const newSession: ChatSession = {
      id: newId,
      title: '新的对话',
      messages: [],
      createdAt: Date.now()
    }
    sessions.value.unshift(newSession)
    currentSessionId.value = newId
    currentSession.value = newSession
    return newSession
  }

  // 切换对话
  const switchChat = (id: string) => {
    const session = sessions.value.find(s => s.id === id)
    if (session) {
      currentSessionId.value = id
      currentSession.value = session
    }
  }

  // 更新当前对话的消息
  const updateMessages = (messages: Message[]) => {
    if (currentSession.value) {
      currentSession.value.messages = [...messages]
      // 如果是第一条用户消息，更新标题
      if (messages.length > 0 && currentSession.value.title === '新的对话') {
        const firstUserMsg = messages.find(m => m.role === 'user')
        if (firstUserMsg) {
          currentSession.value.title = firstUserMsg.content.slice(0, 20) + (firstUserMsg.content.length > 20 ? '...' : '')
        }
      }
    }
  }

  // 删除单条消息
  const deleteMessage = (index: number) => {
    if (currentSession.value) {
      currentSession.value.messages.splice(index, 1)
    }
  }

  // 修改消息并截断后续对话
  const editMessageAndTruncate = (index: number, newContent: string) => {
    if (currentSession.value) {
      // 截断该消息之后的所有消息
      currentSession.value.messages = currentSession.value.messages.slice(0, index)
      // 如果是第一条消息且是用户消息，更新标题
      if (index === 0 && currentSession.value.title !== '新的对话') {
        currentSession.value.title = newContent.slice(0, 20) + (newContent.length > 20 ? '...' : '')
      }
    }
  }

  // 删除对话
  const deleteChat = (id: string) => {
    const index = sessions.value.findIndex(s => s.id === id)
    if (index !== -1) {
      sessions.value.splice(index, 1)
      if (currentSessionId.value === id) {
        currentSessionId.value = null
        currentSession.value = null
      }
    }
  }

  // 重命名对话
  const renameChat = (id: string, newTitle: string) => {
    const session = sessions.value.find(s => s.id === id)
    if (session) {
      session.title = newTitle
    }
  }

  // 清空所有对话
  const clearAllChats = () => {
    sessions.value = []
    currentSessionId.value = null
    currentSession.value = null
  }

  // 初始化加载
  loadSessions()
  if (sessions.value.length > 0) {
    currentSessionId.value = sessions.value[0].id
    currentSession.value = sessions.value[0]
  }

  return {
    sessions,
    currentSessionId,
    currentSession,
    createNewChat,
    switchChat,
    updateMessages,
    deleteMessage,
    editMessageAndTruncate,
    deleteChat,
    renameChat,
    clearAllChats
  }
})

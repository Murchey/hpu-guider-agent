# 前端 AI 对话修复方案

## 1. 流式解析增强

### 问题
部分 API 端点不返回流式数据，而是一次性返回完整 JSON，导致 `reader.read()` 直接 `done: true`，前端无法提取内容。

### 修复方案

在流结束后增加非流式 JSON 兜底解析：

```typescript
const { done, value } = await reader.read()
if (done) {
  if (buffer.trim() && !aiContent) {
    try {
      const fallbackData = JSON.parse(buffer)
      aiContent = fallbackData.choices?.[0]?.message?.content
        || fallbackData.data?.content
        || fallbackData.content
        || JSON.stringify(fallbackData)
      newMessages[assistantMsgIndex].content = aiContent
      chatStore.updateMessages(newMessages)
    } catch (err) {
      console.warn('非流式兜底解析失败:', err, buffer)
    }
  }
  break
}
```

同时放宽 Coze 事件判断，兼容多种取值路径：

```typescript
const delta = data.content
  || (data.message && data.message.content)
  || data.choices?.[0]?.delta?.content
  || ''
```

---

## 2. Coze 模式对话上下文丢失

### 问题
每次请求都生成新的 `user_id`，且未传递历史消息，导致 AI 丧失多轮对话能力。

### 修复方案

1. 持久化 `user_id`：
```typescript
let userId = localStorage.getItem('coze_user_id')
if (!userId) {
  userId = 'user_' + Math.random().toString(36).substr(2, 9)
  localStorage.setItem('coze_user_id', userId)
}
```

2. 携带历史消息：
```typescript
const additionalMessages = requestMessages.slice(0, -1).map(msg => ({
  role: msg.role,
  content: msg.content,
  content_type: 'text'
}))
additionalMessages.push({
  role: 'user',
  content: JSON.stringify(contentList),
  content_type: 'object_string'
})
```

---

## 3. 图片预览内存泄漏

### 问题
使用 `URL.createObjectURL()` 生成预览链接后，未调用 `revokeObjectURL()` 释放内存。

### 修复方案

```typescript
const removeUploadedImage = (index?: number) => {
  if (typeof index === 'number') {
    if (uploadedImages.value[index]?.url.startsWith('blob:')) {
      URL.revokeObjectURL(uploadedImages.value[index].url)
    }
    uploadedImages.value.splice(index, 1)
    fileList.value.splice(index, 1)
  } else {
    uploadedImages.value.forEach(img => {
      if (img.url.startsWith('blob:')) URL.revokeObjectURL(img.url)
    })
    uploadedImages.value = []
    fileList.value = []
  }
}
```

---

## 4. AbortError 误报

### 问题
`AbortController.abort()` 触发后 `fetch` 抛出 `AbortError`，被 catch 捕获并显示为错误。

### 修复方案

```typescript
} catch (error: any) {
  if (error.name === 'AbortError' || error.message.includes('abort')) {
    console.log('用户中断了上一次请求')
    return
  }
  // 原有报错逻辑...
}
```

---

## 5. Markdown 渲染 XSS 风险

### 问题
`markdown-it` 配置了 `html: true`，配合 `v-html` 直接渲染，存在注入风险。

### 修复方案

引入 DOMPurify：

```bash
npm install dompurify @types/dompurify
```

```typescript
import DOMPurify from 'dompurify'

const formatAssistantMessage = (text: string): string => {
  if (!text) return ''
  const cleanText = text.replace(/\[MAP_DATA\][\s\S]*?\[\/MAP_DATA\]/g, '').trim()
  const rawHtml = md.render(cleanText)
  return DOMPurify.sanitize(rawHtml)
}
```

<template>
  <div class="setting-page">
    <el-card class="settings-card">
      <template #header>
        <div class="card-header">
          <span>API 设置</span>
        </div>
      </template>
      
      <el-form :model="apiSettings" label-width="100px">
        <el-form-item label="服务提供商">
          <el-select v-model="apiSettings.provider" @change="handleProviderChange" style="width: 100%">
            <el-option label="硅基流动 (SiliconFlow)" value="siliconflow" />
            <el-option label="OpenAI (兼容API)" value="openai" />
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
        
        <el-form-item>
          <el-button type="primary" @click="saveSettings">保存</el-button>
          <el-button @click="testConnection" :loading="testing">测试连接</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import axios from 'axios'

const testing = ref(false)

const apiSettings = ref({
  provider: '硅基流动',
  baseURL: 'https://api.siliconflow.cn/v1',
  apiKey: '',
  model: 'Qwen/Qwen2.5-7B-Instruct'
})

const providerConfigs: Record<string, { baseURL: string; model: string; name: string; apiKey: string }> = {
  openai: {
    baseURL: 'https://api.openai.com/v1',
    model: 'gpt-3.5-turbo',
    apiKey: '',
    name: 'OpenAI'
  },
  siliconflow: {
    baseURL: 'https://api.siliconflow.cn/v1',
    model: 'Qwen/Qwen2.5-7B-Instruct',
    apiKey: '',
    name: '硅基流动'
  },
  zhipu: {
    baseURL: 'https://open.bigmodel.cn/api/paas/v4',
    model: 'glm-4',
    apiKey: '',
    name: '智谱AI'
  },
  qwen: {
    baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    model: 'qwen-turbo',
    apiKey: '',
    name: '通义千问'
  },
  custom: {
    baseURL: '',
    model: '',
    apiKey: '',
    name: '自定义'
  }
}

const loadSettings = () => {
  const saved = localStorage.getItem('ai-chat-settings')
  if (saved) {
    try {
      apiSettings.value = { ...apiSettings.value, ...JSON.parse(saved) }
    } catch (e) {
      console.error('加载设置失败', e)
    }
  }
}

const handleProviderChange = () => {
  const config = providerConfigs[apiSettings.value.provider]
  if (config && apiSettings.value.provider !== 'custom') {
    apiSettings.value.baseURL = config.baseURL
    apiSettings.value.model = config.model
  }
}

const saveSettings = () => {
  if (!apiSettings.value.apiKey) {
    ElMessage.warning('请输入 API Key')
    return
  }
  localStorage.setItem('ai-chat-settings', JSON.stringify(apiSettings.value))
  ElMessage.success('设置已保存')
}

const testConnection = async () => {
  if (!apiSettings.value.apiKey) {
    ElMessage.warning('请先输入 API Key')
    return
  }
  
  testing.value = true
  
  try {
    const { baseURL, apiKey, model, provider } = apiSettings.value
    const config = providerConfigs[provider]
    const finalBaseURL = baseURL || config?.baseURL || ''
    
    if (!finalBaseURL) {
      throw new Error('API 地址不能为空')
    }
    
    const response = await axios.post(
      `${finalBaseURL}/chat/completions`,
      {
        model: model,
        messages: [{ role: 'user', content: '你好' }],
        stream: false
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        timeout: 30000
      }
    )
    
    if (response.data.choices && response.data.choices.length > 0) {
      ElMessage.success(`连接成功！AI 回复: ${response.data.choices[0].message?.content?.substring(0, 50)}...`)
    } else {
      ElMessage.warning('连接成功但无响应内容')
    }
  } catch (error: any) {
    let errorMsg = error.message
    if (error.response?.data?.error) {
      errorMsg = error.response.data.error.message || errorMsg
    } else if (error.response?.data) {
      errorMsg = JSON.stringify(error.response.data)
    }
    ElMessage.error(`连接失败: ${errorMsg}`)
  } finally {
    testing.value = false
  }
}

onMounted(() => {
  loadSettings()
})
</script>

<style scoped>
.setting-page {
  width: 100%;
  height: 100%;
  padding: 15px;
  display: flex;
  justify-content: center;
  align-items: flex-start;
}

.settings-card {
  width: 70%;
  margin: 0 auto;
}

.card-header {
  font-size: 18px;
  font-weight: bold;
}

html.dark .settings-card {
  background: #181D27;
  border-color: #0f3460;
}

html.dark .settings-card .el-card__header {
  background: #181D27;
  border-color: #0f3460;
}

html.dark .settings-card .el-card__body {
  background: #181D27;
}

html.dark .card-header {
  color: #e4e7ed;
}

html.dark .el-form-item__label {
  color: #181D27;
}
</style>

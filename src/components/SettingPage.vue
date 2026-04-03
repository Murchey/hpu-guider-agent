<template>
  <div class="setting-page">
    <el-card class="settings-card">
      <template #header>
        <div class="card-header">API 配置</div>
      </template>
      <p class="tips">
        当前API配置为：{{ MANUAL_API_SETTINGS.provider }}
        <br>
        Bot ID为：{{ MANUAL_API_SETTINGS.botId }}
        <br>
        API Base URL为：{{ MANUAL_API_SETTINGS.baseURL }}
      </p>
    </el-card>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const MANUAL_API_SETTINGS = {
  // provider 可选：openai / siliconflow / zhipu / qwen / coze / custom
  provider: 'coze',
  // Coze 根地址 (国内版: https://api.coze.cn | 国际版: https://api.coze.com)
  // 注意：后面不要加 /v3/chat，代码会自动拼接
  baseURL: 'https://api.coze.cn',
  // baseURL: 'https://api.siliconflow.cn/v1',
  // apiKey 填写你的 Personal Access Token
  apiKey: 'pat_dwOqipNExoqRFtk4RkKhyj3IkxvaMPU2ozUrle8yvhleoJe6OCIEXWVvfbCH4GlA',
  // botId 填写你的 Bot ID
  botId: '7622230218706731042',
  // model 可选 (Coze 模式下该项通常不生效，由 Bot ID 决定)
  model: ''
}

const applyManualApiSettings = () => {
  localStorage.setItem('ai-chat-settings', JSON.stringify(MANUAL_API_SETTINGS))
}

// 立即执行一次，确保 HMR 时也能同步最新的配置
applyManualApiSettings()

onMounted(() => {
  applyManualApiSettings()
})
</script>

<style scoped>
.setting-page {
  width: 100%;
  height: 100%;
  padding: 15px;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
}

.settings-card {
  width: 70%;
  margin: 0 auto;
}

.settings-card + .settings-card {
  margin-top: 15px;
}

.card-header {
  font-size: 18px;
  font-weight: bold;
}

.tips {
  margin: 8px 0;
  line-height: 1.7;
}

html.dark .settings-card {
  background: #181d27;
  border-color: #0f3460;
}

html.dark .card-header {
  color: #e4e7ed;
}
</style>

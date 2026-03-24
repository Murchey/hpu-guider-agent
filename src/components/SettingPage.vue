<template>
  <div class="setting-page">
    <el-card class="settings-card">
      <template #header>
        <div class="card-header">API 手动配置</div>
      </template>
      <p class="tips">
        已移除 API 表单配置界面。
      </p>
    </el-card>

    <el-card class="settings-card">
      <template #header>
        <div class="card-header">
          <span>显示模式</span>
        </div>
      </template>
      <el-form label-width="100px">
        <el-form-item label="浅色 / 暗色">
          <el-switch
            v-model="isDarkMode"
            active-text="暗色"
            inactive-text="浅色"
            @change="handleThemeChange"
          />
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const isDarkMode = ref(false)

const MANUAL_API_SETTINGS = {
  // provider 可选：openai / siliconflow / zhipu / qwen / custom
  provider: 'siliconflow',
  // baseURL 直接填写对应服务的兼容地址
  baseURL: 'https://api.siliconflow.cn/v1',
  // apiKey 填写你自己的密钥（不要提交到公开仓库）
  apiKey: '',
  // model 填写要调用的模型名
  model: 'Qwen/Qwen2.5-7B-Instruct'
}

const applyManualApiSettings = () => {
  localStorage.setItem('ai-chat-settings', JSON.stringify(MANUAL_API_SETTINGS))
}

const applyTheme = (isDark: boolean) => {
  document.documentElement.classList.toggle('dark', isDark)
  document.body.classList.toggle('dark', isDark)
}

const loadTheme = () => {
  const saved = localStorage.getItem('theme-mode')
  isDarkMode.value = saved === 'dark'
  applyTheme(isDarkMode.value)
}

const handleThemeChange = (val: string | number | boolean) => {
  const nextIsDark = Boolean(val)
  isDarkMode.value = nextIsDark
  localStorage.setItem('theme-mode', nextIsDark ? 'dark' : 'light')
  applyTheme(nextIsDark)
}

onMounted(() => {
  applyManualApiSettings()
  loadTheme()
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

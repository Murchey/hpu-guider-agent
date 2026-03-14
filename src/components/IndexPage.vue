<template>
  <div class="index-page">
    <div class="welcome-container">
      <h1 class="welcome-title">WELCOME</h1>
      <p class="welcome-subtitle">HPU智能导游</p>
      <p class="welcome-subtitle">为您智能推荐导游路线和旅游项目</p>
      <el-card class="feature-card">
        <template #header>
          <div class="card-header">
          <h2>生成自己的用户画像</h2>
          </div>
        </template>
          <p>根据自己的使用需求和爱好，使用AI生成，制作专属于您的用户画像，让AI推荐更加精准。</p>
          <template #footer>
            <el-button type="primary" round @click="goToDialogue">前往生成</el-button>
          </template>
      </el-card>
    </div>
  </div>
  
</template> 

<script setup lang="ts">

const emit = defineEmits<{
  (e: 'navigate', tabName: string): void
}>()

const goToDialogue = () => {
  emit('navigate', 'aiDialogue')
}
</script>

<style scoped>
.index-page {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.welcome-container {
  text-align: center;
  justify-content: center;
  width: 100%;
  max-width: 800px;
}

.welcome-title {
  font-size: 48px;
  color: #409eff;
  margin-bottom: 20px;
}

.welcome-subtitle {
  font-size: 24px;
  color: #a3a6ad;
  margin-bottom: 40px;
}

.feature-card {
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
  text-align: left;
}

.feature-card .el-card__body p {
  font-size: 16px;
  line-height: 1.8;
}

.card-header h2 {
  font-size: 20px;
  margin: 0;
}

.feature-card :deep(.el-card__footer) {
  text-align: right;
}

html.dark .feature-card :deep(.el-card__footer) {
  border-top-color: #0f3460;
}

html.dark .welcome-title {
  color: #409eff;
}

html.dark .welcome-subtitle {
  color: #a3a6ad;
}

/* html.dark .feature-card {
  background: 
  border-color: 
} */

html.dark .feature-card .el-card__header {
  background: #1d2a4d;
  border-color: #0f3460;
}

html.dark .feature-card .el-card__body {
  background: #1d2a4d;
}

html.dark .feature-card .el-card__body p {
  color: #e4e7ed;
}

html.dark .card-header h2 {
  color: #e4e7ed;
}
</style>

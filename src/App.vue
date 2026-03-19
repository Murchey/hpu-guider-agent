<template>
  <div class="app-container">
    <el-tabs
      v-model="activeName"
      class="demo-tabs"
      @tab-click="handleClick">
      
      <el-tab-pane label="首页" name="indexPage">
        <IndexPage @navigate="handleNavigate" />
      </el-tab-pane>
      
      <el-tab-pane label="AI对话" name="aiDialogue">
        <AiDialoguePage />
      </el-tab-pane>
      
      <el-tab-pane label="设置" name="settingPage">
        <SettingPage />
      </el-tab-pane>
      
    </el-tabs>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import type { TabsPaneContext } from 'element-plus'
import IndexPage from './components/IndexPage.vue'
import AiDialoguePage from './components/AiDialoguePage.vue'
import SettingPage from './components/SettingPage.vue'

const activeName = ref('indexPage')

const handleClick = (tab: TabsPaneContext, event: Event) => {
  console.log(tab, event)
}

const handleNavigate = (tabName: string) => {
  activeName.value = tabName
}
</script>

<style>
html, body {
  margin: 0;
  padding: 0;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}

html.dark {
  --el-bg-color-page: #1D1E1F;
}

html.dark, html.dark body {
  background: #1D1E1F;
}

#app {
  height: 100vh;
  width: 100vw;
}

.app-container {
  height: 100vh;
  width: 100vw;
  padding: 0px;
  box-sizing: border-box;
  background: var(--el-bg-color-page);
}

.demo-tabs {
  height: calc(100vh - 40px);
}

.demo-tabs .el-tabs__header {
  margin: 0px;
  padding: 20px;
}

.demo-tabs .el-tabs__nav-wrap::after {
  display: none;
}

.demo-tabs .el-tabs__content {
  height: calc(100% - 40px);
  padding: 20px;
  box-sizing: border-box;
  background: var(--el-bg-color-page);
}

.demo-tabs .el-tab-pane {
  height: 100%;
}

/* html.dark .demo-tabs {
  background: #a74d4d;
} */

.demo-tabs .el-tabs__header {
  background: var(--el-bg-color-page);
}

/* html.dark .el-tabs__nav-wrap::after {
  background-color: #a24848;
} */

.demo-tabs .el-tabs__item {
  color: var(--el-text-color-regular);
}

.demo-tabs .el-tabs__item.is-active {
  color: var(--el-color-primary);
}

.demo-tabs .el-tabs__active-bar {
  background-color: var(--el-color-primary);
}

.info-dialog .el-dialog__header {
  text-align: center;
}

.info-dialog .el-dialog__title {
  font-size: 18px;
  font-weight: bold;
}

html.dark .info-dialog .el-dialog__header {
  /* 问卷抬头下方分割线颜色，默认与背景一致 */
  border-bottom: 1px solid #141414;
}

html.dark .info-dialog .el-dialog__title {
  /* 问卷标题字体颜色 */
  color: e4e7ed;
}

/* html.dark .info-dialog .el-dialog__body {
  background: #141414;
} */

html.dark .info-dialog .el-dialog__footer {
  /* 问卷按钮所在页脚颜色 */
  background: #141414;
  /* 问卷按钮页脚分割线 */
  border-top: 1px solid #141414;
}

html.dark .info-dialog .el-form {
  /* 问卷表单之间gap背景颜色 */
  background: #141414;
}

html.dark .info-dialog .el-form-item {
  /* 问卷选选项栏目边角颜色，默认与背景一致 */
  background: #141414;
}

html.dark .info-dialog .el-form-item__label {
  /* 问卷左侧问题背景颜色 */
  background: #141414;
  /* 问卷左侧问题字体颜色 */
  color: #e4e7ed;
}
</style>

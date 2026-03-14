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
html.dark, html.dark body {
  margin: 0;
  padding: 0;
  background-color: #1a1a1a;
  color: #ffffff;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}

#app {
  height: 100vh;
  width: 100vw;
  background: #1a1a1a;
}

.app-container {
  height: 100vh;
  width: 100vw;
  padding: 20px;
  box-sizing: border-box;
  background: #1a1a1a;
}

.demo-tabs {
  height: calc(100vh - 40px);
  background: #1a1a1a;
}

.demo-tabs .el-tabs__header {
  margin: 0;
  background: #1a1a1a;
}

.demo-tabs .el-tabs__nav-wrap::after {
  display: none;
}

.demo-tabs .el-tabs__content {
  height: calc(100% - 40px);
  padding: 20px;
  box-sizing: border-box;
  background: #1a1a1a;
}

.demo-tabs .el-tab-pane {
  height: 100%;
}

html.dark .demo-tabs {
  background: #1a1a1a;
}

html.dark .el-tabs__header {
  background: #1a1a1a;
}

html.dark .el-tabs__nav-wrap::after {
  background-color: #1A1A1A;
}

html.dark .demo-tabs .el-tabs__item {
  color: #a3a6ad;
}

html.dark .demo-tabs .el-tabs__item.is-active {
  color: #409eff;
}

html.dark .el-tabs__active-bar {
  background-color: #409eff;
}

.info-dialog .el-dialog__header {
  text-align: center;
}

.info-dialog .el-dialog__title {
  font-size: 18px;
  font-weight: bold;
}

html.dark .info-dialog .el-dialog__header {
  border-bottom: 1px solid #1A1A1A;
}

html.dark .info-dialog .el-dialog__title {
  color: #e4e7ed;
}

html.dark .info-dialog .el-dialog__body {
  background: #141414;
}

html.dark .info-dialog .el-dialog__footer {
  background: #141414;
  border-top: 1px solid #141414;
}

html.dark .info-dialog .el-form {
  background: #141414;
}

html.dark .info-dialog .el-form-item {
  background: #141414;
}

html.dark .info-dialog .el-form-item__label {
  background: #141414;
  color: #e4e7ed;
}
</style>

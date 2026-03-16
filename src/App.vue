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
  color: #ffffff;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}

#app {
  height: 100vh;
  width: 100vw;
}

.app-container {
  height: 100vh;
  width: 100vw;
  padding: 20px;
  box-sizing: border-box;

  /* 外侧边框颜色 */
  background: #202020;
}

.demo-tabs {
  height: calc(100vh - 40px);
  /* background: #ab4f4f; */
}

.demo-tabs .el-tabs__header {
  margin: 0;
  /* background: #cb6161; */
}

.demo-tabs .el-tabs__nav-wrap::after {
  display: none;
}

.demo-tabs .el-tabs__content {
  height: calc(100% - 40px);
  padding: 20px;
  box-sizing: border-box;
  /* 全部大背景颜色 */
  background: #202020;
}

.demo-tabs .el-tab-pane {
  height: 100%;
}

/* html.dark .demo-tabs {
  background: #a74d4d;
} */

html.dark .el-tabs__header {
  /* 导航栏颜色 */
  background: #202020;
}

/* html.dark .el-tabs__nav-wrap::after {
  background-color: #a24848;
} */

html.dark .demo-tabs .el-tabs__item {
  /* 导航栏不激活字体颜色 */
  color: #a3a6ad;
}

html.dark .demo-tabs .el-tabs__item.is-active {
  /* #409EFF */
  /* 导航栏激活字体颜色 */
  color: #409EFF;
}

html.dark .el-tabs__active-bar {
  /* 导航栏下侧横线激活颜色 */
  background-color: #409EFF;
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

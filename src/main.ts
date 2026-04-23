import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

// 整体黑色模式文件，与小组件的背景颜色相关
import 'element-plus/theme-chalk/dark/css-vars.css'

import App from './App.vue'
 
const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(ElementPlus)

const applyTheme = (isDark: boolean) => {
  document.documentElement.classList.toggle('dark', isDark)
  document.body.classList.toggle('dark', isDark)
}

const saved = localStorage.getItem('theme-mode')
applyTheme(saved === 'dark')

app.mount('#app')

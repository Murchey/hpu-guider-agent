import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

// 整体黑色模式文件，与小组件的背景颜色相关
import 'element-plus/theme-chalk/dark/css-vars.css'

import App from './App.vue'
 
const app = createApp(App)
app.use(ElementPlus)

const applyTheme = (isDark: boolean) => {
  document.documentElement.classList.toggle('dark', isDark)
  document.body.classList.toggle('dark', isDark)
}

const saved = localStorage.getItem('theme-mode')
applyTheme(saved !== 'light')

app.mount('#app')

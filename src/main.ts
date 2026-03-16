import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

// 整体黑色模式文件，与小组件的背景颜色相关
import 'element-plus/theme-chalk/dark/css-vars.css'

import App from './App.vue'
 
const app = createApp(App)
app.use(ElementPlus)

document.documentElement.classList.add('dark')
document.body.classList.add('dark')

app.mount('#app')
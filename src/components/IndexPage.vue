<template>
  <div class="index-page" :style="parallaxStyle">
    <!-- 顶层透明传感器，用于捕获鼠标移动，位置与背景图同步 -->
    <div 
      class="shatter-sensor"
      @mousemove="handleShatterMouseMove"
      @mouseleave="handleShatterMouseLeave"
      @touchstart="handleShatterTouchStart"
      @touchmove="handleShatterTouchMove"
      @touchend="handleShatterMouseLeave"
    >
      <img :src="titleBackImg" style="width: 100%; height: auto; opacity: 0; display: block;" />
    </div>

    <div class="parallax-container" aria-hidden="true">
      <div class="parallax-layer parallax-back parallax-back-1"></div>
      
      <!-- 飞散效果背景图层 (位于 FRONT_IMG 之下) -->
      <div 
        class="shatter-wrapper"
        ref="shatterWrapperRef"
      >
        <img :src="titleBackImg" class="shatter-source" aria-hidden="true" />
        <div class="fragment-grid">
          <div 
            v-for="i in rows" 
            :key="'row-' + i" 
            class="shatter-row"
          >
            <div 
                 v-for="j in cols" 
                 :key="'col-' + j"
                 class="fragment"
                 :style="getFragmentStyle(i - 1, j - 1)"
               ></div>
          </div>
        </div>
      </div>

      <div class="parallax-layer parallax-front parallax-front-1"></div>
      <div class="parallax-overlay"></div>
    </div>
    <section class="panel panel-1">
      <div class="welcome-container">
        <h1 class="welcome-title">WELCOME</h1>
        <p class="welcome-subtitle">您的智慧导游助手</p>
        <p class="welcome-subtitle">为您智能推荐导游路线和旅游项目</p>
        <!-- 精选景点走马灯 -->
        <div class="carousel-section">
          <el-carousel :interval="4000" :height="carouselHeight" class="custom-carousel" :type="carouselType">
            <el-carousel-item v-for="(img, index) in recommendPlaces" :key="index">
              <div class="carousel-item-content">
                <img :src="img" :alt="'place' + (index + 1)" class="carousel-image" />
              </div>
            </el-carousel-item>
          </el-carousel>
        </div>


        <!-- 操作按钮 -->
        <div class="action-buttons">
          <el-button type="primary" size="large" round @click="dialogFormVisible = true" class="big-action-btn">
            让AI懂你喜好
          </el-button>
          <el-button type="success" size="large" round @click="handleSocialPublish" class="big-action-btn">
            分享旅游经历
          </el-button>
        </div>

        <!-- 用户画像问卷抽屉 -->
        <el-drawer 
          v-model="dialogFormVisible" 
          title="请完成下面的问卷调查" 
          :size="drawerSize"
          class="info-drawer"
          direction="rtl"
          append-to-body
        >
          <el-form :model="form" class="profile-form">
            <el-form-item label="旅行人数" :label-width="formLabelWidth">
              <el-input v-model="form.travelNumber" style="width: 100%" placeholder="输入旅行人数(个)" />
            </el-form-item>
            <br>
            <el-form-item label="旅行天数" :label-width="formLabelWidth">
              <el-input v-model="form.travelDays" style="width: 100%" placeholder="输入旅行消耗时间(天)" />
            </el-form-item>
            <br>
            <el-form-item label="旅行预算" :label-width="formLabelWidth">
              <el-input v-model="form.travelBudget" style="width: 100%" placeholder="输入您期望的预算(元)" />
            </el-form-item>
            <br>
            <el-form-item label="出发日期" :label-width="formLabelWidth">
              <el-date-picker
                v-model="form.startDate"
                type="date"
                aria-label="选择日期"
                placeholder="请选择出发日期"
                style="width: 100%"
                value-format="YYYY-MM-DD"
              />
            </el-form-item>
            <br>
            <el-form-item label="出发地点" :label-width="formLabelWidth">
              <el-input v-model="form.originPlace" style="width: 100%" placeholder="输入您期望的出发地点" />
            </el-form-item>
            <br>
            <el-form-item label="交通方式" :label-width="formLabelWidth">
              <el-radio-group v-model="form.travelMethod" size="large" fill="#409eff">
              <el-radio-button label="驾车" value="驾车" />
              <el-radio-button label="骑行" value="骑行" />
              <el-radio-button label="公共交通" value="公共交通" />
              <el-radio-button label="步行" value="步行" />
              </el-radio-group>
            </el-form-item>
            <br>
            <el-form-item label="出行风格" :label-width="formLabelWidth">
              <el-radio-group v-model="form.travelStyle" size="large" fill="#409eff">
                
                <el-tooltip 
                  placement="top"
                  transition="none"
                  :show-after="0"
                  :hide-after="0"
                >
                  <template #content><div style="font-size: 14px;">核心诉求为身心放松，主打无计划慢节奏，不赶景点、不强制打卡，<br/>
                    以酒店 / 民宿休憩、本地随性闲逛为核心，全程拒绝高强度奔波</div></template>
                <el-radio-button label="松弛度假" value="松弛度假" />
                </el-tooltip>

                <el-tooltip 
                  placement="top"
                  transition="none"
                  :show-after="0"
                  :hide-after="0"
                >
                  <template #content><div style="font-size: 14px;">追求单位时间内游览效率最大化，行程紧凑、目标明确，<br/>
                    通过科学规划覆盖尽可能多的核心景点与打卡位</div></template>
                <el-radio-button label="高效打卡" value="高效打卡" />
                </el-tooltip>

                <el-tooltip 
                  placement="top"
                  transition="none"
                  :show-after="0"
                  :hide-after="0"
                >
                  <template #content><div style="font-size: 14px;">侧重历史脉络、建筑美学、艺术展览或非遗民俗，<br/>
                    愿意在单一地点停留较长时间进行深度学习与感悟</div></template>
                <el-radio-button label="人文深度" value="人文深度" />
                </el-tooltip>

                <el-tooltip 
                  placement="top"
                  transition="none"
                  :show-after="0"
                  :hide-after="0"
                >
                  <template #content><div style="font-size: 14px;">亲近自然地理，包含徒步、登山、观鸟、露营等轻量或专业户外活动，<br/>
                    对自然风光、生态环境有极高向往</div></template>
                <el-radio-button label="自然户外" value="自然户外" />
                </el-tooltip>

                <el-tooltip 
                  placement="top"
                  transition="none"
                  :show-after="0"
                  :hide-after="0"
                >
                  <template #content><div style="font-size: 14px;">以“吃”为行程核心驱动力，寻访地道老字号、街头小吃或特色餐厅，<br/>
                    通过味觉深度体验城市烟火气</div></template>
                <el-radio-button label="美食寻味" value="美食寻味" />
                </el-tooltip>

                <el-tooltip 
                  placement="top"
                  transition="none"
                  :show-after="0"
                  :hide-after="0"
                >
                  <template #content><div style="font-size: 14px;">主打随机感，通过 CityWalk 方式探索城市街巷，<br/>
                    挖掘被大众忽略的社区细节与城市肌理</div></template>
                <el-radio-button label="城市漫游" value="城市漫游" />
                </el-tooltip>

              </el-radio-group>
            </el-form-item>
            <br>
            <el-form-item label="行程核心关注点" :label-width="formLabelWidth">
              <el-checkbox-group v-model="form.travelFocus" size="large">
                <el-tooltip 
                  v-for="(travelFocusOption, index) in travelFocusOptions" 
                  :key="travelFocusOption"
                  placement="top"
                  transition="none"
                  :show-after="0"
                  :hide-after="0"
                >
                  <template #content>
                    <div style="font-size: 14px; max-width: 200px; line-height: 1.4;">
                      {{ travelFocusTips[index] }}
                    </div>
                  </template>
                  <el-checkbox-button :label="travelFocusOption" :value="travelFocusOption" />
                </el-tooltip>
              </el-checkbox-group>
            </el-form-item>
            <br>
            <el-form-item label="个性化出行习惯" :label-width="formLabelWidth">
              <el-checkbox-group v-model="form.customHabit" size="large">
                <el-checkbox-button v-for="travelCustomOption in travelCustomOptions" :key="travelCustomOption" :label="travelCustomOption" :value="travelCustomOption" :disabled="isCustomOptionsDisabled(travelCustomOption)"/>
              </el-checkbox-group>
            </el-form-item>
            <br>
             <el-form-item label="其他个性要求" :label-width="formLabelWidth" >
              <el-input v-model="form.additionalRequirements" style="width: 100%" placeholder="输入其他个性要求" :disabled="isNeedAdditionInput"/>
            </el-form-item>
            
          </el-form>
          <template #footer>
            <div class="drawer-footer">
              <el-button @click="cancelBtn" size="large">取消</el-button>
              <el-button type="primary" @click="handleConfirm" size="large" :disabled="!isFormValid">确定</el-button>
            </div>
          </template>
        </el-drawer>

        <!-- 社交平台发布抽屉 -->
        <el-drawer 
          v-model="socialDrawerVisible" 
          title="选择发布的平台" 
          :size="drawerSize"
          class="info-drawer"
          direction="rtl"
          append-to-body
        >
          <el-form :model="socialForm" class="profile-form">
            <el-form-item label="发布平台" :label-width="formLabelWidth">
              <el-checkbox-group v-model="socialForm.platforms" size="large" class="social-checkbox-group">
                <el-checkbox v-for="option in socialPlatformOptions" :key="option" :label="option" :value="option" border class="social-checkbox-item" />
              </el-checkbox-group>
            </el-form-item>
          </el-form>
          <template #footer>
            <div class="drawer-footer">
              <el-button @click="cancelBtn" size="large">取消</el-button>
              <el-button type="success" size="large" :disabled="socialForm.platforms.length === 0" @click="handleSocialConfirm">生成帖子</el-button>
            </div>
          </template>
        </el-drawer>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, reactive, ref } from 'vue'
import { ElNotification } from 'element-plus'
import frontImg from '../assets/FRONT_IMG.png'
import backImg from '../assets/BACK_IMG.png'
import titleBackImg from '../assets/BIG_TITLE_BACK.webp'
import place1 from '../assets/place1.webp'
import place2 from '../assets/place2.webp'
import place3 from '../assets/place3.webp'
import place4 from '../assets/place4.webp'
import place5 from '../assets/place5.webp'
import place6 from '../assets/place6.webp'
import place7 from '../assets/place7.webp'
import place8 from '../assets/place8.webp'

const recommendPlaces = [place1, place2, place3, place4, place5, place6, place7, place8]

const emit = defineEmits<{
  (e: 'navigate', tabName: string): void
}>()

const dialogFormVisible = ref(false)
const socialDrawerVisible = ref(false)
const form = reactive({
    travelNumber: '',
    travelDays: '',
    travelBudget: '',
    travelStyle: '',
    travelFocus: [],
    customHabit: [],
    additionalRequirements: '',
    travelMethod: '',
    startDate: '',
    originPlace: ''
})

const socialForm = reactive({
  platforms: []
})

const socialPlatformOptions = [
  '小红书', '微信朋友圈 / QQ空间', '微博超话', '抖音短视频文案'
]

// 判断是否需要输入特别需求
const isNeedAdditionInput = computed(() => {
  return !(form.customHabit as string[]).includes('其他');
})

// 判断是否禁用其他多选项
const isCustomOptionsDisabled = (option: string) => {
  const selected = form.customHabit as string[];
  if (option === '无特别要求') {
    // 如果已经选中了其他任何选项，则禁用“无特别要求”
    return selected.length > 0 && !selected.includes('无特别要求');
  } else {
    // 如果已经选中了“无特别要求”，则禁用其他所有选项
    return selected.includes('无特别要求');
  }
}

const travelFocusOptions = [
  '预算成本可控', '交通出行便利', '客流环境舒适', '拍照出片友好', '安全保障完善', '行程自由度高', '在地原生性强'
]

const travelCustomOptions = [
  '无特别要求', '拒绝早起赶行程', '不走回头路', '有清真/素食等饮食需求', '有过敏避讳', '其他'
]

const travelFocusTips = [
  '全程花费符合心理预期，优先选择高匹配度的交通、住宿、游玩项目，严控非必要额外支出，全预算档位通用',
  '大交通与目的地内通勤便捷，少换乘、少长途奔波，公共交通覆盖完善或自驾友好',
  '目的地人流量少、不拥挤，优先小众目的地 / 错峰出行，拒绝长时间排队与扎堆场景',
  '目的地景观、场景适配拍照打卡，有特色出片点，光线与环境适合拍摄创作',
  '目的地治安良好、户外路线有成熟安全配套、夜间出行便利，全程无高风险场景',
  '行程可随时调整、无强制时间节点，优先选择无跟团约束、可灵活变动的出行方案',
  '优先选择本地原生玩法、本土商户，拒绝商业化网红套路，能体验到目的地原汁原味的生活与特色，全出行风格通用'
]

const formLabelWidth = '140px'

// 响应式判断
const isMobile = ref(false)
const checkMobile = () => {
  isMobile.value = window.innerWidth <= 768
}

const drawerSize = computed(() => isMobile.value ? '100%' : '900px')
const carouselHeight = computed(() => isMobile.value ? '32vh' : '425px') // 从 40vh 下调到 32vh，留出更多空间给按钮
const carouselType = computed(() => isMobile.value ? 'card' : 'card')

//表单验证函数：确保每个选项问题都有值
const isFormValid = computed(() => {
  return form.travelNumber && form.travelDays && form.travelBudget && form.travelStyle && 
         form.travelFocus.length > 0 && form.customHabit.length > 0 &&
         form.startDate && form.travelMethod && form.originPlace;
});

const parallaxScroll = ref(0)
let parallaxScrollEl: HTMLElement | null = null

// --- 碎裂飞散效果相关 ---
const shatterWrapperRef = ref<HTMLElement | null>(null)
const mousePos = reactive({ x: -1000, y: -1000 })
const rows = 12
const cols = 20

// 预生成随机偏移量和旋转角度，保证每次飞散效果一致
const fragmentData = Array.from({ length: rows * cols }, () => {
  const getRandomDisplacement = () => {
    const sign = Math.random() < 0.5 ? -1 : 1
    return (Math.random() * (120 - 75) + 75) * sign
  }
  return {
    x: getRandomDisplacement(),
    y: getRandomDisplacement(),
    z: Math.random() * 50,
    rotateX: (Math.random() - 0.5) * 180,
    rotateY: (Math.random() - 0.5) * 180,
    rotateZ: (Math.random() - 0.5) * 180,
    scale: Math.random() * 0.2 + 0.9,
    delay: Math.random() * 0.05
  }
})

const handleShatterMouseMove = (e: MouseEvent) => {
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  mousePos.x = e.clientX - rect.left
  mousePos.y = e.clientY - rect.top
}

const handleShatterTouchStart = (e: TouchEvent) => {
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  const touch = e.touches[0]
  mousePos.x = touch.clientX - rect.left
  mousePos.y = touch.clientY - rect.top
}

const handleShatterTouchMove = (e: TouchEvent) => {
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  const touch = e.touches[0]
  mousePos.x = touch.clientX - rect.left
  mousePos.y = touch.clientY - rect.top
}

const handleShatterMouseLeave = () => {
  mousePos.x = -1000
  mousePos.y = -1000
}

const getFragmentStyle = (row: number, col: number) => {
  const index = row * cols + col
  const data = fragmentData[index]
  
  const bgX = (col / (cols - 1)) * 100
  const bgY = (row / (rows - 1)) * 100
  
  const style: any = {
    width: `${100 / cols}%`,
    height: '100%',
    backgroundImage: `url(${titleBackImg})`,
    backgroundSize: `${cols * 100}% ${rows * 100}%`,
    backgroundPosition: `${bgX}% ${bgY}%`,
    transition: `all 0.15s cubic-bezier(0.2, 0, 0.2, 1)`,
    willChange: 'transform, opacity'
  }

  // 局部飞散逻辑
  const fragCenterXPercent = (col + 0.5) / cols * 100
  const fragCenterYPercent = (row + 0.5) / rows * 100
  
  let isNear = false
  if (shatterWrapperRef.value && mousePos.x !== -1000) {
    const w = shatterWrapperRef.value.clientWidth
    const h = shatterWrapperRef.value.clientHeight
    const mXPercent = (mousePos.x / w) * 100
    const mYPercent = (mousePos.y / h) * 100
    
    const dx = (fragCenterXPercent - mXPercent) * w / 100
    const dy = (fragCenterYPercent - mYPercent) * h / 100
    const dist = Math.sqrt(dx * dx + dy * dy)
    
    // 局部飞散感应范围
    if (dist < 75) { 
      isNear = true
    }
  }

  if (isNear) {
    style.transform = `translate3d(${data.x}px, ${data.y}px, ${data.z}px) rotateX(${data.rotateX}deg) rotateY(${data.rotateY}deg) rotateZ(${data.rotateZ}deg) scale(${data.scale})`
    style.opacity = '0.7' // 保持一定可见度，展示位移效果
    style.zIndex = '10'
  } else {
    // 恢复时略微增加 transition 时长让过程更优雅
    style.transform = 'translate3d(0, 0, 0) rotateX(0) rotateY(0) rotateZ(0) scale(1)'
    style.opacity = '1'
    style.zIndex = '1'
    style.transition = 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
  }

  return style
}
// ------------------------

const handleSocialPublish = () => {
  socialDrawerVisible.value = true
}

const handleSocialConfirm = () => {
  if (socialForm.platforms.length === 0) return

  // 构造发送给 AI 的指令内容
  // 您可以在这里修改发送给 AI 的具体话术
  const platformsText = socialForm.platforms.join('、')
  const socialPrompt = `model:社交内容\n我希望将之前的旅游行程方案转化为适合在 ${platformsText} 上发布的帖子内容。请根据我的旅行偏好和方案，为我生成吸引人的标题、正文（包含 Emoji）和相关的标签（Hashtags）。`

  // 将指令存入 localStorage，供 AI 对话页面读取
  localStorage.setItem('social-post-request', socialPrompt)

  socialDrawerVisible.value = false
  emit('navigate', 'aiDialogue')
  
  ElNotification({
    title: '正在准备生成',
    message: '已跳转至 AI 对话页面，请稍后...',
    type: 'success',
  })
}

const handleParallaxScroll = () => {
  if (!parallaxScrollEl) return
  requestAnimationFrame(() => {
    if (!parallaxScrollEl) return
    parallaxScroll.value = parallaxScrollEl.scrollTop || 0
  })
}

const parallaxStyle = computed(() => {
  return {
    '--parallax-scroll': `${parallaxScroll.value}px`,
    '--parallax-back-1': `url(${backImg})`,
    '--parallax-title-back': `url(${titleBackImg})`,
    '--parallax-front-1': `url(${frontImg})`
  }
})

const handleConfirm = () =>{
  if (!isFormValid.value) {
    ElNotification({
      title: '表单不完整',
      message: '请填写所有表单选项后再提交',
      type: 'warning',
    })
    return
  }
  
  console.log('表单数据:', form)
  localStorage.setItem('user-profile-form', JSON.stringify(form))
  
  dialogFormVisible.value = false
  emit('navigate', 'aiDialogue')
  afterConfirmMsgBox();
}

const cancelBtn = () => {
  dialogFormVisible.value = false;
  socialDrawerVisible.value = false;
    ElNotification({
    title: '您的表单已保存',
    message: '如果有需要，你可以修改后再次提交。',
    type: 'warning',
  })
}

const afterConfirmMsgBox = () => {
  ElNotification({
    title: '您已点击确认按钮',
    message: '表单已经尝试提交给智能体，请稍后；如果AI无回复重启应用。',
    type: 'success',
  })
}

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
  nextTick(() => {
    parallaxScrollEl = document.querySelector('.index-tabs .el-tabs__content') as HTMLElement | null
    parallaxScrollEl?.addEventListener('scroll', handleParallaxScroll, { passive: true })
    handleParallaxScroll()
  })
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
  parallaxScrollEl?.removeEventListener('scroll', handleParallaxScroll)
  parallaxScrollEl = null
})
</script>

<style scoped>
.info-dialog :deep(.el-dialog__header) {
  text-align: center;
}

/* 走马灯卡片 */
.el-carousel__item h3 {
  color: #475669;
  opacity: 0.75;
  line-height: 200px;
  margin: 0;
  text-align: center;
}

.el-carousel__item {
  background-color: transparent !important;
}

.custom-carousel :deep(.el-carousel__mask) {
  background-color: transparent !important;
}

.custom-carousel {
  width: 100%;
  max-width: 2400px;
}

.carousel-item-content {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  width: 100%;
  overflow: hidden;
}

.carousel-image {
  width: 100%;
  height: 100%;
  object-fit: contain; /* 改为 contain，确保图片全貌显示不被裁剪 */
  border-radius: 12px;
}




.index-page {
  width: 100%;
  min-height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  padding: 0;
  position: relative;
}

.panel {
  width: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  padding: 3vh 0; /* 略微下调垂直边距 */
  position: relative;
  z-index: 1;
}

.parallax-container {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}

/* 页面下方小箭头指引 */
html.dark .pageGuideArrow{
  color: white;
}
.pageGuideArrow{
  color: rgb(4, 99, 140);
}

.parallax-layer {
  position: absolute;
  inset: 0;
  background-repeat: no-repeat;
  background-position: center bottom;
  background-size: cover;
  transform: translate3d(0, 0, 0);
  will-change: transform, opacity;
  /* 添加平滑过渡，让变化更自然 */
  transition: opacity 0.3s ease-out;
}

.parallax-back-1 {
  background-image: var(--parallax-back-1);
  opacity: calc(1 - var(--parallax-p2));
  transform: translate3d(0, calc(var(--parallax-scroll) * -0.06), 0);
  z-index: 1;
}

.parallax-title-back {
  /* background-image: var(--parallax-title-back); */
  transform: translate3d(0, calc(var(--parallax-scroll) * -0.10), 0);
  opacity: 0.7;
  pointer-events: none; /* 顶层依然 none */
  z-index: 5;
  display: flex;
  justify-content: center;
  align-items: flex-start; /* 改为 flex-start 配合 margin-top 使其靠上 */
  perspective: 1000px;
  overflow: visible;
  width: 100%;
  height: 100%;
}

.shatter-wrapper {
  width: 100%; /* 撑满宽度 */
  max-width: none; /* 移除限制 */
  position: relative;
  /* 向下偏移一点，避开顶部导航栏，作为 WELCOME 标题的背景 */
  margin-top: 2%; 
  pointer-events: auto; /* 核心：开启此处的鼠标事件 */
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
}

.shatter-source {
  width: 100%;
  height: auto;
  display: block;
  opacity: 0;
  pointer-events: none;
}

.fragment-grid {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  pointer-events: none; /* 碎片不接收事件 */
}

.shatter-row {
  display: flex;
  width: 100%;
  flex: 1;
  pointer-events: none;
}

.fragment {
  pointer-events: none;
  background-repeat: no-repeat;
  /* background-size 和 background-position 由 getFragmentStyle 动态设置 */
}

.parallax-front-1 {
  background-image: var(--parallax-front-1);
  background-size: contain;
  opacity: calc(1 - var(--parallax-p2));
  transform: translate3d(0, calc(var(--parallax-scroll) * -0.14), 0);
  z-index: 10; /* 位于飞散背景之上 */
  pointer-events: none; /* 让鼠标穿透到下方的飞散层 */
}

.parallax-back-2 {
  background-image: var(--parallax-back-2);
  opacity: var(--parallax-p2);
  transform: translate3d(0, calc(var(--parallax-scroll) * -0.04), 0);
}

.parallax-front-2 {
  background-image: var(--parallax-front-2);
  background-size: contain;
  opacity: var(--parallax-p2);
  transform: translate3d(0, calc(var(--parallax-scroll) * -0.10), 0);
}

.parallax-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to bottom,
    rgba(255, 255, 255, 0.82) 0%,
    rgba(255, 255, 255, 0.55) 35%,
    rgba(255, 255, 255, 0.35) 100%
  );
  z-index: 15;
  pointer-events: none; /* 让鼠标穿透 */
}

html.dark .parallax-overlay {
  background: linear-gradient(
    to bottom,
    rgba(29, 30, 31, 0.88) 0%,
    rgba(29, 30, 31, 0.65) 35%,
    rgba(29, 30, 31, 0.45) 100%
  );
}

.welcome-container {
  text-align: center;
  justify-content: center;
  width: 100%;
  max-width: 1800px;
  position: relative;
  z-index: 1;
}

.shatter-wrapper {
  position: absolute;
  top: 80px; /* 从导航栏下方开始显示 */
  left: 0;
  width: 100%;
  transform: translate3d(0, calc(var(--parallax-scroll) * -0.10), 0);
  z-index: 5; /* 位于 BACK_IMG 之后，FRONT_IMG 之下 */
  pointer-events: none; /* 修改为 none，由顶层 sensor 捕获事件 */
  display: flex;
  justify-content: center;
  align-items: center;
  perspective: 1000px;
  overflow: visible;
}

.shatter-sensor {
  position: fixed; /* 使用 fixed 与 parallax-container 同步 */
  top: 80px;
  left: 0;
  width: 100%;
  /* 必须使用同样的 transform 以保证位置同步 */
  transform: translate3d(0, calc(var(--parallax-scroll) * -0.10), 0);
  z-index: 100; /* 位于所有图层最上方 */
  pointer-events: auto;
  cursor: crosshair;
  background: transparent;
}


.shatter-source {
  width: 100%;
  height: auto;
  display: block;
  opacity: 0;
  pointer-events: none;
}

.fragment-grid {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  pointer-events: none;
}

.shatter-row {
  display: flex;
  width: 100%;
  flex: 1;
  pointer-events: none;
}

.fragment {
  pointer-events: none;
  background-repeat: no-repeat;
}

.welcome-title {
  position: relative;
  z-index: 2; /* 确保文字在背景之上 */
  font-size: 52px;
  color: #151c65; /* 亮色模式主标题颜色 */
  margin-bottom: 20px;
  font-weight: bold;
  pointer-events: none;
}

html.dark .welcome-title {
  color: #FFFFFF; /* 暗色模式主标题颜色 */
}

@media (max-width: 768px) {
  .welcome-title {
    font-size: 38px;
  }
  
  .panel {
    padding-top: 10px !important;
  }
  
  .carousel-section {
    margin-top: 20px;
  }

  .welcome-subtitle {
    font-size: 16px !important;
    margin-bottom: 10px !important;
  }
  
  .action-buttons {
    flex-direction: column;
    gap: 15px !important;
    padding: 0 20px;
    margin: 3vh auto 0 auto; /* 使用 auto 居中整个容器 */
    max-width: 320px; /* 恢复宽度限制 */
  }
  
  .big-action-btn {
    padding: 15px 30px !important;
    font-size: 16px !important;
    width: 100%;
    height: 54px !important;
    border-radius: 12px !important;
  }
  
  .profile-form :deep(.el-form-item__label) {
    min-width: 100px !important;
    font-size: 14px !important;
  }
  
  .profile-form :deep(.el-form-item) {
    margin-bottom: 15px !important;
  }
  
  .shatter-wrapper, .shatter-sensor {
    top: 65px !important;
  }
}

.welcome-subtitle {
  position: relative;
  z-index: 2;
  font-size: 24px;
  color: rgba(21, 28, 101, 0.8); /* 亮色模式副标题颜色，比主标题略浅 */
  margin-bottom: 20px;
  pointer-events: none;
}

html.dark .welcome-subtitle {
  color: rgba(255, 255, 255, 0.8); /* 暗色模式副标题颜色，比主标题略浅 */
}

.action-buttons {
  position: relative;
  z-index: 3;
  display: flex;
  justify-content: center;
  gap: 40px;
  margin-top: 40px;
}

.big-action-btn {
  padding: 25px 40px !important;
  font-size: 20px !important;
  font-weight: bold !important;
  transition: all 0.3s ease !important;
  border: none !important;
  color: white !important;
}

.big-action-btn.el-button--primary {
  background: linear-gradient(to right, #83CFF9, #A8A7FE) !important;
}

.big-action-btn.el-button--success {
  background: linear-gradient(to right, rgb(43, 208, 123), #5DE1C9) !important;
}

.big-action-btn:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
  opacity: 0.9;
}

.carousel-section {
  position: relative;
  z-index: 3; /* 确保走马灯可点击且不被飞散效果覆盖 */
  width: 100%;
  max-width: 1800px;
  margin: 0 auto 30px auto;
}

.carousel-title {
  font-size: 20px;
  color: #409eff;
  margin-bottom: 15px;
  text-align: center;
}

.feature-card {
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
  text-align: left;
}

.button-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  justify-items: center;
  text-align: center;
}

.button-grid .el-button {
  width: 100%;
}

.button-grid .el-button + .el-button {
  margin-left: 0;
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
  /* 首页卡片页脚分割线颜色，默认与背景颜色一致 */
  border-top-color: #1A1A1A;
}

html.dark .feature-card .el-card__body p {
  /* 用户画像卡片描述字体颜色 */
  color: #e4e7ed;
}

html.dark .card-header h2 {
  /* 用户画像卡片头部标题字体颜色 */
  color: #e4e7ed;
}


.info-drawer {
  background-color: rgba(0, 0, 0, 0.55) !important;
}

.info-drawer :deep(.el-drawer__header) {
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.info-drawer :deep(.el-drawer__body) {
  position: relative;
}

.info-drawer :deep(.el-drawer__body)::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.55);
  pointer-events: none;
}

.drawer-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 20px;
}

.drawer-footer :deep(.el-button) {
  font-size: 18px;
}

.social-checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
}

.social-checkbox-item {
  width: 100%;
  margin-left: 0 !important;
  margin-right: 0 !important;
  height: auto !important;
  padding: 12px 20px !important;
}

.social-checkbox-item :deep(.el-checkbox__label) {
  font-size: 16px;
}

.profile-form :deep(.el-form-item) {
  margin-bottom: 24px;
  font-size: 16px !important;
  width: 100%;
}

.profile-form :deep(.el-form-item__label) {
  font-size: 16px !important;
  justify-content: right;
  text-align: left;
  min-width: 160px !important;
}

.profile-form :deep(.el-radio-button__inner) {
  font-size: 16px !important;
}

.profile-form :deep(.el-form-item__content) {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-start;
}

.profile-form :deep(.radio-wrap) {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-start;
}

.profile-form :deep(.el-form-item__content::-webkit-scrollbar) {
  display: none;
}
</style>

<template>
  <div class="index-page" :style="parallaxStyle">
    <div class="parallax-container" aria-hidden="true">
      <div class="parallax-layer parallax-back parallax-back-1"></div>
      <div class="parallax-layer parallax-front parallax-front-1"></div>
      <div class="parallax-layer parallax-back parallax-back-2"></div>
      <div class="parallax-layer parallax-front parallax-front-2"></div>
      <div class="parallax-overlay"></div>
    </div>
    <section class="panel panel-1">
      <div class="welcome-container">
        <h1 class="welcome-title">WELCOME</h1>
        <p class="welcome-subtitle">文途智行</p>
        <p class="welcome-subtitle">为您智能推荐导游路线和旅游项目</p>
        <el-card class="feature-card">
          <template #header>
            <div class="card-header">
            <h2>生成自己的用户画像</h2>
            </div>
          </template>
            <p>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;根据自己的使用需求和爱好，使用AI生成，制作专属于自己的用户画像，让AI推荐更加精准。</p>
            <template #footer>
              <el-button type="primary" round @click="dialogFormVisible = true">前往生成</el-button>
              <el-drawer 
                v-model="dialogFormVisible" 
                title="请完成下面的问卷调查" 
                size="900px"
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
            </template>
        </el-card>

        <el-card class="feature-card social-card" style="margin-top: 20px;">
          <template #header>
            <div class="card-header">
              <h2>社交平台发布</h2>
            </div>
          </template>
          <p>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;将您的 AI 行程方案一键转化为精美的社交平台帖子（如小红书、朋友圈等样式），快速分享您的旅行灵感。</p>
          <template #footer>
            <el-button type="success" round @click="handleSocialPublish">前往生成</el-button>
            <el-drawer 
              v-model="socialDrawerVisible" 
              title="选择发布的平台" 
              size="500px"
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
          </template>
        </el-card>
      </div>
      <br>
      <h2 class="pageGuideArrow">更多 ↓ 内容</h2>
    </section>

    <section ref="secondPanelRef" class="panel panel-2">
      <h1 text="2xl" justify="center">精选景点</h1>
      <el-carousel :interval="4000" height="470px" class="custom-carousel" type="card">
        <el-carousel-item v-for="(img, index) in recommendPlaces" :key="index">
          <div class="carousel-item-content">
            <img :src="img" :alt="'place' + (index + 1)" class="carousel-image" />
          </div>
        </el-carousel-item>
      </el-carousel>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, reactive, ref } from 'vue'
import { ElNotification } from 'element-plus'
import frontImg from '../assets/FRONT_IMG.png'
import backImg from '../assets/BACK_IMG.png'
import frontImg2 from '../assets/2FRONT.png'
import backImg2 from '../assets/2BACK.png'
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
  '小红书', '微信朋友圈 / QQ空间', '微博超话', '抖音短视频文案', '知乎深度游记', 'B站Vlog内容'
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

//表单验证函数：确保每个选项问题都有值
const isFormValid = computed(() => {
  return form.travelNumber && form.travelDays && form.travelBudget && form.travelStyle && 
         form.travelFocus.length > 0 && form.customHabit.length > 0 &&
         form.startDate && form.travelMethod && form.originPlace;
});

const parallaxScroll = ref(0)
const parallaxMix = ref(0)
let parallaxScrollEl: HTMLElement | null = null
const secondPanelRef = ref<HTMLElement | null>(null)
let secondPanelObserver: IntersectionObserver | null = null

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
    '--parallax-front-1': `url(${frontImg})`,
    '--parallax-back-2': `url(${backImg2})`,
    '--parallax-front-2': `url(${frontImg2})`,
    '--parallax-p2': `${parallaxMix.value}`
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
  nextTick(() => {
    parallaxScrollEl = document.querySelector('.index-tabs .el-tabs__content') as HTMLElement | null
    parallaxScrollEl?.addEventListener('scroll', handleParallaxScroll, { passive: true })
    handleParallaxScroll()

    if (parallaxScrollEl && secondPanelRef.value) {
      const thresholds = Array.from({ length: 11 }, (_, i) => i / 10)
      secondPanelObserver = new IntersectionObserver(
        (entries) => {
          const entry = entries[0]
          const ratio = entry?.intersectionRatio ?? 0
          requestAnimationFrame(() => {
            parallaxMix.value = Math.min(1, Math.max(0, ratio * 1.2))
          })
        },
        {
          root: parallaxScrollEl,
          threshold: thresholds
        }
      )
      secondPanelObserver.observe(secondPanelRef.value)
    }
  })
})

onUnmounted(() => {
  parallaxScrollEl?.removeEventListener('scroll', handleParallaxScroll)
  parallaxScrollEl = null
  secondPanelObserver?.disconnect()
  secondPanelObserver = null
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

.el-carousel__item:nth-child(2n) {
  background-color: #99a9bf;
}

.el-carousel__item:nth-child(2n + 1) {
  background-color: #d3dce6;
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
  width: auto;
  height: auto;
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.el-carousel__item {
  background-color: transparent !important;
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
  justify-content: center;
  align-items: center;
  padding: 20px 0;
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
}

.parallax-front-1 {
  background-image: var(--parallax-front-1);
  background-size: contain;
  opacity: calc(1 - var(--parallax-p2));
  transform: translate3d(0, calc(var(--parallax-scroll) * -0.14), 0);
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
  max-width: 800px;
  position: relative;
  z-index: 1;
}

.welcome-title {
  font-size: 48px;
  /* 欢迎标题颜色 */
  color: #409eff;
  margin-bottom: 20px;
}

.welcome-subtitle {
  font-size: 24px;
  /* 欢迎副标题颜色 */
  color: #23A6EB;
  margin-bottom: 40px;
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

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
                size="1100px"
                class="info-drawer"
                direction="rtl"
              >
                <el-form :model="form" class="profile-form">
                  <el-form-item label="你的MBTI性格大类" :label-width="formLabelWidth">
                    <el-input v-model="form.MBTIPersonalityType" style="width: 100%" placeholder="输入MBTI代码" />
                  </el-form-item>
                  <el-form-item label="文化价值观倾向" :label-width="formLabelWidth">
                    <div class="radio-wrap">
                      <el-radio v-model="form.CulturalValueOrientation" label="传统文化" border>传统文化</el-radio>
                      <el-radio v-model="form.CulturalValueOrientation" label="潮流创新" border>潮流创新</el-radio>
                      <el-radio v-model="form.CulturalValueOrientation" label="人文情怀" border>人文情怀</el-radio>
                      <el-radio v-model="form.CulturalValueOrientation" label="探险挑战" border>探险挑战</el-radio>
                    </div>
                  </el-form-item>
                  <el-form-item label="参与的旅游活动类型" :label-width="formLabelWidth">
                    <div class="radio-wrap">
                      <el-radio v-model="form.HistorialTravelType" label="城市观光" border>城市观光</el-radio>
                      <el-radio v-model="form.HistorialTravelType" label="户外徒步" border>户外徒步</el-radio>
                      <el-radio v-model="form.HistorialTravelType" label="海滨度假" border>海滨度假</el-radio>
                      <el-radio v-model="form.HistorialTravelType" label="古镇体验" border>古镇体验</el-radio>
                      <el-radio v-model="form.HistorialTravelType" label="主题乐园" border>主题乐园</el-radio>
                      <el-radio v-model="form.HistorialTravelType" label="文化遗址打卡" border>文化遗址打卡</el-radio>
                    </div>
                  </el-form-item>
                  <br>
                  <el-form-item label="计划旅游渠道" :label-width="formLabelWidth">
                    <div class="radio-wrap">
                      <el-radio v-model="form.DecisionReferenceChannel" label="社交媒体" border>社交媒体</el-radio>
                      <el-radio v-model="form.DecisionReferenceChannel" label="旅游攻略网站" border>旅游攻略网站</el-radio>
                      <el-radio v-model="form.DecisionReferenceChannel" label="亲友推荐" border>亲友推荐</el-radio>
                      <el-radio v-model="form.DecisionReferenceChannel" label="官方文旅平台" border>官方文旅平台</el-radio>
                    </div>
                  </el-form-item>
                  <br>
                  <el-form-item label="尝试新体验偏好" :label-width="formLabelWidth">
                    <div class="radio-wrap">
                      <el-radio v-model="form.CulturalPreferenceType" label="历史文化" border>历史文化</el-radio>
                      <el-radio v-model="form.CulturalPreferenceType" label="民俗文化" border>民俗文化</el-radio>
                      <el-radio v-model="form.CulturalPreferenceType" label="宗教文化" border>宗教文化</el-radio>
                      <el-radio v-model="form.CulturalPreferenceType" label="现代流行文化" border>现代流行文化</el-radio>
                      <el-radio v-model="form.CulturalPreferenceType" label="艺术文化" border>艺术文化</el-radio>
                      <el-radio v-model="form.CulturalPreferenceType" label="自然生态文化" border>自然生态文化</el-radio>
                    </div>
                  </el-form-item>
                  <br>
                  <el-form-item label="风险偏好程度" :label-width="formLabelWidth">
                    <div class="radio-wrap">
                      <el-radio v-model="form.RiskPreferenceLevel" label="风险规避（无刺激体验）" border>风险规避（无刺激体验）</el-radio>
                      <el-radio v-model="form.RiskPreferenceLevel" label="风险中性（适当刺激体验）" border>风险中性（适当刺激体验）</el-radio>
                      <el-radio v-model="form.RiskPreferenceLevel" label="风险偏好（较多刺激体验）" border>风险偏好（较多刺激体验）</el-radio>
                    </div>
                  </el-form-item>
                  <br>
                  <el-form-item label="出行倾向的社交规模" :label-width="formLabelWidth">
                    <div class="radio-wrap">
                      <el-radio v-model="form.TravelSocialScale" label="独自出行" border>独自出行</el-radio>
                      <el-radio v-model="form.TravelSocialScale" label="情侣" border>情侣</el-radio>
                      <el-radio v-model="form.TravelSocialScale" label="家庭亲子" border>家庭亲子</el-radio>
                      <el-radio v-model="form.TravelSocialScale" label="团队" border>团队</el-radio>
                      <el-radio v-model="form.TravelSocialScale" label="朋友结伴" border>朋友结伴</el-radio>
                    </div>
                  </el-form-item>
                  <br>
                  <el-form-item label="进行出行活动的频率" :label-width="formLabelWidth">
                    <div class="radio-wrap">
                      <el-radio v-model="form.TravelBehaviorFrequency" label="高频(每月1次+)" border>高频(每月1次+)</el-radio>
                      <el-radio v-model="form.TravelBehaviorFrequency" label="中频(每季度1次)" border>中频(每季度1次)</el-radio>
                      <el-radio v-model="form.TravelBehaviorFrequency" label="低频(每年1次及以下)" border>低频(每年1次及以下)</el-radio>
                    </div>
                  </el-form-item>
                  <br>
                  <el-form-item label="决策受影响度" :label-width="formLabelWidth">
                    <div class="radio-wrap">
                      <el-radio v-model="form.SocialDecisionInfluenceDegree" label="完全自主决策" border>完全自主决策</el-radio>
                      <el-radio v-model="form.SocialDecisionInfluenceDegree" label="参考社交意见" border>参考社交意见</el-radio>
                      <el-radio v-model="form.SocialDecisionInfluenceDegree" label="受社交推荐主导" border>受社交推荐主导</el-radio>
                    </div>
                  </el-form-item>
                  <br>
                  <el-form-item label="学习风格类型" :label-width="formLabelWidth">
                    <div class="radio-wrap">
                      <el-radio v-model="form.LearningStyleType" label="视觉型(偏好景观/展览)" border>视觉型(偏好景观/展览)</el-radio>
                      <el-radio v-model="form.LearningStyleType" label="听觉型(偏好讲解/演出)" border>听觉型(偏好讲解/演出)</el-radio>
                      <el-radio v-model="form.LearningStyleType" label="体验型(偏好互动参与)" border>体验型(偏好互动参与)</el-radio>
                    </div>
                  </el-form-item>
                  <br>
                </el-form>
                <template #footer>
                  <div class="drawer-footer">
                    <el-button @click="dialogFormVisible = false" size="large">取消</el-button>
                    <el-button type="primary" @click="handleConfirm" size="large">确定</el-button>
                  </div>
                </template>
              </el-drawer>
            </template>
        </el-card>
      </div>
    </section>

    <section ref="secondPanelRef" class="panel panel-2">
      <el-card class="feature-card tools-card">
        <template #header>
        <div class="card-header">
          <span>常用工具链接</span>
        </div>
      </template>
      <div class="button-grid">
      <el-link href="https://ditu.amap.com/" target="_blank"><el-button>高德地图</el-button></el-link>
      <el-link href="https://passport.meituan.com/" target="_blank"><el-button>美团订购</el-button></el-link>
      <el-link href="https://www.didiglobal.com/" target="_blank"><el-button>嘀嘀打车</el-button></el-link>
      <el-link href="https://www.bilibili.com/" target="_blank"><el-button>哔哩哔哩</el-button></el-link>
      <el-link href="https://www.msn.cn/zh-cn/weather/" target="_blank"><el-button>天气预报</el-button></el-link>
      <el-link href="https://www.xiaohongshu.com/explore" target="_blank"><el-button>小红书</el-button></el-link>
      <el-link href="https://www.douyin.com" target="_blank"><el-button>抖音</el-button></el-link>
      </div>
      
      <template #footer></template>
      </el-card>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, reactive, ref } from 'vue'
import frontImg from '../assets/FRONT_IMG.png'
import backImg from '../assets/BACK_IMG.png'
import frontImg2 from '../assets/2FRONT.png'
import backImg2 from '../assets/2BACK.png'

const emit = defineEmits<{
  (e: 'navigate', tabName: string): void
}>()

const dialogFormVisible = ref(false)
const form = reactive({
    MBTIPersonalityType: '',
    CulturalValueOrientation: '',
    HistorialTravelType: '',
    DecisionReferenceChannel: '',
    CulturalPreferenceType: '',
    RiskPreferenceLevel:'',
    TravelSocialScale: '',
    TravelBehaviorFrequency:'',
    SocialDecisionInfluenceDegree: '',
    LearningStyleType: ''

})
const formLabelWidth = '140px'
 
const parallaxScroll = ref(0)
const parallaxMix = ref(0)
let parallaxScrollEl: HTMLElement | null = null
const secondPanelRef = ref<HTMLElement | null>(null)
let secondPanelObserver: IntersectionObserver | null = null

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

const handleConfirm = () => {
  console.log('表单数据:', form)
  
  // 保存表单数据到 localStorage
  localStorage.setItem('user-profile-form', JSON.stringify(form))
  
  // 关闭对话框并跳转到 AI 对话页面
  dialogFormVisible.value = false
  emit('navigate', 'aiDialogue')
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

.profile-form :deep(.el-form-item) {
  margin-bottom: 24px;
}

.profile-form :deep(.el-form-item__content) {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.profile-form :deep(.radio-wrap) {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.profile-form :deep(.el-form-item__content) {
  display: flex;
  overflow-x: auto; /* 如果万一超出了，允许横向滚动而不是换行，保证单行显示 */
  scrollbar-width: none; /* 隐藏滚动条 */
}

.profile-form :deep(.el-form-item__content::-webkit-scrollbar) {
  display: none;
}
</style>

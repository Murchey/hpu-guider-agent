<template>
  <div class="map-planning-page">
    <div class="map-layout">
      <div class="sidebar">
        <div class="sidebar-header">
          <h3>行程路线规划</h3>
          <div v-if="itineraryList.length > 0" class="compact-itinerary">
            <div v-for="(item, index) in itineraryList" :key="item.id" class="compact-item-wrapper">
              <div class="compact-item" :class="{ 'is-departure': item.type === 'departure' }">
                <span class="compact-name">
                  <el-icon v-if="item.type === 'departure'" class="departure-icon"><LocationFilled /></el-icon>
                  {{ index + 1 }}. {{ item.name }}
                </span>
                <div class="compact-controls">
                  <el-button 
                    link
                    size="small" 
                    :icon="CaretTop" 
                    :disabled="index === 0 || (index === 1 && itineraryList[0].type === 'departure')"
                    @click="moveUp(index)"
                  />
                  <el-button 
                    link
                    size="small" 
                    :icon="CaretBottom" 
                    :disabled="index === itineraryList.length - 1 || item.type === 'departure'"
                    @click="moveDown(index)"
                  />
                </div>
              </div>
              <!-- 添加紧凑列表中的出行描述 -->
              <div v-if="index < itineraryList.length - 1 && (travelTimes[index] || segmentDetails[index])" class="compact-travel-info">
                <el-icon class="mode-icon">
                  <Van v-if="item.travel_mode === 'driving' || !item.travel_mode" />
                  <Guide v-else-if="item.travel_mode === 'walking'" />
                  <Promotion v-else-if="item.travel_mode === 'transit'" />
                  <Bicycle v-else-if="item.travel_mode === 'cycling'" />
                </el-icon>
                <span class="text">{{ getTravelTime(index) }}</span>
                <span v-if="segmentDetails[index]" class="details">({{ segmentDetails[index] }})</span>
              </div>
            </div>
          </div>
          <p v-else class="empty-tip">暂无规划数据，请先在对话中生成行程</p>
        </div>
        
        <VueDraggable
          v-model="itineraryList"
          class="draggable-list"
          item-key="id"
          @end="handleDragEnd"
          :animation="200"
          :filter="'.is-departure'"
        >
          <template #item="{ element, index }">
            <div class="itinerary-item" :class="{ 'is-departure': element.type === 'departure' }">
              <div class="item-index" :class="{ 'departure-index': element.type === 'departure' }">
                <el-icon v-if="element.type === 'departure'"><LocationFilled /></el-icon>
                <span v-else>{{ index + 1 }}</span>
              </div>
              <div class="item-content">
                <div class="item-header">
                  <div class="item-name">
                    <el-tag v-if="element.type === 'departure'" size="small" type="danger" effect="dark" class="departure-tag">起点</el-tag>
                    {{ element.name }}
                  </div>
                  <div class="item-move-controls">
                    <el-button 
                      circle 
                      size="small" 
                      :icon="CaretTop" 
                      :disabled="index === 0 || (index === 1 && itineraryList[0].type === 'departure')"
                      @click.stop="moveUp(index)"
                    />
                    <el-button 
                      circle 
                      size="small" 
                      :icon="CaretBottom" 
                      :disabled="index === itineraryList.length - 1 || element.type === 'departure'"
                      @click.stop="moveDown(index)"
                    />
                  </div>
                </div>
                <div class="item-desc">{{ element.description }}</div>
                <div v-if="element.type !== 'departure'" class="item-duration">建议停留: {{ element.suggested_duration }}分钟</div>
              </div>
              <div v-if="index < itineraryList.length - 1" class="travel-time">
                <el-divider border-style="dashed">
                  <div class="travel-info">
                    <el-dropdown trigger="click" @command="(mode) => handleModeChange(index, mode)">
                      <div class="mode-display">
                        <el-icon v-if="element.travel_mode === 'walking'"><Guide /></el-icon>
                        <el-icon v-else-if="element.travel_mode === 'transit'"><Promotion /></el-icon>
                        <el-icon v-else-if="element.travel_mode === 'cycling'"><Bicycle /></el-icon>
                        <el-icon v-else><Van /></el-icon>
                        <div class="mode-text">
                          <span class="time">{{ getTravelTime(index) }}</span>
                          <span v-if="segmentDetails[index]" class="details">{{ segmentDetails[index] }}</span>
                        </div>
                      </div>
                      <template #dropdown>
                        <el-dropdown-menu>
                          <el-dropdown-item command="driving">驾车</el-dropdown-item>
                          <el-dropdown-item command="transit">公交</el-dropdown-item>
                          <el-dropdown-item command="walking">步行</el-dropdown-item>
                          <el-dropdown-item command="cycling">骑行</el-dropdown-item>
                        </el-dropdown-menu>
                      </template>
                    </el-dropdown>
                  </div>
                </el-divider>
              </div>
            </div>
          </template>
        </VueDraggable>

        <div class="sidebar-footer" v-if="itineraryList.length > 0">
          <el-button type="primary" class="confirm-btn" @click="handleConfirm">发送并确认行程</el-button>
          <el-button type="success" class="open-map-btn" @click="openAmapApp" style="margin-top: 12px; margin-left: 0;">在地图APP中打开</el-button>
        </div>
      </div>
      
      <div class="map-container-wrapper">
        <div class="map-container" id="map-container"></div>
        <div class="map-legend" v-if="itineraryList.length > 0">
          <div class="legend-item" v-for="(color, mode) in modeColors" :key="mode">
            <span class="legend-line" :style="{ backgroundColor: color }"></span>
            <el-icon class="legend-icon">
              <Van v-if="mode === 'driving'" />
              <Guide v-else-if="mode === 'walking'" />
              <Promotion v-else-if="mode === 'transit'" />
              <Bicycle v-else-if="mode === 'cycling'" />
              <LocationFilled v-else-if="mode === 'railway'" />
            </el-icon>
            <span class="legend-text">
              {{ mode === 'driving' ? '驾车' : mode === 'walking' ? '步行' : mode === 'transit' ? '公交' : mode === 'cycling' ? '骑行' : '火车' }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed, shallowRef, nextTick } from 'vue'
import { VueDraggable } from 'vue-draggable-plus'
import { Van, CaretTop, CaretBottom, LocationFilled, Bicycle, Guide, Bicycle as CyclingIcon, Promotion } from '@element-plus/icons-vue'
import AMapLoader from '@amap/amap-jsapi-loader'
import axios from 'axios'
import { useChatStore } from '../stores/chatStore'
import { ElMessage } from 'element-plus'

const props = defineProps<{
  activeTab?: string
}>()

const emit = defineEmits<{
  (e: 'navigate', tabName: string): void
}>()

const chatStore = useChatStore()
const itineraryList = ref<any[]>([])
const travelTimes = ref<Record<number, string>>({})
const segmentDetails = ref<Record<number, string>>({})

// 定义模式对应的颜色 (采用更鲜明、对比度更高的色彩方案)
const modeColors: Record<string, string> = {
  driving: '#0084FF', // 鲜蓝色
  walking: '#13C2C2', // 青绿色
  transit: '#722ED1', // 紫色 (公共交通常用色)
  cycling: '#FA8C16', // 橙色 (充满活力的骑行色)
  railway: '#F5222D'  // 红色 (高铁/火车常用色)
}

// 使用 shallowRef 避免 Vue 对 SDK 内部对象进行 Proxy 包装，导致内部调用失败
const AMapInstance = shallowRef<any>(null)
const map = shallowRef<any>(null)
const calculators = shallowRef<Record<string, any>>({})
const geocoder = shallowRef<any>(null)

/**
 * 获取两个坐标点之间的弧形路径（模拟高铁/航线）
 */
const getArcPath = (start: any, end: any, steps = 50) => {
  const path = []
  const startLng = start.getLng()
  const startLat = start.getLat()
  const endLng = end.getLng()
  const endLat = end.getLat()

  // 计算距离
  const distance = Math.sqrt(Math.pow(endLng - startLng, 2) + Math.pow(endLat - startLat, 2))
  // 弧度高度系数，长途可以稍微平缓一点
  const curveHeight = distance * 0.12

  for (let i = 0; i <= steps; i++) {
    const ratio = i / steps
    let lng = startLng + (endLng - startLng) * ratio
    let lat = startLat + (endLat - startLat) * ratio
    
    // 添加正弦波偏移，模拟弧度
    lat += Math.sin(ratio * Math.PI) * curveHeight 
    path.push(new AMapInstance.value.LngLat(lng, lat))
  }
  return path
}

// 辅助函数：根据坐标获取城市名称
const getCityName = (lnglat: any): Promise<string> => {
  return new Promise((resolve) => {
    if (!geocoder.value) {
      resolve('洛阳') // 默认兜底
      return
    }
    geocoder.value.getAddress(lnglat, (status: string, result: any) => {
      if (status === 'complete' && result.regeocode) {
        const component = result.regeocode.addressComponent
        // 优先取 city，如果 city 为空（直辖市），则取 province
        const cityName = component.city || component.province || '洛阳'
        resolve(cityName)
      } else {
        resolve('洛阳')
      }
    })
  })
}

// 监听 tab 切换，当切换到地图页时执行 resize
watch(() => props.activeTab, (newTab) => {
  if (newTab === 'mapPlanning' && map.value) {
    console.log('地图页激活，执行 resize 并尝试重绘')
    nextTick(async () => {
      map.value.resize()
      // 如果已经有数据，强制触发一次重绘，确保在容器尺寸正确后显示标记
      if (itineraryList.value.length > 0) {
        await updateMap()
      }
    })
  }
})
const isMapInitialized = computed(() => {
  const hasMap = !!map.value
  const hasInstance = !!AMapInstance.value
  const hasDriving = !!calculators.value?.driving
  const hasTransit = !!calculators.value?.transit
  
  const isReady = hasMap && hasInstance && hasDriving && hasTransit
  
  if (!isReady) {
    console.log('地图初始化状态未就绪:', { 
      hasMap, 
      hasInstance, 
      hasDriving,
      hasTransit,
      calculatorsExist: !!calculators.value
    })
  } else {
    console.log('地图初始化状态已就绪!')
  }
  return isReady
})

let driving: any = null
let markers: any[] = []
let polylines: any[] = []

// 计算简要路径名称
const routeSummary = computed(() => {
  if (itineraryList.value.length === 0) return ''
  return itineraryList.value.map(item => item.name).join(' → ')
})

const moveUp = (index: number) => {
  if (index === 0) return
  // 如果当前是第1个景点（index 1），且第0个是出发地，禁止上移
  if (index === 1 && itineraryList.value[0].type === 'departure') return

  const item = itineraryList.value.splice(index, 1)[0]
  itineraryList.value.splice(index - 1, 0, item)
  updateMap()
}

const moveDown = (index: number) => {
  if (index === itineraryList.value.length - 1) return
  // 如果当前是出发地，禁止下移
  if (itineraryList.value[index].type === 'departure') return

  const item = itineraryList.value.splice(index, 1)[0]
  itineraryList.value.splice(index + 1, 0, item)
  updateMap()
}

const handleModeChange = (index: number, mode: string) => {
  if (itineraryList.value[index]) {
    itineraryList.value[index].travel_mode = mode
    updateMap()
  }
}

const getTravelTime = (index: number) => {
  return travelTimes.value[index] || '计算中...'
}

const initMap = async () => {
  console.log('开始执行 initMap...')
  // 优先从 import.meta.env 读取，如果没有，提供兜底的测试 key（仅供演示/测试使用）
  const amapKey = import.meta.env.VITE_AMAP_KEY || 'bd0e994a36acbf769cf428f8a1b10965'
  const securityCode = import.meta.env.VITE_AMAP_SECURITY_CODE || '041b801bef278fb69682240d62c53a1d'

  if (!amapKey || amapKey === '在此处填写您的KEY' || amapKey.trim() === '') {
    ElMessage.warning('检测到高德地图 Key 未配置，请在根目录 .env 文件中配置真实的 Key 以启用地图功能。')
    return
  }

  try {
    // 设置安全密钥
    if (securityCode && securityCode.trim() !== '') {
      window._AMapSecurityConfig = {
        securityJsCode: securityCode,
      }
    } else {
      // 当没有配置 securityCode 时，可以通过配置 serviceHost 来让高德 SDK 走代理
      // 在本地开发或无后端代理时，暂时删除此项。但是如果报错 USERKEY_PLAT_NOMATCH
      // 说明您申请的 Web端(JS API) Key 是需要配合 SecurityCode 或者代理的。
      // 作为备用方案，为了让纯 Web 服务 API Key 在地图 JS API 里也能“勉强”使用（不推荐，易失效），我们尝试强制清空安全配置：
      window._AMapSecurityConfig = {
        securityJsCode: '',
      }
    }

    console.log('正在调用 AMapLoader.load...')
    const AMap = await AMapLoader.load({
      key: amapKey,
      version: '2.0',
      plugins: [
        'AMap.Driving',
        'AMap.Walking',
        'AMap.Transit',
        'AMap.Transfer', // 增加备选插件
        'AMap.Riding',
        'AMap.Marker',
        'AMap.Polyline',
        'AMap.InfoWindow',
        'AMap.Geocoder'
      ]
    })
    console.log('AMapLoader.load 完成')

    AMapInstance.value = AMap
    geocoder.value = new AMap.Geocoder()

    const container = document.getElementById('map-container')
    if (!container) {
      console.error('致命错误: 找不到 map-container 元素')
      return
    }

    console.log('正在创建 Map 实例...')
    map.value = new AMap.Map('map-container', {
      zoom: 12,
      center: [116.397, 39.908]
    })
    console.log('Map 实例创建成功')

    // 确保所有规划实例已创建且属性完整
    const commonConfig = { hideMarkers: true }
    console.log('正在初始化各模式规划器...')
    
    const tempCalculators: any = {}
    
    try {
      console.log('AMap 实例中的可用属性/插件:', Object.keys(AMap).filter(key => key.includes('Driving') || key.includes('Walking') || key.includes('Transit') || key.includes('Transfer') || key.includes('Riding')))
      
      if (AMap.Driving) {
        tempCalculators.driving = new AMap.Driving({ ...commonConfig })
        console.log('Driving 规划器就绪')
      } else {
        console.warn('AMap.Driving 插件未找到')
      }

      if (AMap.Walking) {
        tempCalculators.walking = new AMap.Walking({ ...commonConfig })
        console.log('Walking 规划器就绪')
      }

      // 针对 Transit 的兼容性处理：优先使用 Transfer 构造器以更好地支持跨城规划
      const TransitConstructor = AMap.Transfer || AMap.Transit
      if (TransitConstructor) {
        // 使用更明确的策略常量
        const policy = AMap.TransferPolicy ? AMap.TransferPolicy.LEAST_TIME : (AMap.TransitPolicy ? AMap.TransitPolicy.LEAST_TIME : 0)
        
        tempCalculators.transit = new TransitConstructor({ 
          ...commonConfig,
          policy: policy
        })
        console.log(`Transit 规划器就绪 (使用 ${AMap.Transfer ? 'Transfer' : 'Transit'} 构造器, 策略: ${policy})`)
      } else {
        console.warn('初次尝试未找到 Transit/Transfer 插件，尝试动态加载...')
        AMap.plugin(['AMap.Transfer'], () => {
          if (AMap.Transfer) {
            const policy = AMap.TransferPolicy ? AMap.TransferPolicy.LEAST_TIME : 0
            tempCalculators.transit = new AMap.Transfer({ ...commonConfig, policy: policy })
            calculators.value = { ...tempCalculators }
            console.log('Transfer 规划器动态加载成功')
          }
        })
      }

      if (AMap.Riding) {
        tempCalculators.cycling = new AMap.Riding({ ...commonConfig })
        console.log('Riding 规划器就绪')
      }
    } catch (calcErr) {
      console.error('初始化规划器过程中发生错误:', calcErr)
    }

    // 原子操作赋值
    calculators.value = tempCalculators
    driving = tempCalculators.driving
    console.log('所有规划器赋值完成，calculators.value:', Object.keys(calculators.value))

    if (chatStore.currentMapData) {
      console.log('initMap 发现已有数据，触发首次 updateMap')
      itineraryList.value = chatStore.currentMapData.itinerary.map(item => ({
        ...item,
        travel_mode: item.travel_mode || 'driving'
      }))
      await updateMap()
    }
  } catch (e) {
    console.error('地图加载或初始化过程中捕获到异常:', e)
    ElMessage.error('地图初始化失败，请检查网络或 Key 配置')
  }
}

let updateTimer: any = null
const updateMap = async () => {
  // 增加对就绪状态的校验
  if (!isMapInitialized.value) {
    console.log('地图更新被跳过: 基础实例或规划器尚未就绪')
    return
  }

  // 防抖处理，避免短时间内多次重绘导致的性能问题和浏览器警告
  if (updateTimer) clearTimeout(updateTimer)
  updateTimer = setTimeout(async () => {
    const AMap = AMapInstance.value
    if (!AMap || !map.value) return

    const container = document.getElementById('map-container')
    if (container) {
      const { offsetWidth, offsetHeight } = container
      console.log('当前地图容器尺寸:', { width: offsetWidth, height: offsetHeight })
      if (offsetHeight === 0) {
        console.warn('地图容器高度为 0，可能导致地图不可见')
      }
    }

    if (itineraryList.value.length === 0) {
      console.log('地图更新被跳过: 行程列表为空')
      return
    }

    try {
      console.log(`开始执行 updateMap 重绘逻辑... 地点总数: ${itineraryList.value.length}`)
      if (itineraryList.value.length > 0) {
        console.log('行程数据地点列表:', itineraryList.value.map(item => item.name).join(' -> '))
      }
      
      // 清除旧标记和旧路径
      markers.forEach(m => {
        if (m) m.setMap(null)
      })
      markers = []

      // 清除旧轨迹线
      polylines.forEach(p => p.setMap(null))
      polylines = []
      
      // 清理详细描述
      segmentDetails.value = {}

      // 清除所有规划实例的内部状态
      if (calculators.value) {
        Object.values(calculators.value).forEach(calc => {
          if (calc && typeof calc.clear === 'function') calc.clear()
        })
      }

      // 添加新标记
      itineraryList.value.forEach((item, index) => {
        const lng = Number(item.coordinates?.lng)
        const lat = Number(item.coordinates?.lat)
        
        if (isNaN(lng) || isNaN(lat)) {
          console.error(`地点 ${index + 1}: ${item.name} 坐标无效:`, item.coordinates)
          return
        }

        console.log(`正在创建标记: ${index + 1}. ${item.name} (${lng}, ${lat})`)
      const isDeparture = item.type === 'departure'
      
      try {
        const marker = new AMap.Marker({
          position: new AMap.LngLat(lng, lat),
          label: {
            content: `<div class="marker-label ${isDeparture ? 'is-departure' : ''}">${isDeparture ? '起' : index + 1}</div>`,
            direction: 'top',
            offset: new AMap.Pixel(0, -5)
          },
          map: map.value,
          zIndex: isDeparture ? 110 : 100
        })
        markers.push(marker)
        console.log(`标记 ${index + 1} 创建成功并添加到地图`)
      } catch (markerErr) {
        console.error(`标记 ${index + 1} 创建失败:`, markerErr)
      }
    })

      // 添加新标记后立即执行一次缩放，确保标记可见
      if (map.value && markers.length > 0) {
        console.log('标记添加完成，执行初始 setFitView')
        map.value.setFitView(markers)
      }

      // 绘制各路段并等待完成
      await drawSegments()

      // 全部绘制完成后再次缩放，包含路径
      if (map.value) {
        console.log(`路径绘制完成，最终统计 -> 标记: ${markers.length}, 轨迹线: ${polylines.length}`)
        map.value.setFitView(null, false, [60, 60, 60, 60]) // 增加边距，确保长途路径不被边缘遮挡
      }
    } catch (err) {
      console.error('更新地图过程中发生错误:', err)
    }
  }, 100)
}

// ----------------------------------------------------------------
// 核心绘制逻辑
// ----------------------------------------------------------------

const drawSegments = async () => {
  if (itineraryList.value.length < 2 || !calculators.value.driving) return

  const AMap = AMapInstance.value
  if (!AMap || !map.value) return

  console.log('开始执行 drawSegments 路径规划绘制...')

  // 逐段规划和绘制
  for (let i = 0; i < itineraryList.value.length - 1; i++) {
    const p1 = itineraryList.value[i]
    const p2 = itineraryList.value[i+1]
    const mode = p1.travel_mode || 'driving'
    
    // 即使指定的规划器不存在，也进入 performSearch 尝试使用驾车模式兜底
    // calculator 会在 performSearch 内部根据 currentMode 获取

    // 坐标校验
    const lng1 = Number(p1.coordinates?.lng)
    const lat1 = Number(p1.coordinates?.lat)
    const lng2 = Number(p2.coordinates?.lng)
    const lat2 = Number(p2.coordinates?.lat)

    if (isNaN(lng1) || isNaN(lat1) || isNaN(lng2) || isNaN(lat2)) {
      console.error(`第 ${i+1} 段: 坐标无效`, { p1, p2 })
      travelTimes.value[i] = '坐标错误'
      continue
    }

    const start = new AMap.LngLat(lng1, lat1)
    const end = new AMap.LngLat(lng2, lat2)

    let cleanCity1 = ''
    let cleanCity2 = ''
    if (mode === 'transit') {
      const city1 = await getCityName(start)
      const city2 = await getCityName(end)
      // 兼容处理：移除“市”字后缀，高德某些版本对带“市”字的匹配更严格或不匹配
      cleanCity1 = city1.replace(/市$/, '')
      cleanCity2 = city2.replace(/市$/, '')
      console.log(`第 ${i+1} 段: 公交规划城市检测 -> 起点: ${cleanCity1}, 终点: ${cleanCity2}`)
    }

    // 内部规划函数，支持递归兜底
    const performSearch = async (currentMode: string, isFallback = false): Promise<boolean> => {
      const currentCalc = calculators.value[currentMode] || calculators.value.driving
      
      console.log(`第 ${i+1} 段: 发起请求 (${currentMode}${isFallback ? ' 兜底模式' : ''})...`)

      if (currentMode === 'transit') {
        const amapWebKey = import.meta.env.VITE_AMAP_WEB_KEY || import.meta.env.VITE_AMAP_KEY || 'ebd8cfa25b1f6958d7a8b5488c1af02c'
        const url = 'https://restapi.amap.com/v3/direction/transit/integrated'
        
        try {
          const response = await axios.get(url, {
            params: {
              key: amapWebKey,
              origin: `${lng1},${lat1}`,
              destination: `${lng2},${lat2}`,
              city: cleanCity1 || '洛阳',
              cityd: cleanCity2 || '洛阳',
              extensions: 'all'
            }
          })
          
          const data = response.data
          if (data.status === '1' && data.route && data.route.transits && data.route.transits.length > 0) {
            const transit = data.route.transits[0]
            const segments = transit.segments || []
            const details: string[] = []
            
            if (segments.length > 0) {
              segments.forEach((seg: any) => {
                let segPath: any[] = []
                let isWalk = false
                let lineName = ''

                // Web API 返回的数据结构
                const mode = seg.transit?.mode || seg.bus?.buslines?.[0]?.type || ''
                
                if (mode === 'TRAIN' || seg.railway) {
                  const railway = seg.railway || seg.transit
                  const trip = railway.trip || railway.name || railway.lines?.[0]?.name || '火车'
                  const depStation = railway.departure_stop?.name || railway.departure_stop?.location || railway.lines?.[0]?.departure_stop?.name || ''
                  const arrStation = railway.arrival_stop?.name || railway.arrival_stop?.location || railway.lines?.[0]?.arrival_stop?.name || ''
                  const depTime = railway.departure_time || railway.lines?.[0]?.departure_time || ''
                  const arrTime = railway.arrival_time || railway.lines?.[0]?.arrival_time || ''
                  
                  lineName = trip
                  
                  let fullTrainInfo = trip
                  if (depStation || arrStation) {
                    fullTrainInfo += ` (${depStation}${depTime ? ' ' + depTime : ''} → ${arrStation}${arrTime ? ' ' + arrTime : ''})`
                  } else {
                    fullTrainInfo += ` (${cleanCity1} → ${cleanCity2})`
                  }
                  details.push(fullTrainInfo)
                  
                  const rStartLoc = railway.departure_stop?.location ? railway.departure_stop.location.split(',').map(Number) : [lng1, lat1]
                  const rEndLoc = railway.arrival_stop?.location ? railway.arrival_stop.location.split(',').map(Number) : [lng2, lat2]
                  
                  const rStart = new AMapInstance.value.LngLat(rStartLoc[0] || lng1, rStartLoc[1] || lat1)
                  const rEnd = new AMapInstance.value.LngLat(rEndLoc[0] || lng2, rEndLoc[1] || lat2)
                  
                  // 使用模拟弧线
                  segPath = getArcPath(rStart, rEnd)
                  console.log(`第 ${i+1} 段: 使用模拟弧线绘制火车路径 -> ${lineName}`)
                  
                } else if (seg.bus && seg.bus.buslines && seg.bus.buslines.length > 0) {
                  // 公交或地铁
                  const busline = seg.bus.buslines[0]
                  lineName = busline.name
                  details.push(lineName)
                  if (busline.polyline) {
                    segPath = busline.polyline.split(';').map((p: string) => {
                      const [lng, lat] = p.split(',').map(Number)
                      return new AMapInstance.value.LngLat(lng || lng1, lat || lat1)
                    })
                  }
                } else if (seg.walking && seg.walking.steps && seg.walking.steps.length > 0) {
                  isWalk = true
                  segPath = []
                  seg.walking.steps.forEach((step: any) => {
                    if (step.polyline) {
                      step.polyline.split(';').forEach((p: string) => {
                        const [lng, lat] = p.split(',').map(Number)
                        segPath.push(new AMapInstance.value.LngLat(lng || lng1, lat || lat1))
                      })
                    }
                  })
                }

                if (segPath.length > 0) {
                  const polyline = new AMapInstance.value.Polyline({
                    path: segPath,
                    strokeColor: isWalk ? '#999' : (mode === 'SUBWAY' ? '#9013FE' : (mode === 'TRAIN' ? modeColors.railway : modeColors[currentMode] || modeColors.transit)),
                    strokeWeight: isWalk ? 4 : 8,
                    strokeStyle: isWalk ? 'dashed' : 'solid',
                    strokeOpacity: isWalk ? 0.7 : 1,
                    zIndex: isWalk ? 900 : 1000,
                    map: map.value,
                    showDir: !isWalk
                  })
                  polylines.push(polyline)

                  // 为火车路段添加文本标签
                  if ((mode === 'TRAIN' || seg.railway) && lineName) {
                    const text = new AMapInstance.value.Text({
                      text: `🚄 ${lineName}`,
                      position: segPath[Math.floor(segPath.length / 2)],
                      offset: new AMapInstance.value.Pixel(0, -20),
                      style: {
                        'background-color': modeColors.railway,
                        'border-color': '#fff',
                        'color': '#fff',
                        'font-size': '12px',
                        'padding': '2px 6px',
                        'border-radius': '4px'
                      },
                      map: map.value
                    })
                    polylines.push(text)
                  }
                }
              })
              
              if (details.length > 0) {
                segmentDetails.value[i] = details.join(' → ')
              } else {
                segmentDetails.value[i] = '公交/地铁'
              }
              travelTimes.value[i] = transit.cost ? `约 ${Math.ceil(transit.cost / 60)} 分钟` : '计算中'
              return true
            }
          }
          
          // 如果未找到路线方案，兜底
          console.warn(`第 ${i+1} 段: ${currentMode} 规划无结果，尝试使用驾车模式兜底...`)
          return await performSearch('driving', true)
        } catch (error) {
          console.error(`第 ${i+1} 段: 解析异常`, error)
          return await performSearch('driving', true)
        }
      }

      return new Promise((resolve) => {
        currentCalc.search(start, end, (status: string, result: any) => {
          console.log(`第 ${i+1} 段: 返回状态 (${currentMode}) -> ${status}`, result?.info ? `(Info: ${result.info})` : '')
          
          let hasPathData = false
          if (status === 'complete' && result) {
            const route = result.routes?.[0] || result.rides?.[0]
            hasPathData = !!(route && (
              (route.path && route.path.length > 0) || 
              (route.steps && route.steps.length > 0) ||
              (route.rides && route.rides.length > 0)
            ))
          }

          if (hasPathData) {
            try {
              const route = result.routes?.[0] || result.rides?.[0]
              let path: any[] = []
              if (route.path?.length > 0) path = route.path
              else if (route.steps) route.steps.forEach((s: any) => s.path && path.push(...s.path))
              else if (route.rides) route.rides.forEach((r: any) => r.path && path.push(...r.path))

              if (path.length > 0) {
                const lngLats = path.map(p => new AMapInstance.value.LngLat(p.lng || p[0], p.lat || p[1]))
                const polyline = new AMapInstance.value.Polyline({
                  path: lngLats,
                  strokeColor: modeColors[currentMode] || '#409EFF',
                  strokeWeight: 8,
                  map: map.value,
                  showDir: true,
                  zIndex: 1000
                })
                polylines.push(polyline)
                travelTimes.value[i] = route.time ? `约 ${Math.ceil(route.time / 60)} 分钟` : '计算中'
                
                const modeMap: any = { driving: '驾车', walking: '步行', cycling: '骑行' }
                segmentDetails.value[i] = modeMap[currentMode] || ''
              }
              resolve(true)
            } catch (e) {
              console.error(`第 ${i+1} 段: 解析异常`, e)
              resolve(false)
            }
          } else {
            if (!isFallback && currentMode !== 'driving') {
              console.warn(`第 ${i+1} 段: ${currentMode} 规划无结果 (${result.info})，尝试使用驾车模式兜底...`)
              performSearch('driving', true).then(resolve)
            } else {
              console.warn(`第 ${i+1} 段: 所有规划模式均失败，绘制直线距离线段`)
              const directLine = new AMapInstance.value.Polyline({
                path: [start, end],
                strokeColor: '#FF4D4F',
                strokeWeight: 4,
                strokeStyle: 'dashed',
                strokeOpacity: 0.6,
                map: map.value,
                zIndex: 800
              })
              polylines.push(directLine)
              travelTimes.value[i] = '建议自行导航'
              resolve(true)
            }
          }
        })
      })
    }

    await performSearch(mode)
  }
}

// 移除原有的 drawRoute 和 calculateSegmentTimes
// const drawRoute = ...
// const calculateSegmentTimes = ...

const handleDragEnd = () => {
  updateMap()
}

const handleConfirm = () => {
  if (itineraryList.value.length === 0) {
    ElMessage.warning('当前没有可确认的行程')
    return
  }

  // 构造完整的格式化 JSON 数据发送给 AI
  const confirmData = {
    type: 'itinerary_confirm',
    summary: routeSummary.value,
    itinerary: itineraryList.value.map(item => ({
      id: item.id,
      name: item.name,
      type: item.type,
      coordinates: item.coordinates,
      suggested_duration: item.suggested_duration,
      travel_mode: item.travel_mode || 'driving',
      description: item.description
    }))
  }

  const message = `[MAP_CONFIRM]${JSON.stringify(confirmData)}[/MAP_CONFIRM]`

  // 将消息存入 localStorage 供对话页读取并发送
  localStorage.setItem('pending-map-confirm', message)

  ElMessage.success('行程已确认，正在同步至 AI 对话...')

  // 跳转回对话页
  emit('navigate', 'aiDialogue')
}

// 唤起高德地图
const openAmapApp = () => {
  if (itineraryList.value.length < 2) {
    ElMessage.warning('至少需要两个地点才能规划路线')
    return
  }

  const start = itineraryList.value[0]
  const end = itineraryList.value[itineraryList.value.length - 1]
  const waypoints = itineraryList.value.slice(1, -1)
  
  // 组装途经点字符串（如果存在）
  let waypointsStr = ''
  if (waypoints.length > 0) {
    waypointsStr = '&pid=' + waypoints.map(wp => `${wp.coordinates.lat},${wp.coordinates.lng},${encodeURIComponent(wp.name)}`).join(';')
  }
  
  // 构建高德地图 URI
  // URI 规范参考: https://lbs.amap.com/api/amap-mobile/guide/android/route
  const schemeUrl = `amapuri://route/plan/?dlat=${end.coordinates.lat}&dlon=${end.coordinates.lng}&dname=${encodeURIComponent(end.name)}&slat=${start.coordinates.lat}&slon=${start.coordinates.lng}&sname=${encodeURIComponent(start.name)}${waypointsStr}&dev=0&t=0`
  
  // Web 端高德地图兜底链接
  const webUrl = `https://uri.amap.com/navigation?from=${start.coordinates.lng},${start.coordinates.lat},${encodeURIComponent(start.name)}&to=${end.coordinates.lng},${end.coordinates.lat},${encodeURIComponent(end.name)}&mode=car&policy=1&src=mypage&coordinate=gaode&callnative=1`
  
  // 尝试打开 APP，失败则打开网页版
  const iframe = document.createElement('iframe')
  iframe.src = schemeUrl
  iframe.style.display = 'none'
  document.body.appendChild(iframe)
  
  setTimeout(() => {
    document.body.removeChild(iframe)
    window.open(webUrl, '_blank')
  }, 1000)
}

// 监听数据和初始化状态，确保在两者都就绪时自动触发更新
watch([() => chatStore.currentMapData, isMapInitialized], async ([newData, initialized]) => {
  console.log('watch [currentMapData, isMapInitialized] 触发:', { 
    hasData: !!newData, 
    initialized,
    itineraryCount: newData?.itinerary?.length || 0 
  })
  
  if (newData && initialized) {
    console.log('数据和地图均已就绪，正在同步 itineraryList...')
    itineraryList.value = newData.itinerary.map(item => ({
      ...item,
      travel_mode: item.travel_mode || 'driving'
    }))
    await updateMap()
  } else if (newData && !initialized) {
    console.log('已有数据但地图尚未初始化，等待初始化后自动重绘')
    // 即使地图未就绪，也可以先同步侧边栏数据
    itineraryList.value = newData.itinerary.map(item => ({
      ...item,
      travel_mode: item.travel_mode || 'driving'
    }))
  }
}, { deep: true, immediate: true })

onMounted(async () => {
  // 确保 DOM 已完全渲染
  await nextTick()
  await initMap()
})

onUnmounted(() => {
  if (map.value) {
    map.value.destroy()
  }
})
</script>

<style scoped>
.map-planning-page {
  height: 100%;
  width: 100%;
}

.map-layout {
  display: flex;
  height: 100%;
  width: 100%;
}

.sidebar {
  width: 350px;
  background: var(--el-bg-color);
  border-right: 1px solid var(--el-border-color-light);
  display: flex;
  flex-direction: column;
  padding: 16px;
  overflow-y: auto;
}

.sidebar-header h3 {
  margin-top: 0;
  margin-bottom: 8px;
  color: var(--el-text-color-primary);
}

.compact-itinerary {
  margin-bottom: 12px;
  padding: 8px;
  background: var(--el-color-primary-light-9);
  border-radius: 4px;
  border-left: 3px solid var(--el-color-primary);
  max-height: 200px;
  overflow-y: auto;
}

.compact-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
}

.compact-travel-info {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: var(--el-text-color-secondary);
  padding-left: 20px;
  margin-bottom: 4px;
  border-left: 1px dashed var(--el-color-primary-light-5);
  margin-left: 10px;
}

.compact-travel-info .mode-icon {
  font-size: 12px;
}

.compact-travel-info .details {
  font-size: 10px;
  opacity: 0.8;
}

.compact-item.is-departure {
  color: var(--el-color-danger);
}

.compact-item.is-departure .compact-name {
  color: var(--el-color-danger);
  font-weight: bold;
}

.departure-icon {
  margin-right: 4px;
  vertical-align: middle;
}

.compact-item:last-child {
  border-bottom: none;
}

.compact-name {
  font-size: 14px;
  color: var(--el-color-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  margin-right: 8px;
  line-height: 1.6;
}

.compact-controls {
  display: flex;
  gap: 4px;
}

.empty-tip {
  color: var(--el-text-color-secondary);
  font-size: 15px;
}

.draggable-list {
  flex: 1;
}

.itinerary-item {
  background: var(--el-fill-color-light);
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 28px;
  position: relative;
  cursor: grab;
  border: 1px solid transparent;
  transition: all 0.3s;
}

.itinerary-item:hover {
  border-color: var(--el-color-primary);
  background: var(--el-fill-color);
}

.itinerary-item.is-departure {
  border-left: 4px solid var(--el-color-danger);
  background: var(--el-color-danger-light-9);
  cursor: default;
}

.item-index.departure-index {
  background: var(--el-color-danger);
}

.departure-tag {
  margin-right: 4px;
  vertical-align: middle;
}

.item-index {
  position: absolute;
  left: -12px;
  top: -12px;
  width: 28px;
  height: 28px;
  background: var(--el-color-primary);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 14px;
  z-index: 2;
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
  gap: 8px;
}

.item-name {
  font-weight: bold;
  font-size: 16px;
  flex: 1;
  line-height: 1.4;
}

.item-move-controls {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}

.item-desc {
  font-size: 14px;
  color: var(--el-text-color-secondary);
  margin-bottom: 8px;
  line-height: 1.6;
}

.item-duration {
  font-size: 13px;
  color: var(--el-color-info);
  line-height: 1.4;
}

.travel-time {
  position: absolute;
  bottom: -22px;
  left: 0;
  width: 100%;
}

.travel-info {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: var(--el-color-primary);
  padding: 0 8px;
  background: var(--el-bg-color);
  border-radius: 12px;
  border: 1px solid var(--el-color-primary-light-7);
  cursor: pointer;
  transition: all 0.2s;
}

.travel-info:hover {
  background: var(--el-color-primary-light-9);
  border-color: var(--el-color-primary);
}

.mode-display {
  display: flex;
  align-items: center;
  gap: 8px;
}

.mode-text {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  line-height: 1.2;
}

.mode-text .time {
  font-weight: bold;
}

.mode-text .details {
  font-size: 10px;
  color: var(--el-text-color-secondary);
  white-space: normal; /* 允许换行以显示更全的火车信息 */
  word-break: break-all;
  max-width: 260px; /* 增加宽度限制 */
  margin-top: 2px;
}

.mode-display .el-icon {
  font-size: 14px;
}

.travel-time :deep(.el-divider--horizontal) {
  margin: 0;
}

.map-container-wrapper {
  flex: 1;
  height: 100%;
  position: relative;
}

.map-container {
  width: 100%;
  height: 100%;
}

.map-legend {
  position: absolute;
  bottom: 24px;
  right: 24px;
  background: var(--el-bg-color);
  padding: 12px 16px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 10px;
  border: 1px solid var(--el-border-color-light);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--el-text-color-primary);
}

.legend-line {
  width: 24px;
  height: 4px;
  border-radius: 2px;
}

.legend-icon {
  font-size: 16px;
  color: var(--el-text-color-secondary);
}

.legend-text {
  font-weight: 500;
}

html.dark .map-legend {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
}

.sidebar-footer {
  padding-top: 16px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.confirm-btn {
  width: 100%;
}

.open-map-btn {
  width: 100%;
}

/* 高德地图 Marker Label 样式修复 */
:deep(.amap-marker-label) {
  border: none;
  background-color: transparent;
}

:deep(.marker-label) {
  padding: 4px 8px;
  background-color: var(--el-color-primary);
  color: white;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  white-space: nowrap;
}

:deep(.marker-label.is-departure) {
  background-color: var(--el-color-danger);
}

html.dark :deep(.marker-label) {
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.5);
}
</style>

<template>
  <div class="map-planning-page">
    <div class="map-layout">
      <div class="sidebar">
        <div class="sidebar-header">
          <h3>行程路线规划</h3>
          <div v-if="itineraryList.length > 0" class="compact-itinerary">
            <div v-for="(item, index) in itineraryList" :key="item.id" class="compact-item" :class="{ 'is-departure': item.type === 'departure' }">
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
                        <span>{{ getTravelTime(index) }}</span>
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
        </div>
      </div>
      
      <div class="map-container" id="map-container"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import { VueDraggable } from 'vue-draggable-plus'
import { Van, CaretTop, CaretBottom, LocationFilled, Bicycle, Guide, Bicycle as CyclingIcon, Promotion } from '@element-plus/icons-vue'
import AMapLoader from '@amap/amap-jsapi-loader'
import { useChatStore } from '../stores/chatStore'
import { ElMessage } from 'element-plus'

const emit = defineEmits<{
  (e: 'navigate', tabName: string): void
}>()

const chatStore = useChatStore()
const itineraryList = ref<any[]>([])
const travelTimes = ref<Record<number, string>>({})

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

let AMapInstance: any = null
let map: any = null
let driving: any = null // 保留作为默认全局路径显示（如果全是驾车）
let calculators: Record<string, any> = {} // 存储各模式的计算实例
let markers: any[] = []
let polylines: any[] = [] // 存储手动绘制的各路段轨迹线

const handleModeChange = (index: number, mode: string) => {
  itineraryList.value[index].travel_mode = mode
  updateMap()
}

const getTravelTime = (index: number) => {
  return travelTimes.value[index] || '计算中...'
}

const initMap = async () => {
  const amapKey = import.meta.env.VITE_AMAP_KEY
  const securityCode = import.meta.env.VITE_AMAP_SECURITY_CODE

  if (!amapKey || amapKey === '在此处填写您的KEY') {
    ElMessage.warning('检测到高德地图 Key 未配置，请在根目录 .env 文件中配置真实的 Key 以启用地图功能。')
    return
  }

  try {
    // 设置安全密钥
    window._AMapSecurityConfig = {
      securityJsCode: securityCode,
    }

    AMapInstance = await AMapLoader.load({
      key: amapKey,
      version: '2.0',
      plugins: [
        'AMap.Driving', 
        'AMap.Walking', 
        'AMap.Transit', 
        'AMap.Riding', 
        'AMap.Marker'
      ]
    })

    map = new AMapInstance.Map('map-container', {
      zoom: 12,
      center: [116.397, 39.908]
    })

    // 初始化各模式的规划实例 (不传入 map: map, 仅用于获取数据)
    const commonConfig = { hideMarkers: true }
    calculators = {
      driving: new AMapInstance.Driving({ ...commonConfig }),
      walking: new AMapInstance.Walking({ ...commonConfig }),
      transit: new AMapInstance.Transit({ ...commonConfig, city: '洛阳' }),
      cycling: new AMapInstance.Riding({ ...commonConfig }) // 高德插件名为 Riding
    }

    // 默认展示实例（驾车）
    driving = calculators.driving

    if (chatStore.currentMapData) {
      itineraryList.value = chatStore.currentMapData.itinerary.map(item => ({
        ...item,
        travel_mode: item.travel_mode || 'driving'
      }))
      await updateMap()
    }
  } catch (e) {
    console.error('地图加载失败', e)
  }
}

const updateMap = async () => {
  if (!map || !AMapInstance || itineraryList.value.length === 0) return

  // 清除旧标记和旧路径
  markers.forEach(m => m.setMap(null))
  markers = []
  
  // 清除旧轨迹线
  polylines.forEach(p => p.setMap(null))
  polylines = []
  
  // 清除所有规划实例的内部状态
  Object.values(calculators).forEach(calc => {
    if (calc && calc.clear) calc.clear()
  })

  // 添加新标记
  itineraryList.value.forEach((item, index) => {
    const isDeparture = item.type === 'departure'
    const marker = new AMapInstance.Marker({
      position: [Number(item.coordinates.lng), Number(item.coordinates.lat)],
      label: {
        content: `<div class="marker-label ${isDeparture ? 'is-departure' : ''}">${isDeparture ? '起' : index + 1}</div>`,
        direction: 'top',
        offset: new AMapInstance.Pixel(0, -5)
      },
      map: map,
      zIndex: isDeparture ? 110 : 100
    })
    markers.push(marker)
  })

  // 绘制各路段并等待完成
  await drawSegments()
  
  // 自动缩放以显示所有点（包括新生成的 Polyline）
  map.setFitView()
}

// 定义模式对应的颜色
const modeColors: Record<string, string> = {
  driving: '#409EFF', // 蓝色
  walking: '#67C23A', // 绿色
  transit: '#E6A23C', // 橙色
  cycling: '#909399'  // 灰色
}

const drawSegments = async () => {
  if (itineraryList.value.length < 2) return

  // 逐段规划和绘制
  for (let i = 0; i < itineraryList.value.length - 1; i++) {
    const p1 = itineraryList.value[i]
    const p2 = itineraryList.value[i+1]
    const mode = p1.travel_mode || 'driving'
    const calculator = calculators[mode]

    if (!calculator) {
      console.warn(`未找到模式 ${mode} 的规划器`)
      continue
    }

    const start = [Number(p1.coordinates.lng), Number(p1.coordinates.lat)]
    const end = [Number(p2.coordinates.lng), Number(p2.coordinates.lat)]

    await new Promise((resolve) => {
      calculator.search(start, end, (status: string, result: any) => {
        if (status === 'complete') {
          let routeData: any = null
          let path: any[] = []

          // 1. 根据不同模式解析数据源
          if (mode === 'transit' && result.plans && result.plans[0]) {
            routeData = result.plans[0]
            // 公交模式轨迹点需要遍历 segments
            if (routeData.segments) {
              routeData.segments.forEach((seg: any) => {
                if (seg.transit && seg.transit.path) path.push(...seg.transit.path)
                if (seg.walking && seg.walking.path) path.push(...seg.walking.path)
              })
            }
          } else if (result.routes && result.routes[0]) {
            routeData = result.routes[0]
            // 驾车、步行、骑行优先取全局 path，无则遍历 steps
            if (routeData.path && routeData.path.length > 0) {
              path = routeData.path
            } else if (routeData.steps) {
              routeData.steps.forEach((step: any) => {
                if (step.path) path.push(...step.path)
              })
            }
          }

          if (path.length > 0) {
            const duration = routeData.time ? Math.ceil(routeData.time / 60) : 0
            travelTimes.value[i] = duration > 0 ? `约 ${duration} 分钟` : '实时计算中'

            // 2. 强制转换坐标格式，确保 Polyline 100% 识别
            const lngLats = path.map(p => {
              const lng = p.lng !== undefined ? p.lng : p[0]
              const lat = p.lat !== undefined ? p.lat : p[1]
              return new AMapInstance.LngLat(lng, lat)
            })

            // 3. 创建并添加折线
            const polyline = new AMapInstance.Polyline({
              path: lngLats,
              strokeColor: modeColors[mode] || '#409EFF',
              strokeWeight: 6,
              strokeOpacity: 0.9,
              lineJoin: 'round',
              lineCap: 'round',
              zIndex: 50,
              bubble: true
            })
            
            polyline.setMap(map)
            polylines.push(polyline)
          } else {
            console.error(`第 ${i+1} 段 (${mode}) 规划成功但未解析到路径`, result)
          }
        } else {
          travelTimes.value[i] = '规划失败'
          console.error(`第 ${i+1} 段规划失败 (${mode}):`, status, result)
        }
        resolve(true)
      })
    })
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

watch(() => chatStore.currentMapData, async (newData) => {
  if (newData) {
    itineraryList.value = newData.itinerary.map(item => ({
      ...item,
      travel_mode: item.travel_mode || 'driving'
    }))
    await updateMap()
  }
}, { deep: true })

onMounted(() => {
  initMap()
})

onUnmounted(() => {
  if (map) {
    map.destroy()
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
  border-bottom: 1px dashed var(--el-color-primary-light-7);
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
  gap: 6px;
}

.mode-display .el-icon {
  font-size: 14px;
}

.travel-time :deep(.el-divider--horizontal) {
  margin: 0;
}

.map-container {
  flex: 1;
  height: 100%;
}

.sidebar-footer {
  padding-top: 16px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.confirm-btn {
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

# 更换 Web 服务 API

## 背景

JS API 的 `AMap.Transit` 插件在跨城场景下可能返回 `NO_DATA`。通过切换到高德 **Web 服务 API**（`direction/transit/integrated`），可获取包含火车/高铁在内的完整跨城方案。

## 切换步骤

### 1. 控制台配置

在高德开放平台控制台，确保 Key 已勾选 **"Web 服务"** 平台（不仅仅是"Web 端 JS API"）。

### 2. 安装 axios

```bash
npm install axios
```

### 3. 调用 Web 服务 API

```typescript
import axios from 'axios'

const AMAP_KEY = '<Web服务Key>'

const planCrossCityRoute = async () => {
  const response = await axios.get(
    'https://restapi.amap.com/v3/direction/transit/integrated',
    {
      params: {
        key: AMAP_KEY,
        origin: '112.463,34.593',
        destination: '118.789,32.020',
        city: '洛阳市',
        cityd: '南京市',
        extensions: 'all'
      }
    }
  )

  const data = response.data
  if (data.status === '1' && data.transits.length > 0) {
    drawRouteFromApi(data.transits[0])
  }
}
```

> **关键**：`city` 和 `cityd` 参数是跨城规划的必要条件。

### 4. 解析与绘制

Web 服务 API 返回的 `segments[].transit.mode` 值：

| mode | 说明 | 绘制方式 |
|------|------|----------|
| `TRAIN` | 火车/高铁 | 取 `departure_stop.location` 和 `arrival_stop.location` 画虚线，中点添加车次标签 |
| `SUBWAY` | 地铁 | 解析 `path` 字符串（`"lng,lat;lng,lat"` 格式）转为坐标数组，绘制实线 |
| `BUS` | 公交 | 同 SUBWAY |
| `WALK` | 步行 | 解析 `path` 字符串，绘制灰色虚线 |

`path` 字符串解析：

```typescript
const path = pathStr.split(';').map(item => {
  const [lng, lat] = item.split(',').map(Number)
  return [lng, lat]
})
```

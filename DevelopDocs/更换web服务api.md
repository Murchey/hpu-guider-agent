从前端 JS API 切换到后端 Web 服务 API，你需要进行**“前后端分离”**式的改造。

简单来说，你不能再在 Vue 组件里直接调用 `AMap.Transit` 了，而是要用 `axios` 去请求高德的 HTTP 接口，拿到数据后再自己画在地图上。

以下是你需要修改的具体步骤和代码：

### 1️⃣ 第一步：准备工作（控制台）

1.  **检查 Key**：确保你在高德控制台申请的 Key 已经勾选了 **“Web服务”** 平台（不仅仅是“Web端(JS API)”）。
2.  **获取密钥**：准备好你的 Key。

### 2️⃣ 第二步：修改 Vue 代码（核心逻辑）

你需要做三件事：**引入 axios** -> **调用 HTTP 接口** -> **解析 JSON 并绘制**。

#### 1. 安装 axios (如果还没装)
在你的项目目录下运行：
```bash
npm install axios
```

#### 2. 修改组件代码
把原来的 `AMap.Transit` 逻辑替换为下面的代码。

```html
<template>
  <div>
    <div id="container" style="width: 100%; height: 600px;"></div>
    <button @click="planCrossCityRoute">开始跨城规划 (Web服务API)</button>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import axios from 'axios'; // 引入 axios
import AMapLoader from '@amap/amap-jsapi-loader';

let map = null;
let AMap = null;

// 你的 Web服务 Key
const AMAP_KEY = '你的Web服务Key'; 

onMounted(async () => {
  // 1. 初始化地图 (只负责显示，不负责算路)
  AMap = await AMapLoader.load({
    key: "你的JS API Key", // 这里填JS API的Key
    version: "2.0"
  });

  map = new AMap.Map('container', {
    zoom: 10,
    center: [116.397428, 39.90923]
  });
});

// 2. 调用 Web服务 API 进行规划
const planCrossCityRoute = async () => {
  const origin = '112.463,34.593'; // 洛阳龙门
  const destination = '118.789,32.020'; // 南京夫子庙
  
  // 关键：必须传 city 和 cityd 才能触发跨城火车规划
  const url = 'https://restapi.amap.com/v3/direction/transit/integrated';
  
  try {
    const response = await axios.get(url, {
      params: {
        key: AMAP_KEY,
        origin: origin,
        destination: destination,
        city: '洛阳市',      // 出发城市
        cityd: '南京市',     // 到达城市
        extensions: 'all'    // 返回详细数据
      }
    });

    const data = response.data;
    
    if (data.status === '1' && data.transits.length > 0) {
      const transit = data.transits[0]; // 取第一条方案
      drawRouteFromApi(transit);        // 绘制路线
    } else {
      alert('未找到路线方案');
    }

  } catch (error) {
    console.error('请求失败', error);
  }
};

// 3. 解析数据并绘制
const drawRouteFromApi = (transitData) => {
  map.clearMap(); // 清空旧图
  const segments = transitData.segments;

  segments.forEach(segment => {
    const mode = segment.transit.mode;
    
    // --- 情况 A: 火车/高铁 (TRAIN) ---
    if (mode === 'TRAIN') {
      const startLoc = segment.transit.departure_stop.location.split(',').map(Number);
      const endLoc = segment.transit.arrival_stop.location.split(',').map(Number);
      const trainName = segment.transit.lines[0].name; // 如 G1812

      // 1. 画一条虚线连接两个火车站 (模拟轨迹)
      const polyline = new AMap.Polyline({
        path: [startLoc, endLoc], // 直接用起止点连线
        strokeColor: '#FF5722',   // 橙色
        strokeWeight: 4,
        strokeStyle: 'dashed',    // 虚线
        map: map
      });

      // 2. 添加文字标签
      new AMap.Text({
        text: `🚄 ${trainName}`,
        position: [(startLoc[0] + endLoc[0]) / 2, (startLoc[1] + endLoc[1]) / 2],
        offset: new AMap.Pixel(-30, -10),
        map: map
      });
    } 
    
    // --- 情况 B: 公交/地铁 (BUS/SUBWAY) ---
    else if (mode === 'BUS' || mode === 'SUBWAY') {
      // Web服务API返回的 path 是字符串 "lng,lat;lng,lat..."，需要转换
      const pathStr = segment.path;
      if (pathStr) {
        const path = pathStr.split(';').map(item => {
          const [lng, lat] = item.split(',').map(Number);
          return [lng, lat];
        });
        
        new AMap.Polyline({
          path: path,
          strokeColor: '#0066FF',
          strokeWeight: 5,
          map: map
        });
      }
    }
    
    // --- 情况 C: 步行 (WALK) ---
    else if (mode === 'WALK') {
       // 同样处理 path 字符串
       const pathStr = segment.path;
       if(pathStr) {
         const path = pathStr.split(';').map(item => {
            const [lng, lat] = item.split(',').map(Number);
            return [lng, lat];
         });
         new AMap.Polyline({
            path: path,
            strokeColor: '#999',
            strokeStyle: 'dashed',
            map: map
         });
       }
    }
  });
  
  map.setFitView(); // 自动调整视野看到所有路线
};
</script>
```

### 📌 总结你需要改的地方

1.  **不再使用** `new AMap.Transit()`。
2.  **新增** `axios.get` 请求 `direction/transit/integrated` 接口。
3.  **新增** `city` 和 `cityd` 参数（这是跨城规划的关键）。
4.  **新增** 数据解析逻辑：
    *   遇到 `TRAIN`：取 `departure_stop.location` 和 `arrival_stop.location` 画虚线。
    *   遇到 `BUS/SUBWAY`：取 `path` 字段（注意要把字符串转成数组）。

这样修改后，你就能完美实现“洛阳 -> 南京”的跨城火车规划显示了。
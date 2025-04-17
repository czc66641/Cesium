<!-- CesiumView.vue -->
<template>
  <div id="cesiumContainer" class="cesium-container"></div>
  <div class="map-selector">
    <label for="map-select">切换地图:</label>
    <select id="map-select" v-model="currentMap" @change="changeMap">
      <option value="googleEarth">谷歌地球影像</option>
      <option value="tiandituImg">天地图影像</option>
      <option value="tiandituVec">天地图矢量</option>
      <option value="arcgisTerrain">ARCGIS 地形图</option>
      <option value="cesiumTerrain1">Cesium地形图1</option>
      <option value="cesiumTerrain2">Cesium地形图2</option>
      <option value="bingAerial">必应卫星影像</option>
      <option value="bingRoad">必应道路</option>
      <option value="gaodeMap">高德地图</option>
      <option value="gaodeSatellite">高德卫星影像</option>
      <option value="osm">OpenStreetMap</option>
    </select>
  </div>

  <!-- 回到初始状态的按钮 -->
  <div class="reset-view-button">
    <button @click="resetView">回到初始状态</button>
  </div>

  <!-- 引入视角控制组件 -->
  <ViewTranference
    v-if="viewer"
    :viewer="viewer"
    :current-location="currentLocation"
    @update-location="updateLocation"
  />

  <!-- 引入数据加载组件 -->
  <FileMap
    v-if="viewer"
    :viewer="viewer"
    :current-location="currentLocation"
    @update-location="updateLocation"
  />

  <!-- 引入空间分析组件 -->
  <Analysis
    v-if="viewer"
    :viewer="viewer"
    :current-location="currentLocation"
    @update-location="updateLocation"
  />

  <!-- 引入鼠标事件组件 -->
  <MouseEvent
    v-if="viewer"
    :viewer="viewer"
    :current-location="currentLocation"
    @update-location="updateLocation"
  />
</template>

<script>
import { defineComponent, onMounted, onBeforeUnmount, ref, watch } from 'vue';
import * as Cesium from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';
import ViewTranference from './ViewTranference.vue';
import FileMap from './FileMap.vue';
import MouseEvent from './MouseEvent.vue';
import Analysis from './Analysis/index.vue';  // 更新引用路径

export default defineComponent({
  name: 'CesiumView',
  components: {
    ViewTranference,
    FileMap,
    MouseEvent,
    Analysis,
  },
  setup() {
    const viewer = ref(null);
    const currentMap = ref('googleEarth');

    // 保存当前相机位置状态
    const currentLocation = ref({
      longitude: 116.4074,
      latitude: 39.9042,
      height: 15000000,
      heading: 0,
      pitch: -90,
      roll: 0,
    });

    // 切换地图的方法
    const changeMap = async () => {
      if (!viewer.value) return;

      viewer.value.imageryLayers.removeAll();
      
      // 默认恢复为平坦地形
      viewer.value.scene.setTerrain(
        new Cesium.Terrain(
          new Cesium.EllipsoidTerrainProvider()
        )
      );

      const gaodeKey = 'b38b391e7fbaa0cbaf84566f941985ca'; // 高德 API 密钥

      try {
        switch (currentMap.value) {
          case 'googleEarth':
            viewer.value.imageryLayers.addImageryProvider(
              new Cesium.UrlTemplateImageryProvider({
                url: 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
                minimumLevel: 0,
                maximumLevel: 19,
              })
            );
            break;

          case 'tiandituImg':
            viewer.value.imageryLayers.addImageryProvider(
              new Cesium.WebMapTileServiceImageryProvider({
                url: 'https://t{s}.tianditu.gov.cn/img_w/wmts?service=wmts&request=GetTile&version=1.0.0&LAYER=img&style=default&tileMatrixSet=w&format=tiles&tilematrixset=w&tilematrix={TileMatrix}&tilerow={TileRow}&tilecol={TileCol}&tk=0db7541916206bdde921c955473b4ad9',
                layer: 'img',
                style: 'default',
                format: 'tiles',
                tileMatrixSetID: 'w',
                subdomains: ['0', '1', '2', '3', '4', '5', '6', '7'],
                maximumLevel: 18,
              })
            );
            viewer.value.imageryLayers.addImageryProvider(
              new Cesium.WebMapTileServiceImageryProvider({
                url: 'https://t{s}.tianditu.gov.cn/cia_w/wmts?service=wmts&request=GetTile&version=1.0.0&LAYER=cia&style=default&tileMatrixSet=w&format=tiles&tilematrixset=w&tilematrix={TileMatrix}&tilerow={TileRow}&tilecol={TileCol}&tk=0db7541916206bdde921c955473b4ad9',
                layer: 'cia',
                style: 'default',
                format: 'tiles',
                tileMatrixSetID: 'w',
                subdomains: ['0', '1', '2', '3', '4', '5', '6', '7'],
                maximumLevel: 18,
              })
            );
            break;

          case 'tiandituVec':
            viewer.value.imageryLayers.addImageryProvider(
              new Cesium.WebMapTileServiceImageryProvider({
                url: 'https://t{s}.tianditu.gov.cn/vec_w/wmts?service=wmts&request=GetTile&version=1.0.0&LAYER=vec&style=default&tileMatrixSet=w&format=tiles&tilematrixset=w&tilematrix={TileMatrix}&tilerow={TileRow}&tilecol={TileCol}&tk=0db7541916206bdde921c955473b4ad9',
                layer: 'vec',
                style: 'default',
                format: 'tiles',
                tileMatrixSetID: 'w',
                subdomains: ['0', '1', '2', '3', '4', '5', '6', '7'],
                maximumLevel: 18,
              })
            );
            viewer.value.imageryLayers.addImageryProvider(
              new Cesium.WebMapTileServiceImageryProvider({
                url: 'https://t{s}.tianditu.gov.cn/cva_w/wmts?service=wmts&request=GetTile&version=1.0.0&LAYER=cva&style=default&tileMatrixSet=w&format=tiles&tilematrixset=w&tilematrix={TileMatrix}&tilerow={TileRow}&tilecol={TileCol}&tk=0db7541916206bdde921c955473b4ad9',
                layer: 'cva',
                style: 'default',
                format: 'tiles',
                tileMatrixSetID: 'w',
                subdomains: ['0', '1', '2', '3', '4', '5', '6', '7'],
                maximumLevel: 18,
              })
            );
            break;

          case 'arcgisTerrain':
            // 添加ARCGIS地图服务作为图层
            viewer.value.imageryLayers.addImageryProvider(
              new Cesium.ArcGisMapServerImageryProvider({
                url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer',
              })
            );
            
            // 设置Cesium全球地形
            viewer.value.scene.setTerrain(
              new Cesium.Terrain(
                await Cesium.CesiumTerrainProvider.fromIonAssetId(3956),
              ),
            );
            break;

          case 'cesiumTerrain1':
            // 添加谷歌地图作为底图
            viewer.value.imageryLayers.addImageryProvider(
              new Cesium.UrlTemplateImageryProvider({
                url: 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
                minimumLevel: 0,
                maximumLevel: 19,
              })
            );
            // 设置Cesium全球地形1
            viewer.value.scene.setTerrain(
              new Cesium.Terrain(
                await Cesium.CesiumTerrainProvider.fromIonAssetId(3956),
              ),
            );
            break;
            
          case 'cesiumTerrain2':
            // 添加OpenStreetMap作为底图
            viewer.value.imageryLayers.addImageryProvider(
              new Cesium.OpenStreetMapImageryProvider({
                url: 'https://a.tile.openstreetmap.org/',
              })
            );
            
            // 设置Cesium全球地形2
            viewer.value.scene.setTerrain(
              new Cesium.Terrain(
                await Cesium.CesiumTerrainProvider.fromIonAssetId(3956),
              ),
            );
            break;

          case 'bingAerial':
            viewer.value.imageryLayers.addImageryProvider(
              await Cesium.IonImageryProvider.fromAssetId(3)
            );
            break;

          case 'bingRoad':
            viewer.value.imageryLayers.addImageryProvider(
              await Cesium.IonImageryProvider.fromAssetId(4)
            );
            break;

          case 'gaodeMap':
            viewer.value.imageryLayers.addImageryProvider(
              new Cesium.UrlTemplateImageryProvider({
                url: `https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}&key=${gaodeKey}`,
                subdomains: ['1', '2', '3', '4'],
                minimumLevel: 3,
                maximumLevel: 18,
              })
            );
            break;

          case 'gaodeSatellite':
            // 添加卫星影像
            viewer.value.imageryLayers.addImageryProvider(
              new Cesium.UrlTemplateImageryProvider({
                url: `https://webst0{s}.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}&key=${gaodeKey}`,
                subdomains: ['1', '2', '3', '4'],
                minimumLevel: 3,
                maximumLevel: 18,
              })
            );
            // 添加道路网标注
            viewer.value.imageryLayers.addImageryProvider(
              new Cesium.UrlTemplateImageryProvider({
                url: `https://webst0{s}.is.autonavi.com/appmaptile?style=8&x={x}&y={y}&z={z}&key=${gaodeKey}`,
                subdomains: ['1', '2', '3', '4'],
                minimumLevel: 3,
                maximumLevel: 18,
              })
            );
            break;

          case 'osm':
          default:
            viewer.value.imageryLayers.addImageryProvider(
              new Cesium.OpenStreetMapImageryProvider({
                url: 'https://a.tile.openstreetmap.org/',
              })
            );
            break;
        }
      } catch (error) {
        console.error(`加载地图 ${currentMap.value} 失败:`, error.message);
        console.warn('fallback 到 OpenStreetMap');
        currentMap.value = 'osm';
        await changeMap();
      }
    };

    // 重置视图
    const resetView = () => {
      if (!viewer.value) return;
      flyToLocation(116.4074, 39.9042, 15000000);
    };

    // 飞行到指定位置
    const flyToLocation = (longitude, latitude, height) => {
      if (!viewer.value) return;

      currentLocation.value.longitude = longitude;
      currentLocation.value.latitude = latitude;
      currentLocation.value.height = height;

      viewer.value.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(longitude, latitude, height),
        orientation: {
          heading: Cesium.Math.toRadians(currentLocation.value.heading),
          pitch: Cesium.Math.toRadians(currentLocation.value.pitch),
          roll: Cesium.Math.toRadians(currentLocation.value.roll),
        },
      });
    };

    // 更新位置（由子组件触发）
    const updateLocation = (newLocation) => {
      Object.assign(currentLocation.value, newLocation);
      flyToLocation(
        currentLocation.value.longitude,
        currentLocation.value.latitude,
        currentLocation.value.height
      );
    };

    onMounted(async () => {
      // 更新 Cesium Ion 密钥
      Cesium.Ion.defaultAccessToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI4Njg5NmJkZS03ZjgwLTRhNWYtYWU5OC01NDRmZTYxNmQ3YmIiLCJpZCI6MjkzOTI4LCJpYXQiOjE3NDQ2MjcyMDB9.pQM7IkMb643M1hF5XHklTSAYMhjmHQDHlei0X8hsokk';

      viewer.value = new Cesium.Viewer('cesiumContainer', {
        imageryProvider: false,
        terrainProvider: new Cesium.EllipsoidTerrainProvider(),
        baseLayerPicker: false,
        geocoder: false,
        homeButton: false,
        sceneModePicker: false,
        navigationHelpButton: false,
        animation: false,
        timeline: false,
        fullscreenButton: false,
        infoBox: false,
        selectionIndicator: false,
      });

      viewer.value._cesiumWidget._creditContainer.style.display = 'none';

      await changeMap();
      resetView();
    });

    onBeforeUnmount(() => {
      if (viewer.value) {
        viewer.value.destroy();
        viewer.value = null;
      }
    });

    // 调试：监听 viewer 是否初始化
    watch(viewer, (newViewer) => {
      console.log('Viewer updated:', newViewer ? 'Initialized' : 'Not initialized');
    });

    return {
      viewer,
      currentMap,
      currentLocation,
      changeMap,
      resetView,
      flyToLocation,
      updateLocation,
      Cesium,
    };
  },
});
</script>

<style>
html,
body {
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  overflow: hidden;
}

.cesium-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  overflow: hidden;
}

.map-selector {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 1000;
  background-color: rgba(255, 255, 255, 0.8);
  padding: 10px;
  border-radius: 5px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
}

.map-selector label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
  font-size: 14px;
}

.map-selector select {
  padding: 6px 10px;
  width: 180px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
  background-color: white;
  cursor: pointer;
}

.reset-view-button {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 1000;
}

.reset-view-button button {
  padding: 8px 12px;
  background-color: rgba(255, 255, 255, 0.8);
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
  font-weight: bold;
}

.reset-view-button button:hover {
  background-color: rgba(240, 240, 240, 0.95);
}

.cesium-viewer-toolbar,
.cesium-viewer-animationContainer,
.cesium-viewer-timelineContainer,
.cesium-viewer-bottom {
  display: none !important;
}
</style>
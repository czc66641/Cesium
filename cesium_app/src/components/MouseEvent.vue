<!-- MouseEvent.vue -->
<template>
    <div class="mouse-info-panel">
      <div class="mouse-info-title">鼠标位置信息</div>
      <div class="mouse-info-content">
        <p><strong>当前经纬度:</strong> {{ mousePosition.lat ? mousePosition.lat.toFixed(6) + '°, ' + mousePosition.lon.toFixed(6) + '°' : '无' }}</p>
        <p><strong>当前高度:</strong> {{ mousePosition.height ? mousePosition.height.toFixed(2) + ' m' : '无' }}</p>
        <p><strong>笛卡尔坐标:</strong> {{ mousePosition.cartesian ? `(${mousePosition.cartesian.x.toFixed(2)}, ${mousePosition.cartesian.y.toFixed(2)}, ${mousePosition.cartesian.z.toFixed(2)})` : '无' }}</p>
        <p><strong>点击位置:</strong> {{ clickPosition.lat ? clickPosition.lat.toFixed(6) + '°, ' + clickPosition.lon.toFixed(6) + '°' : '未点击' }}</p>
      </div>
    </div>
  </template>
  
  <script>
  import { defineComponent, onMounted, onBeforeUnmount, reactive } from 'vue';
  import * as Cesium from 'cesium';
  
  export default defineComponent({
    name: 'MouseEvent',
    props: {
      viewer: {
        type: Object,
        required: true,
      },
      currentLocation: {
        type: Object,
        required: true,
      },
    },
    emits: ['update-location'],
    setup(props, { emit }) {
      // 当前鼠标位置状态
      const mousePosition = reactive({
        lat: null,
        lon: null,
        height: null,
        cartesian: null,
      });
  
      // 鼠标点击位置状态
      const clickPosition = reactive({
        lat: null,
        lon: null,
        height: null,
        cartesian: null,
      });
  
      let handler = null;
  
      // 初始化鼠标事件
      const initMouseEvents = () => {
        if (!props.viewer) {
          console.error('Viewer is not initialized in MouseEvent');
          return;
        }
  
        handler = new Cesium.ScreenSpaceEventHandler(props.viewer.scene.canvas);
  
        // 鼠标移动事件
        handler.setInputAction((movement) => {
          const cartesian = props.viewer.camera.pickEllipsoid(
            movement.endPosition,
            props.viewer.scene.globe.ellipsoid
          );
  
          if (cartesian) {
            const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
            mousePosition.lat = Cesium.Math.toDegrees(cartographic.latitude);
            mousePosition.lon = Cesium.Math.toDegrees(cartographic.longitude);
            mousePosition.height = cartographic.height;
            mousePosition.cartesian = cartesian;
          } else {
            mousePosition.lat = null;
            mousePosition.lon = null;
            mousePosition.height = null;
            mousePosition.cartesian = null;
          }
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
  
        // 鼠标左键点击事件
        handler.setInputAction((click) => {
          const cartesian = props.viewer.camera.pickEllipsoid(
            click.position,
            props.viewer.scene.globe.ellipsoid
          );
  
          if (cartesian) {
            const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
            clickPosition.lat = Cesium.Math.toDegrees(cartographic.latitude);
            clickPosition.lon = Cesium.Math.toDegrees(cartographic.longitude);
            clickPosition.height = cartographic.height;
            clickPosition.cartesian = cartesian;
  
            // 通知父组件点击位置（可选）
            emit('update-location', {
              ...props.currentLocation,
              longitude: clickPosition.lon,
              latitude: clickPosition.lat,
              height: 1000, // 调整到点击位置的近视角
            });
          }
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
      };
  
      onMounted(() => {
        initMouseEvents();
      });
  
      onBeforeUnmount(() => {
        // 清理事件处理器
        if (handler && !handler.isDestroyed()) {
          handler.destroy();
          handler = null;
        }
      });
  
      return {
        mousePosition,
        clickPosition,
      };
    },
  });
  </script>
  
  <style scoped>
  .mouse-info-panel {
    position: absolute;
    bottom: 10px;
    left: 10px;
    z-index: 1000;
    background-color: rgba(255, 255, 255, 0.8);
    padding: 10px;
    border-radius: 5px;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
    width: 250px;
  }
  
  .mouse-info-title {
    font-weight: bold;
    font-size: 15px;
    margin-bottom: 8px;
    text-align: center;
    border-bottom: 1px solid #ccc;
    padding-bottom: 5px;
  }
  
  .mouse-info-content {
    font-size: 12px;
  }
  
  .mouse-info-content p {
    margin: 5px 0;
  }
  
  .mouse-info-content strong {
    font-weight: bold;
  }
  </style>
<!-- FileMap.vue -->
<template>
  <div class="file-map-panel" @mousedown="startDrag" @mousemove="onDrag" @mouseup="endDrag" @mouseleave="endDrag">
    <div class="panel-header">
      <span class="panel-title">数据加载控制面板</span>
      <div class="tabs">
        <button :class="{ active: activeTab === 'gltf' }" @click="activeTab = 'gltf'">glTF 模型</button>
        <button :class="{ active: activeTab === '3dtiles' }" @click="activeTab = '3dtiles'">3D Tiles</button>
        <button :class="{ active: activeTab === 'geojson' }" @click="activeTab = 'geojson'">GeoJSON</button>
      </div>
    </div>

    <div v-if="activeTab === 'gltf'" class="tab-content">
      <!-- glTF 模型加载 -->
      <div class="file-map-section">
        <div class="file-section-title">glTF 模型</div>
        <div class="file-input-container">
          <label for="gltf-file" class="file-label">选择文件</label>
          <input id="gltf-file" type="file" accept=".glb" @change="loadGltf" />
          <span class="file-name">{{ gltfFileName || 'No file selected' }}</span>
        </div>
        <div class="control-row">
          <div class="color-picker">
            <label>颜色: </label>
            <input type="color" v-model="gltfColor" @change="updateGltfColor" />
          </div>
          <div class="control-buttons">
            <button @click="loadSampleGltf">示例模型</button>
            <button @click="clearGltf" class="btn-danger">清除</button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="activeTab === '3dtiles'" class="tab-content">
      <!-- 3D Tiles 加载 -->
      <div class="file-map-section">
        <div class="file-section-title">3D Tiles</div>
        <div class="control-row">
          <div class="color-picker">
            <label>颜色: </label>
            <input type="color" v-model="tilesColor" @change="update3DTilesColor" />
          </div>
          <div class="control-buttons">
            <button @click="load3DTiles" class="btn-primary">加载资产</button>
            <button @click="clear3DTiles" class="btn-danger">清除</button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="activeTab === 'geojson'" class="tab-content">
      <!-- GeoJSON 加载 -->
      <div class="file-map-section">
        <div class="file-section-title">GeoJSON 数据</div>
        <div class="file-input-container">
          <label for="geojson-file" class="file-label">选择文件</label>
          <input id="geojson-file" type="file" accept=".geojson,.json" @change="loadGeoJson" />
          <span class="file-name">{{ geoJsonFileName || 'No file selected' }}</span>
        </div>
        
        <div class="control-section">
          <div class="control-row">
            <label>色带选择: </label>
            <select v-model="selectedColorBand" class="select-control">
              <option v-for="band in colorBands" :key="band.name" :value="band">
                {{ band.name }}
              </option>
            </select>
          </div>
          
          <!-- 渐变色带预览 -->
          <div class="gradient-preview" :style="{ 
            background: `linear-gradient(to right, 
              ${selectedColorBand.colors[0].toCssColorString()}, 
              ${selectedColorBand.colors[1].toCssColorString()})` 
          }"></div>

          <div class="control-row" v-if="geoJsonFields.length > 0">
            <label>高度字段: </label>
            <select v-model="selectedGeoJsonField" class="select-control">
              <option v-for="field in geoJsonFields" :key="field" :value="field">{{ field }}</option>
            </select>
          </div>

          <div class="control-row" v-if="geoJsonDataSource">
            <div class="height-factor">
              <label>高度系数: </label>
              <input type="range" min="0.1" max="10" step="0.1" v-model="heightFactor" class="range-slider"/>
              <span>{{ heightFactor }}x</span>
            </div>
          </div>
          
          <div class="control-buttons">
            <button @click="applyGeoJsonRendering" class="btn-primary" v-if="geoJsonDataSource">应用渲染</button>
            <button @click="clearGeoJson" class="btn-danger" v-if="geoJsonDataSource">清除数据</button>
          </div>
        </div>
      </div>
    </div>
    
    <div class="drag-handle"></div>
  </div>
</template>

<script>
import { defineComponent, ref, watch } from 'vue';
import * as Cesium from 'cesium';

export default defineComponent({
  name: 'FileMap',
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
    const gltfColor = ref('#ffffff');
    const tilesColor = ref('#ffffff');
    const geoJsonColor = ref('#ff0000');
    const heightFactor = ref(1.0); // 高度系数
    let gltfEntity = null;
    let tileset = null;
    let geoJsonDataSource = null;
    const gltfFileName = ref('');
    const geoJsonFileName = ref('');

    // 色带设置 - 更丰富的色带选择
    const colorBands = ref([
      { name: '红色到黄色', colors: [Cesium.Color.RED, Cesium.Color.YELLOW] },
      { name: '蓝色到青色', colors: [Cesium.Color.BLUE, Cesium.Color.CYAN] },
      { name: '彩虹渐变', colors: [Cesium.Color.BLUE, Cesium.Color.CYAN, Cesium.Color.GREEN, Cesium.Color.YELLOW, Cesium.Color.RED] },
      { name: '地形色带', colors: [Cesium.Color.DARKGREEN, Cesium.Color.YELLOW, Cesium.Color.BROWN, Cesium.Color.WHITE] },
      { name: '热力图', colors: [Cesium.Color.BLUE, Cesium.Color.CYAN, Cesium.Color.GREEN, Cesium.Color.YELLOW, Cesium.Color.RED] },
    ]);
    const selectedColorBand = ref(colorBands.value[0]);

    // 设置 Cesium ion 访问令牌
    Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJmMzQ5NjA3Ny1iYzdkLTRhYWQtODhjOS0xMDM5ZDU2MDc5NWYiLCJpZCI6MjkzOTI4LCJpYXQiOjE3NDQ2Mjc0MzJ9.5B7kUdXIlR3RrzCEs58kNEFzEgihL6ezYuCjsU6WvXw'; // 替换为你的 Cesium ion 令牌

    // 验证位置
    const validateLocation = () => {
      const { longitude, latitude } = props.currentLocation;
      if (typeof longitude !== 'number' || typeof latitude !== 'number' || isNaN(longitude) || isNaN(latitude)) {
        console.error('Invalid location:', props.currentLocation);
        return false;
      }
      return true;
    };

    // 清理无效实体和数据源
    const cleanEntities = () => {
      if (props.viewer) {
        props.viewer.entities.removeAll();
        console.log('Cleared all entities');
        const dataSources = props.viewer.dataSources;
        for (let i = dataSources.length - 1; i >= 0; i--) {
          const ds = dataSources.get(i);
          dataSources.remove(ds);
          console.log('Removed dataSource:', ds.name || 'unnamed');
        }
      }
    };

    // 加载 glTF 模型（Entity 方法）
    const loadGltf = async (event) => {
      if (!props.viewer) {
        console.error('Viewer is not initialized');
        return;
      }

      const file = event.target.files[0];
      if (!file || !file.name.match(/\.glb$/i)) {
        console.error('请选择 .glb 文件');
        return;
      }
      
      gltfFileName.value = file.name;

      if (!validateLocation()) {
        console.error('无法加载 glTF：位置无效');
        return;
      }

      try {
        const reader = new FileReader();
        reader.onload = async () => {
          const arrayBuffer = reader.result;
          const blob = new Blob([arrayBuffer], { type: 'application/octet-stream' });
          const url = URL.createObjectURL(blob);

          cleanEntities();
          clearGltf();

          const position = Cesium.Cartesian3.fromDegrees(
            props.currentLocation.longitude,
            props.currentLocation.latitude,
            100
          );
          const heading = Cesium.Math.toRadians(0);
          const pitch = Cesium.Math.toRadians(0);
          const roll = 0;
          const hpr = new Cesium.HeadingPitchRoll(heading, pitch, roll);
          const orientation = Cesium.Transforms.headingPitchRollQuaternion(position, hpr);

          gltfEntity = await props.viewer.entities.add({
            id: `gltf_${Cesium.createGuid()}`,
            name: file.name,
            position: position,
            orientation: orientation,
            model: {
              uri: url,
              scale: 100,
              minimumPixelSize: 64,
              maximumScale: 20000,
              color: gltfColor.value ? Cesium.Color.fromCssColorString(gltfColor.value) : Cesium.Color.WHITE,
              incrementallyLoadTextures: true,
              runAnimations: true,
              clampAnimations: true,
              shadows: Cesium.ShadowMode.ENABLED,
              heightReference: Cesium.HeightReference.NONE,
            },
          });

          console.log('glTF 加载成功:', file.name, '位置:', position);

          try {
            // 使用flyTo而不是zoomTo，避免改变相机聚焦
            props.viewer.camera.flyTo({
              destination: Cesium.Cartesian3.fromDegrees(
                props.currentLocation.longitude,
                props.currentLocation.latitude,
                1000 // 高度调整为适合观察模型
              ),
              orientation: {
                heading: Cesium.Math.toRadians(0),
                pitch: Cesium.Math.toRadians(-45), // 45度俯视角
                roll: 0
              },
              duration: 2 // 2秒飞行时间
            });
          } catch (flyError) {
            console.warn('飞行到glTF位置失败:', flyError.message);
          }

          emit('update-location', {
            longitude: props.currentLocation.longitude,
            latitude: props.currentLocation.latitude,
            height: 1000,
          });

          setTimeout(() => URL.revokeObjectURL(url), 1000);
        };
        reader.readAsArrayBuffer(file);
      } catch (error) {
        console.error('glTF 加载失败:', error.message);
      }
    };

    // 加载示例 glTF
    const loadSampleGltf = async () => {
      if (!props.viewer) {
        console.error('Viewer is not initialized');
        return;
      }

      if (!validateLocation()) {
        console.error('无法加载示例 glTF：位置无效');
        return;
      }

      try {
        cleanEntities();
        clearGltf();
        gltfFileName.value = "Cesium_Air.glb";

        const url = 'https://cesium.com/public/Sandcastle/sampleData/models/Cesium_Air/Cesium_Air.glb';
        const position = Cesium.Cartesian3.fromDegrees(
          props.currentLocation.longitude,
          props.currentLocation.latitude,
          100
        );
        const heading = Cesium.Math.toRadians(0);
        const pitch = Cesium.Math.toRadians(0);
        const roll = 0;
        const hpr = new Cesium.HeadingPitchRoll(heading, pitch, roll);
        const orientation = Cesium.Transforms.headingPitchRollQuaternion(position, hpr);

        gltfEntity = await props.viewer.entities.add({
          id: `gltf_sample_${Cesium.createGuid()}`,
          name: 'Cesium_Air',
          position: position,
          orientation: orientation,
          model: {
            uri: url,
            scale: 100,
            minimumPixelSize: 64,
            maximumScale: 20000,
            color: gltfColor.value ? Cesium.Color.fromCssColorString(gltfColor.value) : Cesium.Color.WHITE,
            incrementallyLoadTextures: true,
            runAnimations: true,
            clampAnimations: true,
            shadows: Cesium.ShadowMode.ENABLED,
            heightReference: Cesium.HeightReference.NONE,
          },
        });

        console.log('示例 glTF 加载成功:', url, '位置:', position);

        try {
          // 使用flyTo而不是zoomTo和trackedEntity
          props.viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(
              props.currentLocation.longitude,
              props.currentLocation.latitude,
              1000 // 适合观察模型的高度
            ),
            orientation: {
              heading: Cesium.Math.toRadians(0),
              pitch: Cesium.Math.toRadians(-45),
              roll: 0
            },
            duration: 2
          });
        } catch (flyError) {
          console.warn('飞行到示例glTF位置失败:', flyError.message);
        }

        emit('update-location', {
          longitude: props.currentLocation.longitude,
          latitude: props.currentLocation.latitude,
          height: 1000,
        });
      } catch (error) {
        console.error('示例 glTF 加载失败:', error.message);
      }
    };

    // 更新 glTF 颜色
    const updateGltfColor = () => {
      if (gltfEntity && gltfEntity.model) {
        gltfEntity.model.color = gltfColor.value ? Cesium.Color.fromCssColorString(gltfColor.value) : Cesium.Color.WHITE;
        console.log('glTF 颜色更新:', gltfColor.value);
      }
    };

    // 清除 glTF 模型
    const clearGltf = () => {
      if (gltfEntity && props.viewer.entities.contains(gltfEntity)) {
        props.viewer.entities.remove(gltfEntity);
        gltfEntity = null;
        gltfFileName.value = '';
        console.log('glTF 已清除');
      }
    };

    // 加载 3D Tiles（Cesium ion 资产 75343）
    const load3DTiles = async () => {
      if (!props.viewer) {
        console.error('Viewer is not initialized');
        return;
      }

      try {
        cleanEntities();
        clear3DTiles();

        // 使用 Cesium Ion 资产加载 3D Tiles
        tileset = await Cesium.Cesium3DTileset.fromIonAssetId(75343);
        props.viewer.scene.primitives.add(tileset);
        console.log('3D Tiles 资产加载成功: 75343');

        try {
          // 获取3D Tiles的包围球，计算合适的视点
          setTimeout(() => {
            try {
              // 等待Tiles加载，然后计算边界
              const boundingSphere = tileset.boundingSphere;
              const center = boundingSphere.center;
              const cartographic = Cesium.Cartographic.fromCartesian(center);
              const longitude = Cesium.Math.toDegrees(cartographic.longitude);
              const latitude = Cesium.Math.toDegrees(cartographic.latitude);
              const height = cartographic.height + (boundingSphere.radius * 2);
              
              // 使用flyTo移动相机
              props.viewer.camera.flyTo({
                destination: Cesium.Cartesian3.fromDegrees(longitude, latitude, height),
                orientation: {
                  heading: Cesium.Math.toRadians(0),
                  pitch: Cesium.Math.toRadians(-45),
                  roll: 0
                },
                duration: 3
              });
              
              // 应用默认样式（如果存在）
              const extras = tileset.asset.extras;
              if (
                Cesium.defined(extras) &&
                Cesium.defined(extras.ion) &&
                Cesium.defined(extras.ion.defaultStyle)
              ) {
                tileset.style = new Cesium.Cesium3DTileStyle(extras.ion.defaultStyle);
              }
            } catch (error) {
              console.warn('3D Tiles 视点计算失败:', error.message);
              // 回退到默认视点
              props.viewer.camera.flyTo({
                destination: Cesium.Cartesian3.fromDegrees(
                  props.currentLocation.longitude, 
                  props.currentLocation.latitude, 
                  3000
                ),
                orientation: {
                  heading: Cesium.Math.toRadians(0),
                  pitch: Cesium.Math.toRadians(-45),
                  roll: 0
                },
                duration: 2
              });
            }
          }, 1000); // 等待1秒让tileset加载
        } catch (error) {
          console.warn('3D Tiles 聚焦处理失败:', error.message);
          props.viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(
              props.currentLocation.longitude, 
              props.currentLocation.latitude, 
              3000
            ),
            orientation: {
              heading: Cesium.Math.toRadians(0),
              pitch: Cesium.Math.toRadians(-45),
              roll: 0
            }
          });
        }
      } catch (error) {
        console.error('3D Tiles 加载失败:', error.message);
      }
    };

    // 更新 3D Tiles 颜色
    const update3DTilesColor = () => {
      if (tileset) {
        tileset.style = new Cesium.Cesium3DTileStyle({
          color: `color("${tilesColor.value}")`,
        });
        console.log('3D Tiles 颜色更新:', tilesColor.value);
      }
    };

    // 清除 3D Tiles
    const clear3DTiles = () => {
      if (tileset && props.viewer.scene.primitives.contains(tileset)) {
        props.viewer.scene.primitives.remove(tileset);
        tileset = null;
        console.log('3D Tiles 已清除');
      }
    };

    // 修改 GeoJSON 加载逻辑，先显示数据，选择字段后再渲染高度 - 不自动应用高度
    const loadGeoJson = async (event) => {
      if (!props.viewer) {
        console.error('Viewer is not initialized');
        return;
      }

      const file = event.target.files[0];
      if (!file) return;
      
      geoJsonFileName.value = file.name;

      try {
        const reader = new FileReader();
        reader.onload = async () => {
          const geoJsonText = reader.result;
          cleanEntities();
          clearGeoJson();

          geoJsonDataSource = await Cesium.GeoJsonDataSource.load(JSON.parse(geoJsonText), {
            stroke: Cesium.Color.BLACK,
            fill: Cesium.Color.fromCssColorString(geoJsonColor.value).withAlpha(0.5),
            markerColor: Cesium.Color.fromCssColorString(geoJsonColor.value),
            clampToGround: true,
          });

          props.viewer.dataSources.add(geoJsonDataSource);
          console.log('GeoJSON 加载成功:', file.name);

          // 提取字段供用户选择
          const sampleEntity = geoJsonDataSource.entities.values[0];
          const availableFields = sampleEntity && sampleEntity.properties ? 
                                 Object.keys(sampleEntity.properties).filter(key => {
                                   const value = sampleEntity.properties[key].getValue();
                                   return !isNaN(parseFloat(value)); // 只保留数值类型字段
                                 }) : [];
          console.log('可用数值字段:', availableFields);

          // 更新字段选择框
          geoJsonFields.value = availableFields;
          selectedGeoJsonField.value = availableFields[0] || null;

          try {
            // 飞行到 GeoJSON 数据范围
            props.viewer.flyTo(geoJsonDataSource);
          } catch (flyError) {
            console.warn('飞行到 GeoJSON 数据范围失败:', flyError.message);
          }
        };
        reader.readAsText(file);
      } catch (error) {
        console.error('GeoJSON 加载失败:', error.message);
      }
    };

    // 专门的渲染函数，响应用户点击"应用渲染"按钮
    const applyGeoJsonRendering = () => {
      if (!geoJsonDataSource) {
        console.warn('GeoJSON 数据未加载');
        return;
      }

      const colors = selectedColorBand.value.colors;
      const colorCount = colors.length;
      const entities = geoJsonDataSource.entities.values;
      const entityCount = entities.length;
      
      // 如果选择了字段，找出最大最小值用于归一化
      let minValue = Infinity;
      let maxValue = -Infinity;
      
      if (selectedGeoJsonField.value) {
        entities.forEach(entity => {
          if (entity.properties && entity.properties[selectedGeoJsonField.value]) {
            const value = parseFloat(entity.properties[selectedGeoJsonField.value].getValue());
            if (!isNaN(value)) {
              minValue = Math.min(minValue, value);
              maxValue = Math.max(maxValue, value);
            }
          }
        });
      }
      
      // 值范围
      const valueRange = maxValue - minValue;
      
      // 应用渲染
      entities.forEach((entity, index) => {
        if (entity.polygon) {
          // 根据索引或字段值计算颜色位置
          let colorPosition;
          
          if (selectedGeoJsonField.value && entity.properties && entity.properties[selectedGeoJsonField.value]) {
            const value = parseFloat(entity.properties[selectedGeoJsonField.value].getValue());
            if (!isNaN(value) && valueRange > 0) {
              // 根据字段值生成颜色
              colorPosition = (value - minValue) / valueRange;
            } else {
              // 回退到索引
              colorPosition = index / (entityCount - 1 || 1);
            }
          } else {
            // 根据索引生成颜色
            colorPosition = index / (entityCount - 1 || 1);
          }
          
          // 计算颜色
          let finalColor;
          if (colorCount > 2) {
            // 多色带 - 找到对应的区间和颜色
            const segment = colorPosition * (colorCount - 1);
            const segmentIndex = Math.floor(segment);
            const segmentPosition = segment - segmentIndex;
            
            if (segmentIndex >= colorCount - 1) {
              finalColor = colors[colorCount - 1];
            } else {
              finalColor = Cesium.Color.lerp(
                colors[segmentIndex],
                colors[segmentIndex + 1],
                segmentPosition,
                new Cesium.Color()
              );
            }
          } else {
            // 双色带
            finalColor = Cesium.Color.lerp(
              colors[0],
              colors[1],
              colorPosition,
              new Cesium.Color()
            );
          }
          
          entity.polygon.material = finalColor;
          
          // 应用高度 - 使用字段值和高度系数
          if (selectedGeoJsonField.value && entity.properties && entity.properties[selectedGeoJsonField.value]) {
            const value = parseFloat(entity.properties[selectedGeoJsonField.value].getValue());
            if (!isNaN(value)) {
              entity.polygon.extrudedHeight = value * parseFloat(heightFactor.value);
            } else {
              entity.polygon.extrudedHeight = 0;
            }
          } else {
            entity.polygon.extrudedHeight = 0;
          }
          
          entity.polygon.outline = true;
          entity.polygon.outlineColor = Cesium.Color.BLACK;
        }

        // 添加注记
        if (entity.properties && entity.properties.name) {
          entity.label = new Cesium.LabelGraphics({
            text: entity.properties.name.getValue(),
            font: '14pt sans-serif',
            fillColor: Cesium.Color.WHITE,
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 2,
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          });
        }
      });
      
      console.log('已应用 GeoJSON 渲染，使用字段:', selectedGeoJsonField.value, '高度系数:', heightFactor.value);
    };

    // 清除 GeoJSON 数据
    const clearGeoJson = () => {
      if (geoJsonDataSource && props.viewer.dataSources.contains(geoJsonDataSource)) {
        props.viewer.dataSources.remove(geoJsonDataSource);
        geoJsonDataSource = null;
        geoJsonFields.value = [];
        selectedGeoJsonField.value = null;
        geoJsonFileName.value = '';
        console.log('GeoJSON 已清除');
      }
    };

    // 激活的标签页
    const activeTab = ref('gltf');

    // 拖动功能
    const isDragging = ref(false);
    const dragOffset = ref({ x: 0, y: 0 });

    const startDrag = (event) => {
      // 只在面板头部拖动
      if (!event.target.closest('.panel-header, .drag-handle')) return;
      
      isDragging.value = true;
      dragOffset.value = {
        x: event.clientX - event.currentTarget.getBoundingClientRect().left,
        y: event.clientY - event.currentTarget.getBoundingClientRect().top,
      };
      
      // 防止文本选择
      event.preventDefault();
    };

    const onDrag = (event) => {
      if (isDragging.value) {
        const panel = document.querySelector('.file-map-panel');
        panel.style.left = `${event.clientX - dragOffset.value.x}px`;
        panel.style.top = `${event.clientY - dragOffset.value.y}px`;
      }
    };

    const endDrag = () => {
      isDragging.value = false;
    };

    // GeoJSON 字段列表和选择的字段
    const geoJsonFields = ref([]);
    const selectedGeoJsonField = ref(null);

    return {
      gltfColor,
      tilesColor,
      geoJsonColor,
      colorBands,
      selectedColorBand,
      loadGltf,
      loadSampleGltf,
      updateGltfColor,
      clearGltf,
      load3DTiles,
      update3DTilesColor,
      clear3DTiles,
      loadGeoJson,
      applyGeoJsonRendering,
      clearGeoJson,
      activeTab,
      startDrag,
      onDrag,
      endDrag,
      geoJsonFields,
      selectedGeoJsonField,
      heightFactor,
      gltfFileName,
      geoJsonFileName
    };
  },
});
</script>

<style scoped>
.file-map-panel {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 1000;
  background-color: rgba(248, 249, 250, 0.95);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  width: 320px;
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.1);
  transition: box-shadow 0.3s ease;
  cursor: default;
}

.file-map-panel:hover {
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
}

.panel-header {
  background-color: #f0f0f0;
  border-bottom: 1px solid #ddd;
  padding: 8px;
  cursor: move;
  user-select: none;
}

.panel-title {
  font-weight: bold;
  font-size: 14px;
  display: block;
  text-align: center;
  margin-bottom: 6px;
  color: #333;
}

.tabs {
  display: flex;
  justify-content: space-around;
}

.tabs button {
  flex: 1;
  padding: 6px 4px;
  background-color: #f8f9fa;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s ease;
}

.tabs button.active {
  background-color: #4285f4;
  color: white;
  font-weight: bold;
  border-color: #3367d6;
}

.tab-content {
  padding: 10px;
  max-height: 500px;
  overflow-y: auto;
}

.file-map-section {
  margin-bottom: 10px;
}

.file-section-title {
  font-weight: bold;
  font-size: 14px;
  margin-bottom: 8px;
  color: #333;
  border-bottom: 1px solid #eee;
  padding-bottom: 4px;
}

.file-input-container {
  position: relative;
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  background-color: #f8f9fa;
  border: 1px solid #ddd;
  border-radius: 4px;
  overflow: hidden;
}

.file-label {
  background-color: #e9ecef;
  padding: 6px 10px;
  cursor: pointer;
  font-size: 13px;
  white-space: nowrap;
}

.file-name {
  padding: 0 10px;
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 180px;
}

input[type="file"] {
  position: absolute;
  left: 0;
  top: 0;
  opacity: 0;
  width: 100%;
  height: 100%;
  cursor: pointer;
}

.control-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
  background-color: #f8f9fa;
  border-radius: 5px;
  padding: 10px;
  border: 1px solid #eee;
  margin-top: 10px;
}

.control-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 5px;
}

.color-picker {
  display: flex;
  align-items: center;
  gap: 5px;
}

.color-picker label {
  font-size: 13px;
  white-space: nowrap;
}

.color-picker input[type="color"] {
  width: 24px;
  height: 24px;
  border: none;
  background: none;
  padding: 0;
  cursor: pointer;
}

.select-control {
  flex: 1;
  padding: 5px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 13px;
  background-color: white;
}

.gradient-preview {
  height: 24px;
  width: 100%;
  border-radius: 4px;
  border: 1px solid #ddd;
  margin: 5px 0;
}

.height-factor {
  display: flex;
  align-items: center;
  gap: 5px;
  width: 100%;
}

.height-factor label {
  font-size: 13px;
  white-space: nowrap;
}

.height-factor span {
  font-size: 12px;
  width: 30px;
  text-align: center;
}

.range-slider {
  flex: 1;
}

.control-buttons {
  display: flex;
  gap: 5px;
}

button {
  padding: 6px 10px;
  background-color: #f0f0f0;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  flex: 1;
}

button:hover {
  background-color: #e9e9e9;
}

.btn-primary {
  background-color: #4285f4;
  color: white;
  border-color: #3367d6;
}

.btn-primary:hover {
  background-color: #3367d6;
}

.btn-danger {
  background-color: #f8f9fa;
  color: #d73a49;
  border-color: #d73a49;
}

.btn-danger:hover {
  background-color: #f8d7da;
}

.drag-handle {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 16px;
  height: 16px;
  cursor: nwse-resize;
  background: linear-gradient(135deg, transparent 50%, #ccc 50%, #ccc 100%);
  border-bottom-right-radius: 8px;
}
</style>
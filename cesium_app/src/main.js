import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import * as Cesium from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';

// 设置 Cesium Ion 访问令牌
Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJmMzQ5NjA3Ny1iYzdkLTRhYWQtODhjOS0xMDM5ZDU2MDc5NWYiLCJpZCI6MjkzOTI4LCJpYXQiOjE3NDQ2Mjc0MzJ9.5B7kUdXIlR3RrzCEs58kNEFzEgihL6ezYuCjsU6WvXw';
createApp(App).mount('#app')

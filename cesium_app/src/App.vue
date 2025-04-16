<template>
  <div class="app">
    <CesiumView />
  </div>
</template>

<script>
import CesiumView from './components/CesiumView.vue'

export default {
  name: 'App',
  components: {
    CesiumView
  }
}
</script>

<style>
body {
  margin: 0;
  padding: 0;
  overflow: hidden;
}
</style>
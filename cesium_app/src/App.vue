<template>
  <CesiumView />
</template>

<script>
import { defineComponent } from 'vue';
import CesiumView from './components/CesiumView.vue';

export default defineComponent({
  name: 'App',
  components: {
    CesiumView,
  },
});
</script>

<style>
html, body {
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  overflow: hidden;
}
</style>
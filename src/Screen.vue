<template lang="html">
  <div class="screen">
      <canvas id="canvas" width="{{size.width}}" height="{{size.height}}"></canvas>
  </div>
</template>

<script>
import global from './global'

export default {
  data: function () {
    return {
      frames: global.frames,
    }
  },
  computed: {
    size: function(){
      return global.getCanvasSize();
    }
  },
  ready: function () {},
  attached: function () {},
  methods: {},
  components: {}
}
</script>

<style lang="css">
</style>

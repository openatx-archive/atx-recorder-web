<template lang="html">
  <div>
    <div class="tool" v-for="t in tools">
      <button type="button" @click="click($key)">
        <img :src="t.icon" alt="{{$key}}" />
      </button>
    </div>
  </div>
</template>

<script>
import global from './global'

export default {
  data: function () {
    return {
      frames: global.frames,
      tools: {
        "skipFrames" : {icon: "/static/imgs/1_touch.png"},
        "replaceWithOpenApp" : {icon: "/static/imgs/open.png"},
      },
    }
  },
  computed: {},
  ready: function () {},
  attached: function () {},
  methods: {
    click: function(what) {
        var func = this[what];
        if (func) {
          console.log('calling', what);
          func.call(this);
        }
    },
    skipFrames: function() {
      var s = this.frames.selected;
      if (s.first == null || s.last == null) {return;}
      for (var i = s.first; i <= s.last; i++) {
        this.frames.data[i].skip = true;
      }
      s.first = s.last = null;
    },
    replaceWithOpenApp: function() {
      var s = this.frames.selected,
          i = s.first,
          j = s.last;
      if (i == null || j == null) {
        i = j = this.frames.current;
      }
    },
  },
  components: {}
}
</script>

<style lang="css">
</style>

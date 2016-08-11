<template lang="html">
  <div class="scroll-wrapper">
    <div v-if="top_more" class="scroll-top-more">
      <div class="arrow-up"></div>
    </div>
    <div class="scroll" @scroll="onScroll">
      <slot></slot>
    </div>
    <div v-if="bottom_more" class="scroll-bottom-more">
      <div class="arrow-down"></div>
    </div>
  </div>
</template>

<script>
import global from './global'

export default {
  data: function () {
    return {
      frames: global.frames,
      top_more: false,
      bottom_more: false,
      scrollnode: null,
    }
  },
  computed: {
  },
  methods: {
    onScroll: function(event){
      if (!this.scrollnode) {
        for (var i = 0, c, l = this.$el.children.length; i < l; i++) {
          c = this.$el.children[i];
          if (c.className == "scroll") {
            this.scrollnode = c;
            break;
          }
        }
      }
      if ( this.scrollnode ) {
        var t = this.scrollnode;
        this.top_more = (t.scrollTop != 0);
        this.bottom_more = (t.scrollTop + t.clientHeight != t.scrollHeight);
      }
    },
  },
}
</script>

<style lang="css">
.scroll {
  height: 100%;
  overflow-y: auto;
}
.scroll::-webkit-scrollbar {
  width: 16px;
}
.scroll-wrapper {
  height: 100%;
  position: relative;
}
.scroll-top-more, .scroll-bottom-more {
  position: absolute;
  height: 10px;
  left: 5px;
  right: 5px;
  margin: 0 auto;
  text-align: center;
}
.scroll-top-more {
  top: -10px;
}
.scroll-bottom-more {
  bottom: -10px;
}
.arrow-up {
  margin: 0 auto;
  width: 0px;
  height: 0px;
  border-left: 10px solid transparent;
  border-right: 10px solid transparent;
  border-bottom: 10px solid blue;
}
.arrow-down {
  margin: 0 auto;
  width: 0px;
  height: 0px;
  border-left: 10px solid transparent;
  border-right: 10px solid transparent;
  border-top: 10px solid blue;
}
</style>

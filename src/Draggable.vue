<template lang="html">
  <div class="dragable" @mousedown="startDrag" @mouseup="stopDrag" @mousemove="doDrag" @mouseout="stopDrag" :style="dragstyle">
    <slot></slot>
  </div>
</template>

<script>
export default {
  data: function () {
    return {
      dragging: false,
      pos: null,
    }
  },
  computed: {
    dragstyle: function(){
      if (!this.pos) {
        return {};
      }
      return {
        position: 'absolute',
        top: this.pos.top + 'px',
        left: this.pos.left + 'px',
      }
    }
  },
  ready: function(){
    var p = this.$el.parentElement;
    console.log(p);
    console.log(this.$el);
    if (p.style.position == '') {
      p.style.setProperty('position', 'relative');
    }
    this.pos = {
      left: this.$el.offsetLeft,
      top: this.$el.offsetTop,
    }
  },
  methods: {
    startDrag: function(event){
      event.stopPropagation();
      this.dragging = true;
    },
    stopDrag: function(event){
      event.stopPropagation();
      this.dragging = false;
    },
    doDrag: function(event){
      if (!this.dragging) {
        return;
      }
      event.stopPropagation();
      var p = this.$el.parentElement,
          x = this.pos.left + event.movementX,
          y = this.pos.top + event.movementY;
      if (x > 0 && x < p.clientWidth && y > 0 && y < p.clientHeight) {
        this.pos.left = x;
        this.pos.top = y;
      }
    },
  },
}
</script>

<style lang="css">
</style>

<template>
  <div id="app" class="wrapper">
    <div v-show="show_toolbar" class="toolbar">
      <toolbar></toolbar>
    </div>
    <div class="left-panel">
      <div>
        <ul>
          <!-- <li><button @click="toggleToolbar">ToggleToolbar</button></li> -->
          <li><button @click="saveCase">Save</button></li>
          <li>Current Frame: {{frames.current + 1}}/{{frames.data.length}}</li>
          <li>Show Actions:<input type="checkbox" v-model="screenui.show"/></li>
        </ul>
      </div>
      <div style="height:90%;">
        <scroll v-ref:allframes>
          <action-frame v-for="idx in frames.data.length" :idx="idx"></action-frame>
        </scroll>
      </div>
    </div>
    <div class="right-panel">
      <canvas id="canvas" width="300" height="300"></canvas>
    </div>
  </div>
</template>

<script>
import $ from 'jquery'

import global from './global'
import Scroll from './Scroll'
import ActionFrame from './ActionFrame'
import Toolbar from './Toolbar'

export default {
  data(){
    return {
      frames: global.frames,
      casesteps: global.casesteps,
      screenui: global.screenui,
      show_toolbar: false,
    }
  },
  components: {
    Scroll,
    ActionFrame,
    Toolbar,
  },
  methods: {
    saveCase: function(){
      var vm = this.$refs.allframes, cases = [];
      for (var d, f, c, pos, i = 0, l = this.frames.data.length; i < l; i++) {
        f = this.frames.data[i];
        if (f.skip == true) {
          continue
        }
        c = vm.$children[i];
        d = {frameidx: i, action: c.action, args: []}
        if (c.action == "click_image") {
          pos = [c.imgbound.left, c.imgbound.top, c.imgbound.width, c.imgbound.height]
          d.args = [c.point.left, c.point.top, pos];
        } else if (c.action == "click_ui") {
          d.args = [c.selected_node.iterindex];
        } else {
          d.args = f.event.args;
        }
        cases.push(d);
      }
      global.saveCase(cases);
    },
    toggleToolbar: function(){
      this.show_toolbar = !this.show_toolbar;
    },
  }
}
</script>

<style lang="css">
@import './styles/common.css';

#app {
  color: #2c3e50;
  font-family: Source Sans Pro, Helvetica, sans-serif;
}

#app a {
  color: #42b983;
  text-decoration: none;
}
</style>

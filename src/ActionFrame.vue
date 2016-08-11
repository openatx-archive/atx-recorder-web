<template lang="html">
  <div class="frame clear-fix" :class="frameclass" @click="showMe">
    <div class="left">
      <img :src="icon" @click="select"/>
      <span style="position:relative;">
        <b @click="changeAction" v-show="!action_changing">{{ action | camel }}</b>
        <select v-show="action_changing" v-model="action" @change="doneChangeAction" style="overflow-y:hidden" :size="action_options.length">
          <option v-for="opt in action_options">{{opt}}</option>
        </select>
      </span>
      <template v-if="(action=='key_event')">
        <span>{{key}}</span>
      </template>
      <template v-if="(action=='click_ui')">
        <select v-model="selected_node">
          <option v-for="node in uinodes" :value="node">
            {{node.iterindex}} {{uinodeDesc(node)}}
          </option>
        </select>
      </template>
      <template v-if="(action=='click_image')">
        <div class="chop" :style="chopstyle"></div>
        <span>({{imgbound.width}}x{{imgbound.height}})@({{imgbound.left}}, {{imgbound.top}})</span>
      </template>
      <template v-if="(action=='click')">
        <span>({{point.left}}, {{point.top}})</span>
      </template>
      <template v-if="(action=='swipe')">
        <span>From ({{swipepoints.start.left}}, {{swipepoints.start.top}}) To ({{swipepoints.end.left}}, {{swipepoints.end.top}})</span>
      </template>
    </div>
    <div class="right">
      <button class="skip" @click="skip"></button>
    </div>
    <div class="uioverlap" :style="overlapstyle">
      <div class="full">
        <!-- show original action -->
        <template v-if="uilayer.show">
          <template v-if="(action.substr(0,5)=='click')">
            <div class="point" :style="pointstyle"></div>
          </template>
          <template v-if="(action.substr(0,5)=='swipe')">
            <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
              <defs>
                <linearGradient id="swipestroke" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style="stop-color:rgb(255,255,255);stop-opacity:0.1;"/>
                  <stop offset="100%" style="stop-color:rgb(255,255,255);stop-opacity:0.8;"/>
                </linearGradient>
                <filter id="swipefilter" x="0" y="0" width="100%" height="100%">
                  <feGaussianBlur in="SourceGraphic" stdDeviation="2" />
                </filter>
              </defs>
              <line :x1="swipepoints.start.left*scale" :y1="swipepoints.start.top*scale"
                :x2="swipepoints.end.left*scale" :y2="swipepoints.end.top*scale"
                style="stroke:url(#swipestroke);stroke-width:20;stroke-linecap:round" />
              <circle :cx="swipepoints.start.left*scale" :cy="swipepoints.start.top*scale" r="10" fill="white"/>
              <circle :cx="swipepoints.end.left*scale" :cy="swipepoints.end.top*scale" r="10" fill="white" fill-opacity="0.2"/>
            </svg>
          </template>
        </template>
        <!-- show analyzed action -->
        <template v-if="(action=='click_ui')">
          <div class="uibox" :style="uiboxstyle"></div>
        </template>
        <template v-if="(action=='click_image')">
          <div class="full" @mousedown="startRect" @mouseup="stopRect" @mouseout="outRect" @mousemove="drawRect">
            <div class="rect" v-bind:style="rectstyle">
              <div class="resizer" @mousedown="startResize"></div>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script>
import $ from 'jquery'
import global from './global'

export default {
  props: {
    idx: {
      required: true,
      coerce: function(val) { return parseInt(val); },
    },
  },
  data: function () {
    return {
      uilayer: global.screenui,
      frames: global.frames,
      casesteps: global.casesteps,
      scale: 0.4,
      img: {instance: null, width:null, height:null, src:null},
      action: null,
      action_options: [],
      action_changing: false,
      xml: null,
      // key_event
      key: null,
      // click
      point: {left:undefined, top:undefined},
      // click_ui
      uinodes: [],
      selected_node: null,
      // click_image
      imgbound: {left:0, top:0, width:0, height:0},
      imgdragging: false,
      imgresizing: false,
      // swipe
      swipepoints: null,
    }
  },
  computed: {
    icon: function(){
      return "/static/imgs/" + this.action + ".png";
    },
    frameclass: {
      cache: false,
      get: function(){
        var has_select = (this.frames.selected.first != null) && (this.frames.selected.last != null);
        return {
          "highlight": this.idx == this.frames.current,
          "skipped": this.frames.data[this.idx].skip == true,
          "selected": has_select && (this.idx >= this.frames.selected.first) && (this.idx <= this.frames.selected.last)
        };
      },
    },
    chopstyle: function(){
      var height = 50.0,
          scale = height / this.imgbound.height,
          width = this.imgbound.width * scale,
          left = this.imgbound.left * scale,
          top = this.imgbound.top * scale,
          bg_width = this.img.width * scale,
          bg_height = this.img.height * scale;
      return {
        "height": height + "px",
        "width" : width + "px",
        "background-image": "url(" + this.img.src + ")",
        "background-position" : "-" + left +"px -" + top + "px",
        "background-size" :  bg_width + "px " + bg_height + "px",
      };
    },
    overlapstyle: function(){
      var node = this.$el.offsetParent,
          top = node ? node.offsetTop : 0,
          left = node ? node.offsetLeft : 0;
      return {
        "display" : (this.idx == this.frames.current) ? "block" : "none",
        "position": "absolute",
        "left": this.uilayer.left - left + "px",
        "top": this.uilayer.top - top + "px",
        "width": this.uilayer.width + "px",
        "height": this.uilayer.height + "px",
      };
    },
    pointstyle: function(){
      var dia = 18,
          left = this.point.left * this.uilayer.scale - dia*0.5,
          top = this.point.top * this.uilayer.scale - dia*0.5;
      return {
        "width": dia + "px",
        "height": dia + "px",
        "border-radius" : dia + "px",
        "position": "absolute",
        "left": left + "px",
        "top": top + "px",
      };
    },
    rectstyle: function(){
      var left = this.imgbound.left * this.uilayer.scale,
          top = this.imgbound.top * this.uilayer.scale,
          width = this.imgbound.width * this.uilayer.scale,
          height = this.imgbound.height * this.uilayer.scale;
      return {
        "width": width + "px",
        "height": height + "px",
        "left": left + "px",
        "top": top + "px",
      };
    },
    uiboxstyle: function(){
      var obj = this.selected_node;
      if (undefined == obj) { return {};}
      return {
        "top": obj.top * this.uilayer.scale + "px",
        "left": obj.left * this.uilayer.scale + "px",
        "width": obj.width * this.uilayer.scale + "px",
        "height": obj.height * this.uilayer.scale + "px",
      };
    },
  },
  created: function(){
    var self = this;

    // original action
    var d = self.frames.data[self.idx],
        o = this.frames.data[this.idx].status.rotation;
    d.$vm = self;
    if (d.status.screen) {
      self.img.instance = new Image();
      self.img.instance.src = '/frames/' + d.status.screen;
      // update img after load in order to trigger chopstyle change.
      self.img.instance.addEventListener('load', function(){
        self.img.src = this.src;
        self.img.width = this.width;
        self.img.height = this.height;
      });
    }

    // casesteps action
    var cd = self.casesteps.data[self.idx+''];
    if (cd) {
      self.action = cd.action
    } else {
      self.action = d.event.action;
    }

    if (self.action.substr(0,5) == 'click') {
      self.action_options.push('click');
      self.action_options.push('click_ui');
      self.action_options.push('click_image');
      var pos = global.touchToScreen(o, {left:d.event.args[0], top:d.event.args[1]});
      self.point.left = pos.left;
      self.point.top = pos.top;
    } else {
      self.action_options.push(self.action);
    }
    if (self.action == 'click_ui') {
    } else if (self.action == 'click_image') {
      var bounds = cd.args[2];
      self.imgbound.left = bounds[0];
      self.imgbound.top = bounds[1];
      self.imgbound.width = bounds[2];
      self.imgbound.height = bounds[3];
    } else if (self.action == 'swipe') {
      self.swipepoints = {
        start: global.touchToScreen(o, {left:d.event.args[0], top:d.event.args[1]}),
        end : global.touchToScreen(o, {left:d.event.args[2], top:d.event.args[3]}),
      }
      self.point.left = d.event.args[0];
      self.point.top = d.event.args[1];
    } else if (self.action == 'key_event') {
      self.key = d.event.args[0];
    }

    if (d.status.uixml && this.point.left != undefined) {
      $.ajax({
        url: '/frames/' + d.status.uixml,
        type: 'GET',
        dataType: 'xml',
        success: function(xmldata) {
          var i = 0;
          $(xmldata).find('node').each(function(){
            var $xml = $(this), iterindex = i;
            i += 1;
            var bounds = $xml.attr("bounds").match(/\d+/g),
                left = parseInt(bounds[0]),
                top = parseInt(bounds[1]),
                right = parseInt(bounds[2]),
                bottom = parseInt(bounds[3]),
                width = right - left,
                height = bottom - top;
            if (width == global.device.width && height == global.device.height) {
              return;
            }
            if (self.point.left < left || self.point.left > right || self.point.top < top || self.point.top > bottom) {
              return;
            }
            var obj = {left, top, right, bottom, width, height, iterindex, xml:$xml};
            obj.info = {
              className: $xml.attr("class"),
              resourceId: $xml.attr("resource-id"),
              text: $xml.attr("text"),
              description: $xml.attr("content-desc"),
            };
            self.uinodes.push(obj)
          });

          if (self.action == "click_ui" && self.uinodes.length > 0) {
            self.selected_node = self.uinodes[self.uinodes.length-1];
          }
        },
        error: function(){
          console.log("Get uixml failed", d.status.uixml);
          self.uinodes = [];
        }
      })
    }
  },
  methods: {
    select: function(){
      var s = this.frames.selected;
      console.log("on select", this.idx, s);
      if (s.first == null || s.last == null) {
        s.first = this.idx;
        s.last = this.idx;
      } else if (this.idx < s.first) {
        s.first = this.idx;
      } else if (this.idx > s.last) {
        s.last = this.idx;
      } else {
        s.first = s.last = null;
      }
    },
    skip: function(event){
      event.stopPropagation()
      this.frames.data[this.idx].skip = true;
    },
    unskip: function(event){
      event.stopPropagation()
      this.frames.data[this.idx].skip = false;
    },
    changeAction: function(event){
      if (this.action_options.length <= 1) {
        return;
      }
      if (self.action == "click_ui" && self.selected_node == null && self.uinodes.length > 0) {
        self.selected_node = self.uinodes[self.uinodes.length-1];
      }
      this.action_changing = true;
    },
    doneChangeAction: function(event){
      this.action_changing = false;
      console.log("action changed", this.idx, this.action);
    },
    uinodeDesc: function(node) {
      return node.info.text != "" ? node.info.text :
                node.info.description != "" ? node.info.description :
                    node.info.resourceId != "" ? node.info.resourceId : node.info.className
    },
    showMe: function(event){
      this.unskip(event);
      this.frames.current = this.idx;
    },
    startRect: function(event){
      this.imgdragging = true;
      this.imgbound.left = parseInt((event.pageX - this.uilayer.left) / this.uilayer.scale);
      this.imgbound.top = parseInt((event.pageY - this.uilayer.top) / this.uilayer.scale);
    },
    drawRect: function(event){
      if (this.imgdragging || this.imgresizing) {
        var right = parseInt((event.pageX - this.uilayer.left) / this.uilayer.scale),
            bottom = parseInt((event.pageY - this.uilayer.top) / this.uilayer.scale);
        this.imgbound.width = Math.min(600, Math.max(60, right - this.imgbound.left));
        this.imgbound.height = Math.min(600, Math.max(60, bottom - this.imgbound.top));
      }
    },
    stopRect: function(event){
      if (this.imgdragging) {
        this.imgdragging = false;
      }
      if (this.imgresizing) {
        this.imgresizing = false;
      }
    },
    outRect: function(event) {
      if (this.imgdragging || this.imgresizing) {
        if (event.pageX < this.uilayer.left ||
            event.pageX > this.uilayer.left + this.uilayer.width ||
            event.pageY < this.uilayer.top ||
            event.pageY > this.uilayer.top + this.uilayer.height)
        {
          this.imgdragging = false;
          this.imgresizing = false;
        }
      }
    },
    startResize: function(event) {
      event.stopPropagation();
      this.imgresizing = true && self.selected_node == null;
    },
  },
  components: {},
  watch: {
    'frames.current': function(newVal, oldVal){
      if (newVal == this.idx) {
        global.drawImage(this.img.instance);
      }
    }
  }
}
</script>

<style lang="css">
@import './styles/common.css'
</style>

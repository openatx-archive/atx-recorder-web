import Vue from 'vue'
import $ from 'jquery'

import global from './global'
import App from './App'

Vue.filter('capitalize', function(s) {
  if (Object.prototype.toString.call(s) === "[object String]") {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
  return "";
})

Vue.filter('camel', function(s) {
  if (Object.prototype.toString.call(s) === "[object String]") {
    var str='', arr = s.split(/_/g);
    for (var i=0; i<arr.length; i++) {
      str += arr[i].charAt(0).toUpperCase() + arr[i].slice(1);
    }
    return str;
  }
  return "";
})

var app = new Vue({
  el: 'body',
  components: {
    App
  }
})

define(function(){function a(a,b){var c=a.indexOf(b);return-1!==c&&a.splice(c,1),a}function b(b,c){this.__eventListeners[b]&&(c?a(this.__eventListeners[b],c):this.__eventListeners[b].length=0)}var c=function(){};return c.prototype={on:function(a,b){if(this.__eventListeners||(this.__eventListeners={}),1===arguments.length)for(var c in a)this.on(c,a[c]);else this.__eventListeners[a]||(this.__eventListeners[a]=[]),this.__eventListeners[a].push(b);return this},off:function(a,c){if(this.__eventListeners){if(0===arguments.length)this.__eventListeners={};else if(1===arguments.length&&"object"==typeof arguments[0])for(var d in a)b.call(this,d,a[d]);else b.call(this,a,c);return this}},trigger:function(a,b){if(this.__eventListeners){var c=this.__eventListeners[a];if(c){for(var d=0,e=c.length;e>d;d++)c[d].call(this,b||{});return this}}}},c});
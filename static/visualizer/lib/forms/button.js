define(["require","jquery","forms/title"],function(a,b,c){var d=0,e={};b(document).on("click",".form-button",function(a){var c=e[b(this).data("id")];c&&!c.isDisabled()&&c.doClick(a,b(this))});var f=function(a,b,f){this.title=new c(a),this.onclick=b,this.id=++d,this.value=!1,this.options=f||{},this.color=this.options.color,e[this.id]=this};return f.prototype={getTitle:function(){return this.title},setTitle:function(a){a instanceof c||(a=new c(a)),this.title=a,this.applyStyle()},getId:function(){return this.id},setOnClick:function(a){this.onclick=a},setColor:function(a){this.oldColor=this.color,this.color=a,this.applyStyle()},setValue:function(a){this.value=a},setIcon:function(a){this.icon=a},render:function(){var a="";return a+='<div class="form-button',a+='" data-id="',a+=this.id,a+='" id="button-'+this.id+'"><span /><span />',a+="</div>",this.dom=b(a),this.applyStyle(),this.dom},applyStyle:function(){this.dom&&(this.color&&(this.dom.removeClass(this.oldColor),this.dom.addClass(this.color)),this.options.disabled?this.dom.addClass("disabled"):this.dom.removeClass("disabled"),this.options.checkbox&&(this.value?this.dom.addClass("bi-active"):this.dom.removeClass("bi-active")),this.dom.children().eq(1).html(this.title.getLabel()),this.icon&&this.dom.children().eq(0).html('<img src="'+a.toUrl("./images/"+this.icon+".png")+'" />'))},doClick:function(a,b){this.value=!this.value,this.applyStyle(),this.onclick&&this.onclick(a,this.value,b)},getDom:function(){return this.dom?this.dom:void console.warn("The button dom has not been created yet")},disable:function(){this.options.disabled=!0,this.applyStyle()},enable:function(){this.options.disabled=!1,this.applyStyle()},isDisabled:function(){return this.options.disabled}},f});
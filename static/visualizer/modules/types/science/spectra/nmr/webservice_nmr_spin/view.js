define(["modules/default/defaultview"],function(a){function b(){}return b.prototype=$.extend(!0,{},a,{init:function(){var a=this;this.cfg=$.proxy(this.module.getConfiguration,this.module),this.button="button"===this.cfg("button")[0]?!0:!1,this.dom=$("<div>").addClass("ci-module-webservice_nmr_spin");var b=[];b.push("<select name='system'>"),b.push("<option value='2' selected>AB</option>"),b.push("<option value='3'>ABC</option>"),b.push("<option value='4'>ABCD</option>"),b.push("<option value='5'>ABCDE</option>"),b.push("<option value='6'>ABCDEF</option>"),b.push("</select>");var c=$(b.join(""));c.val(this.cfg("systemSize")[0]),this.systemSelector=$("<h1>Select your spin system: </h1>"),this.systemSelector.append(c),this.dom.append(this.systemSelector),this.systemSelector.on("change","select",function(){var b=a.cfg("systemSize");b[0]=$(this).val(),a.init()}),this.system=$(this._getTable(this.cfg("systemSize")[0])),this.button||(this.system.on("keyup","input[type=text]",function(){a.module.controller.doAnalysis()}),this.system.on("change","select, input[type=text]",function(){a.module.controller.doAnalysis()})),this.dom.append(this.system),this.module.getDomContent().html(this.dom),this.button&&require(["forms/button"],function(b){a.system.append((a.buttonInst=new b(a.cfg("buttonlabel"),function(){a.module.controller.doAnalysis()})).render())}),"onload"===this.cfg("onloadanalysis")&&this.module.controller.doAnalysis(),this.resolveReady()},_getTable:function(a){var b=[];b.push("<table><tbody id='table2'><tr>"),b.push("<th></th>"),b.push("<th>delta (ppm)</th>");for(var c=1;a>c;c++)b.push("<th>J<sub>"+c+"-</sub> (Hz)</th>");b.push("</tr>");for(var c=0;a>c;c++){b.push("<tr>"),b.push("<th>"+(c+1)+"</th>"),b.push("<td><input type='text' size=4 value="+(c+1)+" name='delta_"+c+"'>");for(var d=0;c>d;d++)b.push("<td><input type='text' size=4 value=7 name='coupling_"+c+"_"+d+"'>");b.push("</tr>")}return b.push("</tbody></table>"),b.push("<p>From: <input type='text' value=0 name='from' size=4>"),b.push("to: <input type='text' value=10 name='to' size=4> ppm."),b.push("<select id='frequency' name='frequency'>"),b.push("<option value='60'>60 MHz</option>"),b.push("<option value='90'>90 MHz</option>"),b.push("<option value='200'>200 MHz</option>"),b.push("<option value='300'>300 MHz</option>"),b.push("<option value='400' selected>400 MHz</option>"),b.push("<option value='500'>500 MHz</option>"),b.push("<option value='600'>600 MHz</option>"),b.push("<option value='800'>800 MHz</option>"),b.push("<option value='800'>800 MHz</option>"),b.push("<option value='1000'>1000 MHz</option>"),b.push("</select></p>"),b.push("<p>Line width: <input onchange=\"if (this.value<0.5) {alert('The minimal resolution is 0.5'); this.value=0.5;}\" type='text' value=1 name='lineWidth' size=4 id='lineWidth'> Hz."),b.push(""),"<form>"+b.join("")+"</form>"},lock:function(){this.locked=!0,this.buttonInst&&(this.buttonInst.setTitle(this.module.getConfiguration("buttonlabel_exec")),this.buttonInst.disable())},unlock:function(){this.locked=!1,this.buttonInst&&(this.buttonInst.setTitle(this.module.getConfiguration("buttonlabel")),this.buttonInst.enable())},getDom:function(){return this.dom}}),b});
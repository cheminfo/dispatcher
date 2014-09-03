
define(['require', 'jquery', 'src/util/api', 'src/util/util', 'src/util/datatraversing'], function(require, $, API, Util, Traversing) {

	Util.loadCss('components/font-awesome/css/font-awesome.min.css');

	var functions = {};


	functions.string = {};
	functions.string.toscreen = function(def, val) {
        val = val.toString();
        while( true ) {
            val = val.replace('<', '&lt;' ).replace('>', '&gt;');
            if( val.indexOf('<') === -1 && val.indexOf('>') === -1) {
                break;
            }
        }
        def.resolve( val );	
	};
    
    functions.html = {};
    functions.html.toscreen = function(def, val) {
        def.resolve( val.toString() );
    };
		
	functions.matrix = {};
	functions.matrix.toscreen = function(def, val) {
		def.resolve( val );
	};

	functions.number = {};
	functions.number.toscreen = function(def, val) {
		def.reject( val.valueOf() );
	};

	functions.chemical = {};
	functions.chemical.toscreen = function(def, val) {
		val.getChild(['iupac', '0', 'value']).then(def.resolve, def.reject);
	};

	functions.picture = {};
	functions.picture.toscreen = function(def, val) {
		def.reject('<img src="' + val + '" />');
	};
  
  functions.svg = {};
  functions.svg.toscreen = function(def, val) {
    var dom = $(val);
    var viewbox = [0, 0, parseInt(dom.attr('width')), parseInt(dom.attr('height'))];
    dom[0].setAttribute('viewBox', viewbox.join(' '));
    dom.removeAttr('id');
    dom.attr('width', '100%');
    dom.attr('height', '100%');
    // dom.attr('viewbox', '0 0 1000 1000');
    // dom.attr('preserveAspectRatio', 'xMin');
    // dom.width(100).height(100);
    // img.wrap("<span></span>").parent().html()
    // def.build = function(domEl) {
    //   var domSvg = domEl.children();
    //   
    //   
    // }
    def.resolve(dom);
  };
  
  // functions.svg.toscreen = function(def, val) {
  //   var canvas = $('<canvas></canvas>');
  //   canvg(canvas[0], Traversing.get(val));
  //   def.reject('<img src="' + canvas[0].toDataURL() + '" style="max-width:100%; max-height:100%"/>');
  //   // def.build = function(domEl) {
  //   //   var el = $(domEl).closest('.ci-module-content');
  //   //   var img = $(domEl).find('img');
  //   //   var imgw = img.width(); var imgh = img.height();
  //   //   var domw = el.width(); var domh = el.height();
  //   //   var factor = Math.max(imgw/domw, imgh/domh);
  //   //   img.width(imgw/factor).height(imgh/factor);
  //   // }
  // }

	functions.gif = functions.picture;
	functions.jpeg = functions.picture;
	functions.jpg = functions.picture;
	functions.png = functions.picture;

	functions.doi = {};
	functions.doi.toscreen = function(def, value) {
		return def.resolve(value.replace(/^(.*)$/,'<a target="_blank" href="http://dx.doi.org/$1"><img src="bin/logo/doi.png" /></a>'));
	};
	
	functions.jme = {};
	functions.jme.toscreen = function(def, jme, jmeRoot, options, highlights, box) {
		require(["lib/chemistry/jme-converter"], function(Converter){
			var converted = Converter.toMolfile(jme);
			var molfile = {
				type:"mol2d",
				value: converted
			};
			functions.mol2d.toscreen(def, converted, molfile, options, highlights, box);
		});
	};

	functions.mol2d = {};
	functions.mol2d.toscreen = function(def, molfileChild, molfile, options, highlights, box) {
		
		var id = Util.getNextUniqueId();
		var id2 = Util.getNextUniqueId();
		var div = '<div id="' + id + '" />';
		// Find the dom in here
		var can = $( '<canvas />', { id: id2 } ).get( 0 );
		
		def.build = function() {
	
			$("#" + id ).html( can );
			
			require(['ChemDoodle'], function() {

				var canvas = new ChemDoodle.ViewerCanvas(id2);
				var parent = $(can).parent();
				canvas.resize(parent.width(), parent.height());
				this.canvas = canvas;
				canvas.specs.backgroundColor = "transparent";
				canvas.specs.bonds_saturationWidth_2D = .18;
				canvas.specs.atoms_font_families_2D = ['Helvetica', 'Arial', 'sans-serif'];
			//	canvas.specs.atoms_displayTerminalCarbonLabels_2D = false;

				var molLoaded = ChemDoodle.readMOL(molfile.value);
				//molLoaded.scaleToAverageBondLength(14.4);
				//canvas.loadMolecule(molLoaded);


					var dim = molLoaded.getDimension();

	//			var ratio = Math.min(1, Math.max(parent.width() / dim.x, parent.height() / dim.y));
				var ratio=1;

				this.molecule = molLoaded;

				molLoaded.scaleToAverageBondLength(20 * ratio);
				canvas.specs.atoms_font_size_2D = 14 * ratio;
				canvas.specs.bonds_hashSpacing_2D = 2.5 * ratio;
				canvas.specs.bonds_width_2D = 1.2 * ratio;
				canvas.specs.atoms_useJMOLColors = true;
				canvas.loadMolecule(molLoaded);

				
				API.listenHighlight(molfile._highlight, function(value, commonKeys) {

					if($("#" + id).length === 0)
						return;

					var commonKeys2 = {};
					var atoms;

					// commonkeys: ['A', 'B'];
					for(var i = commonKeys.length - 1; i >= 0; i--) {
						atoms = molfile._atoms[commonKeys[i]]; // [0, 1, 15, 12]

						if( !atoms )
							continue;

						for( var j = atoms.length - 1 ; j >= 0 ; j-- ) {
							molLoaded.atoms[atoms[j]].isHover = value;
						}
					}

					can.width = can.width; // Erase canvas
					for(var i = 0; i < molLoaded.atoms.length; i++) {
						molLoaded.atoms[i].drawChildExtras = molLoaded.atoms[i].isHover;
					}

					canvas.repaint();

				}, true, box.id || 0);
			});
		};

		def.unbuild = function() {
			//$(this.canvas).remove();
		};

		def.getCWC = function() {
			return this.canvas;
		};

		require(['ChemDoodle'], function() {

			ChemDoodle.ELEMENT.H.jmolColor="#BBBBBB";
			ChemDoodle.ELEMENT.S.jmolColor="#CCCC30";

			def.id = id;
			def.canvasdom = can;
			def.resolve(div);
		});
	};

	functions.molfile2D = functions.mol2d;

	functions.mol3d = {};
	functions.mol3d.toscreen = function(def, molfile) {

		var id = Util.getNextUniqueId();
		CI.Util.DOMDeferred.progress(function(dom) {

			if($("#" + id, dom).length === 0)
				return;

			var mg = new ChemDoodle.MolGrabberCanvas3D(id, 600, 400);
			mg.specs.projectionWidthHeightRatio_3D = 600 / 400;
			mg.specs.set3DRepresentation('Stick');
			mg.setSearchTerm('penicillin');
			mg.handle = null;
			mg.timeout = 15;
			mg.startAnimation = ChemDoodle._AnimatorCanvas.prototype.startAnimation;
			mg.stopAnimation = ChemDoodle._AnimatorCanvas.prototype.stopAnimation;
			//mg.isRunning = ChemDoodle._AnimatorCanvas.prototype.isRunning;
			mg.dblclick = ChemDoodle.RotatorCanvas.prototype.dblclick;
			mg.nextFrame = function(delta){
				var matrix = [];
				mat4.identity(matrix);
				var change = delta/1000;
			        var increment = Math.PI/15;
				mat4.rotate(matrix, increment*change, [ 1, 0, 0 ]);
				mat4.rotate(matrix, increment*change, [ 0, 1, 0 ]);
				mat4.rotate(matrix, increment*change, [ 0, 0, 1 ]);
				mat4.multiply(this.rotationMatrix, matrix);
			};
			
			mg.startAnimation();
		});

		def.resolve('<canvas id="' + id + '"></canvas>');
	};

	functions.jcamp = {};
	functions.jcamp.hexToRgb = function(hex) {
		var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
		return result ? {
		    r: parseInt(result[1], 16),
		    g: parseInt(result[2], 16),
		    b: parseInt(result[3], 16)
		} : null;
	};
	functions.id = 0;
	functions.cache = [];

	functions.jcamp.fromdom = function(dom, value, opts, highlights, box) {
		var spectra;
		if(dom.length === 0)
			return;
		if(!dom.data('spectra')) {

			var spectra = new ChemDoodle.OverlayCanvas(dom.attr('id'), opts.width || 300, opts.height || 150);
			spectra.CIOnRepaint(function() {
				var h = [], zones = dom.data('zones'), all = dom.data('allspectras');
				
				if(spectra._highlights) {

					for(var i in spectra._highlights) {
						if(spectra._highlights[i] === 1) {

 							for(var j in zones) {
 								if(zones[j][i])
									h.push({zone: zones[j][i], color: all[j].plots_color });
							}
						}
					}
				}

				var mem = this.spectrum.memory;
				var context = this._domcanvas.getContext('2d');
				for(var i = 0, l = h.length; i < l; i++) {
					var x1 = this.spectrum.getTransformedX(h[i].zone[0], {}, mem.width, mem.offsetLeft);
					var x2 = this.spectrum.getTransformedX(h[i].zone[1], {}, mem.width, mem.offsetLeft);
				    context.beginPath();
				    context.rect(x1, 0, x2 - x1, mem.height);
				    var color = hexToRgb(h[i].color);

				    if(color === null || color.r === 0 && color.g === 0 && color.b === 0)
				    	color = {r: 222, g: 205,  b: 59};
				    context.fillStyle = "rgba(" + color.r + ", " + color.g + ", " + color.b + ", 0.5)";
				 	context.fill();
				}
			});

			spectra.CIOnMouseMove(function(e) {
				var zones = dom.data('zones');
				spectra._highlights = spectra._highlights || {};
				var mem = this.spectrum.memory;
				var x = e.offsetX;
				var x1 = this.spectrum.getInverseTransformedX(x);
				var min, max, j = 0;

				for(var k in zones) {
					for(var i in zones[k]) {
						min = Math.min(zones[k][i][0], zones[k][i][1]);
						max = Math.max(zones[k][i][0], zones[k][i][1]);

						if(min < x1 && max > x1) {

							if(!spectra._highlights[i]) {
								CI.RepoHighlight.set(i, 1);
							}

						} else if(spectra._highlights[i] === 1) {
							CI.RepoHighlight.set(i, 0);
						}
					}
				}
			});
			 

			dom.data('spectra', spectra);
			spectra.specs.plots_showYAxis = true;
			//spectra.specs.plots_flipXAxis = false;
			if(!opts) opts = {};
				
			spectra.specs.plots_flipXAxis =  opts.flipX || false;
			spectra.specs.plots_flipYAxis =  opts.flipY || false;
		//	spectra.specs.plots_color = opts.plotcolor || 'black';

		} else {
			spectra = dom.data('spectra');
		}

		// THIS PART IS SPECIFIC TO THE JCAMP
		var spectraid = opts.spectraid;

		if(!dom.data('allspectras'))
			dom.data('allspectras', {});



		if(!dom.data('zones'))
			dom.data('zones', {});

		if(!dom.data('allspectrasid'))
			dom.data('allspectrasid', {});

		var allspectras = dom.data('allspectras');
		var allspectrasid = dom.data('allspectrasid');
		var allzones = dom.data('zones');

/*		if(value._cacheId && CI.Type.jcamp.cache[value._cacheId]) {
			allspectras[spectraid] = CI.Type.jcamp.cache[value._cacheId];

		} else {*/
			allspectras[spectraid] = ChemDoodle.readJCAMP(value.value);
			functions.jcamp.cache.push(allspectras[spectraid]);
			value._cacheId = functions.jcamp.id;
			functions.id++;

			if(functions.jcamp.cache.length === 100) {
				functions.jcamp.cache.splice(0, 1);
				functions.jcamp.id--;
			}
	//	}
		
		allspectras[spectraid].plots_color = opts.plotcolor;
  		allspectras[spectraid].continuous = opts.continuous || false;

		if(allspectrasid[spectraid] === undefined) {
	  		var id = spectra.addSpectrum(allspectras[spectraid]);
			allspectrasid[spectraid] = id;
			spectra.getXMaxBound();
			spectra.repaint();
		} else if(allspectrasid[spectraid] === -1) {
			spectra.loadSpectrum(allspectras[spectraid]);
			spectra.getXMaxBound();
			spectra.repaint();
			API.killHighlight(box.id + "_"  + spectraid);
		} else {
			spectra.overlaySpectra[allspectrasid[spectraid]] = allspectras[spectraid];
			API.killHighlight(box.id + "_"  + spectraid);
		}

		allzones[spectraid] = value._zones;


		CI.RepoHighlight.listen(highlights, function(value, commonKeys) {
			spectra._highlights = spectra._highlights || {};
			for(var i = 0; i < commonKeys.length; i++) 
				spectra._highlights[commonKeys[i]] = value;
			spectra.repaint();
		}, true, box.id + "_"  + spectraid);
	};

	functions.jcamp.toscreen =function(def, valueChild, value, args, highlights, box) {

		require(['lib/plot/plot', 'src/util/jcampconverter'], function(Graph, Converter) {

			var dom = $("<div />").css({width: 200, height: 200});
			var graph = new Graph(dom.get(0), {
				closeRight: false, 
				closeTop: false, 
				zoomMode: ''
			},  {
				bottom: [
					{
						unitModification: false,
						primaryGrid: false,
						nbTicksPrimary: 5,
						nbTicksSecondary: 2,
						secondaryGrid: false,
						axisDataSpacing: { min: 0, max: 0 }
					}
				],

				left: [
					{
						ticklabelratio: 1,
						primaryGrid: true,
						nbTicksSecondary: 4,
						secondaryGrid: false,
						//scientificTicks: true,
						nbTicksPrimary: 2,
						forcedMin: 0,
						axisDataSpacing: { min: 0, max: 0 }
					}
				]}
			);
			graph.resize(200, 200);
			value = Converter(value.value);
			var serie = graph.newSerie('serie', {lineToZero: true});
			serie.autoAxis();
			serie.setData(value.spectra[0].data[0]);
			def.resolve(graph._dom);
			graph.redraw();
			graph.drawSeries();
		});

		
	};

	functions.mf = {};
	functions.mf.toscreen = function(def, value) {
		
		return def.reject(value.replace(/\[([0-9]+)/g,"[<sup>$1</sup>").replace(/([a-zA-Z)])([0-9]+)/g,"$1<sub>$2</sub>").replace(/\(([0-9+-]+)\)/g,"<sup>$1</sup>"));
	};


	functions.pdb = {};
	functions.pdb.toscreen = function(def, value) {
		return def.resolve(value);
	};

	functions.downloadLink = {};
	functions.downloadLink.toscreen = function(def, value) {
		return def.resolve(value.replace(/^(.*)$/,'<a href="$1">⤵</a>'));
	};

	functions.boolean = {};
	functions.boolean.toscreen = function(def, value) {
		if(value)
			def.resolve('<span style="color: green;">&#10004;</span>');
		else
			def.resolve('<span style="color: red;">&#10008;</span>');
	};
    
    functions.colorBar = {};
    functions.colorBar.toscreen = function(def, value) {
        
        var div = $('<div>');
        var gradient = "linear-gradient(to right";
        
        var total = 0, i = 0, l = value.length;
        for(i = 0; i < l; total += value[i++][0]);
        
        var start = 0, end, color;
        for(i = 0; i < l; i++) {
            end = start+value[i][0]/total*100;
            color = value[i][1];
            gradient += ", "+color+" "+start+"%, "+color+" "+end+"%";
            start = end;
        }
        gradient += ")";
        
        div.css({height:"100%",width:"100%"})/*.css("background","-webkit-"+gradient).css("background","-moz-"+gradient)*/.css("background",gradient);
        def.resolve(div.get(0));
    };

    functions.indicator = {};
	functions.indicator.init = function() {
		
		var tooltip = $('<div class="ci-tooltip"></div>').css({
			display: "none",
			opacity: 0
		}).appendTo("#ci-visualizer");
		var current;
		
		$('#modules-grid').on('mouseenter', '[data-tooltip]', function(e) {
			
			current = setTimeout(function(){
				var target = $(e.target);
				var offset = target.offset();
				tooltip.css({
					left: offset.left,
					top: offset.top,
					display: "block"
				}).text(target.attr("data-tooltip"));
				tooltip.animate({
					opacity: 1
				});
			}, 500);
		});
		
		$('#modules-grid').on('mouseleave', '[data-tooltip]', function(e) {
			clearTimeout(current);
			tooltip.css({
				opacity: 0,
				display: "none"
			});
		});
		
	};
    functions.indicator.toscreen = function(def, value) {
		
        if(!(value instanceof Array))
        	def.reject('');
        var html = '<table cellpadding="0" cellspacing="0" style="text-align: center; height:100%; width:100%"><tr>';

		var length = value.length;
		var width = (100/length)+"%";

        for(var i = 0; i < length; i++) {
        	var element = value[i];
        	var span = $('<td>').css({
        		"width":width,
        		"border":"none"
        	});
        	if(element.bgcolor)
        		span.css('background-color', element.bgcolor);
        	if(element.color)
        		span.css('color', element.color);
        	if(element.text)
        		span.append(element.text);
        	if(element.class)
        		span.addClass(element.class);
        	if(element.icon)
        		span.prepend('<i class="fa fa-'+element.icon+'"></i>');
        	if(element.css)
        		span.css(element.css);
        	if(element.tooltip)
        		span.attr("data-tooltip",element.tooltip);
        	html+=span.get(0).outerHTML;
        }
				html += '</tr></table>';
				def.resolve( html );
    };
        
        
        functions.styledValue = {};
        functions.styledValue.toscreen = function(def, value, valueRoot, args, highlights, box, jpath) {

            var div = $('<div>');
            div.css(value.css);
            
            functions.toScreen(value.value, box, args, jpath).always(function(subvalue) {
                div.append(subvalue);
                def.resolve(div.get(0));
            });
            
        };

	function _valueToScreen(deferred, data, box, args, jpath) {
		var type = Traversing.getType(data),
			highlights = Traversing.getHighlights(data);

		args = $.extend(args, Traversing.getOptions(data));
		
		if( ! functions[ type ] ) {
			return deferred.resolve('');
		}
		
		var rootData = data;
		data = Traversing.get(data);
		
		if(!functions[ type ].ready && functions[ type ].init) {
			functions[ type ].init();
			functions[ type ].ready = true;
		}
		
		functions[ type ].toscreen(deferred, data, rootData, args, highlights, box, jpath);
	}

	return {
		toScreen: function(element, box, opts, jpath) {
			var deferred = $.Deferred();

			if( ! element.getChild || ! jpath ) {

				_valueToScreen(deferred, element, box, opts, jpath);
				return deferred;
			}

			element.getChild( jpath ).then( function( element ) {

				_valueToScreen( deferred, element, box, opts, jpath ); 

			}, function() { deferred.reject(); });

			return deferred;
		},
		addType: function(name, renderer) {
			functions[name] = renderer;
		}
	};
	
});
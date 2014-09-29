/*!
 * jsGraphs JavaScript Graphing Library v1.9.11-0
 * http://github.com/NPellet/jsGraphs
 *
 * Copyright 2014 Norman Pellet
 * Released under the MIT license
 *
 * Date: 2014-09-24T14:54Z
 */

(function( global, factory ) {

	if ( typeof module === "object" && typeof module.exports === "object" ) {
		
		module.exports = factory( global );
			
	} else {

		factory( global );

	}

// Pass this if window is not defined yet
}( ( typeof window !== "undefined" ? window : this ) , function( window ) {

	

	var Graph = function( $ ) {

		var build = [ ];

		build[ './jquery' ] = $;
/* 
 * Build: new source file 
 * File name : graph.axis
 * File path : /Users/normanpellet/Documents/Web/graph/src/graph.axis.js
 */

build['./graph.axis'] = ( function( $ ) { 

  var GraphAxis = function() {}

  GraphAxis.prototype = {

    defaults: {
      lineAt0: false,
      display: true,
      flipped: false,
      axisDataSpacing: {
        min: 0.1,
        max: 0.1
      },
      unitModification: false,
      primaryGrid: true,
      secondaryGrid: true,
      shiftToZero: false,
      tickPosition: 1,
      nbTicksPrimary: 3,
      nbTicksSecondary: 10,
      ticklabelratio: 1,
      exponentialFactor: 0,
      exponentialLabelFactor: 0,
      wheelBaseline: "min",
      logScale: false,
      allowedPxSerie: 100,
      forcedMin: false,
      forcedMax: false
    },

    init: function( graph, options, overwriteoptions ) {

      this.unitModificationTimeTicks = [
        [ 1, [ 1, 2, 5, 10, 20, 30 ] ],
        [ 60, [ 1, 2, 5, 10, 20, 30 ] ],
        [ 3600, [ 1, 2, 6, 12 ] ],
        [ 3600 * 24, [ 1, 2, 3, 4, 5, 10, 20, 40 ] ]
      ];

      var self = this;
      this.graph = graph;
      this.options = $.extend( true, {}, GraphAxis.prototype.defaults, overwriteoptions, options );

      this.group = document.createElementNS( this.graph.ns, 'g' );
      this.hasChanged = true;
      this.groupGrids = document.createElementNS( this.graph.ns, 'g' );
      this.graph.axisGroup.insertBefore( this.groupGrids, this.graph.axisGroup.firstChild );
      this.rectEvent = document.createElementNS( this.graph.ns, 'rect' );
      this.rectEvent.setAttribute( 'pointer-events', 'fill' );
      this.rectEvent.setAttribute( 'fill', 'transparent' );
      this.group.appendChild( this.rectEvent );

      this.setEvents();

      this.graph.axisGroup.appendChild( this.group ); // Adds to the main axiszone

      this.line = document.createElementNS( this.graph.ns, 'line' );
      this.line.setAttribute( 'stroke', 'black' );
      this.line.setAttribute( 'shape-rendering', 'crispEdges' );
      this.line.setAttribute( 'stroke-linecap', 'square' );
      this.groupTicks = document.createElementNS( this.graph.ns, 'g' );
      this.groupTickLabels = document.createElementNS( this.graph.ns, 'g' );

      this.group.appendChild( this.groupTicks );
      this.group.appendChild( this.groupTickLabels );
      this.group.appendChild( this.line );

      this.labelValue;

      this.label = document.createElementNS( this.graph.ns, 'text' );
      this.labelTspan = document.createElementNS( this.graph.ns, 'tspan' );
      this.label.appendChild( this.labelTspan );

      this.expTspan = document.createElementNS( this.graph.ns, 'tspan' );
      this.label.appendChild( this.expTspan );
      this.expTspan.setAttribute( 'dx', 10 );
      this.expTspanExp = document.createElementNS( this.graph.ns, 'tspan' );
      this.label.appendChild( this.expTspanExp );
      this.expTspanExp.setAttribute( 'dy', -5 );
      this.expTspanExp.setAttribute( 'font-size', "0.8em" );

      this.label.setAttribute( 'text-anchor', 'middle' );

      this.groupGrids.setAttribute( 'clip-path', 'url(#_clipplot' + this.graph._creation + ')' );

      this.group.appendChild( this.label );

      this.groupSeries = document.createElementNS( this.graph.ns, 'g' );
      this.group.appendChild( this.groupSeries );

      this.ticks = [];
      this.series = [];
      this.totalDelta = 0;
      this.currentAction = false;

      this.group.addEventListener( 'mousemove', function( e ) {
        e.preventDefault();
        var coords = self.graph._getXY( e );
        self.handleMouseMoveLocal( coords.x, coords.y, e );

        for ( var i = 0, l = self.series.length; i < l; i++ ) {
          self.series[ i ].handleMouseMove( false, true );

          if ( self.currentAction == 'labelDragging' )
            self.series[ i ].handleLabelMove( coords.x, coords.y );

          if ( self.currentAction == 'labelDraggingMain' )
            self.series[ i ].handleLabelMainMove( coords.x, coords.y );
        }
      } );

      this.group.addEventListener( 'mouseup', function( e ) {
        e.preventDefault();
        self.handleMouseUp();
      } );

      this.group.addEventListener( 'mouseout', function( e ) {
        e.preventDefault();
        var coords = self.graph._getXY( e );
        self.handleMouseOutLocal( coords.x, coords.y, e );
      } );

      this.labels = [];
      this.group.addEventListener( 'click', function( e ) {
        e.preventDefault();
        var coords = self.graph._getXY( e );
        self.addLabel( self.getVal( coords.x - self.graph.getPaddingLeft() ) );
      } );

      this.axisRand = Math.random();
      this.clip = document.createElementNS( this.graph.ns, 'clipPath' );
      this.clip.setAttribute( 'id', '_clip' + this.axisRand )
      this.graph.defs.appendChild( this.clip );

      this.clipRect = document.createElementNS( this.graph.ns, 'rect' );
      this.clip.appendChild( this.clipRect );
      this.clip.setAttribute( 'clipPathUnits', 'userSpaceOnUse' );
    },

    handleMouseMoveLocal: function() {},

    setEvents: function() {
      var self = this;
      this.rectEvent.addEventListener( 'mousedown', function( e ) {

        e.stopPropagation();
        e.preventDefault();
        if ( e.which == 3 || e.ctrlKey ) {
          return;
        }
        var coords = self.graph._getXY( e );

        self.graph.currentAction = 'zooming';
        self.graph._zoomingMode = self instanceof GraphXAxis ? 'x' : 'y';
        self.graph._zoomingXStart = coords.x;
        self.graph._zoomingYStart = coords.y;
        self.graph._zoomingXStartRel = coords.x - self.graph.getPaddingLeft();
        self.graph._zoomingYStartRel = coords.y - self.graph.getPaddingTop();
        self.this._zoomingSquare.setAttribute( 'width', 0 );
        self.this._zoomingSquare.setAttribute( 'height', 0 );

        switch ( self.graph._zoomingMode ) {
          case 'x':
            self.this._zoomingSquare.setAttribute( 'y', self.graph.getPaddingTop() + self.shift - self.totalDimension );
            self.this._zoomingSquare.setAttribute( 'height', self.totalDimension );
            break;
          case 'y':
            self.this._zoomingSquare.setAttribute( 'x', self.graph.getPaddingLeft() + self.shift - self.totalDimension );
            self.this._zoomingSquare.setAttribute( 'width', self.totalDimension );
            break;
        }

        self.this._zoomingSquare.setAttribute( 'display', 'block' );
      } );
    },

    addLabel: function( x ) {

      for ( var i = 0, l = this.series.length; i < l; i++ ) {

        if ( this.series[ i ].currentAction !== false ) {
          continue;
        }

        this.series[ i ].addLabelObj( {
          x: x
        } );
      }
    },

    hide: function() {
      this.options.display = false;
      return this;
    },

    show: function() {
      this.options.display = true;
      return this;
    },

    setDisplay: function( bool ) {
      this.options.display = !!bool;
      return this;
    },

    isDisplayed: function() {
      return this.options.display;
    },

    setLineAt0: function( bool ) {
      this.options.lineAt0 = !!bool;
    },

    adapt0To: function( axis, mode, value ) {

      if ( axis ) {
        this._adapt0To = [ axis, mode, value ];
      } else {
        this._adapt0To = false;
      }

    },

    getAdapt0ToMin: function() {

      if ( this._adapt0To[ 1 ] == "min" ) {
        return this._adapt0To[ 2 ]
      } else {
        return this._adapt0To[ 2 ] * ( this._adapt0To[ 0 ].getMinValue() / this._adapt0To[ 0 ].getMaxValue() )
      }
    },

    getAdapt0ToMax: function() {

      if ( this._adapt0To[ 1 ] == "max" ) {
        return this._adapt0To[ 2 ]
      } else {
        return this._adapt0To[ 2 ] * ( this._adapt0To[ 0 ].getMaxValue() / this._adapt0To[ 0 ].getMinValue() )
      }
    },

    setAxisDataSpacing: function( val1, val2 ) {
      this.options.axisDataSpacing.min = val1;
      this.options.axisDataSpacing.max = val2 || val1;
    },

    setAxisDataSpacingMin: function( val ) {
      this.options.axisDataSpacing.min = val;
    },

    setAxisDataSpacingMax: function( val ) {
      this.options.axisDataSpacing.max = val;
    },

    setMinPx: function( px ) {
      this.minPx = px;
    },
    setMaxPx: function( px ) {
      this.maxPx = px;
    },
    getMinPx: function() {
      return this.isFlipped() ? this.maxPx : this.minPx;
    },
    getMaxPx: function( px ) {
      return this.isFlipped() ? this.minPx : this.maxPx;
    },
    getMathMaxPx: function() {
      return this.maxPx;
    },

    // Returns the true minimum of the axis. Either forced in options or the one from the data
    getMinValue: function() {
      return !this._adapt0To ? ( this.options.forcedMin || ( this.options.forcedMin === 0 ? 0 : this.dataMin ) ) : ( this.getAdapt0ToMin() );
    },

    getMaxValue: function() {
      return !this._adapt0To ? ( this.options.forcedMax || ( this.options.forcedMax === 0 ? 0 : this.dataMax ) ) : ( this.getAdapt0ToMax() );
    },

    setMinValueData: function( min ) {
      this.dataMin = min;
    },
    setMaxValueData: function( max ) {
      this.dataMax = max;
    },

    forceMin: function( val ) {
      this.options.forcedMin = val;
      return this;
    },
    forceMax: function( val ) {
      this.options.forcedMax = val;
      return this;
    },

    getNbTicksPrimary: function() {
      return this.options.nbTicksPrimary;
    },

    getNbTicksSecondary: function() {
      return this.options.nbTicksSecondary;
    },

    handleMouseMove: function( px, e ) {
      this.mouseVal = this.getVal( px );
    },

    handleMouseWheel: function( delta, e ) {

      delta = Math.min( 0.2, Math.max( -0.2, delta ) );
      var baseline;

      if ( this.options.wheelBaseline == "min" ) {
        baseline = this.getActualMin();
      } else if ( this.options.wheelBaseline == "max" ) {
        baseline = this.getActualMax();
      } else {
        baseline = this.options.wheelBaseline;
      }

      this._doZoomVal(
        ( ( this.getActualMax() - baseline ) * ( 1 + delta ) ) + baseline, ( ( this.getActualMin() - baseline ) * ( 1 + delta ) ) + baseline
      );

      this.graph.redraw( );
      //	this.graph.drawSeries(true);

    },

    handleMouseUp: function( px, e ) {

      if ( this.currentAction == 'labelDragging' || this.currentAction == 'labelDraggingMain' ) {
        for ( var i = 0, l = this.series.length; i < l; i++ ) {
          this.series[ i ].handleLabelUp();
        }
        this.currentAction = false;

      }
      /* else if(this.graph.isZooming())
				this._handleZoom(px);*/

    },

    zoom: function( val1, val2 ) {
      return this._doZoomVal( val1, val2 );
    },

    _doZoomVal: function( val1, val2, mute ) {

      return this._doZoom( this.getPx( val1 ), this.getPx( val2 ), val1, val2, mute );
    },

    _doZoom: function( px1, px2, val1, val2, mute ) {

      //if(this.options.display || 1 == 1) {
      var val1 = val1 !== undefined ? val1 : this.getVal( px1 );
      var val2 = val2 !== undefined ? val2 : this.getVal( px2 );
      this.setCurrentMin( Math.min( val1, val2 ) );
      this.setCurrentMax( Math.max( val1, val2 ) );

      this._hasChanged = true;
      if ( this.options.onZoom && !mute )
        this.options.onZoom( this.currentAxisMin, this.currentAxisMax );
      //	}
    },

    getSerieShift: function() {
      return this._serieShift;
    },

    getSerieScale: function() {
      return this._serieScale;
    },

    getMouseVal: function() {
      return this.mouseVal;
    },

    isFlipped: function() {
      return this.options.flipped;
    },

    getUnitPerTick: function( px, nbTick, valrange, max ) {

      var pxPerTick = px / nbTicks; // 1000 / 100 = 10 px per tick
      if ( !nbTick )
        nbTick = px / 10;
      else
        nbTick = Math.min( nbTick, px / 10 );

      // So now the question is, how many units per ticks ?
      // Say, we have 0.0004 unit per tick
      var unitPerTick = valrange / nbTick;

      if ( this.options.unitModification == 'time' ) {
        // Determine the time domain using max.

        var max = this.getModifiedValue( this.getMaxValue() ),
          units = [
            [ 60, 'min' ],
            [ 3600, 'h' ],
            [ 3600 * 24, 'd' ]
          ];
        if ( max < 3600 ) { // to minutes
          umin = 0;
        } else if ( max < 3600 * 24 ) {
          umin = 1;
        } else {
          umin = 2;
        }

        var breaked = false;
        for ( var i = 0, l = this.unitModificationTimeTicks.length; i < l; i++ ) {
          for ( var k = 0, m = this.unitModificationTimeTicks[ i ][ 1 ].length; k < m; k++ ) {
            if ( unitPerTick < this.unitModificationTimeTicks[ i ][ 0 ] * this.unitModificationTimeTicks[ i ][ 1 ][ k ] ) {
              breaked = true;
              break;
            }
          }
          if ( breaked )
            break;
        }

        //i and k contain the good variable;
        if ( i !== this.unitModificationTimeTicks.length )
          unitPerTickCorrect = this.unitModificationTimeTicks[ i ][ 0 ] * this.unitModificationTimeTicks[ i ][ 1 ][ k ];
        else
          unitPerTickCorrect = 1;

      } else {
        // We take the log
        var decimals = Math.floor( Math.log( unitPerTick ) / Math.log( 10 ) );
        /*
					Example:
						13'453 => Math.log10() = 4.12 => 4
						0.0000341 => Math.log10() = -4.46 => -5
				*/

        var numberToNatural = unitPerTick * Math.pow( 10, -decimals );

        /*
					Example:
						13'453 (4) => 1.345
						0.0000341 (-5) => 3.41
				*/

        this.decimals = -decimals;

        var possibleTicks = [ 1, 2, 5, 10 ];
        var closest = false;
        for ( var i = possibleTicks.length - 1; i >= 0; i-- )
          if ( !closest || ( Math.abs( possibleTicks[ i ] - numberToNatural ) < Math.abs( closest - numberToNatural ) ) ) {
            closest = possibleTicks[ i ];
          }

          // Ok now closest is the number of unit per tick in the natural number
          /*
					Example:
						13'453 (4) (1.345) => 1
						0.0000341 (-5) (3.41) => 5 
				*/

          // Let's scale it back
        var unitPerTickCorrect = closest * Math.pow( 10, decimals );
        /*
					Example:
						13'453 (4) (1.345) (1) => 10'000
						0.0000341 (-5) (3.41) (5) => 0.00005
				*/
      }

      var nbTicks = valrange / unitPerTickCorrect;
      var pxPerTick = px / nbTick;

      return [ unitPerTickCorrect, nbTicks, pxPerTick ];
    },

    setMinMaxToFitSeries: function() {

      var interval = this.getInterval();

      this.currentAxisMin = this.getMinValue() - ( this.options.axisDataSpacing.min * interval );
      this.currentAxisMax = this.getMaxValue() + ( this.options.axisDataSpacing.max * interval );

      if ( this.options.logScale ) {
        this.currentAxisMin = Math.max( 1e-50, this.currentAxisMin );
        this.currentAxisMax = Math.max( 1e-50, this.currentAxisMax );
      }

      if ( isNaN( this.currentAxisMin ) || isNaN( this.currentAxisMax ) ) {
        this.currentAxisMax = undefined;
        this.currentAxisMin = undefined;
      }

    },

    getInterval: function() {
      return this.getMaxValue() - this.getMinValue()
    },

    _getActualInterval: function() {
      return this.getActualMax() - this.getActualMin();
    },

    getActualMin: function() {
      return this.currentAxisMin == this.currentAxisMax ? this.currentAxisMin - 1 : this.currentAxisMin;
    },

    getActualMax: function() {
      return this.currentAxisMax == this.currentAxisMin ? this.currentAxisMax + 1 : this.currentAxisMax;
    },

    setCurrentMin: function( val ) {

      this.currentAxisMin = val;
      if ( this.options.logScale ) {
        this.currentAxisMin = Math.max( 1e-50, val );
      }
    },

    setCurrentMax: function( val ) {
      this.currentAxisMax = val;

      if ( this.options.logScale )
        this.currentAxisMax = Math.max( 1e-50, val );
    },

    flip: function( bool ) {
      this.options.flipped = bool;
      return this;
    },

    /**
     *	@param doNotResetMinMax Whether min max of the axis should fit the one of the series
     */
    _draw: function() { // Redrawing of the axis
      var visible;

      switch ( this.options.tickPosition ) {
        case 3:
          this.tickPx1 = -2;
          this.tickPx2 = 0;
          break;

        case 2:
          this.tickPx1 = -1;
          this.tickPx2 = 1;
          break;

        case 1:
          this.tickPx1 = 0;
          this.tickPx2 = 2;
          break;
      }

      // Remove all ticks
      while ( this.groupTicks.firstChild )
        this.groupTicks.removeChild( this.groupTicks.firstChild );

      // Remove all ticks
      while ( this.groupTickLabels.firstChild )
        this.groupTickLabels.removeChild( this.groupTickLabels.firstChild );

      // Remove all grids
      while ( this.groupGrids.firstChild )
        this.groupGrids.removeChild( this.groupGrids.firstChild );

      if ( this.currentAxisMin == undefined || !this.currentAxisMax == undefined ) {
        this.setMinMaxToFitSeries(); // We reset the min max as a function of the series
      }

      // The data min max is stored in this.dataMin, this.dataMax

      var widthPx = this.maxPx - this.minPx;
      var valrange = this._getActualInterval();

      /* Number of px per unit */
      /* Example: width: 1000px
			/* 			10 - 100 => 11.11
			/*			0 - 2 => 500
			/*			0 - 0.00005 => 20'000'000
														*/

      if ( !this.options.display ) {
        this.line.setAttribute( 'display', 'none' );
        return 0;
      }

      this.line.setAttribute( 'display', 'block' );

      if ( !this.options.hideTicks ) {
        if ( !this.options.logScale ) {
          // So the setting is: How many ticks in total ? Then we have to separate it

          if ( this.options.scientificTicks ) {
            this.scientificExp = Math.floor( Math.log( Math.max( Math.abs( this.getActualMax() ), Math.abs( this.getActualMin() ) ) ) / Math.log( 10 ) );
          }

          var nbTicks1 = this.getNbTicksPrimary();

          var primaryTicks = this.getUnitPerTick( widthPx, nbTicks1, valrange, this.getActualMax() );
          var nbSecondaryTicks = this.secondaryTicks();
          if ( nbSecondaryTicks ) {
            var nbSecondaryTicks = nbSecondaryTicks; // Math.min(nbSecondaryTicks, primaryTicks[2] / 5);
          }

          // We need to get here the width of the ticks to display the axis properly, with the correct shift
          var widthHeight = this.drawTicks( primaryTicks, nbSecondaryTicks );

        } else {
          var widthHeight = this.drawLogTicks();
        }
      } else {
        var widthHeight = 0;
      }

      /************************************/
      /*** DRAWING LABEL ******************/
      /************************************/

      var label;
      if ( label = this.getLabel() ) {
        this.labelTspan.textContent = label;
        if ( this.getExponentialLabelFactor() ) {
          this.expTspan.nodeValue = 'x10';
          this.expTspanExp.nodeValue = this.getExponentialLabelFactor();
          visible = true;
        } else if ( this.options.scientificTicks ) {
          this.expTspan.textContent = 'x10';
          this.expTspanExp.textContent = this.scientificExp;
          visible = true;
        } else
          visible = false;

        this.expTspan.setAttribute( 'display', visible ? 'block' : 'none' );
        this.expTspanExp.setAttribute( 'display', visible ? 'block' : 'none' );
      }

      /************************************/
      /*** DRAW CHILDREN IMPL SPECIFIC ****/
      /************************************/
      this.drawSpecifics();
      if ( this.options.lineAt0 && this.getActualMin() < 0 && this.getActualMax() > 0 )
        this._draw0Line( this.getPx( 0 ) );

      return widthHeight + ( label ? 20 : 0 );
    },

    setTickLabelRatio: function( tickRatio ) {
      this.options.ticklabelratio = tickRatio;
    },

    draw: function() {

      this._widthLabels = 0;
      var drawn = this._draw();
      this._widthLabels += drawn;
      return drawn; // ??? this.series.length > 0 ? 100 : drawn;
    },

    drawTicks: function( primary, secondary ) {

      var unitPerTick = primary[ 0 ],
        min = this.getActualMin(),
        max = this.getActualMax(),
        widthHeight = 0,
        secondaryIncr,
        incrTick,
        subIncrTick,
        loop = 0;

      if ( secondary ) {
        secondaryIncr = unitPerTick / secondary;
      }

      incrTick = this.options.shiftToZero ? this.dataMin - Math.ceil( ( this.dataMin - min ) / unitPerTick ) * unitPerTick : Math.floor( min / unitPerTick ) * unitPerTick;
      this.incrTick = primary[ 0 ];
      this.resetTicks();

      while ( incrTick < max ) {
        loop++;
        if ( loop > 200 )
          break;
        if ( secondary ) {
          subIncrTick = incrTick + secondaryIncr;
          //widthHeight = Math.max(widthHeight, this.drawTick(subIncrTick, 1));
          var loop2 = 0;
          while ( subIncrTick < incrTick + unitPerTick ) {
            loop2++;
            if ( loop2 > 100 )
              break;
            if ( subIncrTick < min || subIncrTick > max ) {
              subIncrTick += secondaryIncr;
              continue;
            }
            this.drawTick( subIncrTick, false, Math.abs( subIncrTick - incrTick - unitPerTick / 2 ) < 1e-4 ? 3 : 2 );
            subIncrTick += secondaryIncr;
          }
        }

        if ( incrTick < min || incrTick > max ) {
          incrTick += primary[ 0 ];
          continue;
        }

        this.drawTick( incrTick, true, 4 );
        incrTick += primary[ 0 ];
      }

      this.widthHeightTick = this.getMaxSizeTick();
      return this.widthHeightTick;
    },

    resetTicks: function() {},

    secondaryTicks: function() {
      return this.options.nbTicksSecondary;
    },

    drawLogTicks: function() {
      var min = this.getActualMin(),
        max = this.getActualMax();
      var incr = Math.min( min, max );
      var max = Math.max( min, max );

      var optsMain = {
        fontSize: '1.0em',
        exponential: true,
        overwrite: false
      }
      if ( incr < 0 )
        incr = 0;
      var pow = incr == 0 ? 0 : Math.floor( Math.log( incr ) / Math.log( 10 ) );
      var incr = 1,
        k = 0,
        val;
      while ( ( val = incr * Math.pow( 10, pow ) ) < max ) {
        if ( incr == 1 ) { // Superior power
          if ( val > min )
            this.drawTick( val, true, 5, optsMain );
        }
        if ( incr == 10 ) {
          incr = 1;
          pow++;
        } else {
          if ( incr != 1 && val > min )
            this.drawTick( val, true, 2, {
              overwrite: incr,
              fontSize: '0.6em'
            } );
          incr++;
        }
      }
      return 5;
    },

    getPx: function( value ) {
      return this.getPos( value );
    },

    getPos: function( value ) {
      //			if(this.getMaxPx() == undefined)
      //				console.log(this);
      //console.log(this.getMaxPx(), this.getMinPx(), this._getActualInterval());
      // Ex 50 / (100) * (1000 - 700) + 700

      //console.log( value, this.getActualMin(), this.getMaxPx(), this.getMinPx(), this._getActualInterval() );
      if ( !this.options.logScale ) {
        return ( value - this.getActualMin() ) / ( this._getActualInterval() ) * ( this.getMaxPx() - this.getMinPx() ) + this.getMinPx();
      } else {
        // 0 if value = min
        // 1 if value = max
        if ( value < 0 )
          return;

        var value = ( ( Math.log( value ) - Math.log( this.getActualMin() ) ) / ( Math.log( this.getActualMax() ) - Math.log( this.getActualMin() ) ) ) * ( this.getMaxPx() - this.getMinPx() ) + this.getMinPx();

        return value;
      }
    },

    getRelPx: function( value ) {
      return ( value / this._getActualInterval() ) * ( this.getMaxPx() - this.getMinPx() );
    },

    getRelVal: function( px ) {

      return px / ( this.getMaxPx() - this.getMinPx() ) * this._getActualInterval();
    },

    getVal: function( px ) {

      // Ex 50 / (100) * (1000 - 700) + 700
      return ( px - this.getMinPx() ) / ( this.getMaxPx() - this.getMinPx() ) * this._getActualInterval() + this.getActualMin();
    },

    valueToText: function( value ) {

      if ( this.options.scientificTicks ) {
        value /= Math.pow( 10, this.scientificExp );
        return value.toFixed( 1 );
      } else {

        value = value * Math.pow( 10, this.getExponentialFactor() ) * Math.pow( 10, this.getExponentialLabelFactor() );
        if ( this.options.shiftToZero )
          value -= this.dataMin;
        if ( this.options.ticklabelratio )
          value *= this.options.ticklabelratio;
        if ( this.options.unitModification ) {
          value = this.modifyUnit( value, this.options.unitModification );
          return value;
        }
        var dec = this.decimals - this.getExponentialFactor() - this.getExponentialLabelFactor();
        if ( dec > 0 )
          return value.toFixed( dec );

        return value.toFixed( 0 );
      }
    },

    getModifiedValue: function( value ) {
      if ( this.options.ticklabelratio )
        value *= this.options.ticklabelratio;

      if ( this.options.shiftToZero )
        value -= this.getMinValue() * ( this.options.ticklabelratio || 1 );
      return value;
    },

    modifyUnit: function( value, mode ) {
      switch ( mode ) {
        case 'time': // val must be in seconds => transform in hours / days / months
          var max = this.getModifiedValue( this.getMaxValue() ),
            units = [
              [ 60, 'min' ],
              [ 3600, 'h' ],
              [ 3600 * 24, 'd' ]
            ];
          if ( max < 3600 ) { // to minutes
            umin = 0;
          } else if ( max < 3600 * 24 ) {
            umin = 1;
          } else if ( max < 3600 * 24 * 30 ) {
            umin = 2;
          }
          break;
      }

      var incr = this.incrTick;
      var text = "",
        valueRounded;

      value = value / units[ umin ][ 0 ];

      valueRounded = Math.floor( value );

      text = valueRounded + units[ umin ][ 1 ];
      umin--;

      while ( incr < 1 * units[ umin + 1 ][ 0 ] && umin > -1 ) {

        first = false;
        value = ( value - valueRounded ) * units[ umin + 1 ][ 0 ] / units[ umin ][ 0 ];
        valueRounded = Math.round( value );
        text += " " + valueRounded + units[ umin ][ 1 ];
        umin--;
      }

      return text;
    },

    getExponentialFactor: function() {
      return this.options.exponentialFactor;
    },

    setExponentialFactor: function( value ) {
      this.options.exponentialFactor = value;
    },

    setExponentialLabelFactor: function( value ) {
      this.options.exponentialLabelFactor = value;
    },

    getExponentialLabelFactor: function() {
      return this.options.exponentialLabelFactor;
    },

    setLabel: function( value ) {
      this.options.labelValue = value;
      return this;
    },

    getLabel: function() {
      return this.options.labelValue;
    },

    setShift: function( shift, totalDimension ) {
      this.shift = shift;
      this.totalDimension = totalDimension; // Width (axis y) or height (axis x) of the axis.
      this._setShift();
    },

    getShift: function() {
      return this.shift;
    },

    setTickPosition: function( pos ) {
      switch ( pos ) {
        case 3:
        case 'outside':
          pos = 3;
          break;

        case 2:
        case 'centered':
          pos = 2;
          break;

        default:
        case 1:
        case 'inside':
          pos = 1;
          break;
      }

      this.options.tickPosition = pos;
      return this;
    },

    toggleGrids: function( bool ) {
      this.options.primaryGrid = bool;
      this.options.secondaryGrid = bool;
      return this;
    },

    togglePrimaryGrid: function( bool ) {
      this.options.primaryGrid = bool;
      return this;
    },

    toggleSecondaryGrid: function( bool ) {
      this.options.secondaryGrid = bool;
      return this;
    },

    doGridLine: function( primary, x1, x2, y1, y2 ) {
      var gridLine = document.createElementNS( this.graph.ns, 'line' );
      gridLine.setAttribute( 'shape-rendering', 'crispEdges' );
      gridLine.setAttribute( 'y1', y1 );
      gridLine.setAttribute( 'y2', y2 );
      gridLine.setAttribute( 'x1', x1 );
      gridLine.setAttribute( 'x2', x2 );

      gridLine.setAttribute( 'stroke', primary ? this.getColorPrimaryGrid() : this.getColorSecondaryGrid() );
      this.groupGrids.appendChild( gridLine );
    },

    getColorPrimaryGrid: function() {
      return '#c0c0c0';
    },

    getColorSecondaryGrid: function() {
      return '#f0f0f0';
    },

    setTickContent: function( dom, val, options ) {
      if ( !options ) options = {};

      if ( options.overwrite || !options.exponential )
        dom.textContent = options.overwrite || this.valueToText( val );
      else {
        var log = Math.round( Math.log( val ) / Math.log( 10 ) );
        var unit = Math.floor( val * Math.pow( 10, -log ) );

        dom.textContent = ( unit != 1 ) ? unit + "x10" : "10";
        var tspan = document.createElementNS( this.graph.ns, 'tspan' );
        tspan.textContent = log;
        tspan.setAttribute( 'font-size', '0.7em' );
        tspan.setAttribute( 'dy', -3 );
        dom.appendChild( tspan );
      }

      if ( options.fontSize ) {
        dom.setAttribute( 'font-size', options.fontSize );
      }
    },

    removeSerie: function( serie ) {
      this.series.splice( this.series.indexOf( serie ), 1 );
    },

    killSeries: function( noRedraw ) {
      for ( var i = 0; i < this.series.length; i++ ) {
        this.series[ i ].kill( noRedraw );
      }
      this.series = [];
    },

    removeSeries: function() {
      this.killSeries();
    },

    handleMouseOutLocal: function( x, y, e ) {
      for ( var i = 0, l = this.series.length; i < l; i++ )
        this.series[ i ].hideTrackingMarker();
    }
  }

  return GraphAxis;

 } ) ( build["./jquery"] );


// Build: End source file (graph.axis) 



;
/* 
 * Build: new source file 
 * File name : graph.axis.x
 * File path : /Users/normanpellet/Documents/Web/graph/src/graph.axis.x.js
 */

build['./graph.axis.x'] = ( function( $, GraphAxis ) { 

  

  var GraphXAxis = function( graph, topbottom, options ) {
    this.init( graph, options );
    this.top = topbottom == 'top';
  }

  $.extend( GraphXAxis.prototype, GraphAxis.prototype, {

    getAxisPosition: function() {

      if ( !this.options.display ) {
        return 0;
      }

      var size = ( this.options.tickPosition == 1 ? 15 : 25 ) + this.graph.options.fontSize * 2;
      if ( this.options.allowedPxSerie && this.series.length > 0 )
        size += this.options.allowedPxSerie;
      return size;
    },

    getAxisWidthHeight: function() {
      return;
    },

    _setShift: function() {
      this.group.setAttribute( 'transform', 'translate(0 ' + ( this.top ? this.shift : ( this.graph.getDrawingHeight() - this.shift ) ) + ')' )
    },

    getMaxSizeTick: function() {
      return ( this.top ? -1 : 1 ) * ( ( this.options.tickPosition == 1 ) ? 10 : 10 )
    },

    drawTick: function( value, label, scaling, options ) {
      var group = this.groupTicks;
      var tick = document.createElementNS( this.graph.ns, 'line' ),
        val = this.getPos( value );

      if ( val == undefined )
        return;

      tick.setAttribute( 'shape-rendering', 'crispEdges' );
      tick.setAttribute( 'x1', val );
      tick.setAttribute( 'x2', val );

      tick.setAttribute( 'y1', ( this.top ? 1 : -1 ) * this.tickPx1 * scaling );
      tick.setAttribute( 'y2', ( this.top ? 1 : -1 ) * this.tickPx2 * scaling );

      if ( label && this.options.primaryGrid )
        this.doGridLine( true, val, val, 0, this.graph.getDrawingHeight() );
      else if ( !label && this.options.secondaryGrid )
        this.doGridLine( false, val, val, 0, this.graph.getDrawingHeight() );

      tick.setAttribute( 'stroke', 'black' );

      this.groupTicks.appendChild( tick );
      if ( label ) {
        var groupLabel = this.groupTickLabels;
        var tickLabel = document.createElementNS( this.graph.ns, 'text' );
        tickLabel.setAttribute( 'x', val );
        tickLabel.setAttribute( 'y', ( this.top ? -1 : 1 ) * ( ( this.options.tickPosition == 1 ? 8 : 20 ) + ( this.top ? 10 : 0 ) ) );
        tickLabel.setAttribute( 'text-anchor', 'middle' );
        tickLabel.style.dominantBaseline = 'hanging';

        this.setTickContent( tickLabel, value, options );

        this.groupTickLabels.appendChild( tickLabel );
      }
      this.ticks.push( tick );
    },

    drawSpecifics: function() {

      // Adjusts group shift
      //this.group.setAttribute('transform', 'translate(0 ' + this.getShift() + ')');

      // Place label correctly
      this.label.setAttribute( 'text-anchor', 'middle' );
      this.label.setAttribute( 'x', Math.abs( this.getMaxPx() - this.getMinPx() ) / 2 + this.getMinPx() );
      this.label.setAttribute( 'y', ( this.top ? -1 : 1 ) * ( ( this.options.tickPosition == 1 ? 10 : 15 ) + this.graph.options.fontSize ) );

      this.line.setAttribute( 'x1', this.getMinPx() );
      this.line.setAttribute( 'x2', this.getMaxPx() );
      this.line.setAttribute( 'y1', 0 );
      this.line.setAttribute( 'y2', 0 );

      this.labelTspan.style.dominantBaseline = 'hanging';
      this.expTspan.style.dominantBaseline = 'hanging';
      this.expTspanExp.style.dominantBaseline = 'hanging';
    },

    drawSeries: function() {

      if ( !this.shift ) {
        return;
      }

      this.rectEvent.setAttribute( 'y', !this.top ? 0 : -this.shift );
      this.rectEvent.setAttribute( 'height', this.totalDimension );
      this.rectEvent.setAttribute( 'x', Math.min( this.getMinPx(), this.getMaxPx() ) );
      this.rectEvent.setAttribute( 'width', Math.abs( this.getMinPx() - this.getMaxPx() ) );
      //this.rectEvent.setAttribute('fill', 'rgba(0, 0, 0, 0.5)');
      //console.log(this.clipRect);
      this.clipRect.setAttribute( 'y', !this.top ? 0 : -this.shift );
      this.clipRect.setAttribute( 'height', this.totalDimension );
      this.clipRect.setAttribute( 'x', Math.min( this.getMinPx(), this.getMaxPx() ) );
      this.clipRect.setAttribute( 'width', Math.abs( this.getMinPx() - this.getMaxPx() ) );

      for ( var i = 0, l = this.series.length; i < l; i++ ) { // These are the series on the axis itself !!
        this.series[ i ].draw();
      }
    },

    _draw0Line: function( px ) {
      this._0line = document.createElementNS( this.graph.ns, 'line' );
      this._0line.setAttribute( 'x1', px );
      this._0line.setAttribute( 'x2', px );

      this._0line.setAttribute( 'y1', 0 );
      this._0line.setAttribute( 'y2', this.getMaxPx() );

      this._0line.setAttribute( 'stroke', 'black' );
      this.groupGrids.appendChild( this._0line );
    },

    addSerie: function( name, options ) {
      var serie = new GraphSerieAxisX( name, options );
      serie.setAxis( this );
      serie.init( this.graph, name, options );
      serie.autoAxis();
      serie.setXAxis( this );
      this.series.push( serie );
      this.groupSeries.appendChild( serie.groupMain );
      this.groupSeries.setAttribute( 'clip-path', 'url(#_clip' + this.axisRand + ')' );

      return serie;
    },

    handleMouseMoveLocal: function( x, y, e ) {
      x -= this.graph.getPaddingLeft();
      this.mouseVal = this.getVal( x );
    },

    isXY: function() {
      return 'x';
    }

  } );

  return GraphXAxis;
 } ) ( build["./jquery"],build["./graph.axis"] );


// Build: End source file (graph.axis.x) 



;
/* 
 * Build: new source file 
 * File name : graph.axis.y
 * File path : /Users/normanpellet/Documents/Web/graph/src/graph.axis.y.js
 */

build['./graph.axis.y'] = ( function( GraphAxis ) { 

  

  var GraphYAxis = function( graph, leftright, options ) {

    this.init( graph, options );

    this.leftright = leftright;
    this.left = leftright == 'left';

  }

  $.extend( GraphYAxis.prototype, GraphAxis.prototype, {

    getAxisPosition: function() {
      var size = 0;

      if ( !this.options.display ) {
        return 0;
      }

      if ( this.options.allowedPxSerie && this.series.length > 0 )
        size = this.options.allowedPxSerie;
      return size;
    },

    getAxisWidthHeight: function() {
      return 15;
    },

    resetTicks: function() {
      this.longestTick = [ false, 0 ];
    },

    getMaxSizeTick: function() {

      return ( this.longestTick[ 0 ] ? this.longestTick[ 0 ].getComputedTextLength() : 0 ) + 10; //(this.left ? 10 : 0);
    },

    drawTick: function( value, label, scaling, options ) {
      var group = this.groupTicks,
        tickLabel,
        labelWidth = 0,
        pos = this.getPos( value );

      if ( pos == undefined )
        return;

      var tick = document.createElementNS( this.graph.ns, 'line' );
      tick.setAttribute( 'shape-rendering', 'crispEdges' );
      tick.setAttribute( 'y1', pos );
      tick.setAttribute( 'y2', pos );

      tick.setAttribute( 'x1', ( this.left ? 1 : -1 ) * this.tickPx1 * scaling );
      tick.setAttribute( 'x2', ( this.left ? 1 : -1 ) * this.tickPx2 * scaling );

      tick.setAttribute( 'stroke', 'black' );

      if ( label && this.options.primaryGrid )
        this.doGridLine( true, 0, this.graph.getDrawingWidth(), pos, pos );
      else if ( !label && this.options.secondaryGrid )
        this.doGridLine( false, 0, this.graph.getDrawingWidth(), pos, pos );

      this.groupTicks.appendChild( tick );

      if ( label ) {
        var groupLabel = this.groupTickLabels;
        tickLabel = document.createElementNS( this.graph.ns, 'text' );
        tickLabel.setAttribute( 'y', pos );
        tickLabel.setAttribute( 'x', this.left ? -10 : 10 );

        if ( this.left ) {
          tickLabel.setAttribute( 'text-anchor', 'end' );
        } else {
          tickLabel.setAttribute( 'text-anchor', 'start' );
        }
        tickLabel.style.dominantBaseline = 'central';

        this.setTickContent( tickLabel, value, options );

        this.groupTickLabels.appendChild( tickLabel );

        if ( String( tickLabel ).length >= this.longestTick[ 1 ] ) {
          this.longestTick[ 0 ] = tickLabel;
          this.longestTick[ 1 ] = String( tickLabel.textContent ).length;

        }
      }

      this.ticks.push( tick );
    },

    drawSpecifics: function() {
      // Place label correctly
      //this.label.setAttribute('x', (this.getMaxPx() - this.getMinPx()) / 2);
      this.label.setAttribute( 'transform', 'translate(' + ( ( this.left ? 1 : -1 ) * ( -this.widthHeightTick - 10 - 5 ) ) + ', ' + ( Math.abs( this.getMaxPx() - this.getMinPx() ) / 2 + Math.min( this.getMinPx(), this.getMaxPx() ) ) + ') rotate(-90)' );

      if ( !this.left ) {
        this.labelTspan.style.dominantBaseline = 'hanging';
        this.expTspan.style.dominantBaseline = 'hanging';
        this.expTspanExp.style.dominantBaseline = 'hanging';
      }

      this.line.setAttribute( 'y1', this.getMinPx() );
      this.line.setAttribute( 'y2', this.getMaxPx() );
      this.line.setAttribute( 'x1', 0 );
      this.line.setAttribute( 'x2', 0 );
    },

    drawSeries: function() {
      if ( !this.shift )
        return;

      this.rectEvent.setAttribute( 'x', ( this.left ? -this.shift : 0 ) );
      this.rectEvent.setAttribute( 'width', this.totalDimension );
      this.rectEvent.setAttribute( 'y', Math.min( this.getMinPx(), this.getMaxPx() ) );
      this.rectEvent.setAttribute( 'height', Math.abs( this.getMinPx() - this.getMaxPx() ) );

      this.clipRect.setAttribute( 'x', -this.shift );
      this.clipRect.setAttribute( 'width', this.totalDimension );
      this.clipRect.setAttribute( 'y', Math.min( this.getMinPx(), this.getMaxPx() ) );
      this.clipRect.setAttribute( 'height', Math.abs( this.getMinPx() - this.getMaxPx() ) );

      for ( var i = 0, l = this.series.length; i < l; i++ ) { // These are the series on the axis itself !!
        this.series[ i ].draw();
      }

    },

    _setShift: function() {

      var xshift = this.isLeft() ? this.getShift() : this.graph.getWidth() - this.graph.getPaddingRight() - this.graph.getPaddingLeft() - this.getShift();
      this.group.setAttribute( 'transform', 'translate(' + xshift + ' 0)' );

    },

    isLeft: function() {
      return this.left;
    },

    isRight: function() {
      return !this.left;
    },

    isFlipped: function() {
      return !this.options.flipped;
    },

    _draw0Line: function( px ) {
      this._0line = document.createElementNS( this.graph.ns, 'line' );
      this._0line.setAttribute( 'y1', px );
      this._0line.setAttribute( 'y2', px );

      this._0line.setAttribute( 'x1', 0 );
      this._0line.setAttribute( 'x2', this.graph.getDrawingWidth() );

      this._0line.setAttribute( 'stroke', 'black' );
      this.groupGrids.appendChild( this._0line );
    },

    addSerie: function( name, options ) {
      var serie = new GraphSerieAxisY( name, options );
      serie.init( this.graph, name, options );
      serie.setAxis( this );
      serie.autoAxis();
      serie.setYAxis( this );
      this.series.push( serie );
      this.groupSeries.appendChild( serie.groupMain );
      this.groupSeries.setAttribute( 'clip-path', 'url(#_clip' + this.axisRand + ')' );

      return serie;
    },

    handleMouseMoveLocal: function( x, y, e ) {
      y -= this.graph.getPaddingTop();
      this.mouseVal = this.getVal( y );
    },

    // TODO: Get the min value as well
    scaleToFitAxis: function( axis, exclude, start, end ) {

      if ( !start ) {
        start = axis.getActualMin();
      }

      if ( !end ) {
        end = axis.getActualMax();
      }

      if ( typeof exclude == "number" ) {
        end = start;
        start = exclude;
        exclude = false;
      }

      var max = -Infinity,
        j = 0;

      for ( var i = 0, l = this.graph.series.length; i < l; i++ ) {

        if ( !this.graph.series[ i ].isShown() ) {
          continue;
        }

        if ( this.graph.series[ i ] == exclude ) {
          continue;
        }

        if ( !( this.graph.series[ i ].getXAxis() == axis ) || ( this.graph.series[ i ].getYAxis() !== this ) ) {
          continue;
        }

        j++;
        max = Math.max( max, this.graph.series[ i ].getMax( start, end ) );
      }

      if ( j == 0 ) {

        this.setMinMaxToFitSeries();
      } else {
        this._doZoomVal( 0, max );
      }
    },

    isXY: function() {
      return 'y';
    }

  } );

  return GraphYAxis;

 } ) ( build["./graph.axis"] );


// Build: End source file (graph.axis.y) 



;
/* 
 * Build: new source file 
 * File name : graph.xaxis.time
 * File path : /Users/normanpellet/Documents/Web/graph/src/graph.xaxis.time.js
 */

build['./graph.xaxis.time'] = ( function( GraphAxis ) { 

  

  var GraphXAxis = function( graph, topbottom, options ) {

    this.wrapper = {
      1: document.createElementNS( graph.ns, 'g' ),
      2: document.createElementNS( graph.ns, 'g' )
    };
    this.groups = {
      1: [],
      2: []
    };

    var rect = document.createElementNS( graph.ns, 'rect' );
    rect.setAttribute( 'fill', '#c0c0c0' );
    rect.setAttribute( 'stroke', '#808080' );
    rect.setAttribute( 'height', '20' );
    rect.setAttribute( 'x', '0' );
    rect.setAttribute( 'y', '0' );

    this.rect = rect;

    this.wrapper[ 1 ].appendChild( this.rect );

    this.init( graph, options );

    this.group.appendChild( this.wrapper[  1 ] );
    this.group.appendChild( this.wrapper[  2 ] );

    this.wrapper[ 1 ].setAttribute( 'transform', 'translate( 0, 25 )' );
    this.wrapper[ 2 ].setAttribute( 'transform', 'translate( 0, 00 )' );
  }

  /*
   * Date Format 1.2.3
   * (c) 2007-2009 Steven Levithan <stevenlevithan.com>
   * MIT license
   *
   * Includes enhancements by Scott Trenda <scott.trenda.net>
   * and Kris Kowal <cixar.com/~kris.kowal/>
   *
   * Accepts a date, a mask, or a date and a mask.
   * Returns a formatted version of the given date.
   * The date defaults to the current date/time.
   * The mask defaults to dateFormat.masks.default.
   */

  var dateFormat = function() {
    var token = /d{1,4}|m{1,4}|yy(?:yy)?|([HhMsTt])\1?|[WLloSZ]|"[^"]*"|'[^']*'/g,
      timezone = /\b(?:[PMCEA][SDP]T|(?:Pacific|Mountain|Central|Eastern|Atlantic) (?:Standard|Daylight|Prevailing) Time|(?:GMT|UTC)(?:[-+]\d{4})?)\b/g,
      timezoneClip = /[^-+\dA-Z]/g,
      pad = function( val, len ) {
        val = String( val );
        len = len || 2;
        while ( val.length < len ) val = "0" + val;
        return val;
      },
      getWeek = function( d, f ) {
        var onejan = new Date( d[ f + 'FullYear' ](), 0, 1 );
        return Math.ceil( ( ( ( d - onejan ) / 86400000 ) + onejan[ f + 'Day' ]() + 1 ) / 7 );
      };

    // Regexes and supporting functions are cached through closure
    return function( date, mask, utc ) {
      var dF = dateFormat;

      // You can't provide utc if you skip other args (use the "UTC:" mask prefix)
      if ( arguments.length == 1 && Object.prototype.toString.call( date ) == "[object String]" && !/\d/.test( date ) ) {
        mask = date;
        date = undefined;
      }

      // Passing date through Date applies Date.parse, if necessary
      date = date ? new Date( date ) : new Date;
      if ( isNaN( date ) ) throw SyntaxError( "invalid date" );

      mask = String( dF.masks[ mask ] || mask || dF.masks[ "default" ] );

      // Allow setting the utc argument via the mask
      if ( mask.slice( 0, 4 ) == "UTC:" ) {
        mask = mask.slice( 4 );
        utc = true;
      }

      var _ = utc ? "getUTC" : "get",
        d = date[ _ + "Date" ](),
        D = date[ _ + "Day" ](),
        m = date[ _ + "Month" ](),
        y = date[ _ + "FullYear" ](),
        H = date[ _ + "Hours" ](),
        M = date[ _ + "Minutes" ](),
        s = date[ _ + "Seconds" ](),
        L = date[ _ + "Milliseconds" ](),
        o = utc ? 0 : date.getTimezoneOffset(),
        flags = {
          d: d,
          dd: pad( d ),
          ddd: dF.i18n.dayNames[ D ],
          dddd: dF.i18n.dayNames[ D + 7 ],
          m: m + 1,
          mm: pad( m + 1 ),
          mmm: dF.i18n.monthNames[ m ],
          mmmm: dF.i18n.monthNames[ m + 12 ],
          yy: String( y ).slice( 2 ),
          yyyy: y,
          h: H % 12 || 12,
          hh: pad( H % 12 || 12 ),
          H: H,
          HH: pad( H ),
          M: M,
          MM: pad( M ),
          s: s,
          ss: pad( s ),
          l: pad( L, 3 ),
          L: pad( L > 99 ? Math.round( L / 10 ) : L ),
          t: H < 12 ? "a" : "p",
          tt: H < 12 ? "am" : "pm",
          T: H < 12 ? "A" : "P",
          TT: H < 12 ? "AM" : "PM",
          Z: utc ? "UTC" : ( String( date ).match( timezone ) || [ "" ] ).pop().replace( timezoneClip, "" ),
          o: ( o > 0 ? "-" : "+" ) + pad( Math.floor( Math.abs( o ) / 60 ) * 100 + Math.abs( o ) % 60, 4 ),
          S: [ "th", "st", "nd", "rd" ][ d % 10 > 3 ? 0 : ( d % 100 - d % 10 != 10 ) * d % 10 ],
          W: getWeek( date, _ ),
        };

      return mask.replace( token, function( $0 ) {
        return $0 in flags ? flags[ $0 ] : $0.slice( 1, $0.length - 1 );
      } );
    };
  }();

  // Some common format strings
  dateFormat.masks = {
    "default": "ddd mmm dd yyyy HH:MM:ss",
    shortDate: "m/d/yy",
    mediumDate: "mmm d, yyyy",
    longDate: "mmmm d, yyyy",
    fullDate: "dddd, mmmm d, yyyy",
    shortTime: "h:MM TT",
    mediumTime: "h:MM:ss TT",
    longTime: "h:MM:ss TT Z",
    isoDate: "yyyy-mm-dd",
    isoTime: "HH:MM:ss",
    isoDateTime: "yyyy-mm-dd'T'HH:MM:ss",
    isoUtcDateTime: "UTC:yyyy-mm-dd'T'HH:MM:ss'Z'"
  };

  // Internationalization strings
  dateFormat.i18n = {
    dayNames: [
      "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat",
      "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
    ],
    monthNames: [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
      "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"
    ]
  };

  /* END DATE FORMAT */

  function getClosestIncrement( value, basis ) {
    return Math.round( value / basis ) * basis;
  }

  function roundDate( date, format ) {

    switch ( format.unit ) {

      case 's': // Round at n hour

        date.setSeconds( getClosestIncrement( date.getSeconds(), format.increment ) );
        date.setMilliseconds( 0 );

        break;

      case 'i': // Round at n hour

        date.setMinutes( getClosestIncrement( date.getMinutes(), format.increment ) );
        date.setSeconds( 0 );
        date.setMilliseconds( 0 );

        break;

      case 'h': // Round at n hour

        date.setHours( getClosestIncrement( date.getHours(), format.increment ) );

        date.setMinutes( 0 );
        date.setSeconds( 0 );
        date.setMilliseconds( 0 );

        break;

      case 'd':

        date.setMinutes( 0 );
        date.setSeconds( 0 );
        date.setMilliseconds( 0 );
        date.setHours( 0 );

        date.setDate( getClosestIncrement( date.getDate(), format.increment ) );

        break;

      case 'm':

        date.setMinutes( 0 );
        date.setSeconds( 0 );
        date.setMilliseconds( 0 );
        date.setHours( 0 );
        date.setDate( 1 );

        date.setMonth( getClosestIncrement( date.getMonth(), format.increment ) );

        break;

      case 'y':

        date.setMinutes( 0 );
        date.setSeconds( 0 );
        date.setMilliseconds( 0 );
        date.setHours( 0 );
        date.setDate( 1 );
        date.setMonth( 0 );

        //date.setYear( getClosest( date.getDate(), format.increment ) );

        break;
    }

    return date;
  }

  function incrementDate( date, format ) {

    switch ( format.unit ) {

      case 's':

        date.setSeconds( date.getSeconds() + format.increment );
        date.setMilliseconds( 0 );

        break;

      case 'i':

        date.setMinutes( date.getMinutes() + format.increment );
        date.setSeconds( 0 );
        date.setMilliseconds( 0 );

        break;

      case 'h': // Round at n hour

        date.setHours( date.getHours() + format.increment );
        date.setMinutes( 0 );
        date.setSeconds( 0 );
        date.setMilliseconds( 0 );

        break;

      case 'd':

        date.setDate( date.getDate() + format.increment );
        date.setMinutes( 0 );
        date.setSeconds( 0 );
        date.setMilliseconds( 0 );
        date.setHours( 0 );

        break;

      case 'm':

        date.setMonth( date.getMonth() + format.increment );
        date.setMinutes( 0 );
        date.setSeconds( 0 );
        date.setMilliseconds( 0 );
        date.setHours( 0 );
        date.setDate( 1 );

        break;

      case 'y':

        date.setYear( date.getYear() + format.increment );

        date.setMinutes( 0 );
        date.setSeconds( 0 );
        date.setMilliseconds( 0 );
        date.setHours( 0 );
        date.setDate( 1 );
        date.setMonth( 0 );

        break;
    }

    return date;
  }

  function getGroup( axis, level, number ) {

    if ( axis.groups[ level ][ number ] ) {
      axis.groups[  level ][  number ].group.setAttribute( 'display', 'block' );
      return axis.groups[  level ][  number ];
    }

    var g = {

      group: document.createElementNS( axis.graph.ns, 'g' ),
      text: document.createElementNS( axis.graph.ns, 'text' )
    }

    var line = document.createElementNS( axis.graph.ns, 'line' );

    line.setAttribute( 'stroke', 'black' );
    line.setAttribute( 'y1', 0 );
    switch ( level ) {

      case 2:

        line.setAttribute( 'y2', 6 );
        g.text.setAttribute( 'y', 15 );

        g.line = line;

        g.group.appendChild( g.line );
        break;

      case 1:

        line.setAttribute( 'y2', 20 );
        g.text.setAttribute( 'y', 10 );

        g.line1 = line;
        g.line2 = line.cloneNode();

        g.group.appendChild( g.line1 );
        g.group.appendChild( g.line2 );

        break;
    }

    g.text.setAttribute( 'text-anchor', 'middle' );
    g.text.setAttribute( 'dominant-baseline', 'middle' );

    g.group.appendChild( g.text );

    axis.getWrapper( level ).appendChild( g.group );

    return axis.groups[ level ][ number ] = g;
  }

  function hideGroups( axis, level, from ) {

    for ( ; from < axis.groups[ level ].length; from++ ) {

      hideGroup( axis.groups[  level ][ from ] )
    }
  }

  function hideGroup( group ) {
    group.group.setAttribute( 'display', 'none' );
  }

  function getDateText( date, format ) {

    return dateFormat( date, format );
  }

  function renderGroup( level, group, text, minPx, maxPx, x1, x2 ) {

    switch ( level ) {

      case 1:

        var x1B = Math.max( minPx, Math.min( maxPx, x1 ) ),
          x2B = Math.max( minPx, Math.min( maxPx, x2 ) );

        group.line1.setAttribute( 'x1', x1B );
        group.line2.setAttribute( 'x1', x2B );

        group.line1.setAttribute( 'x2', x1B );
        group.line2.setAttribute( 'x2', x2B );

        group.text.setAttribute( 'x', ( x1B + x2B ) / 2 );

        if ( text.length * 8 > x2B - x1B ) {
          text = "";
        }

        group.text.textContent = text;
        break;

      case 2:

        if ( x1 < minPx ||  x1 > maxPx ) {

          hideGroup( group );
          return;
        }

        group.line.setAttribute( 'x1', x1 );
        group.line.setAttribute( 'x2', x1 );
        group.text.setAttribute( 'x', x1 );
        group.text.textContent = text;

        break;
    }

  }

  GraphXAxis.prototype = $.extend( true, GraphXAxis.prototype, GraphAxis.prototype, {

    draw: function() { // Redrawing of the axis
      var visible;

      if ( this.currentAxisMin == undefined || !this.currentAxisMax == undefined ) {
        this.setMinMaxToFitSeries(); // We reset the min max as a function of the series
      }

      this.line.setAttribute( 'x1', this.getMinPx() );
      this.line.setAttribute( 'x2', this.getMaxPx() );
      this.line.setAttribute( 'y1', 0 );
      this.line.setAttribute( 'y2', 0 );

      var widthPx = this.maxPx - this.minPx;
      var widthTime = this._getActualInterval();

      var timePerPx = widthTime / widthPx;

      var maxVal = this.getActualMax();
      var minVal = this.getActualMin();

      this.rect.setAttribute( 'width', widthPx );
      this.rect.setAttribute( 'x', this.minPx );

      if ( !maxVal ||  !minVal ) {
        return 0;
      }

      var axisFormat = [

        { // One day

          threshold: 1000,
          increments: {

            1: {
              increment: 1, // One day on the first axis
              unit: 'd',
              format: 'HH:MM (dd/mm)'
            },

            2: {
              increment: 1,
              unit: 'i',
              format: 'MM:ss'
            }
          }
        },

        { // One day

          threshold: 1500,
          increments: {

            1: {
              increment: 1, // One day on the first axis
              unit: 'd',
              format: 'dd/mm'
            },

            2: {
              increment: 1,
              unit: 'i',
              format: 'H"h"MM'
            }
          }
        },

        { // One day

          threshold: 4000,
          increments: {

            1: {
              increment: 1, // One day on the first axis
              unit: 'd',
              format: 'dd/mm'
            },

            2: {
              increment: 2,
              unit: 'i',
              format: 'H"h"MM'
            }
          }
        },

        { // One day

          threshold: 8000,
          increments: {

            1: {
              increment: 1, // One day on the first axis
              unit: 'd',
              format: 'dd/mm'
            },

            2: {
              increment: 10,
              unit: 'i',
              format: 'H"h"MM'
            }
          }
        },

        { // One day

          threshold: 26400,
          increments: {

            1: {
              increment: 1, // One day on the first axis
              unit: 'd',
              format: 'dd/mm'
            },

            2: {
              increment: 20,
              unit: 'i',
              format: 'H"h"MM'
            }
          }
        },

        { // One day

          threshold: 86400,
          increments: {

            1: {
              increment: 1, // One day on the first axis
              unit: 'd',
              format: 'dd/mm'
            },

            2: {
              increment: 1,
              unit: 'h',
              format: 'H"h"MM'
            }
          }
        },

        { // One day

          threshold: 200000,
          increments: {

            1: {

              increment: 1,
              unit: 'd',
              format: 'dd/mm'
            },

            2: {

              increment: 2, // One day on the first axis
              unit: 'h',
              format: 'H"h"MM'
            }
          }
        },

        { // One day

          threshold: 400000,
          increments: {

            1: {

              increment: 1,
              unit: 'd',
              format: 'dd/mm'
            },

            2: {

              increment: 6, // One day on the first axis
              unit: 'h',
              format: 'H"h"MM'
            }
          }
        },

        { // One day

          threshold: 1400000,
          increments: {

            1: {

              increment: 1,
              unit: 'd',
              format: 'dd/mm'
            },

            2: {

              increment: 12, // One day on the first axis
              unit: 'h',
              format: 'HH"h"MM'
            }
          }
        },

        { // One day

          threshold: 6400000,
          increments: {

            1: {

              increment: 1,
              unit: 'm',
              format: 'mmmm'
            },

            2: {

              increment: 1, // One day on the first axis
              unit: 'd',
              format: 'dd'
            }
          }
        },

        { // One day

          threshold: 12400000,
          increments: {

            1: {

              increment: 1,
              unit: 'm',
              format: 'mmmm'
            },

            2: {

              increment: 2, // One day on the first axis
              unit: 'd',
              format: 'dd'
            }
          }
        },

        { // One day

          threshold: 86400000,
          increments: {

            1: {

              increment: 1,
              unit: 'm',
              format: 'mmmm'
            },

            2: {

              increment: 7, // One day on the first axis
              unit: 'd',
              format: 'dd'
            }
          }
        },

      ];

      var currentFormat;

      for ( i = 0; i < axisFormat.length; i++ ) {

        if ( axisFormat[ i ].threshold > timePerPx ) {
          currentFormat = axisFormat[ i ];
          break;
        }

      }

      var xVal1,
        xVal2;

      var level = 0;

      for ( level = 1; level <= 2; level++ ) {

        var dateFirst = new Date( minVal );

        var currentDate = roundDate( dateFirst, currentFormat.increments[ level ] ),
          i = 0;

        do {

          xVal1 = this.getPx( currentDate.getTime() );

          var text = getDateText( currentDate, currentFormat.increments[ level ].format );
          var group = getGroup( this, level, i );

          currentDate = incrementDate( currentDate, currentFormat.increments[ level ] );
          xVal2 = this.getPx( currentDate.getTime() );

          renderGroup( level, group, text, this.getMinPx(), this.getMaxPx(), xVal1, xVal2 );

          i++;

        } while ( currentDate.getTime() < maxVal );

        hideGroups( this, level, i );
      }

    },

    getWrapper: function( level ) {
      return this.wrapper[ level ]
    },

    setShift: function( shift, totalDimension ) {
      this.shift = shift;
      this.group.setAttribute( 'transform', 'translate(0 ' + ( this.top ? this.shift : ( this.graph.getDrawingHeight() - this.shift ) ) + ')' )
    },

    getAxisPosition: function() {
      return 60;
    },

    drawSeries: function() {}
  } );

  return GraphXAxis;
 } ) ( build["./graph.axis"] );


// Build: End source file (graph.xaxis.time) 



;
/* 
 * Build: new source file 
 * File name : graph.legend
 * File path : /Users/normanpellet/Documents/Web/graph/src/graph.legend.js
 */

build['./graph.legend'] = ( function( ) { 

  var legendDefaults = {
    frame: false,
    backgroundColor: 'transparent',
    frameWidth: 0,
    frameColor: 'transparent',
    paddingTop: 10,
    paddingLeft: 10,
    paddingBottom: 10,
    paddingRight: 10,

    movable: false
  }

  var Legend = function( graph, options ) {

    this.options = $.extend( {}, legendDefaults, options );

    this.graph = graph;
    this.svg = document.createElementNS( this.graph.ns, 'g' );
    this.subG = document.createElementNS( this.graph.ns, 'g' );

    this.rect = document.createElementNS( this.graph.ns, 'rect' );
    this.rectBottom = document.createElementNS( this.graph.ns, 'rect' );

    this.rect.setAttribute( 'x', 0 );
    this.rect.setAttribute( 'y', 0 );

    this.rectBottom.setAttribute( 'x', 0 );
    this.rectBottom.setAttribute( 'y', 0 );

    this.svg.appendChild( this.subG );

    this.pos = {
      x: undefined,
      y: undefined,
      transformX: 0,
      transformY: 0
    }

    this.setEvents();

    this.applyStyle();
  };

  Legend.prototype = {

    setPosition: function( position, alignToX, alignToY ) {

      if ( !position ) {
        return;
      }

      var pos = this.graph.getPosition( position );

      if ( alignToX == "right" ) {
        pos.x -= this.width;
      }

      if ( alignToY == "bottom" ) {
        pos.y -= this.height;
      }

      this.pos.transformX = pos.x;
      this.pos.transformY = pos.y;

      this._setPosition();
    },

    update: function() {

      var self = this;
      this.applyStyle();

      while ( this.subG.hasChildNodes() ) {
        this.subG.removeChild( this.subG.lastChild );
      }

      this.svg.insertBefore( this.rectBottom, this.svg.firstChild );

      var series = this.graph.getSeries(),
        line,
        text,
        g;

      for ( var i = 0, l = series.length; i < l; i++ ) {

        ( function( j ) {

          var g, line, text;

          g = document.createElementNS( self.graph.ns, 'g' );
          g.setAttribute( 'transform', "translate(0, " + ( i * 16 + self.options.paddingTop ) + ")" );

          self.subG.appendChild( g );

          var line = series[ j ].getSymbolForLegend();
          var marker = series[ j ].getMarkerForLegend();
          var text = series[ j ].getTextForLegend();

          g.appendChild( line );
          if ( marker ) {
            g.appendChild( marker );
          }

          g.appendChild( text );

          g.addEventListener( 'click', function( e ) {

            var serie = series[ j ];

            if ( serie.isSelected() ) {

              serie.hide();
              self.graph.unselectSerie( serie );

            } else if ( serie.isShown() ) {

              self.graph.selectSerie( serie );

            } else {
              
              serie.show();

            }

          } );

        } )( i );
      }

      var bbox = this.subG.getBBox();

      this.width = bbox.width + this.options.paddingRight + this.options.paddingLeft;
      this.height = bbox.height + this.options.paddingBottom + this.options.paddingTop;

      this.rect.setAttribute( 'width', this.width );
      this.rect.setAttribute( 'height', this.height );
      this.rect.setAttribute( 'fill', 'none' );
      this.rect.setAttribute( 'pointer-events', 'fill' );

      this.rect.setAttribute( 'display', 'none' );

      if ( this.options.movable ) {
        this.rectBottom.style.cursor = "move";
      }

      this.rectBottom.setAttribute( 'width', this.width );
      this.rectBottom.setAttribute( 'height', this.height );

      this.rectBottom.setAttribute( 'x', bbox.x - this.options.paddingTop );
      this.rectBottom.setAttribute( 'y', bbox.y - this.options.paddingLeft );

      this.svg.appendChild( this.rect );
    },

    getDom: function() {
      return this.svg;
    },

    setEvents: function() {

      var self = this;
      var pos = this.pos;

      var mousedown = function( e ) {

        if ( self.options.movable ) {
          pos.x = e.clientX;
          pos.y = e.clientY;
          e.stopPropagation();
          e.preventDefault();
          self.mousedown = true;
          self.graph.elementMoving( self );

          self.rect.setAttribute( 'display', 'block' );
        }
      };

      var mousemove = function( e ) {
        self.handleMouseMove( e );
      }

      this.rectBottom.addEventListener( 'mousedown', mousedown );
      this.rectBottom.addEventListener( 'mousemove', mousemove );
      this.rect.addEventListener( 'mousemove', mousemove );
    },

    handleMouseUp: function( e ) {

      e.stopPropagation();
      e.preventDefault();
      this.mousedown = false;
      this.rect.setAttribute( 'display', 'none' );
      this.graph.elementMoving( false );
    },

    handleMouseMove: function( e ) {

      if ( !this.mousedown ) {
        return;
      }

      var pos = this.pos;

      var deltaX = e.clientX - pos.x;
      var deltaY = e.clientY - pos.y;

      pos.transformX += deltaX;
      pos.transformY += deltaY;

      pos.x = e.clientX;
      pos.y = e.clientY;

      e.stopPropagation();
      e.preventDefault();

      this._setPosition();
    },

    _setPosition: function() {

      var pos = this.pos;
      this.svg.setAttribute( 'transform', 'translate(' + pos.transformX + ', ' + pos.transformY + ')' );
    },

    applyStyle: function() {

      if ( this.options.frame ) {
        this.rectBottom.setAttribute( 'stroke', this.options.frameColor );
        this.rectBottom.setAttribute( 'stroke-width', this.options.frameWidth + "px" );
      }

      this.rectBottom.setAttribute( 'fill', this.options.backgroundColor );

    }
  };

  return Legend;

 } ) (  );


// Build: End source file (graph.legend) 



;
/* 
 * Build: new source file 
 * File name : dynamicdepencies
 * File path : /Users/normanpellet/Documents/Web/graph/src/dynamicdepencies.js
 */

build['./dynamicdepencies'] = ( function( ) { 

  return function() {

    this.caching = {};
    this.folderMap = {};

    this.load = function( type, file, callback ) {

      var self = this;

      if ( !this.caching[ type ] ) {
        this.caching[ type ] = {};
      }

      if ( Array.isArray( file ) ) {

        file.map( function( file ) {

          self.load( type, file, callback );

        } );
        return;
      }

      var origFile = file;

      if ( this.folderMap[ type ] ) {

        file = this.folderMap[ type ] + file;
      }

      if ( this.caching[ type ][ file ] ) {

        //	console.log( "Found element " + file + " of type " + type + " in cache" );

        return ( callback( this.caching[ type ][ file ], file, origFile ) || this.caching[ type ][ file ] );

      } else if ( typeof build !== "undefined" && build[ file ] ) {

        return ( callback( this.caching[ type ][ file ] = build[ file ], file, origFile ) || this.caching[ type ][ file ] );

      } else if ( typeof require !== "undefined" ) {
        //console.log( "Trying to load file " + file + " of type " + type, this.folderMap );
        require( [ file ], function( instance ) {

          callback( self.caching[ type ][ file ] = instance, file, origFile );
        } );
      } else {
        console.warn( "Could not load file " + file + " of type " + type );
      }
    }

    this.configure = function( map ) {
      this.folderMap = map ||  {};
    }

    //return loader;

  };

 } ) (  );


// Build: End source file (dynamicdepencies) 



;
/* 
 * Build: new source file 
 * File name : graph.core
 * File path : /Users/normanpellet/Documents/Web/graph/src/graph.core.js
 */

build['./graph.core'] = ( function( $, GraphXAxis, GraphYAxis, GraphXAxisTime, GraphLegend, DynamicDepencies ) { 

  

  var graphDefaults = {

    title: '',

    paddingTop: 30,
    paddingBottom: 5,
    paddingLeft: 20,
    paddingRight: 20,

    close: {
      left: true,
      right: true,
      top: true,
      bottom: true
    },

    fontSize: 12,
    fontFamily: 'Myriad Pro, Helvetica, Arial',

    plugins: [],
    pluginAction: {},
    wheel: {},
    dblclick: {},

    dynamicDependencies: {
      'plugin': './plugins/',
      'serie': './series/',
      'shapes': './shapes/'
    },

    series: [ 'line' ]
  };

  var Graph = function( dom, options, axis, callback ) {

    var self = this;
    this._creation = Date.now() + Math.random();

    if ( typeof dom == "string" ) {
      dom = document.getElementById( dom );
    }

    if ( !dom || !dom.appendChild ) {
      throw "The DOM has not been defined";
    }

    if ( typeof axis == "function" ) {
      callback = axis;
      axis = false;
    }

    if ( typeof options == "function" ) {
      callback = options;
      options = {};

    }

    this.options = $.extend( {}, graphDefaults, options );
    this.axis = {
      left: [],
      top: [],
      bottom: [],
      right: []
    };

    this.shapes = [];
    this.shapesLocked = false;

    this.ns = 'http://www.w3.org/2000/svg';
    this.nsxlink = "http://www.w3.org/1999/xlink";
    this.series = [];
    this._dom = dom;
    // DOM

    this._doDom();

    var w, h;
    if( dom.style.width ) {
      w = parseInt( dom.style.width.replace('px', '') );
    } else {
       w = $( dom ).width()
    }


    if( dom.style.height ) {
      h = parseInt( dom.style.height.replace('px', '') );
    } else {
       h = $( dom ).height()
    }
    


    this.setSize( w, h );
    this._resize();
    _registerEvents( this );

    this.dynamicLoader = new DynamicDepencies();
    this.dynamicLoader.configure( this.options.dynamicDependencies );

    this.trackingLines = {
      id: 0,
      current: false,
      dasharray: [ false, "5, 5", "5, 1", "1, 5" ],
      currentDasharray: [],
      vertical: [],
      horizontal: []
    };

    this.shapeHandlers = {
      mouseDown: [],
      mouseUp: [],
      mouseMove: [],
      mouseOver: [],
      mouseOut: [],
      beforeMouseMove: [],
      onChange: [],
      onCreated: [],
      onResizing: [],
      onMoving: [],
      onAfterResized: [],
      onAfterMoved: [],
      onSelected: [],
      onUnselected: [],
      onRemoved: []
    };

    this.pluginsReady = $.Deferred();
    this.seriesReady = $.Deferred();

    this.currentAction = false;

    if ( callback ) {
      $.when( this.pluginsReady, this.seriesReady ).then( function() {
        callback( self )
      } );
    }

    var funcName;
    if ( axis ) {
      for ( var i in axis ) {
        for ( var j = 0, l = axis[ i ].length; j < l; j++ ) {
          switch ( i ) {
            case 'top':
              funcName = 'setTopAxis';
              var axisInstance = new GraphXAxis( this, 'top', axis[ i ][ j ] );
              break;
            case 'bottom':
              funcName = 'setBottomAxis';
              var axisInstance = new GraphXAxis( this, 'bottom', axis[ i ][ j ] );
              break;
            case 'left':
              funcName = 'setLeftAxis';
              var axisInstance = new GraphYAxis( this, 'left', axis[ i ][ j ] );
              break;
            case 'right':
              funcName = 'setRightAxis';
              var axisInstance = new GraphYAxis( this, 'right', axis[ i ][ j ] );
              break;
          }
          this[ funcName ]( axisInstance, j );
        }
      }
    }

    this._pluginsInit();
    this._seriesInit();
  }

  Graph.prototype = {

    setAttributeTo: function( to, params, ns ) {
      var i;

      if ( ns ) {
        for ( i in params ) {
          to.setAttributeNS( ns, i, params[ i ] );
        }
      } else {
        for ( i in params ) {
          to.setAttribute( i, params[ i ] );
        }
      }
    },

    _doDom: function() {

      // Create SVG element, set the NS
      this.dom = document.createElementNS( this.ns, 'svg' );
      this.dom.setAttributeNS( "http://www.w3.org/2000/xmlns/", "xmlns:xlink", "http://www.w3.org/1999/xlink" );
      //this.dom.setAttributeNS(this.ns, 'xmlns:xlink', this.nsxml);	
      this.setAttributeTo( this.dom, {
        'xmlns': this.ns,
        'font-family': this.options.fontFamily,
        'font-size': this.options.fontSize
      } );

      this._dom.appendChild( this.dom );

      this._dom.setAttribute( 'tabindex', 1 );

      this._dom.style.outline = "none";

      this.defs = document.createElementNS( this.ns, 'defs' );
      this.dom.appendChild( this.defs );

      this.rectEvent = document.createElementNS( this.ns, 'rect' );
      this.setAttributeTo( this.rectEvent, {
        'pointer-events': 'fill',
        'fill': 'transparent'
      } );
      this.dom.appendChild( this.rectEvent );

      // Handling graph title
      this.domTitle = document.createElementNS( this.ns, 'text' );
      this.setTitle( this.options.title );
      this.setAttributeTo( this.domTitle, {
        'text-anchor': 'middle',
        'y': 20
      } );
      this.dom.appendChild( this.domTitle );
      //

      this.graphingZone = document.createElementNS( this.ns, 'g' );
      this.setAttributeTo( this.graphingZone, {
        'transform': 'translate(' + this.options.paddingLeft + ', ' + this.options.paddingTop + ')'
      } );
      this.dom.appendChild( this.graphingZone );

      /*	this.shapeZoneRect = document.createElementNS(this.ns, 'rect');
			//this.shapeZoneRect.setAttribute('pointer-events', 'fill');
			this.shapeZoneRect.setAttribute('fill', 'transparent');
			this.shapeZone.appendChild(this.shapeZoneRect);
		*/
      this.axisGroup = document.createElementNS( this.ns, 'g' );
      this.graphingZone.appendChild( this.axisGroup );

      this.plotGroup = document.createElementNS( this.ns, 'g' );
      this.graphingZone.appendChild( this.plotGroup );

      // 5 September 2014. I encountered a case here shapeZone must be above plotGroup
      this.shapeZone = document.createElementNS( this.ns, 'g' );
      this.graphingZone.appendChild( this.shapeZone );

      this._makeClosingLines();

      this.clip = document.createElementNS( this.ns, 'clipPath' );
      this.clip.setAttribute( 'id', '_clipplot' + this._creation )
      this.defs.appendChild( this.clip );

      this.clipRect = document.createElementNS( this.ns, 'rect' );
      this.clip.appendChild( this.clipRect );
      this.clip.setAttribute( 'clipPathUnits', 'userSpaceOnUse' );

      this.markerArrow = document.createElementNS( this.ns, 'marker' );
      this.markerArrow.setAttribute( 'viewBox', '0 0 10 10' );
      this.markerArrow.setAttribute( 'id', 'arrow' + this._creation );
      this.markerArrow.setAttribute( 'refX', '6' );
      this.markerArrow.setAttribute( 'refY', '5' );
      this.markerArrow.setAttribute( 'markerUnits', 'strokeWidth' );
      this.markerArrow.setAttribute( 'markerWidth', '8' );
      this.markerArrow.setAttribute( 'markerHeight', '6' );
      this.markerArrow.setAttribute( 'orient', 'auto' );
      //this.markerArrow.setAttribute('fill', 'context-stroke');
      //this.markerArrow.setAttribute('stroke', 'context-stroke');

      var pathArrow = document.createElementNS( this.ns, 'path' );
      pathArrow.setAttribute( 'd', 'M 0 0 L 10 5 L 0 10 z' );
      pathArrow.setAttribute( 'fill', 'context-stroke' );
      this.markerArrow.appendChild( pathArrow );

      this.defs.appendChild( this.markerArrow );

      this.vertLineArrow = document.createElementNS( this.ns, 'marker' );
      this.vertLineArrow.setAttribute( 'viewBox', '0 0 10 10' );
      this.vertLineArrow.setAttribute( 'id', 'verticalline' + this._creation );
      this.vertLineArrow.setAttribute( 'refX', '0' );
      this.vertLineArrow.setAttribute( 'refY', '5' );
      this.vertLineArrow.setAttribute( 'markerUnits', 'strokeWidth' );
      this.vertLineArrow.setAttribute( 'markerWidth', '20' );
      this.vertLineArrow.setAttribute( 'markerHeight', '10' );
      this.vertLineArrow.setAttribute( 'orient', 'auto' );
      //this.vertLineArrow.setAttribute('fill', 'context-stroke');
      //this.vertLineArrow.setAttribute('stroke', 'context-stroke');
      this.vertLineArrow.setAttribute( 'stroke-width', '1px' );

      var pathVertLine = document.createElementNS( this.ns, 'path' );
      pathVertLine.setAttribute( 'd', 'M 0 -10 L 0 10' );
      pathVertLine.setAttribute( 'stroke', 'black' );

      this.vertLineArrow.appendChild( pathVertLine );

      this.defs.appendChild( this.vertLineArrow );

      this.plotGroup.setAttribute( 'clip-path', 'url(#_clipplot' + this._creation + ')' );

      this.bypassHandleMouse = false;
    },

    setOption: function( name, val ) {
      this.options[ name ] = val;
    },

    kill: function() {
      this._dom.removeChild( this.dom );

    },

    _getXY: function( e ) {

      var x = e.clientX,
        y = e.clientY;

      if ( e.offsetX !== undefined && e.offsetY !== undefined ) {

        return {
          x: e.offsetX,
          y: e.offsetY
        };
      }

      y = e.clientY;

      var pos = this.offsetCached || $( this._dom ).offset();

      x -= pos.left - window.scrollX;
      y -= pos.top - window.scrollY;

      return {
        x: x,
        y: y
      };
    },

    cacheOffset: function() {
      this.offsetCached = $( this._dom ).offset();
    },

    uncacheOffset: function() {
      this.offsetCached = false;
    },

    focus: function()  {
      this._dom.focus();
    },

    isPluginAllowed: function( e, plugin ) {

      if ( this.forcedPlugin == plugin ) {
        return true;
      }

      var act = this.options.pluginAction[ plugin ] || plugin,
        shift = e.shiftKey,
        ctrl = e.ctrlKey;

      if ( act.shift === undefined ) {
        act.shift = false;
      }

      if ( act.ctrl === undefined ) {
        act.ctrl = false;
      }

      if ( shift !== act.shift ) {
        return false;
      }

      if ( ctrl !== act.ctrl ) {
        return false;
      }

      return true;
    },

    forcePlugin: function( plugin ) {
      this.forcedPlugin = plugin;
    },

    unforcePlugin: function() {
      this.forcedPlugin = false;
    },

    elementMoving: function( movingElement ) {
      this.bypassHandleMouse = movingElement;
    },

    _resetAxes: function() {

      while ( this.axisGroup.firstChild ) {
        this.axisGroup.removeChild( this.axisGroup.firstChild );
      }
      this.axis.left = [];
      this.axis.right = [];
      this.axis.bottom = [];
      this.axis.top = [];
    },

    _applyToAxis: {
      'string': function( type, func, params ) {
        //		params.splice(1, 0, type);

        for ( var i = 0; i < this.axis[ type ].length; i++ ) {
          this.axis[ type ][ i ][ func ].apply( this.axis[ type ][ i ], params );
        }
      },

      'function': function( type, func, params ) {
        for ( var i = 0; i < this.axis[ type ].length; i++ ) {
          func.call( this, this.axis[ type ][ i ], type );
        }
      }
    },

    _applyToAxes: function( func, params, tb, lr ) {
      var ax = [],
        i = 0,
        l;

      if ( tb || tb == undefined ) {
        ax.push( 'top' );
        ax.push( 'bottom' );
      }
      if ( lr || lr == undefined ) {
        ax.push( 'left' );
        ax.push( 'right' );
      }

      for ( l = ax.length; i < l; i++ ) {
        this._applyToAxis[ typeof func ].call( this, ax[ i ], func, params );
      }
    },

    setWidth: function( width, skipResize ) {
      this.width = width;

      if ( !skipResize )
        this._resize();
    },

    getWidth: function() {
      return this.width;
    },

    setHeight: function( height, skipResize ) {
      this.height = height;

      if ( !skipResize )
        this._resize();
    },

    getHeight: function() {
      return this.height;
    },

    resize: function( w, h ) {

      this.setSize( w, h );
      this._resize();
    },

    setSize: function( w, h ) {

      this.setWidth( w, true );
      this.setHeight( h, true );

      this.getDrawingHeight();
      this.getDrawingWidth();

    },

    getDom: function() {
      return this.dom;
    },

    getXAxis: function( num, options ) {
      if ( this.axis.top.length > 0 && this.axis.bottom.length == 0 ) {
        return this.getTopAxis( num, options );
      }

      return this.getBottomAxis( num, options );
    },

    getYAxis: function( num, options ) {

      if ( this.axis.right.length > 0 && this.axis.left.length == 0 ) {
        return this.getRightAxis( num, options );
      }

      return this.getLeftAxis( num, options );
    },

    getTopAxis: function( num, options ) {
      return _getAxis( this, num, options, GraphXAxis, 'top' );
    },

    getBottomAxis: function( num, options ) {
      return _getAxis( this, num, options, GraphXAxis, 'bottom' );
    },

    getLeftAxis: function( num, options ) {
      return _getAxis( this, num, options, GraphYAxis, 'left' );
    },

    getRightAxis: function( num, options ) {
      return _getAxis( this, num, options, GraphYAxis, 'right' );
    },

    setBottomAxisAsTime: function( num, options ) {
      return _getAxis( this, num, options, GraphXAxisTime, 'bottom' );
    },

    setXAxis: function( axis, num ) {
      this.setBottomAxis( axis, num );
    },
    setYAxis: function( axis, num ) {
      this.setLeftAxis( axis, num );
    },

    setLeftAxis: function( axis, num ) {
      num = num || 0;
      this.axis.left[ num ] = axis;
    },
    setRightAxis: function( axis, num ) {
      num = num || 0;
      this.axis.right[ num ] = axis;
    },
    setTopAxis: function( axis, num ) {
      num = num || 0;
      this.axis.top[ num ] = axis;
    },
    setBottomAxis: function( axis, num ) {
      num = num || 0;
      this.axis.bottom[ num ] = axis;
    },

    getPaddingTop: function() {
      return this.options.paddingTop;
    },

    getPaddingLeft: function() {
      return this.options.paddingLeft;
    },

    getPaddingBottom: function() {
      return this.options.paddingTop;
    },

    getPaddingRight: function() {
      return this.options.paddingRight;
    },

    // Title
    setTitle: function( title ) {
      this.options.title = title;
      this.domTitle.textContent = title;
    },

    displayTitle: function() {
      this.domTitle.setAttribute( 'display', 'inline' );
    },

    hideTitle: function() {
      this.domTitle.setAttribute( 'display', 'none' );
    },

    getDrawingHeight: function( useCache ) {
      if ( useCache && this.innerHeight )
        return this.innerHeight;
      var height = this.height - this.options.paddingTop - this.options.paddingBottom;
      return ( this.innerHeight = height );
    },

    getDrawingWidth: function( useCache ) {
      if ( useCache && this.innerWidth )
        return this.innerWidth;
      var width = this.width - this.options.paddingLeft - this.options.paddingRight;
      return ( this.innerWidth = width );
    },

    getBoundaryAxisFromSeries: function( axis, xy, minmax ) {
      var x = xy == 'x',
        min = minmax == 'min',
        val,
        func = x ? [ 'getMinX', 'getMaxX' ] : [ 'getMinY', 'getMaxY' ],
        func2use = func[ min ? 0 : 1 ],
        currentSerie,
        serie,
        series,
        serieValue,
        i,
        l;

      val = min ? Number.MAX_VALUE : Number.MIN_VALUE;
      series = this.getSeriesFromAxis( axis, true );

      for ( i = 0, l = series.length; i < l; i++ ) {

        serie = series[ i ];

        if ( !serie.isShown() ) {
          continue;
        }

        serieValue = serie[ func2use ]();

        val = Math[ minmax ]( val, serieValue );

        if ( val == serieValue && currentSerie ) {
          currentSerie.isMinOrMax( false, xy, minmax );
          currentSerie = serie;
          serie.isMinOrMax( true, xy, minmax );
        }
      }

      return val;
    },

    getSeriesFromAxis: function( axis, selfSeries ) {
      var series = [],
        i = this.series.length - 1;
      for ( ; i >= 0; i-- ) {
        if ( this.series[ i ].getXAxis() == axis || this.series[ i ].getYAxis() == axis ) {
          series.push( this.series[ i ] );
        }
      }

      if ( series ) {

        for ( i = 0; i < axis.series.length; i++ ) {
          series.push( axis.series[ i ] );
        }
      }

      return series;
    },

    _resize: function() {

      if ( !this.width || !this.height ) {
        return;
      }

      this.sizeSet = true;
      this.dom.setAttribute( 'width', this.width );
      this.dom.setAttribute( 'height', this.height );
      this.domTitle.setAttribute( 'x', this.width / 2 );

      refreshDrawingZone( this );
    },

    canRedraw: function() {
      return ( this.width && this.height );
    },

    redraw: function( noX, noY ) {

      if ( !this.canRedraw() ) {
        return;
      }

      if ( !this.sizeSet ) {

        this._resize();

      } else {

        refreshDrawingZone( this, noX, noY );
      }

      return true;
    },

    /*
     *	Updates the min and max value of the axis according to the data only
     *	Does not perform autoscale
     *	But we need to keep track of the data min/max in case of an autoAxis.
     */
    _updateAxes: function() {

      var axisvars = [ 'bottom', 'top', 'left', 'right' ],
        axis,
        j,
        l,
        i,
        xy;

      this.refreshMinOrMax();

      for ( j = 0, l = axisvars.length; j < l; j++ ) {

        for ( i = this.axis[ axisvars[ j ] ].length - 1; i >= 0; i-- ) {

          axis = this.axis[ axisvars[ j ] ][ i ];
          xy = j < 2 ? 'x' : 'y';

          if ( axis.disabled ) {
            continue;
          }

          //console.log( axisvars[ j ], this.getBoundaryAxisFromSeries( this.axis[ axisvars[ j ] ][ i ], xy, 'min'), this.getBoundaryAxisFromSeries( this.axis[ axisvars[ j ] ][ i ], xy, 'max') );
          axis.setMinValueData( this.getBoundaryAxisFromSeries( this.axis[ axisvars[ j ] ][ i ], xy, 'min' ) );
          axis.setMaxValueData( this.getBoundaryAxisFromSeries( this.axis[ axisvars[ j ] ][ i ], xy, 'max' ) );

        }
      }
    },

    // Repaints the axis and series

    autoscaleAxes: function() {

      this._applyToAxes( "setMinMaxToFitSeries", null, true, true );
      this.redraw();

    },

    refreshMinOrMax: function() {
      var i = this.series.length - 1;
      for ( ; i >= 0; i-- ) { // Let's remove the serie from the stack
        this.series[ i ].isMinOrMax( false );
      }
    },

    newSerie: function( name, options, type, callback ) {

      var self = this;

      if ( typeof type == "function" ) {
        type = "line";
        callback = type;
      }

      if ( !type ) {
        type = "line";
      }

      var serie = makeSerie( this, name, options, type, function( serie ) {

        self.series.push( serie );

        if ( self.legend ) {
          self.legend.update();
        }

        if ( callback ) {
          callback( serie );
        }
      } );

      return serie;
    },

    getSerie: function( name ) {
      if ( typeof name == 'number' ) {
        return this.series[ name ];
      }
      var i = 0,
        l = this.series.length;

      for ( ; i < l; i++ ) {

        if ( this.series[ i ].getName() == name ) {

          return this.series[ i ];

        }
      }
    },

    getSeries: function() {
      return this.series;
    },

    drawSerie: function( serie ) {

      if ( !serie.draw ) {
        throw "Serie has no method draw";
      }

      serie.draw();
    },

    resetSeries: function() {
      for ( var i = 0; i < this.series.length; i++ ) {
        this.series[ i ].kill( true );
      }
      this.series = [];
    },

    drawSeries: function() {

      if ( !this.width || !this.height ) {
        return;
      }

      var i = this.series.length - 1;
      for ( ; i >= 0; i-- ) {

        if ( this.series[  i ].isShown() ) {
          this.series[ i ].draw();
        }
      }
    },

    _removeSerie: function( serie ) {

      this.series.splice( this.series.indexOf( serie ), 1 );

    },

    selectSerie: function( serie ) {

      if ( this.selectedSerie == serie ) {
        return;
      }

      if ( this.selectedSerie ) {
        this.selectedSerie.unselect();
      }

      this.selectedSerie = serie;
      this.triggerEvent( 'onSelectSerie', serie );
      serie.select();
    },

    unselectSerie: function( serie ) {

      serie.unselect();
      this.selectedSerie = false;
      this.triggerEvent( 'onUnselectSerie', serie );

    },

    getSelectedSerie: function() {
      return this.selectedSerie;
    },

    /*
		checkMinOrMax: function(serie) {
			var xAxis = serie.getXAxis();
			var yAxis = serie.getYAxis();

			var minX = serie.getMinX(),
				maxX = serie.getMaxX(),
				minY = serie.getMinY(),
				maxY = serie.getMaxY(),
				isMinMax = false;

			if(minX <= xAxis.getMinValue()) {
				isMinMax = true;
				serie.isMinOrMax(true, 'x', 'min');
			}

			if(maxX >= xAxis.getMaxValue()) {
				isMinMax = true;
				serie.isMinOrMax(true, 'x', 'max');
			}

			if(minY <= yAxis.getMinValue()) {
				isMinMax = true;
				serie.isMinOrMax(true, 'y', 'min');
			}

			if(maxX >= xAxis.getMaxValue()) {
				isMinMax = true;
				serie.isMinOrMax(true, 'y', 'max');
			}

			return isMinMax;
		},
*/

    makeToolbar: function( toolbarData ) {

      var self = this,
        deferred = $.Deferred();

      this.dynamicLoader.load( 'util', './graph.toolbar', function( toolbar ) {

        self.toolbar = new toolbar( self, toolbarData );
        deferred.resolve( self.toolbar );
      } );

      return deferred;
    },

    newShape: function( shapeData, events, mute ) {

      var self = this,
        response,
        deferred = $.Deferred();

      shapeData.id = Math.random();

      if ( ! mute ) {

        if ( false === ( response = this.triggerEvent( 'onBeforeNewShape', shapeData ) ) ) {
          return false;
        }
      }



      if ( response ) {
        shapeData = response;
      }

      var callback = function( shapeConstructor ) {

        var shape = new shapeConstructor( self, shapeData.shapeOptions );

        shape.setSerie( self.getSerie( 0 ) );

        if ( !shape ) {
          return;
        }

        shape.setOriginalData( shapeData, events );
        if ( shape.data ) {
          shape.data.id = self.id;
        }

        if ( shapeData.fillColor ) {
          shape.set( 'fillColor', shapeData.fillColor );
        }

        if ( shapeData.strokeColor ) {
          shape.set( 'strokeColor', shapeData.strokeColor );
        }

        if ( shapeData.strokeWidth ) {
          shape.set( 'strokeWidth', shapeData.strokeWidth || ( shapeData.strokeColor ? 1 : 0 ) );
        }

        if ( shapeData.label ) {

          if ( !( shapeData.label instanceof Array ) ) {
            shapeData.label = [ shapeData.label ];
          }

          for ( var i = 0, l = shapeData.label.length; i < l; i++ ) {

            shape.set( 'labelPosition', shapeData.label[ i ].position, i );
            shape.set( 'labelColor', shapeData.label[ i ].color || 'black', i );
            shape.set( 'labelSize', shapeData.label[ i ].size, i );
            shape.set( 'labelAngle', shapeData.label[ i ].angle || 0, i );

            if ( shapeData.label[ i ].anchor ) {
              shape.set( 'labelAnchor', shapeData.label[ i ].anchor, i );
            }
          }

          shape.setLabelNumber( l );
        }

        /*switch(shape.type) {
					case 'rect':
					case 'rectangle':
						shape.set('width', shape.width);
						shape.set('height', shape.height);
					break;
				}*/
        self.shapes.push( shape );

        self.triggerEvent( 'onShapeMake', shape, shapeData );

        deferred.resolve( shape );

        if ( !mute ) {
          self.triggerEvent( 'onNewShape', shapeData );
        }

      }

      if ( shapeData.url ) {
        this.dynamicLoader.load( 'external', shapeData.url, callback );
      } else {
        this.dynamicLoader.load( 'shapes', 'graph.shape.' + shapeData.type, callback );
      }

      return deferred;
    },

    redrawShapes: function() {

      //this.graphingZone.removeChild(this.shapeZone);
      for ( var i = 0, l = this.shapes.length; i < l; i++ ) {
        this.shapes[ i ].redraw();
      }
      //this.graphingZone.insertBefore(this.shapeZone, this.axisGroup);
    },

    removeShapes: function() {
      for ( var i = 0, l = this.shapes.length; i < l; i++ ) {
        this.shapes[ i ].kill();
      }
      this.shapes = [];
    },

    _removeShape: function( shape ) {
      this.shapes.splice( this.shapes.indexOf( shape ), 1 );
    },

    _makeClosingLines: function() {

      this.closingLines = {};
      var els = [ 'top', 'bottom', 'left', 'right' ],
        i = 0,
        l = 4,
        line;
      for ( ; i < l; i++ ) {
        var line = document.createElementNS( this.ns, 'line' );
        line.setAttribute( 'stroke', 'black' );
        line.setAttribute( 'shape-rendering', 'crispEdges' );
        line.setAttribute( 'stroke-linecap', 'square' );
        line.setAttribute( 'display', 'none' );
        this.closingLines[ els[ i ] ] = line;
        this.graphingZone.appendChild( line );
      }
    },

    _seriesInit: function() {

      var self = this,
        series = this.options.series,
        nb = series.length;

      if ( nb == 0 ) {
        return self._seriesReady();
      }

      series.map( function( serie ) {

        self.dynamicLoader.load( 'serie', 'graph.serie.' + serie, function() {

          if ( ( --nb ) == 0 ) {

            self._seriesReady();
          }
        } );
      } )
    },

    _seriesReady: function() {

      this.seriesReady.resolve();
    },

    _pluginsExecute: function( funcName, args ) {

      //			Array.prototype.splice.apply(args, [0, 0, this]);

      for ( var i in this._plugins ) {

        if ( this._plugins[ i ] && this._plugins[ i ][ funcName ] ) {

          this._plugins[ i ][ funcName ].apply( this._plugins[ i ], args );

        }
      }
    },

    _pluginExecute: function( which, func, args ) {

      //Array.prototype.splice.apply( args, [ 0, 0, this ] );

      if ( this._plugins[ which ] && this._plugins[ which ][ func ] ) {

        this._plugins[ which ][ func ].apply( this._plugins[ which ], args );
      }
    },

    _pluginsInit: function() {

      var self = this,
        pluginsToLoad,
        nb;

      this._plugins = this._plugins || {};

      if ( Array.isArray( this.options.plugins ) ) {
        pluginsToLoad = this.options.plugins
      } else {
        pluginsToLoad = [];

        for ( var i in this.options.plugins ) {
          pluginsToLoad.push( i );
        }
      }

      if ( ( nb = pluginsToLoad.length ) == 0 ) {
        return self._pluginsReady();
      }

      this.pluginsToLoad = pluginsToLoad.length;

      this.dynamicLoader.load( 'plugin', pluginsToLoad, function( plugin, smth, filename ) {

        self._plugins[ filename ] = new plugin();
        self._plugins[ filename ].init( self, self.options.plugins[ filename ] || {}, filename );

        if ( ( --nb ) == 0 ) {

          self._pluginsReady();

        }

      } );
      //this._pluginsExecute('init', arguments);
    },

    getPlugin: function( pluginName ) {
      var self = this;
      return this.pluginsReady.then( function() {

        return self._plugins[ pluginName ] || false;
      } );
    },

    _pluginsReady: function() {
      this.pluginsReady.resolve();
    },

    triggerEvent: function() {
      var func = arguments[ 0 ],
        args = Array.prototype.splice.apply( arguments, [ 0, 1 ] );

      if ( typeof this.options[ func ] == "function" ) {
        return this.options[ func ].apply( this, arguments );
      }

      return;
    },

    selectShape: function( shape, mute ) {

      // Already selected. Returns false
      if ( this.selectedShape == shape ) {
        return false;
      }

      if ( this.selectedShape )  { // Only one selected shape at the time

        //console.log('Unselect shape');
        this.selectedShape.unselect();
      }

      if ( !mute ) {
        shape.select( true );
      }

      this.selectedShape = shape;
      this.triggerEvent( 'onShapeSelect', shape.data );
    },

    unselectShape: function() {

      if ( !this.selectedShape ) {
        return;
      }

      this.selectedShape.unselect();

      this.triggerEvent( 'onShapeUnselect', this.selectedShape.data );
      this.selectedShape = false;
    },

    makeLegend: function( options ) {
      this.legend = new GraphLegend( this, options );
      this.graphingZone.appendChild( this.legend.getDom() );
      this.legend.update();

      return this.legend;
    },

    updateLegend: function() {

      if ( !this.legend ) {
        return;
      }

      this.legend.update();
    },

    getPosition: function( value, relTo, xAxis, yAxis, onSerie ) {

      var parsed,
        pos = {
          x: false,
          y: false
        };

      if ( !xAxis ) {
        xAxis = this.getXAxis();
      }

      if ( !yAxis ) {
        yAxis = this.getYAxis();
      }

      if ( !value ) {
        return;
      }

      for ( var i in pos ) {

        var axis = i == 'x' ? xAxis : yAxis;

        if ( value[ i ] === undefined && ( ( value[ 'd' + i ] !== undefined && relTo === undefined ) || relTo === undefined ) ) {

          if ( i == 'x' ) {

            if ( value[ 'd' + i ] === undefined ) {
              continue;
            }

            pos[ i ] = relTo ? relTo[ i ] : axis.getPos( 0 );

          } else if ( value.x && onSerie ) {

            var val;

            if ( _parsePx( value.x ) !== false ) {
              console.warn( "You have defined x in px and not y. Makes no sense. Returning 0 for y" );
              pos[ i ] = 0;
            } else {

              var closest = onSerie.searchClosestValue( value.x );

              if ( !closest ) {
                console.warn( "Could not find y position. Returning 0 for y." );
                pos[ i ] = 0;
              } else {
                pos[ i ] = onSerie.getY( closest.yMin );
              }
            }
          }

        } else if ( value[ i ] !== undefined ) {

          pos[ i ] = this.getPx( value[ i ], axis );
        }

        if ( value[ 'd' + i ] !== undefined ) {

          var def = ( value[ i ] !== undefined || relTo == undefined || relTo[ i ] == undefined ) ? pos[ i ] : ( this._getPositionPx( relTo[ i ], true, axis ) || 0 );

          if ( i == 'y' && relTo && relTo.x ) {

            var closest = onSerie.searchClosestValue( relTo.x );
            if ( closest ) {
              def = onSerie.getY( closest.yMin );
            }
            //console.log( relTo.x, closest, onSerie.getY( closest.yMin ), def );
          }

          if ( ( parsed = _parsePx( value[ 'd' + i ] ) ) !== false ) { // dx in px => val + 10px

            pos[ i ] = def + parsed; // return integer (will be interpreted as px)

          } else if ( parsed = this._parsePercent( value[ 'd' + i ] ) ) {

            pos[ i ] = def + this._getPositionPx( parsed, true, axis ); // returns xx%

          } else if ( axis ) {

            pos[ i ] = def + axis.getRelPx( value[ 'd' + i ] ); // px + unittopx

          }
        }
      }

      return pos;
    },

    _getPositionPx: function( value, x, axis ) {

      var parsed;

      if ( ( parsed = _parsePx( value ) ) !== false ) {
        return parsed; // return integer (will be interpreted as px)
      }

      if ( ( parsed = this._parsePercent( value ) ) !== false ) {

        return parsed / 100 * ( x ? this.graph.getDrawingWidth() : this.graph.getDrawingHeight() );

      } else if ( axis ) {

        return axis.getPos( value );
      }
    },

    _parsePercent: function( percent ) {
      if ( percent && percent.indexOf && percent.indexOf( '%' ) > -1 ) {
        return percent;
      }
      return false;
    },

    deltaPosition: function( ref, delta, axis ) {

      var refPx, deltaPx;

      if ( ( refPx = _parsePx( ref ) ) !== false ) {

        if ( ( deltaPx = _parsePx( delta ) ) !== false ) {
          return ( refPx + deltaPx ) + "px";
        } else {
          return ( refPx + axis.getRelPx( delta ) ) + "px";
        }
      } else {

        ref = this.getValPosition( ref, axis );

        if ( ( deltaPx = _parsePx( delta ) ) !== false ) {
          return ( ref + axis.getRelVal( deltaPx ) );
        } else {
          return ( ref + delta );
        }
      }
    },

    getValPosition: function( rel, axis ) {

      if( rel == 'max' ) {
        return axis.getMaxValue();
      }

      if( rel == 'min' ) {
        return axis.getMinValue();
      }

      return rel;
    },

    getPx: function( value, axis, rel ) {

      var parsed;

      if ( ( parsed = _parsePx( value ) ) !== false ) {

        return parsed; // return integer (will be interpreted as px)

      } else if ( parsed = this._parsePercent( value ) ) {

        return parsed; // returns xx%

      } else if ( axis ) {

        if ( value == "min" ) {

          return axis.getMinPx();

        } else if ( value == "max" ) {

          return axis.getMaxPx();

        } else if ( rel ) {

          return axis.getRelPx( value );
        } else {

          return axis.getPos( value );
        }
      }
    },

    getPxRel: function( value, axis ) {

      return this.getPx( value, axis, true );
    },

    contextListen: function( target, menuElements, callback ) {

      var self = this;

      if ( this.options.onContextMenuListen ) {
        return this.options.onContextMenuListen( target, menuElements, callback );
      }

      if ( !this.context ) {

        this.dynamicLoader.load( 'util', './util/context', function( Context ) {

          var instContext = new Context();

          instContext.init( self._dom );
          instContext.listen( target, menuElements, callback );

          self.context = instContext;
        } );

      } else {
        this.context.listen( target, menuElements, callback );
      }

    },

    lockShapes: function() {
      this.shapesLocked = true;
    },

    unlockShapes: function() {
      //		console.log('unlock');
      this.shapesLocked = false;
    }
  }

  function makeSerie( graph, name, options, type, callback ) {

    return graph.dynamicLoader.load( 'serie', 'graph.serie.' + type, function( Serie ) {

      var serie = new Serie();
      serie.init( graph, name, options );
      graph.plotGroup.appendChild( serie.groupMain );
      callback( serie );
      return serie;

    } );
  };

  function _parsePx( px ) {
    if ( px && px.indexOf && px.indexOf( 'px' ) > -1 ) {
      return parseInt( px.replace( 'px', '' ) );
    }
    return false;
  };

  function refreshDrawingZone( graph, noX, noY ) {

    var i, j, l, xy, min, max;
    var axisvars = [ 'bottom', 'top', 'left', 'right' ],
      shift = [ 0, 0, 0, 0 ],
      axis;

    graph._painted = true;
    graph.refreshMinOrMax();

    // Apply to top and bottom
    graph._applyToAxes( function( axis ) {

      if ( axis.disabled ) {
        return;
      }

      var axisIndex = axisvars.indexOf( arguments[ 1 ] );
      axis.setShift( shift[ axisIndex ] + axis.getAxisPosition(), axis.getAxisPosition() );
      shift[ axisIndex ] += axis.getAxisPosition(); // Allow for the extra width/height of position shift

    }, false, true, false );

    // Applied to left and right
    graph._applyToAxes( function( axis ) {

      if ( axis.disabled ) {
        return;
      }

      axis.setMinPx( shift[ 1 ] );
      axis.setMaxPx( graph.getDrawingHeight( true ) - shift[ 0 ] );

      // First we need to draw it in order to determine the width to allocate
      // graph is done to accomodate 0 and 100000 without overlapping any element in the DOM (label, ...)

      var drawn = axis.draw() || 0,
        axisIndex = axisvars.indexOf( arguments[ 1 ] ),
        axisDim = axis.getAxisPosition();

      // Get axis position gives the extra shift that is common
      axis.setShift( shift[ axisIndex ] + axisDim + drawn, drawn + axisDim );
      shift[ axisIndex ] += drawn + axisDim;

      axis.drawSeries();

    }, false, false, true );

    // Apply to top and bottom
    graph._applyToAxes( function( axis ) {

      if ( axis.disabled ) {
        return;
      }

      axis.setMinPx( shift[ 2 ] );
      axis.setMaxPx( graph.getDrawingWidth( true ) - shift[ 3 ] );
      axis.draw();

      axis.drawSeries();

    }, false, true, false );

    // Apply to all axis
    /*		graph._applyToAxes(function(axis) {
			axis.drawSeries();
		}, false, true, true);
*/

    _closeLine( graph, 'right', graph.getDrawingWidth( true ), graph.getDrawingWidth( true ), shift[ 1 ], graph.getDrawingHeight( true ) - shift[ 0 ] );
    _closeLine( graph, 'left', 0, 0, shift[ 1 ], graph.getDrawingHeight( true ) - shift[ 0 ] );
    _closeLine( graph, 'top', shift[ 2 ], graph.getDrawingWidth( true ) - shift[ 3 ], 0, 0 );
    _closeLine( graph, 'bottom', shift[ 2 ], graph.getDrawingWidth( true ) - shift[ 3 ], graph.getDrawingHeight( true ) - shift[ 0 ], graph.getDrawingHeight( true ) - shift[ 0 ] );

    graph.clipRect.setAttribute( 'y', shift[ 1 ] );
    graph.clipRect.setAttribute( 'x', shift[ 2 ] );
    graph.clipRect.setAttribute( 'width', graph.getDrawingWidth() - shift[ 2 ] - shift[ 3 ] );
    graph.clipRect.setAttribute( 'height', graph.getDrawingHeight() - shift[ 1 ] - shift[ 0 ] );

    graph.rectEvent.setAttribute( 'x', shift[ 1 ] );
    graph.rectEvent.setAttribute( 'y', shift[ 2 ] );
    graph.rectEvent.setAttribute( 'width', graph.getDrawingWidth() - shift[ 2 ] - shift[ 3 ] );
    graph.rectEvent.setAttribute( 'height', graph.getDrawingHeight() - shift[ 1 ] - shift[ 0 ] );

    /*
		graph.shapeZoneRect.setAttribute('x', shift[1]);
		graph.shapeZoneRect.setAttribute('y', shift[2]);
		graph.shapeZoneRect.setAttribute('width', graph.getDrawingWidth() - shift[2] - shift[3]);
		graph.shapeZoneRect.setAttribute('height', graph.getDrawingHeight() - shift[1] - shift[0]);
*/
    graph.shift = shift;
    graph.redrawShapes(); // Not sure this should be automatic here. The user should be clever.
  }

  function _registerEvents( graph ) {
    var self = graph;

    graph._dom.addEventListener( 'keydown', function( e ) {

      e.preventDefault();
      e.stopPropagation();

      if ( e.keyCode == 8 && self.selectedShape ) {
        self.selectedShape.kill();
      }

    } );

    graph.dom.addEventListener( 'mousemove', function( e ) {
      e.preventDefault();
      var coords = self._getXY( e );
      _handleMouseMove( self, coords.x, coords.y, e );
    } );

    graph.dom.addEventListener( 'mouseleave', function( e ) {

      _handleMouseLeave( self );
    } );

    graph.dom.addEventListener( 'mousedown', function( e ) {

      self.focus();

      e.preventDefault();
      if ( e.which == 3 || e.ctrlKey ) {
        return;
      }

      var coords = self._getXY( e );
      _handleMouseDown( self, coords.x, coords.y, e );

    } );

    graph.dom.addEventListener( 'mouseup', function( e ) {

      e.preventDefault();
      var coords = self._getXY( e );
      _handleMouseUp( self, coords.x, coords.y, e );

    } );

    graph.dom.addEventListener( 'dblclick', function( e ) {
      e.preventDefault();

      if ( self.clickTimeout ) {
        window.clearTimeout( self.clickTimeout );
      }

      var coords = self._getXY( e );
      self.cancelClick = true;
      _handleDblClick( self, coords.x, coords.y, e );
    } );

    graph.dom.addEventListener( 'click', function( e ) {

      // Cancel right click or Command+Click
      if ( e.which == 3 || e.ctrlKey )
        return;
      e.preventDefault();
      var coords = self._getXY( e );
      if ( self.clickTimeout )
        window.clearTimeout( self.clickTimeout );

      // Only execute the action after 200ms
      self.clickTimeout = window.setTimeout( function() {
        _handleClick( self, coords.x, coords.y, e );
      }, 200 );
    } );

    graph.dom.addEventListener( 'mousewheel', function( e ) {
      e.preventDefault();
      e.stopPropagation();
      var deltaY = e.wheelDeltaY || e.wheelDelta || -e.deltaY;
      _handleMouseWheel( self, deltaY, e );

      return false;
    } );

    graph.rectEvent.addEventListener( 'wheel', function( e ) {
      e.stopPropagation();
      e.preventDefault();
      var deltaY = e.wheelDeltaY || e.wheelDelta || -e.deltaY;
      _handleMouseWheel( self, deltaY, e );

      return false;
    } );
  }

  function _handleMouseDown( graph, x, y, e ) {

    var self = graph,
      $target = $( e.target ),
      shift = e.shiftKey,
      ctrl = e.ctrlKey,
      keyComb = graph.options.pluginAction,
      i;

    graph.unselectShape();

    if ( graph.forcedPlugin ) {

      graph.activePlugin = graph.forcedPlugin;
      graph._pluginExecute( graph.activePlugin, 'onMouseDown', [ graph, x, y, e ] );
      return;
    }

    for ( i in keyComb ) {

      if ( graph.isPluginAllowed( e, keyComb[ i ] ) ) {

        graph.activePlugin = i; // Lease the mouse action to the current action
        graph._pluginExecute( i, 'onMouseDown', [ graph, x, y, e ] );
        break;
      }
    }
  }

  function _handleMouseMove( graph, x, y, e ) {

    if ( graph.bypassHandleMouse ) {
      graph.bypassHandleMouse.handleMouseMove( e );
      return;
    }

    if ( graph._pluginExecute( graph.activePlugin, 'onMouseMove', [ graph, x, y, e ] ) ) {
      return;
    };

    //			return;

    graph._applyToAxes( 'handleMouseMove', [ x - graph.options.paddingLeft, e ], true, false );
    graph._applyToAxes( 'handleMouseMove', [ y - graph.options.paddingTop, e ], false, true );

    if ( !graph.activePlugin ) {
      var results = {};

      if ( graph.options.onMouseMoveData ) {

        for ( var i = 0; i < graph.series.length; i++ ) {

          results[ graph.series[ i ].getName() ] = graph.series[ i ].handleMouseMove( false, true );
        }

        graph.options.onMouseMoveData.call( graph, e, results );
      }
      return;
    }
  }

  function _handleDblClick( graph, x, y, e ) {
    //	var _x = x - graph.options.paddingLeft;
    //	var _y = y - graph.options.paddingTop;
    var pref = graph.options.dblclick;

    if ( !pref ||  !pref.type ) {
      return;
    }

    switch ( pref.type ) {

      case 'plugin':

        var plugin;

        if ( ( plugin = graph._plugins[ pref.plugin ] ) ) {

          plugin.onDblClick( graph, x, y, pref.options, e );
        }

        break;
    }
  }

  function _handleMouseUp( graph, x, y, e ) {

    if ( graph.bypassHandleMouse ) {
      graph.bypassHandleMouse.handleMouseUp( e );
      graph.activePlugin = false;
      return;
    }

    graph._pluginExecute( graph.activePlugin, 'onMouseUp', [ graph, x, y, e ] );
    graph.activePlugin = false;

  }

  function _handleClick( graph, x, y, e ) {

    if ( !graph.options.addLabelOnClick ) {
      return;
    }

    if ( graph.currentAction !== false ) {
      return;
    }

    for ( var i = 0, l = graph.series.length; i < l; i++ ) {
      graph.series[ i ].addLabelX( graph.series[ i ].getXAxis().getVal( x - graph.getPaddingLeft() ) );
    }
  }

  function _getAxis( graph, num, options, inst, pos ) {

    num = num || 0;

    if ( typeof num == "object" ) {
      options = num;
      num = 0;
    }

    return graph.axis[ pos ][ num ] = graph.axis[ pos ][ num ] || new inst( graph, pos, options );
  }

  function _closeLine( graph, mode, x1, x2, y1, y2 ) {

    if ( graph.options.close === false ) {
      return;
    }

    var l = 0;

    graph.axis[ mode ].map( function( g ) {

      if ( g.isDisplayed() ) {
        l++;
      }
    } );

    if ( ( graph.options.close === true || graph.options.close[ mode ] ) && l == 0 ) {

      graph.closingLines[ mode ].setAttribute( 'display', 'block' );
      graph.closingLines[ mode ].setAttribute( 'x1', x1 );
      graph.closingLines[ mode ].setAttribute( 'x2', x2 );
      graph.closingLines[ mode ].setAttribute( 'y1', y1 );
      graph.closingLines[ mode ].setAttribute( 'y2', y2 );

    } else {

      graph.closingLines[ mode ].setAttribute( 'display', 'none' );

    }
  }

  function _handleMouseWheel( graph, delta, e ) {

    e.preventDefault();
    e.stopPropagation();

    if ( !graph.options.wheel.type ) {
      return;
    }

    switch ( graph.options.wheel.type ) {

      case 'plugin':

        var plugin;

        if ( plugin = graph._plugins[ graph.options.wheel.plugin ] ) {

          plugin.onMouseWheel( delta, e );
        }

        break;

      case 'toSeries':

        for ( var i = 0, l = graph.series.length; i < l; i++ ) {
          graph.series[ i ].onMouseWheel( delta, e );
        }

        break;

    }

    // Redraw not obvious at all !!
/*
    graph.redraw();
    graph.drawSeries( true );

    */
  }

  function _handleMouseLeave( graph ) {

    if ( graph.options.handleMouseLeave ) {
      graph.options.handleMouseLeave.call( this );

    }

  }

  return Graph;
 } ) ( build["./jquery"],build["./graph.axis.x"],build["./graph.axis.y"],build["./graph.xaxis.time"],build["./graph.legend"],build["./dynamicdepencies"] );


// Build: End source file (graph.core) 



;
/* 
 * Build: new source file 
 * File name : graph._serie
 * File path : /Users/normanpellet/Documents/Web/graph/src/graph._serie.js
 */

build['./graph._serie'] = ( function( ) { 

  

  var GraphSerieNonInstanciable = function() {
    throw "This serie is not instanciable";
  }

  GraphSerieNonInstanciable.prototype = {

    setAdditionalData: function( data ) {
      this.additionalData = data;
      return this;
    },

    getAdditionalData: function() {
      return this.additionalData;
    },

    /**
     *	Possible data types
     *	[100, 0.145, 101, 0.152, 102, 0.153]
     *	[[100, 0.145, 101, 0.152], [104, 0.175, 106, 0.188]]
     *	[[100, 0.145], [101, 0.152], [102, 0.153], [...]]
     *	[{ x: 100, dx: 1, y: [0.145, 0.152, 0.153]}]
     *
     *	Converts every data type to a 1D array
     */

    setData: function( data, arg, type ) {

      var z = 0,
        x,
        dx,
        arg = arg || "2D",
        type = type || 'float',
        arr,
        total = 0,
        continuous;

      this.minX = +Infinity;
      this.minY = +Infinity;
      this.maxX = -Infinity;
      this.maxY = -Infinity;

      if ( !data instanceof Array ) {
        return;
      }

      // Single object
      var datas = [];
      if ( !( data instanceof Array ) && typeof data == 'object' ) {
        data = [ data ];
      } else if ( data instanceof Array && !( data[ 0 ] instanceof Array ) ) { // [100, 103, 102, 2143, ...]
        data = [ data ];
        arg = "1D";
      }

      var _2d = ( arg == "2D" );

      // [[100, 0.145], [101, 0.152], [102, 0.153], [...]] ==> [[[100, 0.145], [101, 0.152], [102, 0.153], [...]]]
      if ( data[ 0 ] instanceof Array && arg == "2D" && !( data[ 0 ][ 0 ] instanceof Array ) ) {
        data = [ data ];
      }

      if ( data[ 0 ] instanceof Array ) {
        for ( var i = 0, k = data.length; i < k; i++ ) {

          arr = this._addData( type, _2d ? data[ i ].length * 2 : data[ i ].length );
          datas.push( arr );
          z = 0;

          for ( var j = 0, l = data[ i ].length; j < l; j++ ) {

            if ( _2d ) {
              arr[ z ] = ( data[ i ][ j ][ 0 ] );
              this._checkX( arr[ z ] );
              z++;
              arr[ z ] = ( data[ i ][ j ][ 1 ] );
              this._checkY( arr[ z ] );
              z++;
              total++;

            } else { // 1D Array
              arr[ z ] = data[ i ][ j ];
              this[ j % 2 == 0 ? '_checkX' : '_checkY' ]( arr[ z ] );

              z++;
              total += j % 2 ? 1 : 0;

            }
          }
        }

      } else if ( typeof data[ 0 ] == 'object' ) {

        this.mode = 'x_equally_separated';

        var number = 0,
          numbers = [],
          datas = [],
          k = 0,
          o;
        for ( var i = 0, l = data.length; i < l; i++ ) { // Several piece of data together
          number += data[ i ].y.length;
          continuous = ( i != 0 ) && ( !data[ i + 1 ] || data[ i ].x + data[ i ].dx * ( data[ i ].y.length ) == data[ i + 1 ].x );
          if ( !continuous ) {
            datas.push( this._addData( type, number ) );
            numbers.push( number );
            number = 0;
          }
        }

        this.xData = [];

        number = 0, k = 0, z = 0;

        for ( var i = 0, l = data.length; i < l; i++ ) {
          x = data[ i ].x, dx = data[ i ].dx;

          this.xData.push( {
            x: x,
            dx: dx
          } );

          o = data[ i ].y.length;
          this._checkX( x );
          this._checkX( x + dx * o );

          for ( var j = 0; j < o; j++ ) {
            /*datas[k][z] = (x + j * dx);
						this._checkX(datas[k][z]);
						z++;*/
            // 30 june 2014. To save memory I suggest that we do not add this stupid data.

            datas[ k ][ z ] = ( data[ i ].y[ j ] );
            this._checkY( datas[ k ][ z ] );
            z++;
            total++;

          }
          number += data[ i ].y.length;

          if ( numbers[ k ] == number ) {
            k++;
            number = 0;
            z = 0;
          }
        }
      }

      // Determination of slots for low res spectrum
      var w = ( this.maxX - this.minX ) / this.graph.getDrawingWidth(),
        ws = [];

      var min = this.graph.getDrawingWidth() * 4;
      var max = total / 4;

      var min = this.graph.getDrawingWidth();
      var max = total;

      this.data = datas;

      if ( min > 0 ) {

        while ( min < max ) {
          ws.push( min );
          min *= 4;
        }

        this.slots = ws;

        if ( this.options.useSlots ) {
          this.calculateSlots();
        }
      }

      if ( this.isFlipped() ) {

        var maxX = this.maxX;
        var maxY = this.maxY;
        var minX = this.minX;
        var minY = this.minY;

        this.maxX = maxY;
        this.maxY = maxX;

        this.minX = minY;
        this.minY = minX;
      }

      this.graph._updateAxes();

      return this;
    },

    _addData: function( type, howmany ) {

      switch ( type ) {
        case 'int':
          var size = howmany * 4; // 4 byte per number (32 bits)
          break;
        case 'float':
          var size = howmany * 8; // 4 byte per number (64 bits)
          break;
      }

      var arr = new ArrayBuffer( size );

      switch ( type ) {
        case 'int':
          return new Int32Array( arr );
          break;

        default:
        case 'float':
          return new Float64Array( arr );
          break;
      }
    },

    kill: function( noRedraw ) {

      this.graph.plotGroup.removeChild( this.groupMain );

      if ( this.picks && this.picks.length ) {
        for ( var i = 0, l = this.picks.length; i < l; i++ ) {
          this.picks[ i ].kill();
        }
      }

      this.graph.series.splice( this.graph.series.indexOf( this ), 1 );

      if ( !noRedraw )  {
        this.graph.redraw();
      }
    },

    isMinOrMax: function( bool, xy, minmax ) {

      if ( bool == undefined ) {
        return this._isMinOrMax.x.min || this._isMinOrMax.x.max || this._isMinOrMax.y.min || this._isMinOrMax.y.max;
      }

      if ( minmax == undefined && xy != undefined ) {
        this._isMinOrMax[ xy ].min = bool;
        this._isMinOrMax[ xy ].max = bool;
        return;
      }

      if ( xy != undefined && minmax != undefined ) {
        this._isMinOrMax[ xy ][ minmax ] = bool;
      }
    },

    hide: function() {
      this.hidden = true;
      this.groupMain.setAttribute( 'display', 'none' );

      this.getSymbolForLegend().setAttribute( 'opacity', 0.5 );
      this.getTextForLegend().setAttribute( 'opacity', 0.5 );

      this.hideImpl();
    },

    show: function() {
      this.hidden = false;
      this.groupMain.setAttribute( 'display', 'block' );

      this.getSymbolForLegend().setAttribute( 'opacity', 1 );
      this.getTextForLegend().setAttribute( 'opacity', 1 );

      this.showImpl();

      this.draw();
    },

    hideImpl: function() {},
    showImpl: function() {},

    toggleShow: function() {
      if ( !this.shown ) {
        this.show();
        return;
      }

      this.hide();
    },

    isShown: function() {
      return !this.hidden;
    },

    getX: function( val ) {
      return Math.round( this.getXAxis().getPx( val ) * 5 ) / 5;
    },

    getY: function( val ) {
      return Math.round( this.getYAxis().getPx( val ) * 5 ) / 5;
    },

    isSelected: function() {
      return this.selected;
    },

    _checkX: function( val ) {
      this.minX = Math.min( this.minX, val );
      this.maxX = Math.max( this.maxX, val );
    },

    _checkY: function( val ) {
      this.minY = Math.min( this.minY, val );
      this.maxY = Math.max( this.maxY, val );
    },

    getName: function() {
      return this.name;
    },

    /* AXIS */

    autoAxis: function() {
      this.setXAxis( !this.isFlipped() ? this.graph.getXAxis() : this.graph.getYAxis() );
      this.setYAxis( !this.isFlipped() ? this.graph.getYAxis() : this.graph.getXAxis() );

      this.graph._updateAxes();

      return this;
    },

    setXAxis: function( axis ) {
      if ( typeof axis == "number" )
        this.xaxis = this.isFlipped() ? this.graph.getYAxis( axis ) : this.graph.getXAxis( axis );
      else
        this.xaxis = axis;

      return this;
    },

    setYAxis: function( axis ) {
      if ( typeof axis == "number" )
        this.xaxis = this.isFlipped() ? this.graph.getXAxis( axis ) : this.graph.getYAxis( axis );
      else
        this.yaxis = axis;

      return this;
    },

    getXAxis: function() {
      return this.xaxis;
    },

    getYAxis: function() {
      return this.yaxis;
    },

    setAxes: function() {

      for ( var i = 0; i < 2; i++ ) {

        if ( arguments[ i ] ) {
          this[ ( arguments[ i ].isXY() == 'x' ? 'setXAxis' : 'setYAxis' ) ]( arguments[ i ] );
        }
      }

      return this;
    },

    /* */

    /* DATA MIN MAX */

    getMinX: function() {
      return this.minX;
    },

    getMaxX: function() {
      return this.maxX;
    },

    getMinY: function() {
      return this.minY;
    },

    getMaxY: function() {
      return this.maxY;
    },

    getSymbolForLegend: function() {

      if ( !this.lineForLegend ) {

        var line = document.createElementNS( this.graph.ns, 'line' );
        this.applyLineStyle( line );

        line.setAttribute( 'x1', 5 );
        line.setAttribute( 'x2', 25 );
        line.setAttribute( 'y1', 0 );
        line.setAttribute( 'y2', 0 );

        line.setAttribute( 'cursor', 'pointer' );

        this.lineForLegend = line;
      }

      return this.lineForLegend;

    },

    getTextForLegend: function() {

      if ( !this.textForLegend ) {

        var text = document.createElementNS( this.graph.ns, 'text' );
        text.setAttribute( 'transform', 'translate(35, 3)' );
        text.setAttribute( 'cursor', 'pointer' );
        text.textContent = this.getLabel();

        this.textForLegend = text;
      }

      return this.textForLegend;
    },

    setLegendSymbolStyle: function() {
      this.applyLineStyle( this.getSymbolForLegend() );
    },

    getIndex: function() {
      return this.graph.series.indexOf( this );
    },
    
    getLabel: function() {
      return this.options.label || this.name;
    },

    setLabel: function( label ) {
      this.options.label = label;
      return this;
    },

    /* FLIP */

    setFlip: function( bol ) {
      this.options.flip = bol;
    },

    getFlip: function() {
      return this.options.flip;
    },

    isFlipped: function() {
      return this.options.flip;
    },

    isXMonotoneous: function() {
      return this.xmonotoneous ||  false;
    }

  };

  return GraphSerieNonInstanciable;
 } ) (  );


// Build: End source file (graph._serie) 



;
/* 
 * Build: new source file 
 * File name : plugins/graph.plugin.drag
 * File path : /Users/normanpellet/Documents/Web/graph/src/plugins/graph.plugin.drag.js
 */

build['./plugins/graph.plugin.drag'] = ( function( ) { 

  var plugin = function() {};

  plugin.prototype = {

    init: function() {},

    onMouseDown: function( graph, x, y, e, target ) {
      this._draggingX = x;
      this._draggingY = y;

      return true;
    },

    onMouseMove: function( graph, x, y, e, target ) {
      var deltaX = x - this._draggingX;
      var deltaY = y - this._draggingY;

      graph._applyToAxes( function( axis ) {
        axis.setCurrentMin( axis.getVal( axis.getMinPx() - deltaX ) );
        axis.setCurrentMax( axis.getVal( axis.getMaxPx() - deltaX ) );
      }, false, true, false );

      graph._applyToAxes( function( axis ) {
        axis.setCurrentMin( axis.getVal( axis.getMinPx() - deltaY ) );
        axis.setCurrentMax( axis.getVal( axis.getMaxPx() - deltaY ) );
      }, false, false, true );

      this._draggingX = x;
      this._draggingY = y;

      graph.redraw( true );
      graph.drawSeries();
    }
  }

  return plugin;
 } ) (  );


// Build: End source file (plugins/graph.plugin.drag) 



;
/* 
 * Build: new source file 
 * File name : plugins/graph.plugin.linking
 * File path : /Users/normanpellet/Documents/Web/graph/src/plugins/graph.plugin.linking.js
 */

build['./plugins/graph.plugin.linking'] = ( function( ) { 

  var plugin = function() {};

  plugin.prototype = {

    init: function( graph, options, plugin ) {

      this.options = options;
      var self = this;
      this.graph = graph;
      this.plugin = plugin;

      var funcs = {

        /* Linking shapes */

        linkA: function( shapeA, line ) {
          this.linking.current.a = shapeA;
          this.linking.current.line = line;
        },

        linkB: function( shapeB ) {
          this.linking.current.b = shapeB;
        },

        getLinkingA: function() {
          return this.linking.current.a;
        },

        getLinkingB: function() {
          return this.linking.current.b;
        },

        isLinking: function( set ) {
          return !!this.linking.current.a;
        },

        newLinkingLine: function() {
          var line = document.createElementNS( this.ns, 'line' );
          line.setAttribute( 'class', 'graph-linkingline' );
          this.shapeZone.insertBefore( line, this.shapeZone.firstChild );
          return line;
        },

        getLinkingLine: function( add ) {
          return this.linking.current.line;
        },

        endLinking: function() {

          if ( ( this.linking.current.a == this.linking.current.b && this.linking.current.a ) || ( !this.linking.current.b && this.linking.current.a ) ) {

            this.shapeZone.removeChild( this.linking.current.line );
            this.linking.current = {};

            return;
          }

          if ( this.linking.current.line ) {

            this.linking.current.line.style.display = "none";
            this.linking.links.push( this.linking.current );
            this.linking.current = {};
          }

          return this.linking.links[ this.linking.links.length - 1 ];
        },

        linkingReveal: function() {

          for ( var i = 0, l = this.linking.links.length; i < l; i++ ) {

            this.linking.links[ i ].line.style.display = "block";
          }
        },

        linkingHide: function() {

          for ( var i = 0, l = this.linking.links.length; i < l; i++ ) {

            this.linking.links[ i ].line.style.display = "none";
          }
        }

      };

      for ( var i in funcs ) {
        graph[ i ] = funcs[ i ];
      }

      function linkingStart( shape, e, clicked ) {

        self.islinking = true;
        var linking = shape.graph.isLinking();

        if ( linking ) {
          return;
        }

        var line = shape.graph.newLinkingLine();
        var coords = shape.getLinkingCoords();

        line.setAttribute( 'x1', coords.x );
        line.setAttribute( 'y1', coords.y );
        line.setAttribute( 'x2', coords.x );
        line.setAttribute( 'y2', coords.y );

        shape.graph.linkA( shape, line );
      }

      function linkingMove( shape, e ) {

        var linking = shape.graph.isLinking();

        if ( !linking ) {
          return;
        }

        if ( shape.graph.getLinkingB() ) { // Hover something else
          return;
        }

        var line = shape.graph.getLinkingLine();
        var coords = shape.graph._getXY( e );

        line.setAttribute( 'x2', coords.x - shape.graph.getPaddingLeft() );
        line.setAttribute( 'y2', coords.y - shape.graph.getPaddingTop() );
      }

      function linkingOn( shape, e ) {

        var linking = shape.graph.isLinking();
        if ( !linking ) {
          return;
        }

        var linkingA = shape.graph.getLinkingA();

        if ( linkingA == this ) {
          return;
        }

        shape.graph.linkB( shape ); // Update B element

        var coords = shape.getLinkingCoords();

        var line = shape.graph.getLinkingLine();
        line.setAttribute( 'x2', coords.x );
        line.setAttribute( 'y2', coords.y );
      }

      function linkingOut( shape, e ) {

        var linking = shape.graph.isLinking();
        if ( !linking ) {
          return;
        }
        shape.graph.linkB( undefined ); // Remove B element
      }

      function linkingFinalize( shape ) {

        return shape.graph.endLinking();
      }

      graph.linking = {
        current: {},
        links: []
      };
      /*
			graph._dom.addEventListener('keydown', function( e ) {

				e.preventDefault();
				e.stopPropagation();

				if( ( e.keyCode == 16 && e.ctrlKey ) || ( e.keyCode == 17 && e.shiftKey )) {
					graph.linkingReveal();
				}
			});*/

      /*			graph._dom.addEventListener( 'keyup', function( e ) {

				e.preventDefault();
				e.stopPropagation();
				graph.linkingHide();
			});
*/
      graph.shapeHandlers.mouseDown.push( function( e ) {

        if ( self.graph.isPluginAllowed( e, self.plugin ) ) {

          this.moving = false;
          this.handleSelected = false;

          linkingStart( this, e, true );
        }
      } );

      graph.shapeHandlers.mouseUp.push( function( e ) {

        var link;
        if ( ( link = linkingFinalize( this ) ) ) {

          link.a.linking = link.a.linking ||  0;
          link.a.linking++;

          link.b.linking = link.b.linking ||  0;
          link.b.linking++;

          link.a.addClass( 'linking' );
          link.b.addClass( 'linking' );

          link.a.addClass( 'linking' + link.a.linking );
          link.a.removeClass( 'linking' + ( link.a.linking - 1 ) );

          link.b.addClass( 'linking' + link.a.linking );
          link.b.removeClass( 'linking' + ( link.a.linking - 1 ) );

          if ( self.options.onLinkCreate ) {
            self.options.onLinkCreate( link.a, link.b );
          }
        }
      } );

      graph.shapeHandlers.mouseMove.push( function( e ) {

        linkingMove( this, e, true );
      } );

      graph.shapeHandlers.mouseOver.push( function( e ) {

        linkingOn( this, e, true );
      } );

      graph.shapeHandlers.mouseOut.push( function( e ) {

        linkingOut( this, e, true );
      } );
    }
  };

  return plugin;
 } ) (  );


// Build: End source file (plugins/graph.plugin.linking) 



;
/* 
 * Build: new source file 
 * File name : plugins/graph.plugin.nmrpeakpicking
 * File path : /Users/normanpellet/Documents/Web/graph/src/plugins/graph.plugin.nmrpeakpicking.js
 */

build['./plugins/graph.plugin.nmrpeakpicking'] = ( function( ) { 

  var plugin = function() {};

  plugin.prototype = {

    init: function( graph ) {
      this.graph = graph;
    },

    process: function() {

      //		console.log( arguments );

      var series = arguments;
      //		console.log( series[ 0 ].data );
      //		console.log( series[ 0 ].getAdditionalData() );

      this.graph.newShape( {

        type: 'rect',
        pos: {
          x: 0,
          y: 1000
        },

        pos2: {
          x: 10,
          y: 100000000
        },

        fillColor: [ 100, 100, 100, 0.3 ],
        strokeColor: [ 100, 100, 100, 0.9 ],
        strokeWidth: 1

      } ).then( function( shape ) {

        shape.draw();
        shape.redraw();
      } )

    }
  }

  return plugin;
 } ) (  );


// Build: End source file (plugins/graph.plugin.nmrpeakpicking) 



;
/* 
 * Build: new source file 
 * File name : plugins/graph.plugin.range
 * File path : /Users/normanpellet/Documents/Web/graph/src/plugins/graph.plugin.range.js
 */

build['./plugins/graph.plugin.range'] = ( function( ) { 

  var plugin = function() {};

  plugin.prototype = {

    init: function() {},

    onMouseDown: function( graph, x, y, e, target ) {
      var self = graph;
      this.count = this.count || 0;
      if ( this.count == graph.options.rangeLimitX )
        return;
      x -= graph.getPaddingLeft(), xVal = graph.getXAxis().getVal( x );

      var shape = graph.newShape( {
        type: 'rangeX',
        pos: {
          x: xVal,
          y: 0
        },
        pos2: {
          x: xVal,
          y: 0
        }
      }, {
        onChange: function( newData ) {
          self.triggerEvent( 'onAnnotationChange', newData );
        }
      }, true );

      if ( require ) {
        require( [ 'src/util/context' ], function( Context ) {
          Context.listen( shape._dom, [
            [ '<li><a><span class="ui-icon ui-icon-cross"></span> Remove range zone</a></li>',
              function( e ) {
                shape.kill();
              }
            ]
          ] );
        } );
      }

      var color = Util.getNextColorRGB( this.count, graph.options.rangeLimitX );

      shape.set( 'fillColor', 'rgba(' + color + ', 0.3)' );
      shape.set( 'strokeColor', 'rgba(' + color + ', 0.9)' );
      this.count++;
      shape.handleMouseDown( e, true );
      shape.draw();
    }
  }

  return plugin;
 } ) (  );


// Build: End source file (plugins/graph.plugin.range) 



;
/* 
 * Build: new source file 
 * File name : plugins/graph.plugin.shape
 * File path : /Users/normanpellet/Documents/Web/graph/src/plugins/graph.plugin.shape.js
 */

build['./plugins/graph.plugin.shape'] = ( function( ) { 

  

  var plugin = function() {};

  plugin.prototype = {

    init: function( graph, options ) {

      this.options = options;
      this.graph = graph;
      this.shapeType = options.type;

    },

    setShape: function( shapeType ) {
      this.shapeInfo.shapeType = shapeType;
    },

    onMouseDown: function( graph, x, y, e, target ) {

      if ( !this.shapeType && !this.options.url ) {
        return;
      }

      var self = this,
        selfPlugin = this;

      var xVal, yVal;

      this.count = this.count || 0;

      x -= graph.getPaddingLeft(),
      y -= graph.getPaddingTop(),

      xVal = graph.getXAxis().getVal( x );
      yVal = graph.getYAxis().getVal( y );

      var shapeInfo = {

        pos: {
          x: xVal,
          y: yVal
        },

        pos2: {
          x: xVal,
          y: yVal
        },

        onChange: function( newData ) {
          graph.triggerEvent( 'onAnnotationChange', newData );
        }
      };

      var shape = graph.newShape( $.extend( shapeInfo, this.options ), {}, false );

      if( shape ) {

          shape.then( function( shape ) {

            if ( !shape ) {
              return;
            }

            self.currentShape = shape;
            self.currentShapeEvent = e;

          } );
      }

    },

    onMouseMove: function( graph, x, y, e ) {

      var self = this;

      if ( self.currentShape ) {

        self.count++;

        var shape = self.currentShape;
        self.currentShape = false;

        

        if( graph.selectedSerie ) {
          shape.setSerie( graph.selectedSerie );
        }

        shape.created();
        
        if ( shape.options && shape.options.onCreate ) {
          shape.options.onCreate.call( shape );
        }
        shape.draw();
        shape.select();

        shape.handleMouseDown( self.currentShapeEvent, true );
        shape.handleMouseMove( e, true );
      }
    },

    onMouseUp: function() {
      var self = this;
      if ( self.currentShape ) {
        self.currentShape.kill();
        self.currentShape = false;
      }
    }

  }

  return plugin;

 } ) (  );


// Build: End source file (plugins/graph.plugin.shape) 



;
/* 
 * Build: new source file 
 * File name : plugins/graph.plugin.zoom
 * File path : /Users/normanpellet/Documents/Web/graph/src/plugins/graph.plugin.zoom.js
 */

build['./plugins/graph.plugin.zoom'] = ( function( ) { 

  var plugin = function() {};

  plugin.prototype = {

    init: function( graph, options ) {

      this._zoomingGroup = document.createElementNS( graph.ns, 'g' );
      this._zoomingSquare = document.createElementNS( graph.ns, 'rect' );
      this._zoomingSquare.setAttribute( 'display', 'none' );

      graph.setAttributeTo( this._zoomingSquare, {
        'display': 'none',
        'fill': 'rgba(171,12,12,0.2)',
        'stroke': 'rgba(171,12,12,1)',
        'shape-rendering': 'crispEdges',
        'x': 0,
        'y': 0,
        'height': 0,
        'width': 0
      } );

      this.options = options;
      this.graph = graph;
      graph.dom.appendChild( this._zoomingGroup );
      this._zoomingGroup.appendChild( this._zoomingSquare );
    },

    onMouseDown: function( graph, x, y, e, mute ) {

      var zoomMode = this.options.zoomMode;

      if ( !zoomMode ) {
        return;
      }

      this._zoomingMode = zoomMode;

      if ( x === undefined ) {
        this._backedUpZoomMode = this._zoomingMode;
        this._zoomingMode = 'y';
        x = 0;
      }

      if ( y === undefined ) {
        this._backedUpZoomMode = this._zoomingMode;
        this._zoomingMode = 'x';
        y = 0;
      }

      this._zoomingXStart = x;
      this._zoomingYStart = y;
      this.x1 = x - graph.getPaddingLeft();
      this.y1 = y - graph.getPaddingTop();

      this._zoomingSquare.setAttribute( 'width', 0 );
      this._zoomingSquare.setAttribute( 'height', 0 );
      this._zoomingSquare.setAttribute( 'display', 'block' );

      switch ( this._zoomingMode ) {

        case 'x':
          this._zoomingSquare.setAttribute( 'y', graph.options.paddingTop );
          this._zoomingSquare.setAttribute( 'height', graph.getDrawingHeight() - graph.shift[ 0 ] );
          break;

        case 'y':
          this._zoomingSquare.setAttribute( 'x', graph.options.paddingLeft /* + this.shift[1]*/ );
          this._zoomingSquare.setAttribute( 'width', graph.getDrawingWidth() /* - this.shift[1] - this.shift[2]*/ );
          break;

      }

      if ( this.options.onZoomStart && !mute ) {
        this.options.onZoomStart( graph, x, y, e, mute );
      }
    },

    onMouseMove: function( graph, x, y, e, mute ) {

      //	this._zoomingSquare.setAttribute('display', 'none');

      //	this._zoomingSquare.setAttribute('transform', 'translate(' + Math.random() + ', ' + Math.random() + ') scale(10, 10)');

      switch ( this._zoomingMode ) {

        case 'xy':
          this._zoomingSquare.setAttribute( 'x', Math.min( this._zoomingXStart, x ) );
          this._zoomingSquare.setAttribute( 'y', Math.min( this._zoomingYStart, y ) );
          this._zoomingSquare.setAttribute( 'width', Math.abs( this._zoomingXStart - x ) );
          this._zoomingSquare.setAttribute( 'height', Math.abs( this._zoomingYStart - y ) );

          break;

        case 'x':
          this._zoomingSquare.setAttribute( 'x', Math.min( this._zoomingXStart, x ) );
          this._zoomingSquare.setAttribute( 'width', Math.abs( this._zoomingXStart - x ) );

          break;

        case 'y':
          this._zoomingSquare.setAttribute( 'y', Math.min( this._zoomingYStart, y ) );
          this._zoomingSquare.setAttribute( 'height', Math.abs( this._zoomingYStart - y ) );
          break;
      }

      if ( this.options.onZoomMove && !mute ) {

        this.options.onZoomMove( graph, x, y, e, mute );
      }
      //		this._zoomingSquare.setAttribute('display', 'block');

    },

    onMouseUp: function( graph, x, y, e, mute ) {

      this._zoomingSquare.setAttribute( 'display', 'none' );
      var _x = x - graph.options.paddingLeft;
      var _y = y - graph.options.paddingTop;

      if ( ( x - this._zoomingXStart == 0 && this._zoomingMode != 'y' ) || ( y - this._zoomingYStart == 0 && this._zoomingMode != 'x' ) ) {
        return;
      }

      switch ( this._zoomingMode ) {
        case 'x':
          graph._applyToAxes( '_doZoom', [ _x, this.x1 ], true, false );
          break;
        case 'y':
          graph._applyToAxes( '_doZoom', [ _y, this.y1 ], false, true );
          break;
        case 'xy':
          graph._applyToAxes( '_doZoom', [ _x, this.x1 ], true, false );
          graph._applyToAxes( '_doZoom', [ _y, this.y1 ], false, true );
          break;
      }

      graph.redraw( true );
      graph.drawSeries();

      if ( this.options.onZoomEnd && !mute ) {
        this.options.onZoomEnd( graph, _x, _y, e, mute, this.x1, this.y1 );
      }

      if ( this._backedUpZoomMode ) {
        this._zoomingMode = this._backedUpZoomMode;
      }
    },

    onMouseWheel: function( delta, e ) {

      var serie;
      if ( ( serie = this.graph.getSelectedSerie() ) ) {

        serie.getYAxis().handleMouseWheel( delta, e );
        return;
      }

      this.graph._applyToAxes( 'handleMouseWheel', [ delta, e ], false, true );
      this.graph.drawSeries();
    },

    onDblClick: function( graph, x, y, pref, e, mute ) {

      var xAxis = this.graph.getXAxis(),
        yAxis = this.graph.getYAxis();

      if ( pref.mode == 'xtotal' ) {

        this.graph._applyToAxes( "setMinMaxToFitSeries", null, true, false );
        this.graph.drawSeries();

      } else if ( pref.mode == 'ytotal' ) {

        this.graph._applyToAxes( "setMinMaxToFitSeries", null, false, true );
        this.graph.drawSeries();

      } else if ( pref.mode == 'total' ) {

        this.graph.autoscaleAxes();
        this.graph.drawSeries();

        if ( yAxis.options.onZoom ) {
          yAxis.options.onZoom( yAxis.getMinValue(), yAxis.getMaxValue() );
        }

        if ( xAxis.options.onZoom ) {
          xAxis.options.onZoom( xAxis.getMinValue(), xAxis.getMaxValue() );
        }

      } else {

        x -= this.graph.options.paddingLeft;
        y -= this.graph.options.paddingTop;

        var
          xMin = xAxis.getActualMin(),
          xMax = xAxis.getActualMax(),
          xActual = xAxis.getVal( x ),
          diffX = xMax - xMin,

          yMin = yAxis.getActualMin(),
          yMax = yAxis.getActualMax(),
          yActual = yAxis.getVal( y ),
          diffY = yMax - yMin;

        if ( pref.mode == 'gradualXY' || pref.mode == 'gradualX' ) {

          var ratio = ( xActual - xMin ) / ( xMax - xMin );
          xMin = Math.max( xAxis.getMinValue(), xMin - diffX * ratio );
          xMax = Math.min( xAxis.getMaxValue(), xMax + diffX * ( 1 - ratio ) );
          xAxis.setCurrentMin( xMin );
          xAxis.setCurrentMax( xMax );

          if ( xAxis.options.onZoom ) {
            xAxis.options.onZoom( xMin, xMax );
          }
        }

        if ( pref.mode == 'gradualXY' || pref.mode == 'gradualY' ) {

          var ratio = ( yActual - yMin ) / ( yMax - yMin );
          yMin = Math.max( yAxis.getMinValue(), yMin - diffY * ratio );
          yMax = Math.min( yAxis.getMaxValue(), yMax + diffY * ( 1 - ratio ) );
          yAxis.setCurrentMin( yMin );
          yAxis.setCurrentMax( yMax );

          if ( yAxis.options.onZoom ) {
            yAxis.options.onZoom( yMin, yMax );
          }
        }

        this.graph.redraw();
        this.graph.drawSeries();
      }

      if ( this.options.onDblClick && !mute ) {

        this.options.onDblClick( x, y, pref, e );
      }
    }
  }

  return plugin;
 } ) (  );


// Build: End source file (plugins/graph.plugin.zoom) 



;
/* 
 * Build: new source file 
 * File name : series/graph.serie.line
 * File path : /Users/normanpellet/Documents/Web/graph/src/series/graph.serie.line.js
 */

build['./series/graph.serie.line'] = ( function( GraphSerieNonInstanciable ) { 

  

  var GraphSerie = function() {}
  $.extend( GraphSerie.prototype, GraphSerieNonInstanciable.prototype, {

    defaults: {
      lineColor: 'black',
      lineStyle: 1,
      flip: false,
      label: "",

      markers: false,
      trackMouse: false,
      trackMouseLabel: false,
      trackMouseLabelRouding: 1,
      lineToZero: false,

      lineWidth: 1,

      autoPeakPicking: false,
      autoPeakPickingNb: 4,
      autoPeakPickingMinDistance: 10
    },

    init: function( graph, name, options ) {

      var self = this;
      this.graph = graph;
      this.name = name;
      this.id = Math.random() + Date.now();

      this.shown = true;
      this.options = $.extend( true, {}, GraphSerie.prototype.defaults, options );

      this.data = [];
      this._isMinOrMax = {
        x: {
          min: false,
          max: false
        },
        y: {
          min: false,
          max: false
        }
      };

      this.groupLines = document.createElementNS( this.graph.ns, 'g' );
      this.domMarker = document.createElementNS( this.graph.ns, 'path' );
      this.domMarker.style.cursor = 'pointer';

      this.groupMain = document.createElementNS( this.graph.ns, 'g' );
      this.additionalData = {};

      this.marker = document.createElementNS( this.graph.ns, 'circle' );
      this.marker.setAttribute( 'fill', 'black' );
      this.marker.setAttribute( 'r', 3 );
      this.marker.setAttribute( 'display', 'none' );

      this.markerLabel = document.createElementNS( this.graph.ns, 'text' );
      this.markerLabelSquare = document.createElementNS( this.graph.ns, 'rect' );
      this.markerLabelSquare.setAttribute( 'fill', 'white' );
      this.domMarkerHover = {};
      this.domMarkerSelect = {};
      this.markerHovered = 0;
      this.groupMarkerSelected = document.createElementNS( this.graph.ns, 'g' );

      this.groupLabels = document.createElementNS( this.graph.ns, 'g' );
      //this.scale = 1;
      //this.shift = 0;
      this.lines = [];

      this.groupMain.appendChild( this.groupLines );
      this.groupMain.appendChild( this.groupLabels );
      this.groupMain.appendChild( this.marker );

      this.groupMain.appendChild( this.groupMarkerSelected );
      this.groupMain.appendChild( this.markerLabelSquare );
      this.groupMain.appendChild( this.markerLabel );

      this.labels = [];

      this.currentAction = false;

      if ( this.initExtended1 )
        this.initExtended1();

      if ( this.options.autoPeakPicking ) {

        this.picks = this.picks || [];

        this.picksDef = [];

        for ( var n = 0, m = this.options.autoPeakPickingNb; n < m; n++ ) {

          this.picksDef.push( this.graph.newShape( {

            type: 'label',
            label: {
              text: "",
              position: {
                x: 0
              },
              anchor: 'middle',

            },

            shapeOptions: {
              minPosY: 15
            }

          } ).then( function( shape ) {

            shape.setSerie( self );
            self.picks.push( shape );
          } ) );
        }

      }
    },

    setAdditionalData: function( data ) {
      this.additionalData = data;
      return this;
    },

    getAdditionalData: function() {
      return this.additionalData;
    },

    calculateSlots: function() {

      var self = this;
      this.slotsData = {};
//      this.slotWorker = new Worker( './src/slotworker.js' );


    var workerUrl = URL.createObjectURL( new Blob(

        [
        " ( " + 

            function() { 

           
          onmessage = function( e ) {
            var data = e.data.data;
            var slotNb = e.data.slotNumber;
            var slot = e.data.slot;
            var flip = e.data.flip;
            var max = e.data.max;
            var min = e.data.min;
            var slotNumber;
            var dataPerSlot = slot / (max - min);

            this.slotsData = [];

            for(var j = 0, k = data.length; j < k ; j ++ ) {

              for(var m = 0, n = data[ j ].length ; m < n ; m += 2 ) {

                slotNumber = Math.floor( ( data[ j ][ m ] - min ) * dataPerSlot );

                this.slotsData[ slotNumber ] = this.slotsData[ slotNumber ] || { 
                    min: data[ j ][ m + 1], 
                    max: data[ j ][ m + 1], 
                    start: data[ j ][ m + 1],
                    stop: false,
                    x: data[ j ][ m ] };

                this.slotsData[ slotNumber ].stop = data[ j ][ m + 1 ];
                this.slotsData[ slotNumber ].min = Math.min( data[ j ][ m + 1 ], this.slotsData[ slotNumber ].min );
                this.slotsData[ slotNumber ].max = Math.max( data[ j ][ m + 1 ], this.slotsData[ slotNumber ].max );

              }
            }

            postMessage( { slotNumber: slotNb, slot: slot, data: this.slotsData } );
          };


            }.toString() + ")()"

        ], { type: 'application/javascript' }

        ) );


        this.slotWorker = new Worker( workerUrl );

      

      this.slotWorker.onmessage = function( e ) {

        self.slotsData[ e.data.slot ].resolve( e.data.data );
      }


      for ( var i = 0, l = this.slots.length; i < l; i++ ) {

        //this.slotsData[ i ] = $.Deferred();
        this.calculateSlot( this.slots[ i ], i );
        //        this.slotsData[ this.slots[ i ] ].max = this.data[ j ][ m ];
      }
    },

    slotCalculator: function( slot, slotNumber ) {
      var def = $.Deferred();

      this.slotWorker.postMessage( {
        /*min: this.getFlip() ? this.minY : this.minX,
        max: this.getFlip() ? this.maxY : this.maxX,*/
        min: this.minX,
        max: this.maxX,
        data: this.data,
        slot: slot,
        slotNumber: slotNumber,
        flip: this.getFlip( )
      } );
      return def;
    },

    calculateSlot: function( slot, slotNumber ) {
      var self = this;
      this.slotsData[ slot ] = this.slotCalculator( slot, slotNumber );
      this.slotsData[ slot ].pipe( function( data ) {

        self.slotsData[ slot ] = data;
        return data;
      } );

    },

    kill: function( noRedraw ) {

      this.graph.plotGroup.removeChild( this.groupMain );

      if ( this.picks && this.picks.length ) {
        for ( var i = 0, l = this.picks.length; i < l; i++ ) {
          this.picks[ i ].kill();
        }
      }

      this.graph._removeSerie( this );

      if ( !noRedraw )  {
        this.graph.redraw();
      }

      if ( this.graph.legend ) {

        this.graph.legend.update();
      }
    },

    onMouseOverMarker: function( e, index ) {
      var toggledOn = this.toggleMarker( index, true, true );
      if ( this.options.onMouseOverMarker ) {
        this.options.onMouseOverMarker( index, this.infos ? ( this.infos[ index[ 0 ] ] ||  false ) : false, [ this.data[ index[ 1 ] ][ index[ 0 ] * 2 ], this.data[ index[ 1 ] ][ index[ 0 ] * 2 + 1 ] ] );
      }
    },

    onMouseOutMarker: function( e, index ) {
      this.markersOffHover();
      if ( this.options.onMouseOutMarker && this.infos ) {
        this.options.onMouseOutMarker( index, this.infos ? ( this.infos[ index[ 0 ] ] ||  false ) : false, [ this.data[ index[ 1 ] ][ index[ 0 ] * 2 ], this.data[ index[ 1 ] ][ index[ 0 ] * 2 + 1 ] ] );
      }
    },

    toggleMarker: function( index, force, hover ) {
      var i = index[ 0 ],
        k = index[ 1 ] || 0;

      index = index.join();

      var _on = !hover ? !this.domMarkerSelect[ index ] : !this.domMarkerHover[ index ];
      var el = this[ 'domMarker' + ( hover ? 'Hover' : 'Select' ) ];

      if ( _on || ( force === true && force !== false ) ) {

        if ( !el[ index ] ) {

          var dom = document.createElementNS( this.graph.ns, 'path' );
          this.setMarkerStyleTo( dom, true );

          var x = this.getX( this.data[ k ][ i * 2 ] );
          var y = this.getY( this.data[ k ][ i * 2 + 1 ] );

          dom.setAttribute( 'd', "M " + x + " " + y + " " + this.getMarkerPath( this.markerFamily[ this.getMarkerCurrentFamily( i ) ], 1 ) );

          this[ 'domMarker' + ( hover ? 'Hover' : 'Select' ) ][ index ] = dom;
          this.groupMarkerSelected.appendChild( dom );

          if ( hover )
            this.markerHovered++;
        }

      } else if ( force === false ||  !_on ) {

        if ( ( hover && this.domMarkerHover[ index ] && !this.domMarkerSelect[ index ] ) || this.domMarkerSelect[ index ] ) {

          if ( !el[ index ] )
            return;
          this.groupMarkerSelected.removeChild( el[ index ] );
          delete el[ index ];

          if ( hover )
            this.markerHovered--;
        }

      }

      return _on;
    },

    markersOffHover: function() {

      for ( var i in this.domMarkerHover ) {
        this.toggleMarker( i.split( ',' ), false, true );
      }
    },

    onClickOnMarker: function( e, index ) {

      var toggledOn = this.toggleMarker( index );

      if ( toggledOn && this.options.onSelectMarker )
        this.options.onSelectMarker( index, this.infos ? ( this.infos[ index[ 0 ] ] ||  false ) : false );

      if ( !toggledOn && this.options.onUnselectMarker )
        this.options.onUnselectMarker( index, this.infos ? ( this.infos[ index[ 0 ] ] ||  false ) : false );

      if ( this.options.onToggleMarker )
        this.options.onToggleMarker( index, this.infos ? ( this.infos[ index[ 0 ] ] ||  false ) : false, toggledOn );
    },

    _getMarkerIndexFromEvent: function( e ) {
      var px = this.graph._getXY( e );
      return this.searchIndexByPxXY( ( px.x - this.graph.getPaddingLeft() ), ( px.y - this.graph.getPaddingTop() ) );

    },

    onMouseWheel: function() {},

    empty: function() {

      for ( var i = 0, l = this.lines.length; i < l; i++ ) {
        this.groupLines.removeChild( this.lines[ i ] );

      }

      while ( this.groupMarkers.firstChild ) {
        this.groupMarkers.removeChild( this.groupMarkers.firstChild );
      }
    },

    select: function() {
      this.selected = true;

      for ( var i = 0, l = this.lines.length; i < l; i++ ) {

        this.applyLineStyle( this.lines[ i ] );
      }

      this.applyLineStyle( this.getSymbolForLegend() );
    },

    unselect: function() {

      this.selected = false;

      for ( var i = 0, l = this.lines.length; i < l; i++ ) {

        this.applyLineStyle( this.lines[ i ] );
      }

      this.applyLineStyle( this.getSymbolForLegend() );
    },

    degrade: function( pxPerP, options ) {

      var serie = this.graph.newSerie( this.name, options, 'zone' );
      this.degradationPx = pxPerP;

      if ( !serie ) {
        return;
      }

      serie.setData( [] );

      serie.setXAxis( this.getXAxis() );
      serie.setYAxis( this.getYAxis() );

      this.degradationSerie = serie;

      return serie;
    },

    draw: function() { // Serie redrawing

      var data = this.data;
      var xData = this.xData;

      if ( this.degradationPx ) {
        data = getDegradedData( this );
        xData = data[ 1 ];
        data = data[ 0 ];
      }

      var x,
        y,
        xpx,
        ypx,
        xpx2,
        ypx2,
        i = 0,
        l = data.length,
        j = 0,
        k,
        m,
        currentLine,
        max,
        self = this;

      var optimizeMonotoneous = this.isXMonotoneous(),
        optimizeMaxPxX = this.getXAxis().getMathMaxPx(),
        optimizeBreak, buffer;



      var shape, self = this;

      this._drawn = true;

      var next = this.groupLines.nextSibling;
      this.groupMain.removeChild( this.groupLines );


      this.markerCurrentFamily = null;
      var markerCurrentIndex = 0;
      var markerNextChange = -1; //this.markerPoints[ markerCurrentIndex ][ 0 ];

      var incrXFlip = 0;
      var incrYFlip = 1;

      if ( this.isFlipped() ) {
        incrXFlip = 1;
        incrYFlip = 0;
      }

      this.eraseMarkers();

      var totalLength = 0;
      for ( ; i < l; i++ ) {
        totalLength += data[ i ].length / 2;
      }

      i = 0;
      var allY = [],
        slotToUse,
        y = 0,
        z;

      if ( this.options.useSlots && this.slots ) {

        if( this.isFlipped() ) {
          var slot = this.graph.getDrawingHeight() * ( this.maxY - this.minY ) / ( this.getYAxis().getActualMax() - this.getYAxis().getActualMin() );
        } else {
          var slot = this.graph.getDrawingWidth() * ( this.maxX - this.minX ) / ( this.getXAxis().getActualMax() - this.getXAxis().getActualMin() );  
        }
        

        for ( var y = 0, z = this.slots.length; y < z; y++ ) {

          if ( slot < this.slots[ y ] ) {
            slotToUse = this.slotsData[ this.slots[ y ] ];
            break;
          }
        }
      }

      var degradation = [];
      var buffer;

      var lookForMaxima = true;
      var lookForMinima = false;

      if ( this.options.autoPeakPicking ) {
        var lastYPeakPicking;
      }

      if ( slotToUse ) {
        if ( slotToUse.done ) {

          slotToUse.done( function( data ) {
            self.drawSlot( data, y );
          } );

        } else {
          this.drawSlot( slotToUse, y );
        }

      } else {

        if ( this.mode == 'x_equally_separated' ) {

          for ( ; i < l; i++ ) {

            currentLine = "M ";
            j = 0, k = 0, m = data[ i ].length;

            for ( ; j < m; j += 1 ) {

              if ( this.markersShown() ) {

                this.getMarkerCurrentFamily( k );
              }

              if ( !this.isFlipped() ) {

                xpx = this.getX( xData[ i ].x + j * xData[ i ].dx );
                ypx = this.getY( data[ i ][ j ] );
              } else {
                ypx = this.getX( xData[ i ].x + j * xData[ i ].dx );
                xpx = this.getY( data[ i ][ j ] );
              }

              if ( optimizeMonotoneous && xpx < 0 ) {
                buffer = [ xpx, ypx ];
                continue;
              }

              if ( optimizeMonotoneous && buffer ) {

                currentLine = this._addPoint( currentLine, buffer[ 0 ], buffer[ 1 ], k );
                buffer = false;
                k++;
              }

              currentLine = this._addPoint( currentLine, xpx, ypx, k );
              k++;

              if ( optimizeMonotoneous && xpx > optimizeMaxPxX ) {
                toBreak = true;
                break;
              }

            }

            this._createLine( currentLine, i, k );

            if ( toBreak ) {
              break;
            }
          }

        } else {

          for ( ; i < l; i++ ) {

            var toBreak = false;

            currentLine = "M ";
            j = 0, k = 0, m = data[ i ].length;

            for ( ; j < m; j += 2 ) {

              if ( this.markersShown() ) {

                this.getMarkerCurrentFamily( k );

              }

              xpx2 = this.getX( data[ i ][ j + incrXFlip ] );
              ypx2 = this.getY( data[ i ][ j + incrYFlip ] );

              if ( xpx2 == xpx && ypx2 == ypx ) {
                continue;
              }

              if ( optimizeMonotoneous && xpx2 < 0 ) {
                buffer = [ xpx2, ypx2 ]
                continue;
              }

              if ( optimizeMonotoneous && buffer ) {

                currentLine = this._addPoint( currentLine, buffer[ 0 ], buffer[ 1 ], k );
                buffer = false;
                k++;
              }

              if ( this.options.autoPeakPicking ) {

                if ( !this.options.lineToZero ) {

                  if ( !lastYPeakPicking ) {
                    lastYPeakPicking = [ ( data[ i ][ j + incrYFlip ] ), data[ i ][ j + incrXFlip ] ];
                  } else {

                    if ( ( data[ i ][ j + incrYFlip ] >= lastYPeakPicking[ 0 ] && lookForMaxima ) ||  ( data[ i ][ j + incrYFlip ] <= lastYPeakPicking[ 0 ] && lookForMinima ) ) {

                      lastYPeakPicking = [ ( data[ i ][ j + incrYFlip ] ), data[ i ][ j + incrXFlip ] ]

                    } else {

                      if ( lookForMinima ) {
                        lookForMinima = false;
                        lookForMaxima = true;
                      } else {

                        lookForMinima = true;
                        lookForMaxima = false;

                        allY.push( lastYPeakPicking );
                        lastYPeakPicking = false;
                      }

                    }
                  }

                } else {
                  allY.push( [ ( data[ i ][ j + incrYFlip ] ), data[ i ][ j + incrXFlip ] ] );
                }
              }

              currentLine = this._addPoint( currentLine, xpx2, ypx2, k );
              k++;

              if ( optimizeMonotoneous && xpx2 > optimizeMaxPxX ) {
                toBreak = true;
                
                break;
              }

              xpx = xpx2;
              ypx = ypx2;
            }

            this._createLine( currentLine, i, k );

            if ( toBreak ) {
              break;
            }
          }
        }

        
      }

      if ( this.options.autoPeakPicking ) {
        makePeakPicking( this, allY );
      }

      i++;

      for ( ; i < this.lines.length; i++ ) {
        this.groupLines.removeChild( this.lines[ i ] );
        this.lines.splice( i, 1 );
      }

      insertMarkers( this );

      this.groupMain.insertBefore( this.groupLines, next );
      var label;
      for ( var i = 0, l = this.labels.length; i < l; i++ ) {
        this.repositionLabel( this.labels[ i ] );
      }
    },

    hidePeakPicking: function( lock ) {

      if ( !this._hidePeakPickingLocked ) {
        this._hidePeakPickingLocked = lock;
      }

      hidePeakPicking( this );
    },

    showPeakPicking: function( unlock ) {

      if ( this._hidePeakPickingLocked && !unlock ) {
        return;
      }

      showPeakPicking( this );
    },

    getMarkerCurrentFamily: function( k ) {

      for ( var z = 0; z < this.markerPoints.length; z++ ) {
        if ( this.markerPoints[ z ][ 0 ] <= k )  { // This one is a possibility !
          if ( this.markerPoints[  z ][ 1 ] >= k ) { // Verify that it's in the boundary
            this.markerCurrentFamily = this.markerPoints[ z ][ 2 ];
          }
        } else {
          break;
        }

      }

      return this.markerCurrentFamily;

    },

    drawSlot: function( slotToUse, y ) {

      
      var currentLine = "M ";
      var k = 0;
      var i = 0,
        xpx, max;
      var j;

      if( this.isFlipped() ) {

        var dataPerSlot = this.slots[ y ] / ( this.maxY - this.minY );

        var slotInit = Math.floor( ( this.getYAxis().getActualMin() - this.minY ) * dataPerSlot );
        var slotFinal = Math.ceil( ( this.getYAxis().getActualMax() - this.minY ) * dataPerSlot );  

      } else {

        var dataPerSlot = this.slots[ y ] / ( this.maxX - this.minX );

        var slotInit = Math.floor( ( this.getXAxis().getActualMin() - this.minX ) * dataPerSlot );
        var slotFinal = Math.ceil( ( this.getXAxis().getActualMax() - this.minX ) * dataPerSlot );
      }
      

      for ( j = slotInit; j <= slotFinal; j++ ) {

        if ( !slotToUse[ j ] ) {
          continue;
        }

        if( this.isFlipped() ) {

          ypx = Math.floor( this.getY( slotToUse[ j ].x ) ),
          max = this.getX( slotToUse[ j ].max );

          /*if ( this.options.autoPeakPicking ) {
            allY.push( [ slotToUse[ j ].max, slotToUse[ j ].x ] );
          }
*/
          currentLine = this._addPoint( currentLine, this.getX( slotToUse[ j ].start ), ypx, k );
          currentLine = this._addPoint( currentLine, max, ypx, false, true );
          currentLine = this._addPoint( currentLine, this.getX( slotToUse[ j ].min ), ypx );
          currentLine = this._addPoint( currentLine, this.getX( slotToUse[ j ].stop ), ypx, false, true );

          k++;
        } else {


          xpx = Math.floor( this.getX( slotToUse[ j ].x ) ),

          
          max = this.getY( slotToUse[ j ].max );

          if ( this.options.autoPeakPicking ) {
            allY.push( [ slotToUse[ j ].max, slotToUse[ j ].x ] );
          }

          currentLine = this._addPoint( currentLine, xpx, this.getY( slotToUse[ j ].start ), k );
          currentLine = this._addPoint( currentLine, xpx, max, false, true );
          currentLine = this._addPoint( currentLine, xpx, this.getY( slotToUse[ j ].min ) );
          currentLine = this._addPoint( currentLine, xpx, this.getY( slotToUse[ j ].stop ), false, true );

          k++;
        }
        

      }

      this._createLine( currentLine, i, k );
      i++;
      
    },

    setMarkerStyleTo: function( dom, family ) {

      if ( !dom ) {
        throw "Cannot set marker style. DOM does not exist.";
      }

      dom.setAttribute( 'fill', family.fillColor ||  'transparent' );
      dom.setAttribute( 'stroke', family.strokeColor || this.getLineColor() );
      dom.setAttribute( 'stroke-width', family.strokeWidth ||  1 );
    },

    hideTrackingMarker: function() {
      this.marker.setAttribute( 'display', 'none' );
      this.markerLabel.setAttribute( 'display', 'none' );
      this.markerLabelSquare.setAttribute( 'display', 'none' );
    },

    _addPoint: function( currentLine, xpx, ypx, k, move ) {
      var pos;

      if ( k !== 0 ) {
        if ( this.options.lineToZero || move )
          currentLine += 'M ';
        else
          currentLine += "L ";
      }

      currentLine += xpx;
      currentLine += " ";
      currentLine += ypx;
      currentLine += " ";

      if ( this.options.lineToZero && ( pos = this.getYAxis().getPos( 0 ) ) !== undefined ) {
        currentLine += "L ";
        currentLine += xpx;
        currentLine += " ";
        currentLine += pos;
        currentLine += " ";
      }

      if ( !this.markerPoints ) {
        return currentLine;
      }

      if ( this.markersShown() && !( xpx > this.getXAxis().getMaxPx() ||  xpx < this.getXAxis().getMinPx() ) ) {

        drawMarkerXY( this.markerFamily[ this.markerCurrentFamily ], xpx, ypx );
      }
      return currentLine;
    },

    // Returns the DOM
    _createLine: function( points, i, nbPoints ) {

      if ( this.lines[ i ] ) {
        var line = this.lines[ i ];
      } else {
        var line = document.createElementNS( this.graph.ns, 'path' );

        this.applyLineStyle( line );
      }

      if ( nbPoints == 0 ) {
        line.setAttribute( 'd', 'M 0 0' );
      } else {
        line.setAttribute( 'd', points );

      }

      if ( !this.lines[ i ] ) {
        this.groupLines.appendChild( line );
        this.lines[ i ] = line;

      }

      return line;
    },

    applyLineStyles: function() {

      for ( var i = 0; i < this.lines.length; i++ ) {
        this.applyLineStyle( this.lines[ i ] );
      }
    },

    applyLineStyle: function( line ) {
      line.setAttribute( 'stroke', this.getLineColor() );
      line.setAttribute( 'stroke-width', this.getLineWidth() + ( this.isSelected() ? 2 : 0 ) );
      if ( this.getLineDashArray() )
        line.setAttribute( 'stroke-dasharray', this.getLineDashArray() );
      line.setAttribute( 'fill', 'none' );
      //	line.setAttribute('shape-rendering', 'optimizeSpeed');
    },

    // Revised August 2014. Ok
    getMarkerPath: function( family, add ) {

      var z = family.zoom  ||  1,
        add = add || 0,
        el;

      switch ( family.type ) {
        case 1:
          el = [ 'm', -2, -2, 'l', 4, 0, 'l', 0, 4, 'l', -4, 0, 'z' ];
          break;

        case 2:
          el = [ 'm', -2, -2, 'l', 4, 4, 'm', -4, 0, 'l', 4, -4 ];
          break;

        case 3:
          el = [ 'm', -2, 0, 'l', 4, 0, 'm', -2, -2, 'l', 0, 4 ];
          break;

        case 4:
          el = [ 'm', -1, -1, 'l', 2, 0, 'l', -1, 2, 'z' ];
          break;

      }

      if ( ( z == 1 ||  !z ) && !add ) {
        return el.join( " " );
      }

      var num = "number";

      if ( !el ) {
        return;
      }

      for ( var i = 0, l = el.length; i < l; i++ ) {

        if ( typeof el[ i ] == num ) {

          el[ i ] *= ( z + add );
        }
      }

      return el.join( " " );

    },

    // Revised August 2014. Ok
    getMarkerDom: function( family )  {

      var self = this;
      if ( !family.dom ) {
        var dom = document.createElementNS( this.graph.ns, 'path' );
        this.setMarkerStyleTo( dom, family );
        family.dom = dom;
        family.path = "";

        dom.addEventListener( 'mouseover', function( e ) {
          var closest = self._getMarkerIndexFromEvent( e );
          self.onMouseOverMarker( e, closest );
        } );

        dom.addEventListener( 'mouseout', function( e ) {
          var closest = self._getMarkerIndexFromEvent( e );
          self.onMouseOutMarker( e, closest );
        } );

        dom.addEventListener( 'click', function( e ) {
          var closest = self._getMarkerIndexFromEvent( e );
          self.onClickOnMarker( e, closest );
        } );

      }

      return family.dom;
    },

    /* */
    handleLabelMove: function( x, y ) {

      var label = this.labelDragging;

      if ( !label )
        return;

      label.labelX += x - label.draggingIniX;
      label.draggingIniX = x;

      label.labelY += y - label.draggingIniY;
      label.draggingIniY = y;

      label.rect.setAttribute( 'x', label.labelX );
      label.rect.setAttribute( 'y', label.labelY - this.graph.options.fontSize );
      label.labelDom.setAttribute( 'x', label.labelX );
      label.labelDom.setAttribute( 'y', label.labelY );

      label.labelLine.setAttribute( 'x1', label.labelX + label.labelDom.getComputedTextLength() / 2 );
      label.labelLine.setAttribute( 'y1', label.labelY - this.graph.options.fontSize / 2 );

    },

    handleLabelMainMove: function( x, y ) {

      if ( this.options.labelMoveFollowCurve || 1 == 1 ) {
        var label = this.labelDragging;
        label.x = this.getXAxis().getVal( x - this.graph.options.paddingLeft );

        label.y = this.handleMouseMove( label.x, false ).interpolatedY;
        this.repositionLabel( label, true );
      }
    },

    handleLabelUp: function() {

      this.labelDragging = false;
    },

    searchIndexByPxXY: function( x, y ) {

      var oldDist = false,
        xyindex = false,
        dist;

      for ( var i = 0, l = this.data.length; i < l; i++ ) {
        for ( var k = 0, m = this.data[ i ].length; k < m; k += 2 ) {

          dist = Math.pow( ( this.getX( this.data[ i ][ k ] ) - x ), 2 ) + Math.pow( ( this.getY( this.data[ i ][ k + 1 ] ) - y ), 2 );
          //console.log(x, y, dist, this.data[i][k], this.data[i][k + 1]);
          if ( !oldDist || dist < oldDist ) {
            oldDist = dist;
            xyindex = [ k / 2, i ];
          }
        }
      }

      return xyindex;
    },

    searchClosestValue: function( valX ) {

      var xMinIndex;

      for ( var i = 0; i < this.data.length; i++ ) {

        if ( ( valX <= this.data[ i ][ this.data[ i ].length - 2 ] && valX >= this.data[ i ][ 0 ] ) ) {
          xMinIndex = this._searchBinary( valX, this.data[ i ], false );
        } else if ( ( valX >= this.data[ i ][ this.data[ i ].length - 2 ] && valX <= this.data[ i ][ 0 ] ) ) {
          xMinIndex = this._searchBinary( valX, this.data[ i ], true );
        } else {
          continue;
        }

        return {
          dataIndex: i,
          xMin: this.data[ i ][ xMinIndex ],
          xMax: this.data[ i ][ xMinIndex + 2 ],
          yMin: this.data[ i ][ xMinIndex + 1 ],
          yMax: this.data[ i ][ xMinIndex + 3 ],

          xBeforeIndex: xMinIndex / 2,
          xAfterIndex: xMinIndex / 2 + 2,
          xBeforeIndexArr: xMinIndex
        }
      }
    },

    handleMouseMove: function( x, doMarker ) {

      var valX = x || this.getXAxis().getMouseVal(),
        xMinIndex,
        xMin,
        yMin,
        xMax,
        yMax;

      var value = this.searchClosestValue( valX );

      if ( !value )
        return;

      var ratio = ( valX - value.xMin ) / ( value.xMax - value.xMin );
      var intY = ( ( 1 - ratio ) * value.yMin + ratio * value.yMax );

      if ( doMarker && this.options.trackMouse ) {

        if ( value.xMin == undefined ) {

          return false;

        } else {

          var x = this.getX( this.getFlip() ? intY : valX );
          var y = this.getY( this.getFlip() ? valX : intY );

          this.marker.setAttribute( 'display', 'block' );
          this.marker.setAttribute( 'cx', x );
          this.marker.setAttribute( 'cy', y );

          this.markerLabel.setAttribute( 'display', 'block' );
          this.markerLabelSquare.setAttribute( 'display', 'block' );
          switch ( this.options.trackMouseLabel ) {
            case false:
              break;

            default:
              this.markerLabel.textContent = this.options.trackMouseLabel
                .replace( '<x>', valX.toFixed( this.options.trackMouseLabelRouding ) )
                .replace( '<y>', intY.toFixed( this.options.trackMouseLabelRouding ) );
              break;
          }

          this.markerLabel.setAttribute( 'x', x + 5 );
          this.markerLabel.setAttribute( 'y', y - 5 );

          this.markerLabelSquare.setAttribute( 'x', x + 5 );
          this.markerLabelSquare.setAttribute( 'y', y - 5 - this.graph.options.fontSize );
          this.markerLabelSquare.setAttribute( 'width', this.markerLabel.getComputedTextLength() + 2 );
          this.markerLabelSquare.setAttribute( 'height', this.graph.options.fontSize + 2 );
        }
      }

      return {
        xBefore: value.xMin,
        xAfter: value.xMax,
        yBefore: value.yMin,
        yAfter: value.yMax,
        trueX: valX,
        interpolatedY: intY,
        xBeforeIndex: value.xBeforeIndex
      };
    },

    _searchBinary: function( target, haystack, reverse ) {
      var seedA = 0,
        length = haystack.length,
        seedB = ( length - 2 );

      if ( haystack[ seedA ] == target )
        return seedA;

      if ( haystack[ seedB ] == target )
        return seedB;

      var seedInt;
      var i = 0;

      while ( true ) {
        i++;
        if ( i > 100 )
          throw "Error loop";

        seedInt = ( seedA + seedB ) / 2;
        seedInt -= seedInt % 2; // Always looks for an x.

        if ( seedInt == seedA || haystack[ seedInt ] == target )
          return seedInt;

        //		console.log(seedA, seedB, seedInt, haystack[seedInt]);
        if ( haystack[ seedInt ] <= target ) {
          if ( reverse )
            seedB = seedInt;
          else
            seedA = seedInt;
        } else if ( haystack[ seedInt ] > target ) {
          if ( reverse )
            seedA = seedInt;
          else
            seedB = seedInt;
        }
      }
    },

    getMax: function( start, end ) {

      var start2 = Math.min( start, end ),
        end2 = Math.max( start, end ),
        v1 = this.searchClosestValue( start2 ),
        v2 = this.searchClosestValue( end2 ),
        i, j, max = -Infinity,
        initJ, maxJ;

      if ( !v1 ) {
        start2 = this.minX;
        v1 = this.searchClosestValue( start2 );
      }

      if ( !v2 ) {
        end2 = this.maxX;
        v2 = this.searchClosestValue( end2 );
      }

      for ( i = v1.dataIndex; i <= v2.dataIndex; i++ ) {
        initJ = i == v1.dataIndex ? v1.xBeforeIndexArr : 0;
        maxJ = i == v2.dataIndex ? v2.xBeforeIndexArr : this.data[ i ].length;

        for ( j = initJ; j <= maxJ; j += 2 ) {
          max = Math.max( max, this.data[ i ][ j + 1 ] );
        }
      }

      return max;
    },

    /* LINE STYLE */

    setLineStyle: function( number ) {
      this.options.lineStyle = number;
      return this;
    },

    getLineStyle: function() {
      return this.options.lineStyle;
    },

    getLineDashArray: function() {

      switch ( this.options.lineStyle ) {

        case 2:
          return "1, 1";
          break;
        case 3:
          return "2, 2";
          break;
        case 3:
          return "3, 3";
          break;
        case 4:
          return "4, 4";
          break;
        case 5:
          return "5, 5";
          break;

        case 6:
          return "5 2";
          break
        case 7:
          return "2 5";
          break

        case 8:
          return "4 2 4 4";
          break;
        case 9:
          return "1,3,1";
          break;
        case 10:
          return "9 2";
          break;
        case 11:
          return "2 9";
          break;

        case false:
        case 1:
          return false;
          break;

        default:
          return this.options.lineStyle;
          break;
      }
    },

    /*  */

    setLineWidth: function( width ) {
      this.options.lineWidth = width;
      return this;
    },

    getLineWidth: function() {
      return this.options.lineWidth;
    },

    /* LINE COLOR */

    setLineColor: function( color ) {
      this.options.lineColor = color;
      return this;
    },

    getLineColor: function() {
      return this.options.lineColor;
    },

    /* */

    /* MARKERS */

    showMarkers: function( skipRedraw ) {
      this.options.markers = true;

      if ( !skipRedraw && this._drawn ) {
        this.draw();
      }

      return this;
    },

    hideMarkers: function( skipRedraw ) {
      this.options.markers = false;

      if ( !skipRedraw && this._drawn ) {
        this.draw();
      }

      return this;
    },

    markersShown: function() {
      return this.options.markers;
    },
    /*
		setMarkerType: function(type, skipRedraw) {
			this.options.markers.type = type;
			
			if(!skipRedraw && this._drawn) {
				this.draw();
			}

			return this;
		},

		setMarkerZoom: function(zoom, skipRedraw) {
			this.options.markers.zoom = zoom;

			if(!skipRedraw && this._drawn) {
				this.draw();
			}

			return this;
		},

		setMarkerStrokeColor: function(color, skipRedraw) {
			this.options.markers.strokeColor = color;

			if(!skipRedraw && this._drawn)
				this.draw();
		},

		setMarkerStrokeWidth: function(width, skipRedraw) {
			this.options.markers.strokeWidth = width;

			if(!skipRedraw && this._drawn)
				this.draw();
		},

		setMarkerFillColor: function(color, skipRedraw) {
			this.options.markers.fillColor = color;

			if(!skipRedraw && this._drawn)
				this.draw();
		},
*/
    // Multiple markers
    setMarkers: function( family ) {
      // Family has to be an object
      // Family looks like
      /*
				{
					type: 1,
					zoom: 1,
					strokeWidth: 1,
					strokeColor: ''
					fillColor: '',
				}
			*/

      this.showMarkers( true );

      if ( !family ) {

        family = [ {
          type: 1,
          zoom: 1,
          points: 'all'
        } ]

      }
      var markerPoints = [];

      markerPoints.push( [ 0, Infinity, null ] );

      for ( var i = 0, k = family.length; i < k; i++ ) {

        this.getMarkerDom( family[ i ] );
        family[ i ].markerPath = this.getMarkerPath( family[ i ] );

        if ( !family[ i ].points ) {
          continue;
        }

        if ( !Array.isArray( family[ i ].points ) ) {
          family[ i ].points = [ family[ i ].points ];
        }

        for ( var j = 0, l = family[ i ].points.length; j < l; j++ ) {

          if ( family[ i ].points[ j ] == 'all' ) {

            markerPoints.push( [ 0, Infinity, i ] );

          } else if ( !Array.isArray( family[ i ].points[ j ] ) ) {

            markerPoints.push( [ family[ i ].points[ j ], family[ i ].points[ j ], i ] );
            //markerPoints.push( [ family[ i ].points[ j ] + 1, null ] );
          } else {

            markerPoints.push( [ family[ i ].points[ j ][ 0 ], family[ i ].points[ j ][ 1 ], i ] );

          }
        }
      }

      this.markerFamily = family;

      // Let's sort if by the first index.
      markerPoints.sort( function( a, b ) { 
        return ( a[ 0 ] - b[ 0 ] ) ||  ( a[ 2 ] == null ? -1 : 1 );
      } );

      // OK now let's handle clashes

      /*			for( var i = 0, l = markerPoints.length ; i < l ; i ++ ) {

				// No clash
				if( markerPoints[ i ][ 1 ] < markerPoints[ i + 1 ][ 1 ] ) {
					continue;
				}

				var restartAt = markerPoints[ i + 1 ][ 1 ] + 1;
				markerPoints[ i ][ 1 ] = markerPoints[ i + 1 ][ 0 ];

				var j = i;

				while( markerPoints[ j ][ 1 ] < restartAt ) {
					j++;
				}

				markerPoints.splice( j, 0, [ restartAt, ])


			}
*/
      this.markerPoints = markerPoints;
    },

    showImpl: function() {
      this.showPeakPicking();
    },

    hideImpl: function() {
      this.hidePeakPicking();
    },

    addLabelX: function( x, label ) {
      this.addLabelObj( {
        x: x,
        label: label
      } );
    },

    addLabel: function( x, y, label ) {
      this.addLabelObj( {
        x: x,
        y: y,
        label: label
      } );
    },

    repositionLabel: function( label, recalculateLabel ) {
      var x = !this.getFlip() ? this.getX( label.x ) : this.getY( label.x ),
        y = !this.getFlip() ? this.getY( label.y ) : this.getX( label.y );

      var nan = ( isNaN( x ) || isNaN( y ) );
      label.group.setAttribute( 'display', nan ? 'none' : 'block' );

      if ( recalculateLabel ) {
        label.labelDom.textContent = this.options.label
          .replace( '<x>', label.x.toFixed( this.options.trackMouseLabelRouding ) || '' )
          .replace( '<label>', label.label || '' );

        label.rect.setAttribute( 'width', label.labelDom.getComputedTextLength() + 2 );
      }
      if ( nan )
        return;
      label.group.setAttribute( 'transform', 'translate(' + x + ' ' + y + ')' );
    },

    addLabelObj: function( label ) {
      var self = this,
        group, labelDom, rect, path;

      this.labels.push( label );
      if ( label.x && !label.y ) {
        label.y = this.handleMouseMove( label.x, false ).interpolatedY;
      }

      group = document.createElementNS( this.graph.ns, 'g' );
      this.groupLabels.appendChild( group );

      labelDom = document.createElementNS( this.graph.ns, 'text' );
      labelDom.setAttribute( 'x', 5 );
      labelDom.setAttribute( 'y', -5 );

      var labelLine = document.createElementNS( this.graph.ns, 'line' );
      labelLine.setAttribute( 'stroke', 'black' );
      labelLine.setAttribute( 'x2', 0 );
      labelLine.setAttribute( 'x1', 0 );

      group.appendChild( labelLine );
      group.appendChild( labelDom );
      rect = document.createElementNS( this.graph.ns, 'rect' );
      rect.setAttribute( 'x', 5 );
      rect.setAttribute( 'y', -this.graph.options.fontSize - 5 );
      rect.setAttribute( 'width', labelDom.getComputedTextLength() + 2 );
      rect.setAttribute( 'height', this.graph.options.fontSize + 2 );
      rect.setAttribute( 'fill', 'white' );
      rect.style.cursor = 'move';
      labelDom.style.cursor = 'move';

      path = document.createElementNS( this.graph.ns, 'path' );
      path.setAttribute( 'd', 'M 0 -4 l 0 8 m -4 -4 l 8 0' );
      path.setAttribute( 'stroke-width', '1px' );
      path.setAttribute( 'stroke', 'black' );

      path.style.cursor = 'move';

      group.insertBefore( rect, labelDom );

      group.appendChild( path );

      label.labelLine = labelLine;
      label.group = group;
      label.rect = rect;
      label.labelDom = labelDom;
      label.path = path;

      label.labelY = -5;
      label.labelX = 5;

      this.bindLabelHandlers( label );
      this.repositionLabel( label, true );
    },

    bindLabelHandlers: function( label ) {
      var self = this;

      function clickHandler( e ) {

        if ( self.graph.currentAction !== false ) {
          return;
        }

        self.graph.currentAction = 'labelDragging';
        e.stopPropagation();
        label.dragging = true;

        var coords = self.graph._getXY( e );
        label.draggingIniX = coords.x;
        label.draggingIniY = coords.y;
        self.labelDragging = label;
      }

      function clickHandlerMain( e ) {

        if ( self.graph.currentAction !== false ) {
          return;
        }
        e.stopPropagation();
        e.preventDefault();
        self.graph.currentAction = 'labelDraggingMain';
        self.labelDragging = label;
      }

      label.labelDom.addEventListener( 'mousedown', clickHandler );
      label.rect.addEventListener( 'mousedown', clickHandler );
      label.rect.addEventListener( 'click', function( e ) {
        e.preventDefault();
        e.stopPropagation();
      } );

      label.labelDom.addEventListener( 'click', function( e ) {
        e.preventDefault();
        e.stopPropagation();
      } );

      label.path.addEventListener( 'mousedown', clickHandlerMain );
      label.path.addEventListener( 'click', function( e ) {
        e.preventDefault();
        e.stopPropagation();
      } );
    },

    getMarkerForLegend: function() {

      if ( !this.markerPoints ) {
        return;
      }

      if ( !this.markerForLegend ) {

        var marker = document.createElementNS( this.graph.ns, 'path' );
        this.setMarkerStyleTo( marker, this.markerFamily[ 0 ] );

        marker.setAttribute( 'd', "M 14 0 " + this.getMarkerPath( this.markerFamily[ 0 ] ) );

        this.markerForLegend = marker;
      }

      return this.markerForLegend;
    },

    eraseMarkers: function() {

      for ( var i in this.markerFamily ) {
        this.markerFamily[ i ].path = "";
      }
    },

    XIsMonotoneous: function() {
      this.xmonotoneous = true;
      return this;
    }
  } );

  function drawMarkerXY( family, x, y ) {

    if ( !family ) {
      return;
    }

    family.path = family.path ||  "";
    family.path += 'M ' + x + ' ' + y + ' ';

    family.path += family.markerPath + ' ';
  }

  function getDegradedData( graph ) { // Serie redrawing
  
    var self = graph,
      xpx,
      ypx,
      xpx2,
      ypx2,
      i = 0,
      l = graph.data.length,
      j = 0,
      k,
      m,
      degradationMin, degradationMax, degradationNb, degradationValue, degradation, degradationMinMax = [],
      incrXFlip = 0,
      incrYFlip = 1,
      degradeFirstX, degradeFirstXPx,
      optimizeMonotoneous = graph.isXMonotoneous(),
      optimizeMaxPxX = graph.getXAxis().getMaxPx(),
      optimizeBreak, buffer;

    if ( graph.isFlipped() ) {
      incrXFlip = 1;
      incrYFlip = 0;
    }

    var datas = [];
    var xData = [],
      dataY = [],
      sum = 0;

    if ( graph.mode == 'x_equally_separated' ) {

      if ( graph.isFlipped() ) {
        return [ graph.data, graph.xData ];
      }

      dataY = [];

      for ( ; i < l; i++ ) {

        j = 0, k = 0, m = graph.data[ i ].length;

        var delta = Math.round( graph.degradationPx / graph.getXAxis().getRelPx( graph.xData[ i ].dx ) );

        if ( delta == 1 ) {
          xData.push( graph.xData[ i ] );
          datas.push( graph.data[ i ] );
        }

        degradationMin = Infinity;
        degradationMax = -Infinity;

        for ( ; j < m; j += 1 ) {

          if ( graph.markerPoints ) {

            graph.getMarkerCurrentFamily( k );
          }

          xpx = graph.xData[ i ].x + j * graph.xData[ i ].dx;

          if ( optimizeMonotoneous && xpx < 0 ) {
            buffer = [ xpx, ypx, graph.data[ i ][ j ] ];
            continue;
          }

          if ( optimizeMonotoneous && buffer ) {

            sum += buffer[ 2 ];
            degradationMin = Math.min( degradationMin, buffer[ 2 ] );
            degradationMax = Math.max( degradationMax, buffer[ 2 ] );

            buffer = false;
            k++;
          }

          sum += graph.data[ i ][ j ];
          degradationMin = Math.min( degradationMin, graph.data[ i ][ j ] );
          degradationMax = Math.max( degradationMax, graph.data[ i ][ j ] );

          if ( ( j % delta == 0 && j > 0 ) || optimizeBreak ) {

            dataY.push( sum / delta );

            degradationMinMax.push( ( graph.xData[ i ].x + j * graph.xData[ i ].dx - ( delta / 2 ) * graph.xData[ i ].dx ), degradationMin, degradationMax );

            degradationMin = Infinity;
            degradationMax = -Infinity;

            sum = 0;
          }

          if ( optimizeMonotoneous && xpx > optimizeMaxPxX ) {
            
            optimizeBreak = true;
            
            break;
          }

          k++;
        }

        datas.push( dataY );
        xData.push( {
          dx: delta * graph.xData[ i ].dx,
          x: graph.xData[ i ].x + ( delta * graph.xData[ i ].dx / 2 )
        } );
      }

      if ( graph.degradationSerie ) {
        graph.degradationSerie.setData( degradationMinMax );
        graph.degradationSerie.draw();
      }

      return [ datas, xData ]

    }

    for ( ; i < l; i++ ) {

      j = 0,
      k = 0,
      m = graph.data[ i ].length;

      degradationNb = 0;
      degradationValue = 0;

      degradationMin = Infinity;
      degradationMax = -Infinity;

      var data = [];

      for ( ; j < m; j += 2 ) {

        xpx2 = graph.getX( graph.data[ i ][ j + incrXFlip ] );

        if ( optimizeMonotoneous && xpx2 < 0 ) {

          buffer = [
            xpx2,
            graph.getY( graph.data[ i ][ j + incrYFlip ] ),
            graph.data[ i ][ j + incrXFlip ],
            graph.data[ i ][ j + incrYFlip ]
          ];

          continue;
        }

        if ( optimizeMonotoneous && buffer ) {

          degradationValue += buffer[  3 ];
          degradationNb++;

          degradationMin = Math.min( degradationMin, buffer[ 3 ] );
          degradationMax = Math.max( degradationMax, buffer[ 3 ] );

          degradeFirstX = buffer[  2 ];
          degradeFirstXPx = buffer[  0 ];

          buffer = false;
          k++;

        } else if ( degradeFirstX === undefined ) {

          degradeFirstX = graph.data[ i ][ j + incrXFlip ];
          degradeFirstXPx = xpx2;
        }

        if ( xpx2 - degradeFirstXPx > graph.degradationPx && j < m ) {

          data.push(
            ( degradeFirstX + graph.data[ i ][ j + incrXFlip ] ) / 2,
            degradationValue / degradationNb
          );

          degradationMinMax.push( ( graph.data[ i ][ j + incrXFlip ] + degradeFirstX ) / 2, degradationMin, degradationMax );

          if ( degradeFirstXPx > optimizeMaxPxX ) {
            break;
          }

          degradeFirstX = undefined;
          degradationNb = 0;
          degradationValue = 0;
          degradationMin = Infinity;
          degradationMax = -Infinity;

          k++;
        }

        degradationValue += graph.data[ i ][ j + incrYFlip ];
        degradationNb++;

        degradationMin = Math.min( degradationMin, graph.data[ i ][ j + incrYFlip ] );
        degradationMax = Math.max( degradationMax, graph.data[ i ][ j + incrYFlip ] );

        if ( optimizeMonotoneous && xpx2 > optimizeMaxPxX ) {

          optimizeBreak = true;
        }

        xpx = xpx2;
        ypx = ypx2;

      }

      datas.push( data );

      if ( optimizeBreak ) {

        break;
      }
    }

    if ( graph.degradationSerie ) {
      graph.degradationSerie.setData( degradationMinMax );
      graph.degradationSerie.draw();
    }

    return [ datas ];

  };

  function hidePeakPicking( graph ) {

    if( ! graph.picks ) {
      return;
    }
    for ( var i = 0; i < graph.picks.length; i++ ) {
      graph.picks[ i ].hide();
    }

  }

  function showPeakPicking( graph ) {


    if( ! graph.picks ) {
      return;
    }
    
    for ( var i = 0; i < graph.picks.length; i++ ) {
      graph.picks[ i ].show();
    }
  }

  function makePeakPicking( graph, allY ) {

    var self = graph;

    $.when.apply( $, graph.picksDef ).then( function() {

      var x,
        px,
        passed = [],
        px,
        i = 0,
        l = allY.length,
        k, m, y;

      allY.sort( function( a, b ) {
        return b[ 0 ] - a[ 0 ];
      } );

      for ( ; i < l; i++ ) {

        x = allY[ i ][ 1 ],
        px = self.getX( x ),
        k = 0, m = passed.length,
        y = self.getY( allY[ i ][ 0 ] );

        if ( px < self.getXAxis().getMinPx() || px > self.getXAxis().getMaxPx() ) {
          continue;
        }

        if ( y > self.getYAxis().getMinPx() || y < self.getYAxis().getMaxPx() ) {
          continue;
        }

        for ( ; k < m; k++ ) {
          if ( Math.abs( passed[ k ] - px ) < self.options.autoPeakPickingMinDistance )  {
            break;
          }
        }

        if ( k < m ) {
          continue;
        }

        if ( !self.picks[ m ] ) {
          return;
        }

        //    self.picks[ m ].show();
        self.picks[ m ].set( 'labelPosition', {
          x: x,
          dy: "-10px"
        } );

        self.picks[ m ].data.label[ 0 ].text = String( Math.round( x * 1000 ) / 1000 );
        passed.push( px );
        self.picks[ m ].redraw();

        if ( passed.length == self.options.autoPeakPickingNb ) {
          break;
        }
      }

    } );
  }

  function insertMarkers( graph ) {

    if ( !graph.markerFamily ) {
      return;
    }

    for ( var i = 0, l = graph.markerFamily.length; i < l; i++ ) {
      graph.markerFamily[ i ].dom.setAttribute( 'd', graph.markerFamily[ i ].path );
      graph.groupMain.appendChild( graph.markerFamily[ i ].dom );
    }
  }

  return GraphSerie;
 } ) ( build["./graph._serie"] );


// Build: End source file (series/graph.serie.line) 



;
/* 
 * Build: new source file 
 * File name : series/graph.serie.contour
 * File path : /Users/normanpellet/Documents/Web/graph/src/series/graph.serie.contour.js
 */

build['./series/graph.serie.contour'] = ( function( GraphSerie ) { 

  // http://stackoverflow.com/questions/2353211/hsl-to-rgb-color-conversion
  /**
   * Converts an HSL color value to RGB. Conversion formula
   * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
   * Assumes h, s, and l are contained in the set [0, 1] and
   * returns r, g, and b in the set [0, 255].
   *
   * @param   Number  h       The hue
   * @param   Number  s       The saturation
   * @param   Number  l       The lightness
   * @return  Array           The RGB representation
   */
   function hue2rgb(p, q, t){
        if(t < 0) t += 1;
        if(t > 1) t -= 1;
        if(t < 1/6) return p + (q - p) * 6 * t;
        if(t < 1/2) return q;
        if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
    }
    
  function hslToRgb(h, s, l){
      var r, g, b;

      if(s == 0){
          r = g = b = l; // achromatic
      }else{
          
          var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
          var p = 2 * l - q;
          r = hue2rgb(p, q, h + 1/3);
          g = hue2rgb(p, q, h);
          b = hue2rgb(p, q, h - 1/3);
      }

      return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
  }




  var GraphSerieContour = function() {

    this.negativeDelta = 0;
    this.positiveDelta = 0;

    this.negativeThreshold = 0;
    this.positiveThreshold = 0;


  };

  $.extend( GraphSerieContour.prototype, GraphSerie.prototype, {

    setData: function( data, arg, type ) {

      var z = 0;
      var x, dx, arg = arg || "2D",
        type = type || 'float',
        i, l = data.length,
        arr, datas = [];

      if ( !data instanceof Array ) {
        return;
      }

      for ( var i = 0; i < l; i++ ) {
        k = k = data[ i ].lines.length;
        arr = this._addData( type, k );

        for ( var j = 0; j < k; j += 2 ) {

          arr[ j ] = data[ i ].lines[ j ];
          this._checkX( arr[ j ] );
          arr[ j + 1 ] = data[ i ].lines[ j + 1 ];
          this._checkY( arr[ j + 1 ] );
        }

        datas.push( {
          lines: arr,
          zValue: data[ i ].zValue
        } );
      }
      this.data = datas;

      return this;
    },

    draw: function( doNotRedrawZone ) {

      var x, y, xpx, ypx, xpx2, ypx2, i = 0,
        l = this.data.length,
        j = 0,
        k, m, currentLine, domLine, arr;
      this.minZ = Infinity;
      this.maxZ = - Infinity;

      var next = this.groupLines.nextSibling;
      this.groupMain.removeChild( this.groupLines );
      this.zValues = {};

      var incrXFlip = 0;
      var incrYFlip = 1;
      if ( this.getFlip() ) {
        incrXFlip = 0;
        incrYFlip = 1;
      }

      var minY = this.getYAxis().getActualMin();
      var minX = this.getXAxis().getActualMin();

      var maxX = this.getXAxis().getActualMax();
      var maxY = this.getYAxis().getActualMax();

      for ( ; i < l; i++ ) {

        j = 0, k = 0, currentLine = "";

        for ( arr = this.data[ i ].lines, m = arr.length; j < m; j += 4 ) {

          var lastxpx, lastypx;


          if( ( arr[ j + incrXFlip ] < minX && arr[ j + 2 + incrXFlip ] < minX ) ||  ( arr[ j + incrYFlip ] < minY && arr[ j + 2 + incrYFlip ] < minY ) || ( arr[ j + incrYFlip ] > maxY && arr[ j + 2 + incrYFlip ] > maxY || ( arr[ j + incrXFlip ] > maxX && arr[ j + 2 + incrXFlip ] > maxX )))  {
            continue;
          }

          xpx2 = this.getX( arr[ j + incrXFlip ] );
          ypx2 = this.getY( arr[ j + incrYFlip ] );

          xpx = this.getX( arr[ j + 2 + incrXFlip ] );
          ypx = this.getY( arr[ j + 2 + incrYFlip ] );

          if ( xpx == xpx2 && ypx == ypx2 ) {
            continue;
          }


          /*	if( j > 0 && ( lastxpx !== undefined && lastypx !== undefined && Math.abs( xpx2 - lastxpx ) <= 30 && Math.abs( ypx2 - lastypx ) <= 30 ) ) {
						currentLine += "L";
					} else {
						currentLine += "M";	
					}
*/

          currentLine += "M";
          currentLine += xpx2;
          currentLine += " ";
          currentLine += ypx2;

          currentLine += "L";
          currentLine += xpx;
          currentLine += " ";
          currentLine += ypx;

          lastxpx = xpx;
          lastypx = ypx;

          k++;
        }

        domLine = this._createLine( currentLine + " z", i, k );
        domLine.setAttribute( 'data-zvalue', this.data[ i ].zValue );

        if ( this.zoneColors && this.zoneColors[ i ] ) {

          domLine.setAttribute( 'fill', this.zoneColors[  i ] );
        }

        this.zValues[ this.data[ i ].zValue ] = {
          dom: domLine
        };

        this.minZ = Math.min( this.minZ, this.data[ i ].zValue );
        this.maxZ = Math.max( this.maxZ, this.data[ i ].zValue );
      }

      i++;

      
      for ( ; i < this.lines.length; i++ ) {

        this.groupLines.removeChild( this.lines[ i ] );
        this.lines.splice( i, 1 );

      }

      i = 0;

      for ( ; i < l; i++ ) {
        this.setColorTo( this.lines[ i ], this.data[ i ].zValue, this.minZ, this.maxZ );
      }

      if ( this.graph.legend ) {
        this.graph.legend.update();
      }


      this.onMouseWheel( 0, { shiftKey: false } );
      this.groupMain.insertBefore( this.groupLines, next );
    },

    initimpl: function() {

      if( ! this.options.hasNegative ) {
        this.negativeThreshold = 0;
      }

    },

    onMouseWheel: function( delta, e, fixed, positive ) {

      delta /= 250;

      if( fixed !== undefined ) {

        if( ! positive ) {
          this.negativeThreshold = - fixed * this.minZ;
          this.negativeDelta = - Math.pow( Math.abs( ( this.negativeThreshold / ( - this.minZ ) ) ), 1/3);
        }

        if( positive ) {
          this.positiveThreshold = fixed * this.maxZ;
          this.positiveDelta = Math.pow( this.positiveThreshold / ( this.maxZ ), 1/3);
        }

      } else {

        if( ( ! e.shiftKey ) || ! this.options.hasNegative ) {

          this.positiveDelta = Math.min( 1, Math.max( 0, this.positiveDelta + Math.min( 0.1, Math.max( -0.1, delta ) ) ) );
          this.positiveThreshold = this.maxZ * ( Math.pow( this.positiveDelta, 3 ) );
      
        } else {

          this.negativeDelta = Math.min( 0, Math.max( -1, this.negativeDelta + Math.min( 0.1, Math.max( -0.1, delta ) ) ) ); 
          this.negativeThreshold = - this.minZ * ( Math.pow( this.negativeDelta, 3 ) );
      
        }

      }

      if( isNaN( this.positiveDelta ) ) {
        this.positiveDelta = 0;
      }

      if( isNaN( this.negativeDelta ) ) {
        this.negativeDelta = 0;
      }

      for ( var i in this.zValues ) {

        this.zValues[ i ].dom.setAttribute( 'display', ( ( i >= 0 && i >= this.positiveThreshold ) || ( i <= 0 && i <= this.negativeThreshold ) ) ? 'block' : 'none' );

      }
      

      if( this._shapeZoom ) {


        if( ! this.options.hasNegative ) {
          this._shapeZoom.hideHandleNeg(); 
        } else {
          
          this._shapeZoom.setHandleNeg( - ( Math.pow( this.negativeDelta, 3 ) ), this.minZ );  
          this._shapeZoom.showHandleNeg();
        }
        
        this._shapeZoom.setHandlePos( ( Math.pow( this.positiveDelta, 3 ) ), this.maxZ );
      }
    },

    setColors: function( colors ) {
      this.zoneColors = colors;
    },

    setDynamicColor: function( colors ) {

      this.lineColors = colors;

    },


    setNegative: function( bln ) {
      this.options.hasNegative = bln;

      if( bln ) {
        this.negativeThreshold = 0;
      }
    },

    setColorTo: function( line, zValue, min, max ) {

      if( ! this.lineColors ) {
        return;
      }

      var hsl = { h: 0, s: 0, l: 0 };

      for( var i in hsl ) {

        if( zValue > 0 ) {
          hsl[ i ] = this.lineColors.fromPositive[ i ] + ( ( this.lineColors.toPositive[ i ] - this.lineColors.fromPositive[ i ] ) * ( zValue / max ) );  
        } else {
          hsl[ i ] = this.lineColors.fromNegative[ i ] + ( ( this.lineColors.toNegative[ i ] - this.lineColors.fromNegative[ i ] ) * ( zValue / min ) );  
        }
      }

      hsl.h /= 360;

      var rgb = hslToRgb( hsl.h, hsl.s, hsl.l );
      
      line.setAttribute( 'stroke', 'rgb(' + rgb.join() + ')');
    },

     getSymbolForLegend: function() {

      if ( !this.lineForLegend ) {

        var line = document.createElementNS( this.graph.ns, 'ellipse' );

        line.setAttribute( 'cx', 7 );
        line.setAttribute( 'cy', 0 );
        line.setAttribute( 'rx', 8 );
        line.setAttribute( 'ry', 3 );

        line.setAttribute( 'cursor', 'pointer' );
        this.lineForLegend = line;

        
      }

      this.applyLineStyle( this.lineForLegend, this.maxZ );

      return this.lineForLegend;
    },



    applyLineStyle: function( line, overwriteValue ) {
      line.setAttribute( 'stroke', this.getLineColor() );
      line.setAttribute( 'stroke-width', this.getLineWidth() + ( this.isSelected() ? 2 : 0 ) );
      if ( this.getLineDashArray() )
        line.setAttribute( 'stroke-dasharray', this.getLineDashArray() );
      line.setAttribute( 'fill', 'none' );

      this.setColorTo( line, ( ( overwriteValue !== undefined ) ? overwriteValue : line.getAttribute( 'data-zvalue' ) ), this.minZ, this.maxZ );
      //  line.setAttribute('shape-rendering', 'optimizeSpeed');
    },


    setShapeZoom: function( shape ) {
      this._shapeZoom = shape;
    }



  } );

  return GraphSerieContour;

 } ) ( build["./series/graph.serie.line"] );


// Build: End source file (series/graph.serie.contour) 



;
/* 
 * Build: new source file 
 * File name : series/graph.serie.scatter
 * File path : /Users/normanpellet/Documents/Web/graph/src/series/graph.serie.scatter.js
 */

build['./series/graph.serie.scatter'] = ( function( GraphSerieNonInstanciable ) { 

  

  var GraphSerieScatter = function() {}
  $.extend( GraphSerieScatter.prototype, GraphSerieNonInstanciable.prototype, {

    defaults: {
      label: ""
    },

    /**
     *	Possible data types
     *	[100, 0.145, 101, 0.152, 102, 0.153]
     *	[[100, 0.145, 101, 0.152], [104, 0.175, 106, 0.188]]
     *	[[100, 0.145], [101, 0.152], [102, 0.153], [...]]
     *	[{ x: 100, dx: 1, y: [0.145, 0.152, 0.153]}]
     *
     *	Converts every data type to a 1D array
     */
    setData: function( data, arg, type ) {

      var z = 0,
        x,
        dx,
        arg = arg || "2D",
        type = type || 'float',
        arr,
        total = 0,
        continuous;

      if ( !data instanceof Array ) {
        return this;
      }

      if ( data instanceof Array && !( data[ 0 ] instanceof Array ) ) { // [100, 103, 102, 2143, ...]
        arg = "1D";
      }

      var _2d = ( arg == "2D" );

      arr = this._addData( type, _2d ? data.length * 2 : data.length );

      z = 0;

      for ( var j = 0, l = data.length; j < l; j++ ) {

        if ( _2d ) {
          arr[ z ] = ( data[ j ][ 0 ] );
          this._checkX( arr[ z ] );
          z++;
          arr[ z ] = ( data[ j ][ 1 ] );
          this._checkY( arr[ z ] );
          z++;
          total++;
        } else { // 1D Array
          arr[ z ] = data[ j ];
          this[ j % 2 == 0 ? '_checkX' : '_checkY' ]( arr[ z ] );
          z++;
          total += j % 2 ? 1 : 0;

        }
      }

      this.graph._updateAxes();

      this.data = arr;

      return this;
    },

    init: function( graph, name, options ) {

      var self = this;

      this.graph = graph;
      this.name = name;

      this.id = Math.random() + Date.now();

      this.shown = true;
      this.options = $.extend( true, {}, GraphSerieScatter.prototype.defaults, options );
      this.data = [];

      this._isMinOrMax = {
        x: {
          min: false,
          max: false
        },
        y: {
          min: false,
          max: false
        }
      };

      this.groupPoints = document.createElementNS( this.graph.ns, 'g' );
      this.groupMain = document.createElementNS( this.graph.ns, 'g' );

      this.additionalData = {};
      /*
			this.groupPoints.addEventListener('mouseover', function(e) {
			
			});


			this.groupPoints.addEventListener('mouseout', function(e) {
			
			});
*/
      this.minX = Number.MAX_VALUE;
      this.minY = Number.MAX_VALUE;
      this.maxX = Number.MIN_VALUE;
      this.maxY = Number.MIN_VALUE;

      this.groupMain.appendChild( this.groupPoints );
      this.currentAction = false;

      if ( this.initExtended1 ) {
        this.initExtended1();
      }

      this.stdStyle = {
        shape: 'circle',
        cx: 0,
        cy: 0,
        r: 3,
        stroke: 'transparent',
        fill: "black"
      }
    },

    empty: function() {

      while ( this.group.firstChild ) {
        this.group.removeChild( this.group.firstChild );
      }
    },

    select: function() {
      this.selected = true;

    },

    unselect: function() {
      this.selected = false;
    },

    setDataStyle: function( std, extra ) {

      this.stdStylePerso = std;
      this.extraStyle = extra;

      return this;
    },

    draw: function() { // Serie redrawing

      var x,
        y,
        xpx,
        ypx,
        j = 0,
        k,
        m,
        currentLine,
        max,
        self = this;

      this._drawn = true;

      this.groupMain.removeChild( this.groupPoints );

      var incrXFlip = 0;
      var incrYFlip = 1;

      if ( this.getFlip() ) {
        incrXFlip = 1;
        incrYFlip = 0;
      }

      var totalLength = this.data.length / 2;

      j = 0, k = 0, m = this.data.length;

      var error;
      //	var pathError = "M 0 0 ";

      if ( this.errorstyles ) {

        for ( var i = 0, l = this.errorstyles.length; i < l; i++ ) {
          this.errorstyles[ i ].paths = {
            top: "",
            bottom: "",
            left: "",
            right: ""
          };

        }

      }

      for ( ; j < m; j += 2 ) {

        xpx = this.getX( this.data[ j + incrXFlip ] );
        ypx = this.getY( this.data[ j + incrYFlip ] );

        var valY = this.data[ j + incrYFlip ],
          coordY;

        if ( this.error && ( error = this.error[ j / 2 ] ) ) {

          //		pathError += "M " + xpx + " " + ypx;

          if ( error[ 0 ] ) {
            this.doErrorDraw( 'y', error[ 0 ], this.data[ j + incrYFlip ], ypx, xpx, ypx );
          }

          if ( error[ 1 ] ) {
            this.doErrorDraw( 'x', error[ 1 ], this.data[ j + incrXFlip ], xpx, xpx, ypx );
          }

        }

        this._addPoint( xpx, ypx, j / 2 );
      }

      if ( this.errorstyles ) {

        for ( var i = 0, l = this.errorstyles.length; i < l; i++ ) {

          for ( var j in this.errorstyles[ i ].paths ) {

            if ( this.errorstyles[ i ][ j ] && this.errorstyles[ i ][ j ].dom ) {
              this.errorstyles[ i ][ j ].dom.setAttribute( 'd', this.errorstyles[ i ].paths[ j ] );
            }
          }
        }
      }

      this.groupMain.appendChild( this.groupPoints );
    },

    doErrorDraw: function( orientation, error, originVal, originPx, xpx, ypx ) {

      if ( !( error instanceof Array ) )  {
        error = [ error ];
      }

      var functionName = orientation == 'y' ? 'getY' : 'getX';
      var bars = orientation == 'y' ? [ 'top', 'bottom' ] : [ 'left', 'right' ];
      var j;

      if ( isNaN( xpx ) ||  isNaN( ypx ) ) {
        return;
      }

      for ( var i = 0, l = error.length; i < l; i++ ) {

        if ( error[ i ] instanceof Array ) { // TOP

          j = bars[ 0 ];
          this.errorstyles[ i ].paths[ j ] += " M " + xpx + " " + ypx;
          this.errorstyles[ i ].paths[ j ] += this.makeError( orientation, i, this[ functionName ]( originVal + error[ i ][ 0 ] ), originPx );

          j = bars[ 1 ];
          this.errorstyles[ i ].paths[ j ] += " M " + xpx + " " + ypx;
          this.errorstyles[ i ].paths[ j ] += this.makeError( orientation, i, this[ functionName ]( originVal - error[ i ][ 1 ] ), originPx );

        } else {

          j = bars[ 0 ];

          this.errorstyles[ i ].paths[ j ] += " M " + xpx + " " + ypx;
          this.errorstyles[ i ].paths[ j ] += this.makeError( orientation, i, this[ functionName ]( originVal + error[ i ] ), originPx );
          j = bars[ 1 ];
          this.errorstyles[ i ].paths[ j ] += " M " + xpx + " " + ypx;
          this.errorstyles[ i ].paths[ j ] += this.makeError( orientation, i, this[ functionName ]( originVal - error[ i ] ), originPx );
        }
      }
    },

    makeError: function( orientation, level, coord, origin ) {

      switch ( this.errorstyles[  level ].type ) {

        case 'bar':
          return this[ "makeBar" + orientation.toUpperCase() ]( coord, origin );
          break;

        case 'box':
          return this[ "makeBox" + orientation.toUpperCase() ]( coord, origin );
          break;
      }
    },

    makeBarY: function( coordY, origin ) {

      return " V " + coordY + " m -10 0 h 20 m -10 0 V " + origin + " ";
    },

    makeBoxY: function( coordY, origin ) {
      return " m 5 0 V " + coordY + " h -10 V " + origin + " m 5 0 ";
    },

    makeBarX: function( coordX, origin ) {
      return " H " + coordX + " m 0 -10 v 20 m 0 -10 H " + origin + " ";
    },

    makeBoxX: function( coordX, origin ) {
      return " v 5 H " + coordX + " v -10 H " + origin + " v 5 ";
    },

    _addPoint: function( xpx, ypx, k ) {

      var g = document.createElementNS( this.graph.ns, 'g' );
      g.setAttribute( 'transform', 'translate(' + xpx + ', ' + ypx + ')' );

      if ( this.extraStyle && this.extraStyle[ k ] ) {

        this.doShape( g, this.extraStyle[ k ] );

      } else if ( this.stdStylePerso ) {

        this.doShape( g, this.stdStylePerso );

      } else {

        this.doShape( g, this.stdStyle );
      }

      this.groupPoints.appendChild( g );
    },

    doShape: function( group, shape ) {

      var el = document.createElementNS( this.graph.ns, shape.shape );
      for ( var i in shape ) {
        if ( i !== "shape" ) {
          el.setAttribute( i, shape[ i ] );
        }
      }

      group.appendChild( el );
    },

    setDataError: function( error ) {
      this.error = error;
      return this;
    },

    setErrorStyle: function( errorstyles ) {

      var self = this;

      errorstyles = errorstyles ||  [ 'box', 'bar' ];

      // Ensure array
      if ( !Array.isArray( errorstyles ) ) {
        errorstyles = [ errorstyles ];
      }

      var styles = [];
      var pairs = [
        [ 'y', 'top', 'bottom' ],
        [ 'x', 'left', 'right' ]
      ];

      function makePath( style ) {

        style.dom = document.createElementNS( self.graph.ns, 'path' );
        style.dom.setAttribute( 'fill', style.fillColor || 'none' );
        style.dom.setAttribute( 'stroke', style.strokeColor || 'black' );

        self.groupMain.appendChild( style.dom );
      }

      for ( var i = 0; i < errorstyles.length; i++ ) {
        // i is bar or box

        styles[ i ] = {};

        if ( typeof errorstyles[ i ] == "string" ) {

          errorstyles[ i ] = {
            type: errorstyles[ i ],
            y: {}
          };

        }

        styles[ i ].type = errorstyles[ i ].type;

        for ( var j = 0, l = pairs.length; j < l; j++ ) {

          if ( errorstyles[ i ][ pairs[ j ][ 0 ] ] ) { //.x, .y

            errorstyles[ i ][ pairs[ j ][ 1 ] ] = $.extend( true, {}, errorstyles[ i ][ pairs[ j ][ 0 ] ] );
            errorstyles[ i ][ pairs[ j ][ 2 ] ] = $.extend( true, {}, errorstyles[ i ][ pairs[ j ][ 0 ] ] );

          }

          for ( var k = 1; k <= 2; k++ ) {

            if ( errorstyles[ i ][ pairs[ j ][ k ] ] ) {

              styles[ i ][ pairs[ j ][ k ] ] = errorstyles[ i ][ pairs[ j ][ k ] ];
              makePath( styles[ i ][ pairs[ j ][ k ] ] );
            }
          }
        }
      }
      /*
				// None is defined
				if( ! errorstyles[ i ].top && ! errorstyles[ i ].bottom ) {

					styles[ i ].top = errorstyles[ i ];
					styles[ i ].top.dom = document.createElementNS( this.graph.ns, 'path' );
					styles[ i ].bottom = errorstyles[ i ];
					styles[ i ].bottom.dom = document.createElementNS( this.graph.ns, 'path' );

				} else if( errrostyles[ i ].top ) {

					styles[ i ].bottom = null; // No bottom displayed
					styles[ i ].top = errrostyles[ i ].top;
					styles[ i ].top.dom = document.createElementNS( this.graph.ns, 'path' );

				} else {

					styles[ i ].bottom = errorstyles[ i ].bottom;
					styles[ i ].bottom.dom = document.createElementNS( this.graph.ns, 'path' );
					styles[ i ].top = null;
				}
*/

      this.errorstyles = styles;

    }
  } );

  return GraphSerieScatter;
 } ) ( build["./graph._serie"] );


// Build: End source file (series/graph.serie.scatter) 



;
/* 
 * Build: new source file 
 * File name : series/graph.serie.zone
 * File path : /Users/normanpellet/Documents/Web/graph/src/series/graph.serie.zone.js
 */

build['./series/graph.serie.zone'] = ( function( GraphSerieNonInstanciable ) { 

  

  var GraphSerieScatter = function() {}
  $.extend( GraphSerieScatter.prototype, GraphSerieNonInstanciable.prototype, {

    defaults: {
      label: "",

      fillColor: 'rgba( 0, 0, 0, 0.1 )',
      lineColor: 'rgba( 0, 0, 0, 1 )',
      lineWidth: '1px',
    },

    init: function( graph, name, options ) {

      var self = this;

      this.graph = graph;
      this.name = name;

      this.id = Math.random() + Date.now();

      this.shown = true;
      this.options = $.extend( true, {}, GraphSerieScatter.prototype.defaults, options );
      this.data = [];

      this._isMinOrMax = {
        x: {
          min: false,
          max: false
        },
        y: {
          min: false,
          max: false
        }
      };

      this.groupZones = document.createElementNS( this.graph.ns, 'g' );
      this.groupMain = document.createElementNS( this.graph.ns, 'g' );

      this.lineZone = document.createElementNS( this.graph.ns, 'path' );
      this.lineZone.setAttribute( 'stroke', 'black' );
      this.lineZone.setAttribute( 'stroke-width', '1px' );

      this.additionalData = {};

      this.minX = Number.MAX_VALUE;
      this.minY = Number.MAX_VALUE;
      this.maxX = Number.MIN_VALUE;
      this.maxY = Number.MIN_VALUE;

      this.groupMain.appendChild( this.groupZones );

      this.groupZones.appendChild( this.lineZone );

      this.currentAction = false;

      if ( this.initExtended1 ) {
        this.initExtended1();
      }

    },

    /**
     *	Possible data types
     *	[100, 0.145, 101, 0.152, 102, 0.153]
     *	[[100, 0.145, 101, 0.152], [104, 0.175, 106, 0.188]]
     *	[[100, 0.145], [101, 0.152], [102, 0.153], [...]]
     *	[{ x: 100, dx: 1, y: [0.145, 0.152, 0.153]}]
     *
     *	Converts every data type to a 1D array
     */
    setData: function( data, arg, type ) {

      var z = 0,
        x,
        dx,
        arg = arg || "2D",
        type = type || 'float',
        arr,
        total = 0,
        continuous;

      if ( !data instanceof Array ) {
        return;
      }

      var length;

      if ( data instanceof Array && !( data[ 0 ] instanceof Array ) ) { // [100, 103, 102, 2143, ...]
        arg = "1D";
        length = data.length * 1.5;

        if ( !( data[ 1 ] instanceof Array ) ) {
          arg = "1D_flat";
          length = data.length * 1;
        }

      } else {

        if ( data instanceof Array && !( data[ 0 ][ 1 ] instanceof Array ) ) { // [100, 103, 102, 2143, ...]
          arg = "2D_flat";
          length = data.length * 3;
        } else {
          arg = "2D";
          length = data.length * 3;
        }
      }

      arr = this._addData( type, length );

      z = 0;

      for ( var j = 0, l = data.length; j < l; j++ ) {

        if ( arg == "2D" ||  arg == "2D_flat" ) {

          arr[ z ] = ( data[ j ][ 0 ] );
          this._checkX( arr[ z ] );
          z++;

          if ( arg == "2D" ) {

            arr[ z ] = ( data[ j ][ 1 ][ 0 ] );
            this._checkY( arr[ z ] );
            z++;
            total++;

            arr[ z ] = ( data[ j ][ 1 ][ 1 ] );
            this._checkY( arr[ z ] );
            z++;
            total++;

          } else {

            arr[ z ] = ( data[ j ][ 1 ] );
            this._checkY( arr[ z ] );
            z++;
            total++;

            arr[ z ] = ( data[ j ][ 2 ] );
            this._checkY( arr[ z ] );
            z++;
            total++;
          }

        } else if ( arg == "1D_flat" ) { // 1D Array

          if ( j % 3 == 0 ) {
            arr[ z ] = data[ j ];
            this._checkX( arr[ z ] );
            z++;
            total++;

            continue;
          }

          arr[ z ] = data[ j ];
          this._checkY( arr[ z ] );
          z++;
          total++;

        } else {

          if ( j % 2 == 0 ) {
            arr[ z ] = data[ j ];
            this._checkX( arr[ z ] );
            z++;
            total++;
            continue;
          }

          arr[ z ] = data[ j ][ 0 ];
          this_checkY( arr[ z ] );
          z++;
          total++;

          arr[ z ] = data[ j ][ 1 ];
          this_checkY( arr[ z ] );
          z++;
          total++;
        }
      }

      this.graph._updateAxes();
      this.data = arr;

      return this;
    },

    _addData: function( type, howmany ) {

      switch ( type ) {
        case 'int':
          var size = howmany * 4; // 4 byte per number (32 bits)
          break;
        case 'float':
          var size = howmany * 8; // 4 byte per number (64 bits)
          break;
      }

      var arr = new ArrayBuffer( size );

      switch ( type ) {
        case 'int':
          return new Int32Array( arr );
          break;

        default:
        case 'float':
          return new Float64Array( arr );
          break;
      }
    },

    empty: function() {

      while ( this.group.firstChild ) {
        this.group.removeChild( this.group.firstChild );
      }
    },

    select: function() {
      this.selected = true;

    },

    unselect: function() {
      this.selected = false;
    },

    setDataStyle: function( std, extra ) {
      this.stdStylePerso = std;
      this.extraStyle = extra;

      return this;
    },

    draw: function() { // Serie redrawing

      var x,
        y,
        xpx,
        ypx1,
        ypx2,
        j = 0,
        k,
        m,
        currentLine,
        max,
        self = this;

      this._drawn = true;

      this.groupMain.removeChild( this.groupZones );

      var totalLength = this.data.length / 2;

      j = 0, k = 0, m = this.data.length;

      var error;
      var pathError = "";

      var pathTop = "";
      var pathBottom = "";

      var lineTop = [];
      var lineBottom = [];

      var buffer;

      for ( ; j < m; j += 3 ) {

        xpx = this.getX( this.data[ j ] );
        ypx1 = this.getY( this.data[ j + 1 ] );
        ypx2 = this.getY( this.data[ j + 2 ] );

        if ( xpx < 0 ) {
          buffer = [ xpx, ypx1, ypx2 ]
          continue;
        }

        if ( buffer ) {

          lineTop.push( [ xpx, Math.max( ypx1, ypx2 ) ] );
          lineBottom.push( [ xpx, Math.min( ypx1, ypx2 ) ] );

          buffer = false;
          k++;
        }

        if ( ypx2 > ypx1 ) {
          lineTop.push( [ xpx, ypx1 ] );
          lineBottom.push( [ xpx, ypx2 ] );
        } else {
          lineTop.push( [ xpx, ypx2 ] );
          lineBottom.push( [ xpx, ypx1 ] );
        }

        if ( xpx > this.getXAxis().getMaxPx() ) {
          break;
        }
      }

      lineBottom.reverse();

      this.lineZone.setAttribute( 'd', "M " + lineTop[ 0 ] + " L " + lineTop.join( " L " ) + " L " + lineBottom.join( " L " ) + " z" );

      this.applyLineStyle( this.lineZone );
      this.groupMain.appendChild( this.groupZones );
    },

    applyLineStyle: function( line ) {

      line.setAttribute( 'stroke', this.getLineColor() );
      line.setAttribute( 'stroke-width', this.getLineWidth() );
      line.setAttribute( 'fill', this.getFillColor() );
    },

    setLineWidth: function( width ) {
      this.options.lineWidth = width;
      return this;
    },

    getLineWidth: function() {
      return this.options.lineWidth;
    },

    /* LINE COLOR */

    setLineColor: function( color ) {
      this.options.lineColor = color;
      return this;
    },

    getLineColor: function() {
      return this.options.lineColor;
    },

    /* */

    /* LINE COLOR */

    setFillColor: function( color ) {
      this.options.fillColor = color;
      return this;
    },

    getFillColor: function() {
      return this.options.fillColor;
    },

    /* */

  } );

  return GraphSerieScatter;
 } ) ( build["./graph._serie"] );


// Build: End source file (series/graph.serie.zone) 



;
/* 
 * Build: new source file 
 * File name : graph.serieaxis
 * File path : /Users/normanpellet/Documents/Web/graph/src/graph.serieaxis.js
 */

build['./graph.serieaxis'] = ( function( GraphSerie ) { 

  var GraphSerieAxis = function() {};

  GraphSerie.prototype,

  $.extend( true, GraphSerieAxis.prototype, GraphSerie.prototype, {

    initExtended1: function() {
      if ( this.initExtended2 )
        this.initExtended2();
    },

    setAxis: function( axis ) {
      this.axis = axis;
    },

    kill: function( noRedraw ) {
      this.getAxis().groupSeries.removeChild( this.groupMain );
      this.getAxis().series.splice( this.getAxis().series.indexOf( this ), 1 );
      if ( !noRedraw )
        this.graph.redraw();
    },

    getAxis: function() {
      return this.axis;
    },

    getXAxis: function() {
      return this.axis;
    },

    getYAxis: function() {
      return this.axis;
    }
  } );

  return GraphSerieAxis;
 } ) ( build["./series/graph.serie.line"] );


// Build: End source file (graph.serieaxis) 



;
/* 
 * Build: new source file 
 * File name : shapes/graph.shape
 * File path : /Users/normanpellet/Documents/Web/graph/src/shapes/graph.shape.js
 */

build['./shapes/graph.shape'] = ( function( ) { 

  

  function getColor( color ) {

    if ( Array.isArray( color ) ) {
      switch ( color.length ) {
        case 3:
          return 'rgb(' + color.join( ',' ) + ')';
          break;
        case 4:
          return 'rgba(' + color.join( ',' ) + ')';
          break;
      }
    } else if ( typeof( color ) == "object" ) {
      return "rgb(" + Math.round( color.r * 255 ) + ", " + Math.round( color.g * 255 ) + ", " + Math.round( color.b * 255 ) + ")";
    }

    return color;
  }

  var GraphShape = function() {};

  GraphShape.prototype = {

    init: function( graph, groupName ) {

      var self = this;

      this.graph = graph;
      this.properties = {};
      this.group = document.createElementNS( this.graph.ns, 'g' );

      this.options = this.options || {};

      if ( groupName ) {
        this.group.setAttribute( 'data-groupname', groupName );
      }

      this._selected = false;
      this.createDom();
      this.setEvents();

      this.classes = [];

      this.rectEvent = document.createElementNS( this.graph.ns, 'rect' );
      this.rectEvent.setAttribute( 'pointer-events', 'fill' );
      this.rectEvent.setAttribute( 'fill', 'transparent' );

      this._movable = true;
      this._selectable = true;

      if ( this.options.masker ) {

        var maskPath = document.createElementNS( this.graph.ns, 'mask' );
        this.maskingId = Math.random();
        maskPath.setAttribute( 'id', this.maskingId );

        this.maskDomWrapper = document.createElementNS( this.graph.ns, 'rect' );
        this.maskDomWrapper.setAttribute( 'fill', 'white' );
        maskPath.appendChild( this.maskDomWrapper );

        var maskDom = this._dom.cloneNode();
        maskPath.appendChild( maskDom );

        this.maskDom = maskDom;

        this.graph.defs.appendChild( maskPath );
      }

      if ( this._dom ) {

        this.group.appendChild( this._dom );

        this._dom.addEventListener( 'mouseover', function( e ) {

          self.handleMouseOver( e );
          //self.doHover( true, e );
          //	e.stopPropagation();

        } );

        this._dom.addEventListener( 'mouseout', function( e ) {

          self.handleMouseOut( e );

          //self.doHover( false, e );
          //e.stopPropagation();

        } );

        this._dom.addEventListener( 'mousedown', function( e ) {

          self.graph.focus();

          e.preventDefault();
          //		e.stopPropagation();

          self.handleSelected = false;
          self.moving = true;

          self.handleMouseDown( e );
        } );

        this._dom.addEventListener( 'dblclick', function( e ) {

          e.preventDefault();
          e.stopPropagation();

          self.handleDblClick( e );
        } );
      }

      //			this.group.appendChild(this.rectEvent);

      this.graph.shapeZone.appendChild( this.group );
      this.initImpl();
    },

    hide: function() {

      if ( this.hidden ) {
        return;
      }

      this.hidden = true;
      this.group.style.display = 'none';
    },

    show: function() {

      if ( !this.hidden ) {
        return;
      }

      this.hidden = false;
      this.group.style.display = 'block';
    },

    addClass: function( className ) {

      this.classes = this.classes || [];

      if ( this.classes.indexOf( className ) == -1 ) {
        this.classes.push( className );
      }

      this.makeClasses();
    },

    removeClass: function( className ) {

      this.classes.splice( this.classes.indexOf( className ), 1 );

      this.makeClasses();
    },

    makeClasses: function() {

      this._dom.setAttribute( 'class', this.classes.join( " " ) );
    },

    initImpl: function() {},

    setOriginalData: function( data, events ) {
      this.data = data;
      this.events = events;

    },

    triggerChange: function() {
      
      this.graph.triggerEvent( 'onAnnotationChange', this.data, this );
    },

    setEvents: function() {},

    setSelectableOnClick: function() {
      return;
      var self = this;
      this._dom.addEventListener( 'click', function() {
        if ( !self._selectable )
          return;
        self._selected = !self._selected;
        self[ self._selected ? 'select' : 'unselect' ]();
      } );
    },

    setBBox: function() {

      this.group.removeChild( this.rectEvent );
      var box = this.group.getBBox();
      this.rectEvent.setAttribute( 'x', box.x );
      this.rectEvent.setAttribute( 'y', box.y - 10 );
      this.rectEvent.setAttribute( 'width', box.width );
      this.rectEvent.setAttribute( 'height', box.height + 20 );

      this.group.appendChild( this.rectEvent );
    },

    setMouseOver: function( callback ) {
      this.rectEvent.addEventListener( 'mouseover', callback );
    },

    kill: function() {

      this.graph.shapeZone.removeChild( this.group );
      this.graph._removeShape( this );

      this.callHandler( "onRemoved", this );

    },

    /*	applyAll: function() {
			for(var i in this.properties)
				this._dom.setAttribute(i, this.properties[i]);
		},
*/
    draw: function() {

      if ( this.labelNumber == undefined ) {
        this.setLabelNumber( 1 );
      }

      this.setFillColor();
      this.setStrokeColor();
      this.setStrokeWidth();
      this.setDashArray();

      this.everyLabel( function( i ) {

        if ( this.get( 'labelPosition', i ) ) {

          this.setLabelText( i );
          this.setLabelSize( i );
          //this.setLabelAngle(i);
          this.setLabelColor( i );
          this.setLabelPosition( i );

        }

        if ( this.get( 'labelAnchor', i ) ) {

          this._forceLabelAnchor( i );

        }
      } );
    },

    redraw: function() {
      //	this.kill();
      var variable;
      this.position = this.setPosition();

      this.redrawImpl();

      if ( !this.position )
        return;

      this.everyLabel( function( i ) {

        if ( this.get( 'labelPosition', i ) ) {

          this.setLabelPosition( i );
          this.setLabelAngle( i );

        }

      } );

      if ( this.afterDone )
        this.afterDone();
      //	this.done();
    },

    redrawImpl: function() {},

    done: function() {
      //this.applyAll();
      //;

    },

    setSerie: function( serie ) {
      this.serie = serie;
    },

    getSerie: function() {
      return this.serie;
    },

    set: function( prop, val, index ) {

      this.properties[ prop ] = this.properties[ prop ] || [];
      this.properties[ prop ][ index || 0 ] = val;

      this.configuration = this.configuration || {
        sections: {
          shape_cfg: [ {
            groups: {
              shape_cfg: [ {}  ]
            }
          } ]
        }
      };
      this.configuration.sections.shape_cfg[ 0 ].groups.shape_cfg[ 0 ][ prop ] = [ val ];

    },

    get: function( prop, index ) {
      this.configuration = this.configuration || {
        sections: {
          shape_cfg: [ {
            groups: {
              shape_cfg: [ {}  ]
            }
          } ]
        }
      };
      return ( ( this.configuration.sections.shape_cfg[ 0 ].groups.shape_cfg[ 0 ] || [] )[ prop ] || [] )[ 0 ];
    },

    getFromData: function( prop ) {
      return this.data[ prop ];
    },
    setData: function( prop, val ) {
      return this.data[ prop ] = val;
    },
    setDom: function( prop, val ) {
      if ( this._dom ) this._dom.setAttribute( prop, val );
    },

    setPosition: function() {
      var position = this._getPosition( this.getFromData( 'pos' ) );
      this.setDom( 'x', position.x );
      this.setDom( 'y', position.y );
      return true;
    },

    setFillColor: function() {
      this.setDom( 'fill', getColor( this.get( 'fillColor' ) ) );
    },
    setStrokeColor: function() {
      this.setDom( 'stroke', getColor( this.get( 'strokeColor' ) ) );
    },
    setStrokeWidth: function() {
      this.setDom( 'stroke-width', this.get( 'strokeWidth' ) );
    },
    setDashArray: function() {
      if ( this.get( 'strokeDashArray' ) ) this.setDom( 'stroke-dasharray', this.get( 'strokeDashArray' ) );
    },

    setLabelText: function( index ) {
      if ( this.label ) this.label[ index ].textContent = this.data.label[ index ].text;
    },
    setLabelColor: function( index ) {
      if ( this.label ) this.label[ index ].setAttribute( 'fill', this.get( 'labelColor' ) );
    },
    setLabelSize: function( index ) {
      if ( this.label ) this.label[ index ].setAttribute( 'font-size', this.get( 'labelSize' ) );
    },
    setLabelPosition: function( index ) {
      if ( this.label ) this._setLabelPosition( index );
    },
    setLabelAngle: function( index ) {
      if ( this.label ) this._setLabelAngle( index );
    },

    _getPosition: function( value, relTo ) {
      var yAxis;
      var xAxis = yAxis = false;

      if ( this.serie ) {
        xAxis = this.serie.getXAxis();
        yAxis = this.serie.getYAxis();
      }

      return this.graph.getPosition( value, relTo, xAxis, yAxis, this.serie );
    },

    setLabelNumber: function( nb ) {
      this.labelNumber = nb;
      this._makeLabel();
    },

    everyLabel: function( callback ) {
      for ( var i = 0; i < this.labelNumber; i++ ) {
        callback.call( this, i );
      }
    },

    toggleLabel: function( labelId, visible ) {
      if ( this.labelNumber && this.label[ i ] ) {
        this.label[ i ].setAttribute( 'display', visible ? 'block' : 'none' );
      }
    },

    _makeLabel: function() {
      var self = this;
      this.label = this.label || [];

      this.everyLabel( function( i ) {

        this.label[ i ] = document.createElementNS( this.graph.ns, 'text' );

        this.label[ i ].addEventListener( 'mouseover', function( e ) {

          //self.doHover( true );
          e.stopPropagation();

        } );

        this.label[ i ].addEventListener( 'mouseout', function( e ) {

          //self.doHover( false );
          e.stopPropagation();

        } );

        this.label[ i ].addEventListener( 'dblclick', function( e ) {

          e.preventDefault();
          e.stopPropagation();

          $( '<input type="text" />' ).attr( 'value', e.target.textContent ).prependTo( self.graph._dom ).css( {

            position: 'absolute',
            'margin-top': ( parseInt( e.target.getAttribute( 'y' ).replace( 'px', '' ) ) - 10 ) + "px",
            'margin-left': ( parseInt( e.target.getAttribute( 'x' ).replace( 'px', '' ) ) - 50 ) + "px",
            textAlign: 'center',
            width: '100px'

          } ).bind( 'blur', function() {

            $( this ).remove();
            self.data.label[ i ].text = $( this ).prop( 'value' );
            self.label[ i ].textContent = $( this ).prop( 'value' );

            self.triggerChange();

          } ).bind( 'keyup', function( e ) {

            e.stopPropagation();
            e.preventDefault();

            if ( e.keyCode == 13 ) {
              $( this ).trigger( 'blur' );
            }

          } ).bind( 'keypress', function( e ) {

            e.stopPropagation();
          } ).bind( 'keydown', function( e ) {

            e.stopPropagation();

          } ).focus().get( 0 ).select();

        } );

        self.group.appendChild( this.label[ i ] );
      } );
    },

    _setLabelPosition: function( labelIndex, pos ) {

      var currPos = this.getFromData( 'pos' );

      if ( !currPos ) {
        pos = {
          x: -1000,
          y: -1000
        };
      } else {

        var parsedCurrPos = this._getPosition( currPos );

        if ( !pos ) {
          
          var pos = this._getPosition( this.get( 'labelPosition', labelIndex ), currPos );
        } else {
          pos = this._getPosition( pos );
        }
      }

      /*if( pos.x || isNaN( pos.y ) ) {
				pos.x = -10000;
				pos.y = -10000;
			}*/
      
      if ( pos.x != "NaNpx" && !isNaN( pos.x ) && pos.x !== "NaN" ) {

        this.label[ labelIndex ].setAttribute( 'x', pos.x );
        this.label[ labelIndex ].setAttribute( 'y', pos.y );
      }
      //this.label.setAttribute('text-anchor', pos.x < parsedCurrPos.x ? 'end' : (pos.x == parsedCurrPos.x ? 'middle' : 'start'));
      //this.label[labelIndex].setAttribute('dominant-baseline', pos.y < parsedCurrPos.y ? 'no-change' : (pos.y == parsedCurrPos.y ? 'middle' : 'hanging'));

    },

    _setLabelAngle: function( labelIndex, angle ) {
      var currAngle = this.get( 'labelAngle', labelIndex ) || 0;

      if ( currAngle == 0 )
        return;

      var x = this.label[ labelIndex ].getAttribute( 'x' );
      var y = this.label[ labelIndex ].getAttribute( 'y' );
      this.label[ labelIndex ].setAttribute( 'transform', 'rotate(' + currAngle + ' ' + x + ' ' + y + ')' );
    },

    _forceLabelAnchor: function( i ) {
      this.label[ i ].setAttribute( 'text-anchor', this._getLabelAnchor() );
    },

    _getLabelAnchor: function() {
      var anchor = this.get( 'labelAnchor' );
      switch ( anchor ) {
        case 'middle':
        case 'start':
        case 'end':
          return anchor;
          break;

        case 'right':
          return 'end';
          break;

        case 'left':
          return 'start';
          break;

        default:
          return 'start';
          break;
      }
    },

    setSelectable: function( bln ) {
      this._selectable = bln;
    },

    setMovable: function( bln ) {
      this._movable = bln;
    },

    select: function( mute ) {

      if ( !this._selectable ) {
        return;
      }

      this._selected = true;
      this.selectStyle();

      if ( !this._staticHandles ) {
        this.addHandles();
        this.setHandles();
      }

      this.callHandler( "onSelected", this );

      this.graph.triggerEvent( 'onAnnotationSelect', this.data, this );

      if ( !mute ) {
        this.graph.selectShape( this, true );
      }
    },

    unselect: function() {

      if ( !this._selectable ) {
        return;
      }

      this._selected = false;

      this.setStrokeWidth();
      this.setStrokeColor();
      this.setDashArray();
      this.setFillColor();

      if ( this.handlesInDom && !this._staticHandles ) {
        this.handlesInDom = false;
        this.removeHandles();
      }

      this.callHandler( "onUnselected", this );

    },

    isSelected: function() {
      return this._selected;
    },

    staticHandles: function( bool ) {
      this._staticHandles = bool;

      if ( bool ) {
        this.addHandles();
        this.setHandles();
      } else {
        this.removeHandles();
      }

    },

    createHandles: function( nb, type, attr ) {

      if ( this.isLocked() ) {
        return;
      }

      var self = this,
        handles = [];

      for ( var i = 1; i <= nb; i++ ) {

        ( function( j ) {

          self[ 'handle' + j ] = document.createElementNS( self.graph.ns, type );

          for ( var k in attr ) {
            self[ 'handle' + j ].setAttribute( k, attr[ k ] );
          }

          self[ 'handle' + j ].addEventListener( 'mousedown', function( e ) {

            e.preventDefault();
            e.stopPropagation();

            self.handleSelected = j;
            self.handleMouseDown( e );
          } );

          handles.push( self[ 'handle' + j ] );

        } )( i );

      }

      return this.handles = handles;
    },

    created: function() {

      this.callHandler( "onCreated", this );
      this.handleCreateImpl();
    },

    handleMouseDownImpl: function() {},
    handleMouseMoveImpl: function() {},
    handleMouseUpImpl: function() {},
    handleCreateImpl: function() {},

    handlers: {

      mouseUp: [

        function( e ) {

          if ( this.moving ) {
            this.callHandler( "onAfterMoved", this );
          }

          if ( this.handleSelected || this.resize ) {
            this.callHandler( "onAfterResized", this );
          }

          this.moving = false;
          this.resize = false;
          this.handleSelected = false;
          this.graph.elementMoving( false );

          return this.handleMouseUpImpl( e );
        }
      ],

      mouseMove: [

        function( e ) {

          var coords = this.graph._getXY( e );
          var
            deltaX = this.serie.getXAxis().getRelVal( coords.x - this.mouseCoords.x ),
            deltaY = this.serie.getYAxis().getRelVal( coords.y - this.mouseCoords.y );

          if ( deltaX != 0 ||  deltaY !== 0 ) {
            this.preventUnselect = true;
          }

          this.mouseCoords = coords;
          var ret = this.handleMouseMoveImpl( e, deltaX, deltaY, coords.x - this.mouseCoords.x, coords.y - this.mouseCoords.y );

          if ( this.options ) {

            if ( this.moving ) {

              if ( this.options.onMove ) {
                this.options.onMove.call( this );
              }

            } else {

              if ( this.options.onResize ) {
                this.options.onResize.call( this );
              }
            }

            this.callHandler('onChange', this );
          }

          return ret;
        }
      ],

      mouseDown: [

        function( e ) {

          var self = this;
          //	e.stopPropagation();
          e.preventDefault();

          this.graph.shapeZone.appendChild( this.group ); // Put the shape on top of the stack !

          //if( this._movable !== false ) {
          this.graph.elementMoving( this );
          //}

          if ( !this._selected ) {
            this.preventUnselect = true;
            this.timeoutSelect = window.setTimeout( function() { // Tweak needed to select the shape.

              self.select();
              self.timeoutSelect = false;
            }, 100 );
          }
          this.mouseCoords = this.graph._getXY( e );

          return this.handleMouseDownImpl( e, this.mouseCoords );
        }
      ],

      mouseOver: [

        function( e ) {
          var clbks;

          //this.highlight();
          this.addClass( 'hover' );

          if ( !( clbks = this._mouseOverCallbacks ) ) {
            return;
          }
          clbks.fireWith( this, [ this.data, this.parameters ] );
        }
      ],

      mouseOut: [

        function( e ) {
          var clbks;

          //    this.unHighlight();
          this.removeClass( 'hover' );

          if ( !( clbks = this._mouseOutCallbacks ) ) {
            return;
          }
          clbks.fireWith( this, [ this.data, this.parameters ] );
        }
      ]
    },

    handleMouseDown: function( e ) {

      return this.callHandler( 'mouseDown', e );
    },

    handleMouseMove: function( e ) {

      if ( this.isLocked() && this._movable !== false ) {

        this.graph.elementMoving( false );

        if ( this.isLocked() ) {
          this.handleSelected = false;
        }

        this.moving = true;
      }

      if ( !this._movable ) {
        this.moving = false;
      }

      if ( this.callHandler( 'beforeMouseMove', e ) === false ) {
        return;
      }

      this.callHandler( 'mouseMove', e );

    },

    handleMouseUp: function( e ) {
      this.callHandler( 'mouseUp', e );
      this.handleSelected = false;
      //			this.triggerChange();
    },

    handleMouseOver: function() {

      this.callHandler( 'mouseOver', this );
    },

    handleMouseOut: function() {
      this.callHandler( 'mouseOut', this );
    },

    removeHandles: function() {

      for ( var i = 1; i <= this.nbHandles; i++ ) {
        this.group.removeChild( this[ 'handle' + i ] );
      }
    },

    callHandler: function( handlerType ) {
      var handler = handlerType;
      var args = Array.prototype.shift.call( arguments );
      var resp;

      var handlers;

      if ( ( handlers = this.graph.shapeHandlers[ handler ] ) ) {
        for ( var i = 0, l = handlers.length; i < l; i++ ) {

          if ( ( resp = handlers[ i ].apply( this, arguments ) ) !== undefined ) {
            return resp;
          }
        }
      }

      if ( ( handlers = GraphShape.prototype.handlers[ handler ] ) ) {
        for ( var i = 0, l = handlers.length; i < l; i++ ) {
          if ( handlers[ i ].apply( this, arguments ) ) {
            //	return;
          }
        }
      }

    },

    addHandles: function() {

      if ( this.isLocked() ) {
        return;
      }

      if ( !this.handlesInDom ) {

        this.handlesInDom = true;

        for ( var i = 1; i <= this.nbHandles; i++ ) {
          if ( this[ 'handle' + i ] ) {
            this.group.appendChild( this[ 'handle' + i ] );
          }
        }
      }
    },

    handleDblClick: function() {

      this.configure();
    },

    configure: function() {

      var self = this;
      var div = $( '<div></div>' ).dialog( {
        modal: true,
        position: [ 'center', 50 ],
        width: '80%'
      } );
      div.prev().remove();
      div.parent().css( 'z-index', 1000 );

      require( [ 'require', 'lib/lib/forms/form' ], function( require, Form ) {

        var form = new Form( {} );
        form.init();

        var structure = {

          sections: {

            shape_cfg: {

              options: {
                title: 'Shape',
                icon: 'info_rhombus'
              },

              groups: {

                shape_cfg: {
                  options: {
                    type: 'list'
                  },

                  fields: self.getFieldsConfig()
                }
              }
            }
          }
        };

        form.setStructure( structure );

        form.onStructureLoaded().done( function() {
          form.fill( self.getConfiguration() );
        } );

        form.addButton( 'Cancel', {
          color: 'blue'
        }, function() {
          div.dialog( 'close' );
        } );

        form.addButton( 'Save', {
          color: 'green'
        }, function() {
          self.setConfiguration( form.getValue() );
          div.dialog( 'close' );

        } );

        form.onLoaded().done( function() {

          div.html( form.makeDom() );
          form.inDom();
        } );
      } );
    },

    getConfiguration: function() {
      return this.configuration = this.configuration ||  {};
    },

    setConfiguration: function( configuration ) {

      this.configuration = $.extend( true, this.configuration, configuration );
    },

    isLocked: function() {

      return this.options.locked ||  this.graph.shapesLocked;
    },

    lock: function() {
      this.options.locked = true;
    },

    unlock: function() {
      this.options.locked = false;
    },

    isBindable: function() {

      return this.options.bindable;
    },

    setBindableToDom: function() {

      if ( this.isBindable() ) {
        this.addClass( 'bindable' );
      }
    },

    highlight: function( params ) {

      this.savedHighlight = {};
      for ( var i in params ) {
        this.savedHighlight[ i ] = this._dom.getAttribute( i );
        this._dom.setAttribute( i, params[ i ] );
      }

      this.highlightImpl();
    },

    unHighlight: function() {

      for ( var i in this.savedHighlight ) {
        this._dom.setAttribute( i, this.savedHighlight[ i ] );
      }

    },

    highlightImpl: function() {},
    unHighlightImpl: function() {},

    getMaskingID: function() {
      return this.maskingId;
    },

    maskWith: function( otherShape ) {
      
      var maskingId;
      if ( maskingId = otherShape.getMaskingID() ) {
        this._dom.setAttribute( 'mask', 'url(#' + maskingId + ')' );
      } else {
        this._dom.removeAttribute( 'mask' );
      }
    },

    updateMask: function() {
      if ( this.maskDom ) {

        var position = {
          x: 'min',
          y: 'min'
        };
        var position2 = {
          x: 'max',
          y: 'max'
        };

        position = this._getPosition( position );
        position2 = this._getPosition( position2 );

        this.maskDomWrapper.setAttribute( 'x', Math.min( position.x, position2.x ) );
        this.maskDomWrapper.setAttribute( 'y', Math.min( position.y, position2.y ) );

        this.maskDomWrapper.setAttribute( 'width', Math.abs( position2.x - position.x ) );
        this.maskDomWrapper.setAttribute( 'height', Math.abs( position2.y - position.y ) );

        for ( var i = 0; i < this._dom.attributes.length; i++ ) {
          this.maskDom.setAttribute( this._dom.attributes[ i ].name, this._dom.attributes[ i ].value );
        }

        this.maskDom.setAttribute( 'fill', 'black' );

      }
    }

  }

  return GraphShape;

 } ) (  );


// Build: End source file (shapes/graph.shape) 



;
/* 
 * Build: new source file 
 * File name : shapes/graph.shape.areaundercurve
 * File path : /Users/normanpellet/Documents/Web/graph/src/shapes/graph.shape.areaundercurve.js
 */

build['./shapes/graph.shape.areaundercurve'] = ( function( GraphShape ) { 

  

  var GraphSurfaceUnderCurve = function( graph ) {
    this.init( graph );
  }

  $.extend( GraphSurfaceUnderCurve.prototype, GraphShape.prototype, {
    createDom: function() {

      var self = this;
      this._dom = document.createElementNS( this.graph.ns, 'path' );
      //this._dom.setAttribute( 'pointer-events', 'stroke' );

      this.nbHandles = 2;
      this.createHandles( this.nbHandles, 'line', {
        'stroke-width': '3',
        'stroke': 'transparent',
        'pointer-events': 'stroke',
        'cursor': 'ew-resize'
      } );

      /*			this.handle1 = document.createElementNS(this.graph.ns, 'line');
			this.handle1.setAttribute(');

			this.handle2 = document.createElementNS(this.graph.ns, 'line');
			this.handle2.setAttribute('stroke-width', '3');
			this.handle2.setAttribute('stroke', 'transparent');
			this.handle2.setAttribute('pointer-events', 'stroke');
			this.handle2.setAttribute('cursor', 'ew-resize');*/

      //			this.setDom('cursor', 'move');
      //			this.doDraw = undefined;

      /*			this.graph.contextListen( this._dom, [
				
				['<li><a><span class="ui-icon ui-icon-cross"></span> Remove integral</a></li>', 
				function(e) {
					self.kill();
					self.graph.triggerEvent('onAnnotationRemove', self.data);
				}]

			]);*/

    },

    handleCreateImpl: function() {
      this.resize = true;
      this.resizingElement = 2;
    },

    handleMouseDownImpl: function( e ) {

    },

    handleMouseUpImpl: function() {

    },

    handleMouseMoveImpl: function( e, deltaX, deltaY ) {

      if ( this.isLocked() ) {
        return;
      }

      var pos = this.getFromData( 'pos' );
      var pos2 = this.getFromData( 'pos2' );

      if ( this.moving ) {

        pos.x = this.graph.deltaPosition( pos.x, deltaX, this.serie.getXAxis() );
        pos.y = this.graph.deltaPosition( pos.y, deltaY, this.serie.getYAxis() );
        pos2.x = this.graph.deltaPosition( pos2.x, deltaX, this.serie.getXAxis() );
        pos2.y = this.graph.deltaPosition( pos2.y, deltaY, this.serie.getYAxis() );

      } else {

        this.resizingPosition = ( ( this.reversed && this.handleSelected == 2 ) || ( !this.reversed && this.handleSelected == 1 ) ) ? this.getFromData( 'pos' ) : this.getFromData( 'pos2' );

        var value = this.serie.searchClosestValue( this.serie.getXAxis().getVal( this.graph._getXY( e ).x - this.graph.getPaddingLeft() ) );

        if ( !value ) {
          return;
        }

        if ( this.resizingPosition.x != value.xMin )
          this.preventUnselect = true;

        this.resizingPosition.x = value.xMin;
      }

      this.position = this.setPosition();
      this.setHandles();
    },

    redrawImpl: function() {
      //var doDraw = this.setPosition();
      //	this.setDom('fill', 'url(#' + 'patternFill' + this.graph._creation + ')')

      if ( this.position != this.doDraw ) {
        this.group.setAttribute( "visibility", this.position ? "visible" : 'hidden' );
        this.doDraw = this.position;
      }
    },

    setPosition: function() {

      var posXY = this._getPosition( this.getFromData( 'pos' ) ),
        posXY2 = this._getPosition( this.getFromData( 'pos2' ), this.getFromData( 'pos' ) ),
        w = Math.abs( posXY.x - posXY2.x ),
        x = Math.min( posXY.x, posXY2.x );

      this.reversed = x == posXY2.x;

      if ( w < 2 || x + w < 0 || x > this.graph.getDrawingWidth() ) {
        return false;
      }

      var v1 = this.serie.searchClosestValue( this.getFromData( 'pos' ).x ),
        v2 = this.serie.searchClosestValue( this.getFromData( 'pos2' ).x ),
        v3,
        i,
        j,
        init,
        max,
        k,
        x,
        y,
        firstX,
        firstY,
        currentLine,
        maxY = 0,
        minY = Number.MAX_VALUE;

      if ( !v1 || !v2 ) {
        return false;
      }

      if ( v1.xBeforeIndex > v2.xBeforeIndex ) {
        v3 = v1;
        v1 = v2;
        v2 = v3;
      }

      for ( i = v1.dataIndex; i <= v2.dataIndex; i++ ) {
        currentLine = "M ";
        init = i == v1.dataIndex ? v1.xBeforeIndexArr : 0;
        max = i == v2.dataIndex ? v2.xBeforeIndexArr : this.serie.data[ i ].length;
        k = 0;

        for ( j = init; j <= max; j += 2 ) {

          x = this.serie.getX( this.serie.data[ i ][ j + 0 ] ),
          y = this.serie.getY( this.serie.data[ i ][ j + 1 ] );

          maxY = Math.max( this.serie.data[ i ][ j + 1 ], maxY );
          minY = Math.min( this.serie.data[ i ][ j + 1 ], minY );

          if ( j == init ) {
            this.firstX = x;
            this.firstY = y;
          }
          currentLine = this.serie._addPoint( currentLine, x, y, k );
          k++;
        }

        this.lastX = x;
        this.lastY = y;

        if ( !this.firstX || !this.firstY || !this.lastX || !this.lastY ) {
          return;
        }

        currentLine += " V " + this.serie.getYAxis().getPx( 0 ) + " H " + this.firstX + " z";
        this.setDom( 'd', currentLine );
      }

      this.maxY = this.serie.getY( maxY );
      if ( this._selected ) {
        this.select();
      }

      return true;
    },

    setHandles: function() {

      if ( !this.firstX ) {
        return;
      }
      this.handle1.setAttribute( 'x1', this.firstX );
      this.handle1.setAttribute( 'x2', this.firstX );

      this.handle2.setAttribute( 'x1', this.lastX );
      this.handle2.setAttribute( 'x2', this.lastX );

      this.handle1.setAttribute( 'y1', this.serie.getYAxis().getMaxPx() );
      this.handle1.setAttribute( 'y2', this.serie.getY( 0 ) );

      this.handle2.setAttribute( 'y1', this.serie.getYAxis().getMaxPx() );
      this.handle2.setAttribute( 'y2', this.serie.getY( 0 ) );
    },

    selectStyle: function() {
      this.setDom( 'stroke', 'red' );
      this.setDom( 'stroke-width', '2' );
      this.setDom( 'fill', 'rgba(255, 0, 0, 0.1)' );
    },

    setLabelPosition: function( labelIndex )  {

      var x = ( this.firstX + this.lastX ) / 2 + "px";
      var y = ( this.lastPointY + this.firstPointY ) / 2 + "px";
      var flip = this.serie.isFlipped();

      this._setLabelPosition( labelIndex, {
        x: flip ? y : x,
        y: flip ? x : y
      } );
    },

    getFieldsConfig: function() {

      return {

        'strokeWidth': {
          type: 'float',
          default: 1,
          title: "Stroke width"
        },

        'strokeColor': {
          type: 'color',
          title: "Stroke color"
        },

        'fillColor': {
          type: 'color',
          title: "Fill color"
        }
      }
    }
  } );

  return GraphSurfaceUnderCurve;
 } ) ( build["./shapes/graph.shape"] );


// Build: End source file (shapes/graph.shape.areaundercurve) 



;
/* 
 * Build: new source file 
 * File name : shapes/graph.shape.line
 * File path : /Users/normanpellet/Documents/Web/graph/src/shapes/graph.shape.line.js
 */

build['./shapes/graph.shape.line'] = ( function( GraphShape ) { 

  var GraphLine = function( graph, options ) {

    this.init( graph );
    this.options = options ||  {};
    this.nbHandles = 2;

    this.createHandles( this.nbHandles, 'rect', {
      transform: "translate(-3 -3)",
      width: 6,
      height: 6,
      stroke: "black",
      fill: "white",
      cursor: 'nwse-resize'
    } );

  }
  $.extend( GraphLine.prototype, GraphShape.prototype, {
    createDom: function() {
      this._dom = document.createElementNS( this.graph.ns, 'line' );
    },

    setPosition: function() {
      var position = this._getPosition( this.getFromData( 'pos' ) );

      if ( !position || !position.x || !position.y ) {
        return;
      }

      this.setDom( 'x2', position.x );
      this.setDom( 'y2', position.y );

      this.currentPos1x = position.x;
      this.currentPos1y = position.y;

      return true;
    },

    setPosition2: function() {

      var position = this._getPosition( this.getFromData( 'pos2' ), this.getFromData( 'pos' ) );

      if ( !position.x || !position.y ) {
        return;
      }

      this.setDom( 'y1', position.y );
      this.setDom( 'x1', position.x );

      this.currentPos2x = position.x;
      this.currentPos2y = position.y;
    },

    redrawImpl: function() {
      this.setPosition();
      this.setPosition2();
      this.setHandles();

    },

    getLinkingCoords: function() {

      return {
        x: ( this.currentPos2x + this.currentPos1x ) / 2,
        y: ( this.currentPos2y + this.currentPos1y ) / 2
      };
    },

    handleCreateImpl: function() {

      this.resize = true;
      this.handleSelected = 2;

    },

    handleMouseDownImpl: function( e ) {

      return true;
    },

    handleMouseUpImpl: function() {

      this.triggerChange();
      return true;
    },

    handleMouseMoveImpl: function( e, deltaX, deltaY, deltaXPx, deltaYPx ) {

      if ( this.isLocked() ) {
        return;
      }

      var pos = this.getFromData( 'pos' );
      var pos2 = this.getFromData( 'pos2' );

      if ( pos2.dx ) {

        pos2.x = this.graph.deltaPosition( pos2.x ||  pos.x, pos2.dx, this.serie.getXAxis() );
        pos2.dx = false;
      }

      if ( pos2.dy ) {
        pos2.y = this.graph.deltaPosition( pos2.x ||  pos.x, pos2.dx, this.serie.getXAxis() );
        pos2.dy = false;
      }

      if ( this.handleSelected == 1 ) {

        if ( !this.options.vertical ) {
          pos.x = this.graph.deltaPosition( pos.x, deltaX, this.serie.getXAxis() );
        }

        if ( !this.options.horizontal ) {
          pos.y = this.graph.deltaPosition( pos.y, deltaY, this.serie.getYAxis() );
        }

      }

      if ( this.handleSelected == 2 ) {

        if ( !this.options.vertical ) {
          pos2.x = this.graph.deltaPosition( pos2.x, deltaX, this.serie.getXAxis() );
        }

        if ( !this.options.horizontal ) {
          pos2.y = this.graph.deltaPosition( pos2.y, deltaY, this.serie.getYAxis() );
        }
      }

      if ( this.options.forcedCoords ) {

        var forced = this.options.forcedCoords;

        if ( forced.y !== undefined ) {

        	if( typeof forced.y == "function" ) {
        		pos2.y = pos.y = forced.y( this );
        	} else {
          		pos2.y = forced.y;
          		pos.y = forced.y;
          	}
        }

        if ( forced.x !== undefined ) {

        	if( typeof forced.x == "function" ) {
        		pos2.x = pos.x = forced.x( this );
        	} else {
	          pos2.x = forced.x;
	          pos.x = forced.x;
	         }
        }
      }

      if ( this.moving ) {

        pos.x = this.graph.deltaPosition( pos.x, deltaX, this.serie.getXAxis() );
        pos.y = this.graph.deltaPosition( pos.y, deltaY, this.serie.getYAxis() );
        pos2.x = this.graph.deltaPosition( pos2.x, deltaX, this.serie.getXAxis() );
        pos2.y = this.graph.deltaPosition( pos2.y, deltaY, this.serie.getYAxis() );

      }

      this.redrawImpl();

      return true;

    },

    setHandles: function() {

      if ( this.isLocked() ) {
        return;
      }

      if ( !this._selected || this.currentPos1x == undefined ) {
        return;
      }

      this.addHandles();

      this.handle1.setAttribute( 'x', this.currentPos1x );
      this.handle1.setAttribute( 'y', this.currentPos1y );

      this.handle2.setAttribute( 'x', this.currentPos2x );
      this.handle2.setAttribute( 'y', this.currentPos2y );
    },

    selectStyle: function() {
      this.setDom( 'stroke', 'red' );
      this.setDom( 'stroke-width', '2' );
    }

  } );

  return GraphLine;

 } ) ( build["./shapes/graph.shape"] );


// Build: End source file (shapes/graph.shape.line) 



;
/* 
 * Build: new source file 
 * File name : shapes/graph.shape.arrow
 * File path : /Users/normanpellet/Documents/Web/graph/src/shapes/graph.shape.arrow.js
 */

build['./shapes/graph.shape.arrow'] = ( function( GraphLine ) { 

  var GraphArrow = function( graph ) {
    this.init( graph );

    this.nbHandles = 2;

    this.createHandles( this.nbHandles, 'rect', {
      transform: "translate(-3 -3)",
      width: 6,
      height: 6,
      stroke: "black",
      fill: "white",
      cursor: 'nwse-resize'
    } );
  }

  $.extend( GraphArrow.prototype, GraphLine.prototype, {
    createDom: function() {
      this._dom = document.createElementNS( this.graph.ns, 'line' );
      this._dom.setAttribute( 'marker-end', 'url(#arrow' + this.graph._creation + ')' );
    }
  } );

  return GraphArrow;

 } ) ( build["./shapes/graph.shape.line"] );


// Build: End source file (shapes/graph.shape.arrow) 



;
/* 
 * Build: new source file 
 * File name : shapes/graph.shape.label
 * File path : /Users/normanpellet/Documents/Web/graph/src/shapes/graph.shape.label.js
 */

build['./shapes/graph.shape.label'] = ( function( GraphShape ) { 

  var GraphLabel = function( graph, options ) {
    this.init( graph );
    this.options = options ||  {};
  }
  $.extend( GraphLabel.prototype, GraphShape.prototype, {
    createDom: function() {
      this._dom = false;
    },

    setPosition: function() {
      var pos = this._getPosition( this.get( 'labelPosition' ) );

      if ( !pos )
        return;

      if ( this.options.minPosY !== undefined ) {
        if ( pos.y < this.options.minPosY ) {
          pos.y = this.options.minPosY;
        }
      }

      this.everyLabel( function( i ) {

        this.label[ i ].setAttribute( 'x', pos.x );
        this.label[ i ].setAttribute( 'y', pos.y );

      } );

      return true;

    },

    _setLabelPosition: function() {},

    redrawImpl: function() {
      this.draw();
    }
  } );

  return GraphLabel;

 } ) ( build["./shapes/graph.shape"] );


// Build: End source file (shapes/graph.shape.label) 



;
/* 
 * Build: new source file 
 * File name : shapes/graph.shape.nmrintegral
 * File path : /Users/normanpellet/Documents/Web/graph/src/shapes/graph.shape.nmrintegral.js
 */

build['./shapes/graph.shape.nmrintegral'] = ( function( GraphSurfaceUnderCurve ) { 

  

  var GraphNMRIntegral = function( graph, options ) {

    this.init( graph, "nmrintegral" );

    this.options = options ||  {};
    this.options.axis = this.options.axis ||  'x';

    this.nbHandles = 2;

    this.createHandles(
      this.nbHandles, 'rect', {
        transform: "translate(-3 -3)",
        width: 6,
        height: 6,
        stroke: "black",
        fill: "white",
        cursor: 'nwse-resize'
      } );
  }

  $.extend( GraphNMRIntegral.prototype, GraphSurfaceUnderCurve.prototype, {

    setPosition: function() {

      var baseLine = this.yBaseline ||  30;

      var posXY = this._getPosition( this.getFromData( 'pos' ) ),
        posXY2 = this._getPosition( this.getFromData( 'pos2' ), this.getFromData( 'pos' ) ),
        w, x,
        axis = this.options.axis;

      if ( !posXY ||  !posXY2 ) {
        return;
      }

      if ( !this.serie.isFlipped() ) {

        baseLine = this.serie.getYAxis().getPx( 0 ) - baseLine;

        w = Math.abs( posXY.x - posXY2.x );
        x = Math.min( posXY.x, posXY2.x );

      } else {

        baseLine = this.serie.getXAxis().getPx( 0 ) - baseLine;

        w = Math.abs( posXY.y - posXY2.y );
        x = Math.min( posXY.y, posXY2.y );
      }

      this.computedBaseline = baseLine;
      this.reversed = x == posXY2.x;

      if ( axis == 'x' ) {
        if ( w < 2 || x + w < 0 || x > this.graph.getDrawingWidth() ) {
          return false;
        }
      } else {
        if ( w < 2 || x + w < 0 || x > this.graph.getDrawingHeight() ) {
          return false;
        }
      }

      var v1 = this.serie.searchClosestValue( this.getFromData( 'pos' )[ axis ] ),
        v2 = this.serie.searchClosestValue( this.getFromData( 'pos2' )[ axis ] ),
        v3,
        i,
        j,
        init,
        max,
        k,
        x,
        y,
        firstX,
        firstY,
        currentLine = "",
        maxY = 0,
        incrYFlip = 1,
        incrXFlip = 0,
        minY = Number.MAX_VALUE;

      if ( !v1 || !v2 ) {
        return false;
      }

      if ( v1.xBeforeIndex > v2.xBeforeIndex ) {
        v3 = v1;
        v1 = v2;
        v2 = v3;
      }

      var firstX, firstY, lastX, lastY, firstXVal, firstYVal, lastXVal, lastYVal, sum = 0,
        diff;
      var ratio = this.scaling;
      var points = [];

      if ( this.serie.isFlipped() ) {
        incrYFlip = 0;
        incrXFlip = 1;
      }

      for ( i = v1.dataIndex; i <= v2.dataIndex; i++ ) {

        init = i == v1.dataIndex ? v1.xBeforeIndexArr : 0;
        max = i == v2.dataIndex ? v2.xBeforeIndexArr : this.serie.data[ i ].length;
        k = 0;

        for ( j = init; j <= max; j += 2 ) {

          x = this.serie.getX( this.serie.data[ i ][ j + incrXFlip ] ),
          y = this.serie.getY( this.serie.data[ i ][ j + incrYFlip ] );

          if ( this.serie.isFlipped() ) {
            var x2 = x;
            x = y;
            y = x2;
          }

          if ( !firstX ) {
            firstX = x;
            firstY = y;
            firstXVal = this.serie.data[ i ][ j + incrXFlip ];
            firstYVal = this.serie.data[ i ][ j + incrYFlip ];
          }

          if ( lastX == undefined ) {
            lastX = x;
            lastY = y;

            lastXVal = this.serie.data[ i ][ j + incrXFlip ];
            lastYVal = this.serie.data[ i ][ j + incrYFlip ];

            continue;
          }

          sum += Math.abs( ( this.serie.data[ i ][ j + incrXFlip ] - lastXVal ) * ( this.serie.data[ i ][ j + incrYFlip ] - firstYVal ) * 0.5 );

          if ( x == lastX && y == lastY ) {
            continue;
          }

          lastX = x;
          lastY = y;

          points.push( [ x, sum ] );
          k++;
        }

        this.lastX = x;
        this.lastY = y;

        if ( !firstX || !firstY || !this.lastX || !this.lastY ) {
          return;
        }

      }

      if ( sum == 0 )  {
        sum = 1; // Will look line a line anyway
      }

      this.maxPx = this.options.maxPx || 50;

      if ( !this.ratio ) {
        this.ratio = 1;
      }

      var integration = this.maxIntegration || sum;

      for ( var i = 0, l = points.length; i < l; i++ ) {

        points[ i ][ 1 ] = baseLine - ( points[ i ][ 1 ] / sum ) * ( this.maxPx ) * ( sum / integration ) * this.ratio;

        if ( i == 0 ) {
          this.firstPointY = points[ i ][ 1 ];
        }
        currentLine += " L " + points[ i ][ incrXFlip ] + ", " + points[ i ][ incrYFlip ] + " ";

        this.lastPointY = points[ i ][ 1 ];
      }

      this.points = points;
      this.lastSum = sum;

      var lastY = firstY,
        lastX = this.lastX;

      var interX = firstX;
      diff = Math.min( 20, lastX - firstX );

      if ( this.serie.isFlipped() ) {
        currentLine = " M " + baseLine + ", " + firstX + " " + currentLine;
      } else {
        currentLine = " M " + firstX + ", " + baseLine + " " + currentLine;
      }

      this.setDom( 'd', currentLine );

      this.firstX = firstX;
      this.firstY = firstY;

      this.maxY = this.serie.getY( maxY );
      if ( this._selected ) {
        this.select();
      }

      this.setHandles();

      return true;
    },

    setScale: function( maxPx, integration ) {
      this.maxPx = maxPx;
      this.maxIntegration = integration;
    },

    setYBaseline: function( y ) {
      this.yBasline = y;
    },

    selectStyle: function() {
      this.setDom( 'stroke-width', '2px' );
    },

    selectHandles: function() {}, // Cancel areaundercurve

    setHandles: function() {

      if ( !this._selected || this.points == undefined ) {
        return;
      }

      this.addHandles();

      this.handle1.setAttribute( 'x', this.points[ 0 ][ 0 ] );
      this.handle1.setAttribute( 'y', this.points[ 0 ][ 1 ] );

      this.handle2.setAttribute( 'x', this.points[ this.points.length - 1 ][ 0 ] - 1 );
      this.handle2.setAttribute( 'y', this.points[ this.points.length - 1 ][ 1 ] );

    }

  } );

  return GraphNMRIntegral;
 } ) ( build["./shapes/graph.shape.areaundercurve"] );


// Build: End source file (shapes/graph.shape.nmrintegral) 



;
/* 
 * Build: new source file 
 * File name : shapes/graph.shape.rect
 * File path : /Users/normanpellet/Documents/Web/graph/src/shapes/graph.shape.rect.js
 */

build['./shapes/graph.shape.rect'] = ( function( GraphShape ) { 

  var GraphRect = function( graph, options ) {

    this.options = options;
    this.init( graph );

    this.graph = graph;
    this.nbHandles = 4;

    this.options.handles = this.options.handles ||  {
      type: 'corners'
    };

    switch ( this.options.handles.type ) {

      case 'sides':

        this.options.handles.sides = this.options.handles.sides || {
          top: true,
          bottom: true,
          left: true,
          right: true
        };

        var j = 0;
        for ( var i in this.options.handles.sides ) {
          if ( this.options.handles.sides[ i ] ) {
            j++;
          }
        }

        this.createHandles( j, 'g' ).map( function( g ) {

          var r = document.createElementNS( graph.ns, 'rect' );
          r.setAttribute( 'x', '-3' );
          r.setAttribute( 'width', '6' );
          r.setAttribute( 'y', '-6' );
          r.setAttribute( 'height', '12' );
          r.setAttribute( 'stroke', 'black' );
          r.setAttribute( 'fill', 'white' );
          r.setAttribute( 'cursor', 'pointer' );

          g.appendChild( r );
        } );

        var j = 1;
        this.handles = {};
        this.sides = [];
        for ( var i in this.options.handles.sides ) {
          if ( this.options.handles.sides[ i ] ) {
            this.handles[ i ] = this[ 'handle' + j ];
            this.sides[ j ] = i;
            j++;
          }

        }

        break;

      default:
      case 'corners':
        this.createHandles( this.nbHandles, 'rect', {
          transform: "translate(-3 -3)",
          width: 6,
          height: 6,
          stroke: "black",
          fill: "white"
        } );

        this.handle2.setAttribute( 'cursor', 'nesw-resize' );
        this.handle4.setAttribute( 'cursor', 'nesw-resize' );

        this.handle1.setAttribute( 'cursor', 'nwse-resize' );
        this.handle3.setAttribute( 'cursor', 'nwse-resize' );

        break;

    }

  }

  $.extend( GraphRect.prototype, GraphShape.prototype, {

    createDom: function() {
      this._dom = document.createElementNS( this.graph.ns, 'rect' );
    },

    setWidthPx: function( px ) {
      this.set( 'width', px );
    },
    setHeightPx: function( px ) {
      this.set( 'height', px );
    },
    setFullWidth: function() {
      this.set( 'x', Math.min( this.serie.getXAxis().getMinPx(), this.serie.getXAxis().getMaxPx() ) );
      this.set( 'width', Math.abs( this.serie.getXAxis().getMaxPx() - this.serie.getXAxis().getMinPx() ) );
    },
    setFullHeight: function() {
      this.set( 'y', Math.min( this.serie.getYAxis().getMinPx(), this.serie.getYAxis().getMaxPx() ) );
      this.set( 'height', Math.abs( this.serie.getYAxis().getMaxPx() - this.serie.getYAxis().getMinPx() ) );
    },

    setPosition: function() {

      var width = this.getFromData( 'width' ),
        height = this.getFromData( 'height' );
      

      var pos = this._getPosition( this.getFromData( 'pos' ) ),
        x = pos.x,
        y = pos.y;

      if ( width == undefined || height == undefined ) {

        var position2 = this._getPosition( this.getFromData( 'pos2' ) );

        if ( !position2 ) {
          throw "Position 2 was undefined";
          return;
        }

        width = position2.x - pos.x;
        height = position2.y - pos.y;

      } else {
        width = this.graph.getPxRel( width, this.serie.getXAxis() );
        height = this.graph.getPxRel( height, this.serie.getYAxis() );
      }

      // At this stage, x and y are in px

      x = pos.x,
      y = pos.y;

      this.currentX = x;
      this.currentY = y;
      this.currentW = width;
      this.currentH = height;

      if ( width < 0 ) {
        x += width;
        width *= -1;
      }

      if ( height < 0 ) {
        y += height;
        height *= -1;
      }

      if ( !isNaN( x ) && !isNaN( y ) && x !== false && y !== false ) {

        this.setDom( 'width', width );
        this.setDom( 'height', height );
        this.setDom( 'x', x );
        this.setDom( 'y', y );

        this.setHandles();
        this.updateMask();

        return true;
      }

      return false;
    },

    getLinkingCoords: function() {

      return {
        x: this.currentX + this.currentW / 2,
        y: this.currentY + this.currentH / 2
      };
    },

    redrawImpl: function() {

    },

    handleCreateImpl: function() {
      this.resize = true;
      this.handleSelected = 3;
    },

    handleMouseDownImpl: function( e ) {

    },

    handleMouseUpImpl: function() {

      var pos = this.getFromData( 'pos' );
      var pos2 = this.getFromData( 'pos2' );

      /*	if( pos2.y < pos.y ) {
				var y = pos.y;
				pos.y = pos2.y;
				pos2.y = y;
			}
		*/
      this.triggerChange();
    },

    handleMouseMoveImpl: function( e, deltaX, deltaY, deltaXPx, deltaYPx ) {

      if ( !this.moving && !this.handleSelected ) {
        return;
      }

      var w = this.getFromData( 'width' );
      var h = this.getFromData( 'height' );
      var pos = this.getFromData( 'pos' );
      var pos2 = this.getFromData( 'pos2' );

      if ( pos2.dx ) {

        pos2.x = this.graph.deltaPosition( pos2.x ||  pos.x, pos2.dx, this.serie.getXAxis() );
        pos2.dx = false;
      }

      if ( pos2.dy ) {
        pos2.y = this.graph.deltaPosition( pos2.x ||  pos.x, pos2.dx, this.serie.getXAxis() );
        pos2.dy = false;
      }

      if ( w !== undefined && h !== undefined ) {

        if ( this.moving ) {

          pos.x = this.graph.deltaPosition( pos.x, deltaX, this.serie.getXAxis() );
          pos.y = this.graph.deltaPosition( pos.y, deltaY, this.serie.getYAxis() );

          this.setData( 'pos', pos );
          this.setPosition();
          return;
        }

        switch ( this.options.handles.type ) {

          /*
this.handle1.setAttribute('x', this.currentX);
					this.handle1.setAttribute('y', this.currentY + this.currentH / 2);

					this.handle2.setAttribute('x', this.currentX + this.currentW );
					this.handle2.setAttribute('y', this.currentY + this.currentH / 2);

					this.handle3.setAttribute('x', this.currentX + this.currentW / 2);
					this.handle3.setAttribute('y', this.currentY);

					this.handle4.setAttribute('x', this.currentX + this.currentH / 2);
					this.handle4.setAttribute('y', this.currentY + this.currentH);
					*/
          case 'sides':

            switch ( this.sides[ this.handleSelected ] ) {

              case 'left':
                pos.x = this.graph.deltaPosition( pos.x, deltaX, this.serie.getXAxis() );
                w = this.graph.deltaPosition( w, -deltaX, this.serie.getXAxis() );
                break;

              case 'right':
                w = this.graph.deltaPosition( w, deltaX, this.serie.getXAxis() );
                break;

              case 'top':
                pos.y = this.graph.deltaPosition( pos.y, deltaY, this.serie.getYAxis() );
                h = this.graph.deltaPosition( h, -deltaX, this.serie.getYAxis() );
                break;

              case 'bottom':
                h = this.graph.deltaPosition( h, deltaY, this.serie.getYAxis() );
                break;

            }

            break;

          case 'corners':
          default:

            if ( this.handleSelected == 1 ) {

              pos.x = this.graph.deltaPosition( pos.x, deltaX, this.serie.getXAxis() );
              pos.y = this.graph.deltaPosition( pos.y, deltaY, this.serie.getYAxis() );

              w = this.graph.deltaPosition( w, -deltaX, this.serie.getXAxis() );
              h = this.graph.deltaPosition( h, -deltaY, this.serie.getYAxis() );

            }

            if ( this.handleSelected == 2 ) {

              pos.y = this.graph.deltaPosition( pos.y, deltaY, this.serie.getYAxis() );

              w = this.graph.deltaPosition( w, deltaX, this.serie.getXAxis() );
              h = this.graph.deltaPosition( h, -deltaY, this.serie.getYAxis() );

            }

            if ( this.handleSelected == 3 ) {

              w = this.graph.deltaPosition( w, deltaX, this.serie.getXAxis() );
              h = this.graph.deltaPosition( h, deltaY, this.serie.getYAxis() );

            }

            if ( this.handleSelected == 4 ) {

              pos.x = this.graph.deltaPosition( pos.x, deltaX, this.serie.getXAxis() );

              w = this.graph.deltaPosition( w, -deltaX, this.serie.getXAxis() );
              h = this.graph.deltaPosition( h, deltaY, this.serie.getYAxis() );
            }
            break;
        }

        var wpx = this.graph.getPxRel( w, this.serie.getXAxis() );
        var hpx = this.graph.getPxRel( h, this.serie.getYAxis() );
        /*

				if( wpx < 0 ) {
					
					pos.x = this.graph.deltaPosition( pos.x, w );
					w = - w;	

					switch( this.options.handles.type ) {

						case 'corners':
							if( this.handleSelected == 1 ) this.handleSelected = 2;
							else if( this.handleSelected == 2 ) this.handleSelected = 1;
							else if( this.handleSelected == 3 ) this.handleSelected = 4;
							else if( this.handleSelected == 4 ) this.handleSelected = 3;	
						break;
					}
					
				}


				if( hpx < 0 ) {
					
					pos.y = this.graph.deltaPosition( pos.y, h );
					h = - h;
				


					switch( this.options.handles.type ) {


						case 'corners':
							if( this.handleSelected == 1 ) this.handleSelected = 4;
							else if( this.handleSelected == 2 ) this.handleSelected = 3;
							else if( this.handleSelected == 3 ) this.handleSelected = 2;
							else if( this.handleSelected == 4 ) this.handleSelected = 1;	
						break;
					}

					
				}*/

        this.setData( 'width', w );
        this.setData( 'height', h );

      } else {

        var invX = this.serie.getXAxis().isFlipped(),
          invY = this.serie.getYAxis().isFlipped(),
          posX = pos.x,
          posY = pos.y,
          pos2X = pos2.x,
          pos2Y = pos2.y

        if ( this.moving ) {

          pos.x = this.graph.deltaPosition( pos.x, deltaX, this.serie.getXAxis() );
          pos.y = this.graph.deltaPosition( pos.y, deltaY, this.serie.getYAxis() );

          pos2.x = this.graph.deltaPosition( pos2.x, deltaX, this.serie.getXAxis() );
          pos2.y = this.graph.deltaPosition( pos2.y, deltaY, this.serie.getYAxis() );

          this.setData( 'pos', pos );
          this.setData( 'pos2', pos2 );
          this.setPosition();

          return;

        }

        switch ( this.options.handles.type ) {

          case 'sides':
            // Do nothing for now

            switch ( this.sides[ this.handleSelected ] ) {

              case 'left':
                pos.x = this.graph.deltaPosition( pos.x, deltaX, this.serie.getXAxis() );
                break;

              case 'right':
                pos2.x = this.graph.deltaPosition( pos2.x, deltaX, this.serie.getXAxis() );
                break;

              case 'top':
                pos.y = this.graph.deltaPosition( pos.y, deltaY, this.serie.getYAxis() );
                break;

              case 'bottom':
                pos2.y = this.graph.deltaPosition( pos2.y, deltaY, this.serie.getYAxis() );
                break;

            }

            break;

          case 'corners':
          default:

            if ( this.handleSelected == 1 ) {

              posX = this.graph.deltaPosition( posX, deltaX, this.serie.getXAxis() );
              posY = this.graph.deltaPosition( posY, deltaY, this.serie.getYAxis() );

            } else if ( this.handleSelected == 2 ) {

              pos2X = this.graph.deltaPosition( pos2X, deltaX, this.serie.getXAxis() );
              posY = this.graph.deltaPosition( posY, deltaY, this.serie.getYAxis() );

            } else if ( this.handleSelected == 3 ) {

              pos2Y = this.graph.deltaPosition( pos2Y, deltaY, this.serie.getYAxis() );
              pos2X = this.graph.deltaPosition( pos2X, deltaX, this.serie.getXAxis() );

            } else if ( this.handleSelected == 4 ) {

              posX = this.graph.deltaPosition( posX, deltaX, this.serie.getXAxis() );
              pos2Y = this.graph.deltaPosition( pos2Y, deltaY, this.serie.getYAxis() );

            }

            pos2.x = pos2X;
            pos2.y = pos2Y;

            pos.x = posX;
            pos.y = posY;

            
            break;

        }

        this.setData( 'pos2', pos2 );
      }

      this.setData( 'pos', pos );

      this.setPosition();

    },

    setHandles: function() {

      if ( !this.handlesInDom ) {
        return;
      }

      if ( this.currentX == undefined ) {
        return;
      }

      switch ( this.options.handles.type ) {

        case 'sides':

          if ( this.handles.left ) {
            this.handles.left.setAttribute( 'transform', 'translate(' + this.currentX + ' ' + ( this.currentY + this.currentH / 2 ) + ')' );
          }

          if ( this.handles.right ) {
            this.handles.right.setAttribute( 'transform', 'translate( ' + ( this.currentX + this.currentW ) + ' ' + ( this.currentY + this.currentH / 2 ) + ')' );
          }

          if ( this.handles.top ) {
            this.handles.top.setAttribute( 'transform', 'translate( ' + ( this.currentX + this.currentW / 2 ) + ' ' + this.currentY + ')' );
          }

          if ( this.handles.bottom ) {
            this.handles.bottom.setAttribute( 'transform', 'translate( ' + ( this.currentX + this.currentW / 2 ) + ' ' + ( this.currentY + this.currentH ) + ')' );
          }

          break;

        case 'corners':
        default:

          this.handle1.setAttribute( 'x', this.currentX );
          this.handle1.setAttribute( 'y', this.currentY );

          this.handle2.setAttribute( 'x', this.currentX + this.currentW );
          this.handle2.setAttribute( 'y', this.currentY );

          this.handle3.setAttribute( 'x', this.currentX + this.currentW );
          this.handle3.setAttribute( 'y', this.currentY + this.currentH );

          this.handle4.setAttribute( 'x', this.currentX );
          this.handle4.setAttribute( 'y', this.currentY + this.currentH );

          break;

      }

    },

    selectStyle: function() {
      this.setDom( 'stroke', 'red' );
      this.setDom( 'stroke-width', '2' );
      this.setDom( 'fill', 'rgba(255, 0, 0, 0.1)' );
    }

  } );

  return GraphRect;

 } ) ( build["./shapes/graph.shape"] );


// Build: End source file (shapes/graph.shape.rect) 



;
/* 
 * Build: new source file 
 * File name : shapes/graph.shape.peakintegration2d
 * File path : /Users/normanpellet/Documents/Web/graph/src/shapes/graph.shape.peakintegration2d.js
 */

build['./shapes/graph.shape.peakintegration2d'] = ( function( GraphRect ) { 

  var lineHeight = 5;

  var GraphPeakIntegration2D = function( graph, options ) {

    this.options = options ||  {};
    this.init( graph );
    this.nbHandles = 4;

    this.createHandles( this.nbHandles, 'rect', {
      transform: "translate(-3 -3)",
      width: 6,
      height: 6,
      stroke: "black",
      fill: "white",
      cursor: 'nwse-resize'
    } );

  }
  $.extend( GraphPeakIntegration2D.prototype, GraphRect.prototype, {

    createDom: function() {
      this._dom = document.createElementNS( this.graph.ns, 'rect' );
      this._dom.element = this;
    },

    redrawImpl: function() {

      this.setPosition();
      this.setHandles();
      this.setBindableToDom( this._dom );
    }

  } );

  return GraphPeakIntegration2D;

 } ) ( build["./shapes/graph.shape.rect"] );


// Build: End source file (shapes/graph.shape.peakintegration2d) 



;
/* 
 * Build: new source file 
 * File name : shapes/graph.shape.peakinterval
 * File path : /Users/normanpellet/Documents/Web/graph/src/shapes/graph.shape.peakinterval.js
 */

build['./shapes/graph.shape.peakinterval'] = ( function( GraphLine ) { 

  
  var GraphPeakInterval = function( graph ) {
    this.init( graph );
  }

  $.extend( GraphPeakInterval.prototype, GraphLine.prototype, {
    createDom: function() {
      this._dom = document.createElementNS( this.graph.ns, 'line' );
      this._dom.setAttribute( 'marker-end', 'url(#verticalline' + this.graph._creation + ')' );
      this._dom.setAttribute( 'marker-start', 'url(#verticalline' + this.graph._creation + ')' );
    },

    setLabelPosition: function( labelIndex )  {
      var pos1 = this._getPosition( this.getFromData( 'pos' ) );
      var pos2 = this._getPosition( this.getFromData( 'pos2' ), this.getFromData( 'pos' ) );

      this._setLabelPosition( labelIndex, this._getPosition( this.get( 'labelPosition', labelIndex ), {
        x: ( pos1.x + pos2.x ) / 2 + "px",
        y: ( pos1.y + pos2.y ) / 2 + "px"
      } ) );

    },

    afterDone: function() {

    }
  } );

  return GraphPeakInterval;

 } ) ( build["./shapes/graph.shape.line"] );


// Build: End source file (shapes/graph.shape.peakinterval) 



;
/* 
 * Build: new source file 
 * File name : shapes/graph.shape.peakinterval2
 * File path : /Users/normanpellet/Documents/Web/graph/src/shapes/graph.shape.peakinterval2.js
 */

build['./shapes/graph.shape.peakinterval2'] = ( function( GraphLine ) { 

  
  var lineHeight = 5;

  var GraphPeakInterval2 = function( graph, options ) {

    this.options = options ||  {};
    this.init( graph );
    this.nbHandles = 2;
    this.createHandles( this.nbHandles, 'rect', {
      transform: "translate(-3 -3)",
      width: 6,
      height: 6,
      stroke: "black",
      fill: "white",
      cursor: 'nwse-resize'
    } );

  }
  $.extend( GraphPeakInterval2.prototype, GraphLine.prototype, {

    createDom: function() {
      this._dom = document.createElementNS( this.graph.ns, 'line' );
      this.line1 = document.createElementNS( this.graph.ns, 'line' );
      this.line2 = document.createElementNS( this.graph.ns, 'line' );

      this.group.appendChild( this.line1 );
      this.group.appendChild( this.line2 );

      this.line1.setAttribute( 'stroke', 'black' );
      this.line2.setAttribute( 'stroke', 'black' );

      this._dom.element = this;
    },

    redrawImpl: function() {

      this.setPosition();
      this.setPosition2();
      this.setHandles();

      this.redrawLines( lineHeight );

      this.setBindableToDom( this._dom );
    },

    redrawLines: function( height ) {

      var xs = this.findxs();

      var x1 = this._getPosition( {
        x: xs[ 0 ]
      } );
      var x2 = this._getPosition( {
        x: xs[ 1 ]
      } );

      if ( x1.x && x2.x && this.currentPos2y && this.currentPos1y ) {
        this.line1.setAttribute( 'x1', x1.x );
        this.line1.setAttribute( 'x2', x1.x );

        this.line2.setAttribute( 'x1', x2.x );
        this.line2.setAttribute( 'x2', x2.x );

        this.setLinesY( height );
      }

    },

    setLinesY: function( height ) {

      this.line1.setAttribute( 'y1', this.currentPos2y - height );
      this.line1.setAttribute( 'y2', this.currentPos2y + height );

      this.line2.setAttribute( 'y1', this.currentPos1y - height );
      this.line2.setAttribute( 'y2', this.currentPos1y + height );

    },

    findxs: function() {

      var posXY = this._getPosition( this.getFromData( 'pos' ) ),
        posXY2 = this._getPosition( this.getFromData( 'pos2' ), this.getFromData( 'pos' ) ),
        w = Math.abs( posXY.x - posXY2.x ),
        x = Math.min( posXY.x, posXY2.x );

      this.reversed = x == posXY2.x;

      if ( w < 2 || x + w < 0 || x > this.graph.getDrawingWidth() ) {
        return false;
      }

      var v1 = this.serie.searchClosestValue( this.getFromData( 'pos' ).x ),
        v2 = this.serie.searchClosestValue( this.getFromData( 'pos2' ).x ),
        v3,
        i,
        j,
        init,
        max,
        k,
        x,
        y,
        firstX,
        firstY,
        currentLine = "",
        maxY = 0,
        minY = Number.MAX_VALUE;

      if ( !v1 || !v2 ) {
        return false;
      }

      if ( v1.xBeforeIndex > v2.xBeforeIndex ) {
        v3 = v1;
        v1 = v2;
        v2 = v3;
      }

      var firstX, firstY, lastX, lastY, sum = 0,
        diff;
      var ratio = this.scaling;
      var points = [];
      var sums = [],
        xs = [];

      for ( i = v1.dataIndex; i <= v2.dataIndex; i++ ) {

        init = i == v1.dataIndex ? v1.xBeforeIndexArr : 0;
        max = i == v2.dataIndex ? v2.xBeforeIndexArr : this.serie.data[ i ].length;
        k = 0;

        for ( j = init; j <= max; j += 2 ) {

          x = this.serie.data[ i ][ j + 0 ],
          y = this.serie.data[ i ][ j + 1 ];

          if ( !firstX ) {
            firstX = x;
            firstY = y;
          }

          if ( lastX == undefined ) {
            lastX = x;
            lastY = y;
          }

          sum += Math.abs( ( x - lastX ) * ( y - lastY ) * 0.5 );
          sums.push( sum );
          xs.push( x );

          lastX = x;
          lastY = y;

          k++;
        }

        this.lastX = x;
        this.lastY = y;

        if ( !firstX || !firstY || !this.lastX || !this.lastY ) {
          return false;
        }
      }

      if ( sum == 0 ) {
        return [ firstX, lastX ];
      }

      var limInf = 0.05 * sum,
        limSup = 0.95 * sum,
        xinf = false,
        xsup = false;

      for ( var i = 0, l = sums.length; i < l; i++ ) {

        if ( sums[ i ] > limInf ) {
          xinf = i;
          break;
        }
      }

      for ( var i = sums.length; i > 0; i-- ) {

        if ( sums[ i ] < limSup ) {
          xsup = i;
          break;
        }
      }

      return [ xs[ xinf ], xs[ xsup ] ];
    },

    highlight: function() {

      if ( this.isBindable() ) {
        this._dom.setAttribute( 'stroke-width', '5' );
        this.setLinesY( lineHeight + 2 );
      }
    },

    unhighlight: function() {

      if ( this.isBindable() ) {
        this.setStrokeWidth();
        this.setLinesY( lineHeight );
      }
    }
  } );

  return GraphPeakInterval2;
 } ) ( build["./shapes/graph.shape.line"] );


// Build: End source file (shapes/graph.shape.peakinterval2) 



;
/* 
 * Build: new source file 
 * File name : shapes/graph.shape.rangex
 * File path : /Users/normanpellet/Documents/Web/graph/src/shapes/graph.shape.rangex.js
 */

build['./shapes/graph.shape.rangex'] = ( function( GraphSurfaceUnderCurve ) { 

  var GraphRangeX = function( graph ) {
    this.init( graph );
  };
  $.extend( GraphRangeX.prototype, GraphSurfaceUnderCurve.prototype, {

    createDom: function() {
      this._dom = document.createElementNS( this.graph.ns, 'rect' );
      this._dom.setAttribute( 'class', 'rangeRect' );
      this._dom.setAttribute( 'cursor', 'move' );
      this.handle1 = this._makeHandle();
      this.handle2 = this._makeHandle();

      this.setDom( 'cursor', 'move' );
      this.doDraw = undefined;
    },

    setPosition: function() {
      var posXY = this._getPosition( this.getFromData( 'pos' ) ),
        posXY2 = this._getPosition( this.getFromData( 'pos2' ), this.getFromData( 'pos' ) ),
        w = Math.abs( posXY.x - posXY2.x ),
        x = Math.min( posXY.x, posXY2.x );
      this.reversed = x == posXY2.x;

      if ( w < 2 || x + w < 0 || x > this.graph.getDrawingWidth() ) {
        return false;
      }

      this.group.appendChild( this.handle1 );
      this.group.appendChild( this.handle2 );

      this.handle1.setAttribute( 'transform', 'translate(' + ( x - 6 ) + " " + ( ( this.graph.getDrawingHeight() - this.graph.shift[ 0 ] ) / 2 - 10 ) + ")" );
      this.handle2.setAttribute( 'transform', 'translate(' + ( x + w - 6 ) + " " + ( ( this.graph.getDrawingHeight() - this.graph.shift[ 0 ] ) / 2 - 10 ) + ")" );
      this.setDom( 'x', x );
      this.setDom( 'width', w );
      this.setDom( 'y', 0 );
      this.setDom( 'height', this.graph.getDrawingHeight() - this.graph.shift[ 0 ] );

      return true;
    },

    _makeHandle: function() {

      var rangeHandle = document.createElementNS( this.graph.ns, 'g' );
      rangeHandle.setAttribute( 'id', "rangeHandle" + this.graph._creation );
      var r = document.createElementNS( this.graph.ns, 'rect' );
      r.setAttribute( 'rx', 0 );
      r.setAttribute( 'ry', 0 );
      r.setAttribute( 'stroke', 'black' );
      r.setAttribute( 'fill', 'white' );

      r.setAttribute( 'width', 10 );
      r.setAttribute( 'height', 20 );
      r.setAttribute( 'x', 0 );
      r.setAttribute( 'y', 0 );
      r.setAttribute( 'shape-rendering', 'crispEdges' );
      r.setAttribute( 'cursor', 'ew-resize' );
      rangeHandle.appendChild( r );

      var l = document.createElementNS( this.graph.ns, 'line' );
      l.setAttribute( 'x1', 4 );
      l.setAttribute( 'x2', 4 );
      l.setAttribute( 'y1', 4 );
      l.setAttribute( 'y2', 18 );
      l.setAttribute( 'stroke', 'black' );
      l.setAttribute( 'shape-rendering', 'crispEdges' );
      l.setAttribute( 'cursor', 'ew-resize' );
      rangeHandle.appendChild( l );

      var l = document.createElementNS( this.graph.ns, 'line' );
      l.setAttribute( 'x1', 6 );
      l.setAttribute( 'x2', 6 );
      l.setAttribute( 'y1', 4 );
      l.setAttribute( 'y2', 18 );
      l.setAttribute( 'stroke', 'black' );
      l.setAttribute( 'shape-rendering', 'crispEdges' );
      l.setAttribute( 'cursor', 'ew-resize' );
      rangeHandle.appendChild( l );

      return rangeHandle;
    }
  } );

  return GraphRangeX;
 } ) ( build["./shapes/graph.shape.areaundercurve"] );


// Build: End source file (shapes/graph.shape.rangex) 



;
/* 
 * Build: new source file 
 * File name : shapes/graph.shape.cross
 * File path : /Users/normanpellet/Documents/Web/graph/src/shapes/graph.shape.cross.js
 */

build['./shapes/graph.shape.cross'] = ( function( GraphShape ) { 

  var GraphCross = function( graph, options ) {

    this.options = options ||  {};

    this.init( graph );

    this.nbHandles = 1;

    this.createHandles( this.nbHandles, 'rect', {
      transform: "translate(-3 -3)",
      width: 6,
      height: 6,
      stroke: "black",
      fill: "white",
      cursor: 'nwse-resize'
    } );

  }

  $.extend( GraphCross.prototype, GraphShape.prototype, {

    getLength: function() {
      return this.options.length || 10;
    },

    createDom: function() {

      this._dom = document.createElementNS( this.graph.ns, 'path' );
      this._dom.setAttribute( 'd', 'M -' + ( this.getLength() / 2 ) + ' 0 h ' + ( this.getLength() ) + ' m -' + ( this.getLength() / 2 ) + ' -' + ( this.getLength() / 2 ) + ' v ' + ( this.getLength() ) + '' );

    },

    setPosition: function() {
      var position = this._getPosition( this.getFromData( 'pos' ) );

      if ( !position.x || !position.y ) {
        return;
      }

      this.setDom( 'transform', 'translate( ' + position.x + ', ' + position.y + ')' );

      this.currentPos1x = position.x;
      this.currentPos1y = position.y;

      return true;
    },

    redrawImpl: function() {

      this.setPosition();
      this.setHandles();

    },

    handleCreateImpl: function() {

      return;
    },

    handleMouseDownImpl: function( e ) {

      this.moving = true;

      return true;
    },

    handleMouseUpImpl: function() {

      this.triggerChange();
      return true;
    },

    handleMouseMoveImpl: function( e, deltaX, deltaY, deltaXPx, deltaYPx ) {

      if ( this.isLocked() ) {
        return;
      }

      var pos = this.getFromData( 'pos' );
      var pos2 = this.getFromData( 'pos2' );

      if ( this.moving ) {

        pos.x = this.graph.deltaPosition( pos.x, deltaX, this.serie.getXAxis() );
        pos.y = this.graph.deltaPosition( pos.y, deltaY, this.serie.getYAxis() );
      }

      this.redrawImpl();

      return true;

    },

    setHandles: function() {

      if ( this.isLocked() ) {
        return;
      }

      if ( !this._selected || this.currentPos1x == undefined ) {
        return;
      }

      this.addHandles();

      this.handle1.setAttribute( 'x', this.currentPos1x );
      this.handle1.setAttribute( 'y', this.currentPos1y );
    },

    selectStyle: function() {
      this.setDom( 'stroke', 'red' );
      this.setDom( 'stroke-width', '2' );
    }

  } );

  return GraphCross;

 } ) ( build["./shapes/graph.shape"] );


// Build: End source file (shapes/graph.shape.cross) 



;
/* 
 * Build: new source file 
 * File name : shapes/graph.shape.zoom2d
 * File path : /Users/normanpellet/Documents/Web/graph/src/shapes/graph.shape.zoom2d.js
 */

build['./shapes/graph.shape.zoom2d'] = ( function( GraphShape ) { 

  var Zoom2DShape = function( graph, options ) {

    this.init( graph );
    this.options = options ||  {};
    this.series = [];
  }


  $.extend( Zoom2DShape.prototype, GraphShape.prototype, {

    createDom: function() {
      this._dom = document.createElementNS( this.graph.ns, 'g' );

      var rect = document.createElementNS( this.graph.ns, 'rect');
      rect.setAttribute('rx', 3 );
      rect.setAttribute('ry', 3 );

      rect.setAttribute('height', 100 );
      rect.setAttribute('width', 6 );
      rect.setAttribute('fill', 'rgb(150, 140, 180)' );
      rect.setAttribute('stroke', 'rgb( 40, 40, 40 )' );
      rect.setAttribute('stroke-width', '1px' );
      rect.setAttribute('x', 0 );
      rect.setAttribute('y', 0 );

      this.rect = rect;

      
      this._dom.appendChild( rect );

      var handlePos = document.createElementNS( this.graph.ns, 'rect');
      
      handlePos.setAttribute('height', 5 );
      handlePos.setAttribute('width', 12 );
      handlePos.setAttribute('fill', 'rgb(190, 180, 220)' );
      handlePos.setAttribute('stroke', 'rgb( 40, 40, 40 )' );
      handlePos.setAttribute('stroke-width', '1px' );
      handlePos.setAttribute('x', -3 );
      handlePos.setAttribute('y', 0 );
      handlePos.setAttribute('class', 'positive');
      handlePos.setAttribute('cursor', 'pointer' );


      var handleNeg = document.createElementNS( this.graph.ns, 'rect');
      
      handleNeg.setAttribute('height', 5 );
      handleNeg.setAttribute('width', 12 );
      handleNeg.setAttribute('fill', 'rgb(190, 180, 220)' );
      handleNeg.setAttribute('stroke', 'rgb( 40, 40, 40 )' );
      handleNeg.setAttribute('stroke-width', '1px' );
      handleNeg.setAttribute('x', -3 );
      handleNeg.setAttribute('y', 0 );
      handleNeg.setAttribute('class', 'negative');
      handleNeg.setAttribute('cursor', 'pointer' );

      this._dom.appendChild( handlePos );
      this._dom.appendChild( handleNeg );

      this.handlePos = handlePos;
      this.handleNeg = handleNeg;
    },

    setPosition: function() {
      var position = this._getPosition( this.getFromData( 'pos' ) );

      if ( !position || !position.x || !position.y ) {
        return;
      }

      this.setDom( 'transform', 'translate(' + position.x +', ' + position.y + ')' );
      return true;
    },

    setHandleNeg: function( value, max ) {

      this.handleNeg.setAttribute( 'y', ( value ) * 45 + 55 )
    },

    setHandlePos: function( value, max ) {

      this.handlePos.setAttribute( 'y', ( 1- value  ) * 45 )
    },

    redrawImpl: function() {
      this.setPosition();
    },

    handleCreateImpl: function() {

      this.resize = true;
      this.handleSelected = 2;

    },

    handleMouseDownImpl: function( e ) {

      this.selected = e.target.getAttribute('class') == 'positive' ? 'positive' : ( e.target.getAttribute('class') == 'negative'  ? 'negative' : false );
      return true;
    },

    handleMouseUpImpl: function() {

      this.selected = false;
      this.triggerChange();
      return true;
    },

    addSerie: function( serie ) {
      this.series.push( serie );
    },

    handleMouseMoveImpl: function( e ) {

      
      var o = $(this._dom).offset();
      var cY = e.pageY - o.top;
//console.log( this.selected );


      if( this.selected == "negative" ) {

        if( cY > 100 ) {
          cY = 100;
        } else if( cY < 55) {
         cY = 55;
        } 

        //this.handleNeg.setAttribute('y', cY);
        //console.log( cY);
        cY = - ( cY - 55 ) / 45; 
        
        this.series.map( function ( s ) {
          s.onMouseWheel( false, false, cY, false );
        });


      }


      if( this.selected == "positive" ) {

        if( cY < 0 ) {
          cY = 0;
        } else if( cY > 45) {
          cY = 45;
        }

       // this.handlePos.setAttribute('y', cY);  
        cY = ( 45 - cY ) / 45;

        this.series.map( function ( s ) {
          s.onMouseWheel( false, false, cY, true );
        });


      }


      
    },

    selectStyle: function() {
      this.setDom( 'stroke', 'red' );
      this.setDom( 'stroke-width', '2' );
    },

    hideHandleNeg: function() {
      this.handleNeg.setAttribute('display', 'none');
      this.rect.setAttribute('height', 45);
    },

    showHandleNeg: function() {
      this.handleNeg.setAttribute('display', 'block');
      this.rect.setAttribute('height', 100);
    },

    setHandles: function() {}

  } );

  return Zoom2DShape;

 } ) ( build["./shapes/graph.shape"] );


// Build: End source file (shapes/graph.shape.zoom2d) 



;
/* 
 * Build: new source file 
 * File name : graph.toolbar
 * File path : /Users/normanpellet/Documents/Web/graph/src/graph.toolbar.js
 */

build['./graph.toolbar'] = ( function( ) { 

  var toolbarDefaults = {

    buttons: [ 'none', 'rect', 'line', 'areaundercurve' ]

  }

  var ns = 'http://www.w3.org/2000/svg';
  var nsxlink = "http://www.w3.org/1999/xlink";

  function makeSvg() {
    var dom = document.createElementNS( ns, 'svg' );
    dom.setAttributeNS( "http://www.w3.org/2000/xmlns/", "xmlns:xlink", "http://www.w3.org/1999/xlink" );
    dom.setAttribute( 'xmlns', ns );

    return dom;
  }

  function makeSvgLine() {

    var dom = makeSvg();

    var line = document.createElementNS( ns, 'line' );
    line.setAttribute( 'x1', 16 );
    line.setAttribute( 'y1', 3 );
    line.setAttribute( 'x2', 4 );
    line.setAttribute( 'y2', 15 );

    line.setAttribute( 'stroke', '#aa0000' );

    dom.appendChild( line );
    return dom;
  }

  function makeSvgRect() {

    var dom = makeSvg();
    var line = document.createElementNS( ns, 'rect' );
    line.setAttribute( 'x', 4 );
    line.setAttribute( 'y', 4 );
    line.setAttribute( 'width', 12 );
    line.setAttribute( 'height', 12 );
    line.setAttribute( 'stroke', 'black' );
    line.setAttribute( 'fill', '#dd0000' );

    dom.appendChild( line );
    return dom;
  }

  function makeSvgAUC() {

    var pathD = "M 4,18 C 8,10 14,1 18,18";

    var dom = makeSvg();
    var path1 = document.createElementNS( ns, 'path' );
    path1.setAttribute( 'd', pathD );
    path1.setAttribute( 'stroke', "black" );
    path1.setAttribute( 'fill', "transparent" );

    var path2 = document.createElementNS( ns, 'path' );
    path2.setAttribute( 'd', pathD + " Z" );
    path2.setAttribute( 'stroke', "red" );
    path2.setAttribute( 'fill', "rgba(255, 0, 0, 0.1)" );

    dom.appendChild( path2 );
    dom.appendChild( path1 );

    return dom;

  }

  var Toolbar = function( graph, options ) {

    var self = this;

    this.options = $.extend( true, {}, toolbarDefaults, options );
    this.graph = graph;
    this.div = $( "<ul />" ).addClass( 'graph-toolbar' );

    this.graph.getPlugin( './graph.plugin.shape' ).then( function( plugin ) {

      self.plugin = plugin;

      if ( !self.plugin ) {
        return;
      }

      self.div.on( 'click', 'li', function() {

        var shape = $( this ).attr( 'data-shape' );
        self.plugin.setShape( shape );

        $( this ).parent().children().removeClass( 'selected' );
        $( this ).addClass( 'selected' );
      } );

      self.makeButtons();
    } );
  };

  Toolbar.prototype = {

    makeButtons: function() {

      var self = this;
      for ( var i = 0, l = this.options.buttons.length; i < l; i++ ) {

        this.div.append( this.makeButton( this.options.buttons[ i ] ) );
      }
    },

    makeButton: function( button ) {

      var div = $( "<li />" );
      switch ( button ) {

        case 'line':
          div
            .html( makeSvgLine() )
            .attr( 'data-shape', 'line' );
          break;

        case 'rect':
          div
            .html( makeSvgRect() )
            .attr( 'data-shape', 'rect' );
          break;

        case 'areaundercurve':
          div
            .html( makeSvgAUC() )
            .attr( 'data-shape', 'areaundercurve' );
          break;
      }

      return div;
    },

    getDom: function() {
      return this.div;
    }

  };

  return Toolbar;

 } ) (  );


// Build: End source file (graph.toolbar) 



;
/* 
 * Build: new source file 
 * File name : graph
 * File path : /Users/normanpellet/Documents/Web/graph/src/graph.js
 */

build[ './graph.core' ].getBuild = function( b ) { return build[ b ]; }
return build[ './graph.core' ];


// Build: End source file (graph) 



;


	};

	if( typeof define === "function" && define.amd ) {
		define( [ 'jquery' ], function( $ ) {
			return Graph( $ );
		});
	} else if( window ) {

		if( ! window.jQuery ) {
			throw "jQuery has not been loaded. Abort graph initialization."
			return;
		}

		window.Graph = Graph( window.jQuery );
	}

} ) );
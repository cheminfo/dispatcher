define(['require', 'jquery', './title'], function(require, $, title) {

	var id = 0;
	var stack = {};

	$(document).on('click', '.form-button', function(event) {
		var btn = stack[$(this).data('id')];
		if( btn && ! btn.isDisabled( ) ) {
			btn.doClick(event, $(this));
		}
	});

	var button = function(label, onclick, options) {
		this.title = new title(label);
		this.onclick = onclick;
		this.id = ++id;
		this.value = false;
		/*
		if(typeof onclick !== "function" && !options)
			this.options = onclick;
		else
			this.options = options || {};
*/

		this.options = options || {};
		// Store button in the stack
		stack[this.id] = this;
	};

	button.prototype = {
		getTitle: function() { return this.title; },

		setTitle: function(objtitle) {
			
			if( ! ( objtitle instanceof title ) ) {
				objtitle = new title( objtitle );
			}

			this.title = objtitle;
			this.applyStyle( );
		},
		getId: function() {
			return this.id;
		},
		setOnClick: function(func) {
			this.onclick = func;
		},
		setColor: function(color) {
			this.color = color;
			this.applyStyle();
		},
		setValue: function( val ) {
			this.value = val;
		},
		setIcon: function(icon) {
			this.icon = icon;
		},

		render: function() {
			var html = "";
			html += '<div class="form-button';
			html += '" data-id="';
			html += this.id;
			html += '" id="button-' + this.id + '"><span /><span />';
			html += '</div>';
			
			this.dom = $(html);

			this.applyStyle();
			return this.dom;
		},

		applyStyle: function() {

			if( ! this.dom ) {
				return;
			}

			if( this.options.color ) {
				this.dom.addClass(this.options.color);
			}

			if( this.options.disabled ) {
				this.dom.addClass( 'disabled' );
			} else {
				this.dom.removeClass('disabled' );
			}

			if(this.options.checkbox) {
				if( this.value ) {
					this.dom.addClass('bi-active');
				} else {
					this.dom.removeClass('bi-active');
				}
			}

			this.dom.children().eq(1).html(this.title.getLabel());

			if( this.icon ) {
				this.dom.children().eq(0).html('<img src="' + require.toUrl('./images/' + this.icon + '.png') + '" />');
			}
				
		},

		doClick: function(event, item) {

			this.value = !this.value;
			this.applyStyle();
			if(this.onclick)
				this.onclick(event, this.value, item);
		},

		getDom: function() {
			if(!this.dom) {
				console.warn("The button dom has not been created yet");
				return;
			}
			return this.dom;
		},

		disable: function() {
			this.options.disabled = true;
			this.applyStyle();
		},

		enable: function() {
			this.options.disabled = false;
			this.applyStyle();
		},

		isDisabled: function() {
			return this.options.disabled;
		}
	}

	return button;
});

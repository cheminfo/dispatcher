define(['jquery', 'components/superagent/superagent', 'src/header/components/default', 'src/util/versioning', 'forms/button', 'src/util/util', 'fancytree', 'components/jquery-ui-contextmenu/jquery.ui-contextmenu.min'], function($, superagent, Default, Versioning, Button, Util) {
    var Element = function() {};
    $.extend(Element.prototype, Default, {
        initImpl: function () {
            this.id = Util.getNextUniqueId();
            $.ui.fancytree.debugLevel = 0;
        },
        _onClick: function() {
            console.log('on click');
            this.createMenu();

        },

        createMenu: function() {
            var that = this;
            if(!this.$_elToOpen) {
                this.$_elToOpen = $("<div>").css("width", 550);
                this.$tree = $('<div></div>').css('id', this.cssId('tree'));
                this.$_elToOpen.append(this.$tree);
            }

            this.setStyleOpen(this._open);
            if(this._open) {
                this.open();
                this.initTree().then(this.createButtons);

            }
            else {
                console.log('close');
                this.close();
            }
        },

        cssId: function(name) {
            return "ci-navview-header-" + this.id + "-" + name;
        },

        load: function(name) {
            console.log('load', name);
        },

        save: function() {
            console.log('save');
        },

        mkdir: function() {
            console.log('make dir');
        },

        loadRootTree: function() {
            console.log('load tree');
            return $.ajax({
                url: '/navview/list',
                dataType: 'json'
            });

        },

        initTree: function() {
            var that = this;
            return this.loadRootTree().then(function(res) {
                var source = fancyTreeDirStructure(res);
                that.$tree.fancytree({
                    source: source,
                    lazyLoad: function(event, data) {
                        data.result = $.ajax({
                            url: '/navview/list?dir=' + data.node.key,
                            dataType: 'json'
                        }).then(fancyTreeDirStructure);
                    },
                    activate: function(event, data) {
                        console.log('click node');
                    },
                    dblclick: function(event, data) {
                        console.log('dbl click');
                        console.log(data);
                        Versioning.switchView({
                            view: {
                                url:  data.node.data.url
                            }
                        }, true);
                    }
                });
            });
        },

        createButtons: function() {
            console.log('create buttons');
            var that = this;
            this.$_elToOpen.append($("<p>").append('<input type="text" id="' + this.cssId("docName") + '"/>')
                    .append(new Button('Save data', function() {
                        that.save("Data", that.getFormContent("docName"));
                    }, {color: 'red'}).render())
                    .append(new Button('Save view', function() {
                        that.save("View", that.getFormContent("docName"));
                    }, {color: 'red'}).render())
                    .append(new Button('Mkdir', function() {
                        that.mkdir(that.getFormContent("docName"));
                    }, {color: 'blue'}).render())
            );
        }
    });

    return Element;
});

function fancyTreeDirStructure(list) {
    return list.map(function(el) {
        return {
            title: el.name,
            folder: el.isDir,
            lazy: el.isDir,
            key: el.rel + el.name,
            data: {
                url: el.url
            }
        }
    });
}
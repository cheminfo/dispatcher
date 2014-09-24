define(['jquery', 'components/superagent/superagent', 'src/header/components/default', 'src/util/versioning', 'forms/button', 'src/util/util', 'fancytree', 'components/jquery-ui-contextmenu/jquery.ui-contextmenu.min'], function($, superagent, Default, Versioning, Button, Util) {
    var menu = '<ul id="myMenu" class="contextMenu ui-helper-hidden">\n    <li class="edit"><a href="#edit">Edit</a></li>\n    <li class="cut"><a href="#cut">Cut</a></li>\n    <li class="copy"><a href="#copy">Copy</a></li>\n    <li class="paste"><a href="#paste">Paste</a></li>\n    <li class="ui-state-disabled"><a href="#delete">Delete</a></li>\n    <li>---</li>\n    <li class="quit"><a href="#quit">Quit</a></li>\n    <li><a href="#save"><span class="ui-icon ui-icon-disk"></span>Save</a></li>\n</ul>';
    var Element = function() {};
    $.extend(Element.prototype, Default, {
        initImpl: function () {
            this.id = Util.getNextUniqueId();
            $.ui.fancytree.debugLevel = 0;
        },
        _onClick: function() {
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
                this.initTree().then(function() {
                    that.createButtons();
                });

            }
            else {
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
            var that = this;
            console.log('save');
            var dir = this.activeNode.data.path;
            console.log(dir);
            dir = dir.replace(new RegExp(/\/[^\/]+$/), '/');
            console.log('dir to save', dir);
            var req = $.ajax({
                url: '/navview/save',
                data: {
                    dir: dir,
                    name: this.getFormContent('docName'),
                    content: Versioning.getViewJSON("\t")
                },
                type: 'POST',
                dataType: 'json'
            });

            req.done(function() {
                that.log('success-log', 'Successfully saved view');
                that.reloadTree();
            });
            req.fail(function() {
                that.log('error-log', 'Failed to save view');
            });
        },

        mkdir: function() {
            var that = this;
            console.log('make dir');
            var dir = this.activeNode.data.path;
            var name = this.getFormContent('docName');
            if(dir && name) {
                var req = $.ajax({
                    url: '/navview/mkdir',
                    type: 'POST',
                    data: {
                        dir: dir,
                        name: name
                    },
                    dataType: 'json'
                });
                req.done(function() {
                    that.log('success-log', 'Successfully created directory');
                    that.reloadTree();
                });
                req.fail(function() {
                    that.log('error-log', 'Failed create directory');
                });
            }
        },

        reloadTree: function() {
            this.initTree();
        },

        rename: function() {
            var that = this;
            console.log('rename');
            var reg = new RegExp(/(^.*)\/([^\/]+$)/);

            var m = reg.exec(this.activeNode.data.path);
            if(!m.length === 3) {
                this.log('error-log', 'Invalid path...');
                return;
            }

            var dir = m[1];
            var newName = this.getFormContent('docName');
            var newDir = dir;
            var name = m[2];

            console.log(dir, name);

            var req = $.ajax({
                url: '/navview/rename',
                type: 'PUT',
                data:{
                    dir: dir,
                    newDir: newDir,
                    name: name,
                    newName: newName
                },
                dataType: 'json'
            });

            req.done(function() {
                that.log('success-log', 'Successfully renamed file');
                that.reloadTree();
            });
            req.fail(function() {
                that.log('error-log', 'Failed to rename file');
            });
        },

        duplicate: function() {
            console.log('duplicate');
        },

        log: function(name, text) {

            var $log = $('#'+ this.cssId(name));
            console.log('log', $log);
            $log.html(text);
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
                            url: '/navview/list?dir=' + data.node.data.path,
                            dataType: 'json'
                        }).then(fancyTreeDirStructure);
                    },
                    activate: function(event, data) {
                        that.activeNode = data.node;
                        that.setFormContent('docName', data.node.title);
                    },
                    dblclick: function(event, data) {
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
            var that = this;
            if(this._buttons) return;
            this.$_elToOpen.append($("<p>").append('<input type="text" id="' + this.cssId("docName") + '"/>')
                    .append('<br/>')
                    .append(new Button('Save view', function() {
                        that.save("View", that.getFormContent("docName"));
                    }, {color: 'red'}).render())
                    .append(new Button('Mkdir', function() {
                        that.mkdir(that.getFormContent("docName"));
                    }, {color: 'blue'}).render())
                    .append(new Button('Duplicate view', function() {
                        that.duplicate(that.getFormContent("docName"))
                    }, {color: 'gray'}).render())
                    .append(new Button('Rename view', function() {
                        that.rename(that.getFormContent("docName"))
                    }, {color: 'gray'}).render())
            );

            this.$_elToOpen.append($("<div/>").attr('id', this.cssId('error-log')).css('color', 'red'));
            this.$_elToOpen.append($("<div/>").attr('id', this.cssId('success-log')).css('color', 'green'));
            //this.$_elToOpen.append(menu);
            this._buttons = true;
        },

        getFormContent: function(type) {
            return $("#" + this.cssId(type)).val().trim();
        },
        setFormContent: function(type, value) {
            $("#" + this.cssId(type)).val(value);
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
                url: el.url,
                path: el.rel + el.name
            }
        }
    });
}
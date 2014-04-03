/**
 * Created by cgx on 14-4-2.
 */
(function (window) {

    function sub(str, data) {
        return str.replace(/{(.*?)}/igm, function ($, $1) {
            //                return data[$1] ? data[$1] : '';
            return data[$1] || '';
        });
    }

    /********from coffee*************/
    var __super,
        __hasProp = {}.hasOwnProperty,
        __extends = function (child, parent) {
            for (var key in parent) {
                if (__hasProp.call(parent, key)) child[key] = parent[key];
            }
            if (typeof parent === 'object') return;

            function Ctor() {
                this.constructor = child;
            }

            child.Init = function (o) {
                this.init(o);
            };
            child.__super__ = Ctor.prototype = parent.prototype;
            child.fn = child.Init.prototype = child.prototype = new Ctor();
            return child;
        };
    /************************/
    __super = (function () {
        function __super() {
        }

        __super.prototype.init = function (o) {
            this.init(o);
        };
        return __super;
    })();

    var iRoom;

    iRoom = (function (_super) {
        __extends(iRoom, _super);

        function iRoom() {
            return new iRoom.Init();
        }

        __extends(iRoom.fn, {
            init      : function () {
                this.listItemTpl = '<li style="z-index:{index}" type="{type}"><img src="{thumb}" index="{index}" id="{id}" moudel="{moudel}" /></li>';
                this.mask = $('.mask');
                this.loading = $('.loading');
                this.container = $('.clothes');
                this.types = $('li', '.types');
                this.clothesListBox = $('.clothes-list-box').addClass('out slideup');
                this.clothesList = $('.clothes-list');
                this.dressing = [];
                this.type = null;
                this.bind();
            },
            bind      : function () {
                var self = this;
                this.types.bind('click', function (event) {
                    self.loadstart('mask');
                    self.type = $(this).attr('type');
//              todo  按类型取数据, 分页

                    var src = 'js/test.json?p=' + self.type;

                    $.getJSON(
                        src,
                        function (data) {
                            setTimeout(function () {
                                self.loadend('mask');
                                self.renderList(data);
                            }, 300);

                        });
                });

                this.clothesList.delegate('img', 'click', function () {

                    var id = $(this).attr('id');
                    var moudel = $(this).attr('moudel');
                    var index = $(this).attr('index');
                    self.clothesListBox.removeClass('in').addClass('out');
                    self.putOn({
                        id   : id,
                        thumb: moudel,
                        index: index,
                        type : self.type
                    });
                });

//               todo 分页等json搞好，一次性全部获取json再分页，或者按照页数取json
                $('.btn', this.clothesListBox).bind('click', function () {

                    if ($(this).hasClass('prev')) {

                    }
                    if ($(this).hasClass('next')) {

                    }

//                    var data = this.getData(self.type, page);
//                    this.renderList(data)
                });
            },
            putOn     : function (data) {
                var img = sub(this.listItemTpl, data);
                //todo  index

                if ($.inArray(data.id, this.dressing) == -1) {

                    this.undress(data);
                    this.dressing.push(data.id);
                    this.container.append(img);
                } else {

                }
            },
            getData   : function (type, page, callback) {
                var self = this;
                var src = 'js/test.json?p=' + type;
                $.getJSON(
                    src,
                    function (data) {
                        setTimeout(function () {
                            self.loadend('mask');
                            self.renderList(data);

                            if($.isFunction(callback)){
                                callback(data);
                            }
                            return data;
                        }, 300);

                    });

            },
            renderList: function (data) {
                var self = this;
                var innerHTML = '';
                if (data[self.type] && data[self.type].length > 0) {
                    $.each(data[self.type], function (i, item) {
                        item.type = self.type;
                        innerHTML += sub(self.listItemTpl, item);
                    });
                    self.clothesList.html(innerHTML);
                    self.clothesListBox.removeClass('out').addClass('in');
                }
            },
            loadstart : function (key) {
                this[key].show();
            },
            loadend   : function (key) {
                this[key].fadeOut('fast');
            },
            undress   : function (data) {
                var self = this;
//                todo 单件脱下
                $('li', this.container).each(function (i, li) {
                    if ($(li).css('z-index') == data.index && $(li).attr('type') == data.type) {
                        var id = $('img', li).attr('id');
                        var indexOf = self.dressing.indexOf(id);
                        self.dressing.splice(indexOf, 1);
                        $(li).remove();
                    }
                })
            },
            getDress  : function () {

                return this.dressing;
            },
            clear     : function () {
                this.dressing = [];
                this.container.html('');
                return 'is clean.';
            }

        });
        return iRoom;
    })(__super);

    window.iRoom = iRoom;
})(window)

$(function () {

    var myRoom = iRoom();

    $('.btn-bind').bind('click', function () {
        var events = $(this).attr('event');

        console.log(myRoom[events]());
        return false;
    });


});
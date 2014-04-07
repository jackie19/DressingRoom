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


// 更新：
// 05.27: 1、保证回调执行顺序：error > ready > load；2、回调函数this指向img本身
// 04-02: 1、增加图片完全加载后的回调 2、提高性能
    /**
     * 图片头数据加载就绪事件 - 更快获取图片尺寸
     * @version  2011.05.27
     * @author  TangBin
     * @see    http://www.planeart.cn/?p=1121
     * @param  {String}  图片路径
     * @param  {Function}  尺寸就绪
     * @param  {Function}  加载完毕 (可选)
     * @param  {Function}  加载错误 (可选)
     * @example imgReady('http://www.google.com.hk/intl/zh-CN/images/logo_cn.png', function () {
    alert('size ready: width=' + this.width + '; height=' + this.height);
  });
     */
    var imgReady = (function () {
        var list = [], intervalId = null,

        // 用来执行队列
            tick = function () {
                var i = 0;
                for (; i < list.length; i++) {
                    list[i].end ? list.splice(i--, 1) : list[i]();
                }
                ;
                !list.length && stop();
            },

        // 停止所有定时器队列
            stop = function () {
                clearInterval(intervalId);
                intervalId = null;
            };

        return function (url, ready, load, error) {
            var onready, width, height, newWidth, newHeight,
                img = new Image();

            img.src = url;

            // 如果图片被缓存，则直接返回缓存数据
            if (img.complete) {
                ready.call(img);
                load && load.call(img);
                return;
            }
            ;

            width = img.width;
            height = img.height;

            // 加载错误后的事件
            img.onerror = function () {
                error && error.call(img);
                onready.end = true;
                img = img.onload = img.onerror = null;
            };

            // 图片尺寸就绪
            onready = function () {
                newWidth = img.width;
                newHeight = img.height;
                if (newWidth !== width || newHeight !== height ||
                    // 如果图片已经在其他地方加载可使用面积检测
                    newWidth * newHeight > 1024
                    ) {
                    ready.call(img);
                    onready.end = true;
                }
                ;
            };
            onready();

            // 完全加载完毕的事件
            img.onload = function () {
                // onload在定时器时间差范围内可能比onready快
                // 这里进行检查并保证onready优先执行
                !onready.end && onready();

                load && load.call(img);

                // IE gif动画会循环执行onload，置空onload即可
                img = img.onload = img.onerror = null;
            };

            // 加入队列中定期执行
            if (!onready.end) {
                list.push(onready);
                // 无论何时只允许出现一个定时器，减少浏览器性能损耗
                if (intervalId === null) intervalId = setInterval(tick, 40);
            }
            ;
        };
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
                this.model = $('.model img');
                this.container = $('.clothes');
                this.types = $('li', '.types');
                this.clothesListBox = $('.clothes-list-box').addClass('out slideup');
                this.clothesList = $('.clothes-list');
                this.dressing = []; //正在穿的 id
                this.type = null; //服装类型：外套，衬衫...

                this.tip = $('<div class="tip"></div>"');

                this.sizeType = null; //屏幕与图片尺寸比例

                this.bind();

                this.setSize();
            },
            tipShow   : function (txt, speed) {
                this.tip.text(txt);
                this.tip.appendTo('body');

                setTimeout(this.tipRemove.bind(this), speed);
            },
            tipRemove : function () {
                this.tip.remove();
            },
            setSize   : function (elem) {
                var screen_p,
                    model,
                    self = this,
                    css = {};

                if (!this.sizeType) {
                    screen_p = window.outerWidth / window.outerHeight; // 720/1102
                    model = this.model[0].src;
                    self = this;

                    imgReady(model, function () {
                        var img_p = this.width / this.height;
                        if (img_p > screen_p) {
                            self.sizeType = 'width';
                        } else {
                            self.sizeType = 'height';
                        }
                        css[self.sizeType] = '100%';
                        css.visibility = 'visible';
                        self.model.css(css);
                    });
                } else {
                    css[self.sizeType] = '100%';
                    elem.css(css);
                }

            },
            bind      : function () {
                var self = this;
                this.types.bind('touchstart', function (event) {
                    event.stopPropagation();
                    event.preventDefault();
                });
//                显示衣服列表
                this.types.bind('click touchend tap', function (event) {
                    self.loadstart('mask');
                    self.type = $(this).attr('type');
//              todo  按类型取数据, 分页

                    var src = 'js/test.json?p=' + self.type;
//                    var src = 'js/'+ self.type +'.json?p=' + 0

                    $.getJSON(
                        src,
                        function (data) {
                            setTimeout(function () {
                                self.loadend('mask');
                                self.renderList(data);
                            }, 300);

                        });
                });

                this.clothesList.delegate('img', 'touchstart', function (event) {
                    event.stopPropagation();
                    event.preventDefault();
                });


//                点击试穿
                this.clothesList.delegate('img', 'tap click touchend', function () {

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
                $('.btn', this.clothesListBox).bind('tap click touchend', function () {

                    if ($(this).hasClass('close')) {
                        self.clothesListBox.removeClass('in').addClass('out');
                        return false;
                    }
                    if ($(this).hasClass('prev')) {

                    }
                    if ($(this).hasClass('next')) {

                    }

//                    var data = this.getData(self.type, page);
//                    this.renderList(data)
                });
            },
            putOn     : function (data) {
                var img = $(sub(this.listItemTpl, data)).hide();

                this.setSize($('img', img));


                if ($.inArray(data.id, this.dressing) == -1) {
                    this.undress(data);
                    this.dressing.push(data.id);
                    this.container.append(img.fadeIn('fast'));
                } else {
                    this.undress(data);
                }
            },
//            todo 供翻页使用，未集成
            getData   : function (type, page, callback) {

                var self = this;
                var src = 'js/' + self.type + '.json?p=' + page;
                self.loadstart('mask');
                $.getJSON(
                    src,
                    function (data) {
                        setTimeout(function () {
                            self.loadend('mask');
                            self.renderList(data);

                            if ($.isFunction(callback)) {
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
                    self.dressing.forEach(function (id) {

                        $.each($('img', self.clothesList), function () {
                            if (this.id == id) {
                                $(this).addClass('selected');
                            }
                        });
                    });
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
                var self = this,
                    li_zindex,
                    li_type;
//                todo 按类型脱单件
                $('li', this.container).each(function (i, li) {
                    li_zindex = $(li).css('z-index');
                    li_type = $(li).attr('type');
//                    去除同类型，同层级的
                    if (
                        (li_zindex == data.index && li_type == data.type)
                            ||
                            (typeof data.index == 'undefined' && li_type == data.type)
                        ) {
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
                return 'true';
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

        if (events == 'getDress') {
            //        todo 收藏 success callback
            if (myRoom[events]().length > 0) {
                myRoom.tipShow('收藏成功！', 600);

            } else {
                myRoom.tipShow('未试穿任何衣服！', 600);

            }
        }
        return false;
    });


});
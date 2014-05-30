/**
 * Created by cgx on 14-4-2.
 */
(function (window) {
    function getEventLayout(event) {
        var pos = {},
            $target = $(event.target),
            offset = $target.offset();
        pos.width = $target.outerWidth();
        pos.height = $target.outerHeight();
        pos.left = offset.left;
        pos.top = offset.top;
        return pos;
    }

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

    $.gui = {};
    //extend dropmenu:
    /*
     * Usage
     * var menu = new $.gui.dropmenu();
     * menu.init(options);
     * menu.show({event:event,data:[jsonObj[,jsonObj]});
     * */
    $.gui.dropmenu = {};

    var dropmenu;
    dropmenu = (function (_super) {
        __extends(dropmenu, _super);

        function dropmenu(options) {
            var opts;
            if (options) {
                opts = $.extend({}, $.gui.dropmenu.defaults, options);
            }
            return new dropmenu.Init(opts);
        }

        __extends(dropmenu.fn, {
            init: function (options) {
                if (options) {
                    this.opts = $.extend({}, $.gui.dropmenu.defaults, options);
                    if (!this.menu) {
                        this.createMenu();
                    }
                    if (Array.isArray(this.opts.data)) {
                        this.setHtml();
                    }
                }
                return this;
            },
            _init: function (options) {
                this.opts = $.extend(this.opts, options);
                if (Array.isArray(this.opts.data)) {
                    this.setHtml();
                }
                return this;
            },
            getEvent: function () {
                return this.opts.event;
            },
            getDom: function () {
                return this.menu[0];
            },
            createMenu: function () {
                this.menu = $(this.opts.menu);
                this.menu[0].id = this.opts.parentId;
                this.menu.appendTo(this.opts.appendTo);
                this.menu
                    .hide()
                    .css('position', 'absolute');

                if (this.opts.hideEvents) {
                    this.menu.bind(this.opts.hideEvents, this.hide.bind(this));
                }

                return this;
            },
            setHtml: function () {
                var innerHtml = '';
                this.opts.data.forEach(function (value) {
                    innerHtml += sub(this.opts.tpl, value);
                }, this);
                this.menu.html(innerHtml);
            },
            show: function (options) {
                if (!!options) {
                    this._init(options);
                }
                if (options.callback) {
                    options.callback();
                }
                return this.menu.show()
                    .offset(this.position());

            },
            position: function () {
                var eventPos = getEventLayout(this.opts.event),
                    menuTop,
                    menuLeft;
                switch (this.opts.position) {
                    case 'next':
                    case 'rightOf':
                        menuTop = eventPos.top;
                        menuLeft = eventPos.left + eventPos.width - 1;
                        break;
                    case 'below':
                        menuTop = eventPos.top + eventPos.height;
                        menuLeft = eventPos.left;
                        break;
                    case 'below_end':
                        menuTop = eventPos.top + eventPos.height;
                        menuLeft = eventPos.left - (this.menu.width() - eventPos.width);
                        break;

                    case 'above':
                        menuTop = eventPos.top - this.menu.height();
                        menuLeft = eventPos.left;
                        break;
                    case 'above_end'://todo
                    default:
                        menuTop = this.opts.position.top || 0;
                        menuLeft = this.opts.position.left || 0;
                        break;
                }
                return {
                    top: menuTop,
                    left: menuLeft
                };
            },
            hide: function () {
                return this.menu.fadeOut('fast');
            },
            destroy: function () {
                this.menu.remove();
                this.opts = null;
                this.menu = null;
            }

        });
        return dropmenu;

    })(__super);
    $.gui.dropmenu = dropmenu;

    $.gui.dropmenu.defaults = {
        parentId: 'Dropmenu',
        //        data: [{}], //jsonObj in Array : [ { text:"aa", id:"aa" }, { text:"bb", id:"bb" }]
        //        tpl:'', //html template : <li id="{id}">{text}</li>
        position: 'above', //String : next | below | below_end , Object: {top:1,left:1}
        menu: '<ul class="dropmenu"></ul>',
        className: 'dropmenu',
        hideEvents: 'touchend',//当菜单项 `touchend` 时隐藏
        appendTo: 'body'
    };

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
        };
    })();

    var iRoom;

    iRoom = (function (_super) {
        __extends(iRoom, _super);

        function iRoom() {
            return new iRoom.Init();
        }

        __extends(iRoom.fn, {
            init: function () {
                this.listItemTpl = '<li style="z-index:{index}" type="{type}"><img src="{thumb}" index="{index}" id="{id}" moudel="{moudel}" /></li>';
                this.favlistItemTpl = ' <li> <img src="{thumb}" alt="" class="fl" /> <div class="oh"> <div class="fr"> <div class="price">¥ {price}</div> <div class="del fav-btn" data-id="{id}">删除</div> </div> <div class="oh"> <p> <span class="grey">货号:</span> {id} </p> <p> <span class="grey">适合场合:</span> {situation} </p> <p> <span class="grey">尺码:</span> {size} </p> </div> </div> </li>';

                this.mask = $('.mask');
                this.loading = $('.loading');
                this.model = $('.model img');
                this.container = $('.clothes');
                this.types = $('li', '.types');//衣服类型菜单

                this.clothesListBox = $('.clothes-list-box');
                this.clothesList = $('.clothes-list');
                this.addFavBtn = $('.addFav');
                this.active = '.prev, .next, .dropmenu li,.return, .del'; //添加按下class
                this.coatType = [
                    {
                        type: '5',
                        text: '便西'
                    },
                    {
                        type: '6',
                        text: '单西'
                    },
                    {
                        type: '7',
                        text: '夹克'
                    },
                    {
                        type: '8',
                        text: '风衣'
                    }
                ]; //外套类型;

                this.undressMap = {
                    '1': '外套',
                    '5': '外套',
                    '6': '外套',
                    '7': '外套',
                    '8': '外套',
                    '3': '内衬',
                    '4': '鞋子',
                    '2': '裤子'
                }

                this.data = {}; //存储处理后的数据, {coat: [{id:1,price}...], shoes:[]...}
                this.dressing = []; //正在穿的 id
                this.fav = [];//收藏的衣服, 一个类型有一个.
                this.type = null; //服装类型：外套，衬衫...
                this.parentType = null;//子类型的父类型, 无子类型的等于自身
                this.imgSize = '640_960'; //大图尺寸
                this.tip = $('<div class="tip"></div>"');

                this.sizeType = null; //屏幕与图片尺寸比例
                this.pageCount = 1; // 翻页

                this.debug = false;

                if (this.debug) {
                    this.url = 'js/test.json?'; //json url
                    this.commendUrl = 'js/recommend.json' + '?version=' + Math.random() * 10; //推荐试穿地址

                    this.weixin_user_id = '123456';
                    this.urlCollection = {
                        get: 'js/fav.json?weixin_user_id=' + this.weixin_user_id,
                        add: 'js/fav.json?weixin_user_id=' + this.weixin_user_id,
                        del: 'js/fav.json?weixin_user_id=' + this.weixin_user_id
                    };
                    this.imgPath = 'images/';
                } else {
                    this.url = 'http://dkn.zhangdewen.com/?room=get_clothes';
                    //json url :http://dkn.zhangdewen.com/?room=get_clothes&page_index=1&c_id=5

                    this.commendUrl = 'http://dkn.zhangdewen.com/?room=get_recommend' + '&version=' + Math.random(); //推荐试穿地址

                    this.weixin_user_id = location.search.replace(/\?/,'').split('=')[1];

                    this.urlCollection = {
                        get: 'http://dkn.zhangdewen.com/?room=get_collection&weixin_user_id=' + this.weixin_user_id,
                        add: 'http://dkn.zhangdewen.com/?room=add_collection&weixin_user_id=' + this.weixin_user_id,
                        del: 'http://dkn.zhangdewen.com/?room=del_collection&weixin_user_id=' + this.weixin_user_id
                    };
                    this.imgPath = 'http://dkn.zhangdewen.com/room/images/';
                }




                this.startPage();

            },
            startPage: function () {
                var self = this;
                self.initWrap();

                var anim = function (call) {

                    $('.fit', '.start')
                        .animate({opacity: 1}, { queue: true, duration: 300 })
                        .animate({
                            top: 200
                        }, 650, function () {

                            $('.bg', '.start').animate({
//                            top: '-=25'
//                            ,left:'-=20'
//                            ,width:'+=40'
//                            ,height:'+=50'
                            }, 600, "linear", function () {

                                setTimeout(function () {
                                    $('.start').fadeOut('fast');
                                    call();
                                }, 1400);
                            });
                        });

                    $('.logo', '.start').animate({
                        textIndent: -50
                    }, {
                        step: function (now, fx) {
                            $(this).css('-webkit-transform', 'translateX(' + now + '%)');
                        }}, 500, "linear");
                };

                imgReady('style/images/fitbg.png', function () {

                }, function () {

                    $('.start').show();
                    anim(function () {
                        self.setSize();
                        self.recommend();
                        self.bind();

//                        fixme
                        self.pageCount = 1;//重新计算页数
                        self.type = self.coatType[0].type; //取上装列表
                        self.getData(self.type, self.pageCount, function (data) {
                            self.loadend('mask');
                            if (data.state) {
                                delete  data.state;
                                delete  data.message;
                                data = self.formatData(data);
                                self.renderList(data);

                                //获取 收藏
                                self.getData(
                                    0,0, function (favData) {

                                        if (favData.state) {
                                            delete  favData.state;
                                            delete  favData.message;
                                            self.fav = self.fav.concat(self.formatData(favData).list);
                                        }
                                    },
                                    self.urlCollection.get
                                )
                            }

                        });
                    });

                });

            },
            initWrap: function () {
                $('.wrap_room,.wrap_fav').css({
                    width: function () {
                        return window.innerWidth;
                    },
                    visibility: 'visible'
                });
                $('.wrap').css({
                    width: function () {
                        return window.innerWidth * 2;
                    }
                });
                //fixme test
//                $('.wrap_room').hide();

            },
            isInCoat: function (type) {
                var self = this;
                var idx = -1;
                self.coatType.forEach(function (obj, index) {
                    if (obj.type === type) {
                        idx = index;
                    }
                });
                return idx === -1 ? false : true;
            },
            recommend: function () {
                var self = this;

                self.loadstart('mask');
                $.getJSON(
                    self.commendUrl,
                    function (data) {
                        self.loadend('mask');
                        data = self.formatData(data); //{coat1:[]}
                        Object.keys(data).some(function (key) {

                            self.dataUpdate(key, data);//coat1, {coat1:[],shoes:[]};

                            data[key].forEach(function (cloth) {
                                self.putOn({
                                    id: cloth.id,
                                    thumb: cloth.moudel,
                                    index: cloth.index,
                                    type: key
                                });
                            });
                        });

                        return data;
                    });

            },
            tipShow: function (txt, speed) {
                this.tip.text(txt).hide();
                this.tip.appendTo('body').fadeIn('fast');

                setTimeout(this.tipRemove.bind(this), speed || 1000);
            },
            tipRemove: function () {
                this.tip.remove();
            },
            setSize: function (elem) {
                var screen_p,
                    model,
                    self = this,
                    css = {};

                if (!this.sizeType && !elem) {
                    screen_p = window.innerWidth / window.innerHeight; // 720/1102
                    model = this.model[0].src;

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
                }
                if (self.sizeType && elem) {
                    css[self.sizeType] = '100%';
                    elem.css(css);
                }

            },
            bind: function () {
                var self = this;
                var menu = new $.gui.dropmenu({ });

                $(document).delegate(self.active, 'touchstart', function (event) {
                    $(this).addClass('active');
                    event.stopPropagation();
                    event.preventDefault();
                });
                $(document).delegate(self.active, 'touchend', function (event) {
                    $(this).removeClass('active');
                });

                //
                this.types.bind('touchstart', function (event) {
                    $('li, a').removeClass('active');
                    $(this).addClass('active');
                    event.stopPropagation();
                    event.preventDefault();
                });
                this.addFavBtn.bind('touchstart', function (event) {
                    $('li, a').removeClass('active');
                    $(this).addClass('active');
                    event.stopPropagation();
                    event.preventDefault();
                });

                //底部菜单
                this.types.bind('touchend ', function (event) {

                    self.type = $(this).attr('type');
                    self.parentType = self.type; //显示子菜单,保留父类型

                    if (self.type == 1) { //coat 1
                        var width = $(this).width();
                        var menudata = self.coatType;
                        menu.show({
                            event: event,
                            data: menudata,
                            tpl: ' <li type="{type}" class="typesitem">{text}</li>',
                            callback: function () {
                                menu.menu.width(width);
                            }
                        });
                    } else {
                        $('li, a').removeClass('active');
                        self.pageCount = 1; //重新计算页数
                        self.getData(self.type, self.pageCount, function (data) {
                            self.loadend('mask');

                            if (data.state) {
                                delete  data.state;
                                delete  data.message;
                                data = self.formatData(data);
                                self.renderList(data);
                            }
                            menu.hide();
                        });
                    }

                });
                //删除
                $(document).delegate('.del', 'touchend', function (event) {

                    var id = this.dataset.id;
                    self.fav = self.fav.filter(function (item) {
                        return item.id != id;
                    })
                    $(this).closest('li').remove();

                    $.getJSON(self.urlCollection.del+'&pid='+id, function (data) {
                        console.log(data);
                    })

                });
                //返回
                $(document).delegate('.return', 'touchend', function (event) {
                    $('.wrap').animate({
                        'left': 0
                    }, 300)
                });
//                显示衣服列表
                $(document).delegate('.dropmenu li', 'touchend', function (event) {
                    $('li, a').removeClass('active');
//                    如果是收藏
                    if ($(this).hasClass('fav')) {
                        var attr = $(this).attr('type'); //coat, shoes,...
                        if (attr == 'go_fav') { //去收藏列表
//                            console.log(self.fav);

                            var favlisthtml = '';
                            if (self.fav.length > 0) {
                                self.fav.forEach(function (item) {
                                    favlisthtml += sub(self.favlistItemTpl, item);
                                });
                                $('.fav_list').html(favlisthtml);
                            }

                            $('.wrap').animate({
                                'left': -window.innerWidth
                            }, 350)

                        } else {
                            //添加收藏
                            self.addFav(attr);
                            self.tipShow('收藏成功')
                        }
                        //
                        $('.name').text(self.username);
                    } else {
                        self.type = $(this).attr('type');//coat1, shoes, shirt...
                        self.pageCount = 1;//重新计算页数
                        self.getData(self.type, self.pageCount, function (data) {
                            self.loadend('mask');

                            if (data.state) {
                                delete  data.state;
                                delete  data.message;
                                data = self.formatData(data);
                                self.renderList(data);
                            }
                            menu.hide();
                        });
                    }

                });

                this.clothesList.delegate('img', 'touchstart', function (event) {
                    event.stopPropagation();
                    event.preventDefault();
                });

//                点击试穿
                this.clothesList.delegate('img', 'touchend', function () {

                    $('img', this.clothesList).removeClass('selected');
                    var id = $(this).addClass('selected').attr('id');
                    var moudel = $(this).attr('moudel');
                    var index = $(this).attr('index');
                    self.type = $(this).parent().attr('type');
                    self.putOn({
                        id: id,
                        thumb: moudel,
                        index: index,
                        type: self.type
                    });
                    menu.hide();
                });

//               上一页,下一页,脱下xxx todo 分页等json搞好，一次性全部获取json再分页，或者按照页数取json,
                $('.btn', this.clothesListBox).bind('tap touchend', function () {

                    if ($(this).hasClass('undress')) {

//                        console.log('脱: ' + self.type);
                        var uType //= $('.type', this).data('type');

                        //  if (self.isInCoat(uType)) {
                        uType = 1; //coat 1

                        var tempIds = [];
                        console.log('脱: ' + uType);
                        self.data[uType].forEach(function (obj) {
                            tempIds.push(obj.id);
                        });

                        self.dressing.forEach(function (id) {
                            var idx = $.inArray(id, tempIds);
                            if (idx !== -1) {
                                self.undress(id);
                            }
                        });
                        $(this).addClass('disabled');
                        // }

                    } else {
                        if ($(this).hasClass('prev')) {
                            self.pageCount--;
                            if (self.pageCount < 1) {
                                self.pageCount = 1;
                            }
                        }
                        if ($(this).hasClass('next')) {
                            self.pageCount++;
                        }

                        self.loadstart('mask');
                        self.getData(self.type, self.pageCount, function (data) {
                            self.loadend('mask');
                            if (data.state) {
                                delete  data.state;
                                delete  data.message;
                                data = self.formatData(data);
                                self.renderList(data);
                            } else {
                                if ($(this).hasClass('prev')){
                                    self.pageCount++;
                                } else {
                                    self.pageCount--;
                                    if (self.pageCount < 1) {
                                        self.pageCount = 1;
                                    }
                                }
                            }
                        });
                    }

                });
                //收藏
                self.addFavBtn.bind('touchend', function (event) {
                    var width = $(this).outerWidth();
                    var menudata = [
                        {
                            type: '1',
                            text: '收藏上装'
                        },
                        {
                            type: '2',
                            text: '收藏下装'
                        },
                        {
                            type: '3',
                            text: '收藏内衬'
                        },
                        {
                            type: '4',
                            text: '收藏鞋子'
                        },
                        {
                            type: 'go_fav',
                            text: '我的收藏'
                        }
                    ];
                    menu.show({
                        event: event,
                        data: menudata,
                        tpl: ' <li type="{type}" class="fav">{text}</li>',
                        callback: function () {
                            menu.menu.width(width);
                        }
                    });
                });
            },
            putOn: function (data) {
                var img = $(sub(this.listItemTpl, data)),
                    self = this;
                ;

                this.setSize($('img', img));
                if ($.inArray(data.id, this.dressing) === -1) {

                    self.dressing.push(data.id);
//                    this.container.append(img.fadeIn('fast', function () { }));
                    this.container.append(img);
                    imgReady(data.thumb, function () {
                    }, function () {
                        self.undress(data);
                    });

                } else {
//                    this.undress(data);
                }
            },
            //添加收藏
            //param {string} 'coat, shoes, trousers, shirt'
            addFav: function (type) {
                var self = this;
                var clothes = this.data[type]; //[{id:1, price}...]

                this.dressing.forEach(function (id) {
                    clothes.forEach(function (cloth) {
                        if (cloth.id == id) {
                            self.fav = self.fav.filter(function (fav_item) {
                                return fav_item.id !== id;
                            });
                            self.fav.push(cloth);

                            $.getJSON(self.urlCollection.add+'&pid='+id, function (data) {
                                console.log(data);
                            });
                        }
                    });
                });


            },
//            //取衣服列表
            getData: function (type, page, callback, url) {

                var self = this;
                var url = url || self.url + '&c_id=' + type + '&page_index=' + page + '&version=' + Math.random();
                self.loadstart('mask');

                return $.getJSON(
                    url,
                    function (data) {
                        if ($.isFunction(callback)) {
                            callback(data);
                        }
                        return data;
                    });
            },
            formatData_bak: function (data) {
                var self = this;
                Object.keys(data).some(function (key) {
                    var arr = data[key];
                    if (!arr) {
                        return;
                    }
                    arr.forEach(function (arritem) {
                        var thumb = arritem.thumb;
                        var path = thumb.slice(0, thumb.lastIndexOf('/') + 1); // images/
                        var search = thumb.slice(thumb.lastIndexOf('?') + 1, thumb.length); //index=3&aa=bb"
                        var imgname = thumb.slice(thumb.lastIndexOf('/') + 1).replace(search, '').replace('?', ''); //004.png

                        var moudelimgname = path + imgname.replace('.png', '') + '_' + self.imgSize + '.png';
                        var arr_search = search.split('&');//['index=3', 'aa=bb']
                        var obj_search = {};
                        arr_search.forEach(function (item) {
                            var arr_sp = item.split('=');// ['index','3']
                            obj_search[arr_sp[0]] = arr_sp[1];
                            arritem[arr_sp[0]] = arr_sp[1];
                        });

                        arritem.id = imgname.replace('.png', '');
                        arritem.moudel = moudelimgname;

                    });

                });
                return data;
            },
            formatData: function (data) {
                var self = this;

                Object.keys(data).some(function (key) {
                    var arr = data[key];
                    if (!arr) {
                        return;
                    }
                    arr.forEach(function (item) {
//                        item.moudel = self.imgPath + item.id + '_' + self.imgSize + '.png';
//                        item.thumb = self.imgPath + item.id + '.png';
                        item.moudel = self.imgPath + item.id + '.png';
                        item.thumb = self.imgPath + item.id + '.jpg';
                    });
                });
                return data;
            },
            //存储data
            //param type {string} ,coat1
            //param data {object} , {coat1:[{}]}
            dataUpdate: function (type, data) {

                var self = this;
                var parentType;
                if (self.isInCoat(type)) {
                    parentType = '1';
                } else {
                    parentType = type;
                }
                if (!self.data[parentType]) {
                    self.data[parentType] = [];
                }
//                self.data[type] = self.data[type].concat(data[self.type]);
                if (data[type]) {
                    self.data[parentType] = self.data[parentType].concat(data[type]);
                }
            },
//            缩略图列表
            renderList: function (data) {
                var self = this;
                var innerHTML = '';

                //存储data
                self.dataUpdate(self.type, data);

                //显示脱掉 xx
                $('.type', '.undress')
//                    .text(self.undressMap[self.type])
                    .data('type', self.type);

                //判断是否可以点击 脱下按钮
//                var uType = self.type;
                var isDisabled = true;
//                if (self.isInCoat(uType)) {
//                    uType = 'coat';
//                }
                var uType = '1'; //coat 1
                var tempIds = [];
                self.data[uType].forEach(function (obj) {
                    tempIds.push(obj.id);
                });

                self.dressing.forEach(function (id) {
                    if ($.inArray(id, tempIds) > -1) {
                        $('.undress').removeClass('disabled');
                        isDisabled = false;
                    }
                });
                if (isDisabled) {
                    $('.undress').addClass('disabled');
                }

                //

                if (data[self.type] && data[self.type].length > 0) {
                    $('.btn', this.clothesListBox).show();
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
//                    self.clothesListBox.removeClass('out').addClass('in');
                }
            },
            loadstart: function (key) {
                this[key].show();

                this.timeout_load = setTimeout(this.loadend.bind(this, key), 10000);
            },
            loadend: function (key) {
                this[key || 'mask'].fadeOut('fast');
                clearTimeout(this.timeout_load);
            },
            //param data {object} {id:1,index:2,type:coat1};
            //param data {string} id
            undress: function (data) {
                var self = this,
                    li_zindex,
                    li_type,
                    id; //在穿的图片id

                $('li', this.container).each(function (i, li) {
                    li_zindex = $(li).css('z-index');
                    li_type = $(li).attr('type');
                    id = $('img', li)[0].id;

//                    去除同类型，同层级的
                    if (typeof  data == 'object') {

                        if ((li_zindex === data.index || li_type === data.type) && id != data.id
                        //|| (typeof data.index === 'undefined' && li_type === data.type)
                            ) {
//                            var id = $('img', li).attr('id');
                            var indexOf = self.dressing.indexOf(id);
                            self.dressing.splice(indexOf, 1);
                            $(li).remove();
                        }
                    }
                    if (typeof  data == 'string') {
                        var id = data;
                        var indexOf = self.dressing.indexOf(id);
                        if (indexOf !== -1) {
                            self.dressing.splice(indexOf, 1);
                            $(self.container).find('#' + id).closest('li').remove();
                        }
                    }
                });
            },
            getDress: function () {
                return this.dressing;
            },
            clear: function () {
                this.dressing = [];
                this.container.html('');
                return 'clear';
            }

        });
        return iRoom;
    })(__super);

    window.iRoom = iRoom;
})(window);

/**
* jQuery Photolabel
* Плагин, инициализирующий отметки пользователей на фото
* 
* @requires jQuery 1.6+
*           jQuery.draggable, 
*           jQuery.resizable, 
*           jQuery.dialog
* 
* @version 1.0
* @author Артем Полторанин
* Web-site: photolabel.readyscript.ru
* Email: artpol@readyscript.ru
* 
*/

(function($) {    
    // объект отвечает за отображение отметок на фото.
    var tags = function($element)
    {
        var borderWidth = 2;
        var data = $element.data('photoLabel');
        var $img = $('>img', $element);
        var $container = data.container;
        var $labelContainer = $(data.options.labelContainer);
        var $tagView;
        var _this = this;
        var enable = true;
        
        this.init = function() 
        {
            var on_complete = function() {
                _this.setViewZone();

                //Добавляем разметку для просмотра    
                $tagView = $('<div class="tag_view"><img src="'+$img.attr('src')+'"></div>').appendTo($container);            
                
                //Активируем имеющиеся теги
                for (var key in data.options.areas) {
                    var item = data.options.areas[key];
                    _this.add(item);
                }
            }
            
            if ($img.get(0).complete) {
                on_complete();
            } else {
                $img.load(on_complete);
            }
        }
        
        this.add = function(item) 
        {
            if (!item.item_id) item.item_id = 0;
            
            if (!item.width || !item.height) {
                item = _this.convertFromPercent(item);
            }
                        
            var render_func = (data.options.renderTag) ? data.options.renderTag : _this._renderItem;
            var tag_item = render_func.call( this, item );
            tag_item.data('pl_item', item);
        
            $('.tag', tag_item).hover(_this.onOver, _this.onOut);
            
            //Скрываем значек удаления
            if (data.options.isAdmin || item.item_id == data.options.viewerId || item.creator_id == data.options.viewerId) {
                $('.del', tag_item).click(_this.remove);
            } else {
                $('.del', tag_item).remove();
            }
            
            var exists_elem = $('[data-id="'+item.item_id+'"]', $labelContainer);
            
            if ( item.item_id>0  && exists_elem.length ) {    
                exists_elem.replaceWith(tag_item);
            } else {
                $($labelContainer).append( tag_item );
                _this.redrawComma();
            }
            
            //Добавляем слой для просмотра при наведении
            var $tagLabel = $('<div class="img-taglabel" data-tagid="'+item.id+'"><span>'+item.item_title+'</span></div>')
                    .hover(_this.tagViewOver, _this.tagViewOut)
                    .appendTo($container)
                    .css({
                        position:'absolute',
                        top: item.top,
                        left: item.left,
                        width: item.width,
                        height: item.height,
                        zIndex:22
                    });
        }
        
        this.redrawComma = function()
        {
            var showBlock = $('li:not(.hid)', $labelContainer).length;
            $(data.options.labelListContainer).css('display', showBlock ? 'block' : 'none' );            
            $('i', $labelContainer).show();
            $('i:visible:last', $labelContainer).hide();
        }
        
        this._renderItem = function(item) 
        {    
            if (item.item_id>0 && item.item_url != '') {
                var a = $('<a href="'+item.item_url+'" class="tag">'+item.item_title+'</a>');
            } else {
                var a = $('<span class="tag">'+item.item_title+'</span>');
            }
            var del = $(' <a href="JavaScript:;" class="del">&nbsp;</a>');
            return $('<li data-id="'+item.item_id+'" data-tagid="'+item.id+'"></li>').append(a).append(del).append('<i>, </i>');
        }
        
        this.remove = function() {
            var block = $(this).closest('li').addClass('hid');
            var item = block.data('pl_item');
            $.post(data.options.removeTagUrl, {"tag_id": item.id}, function() {
                data.options.onDeleteTag.call($element, item);
            }, 'json');
            
            if (data.options.recoverContainer) {
                var $recover = $('<a href="JavaScript:;">'+data.options.recoverText+'</a>')
                    .data('recover_tagid', item.id).click(_this.recover);
                    
                $(data.options.recoverContainer)
                    .html(data.options.tagDeletedText)
                    .append($recover)
                    .show();
            }
            
            block.hide();
            $('.img-taglabel[data-tagid="'+item.id+'"]', $container).hide();
            _this.redrawComma();
        }
        
        this.recover = function() {
            var tagid = $(this).data('recover_tagid');
            $('li[data-tagid="'+tagid+'"]', $labelContainer).removeClass('hid').show();
            $('.img-taglabel[data-tagid="'+tagid+'"]', $container).show();
            
            $(data.options.recoverContainer).hide();
            $.post(data.options.recoverTagUrl, {tag_id: tagid}, 'json');
            _this.redrawComma();            
        }
        
        this.convertFromPercent = function(item) {
            item.left = parseInt($img.width() * item.leftTopX);
            item.top = parseInt($img.height() * item.leftTopY);
            item.width = parseInt($img.width() * item.rightBottomX - item.left);
            item.height = parseInt($img.height() * item.rightBottomY - item.top);
            
            return item;
        }
        
        this.tagViewOver = function() {
            if (!enable) return false;
            _this.setViewZone();
            $('span', this).show();
        }
        
        this.tagViewOut = function() {
            if (!enable) return false;
            $('span', this).hide();
        }
        
        this.setViewZone = function() {
            var viewZone = {
                width: $img.width(),
                height: $img.height(),
                left: Math.round( ($element.width() - $img.width())/2 )
            };

            data.overlay.css(viewZone);
            data.container.css(viewZone);
        }
        
        this.onOver = function() {
            if (!enable) return false;
            
            _this.setViewZone();
            data.overlay.css('opacity', '0.5');

            var item = $(this).closest('li').data('pl_item');
            
            if (!item.width || !item.height) {
                item = _this.convertFromPercent(item);
            }
            
            $('img', $tagView).css({
                marginLeft: -item.left - borderWidth,
                marginTop: -item.top - borderWidth 
            })
            $tagView.css({
                position:'absolute',
                top: item.top,
                left: item.left,
                width: item.width,
                height: item.height
            })
            .show();            
        }
        
        this.onOut = function() {
            if (!enable) return false;
            $tagView.hide();
            data.overlay.css('opacity', '0');
        }        
        
        this.disable = function() {
            enable = false;
        }
        
        this.enable = function() {
            enable = true;
        }
        
        this.init();
    }    
    
    //Методы плагина photoLabel
    var photoLabel = {
        
        //Инициализирует плагин
        init : function( options ) 
        {
            options = $.extend({
                addPostData: {}, //Произвольные данные (ключ => значение), добавленные в POST во время добавления отметки. Обычно здесь добавляют imgId.
                startHandler: null, //Элемент, при нажатии на который произойдет запуск отметок
                labelListContainer: null, //Общий контейнер, для списка отметок.                
                labelContainer: null, //<UL> элемент, в котором содержится список отмеченных друзей
                recoverContainer: null, //Контейнер для ссылки "восстановить тег"
                
                friends: {}, //друзья:возможные значения - объект | строка(URL) будет выполнен get запрос, в ответ ожидается объект в json | функция (должна возвращать объект).
                areas: [], //отмеченные раннее зоны
                
                onStart: function() {}, //Событие - начало отметок.
                onStop: function() {}, //Событие - завершение отметок.
                addTagUrl: "php/tags.php?Act=addTag", //Адрес, который будет вызван при добавлении метки
                removeTagUrl: "php/tags.php?Act=removeTag",
                recoverTagUrl: "php/tags.php?Act=recoverTag",
                onAddTag: function() {}, //Событие - сохранение отметки
                onDeleteTag: function() {},  //Событие - удаление отметки
                isAdmin: 0, //Если 1, то возле каждой отметки появится крестик для удаления
                viewerId:-1, //Возле отметки с этим пользователем появится крестик для удаления
                recoverText: 'восстановить',
                tagDeletedText: 'Отметка удалена.',
                noFriendText: 'Список пуст'
            }, options);
            
            var _this = this;
            return this.each(function() {            
                var friendDlg = $('<div class="friendDialog"></div>')
                                    .appendTo(this)
                                    .dialog({
                                        resizable: false,
                                        width: 190,
                                        autoOpen: false, 
                                        title: 'Введите имя',
                                        close: function(event, ui) {
                                            if (event.originalEvent) { //Если пользователь вызвал закрытие, а не метод hideFriendDlg
                                                photoLabel.stop.call(_this);
                                            }
                                        }
                                        
                                    });
                
                $('<div class="findbox"><input type="text" name="userName"></div>'+
                    '<ul class="userbox">'+
                        '<li><div class="loading" style="width:100%"></div></li>'+
                    '</ul>'
                ).appendTo(friendDlg);
                
                
                var ul = $('.userbox');
                $('li', ul).show();
                
                $('input[name="userName"]').keyup(function(e) {
                    var str = $(this).val().toLowerCase();
                    $('a', ul).each(function() {
                        var $this = $(this);
                        var parent = $this.parent();
                        if ( $this.text().toLowerCase().indexOf( str ) == -1 ) {
                            parent.hide();
                        } else {
                            parent.show();
                        }
                    });
                    
                    if ($('>li:not(.empty):visible', ul).length) {
                        $('.empty', ul).remove();
                    } else {
                        if (!$('.empty', ul).length) {
                            ul.append($('<li class="empty"></li>').html(options.noFriendText));
                        }
                    }
                });
                
                
                var $_this = $(this);
                
                var $overlay = $('<div class="img-overlay"></div>')
                    .css({
                        top: 0,                        
                        position: 'absolute',
                        cursor: 'crosshair',
                        zIndex: 20,
                        opacity:0
                    }).appendTo($_this);
                    
                
                var $c_wrapper = $('<div class="img-cont"></div>')
                    .css({
                        top: 0,                        
                        position:'absolute',
                        zIndex: 21
                    }).appendTo($_this);

                var data = {
                    friendDlg: friendDlg,
                    options: options,
                    overlay: $overlay,
                    container: $c_wrapper,
                    state: 'stop'
                }

                $(this).data('photoLabel', data);
                data.tags = new tags($_this);

                $(options.startHandler).click(function() {
                    photoLabel.start.call(_this);
                });
                
                $_this.closest('.showImageDialog').unbind('dialogclose.photolabel');
                $_this.closest('.showImageDialog').bind('dialogclose.photolabel', function(e, ui) {
                    photoLabel.stop.call(_this);
                });
                
            });
        },
        
        //Запускает отметки пользователей. фото покрывается 
        start: function() 
        {
            return this.each(function() {
                var $_this = $(this); //imageWrap
                var $area;
                var $overlay;
                var data = $(this).data('photoLabel');
                if (data.state == 'start') return; else data.state = 'start';
                                
                data.container.bind('click.clickDisable',function() {
                    return false;
                });
                $('*', $_this)
                    .css('-moz-user-select', 'none')
                    .css('-webkit-user-select', 'none')
                    .attr('unselectable', 'on');
                
                var $img = $('>img', $_this);                
                $_this.css('cursor', 'crosshair');
                data.tags.disable();
                
                var viewZone = {
                    width: $img.width(),
                    height: $img.height(),
                    left: Math.round( ($_this.width() - $img.width())/2 )
                };
                
                var $container = data.container.css(viewZone);
                var $overlay = data.overlay.css(viewZone);
                
                var moveArea = function(e, ui) {
                    $('img', ui.helper).css({
                        marginLeft: -ui.position.left,
                        marginTop:-ui.position.top
                    }); 
                }
                
                var loadFriends = function() {
                    if (typeof(globals) != 'undefined' && globals.friends) {
                        fillList(globals.friends);
                    } else if (typeof(data.options.friends) == 'string') {
                        $.getJSON(data.options.friends, function(response) {
                            fillList(response);
                        });
                    }
                    else if (typeof(data.options.friends) == 'function') {
                        fillList( data.options.friends.call(this) );
                    } else {
                        fillList( data.options.friends );
                    }
                }
                
                var fillList = function(friends) {
                    if (typeof(globals) != 'undefined') globals.friends = friends;
                    var ul = $('.userbox', data.friendDlg).html('');
                    for(var key in friends) {
                        var name = (friends[key].id == data.options.viewerId) ? 'Я' : friends[key].fullname;
                        $('<li></li>').append(
                            $('<a href="JavaScript:;">'+name+'</a>')
                            .click({user: friends[key]}, addUser)
                        ).appendTo(ul);
                    }
                }
                
                $('input[name="userName"]', data.friendDlg).val('');
                
                /**
                * Начало выделения области
                */
                var selectStart = function(e) {
                    $overlay.css({opacity:0.5});
                    
                    if (!$area) {
                        $area = $('<div class="img-area"><img src="'+$img.attr('src')+'"></div>')
                            .append(//Добавляем маркеры
                                '<div class="ui-resizable-handle ui-resizable-ne"></div>'+
                                '<div class="ui-resizable-handle ui-resizable-n"></div>'+
                                '<div class="ui-resizable-handle ui-resizable-nw"></div>'+
                                '<div class="ui-resizable-handle ui-resizable-e"></div>'+
                                '<div class="ui-resizable-handle ui-resizable-w"></div>'+
                                '<div class="ui-resizable-handle ui-resizable-se"></div>'+
                                '<div class="ui-resizable-handle ui-resizable-s"></div>'+
                                '<div class="ui-resizable-handle ui-resizable-sw"></div>'
                            );
                    }
                    if ($(e.target).parent().hasClass('img-area')) return false;
                    hideFriendDialog();

                    var layerY = e.pageY-parseInt($container.offset().top);
                    var layerX = e.pageX-parseInt($container.offset().left);
                                        
                    $area_img = $('img', $area);
                    $area.css({
                        position:'absolute',
                        top: layerY,
                        left: layerX,
                        width:0,
                        height:0,
                        zIndex:22
                    }).appendTo($container);
                    
                    $area_img.css({
                        marginLeft: -layerX + 1,
                        marginTop: -layerY
                    });
                    
                    $area.data('clickpoint', {
                        y: layerY,
                        x: layerX
                    });
                    
                    $_this.mousemove(resizeSelect);
                    $('body').one('mouseup.drawArea', selectStop);
                }
                
                /**
                * Завершаем выделение новой области
                */
                var selectStop = function() {
                    $area.css({cursor:'move'});
                    $_this.unbind('mousemove');
                    
                    checkAreaSize();
                    
                    $area.draggable({
                        containment: $container,
                        drag: moveArea,
                        start: hideFriendDialog,
                        stop: showFriendDialog
                    })
                    .resizable({
                        start: hideFriendDialog,
                        stop: function() {
                            checkAreaSize();
                            showFriendDialog();
                        },
                        containment: $container,
                        resize: function(e, ui) {
                            $('img', ui.helper).css({
                                marginLeft: -parseInt($(ui.helper).css('left')),
                                marginTop:-parseInt( $(ui.helper).css('top') )
                            }); 
                        },
                        handles: {
                            ne: '.ui-resizable-ne',
                            n:  '.ui-resizable-n',
                            nw: '.ui-resizable-nw',
                            e:  '.ui-resizable-e',
                            w:  '.ui-resizable-w',
                            se: '.ui-resizable-se',
                            s:  '.ui-resizable-s',
                            sw: '.ui-resizable-sw'
                        }
                    });
                    
                    showFriendDialog($area);
                }
                
                var checkAreaSize = function() {
                    if ($area.width()<40) $area.width(40);
                    if ($area.height()<40) $area.height(40);
                    
                    //Корректируем, если область выходит за границы
                    if (parseInt($area.css('left'))+$area.width() > viewZone.width) {
                        $area.css('left', viewZone.width - $area.width());
                    }
                    if (parseInt($area.css('top'))+$area.height() > viewZone.height) {
                        $area.css('top', viewZone.height - $area.height());
                    }
                }
                
                var showFriendDialog = function()
                {
                    //Отображаем диалог возле области
                    var dlg_x = parseInt($area.offset().left) + $area.width() + 20 - $(window).scrollLeft();
                    var dlg_y = parseInt($area.offset().top) - $(window).scrollTop();
                    data.friendDlg.dialog('option', 'position', [dlg_x, dlg_y]);
                    
                    data.friendDlg.dialog('option', 'buttons', [{
                        text: 'Добавить', 
                        click: addUser
                    }]);
                    data.friendDlg.dialog('open');
                }
                
                var hideFriendDialog = function() 
                {
                    data.friendDlg.dialog('close');
                }
                
                var convertToPersent = function(tagData)
                {
                    return $.extend(tagData, {
                        leftTopX: (tagData.left/tagData.img_width).toFixed(5),
                        leftTopY: (tagData.top/tagData.img_height).toFixed(5),
                        rightBottomX: ((tagData.left + tagData.width)/tagData.img_width).toFixed(5),
                        rightBottomY: ((tagData.top + tagData.height)/tagData.img_height).toFixed(5)
                    });
                }
                
                /**
                * Добавляет отметку о пользователе
                */
                var addUser = function (e) {
                    if ( e.data === null ) {
                        var username = $('input[name="userName"]', data.friendDlg).val();
                        var userurl = '';
                        var userid = 0;
                    } else {
                        var username = e.data.user.fullname;
                        var userurl = e.data.user.url;
                        var userid = e.data.user.id;
                    }
                    
                    //Не принимаем пустую строку
                    if (e.data === null && username == '') return false;
                    
                    //Данные об области
                    var tagData = convertToPersent({
                        left: parseInt($area.css('left')),
                        top: parseInt($area.css('top')),
                        width: $area.width(),
                        height: $area.height(),
                        img_width: $img.width(),
                        img_height: $img.height(),
                        item_title: username,
                        item_url: userurl,
                        item_id: userid,
                        creator_id: data.options.viewerId
                    });
                    
                    tagData = $.extend(tagData, data.options.addPostData);

                    $area.remove();
                    $area = null;
                    
                    data.overlay.css('opacity', 0);
                    hideFriendDialog();
                    
                    $.post(data.options.addTagUrl, tagData, function(response) {
                        if (response.success) 
                        {    
                            tagData.id = response.tag_id;
                                                        
                            data.tags.add(tagData);
                            data.options.onAddTag.call($_this[0], tagData);
                        }
                    }, 'json');                    
                }
                
                var resizeSelect = function(e) {    
                    var x = e.clientX + $(window).scrollLeft() - $container.offset().left;
                    var y = e.clientY + $(window).scrollTop() - $container.offset().top;
                    
                    var clickpoint = $area.data('clickpoint');
                    
                    if (x < 0) x = 0;
                    
                    var width = x - clickpoint.x;
                    var height = y - clickpoint.y;
                    var coord = {};
                    
                    if ( width>=0 ) {
                        coord.left = clickpoint.x;
                    } else {
                        coord.left = x;
                    }                
                    
                    if ( height >=0 ) {
                        coord.top = clickpoint.y;
                    } else {
                        coord.top = y;
                    }
                    
                    //Ограничиваем область
                    if (coord.left + width > viewZone.width) {
                        width = viewZone.width - coord.left;
                    }
                    
                    $area.css({left: coord.left, top: coord.top});
                    $area.width( Math.abs(width) );
                    $area.height( Math.abs(height) );
                    
                    $area_img.css({
                        marginLeft: -coord.left,
                        marginTop: -coord.top
                    });                    
                }
                
                loadFriends(); //Загружаем друзей
                
                $container.bind('mousedown.drawArea', selectStart);
                if (data.options.onStart) data.options.onStart.call(this);
            });
        },
        
        //Возвращает фото в исходное состояние
        stop: function() 
        {
            $('body').unbind('.drawArea');
            return this.each(function() {
                var data = $(this).data('photoLabel');
                if (data.state == 'stop') return; else data.state = 'stop';                
                data.tags.enable();
                $('.img-area', data.container).remove();
                data.overlay.css('opacity', 0);
                data.friendDlg.dialog('close');
                data.container.unbind();
                
                $(this).unbind('mousemove');
                $(this).css('cursor', 'pointer');
                if (data.options.onStart) data.options.onStop.call(this);
            });
        }
        
    } //object photoLabel
    
  $.fn.photoLabel = function( method ) {
    
    if ( photoLabel[method] ) {
        return photoLabel[method].apply( this, Array.prototype.slice.call( arguments, 1 ));
    } else if ( typeof method === 'object' || ! method ) {
        return photoLabel.init.apply( this, arguments );
    } else {
        $.error( 'Method ' +  method + ' does not exist on jQuery.photoLabel' );
    }
  };
    
})(jQuery);
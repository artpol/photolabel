<?php
/**
* Простой контроллер для серверной части отметок
*/
class Controller
{
    function addTag()
    {
        /*
        Получаем из POST переменные. Здесь мы должны организовать сохранение значений в базу.
        
        creator_id      // id пользователя, который создал отметку (равен viewerId - в JavaScript)
        left            // смещение отмеченной области по горизонтали относительно левого края изображения
        top             // смещение отмеченной области по вертикали относительно верхнего края изображения        
        height          // высота отмеченной области
        width           // ширина отмеченной области        
        img_id          // id изображения        
        img_height      // высота изображения
        img_width       // ширина изображения        
        item_id         // id отмеченного пользователя
        item_title      // подпись отмеченной области
        item_url        // ссылка отмеченной области
        
        leftTopX        // координата X левого верхнего угла в процентах от ширины изображения
        leftTopY        // координата Y левого верхнего угла в процентах от высоты изображения
        rightBottomX    // координата X правого нижнего угла в процентах от ширины изображения
        rightBottomY    // координата Y правого нижнего угла в процентах от высоты изображения
        */
        
        return json_encode(array(
            'success' => true, 
            'tag_id' => rand(0, 9999999) //Возвращаем id отметки
        ));
    }
    
    function removeTag()
    {
        /**
        * Получаем из POST пееменную.
        * 
        * tag_id - id тега, который нужно удалить
        */
        
        return json_encode(array(
            'success' => true
        ));        
    }
    
    function recoverTag()
    {
        /**
        * Получаем из POST пееменную.
        * 
        * tag_id - id тега, который нужно восстановить
        */        

        return json_encode(array(
            'success' => true
        ));        
    }
    
    function _bind()
    {
        $act = $_GET['Act'];
        if ($act{0} != '_' && is_callable(array($this, $act))) {
            return $this->$act();
        }
        die('Not found');
    }
}

$photoLabelController = new Controller();
echo $photoLabelController->_bind();
?>

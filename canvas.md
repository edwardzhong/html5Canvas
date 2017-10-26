## 角度旋转
    dx = mouse.x - object.x;
    dy = mouse.y - object.y;
    object.rotation = Math.atan2(dy,dx)*180/Math.PI

## 平滑运动
     value = center + Math.sin(angle)*range;
     angle += speed;

## 正圆运动
     x_position = centerX + Math.sin(angle)*radius;
     y_position = centerY + Math.cos(angle)*radius;
     angle += speed;

### 知道中心点和当前坐标，得到旋转一定角度后的位置
      var x1 = ball.x - centerX; //相对中心点的位置
      var y1 = ball.y - centerY;

      var newX = x1*cos - y1*sin; //旋转一定角度后的位置
      var newY = y1*cos + x1*sin;

      ball.x = centerX + newX; //更新球的位置
      ball.y = centerY + newY;

## 椭圆运动
     x_position = centerX + Math.cos(angle)*radiusX;
     y_position = centerY + Math.sin(angle)*radiusY;
     angle += speed;

## 两点间距离
    dx = x2 - x1;
    dy = y2 - y1;
    dist = Math.sqrt(dx*dx + dy*dy);

## 角度旋转
    dx = mouse.x - object.x;
    dy = mouse.y - object.y;
    object.rotation = Math.atan2(dy,dx)*180/Math.PI

    ## 平滑运动
       value = center + Math.sin(angle)*range;
       angle += speed;

    ## 正圆运动
       x_position = centerX + Math.sin(angle)*radius;
       y_position = centerY + Math.cos(angle)*radius;
       angle += speed;

    ## 椭圆运动
       x_position = centerX + Math.cos(angle)*radiusX;
       y_position = centerY + Math.sin(angle)*radiusY;
       angle += speed;

    ##两点间距离
    dx = x2 - x1;
    dy = y2 - y1;
    dist = Math.sqrt(dx*dx + dy*dy);

## 速度与加速度    
    //任意方向速度
    vx = speed * Math.cos(angle);
    vy = speed * Math.sin(angle);

    //任意方向加速度
    ax = force * Math.cos(angle);
    ay = force * Math.xin(angle);

    //改变速度
    vx += ax;
    vx += ay;

    //改变位置
    object.x += vx;
    object.y += vy;  

## 边界检测与摩擦力 
    // 1.移除一个超过边界的物体
    if(object.x - object.width/2 > right || 
       object.x + object.width/2 < left ||
       object.y - object.height/2 > bottom ||
       object.y + object.height/2 < top){
        //移除物体代码
       }

    // 2.重现一个超出边界的物体
    if(object.x - object.width/2 > right || 
       object.x + object.width/2 < left ||
       object.y - object.height/2 > bottom ||
       object.y + object.height/2 < top){
        //重新设置对象的位置和速度
       }

    //3. 边界环绕
    if(object.x - object.width/2 > right){
        object.x = left - object.width/2;
    }else if(object.x + object.width/2 < left){
        object.x = object.width/2 + right；
    }
    if(object.y - object.height/2 > bottom){
        object.y = top - object.height/2;
    }else if(object.y + object.height/2 < top){
        object.y = object.height/2 + bottom；
    }
  
    //4.摩擦力(正规军)
    speed = Math.sqrt(vx*vx + vy*vy);
    angle = Math.atan2(vy, vx);
    if(speed > f){
         speed -= f;
    }else{
        speed = 0;
    }
    vx = Math.cos(angle)*speed;
    vy = Math.sin(angle)*speed;
   
    //4.摩擦力(野战军)
      vx += vx*f;
      vy += vy*f;


## 缓动动画与弹性动画总结

### 缓动动画
    var dx = targetX - object.x,
        dy = targetY - object.y;
        
    var vx = dx * easing,
        vy = dy * easing;
        
        object.x += vx;
        object.y += vy;

### 缓动动画，精简形式

    object.x += (targetX - object.x) * easing;//乘以缓动因子
    object.y += (targetY - object.y) * easing;

### 弹性动画

    var ax = (targetX - object.x) * spring;//求出加速度
    var ay = (targetY - object.y) * spring;

    var vx += ax;
    var vy += ay;

    vx *= f;
    vy *= f;
    object.x += vx;
    object.y += vy;

### 弹性动画,精简形式

    vx += (targetX - object.x) * spring;
    vy += (targetY - object.y) * spring;

    object.x += (vx*=f);
    object.y += (vy*=f);

### Offset spring

    var dx = object.x - fixedX,
        dy = object.y - fixedY;
        angle = Math.atan2(dy, dx);
        targetX = fixed + Math.cos(angle)*springLength,
        targetY = fixed + Math.sin(angle)*springLength;
        
        //spring to targetX, targetY as above


## 基于距离的碰撞检测
    var dx = objectB.x - objectA.x,
        dy = objectB.y - objectA.y;
    var distance = Math.sqrt(dx*dx + dy*dy);
    if(distance < objectA.radius + objectB.radius){
        //do something
    }

## 多物体碰撞检测
    objects.forEach(function(objectA, i){
        for(var j=i+1; i<objects.lebgth; i++){
            //do something
        }
    })
    
## 角度反弹
    newX = x*cos - y*sin;
    newY = y*cos + x*sin;
###旋转回去
    newX = x*cos + y*sin;
    newY = y*cos - x*sin;

### 动量守恒
    p = m * v
    m1 * v1 + m2 * v2 = m1 * v1F + m2 * v2F
### 能量守恒
    E = 0.5 * m * v^2
    (0.5 * m1 * v1^2) + (0.5 * m2 * v2^2) = (0.5 * m1 * v1F^2) + (0.5 * m2 * v2F^2)
## 遵循动量守恒和能量守恒的碰撞后的速度大小
    v0Final = ((m0 - m1)*v0 + 2*m1*v1) / (m0 + m1);
    v1Final = ((m1 - m0)*v1 + 2*m0*v0) / (m0 + m1);
 
## 精简版
    var vxTotal = vx0 - vx1;
    vx0 = ((ball0.mass - ball1.mass)*vx0 + 2*ball1.mass*vx1)/(ball0.mass + ball1.mass);
    vx1 = vxTotal + vx0;

## 万有引力
    function gravitate(partA, partB){
         var dx = partB.x - partA.x;
         var dy = partB.y - partA.y;
         var distQ = dx*dx + dy*dy;
         var dist = Math.sqrt(distQ);
         var F = (partA.mass * partB.mass)/distQ;
                   
         var ax = F * dx/dist;
         var ay = F * dy/dist;
                   
         partA.vx += ax/partA.mass;
         partA.vy += ay/partA.mass;
         partB.vx -= ax/partB.mass;
         partB.vy -= ay/partB.mass;
     }
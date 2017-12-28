## canvas 基础
```javascript
    // canvas z轴：z负值表示该对象是在屏幕/观众近，而z正值表示该对象远离屏幕

    var canvas = document.getElementById('canvas'),
        ctx = canvas.getContext('2d'),// 上下文
        W=canvas.width,// 使用canvs.style[width/height]会拉伸压缩canvas的高宽，canvas[width/height]则不会。
        H=canvas.height;

    ctx.translate(W/2,H/2);//坐标原点重置为中间

    ctx.lineWidth=20;
    ctx.lineCap="round";//线帽:butt,round,square
    ctx.fillStyle='hsla(0,0%,0%,1)';
    ctx.strokeStyle='hsla(0,0%,0%,1)';

    //字体相关设置
    ctx.font = 'bold 40px arial';
    ctx.textAlign='center';
    ctx.textBaseline='middle';

    //测量text的宽度
    var txtWidth=ctx.measureText('canvas').width;

    ctx.clearRect(-W/2,-H/2,W,H);//清除画布
    ctx.strokeRect(75,100,200,200);//描边
    ctx.fillRect(325,100,200,200);//填充

    ctx.save(); // 先用save方法，保存了当前设置，设置包括fillStyle,strokeStyle,font,transform,globalCompositeOperation等
    ctx.beginPath();//从beginPath处，开始使用非零环绕原则画环
    ctx.arc(this.x,this.y,this.r+24,0,Math.PI*2,true);
    ctx.arc(this.x,this.y,this.r+3,0,Math.PI*2,false);
    ctx.fill();
    ctx.restore();// 使用restore方法，恢复了保存前的设置
    

    ctx.beginPath() //重新规划一条路径,使用beginPath后，末尾不会出现多余的线
    // ...
    ctx.closePath() //关闭路径，如果该路径没有闭合，则连接开始和结尾进行闭合，但只对stroke，fill默认都会闭合 

    ctx.globalCompositeOperation='xor';// 图形组合: source-over,lighter
    ctx.globalAlpha=0.5;//透明度

    ctx.drawImage(img,0,0,100,100);//缩放为100*100的图像
    ctx.drawImage(img,300,300,200,200,0,0,100,100);//(图像,源图像x,源图像y,源图像宽,源图像高,目的图x,目的图y,缩放宽,缩放高)
    ctx.arc(180,180,50,0,180*Math.PI/180,false);//(x,y,radius,开始弧度,结束弧度,false:顺时针)
```
### 图片
    ctx.drawImage(img,0,0);//(img,dx,dy) 将图像画到canvas指定位置 
    ctx.drawImage(img,0,0,600,400);//(img,dx,dy,dw,dh) 将图像画到canvas指定位置 ,同时指定图像高宽
    ctx.drawImage(img,300,300,200,200,0,0,100,100);//(图像,源图像x,源图像y,源图像宽,源图像高,目的图x,目的图y,缩放宽,缩放高)

### 保存会写数据
    // 保持当前canvas场景
    function saveImageData(){
      imgData=ctx.getImageData(0,0,W,H);
    }

    // 将当前canvas数据写回ctx
    function restoreImageData(){
      ctx.putImageData(imgData,0,0);
    }

### 阴影
    ctx.shadowColor='hsla(0,0%,0%,.1)';
    ctx.shadowOffsetX=-2;
    ctx.shadowOffsetY=-2;
    ctx.shadowBlur=4;

### 将canvas转换为base64图像
    var img=canvas.toDataURL('image/jpeg');
    
### 渐变
    // 线性渐变(开始坐标x，开始坐标y，结束坐标x，结束坐标y)
    var gradient=ctx.createLinearGradient(-Radius,0,Radius,0);
    gradient.addColorStop(0,'hsla(210,100%,0%,.3)');
    gradient.addColorStop(0.6,'hsla(210,100%,50%,.9)');
    gradient.addColorStop(1,'hsla(210,100%,100%,1)');
    
    // 径向渐变 (放射渐变 开始坐标x，开始坐标y，开始点半径，结束坐标x，结束坐标y，结束点半径)
    // 起始点和终点重合，则会画出一个渐变同心圆
    var rdGradient=ctx.createRadialGradient(0,10,0,0,10,30);
    rdGradient.addColorStop(0,'hsla(270,100%,50%,.25)');
    rdGradient.addColorStop(1,'hsla(270,100%,80%,0)');

### 创建圆角
    ctx.moveTo(cx+cRadius,cy);
    ctx.arcTo(cx+width,cy,cx+width,cy+height,cRadius);
    
### 设定裁剪区域
    ctx.save();
    // ..
    ctx.clip();//注意: clip 和 填充clip的动作，必须在同一 save,restore中
    // ..
    ctx.restore();

### transform
    // canvas坐标顺时针为正角度，逆时针为负角度
    // 坐标变换都是围绕坐标原点进行，所以如果只想变换部分图形，需要translate到该图形中点，然后将变换代码放到beginPath后面   
    // ctx.transform(a,b,c,d,e,f);
    // a  水平缩放绘图
    // b  水平倾斜绘图
    // c  垂直倾斜绘图
    // d  垂直缩放绘图
    // e  水平移动绘图
    // f  垂直移动绘图 
    
    矩阵表达式：
    x'   |a c e|   x
    y' = |b d f| * y
    1    |0 0 1|   1
    
    计算公式：
    x' = ax + cy + e
    y' = bx + dy + f

    ctx.transform(1,-1,0.5,1,0,0);// 斜切45度
    ctx.transform(-1,1,-1,0,0,0);//旋转90度，同时斜切
    ctx.transform(0,1,-1,0,100,0);//旋转90度 水平移动100
    ctx.scale(-1,-1);//水平加垂直镜像

## 获取图片数据
```javascript
    function getImageData(){
        img=drawImg();
        var imgData=img.getContext('2d').getImageData(0,0,img.width,img.height);

        // for(var i=0,len=imgData.data.length;i<len;i+=4){
        //  if(imgData.data[i+3]<128)continue;
        //  var x=Math.floor(i/4%img.width),
        //      y=Math.floor(i/4/img.width),
        //      color={
        //          r:imgData.data[i],
        //          g:imgData.data[i+1],
        //          b:imgData.data[i+2],
        //          a:imgData.data[i+3]
        //      };

        //  var point=new Particle(x,y,color,2000);
        //  point.dx=Random(x-40,x+40);
        //  point.dy=Random(y-80,y+80);
        //  points.push(point);
        // }

        for(var x=0;x<img.width;x++){
            for(var y=0;y<img.height;y++){
                var i = (y * imgData.width + x) * 4,
                    color={
                        r:imgData.data[i],
                        g:imgData.data[i+1],
                        b:imgData.data[i+2],
                        a:imgData.data[i+3]
                    };

                if(imgData.data[i+3]<128)continue;
                var x1=(W-img.width)/2+x,
                    y1=(H-img.height)/2+y,
                    point=new Particle(x1,y1,color,1200);

                point.dx=Random(x1-40,x1+40);
                point.dy=Random(y1-80,y1+80);
                points.push(point);
            }
        }
    }
```
## 自定义画矩形的方向 true：顺时针，false：逆时针
    function rect(x,y,w,h,direction){
        // ctx.beginPath();
        if(direction){
            ctx.moveTo(x, y);
            ctx.lineTo(x+w,y);
            ctx.lineTo(x+w,y+h);
            ctx.lineTo(x,y+h);
        } else {
            ctx.moveTo(x, y);
            ctx.lineTo(x,y+h);
            ctx.lineTo(x+w,y+h);
            ctx.lineTo(x+w,y);
        }
        ctx.closePath();
    }

## 运动和旋转
### 旋转角度
    dx = mouse.x - object.x;
    dy = mouse.y - object.y;
    object.rotation = Math.atan2(dy,dx)*180/Math.PI

### 平滑运动
     value = center + Math.sin(angle)*range;
     angle += speed;

### 正圆运动
     x_position = centerX + Math.sin(angle)*radius;
     y_position = centerY + Math.cos(angle)*radius;
     angle += speed;

### 椭圆运动
     x_position = centerX + Math.cos(angle)*radiusX;
     y_position = centerY + Math.sin(angle)*radiusY;
     angle += speed;

### 两点间距离
    dx = x2 - x1;
    dy = y2 - y1;
    dist = Math.sqrt(dx*dx + dy*dy);

### 知道中心点和当前坐标，得到旋转一定角度后的位置
      var x1 = ball.x - centerX; //相对中心点的位置
      var y1 = ball.y - centerY;

      var newX = x1*cos - y1*sin; //旋转一定角度后的位置
      var newY = y1*cos + x1*sin;

      ball.x = centerX + newX; //更新球的位置
      ball.y = centerY + newY;


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


## 物理碰撞
### 边界检测
```javascript
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

    // 3. 边界环绕
    if(object.x - object.width/2 > right){
        object.x = left - object.width/2;
    } else if(object.x + object.width/2 < left){
        object.x = object.width/2 + right；
    }
    if(object.y - object.height/2 > bottom){
        object.y = top - object.height/2;
    } else if(object.y + object.height/2 < top){
        object.y = object.height/2 + bottom；
    }
```
### 基于距离的碰撞检测
    var dx = objectB.x - objectA.x,
        dy = objectB.y - objectA.y;
    var distance = Math.sqrt(dx*dx + dy*dy);
    if(distance < objectA.radius + objectB.radius){
        //do something
    }

### 多物体碰撞检测
    objects.forEach(function(objectA, i){
        for(var j=i+1; i<objects.lebgth; i++){
            //do something
        }
    })
    
### 角度反弹
    newX = x*cos - y*sin;
    newY = y*cos + x*sin;

### 旋转回去
    newX = x*cos + y*sin;
    newY = y*cos - x*sin;

### 动量守恒
    p = m * v
    m1 * v1 + m2 * v2 = m1 * v1F + m2 * v2F

### 能量守恒
    E = 0.5 * m * v^2
    (0.5 * m1 * v1^2) + (0.5 * m2 * v2^2) = (0.5 * m1 * v1F^2) + (0.5 * m2 * v2F^2)

### 遵循动量守恒和能量守恒的碰撞后的速度大小
    v0Final = ((m0 - m1)*v0 + 2*m1*v1) / (m0 + m1);
    v1Final = ((m1 - m0)*v1 + 2*m0*v0) / (m0 + m1);
 
### 精简版
    var vxTotal = vx0 - vx1;
    vx0 = ((ball0.mass - ball1.mass)*vx0 + 2*ball1.mass*vx1)/(ball0.mass + ball1.mass);
    vx1 = vxTotal + vx0;

## 物理效果
### 速度与加速度    
    // 任意方向速度
    vx = speed * Math.cos(angle);
    vy = speed * Math.sin(angle);

    // 任意方向加速度
    ax = force * Math.cos(angle);
    ay = force * Math.xin(angle);

    // 改变速度
    vx += ax;
    vx += ay;

    // 改变位置
    object.x += vx;
    object.y += vy;  

### 摩擦力(正规军)
    speed = Math.sqrt(vx*vx + vy*vy);
    angle = Math.atan2(vy, vx);
    if(speed > f){
         speed -= f;
    }else{
        speed = 0;
    }
    vx = Math.cos(angle)*speed;
    vy = Math.sin(angle)*speed;

### 摩擦力(野战军)
      vx += vx*f;
      vy += vy*f;

### 万有引力
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


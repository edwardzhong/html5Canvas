function Ball3d(radius,color){
    this.x = 0;
    this.y = 0;
    this.xpos = 0;//三维坐标
    this.ypos = 0;
    this.zpos = 0;
    this.vz = 0;//三维中的速度
    this.vx = 0;
    this.vy = 0;
    this.radius = radius||20;
    this.rotation = 0;
    this.mass = 1;
    this.scaleX = 1;
    this.scaleY = 1;
    this.name = "";
    this.color = color||'#0000ff';
    this.lineWidth = 1;
    this.visible = true;
}

Ball3d.prototype.draw = function(context){
    context.save();
    context.translate(this.x,this.y);
    context.rotate(this.rotation);
    context.scale(this.scaleX,this.scaleY);
    context.lineWidth = this.lineWidth;
    context.fillStyle = this.color;
    context.strokeStyle = this.color;
    context.beginPath();
    context.arc(0,0,this.radius,0,Math.PI*2,false);
    context.closePath();
    context.fill();
    context.stroke();
    context.restore();
}

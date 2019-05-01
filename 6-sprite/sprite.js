var Sprite=function(name,painter,behaviors){
	if(name) this.name=name;
	if(painter) this.painter=painter;

	this.top=0;
	this.left=0;
	this.width=10;
	this.height=10;
	this.velocityX=0;
	this.velocityY=0;
	this.visible=true;
	this.animating=false;
	this.behaviors=behaviors||[];

	return this;
};

Sprite.prototype={
	paint:function(context){
		if(this.painter&&this.visible){
			this.painter.paint(this,context);
		}
	},
	update:function(context,time){
		for(var i=0;i<this.behaviors.length;i++){
			this.behaviors[i].execute(this,context,time);
		}
	}
};
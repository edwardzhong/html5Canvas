function roundRect(ctx,x,y,width,height,radius){
	ctx.beginPath();
	if(width>0){
		ctx.moveTo(x+radius,y);
	} else {
		ctx.moveTo(x-radius,y);
	}

	ctx.arcTo(x+width,y,x+width,y+height,radius);
	ctx.arcTo(x+width,y+height,x,y+height,radius);
	ctx.arcTo(x,y+height,x,y,radius);

	if(width>0){
		ctx.arcTo(x,y,x+radius,y,radius);
	} else {
		ctx.arcTo(x,y,x-radius,y,radius);
	}
}

function calculateY(arr){
	var high=Math.max.apply(this,arr),
		low=Math.min.apply(this,arr),
		num=0,max=0,min=0,
		pow,sum,step,absLow;
	outer:
	for(var i=0;i<10;i++){
		pow=Math.pow(10,i);
		for(var j=0;j<10;j++){
			sum=pow+pow/2*j;
			if(Math.floor(high/sum)<=0){
				max=sum;
				break outer;
			}
		}
	}
	num=Math.min(i+j,5);
	step=num?Math.ceil(max/num):0;
	max=step*num;
	if(low<0){
		absLow=Math.abs(low);
		num++;
		min+=step;
		while(min<absLow){
			num++;
			min+=step;
		}
		min=-min;
	}
	return {
		num:num,
		step:step,
		min:min,
		max:max
	}
}

class Chart{
	constructor(container){
		this.container=container;
		this.canvas=document.createElement('canvas');
		this.ctx=this.canvas.getContext('2d');
		this.W=1000*2;
		this.H=600*2;
		this.padding=120;
		this.paddingTop=50;
		this.title='';
		this.legend=[];
		this.series=[];
		this.xAxis={};
		this.yAxis=[];
		this.animateArr=[];
		this.info={};
		//通过缩小一倍，解决字体模糊问题
		this.canvas.width=this.W;
		this.canvas.height=this.H;
		this.canvas.style.width = this.W/2 + 'px';
		this.canvas.style.height = this.H/2 + 'px';
	}
}
class Bar extends Chart{
	constructor(container){
		super(container);
	}
	init(opt){
		Object.assign(this,opt);
		if(!this.container)return;
		this.container.style.position='relative';
		this.tip=document.createElement('div');
		this.tip.style.cssText='display: none; position: absolute; opacity: 0.5; background: #000; color: #fff; border-radius: 5px; padding: 5px; font-size: 8px; z-index: 99;';
		this.container.appendChild(this.canvas);
		this.container.appendChild(this.tip);
		this.draw();
		this.bindEvent();
	}
	bindEvent(){
		var that=this,
			canvas=this.canvas,
			ctx=this.ctx;
		this.canvas.addEventListener('mousemove',function(e){
			var isLegend=false;
				// pos=WindowToCanvas(canvas,e.clientX,e.clientY);
			var box=canvas.getBoundingClientRect();
			var pos = {
				x:e.clientX-box.left,
				y:e.clientY-box.top
			};
			// 分组标签
			for(var i=0,item,len=that.legend.length;i<len;i++){
				item=that.legend[i];
				ctx.save();
				roundRect(ctx,item.x,item.y,item.w,item.h,item.r);
				// 因为缩小了一倍，所以坐标要*2
				if(ctx.isPointInPath(pos.x*2,pos.y*2)){
					canvas.style.cursor='pointer';
					ctx.restore();
					isLegend=true;
					break;
				}
				canvas.style.cursor='default';
				ctx.restore();
			}

			if(isLegend) return;
			//选择数据项
			for(var i=0,item,len=that.animateArr.length;i<len;i++){
				item=that.animateArr[i];
				ctx.save();
				ctx.fillStyle=item.color;
				ctx.beginPath();//重要
				ctx.rect(that.padding+item.x,that.H-that.padding-item.h,item.w,item.h);
				if(ctx.isPointInPath(pos.x*2,pos.y*2)){
					ctx.clearRect(that.padding+item.x,that.H-that.padding-item.h,item.w,item.h);
					ctx.globalAlpha=0.5;
					ctx.fill();
					canvas.style.cursor='pointer';
					that.showInfo(pos,item);
					ctx.restore();
					break;
				}
				canvas.style.cursor='default';
				that.tip.style.display='none';
				ctx.globalAlpha=1;
				ctx.fill();
				ctx.restore();
			}
			
		},false);

		this.canvas.addEventListener('mousedown',function(e){
			e.preventDefault();
			var box=canvas.getBoundingClientRect();
			var pos = {
				x:e.clientX-box.left,
				y:e.clientY-box.top
			};
			for(var i=0,item,len=that.legend.length;i<len;i++){
				item=that.legend[i];
				roundRect(ctx,item.x,item.y,item.w,item.h,item.r);
				// 因为缩小了一倍，所以坐标要*2
				if(ctx.isPointInPath(pos.x*2,pos.y*2)){
					that.series[i].hide=!that.series[i].hide;
					that.animateArr.length=0;
					that.draw();
					break;
				}
			}

		},false);
	}
	showInfo(pos,obj){
		var txt=this.yAxis.formatter?this.yAxis.formatter.replace('{value}',obj.num):obj.num;
		var box=this.canvas.getBoundingClientRect();
		var con=this.container.getBoundingClientRect();
		this.tip.innerHTML = '<p>'+obj.name+':'+txt+'</p>';
		this.tip.style.left=(pos.x+(box.left-con.left)+10)+'px';
		this.tip.style.top=(pos.y+(box.top-con.top)+10)+'px';
		this.tip.style.display='block';
	}
	animate(){
		var that=this,
			ctx=this.ctx,
			isStop=true;
		(function run(){
			isStop=true;
			for(var i=0,item;i<that.animateArr.length;i++){
				item=that.animateArr[i];
				if(item.y-item.h>=0.1){
					item.y=item.h;
				} else {
					item.y+=item.vy;
				}
				if(item.y<item.h){
					ctx.save();
					// ctx.translate(that.padding+item.x,that.H-that.padding);
					ctx.fillStyle=item.color;
					ctx.fillRect(that.padding+item.x,that.H-that.padding-item.y,item.w,item.y);
					ctx.restore();
					isStop=false;
				}
			}
			if(isStop)return;
			requestAnimationFrame(run);
		}())
	}
	showData(){
		//画数据
		var that=this,
			ctx=this.ctx,
			max=this.info.max,
			xl=this.xAxis.data.length,
			xs=(that.W-2*that.padding)/(xl-1),
			ydis=this.H-this.padding*2-this.paddingTop,
			sl=this.series.filter(s=>!s.hide).length,
			sp=Math.max(Math.pow(10-sl,2)/3-4,5),
			w=(xs-sp*(sl+1))/sl,
			h,x,index=0;
		that.animateArr.length=0;
		// 展开数据项，填入动画队列
		for(var i=0,item,len=this.series.length;i<len;i++){
			item=this.series[i];
			if(item.hide)continue;
			item.data.slice(0,xl).forEach((d,j)=>{
				h=d/max*ydis;
				x=xs*j+w*index+sp*(index+1);
				that.animateArr.push({
					index:i,
					name:item.name,
					num:d,
					x:Math.round(x),
					y:1,
					w:Math.round(w),
					h:Math.floor(h+2),
					vy:Math.max(300,Math.floor(h*2))/100,
					color:item.color
				});
			});
			index++;
		}
		this.animate();
	}
	draw(){
		var that=this,
			ctx=this.ctx,
			canvas=this.canvas,
			W=this.W,
			H=this.H,
			padding=this.padding,
			paddingTop=this.paddingTop,
			xl=0,xs=0,xdis=W-padding*2,//x轴单位数，每个单位长度，x轴总长度
			yl=0,ys=0,ydis=H-padding*2-paddingTop;//y轴单位数，每个单位长度，y轴总长度

		ctx.fillStyle='hsla(0,0%,20%,1)';
		ctx.strokeStyle='hsla(0,0%,10%,1)';
		ctx.lineWidth=1;
		ctx.textAlign='center';
		ctx.textBaseLine='middle';
		ctx.font='24px arial';

		ctx.clearRect(0,0,W,H);
		if(this.title){
			ctx.save();
			ctx.textAlign='left';
			ctx.font='bold 40px arial';
			ctx.fillText(this.title,padding-50,70);
			ctx.restore();
		}
		if(this.yAxis&&this.yAxis.name){
			ctx.fillText(this.yAxis.name,padding,padding+paddingTop-30);
		}

		// x轴
		ctx.save();
		ctx.beginPath();
		ctx.translate(padding,H-padding);
		ctx.moveTo(0,0);
		ctx.lineTo(W-2*padding,0);
		ctx.stroke();
		// x轴刻度
		if(this.xAxis&&(xl=this.xAxis.data.length)){
			xs=(W-2*padding)/xl;
			this.xAxis.data.forEach((obj,i)=>{
				var x=xs*(i+1);
				ctx.moveTo(x,0);
				ctx.lineTo(x,10);
				ctx.stroke();
				ctx.fillText(obj,x-xs/2,40);
			});
		}
		ctx.restore();

		// y轴
		ctx.save();
		ctx.beginPath();
		ctx.strokeStyle='hsl(220,100%,50%)';
		ctx.translate(padding,H-padding);
		ctx.moveTo(0,0);
		ctx.lineTo(0,2*padding+paddingTop-H);
		ctx.stroke();
		ctx.restore();

		if(this.series.length){			
			var arr=[],txt,dim,info,item,tw=0;
			for(var i=0;i<this.series.length;i++){
				item=this.series[i];
				if(!item.data||!item.data.length){
					this.series.splice(i--,1);continue;
				}
				// 赋予没有颜色的项
				if(!item.color){
					var hsl=i%2?180+20*i/2:20*(i-1);
					item.color='hsla('+hsl+',70%,60%,1)';
				}
				item.name=item.name||'unnamed';

				// 画分组标签
				ctx.save();
				ctx.translate(padding+W/4,paddingTop+40);
				that.legend.push({
					hide:item.hide||false,
					name:item.name,
					color:item.color,
					x:padding+that.W/4+i*90+tw,
					y:paddingTop+40,
					w:60,
					h:30,
					r:5
				});
				ctx.textAlign='left';
				ctx.fillStyle=item.color;
				ctx.strokeStyle=item.color;
				roundRect(ctx,i*90+tw,0,60,30,5);
				ctx.globalAlpha=item.hide?0.3:1;
				ctx.fill();
				ctx.fillText(item.name,i*90+tw+70,26);
				tw+=ctx.measureText(item.name).width;//计算字符长度
				ctx.restore();

				if(item.hide)continue;
				arr=arr.concat(item.data.slice(0,xl));
			}
			//计算数据在Y轴刻度
			this.info=calculateY(arr);
			yl=this.info.num;
			ys=ydis/yl;

			//画Y轴刻度
			ctx.save();
			ctx.fillStyle='hsl(200,100%,60%)';
			ctx.translate(padding,H-padding);
			for(var i=0;i<=yl;i++){
				ctx.beginPath();
				ctx.strokeStyle='hsl(220,100%,50%)';
				ctx.moveTo(-10,-Math.floor(ys*i));
				ctx.lineTo(0,-Math.floor(ys*i));
				ctx.stroke();

				ctx.beginPath();
				ctx.strokeStyle='hsla(0,0%,80%,1)';
				ctx.moveTo(0,-Math.floor(ys*i));
				ctx.lineTo(xdis,-Math.floor(ys*i));
				ctx.stroke();

				ctx.textAlign='right';
				dim=Math.floor(this.info.step*i+this.info.min);
				txt=this.yAxis.formatter?this.yAxis.formatter.replace('{value}',dim):dim;
				ctx.fillText(txt,-20,-ys*i+10);
			}
			ctx.restore();
			//画数据
			this.showData();
		}
	}
}

class Line extends Chart{
	constructor(container){
		super(container);
	}
	init(opt){
		Object.assign(this,opt);
		if(!this.container)return;
		this.container.style.position='relative';
		this.tip=document.createElement('div');
		this.tip.style.cssText='display: none; position: absolute; opacity: 0.5; background: #000; color: #fff; border-radius: 5px; padding: 5px; font-size: 8px; z-index: 99;';
		this.container.appendChild(this.canvas);
		this.container.appendChild(this.tip);
		this.draw();
		this.bindEvent();
	}
	bindEvent(){
		var that=this,
			ctx=that.ctx,
			canvas=that.canvas,
			xl=this.xAxis.data.length,
			xs=(that.W-2*that.padding)/(xl-1),
			index=0;
		this.canvas.addEventListener('mousemove',function(e){
			var isLegend=false;
				// pos=WindowToCanvas(canvas,e.clientX,e.clientY);
			var box=canvas.getBoundingClientRect();
			var pos = {
				x:e.clientX-box.left,
				y:e.clientY-box.top
			};
			// 分组标签
			for(var i=0,item,len=that.legend.length;i<len;i++){
				item=that.legend[i];
				ctx.save();
				roundRect(ctx,item.x,item.y,item.w,item.h,item.r);
				// 因为缩小了一倍，所以坐标要*2
				if(ctx.isPointInPath(pos.x*2,pos.y*2)){
					canvas.style.cursor='pointer';
					ctx.restore();
					isLegend=true;
					break;
				}
				canvas.style.cursor='default';
				ctx.restore();
			}

			if(isLegend) return;
			// 鼠标位置在图表中时
			if(pos.y*2>that.padding+that.paddingTop && pos.y*2<that.H-that.padding && pos.x*2>that.padding && pos.x*2<that.W-that.padding){
				canvas.style.cursor='pointer';
				for(var i=0;i<xl;i++){
					if(pos.x*2>i*xs){
						index=i;
					}
				}

				that.clearGrid(index);
				// // 画十字坐标
				// ctx.save();
				// ctx.lineWidth=0.5;
				// ctx.strokeStyle='hsla(0,0%,60%,1)';
				// ctx.moveTo(that.padding,pos.y*2);
				// ctx.lineTo(that.W-that.padding,pos.y*2);

				// ctx.moveTo(pos.x*2,that.padding+that.paddingTop);
				// ctx.lineTo(pos.x*2,that.H-that.padding);
				// ctx.stroke();
				// 获取处于当前位置的信息
				var arr=[];
				for(var j=0,item,l=that.animateArr.length;j<l;j++){
					item=that.animateArr[j];
					if(item.hide)continue;
					arr.push({name:item.name, num:item.data[index].num})
				}
				that.showInfo(pos,arr);
				ctx.restore();
			} else {
				that.tip.style.display='none';
				that.clearGrid();
			}

		},false);

		this.canvas.addEventListener('mousedown',function(e){
			e.preventDefault();
			var box=that.canvas.getBoundingClientRect();
			var pos = {
				x:e.clientX-box.left,
				y:e.clientY-box.top
			};
			for(var i=0,item,len=that.legend.length;i<len;i++){
				item=that.legend[i];
				roundRect(ctx,item.x,item.y,item.w,item.h,item.r);
				// 因为缩小了一倍，所以坐标要*2
				if(ctx.isPointInPath(pos.x*2,pos.y*2)){
					that.series[i].hide=!that.series[i].hide;
					that.animateArr.length=0;
					that.draw();
					break;
				}
			}
		},false);
	}
	showInfo(pos,arr){
		var box=this.canvas.getBoundingClientRect(),
			con=this.container.getBoundingClientRect(),
			html='',txt='';
		arr.forEach(obj=>{
			txt=this.yAxis.formatter?this.yAxis.formatter.replace('{value}',obj.num):obj.num;
			html+='<p>'+obj.name+': '+txt+'</p>';
		})
		this.tip.innerHTML = html; 
		this.tip.style.left=(pos.x+(box.left-con.left)+10)+'px';
		this.tip.style.top=(pos.y+(box.top-con.top)+10)+'px';
		this.tip.style.display='block';
	}
	clearGrid(index){
		var that=this,
			ctx=this.ctx;
		ctx.clearRect(that.padding+1,that.padding+that.paddingTop,that.W-2*that.padding,that.H-2*that.padding-that.paddingTop);
		that.drawY();
		ctx.save();
		ctx.translate(that.padding,that.H-that.padding);
		for(var i=0,item,il=that.animateArr.length;i<il;i++){
			item=that.animateArr[i];
			if(item.hide)continue;
			ctx.lineWidth=3;
			ctx.strokeStyle=item.color;
			ctx.fillStyle='#fff';
			ctx.beginPath();
			for(var j=0,obj,jl=item.data.length;j<jl;j++){
				obj=item.data[j];
				if(j==0){
					ctx.moveTo(obj.x,-obj.h);
				} else {
					ctx.lineTo(obj.x,-obj.h);
				}
			}
			ctx.stroke();
			//画完曲线后再画圆球
			for(var j=0,obj,jl=item.data.length;j<jl;j++){
				obj=item.data[j];
				if(index===j){	
					ctx.lineWidth=1;
					ctx.strokeStyle='hsla(0,0%,70%,1)';
					ctx.moveTo(j==0?obj.x+1.5:obj.x,-that.H+that.paddingTop+2*that.padding);
					ctx.lineTo(j==0?obj.x+1.5:obj.x,0);
					ctx.stroke();
					ctx.fillStyle=item.color;
				} else {
					ctx.lineWidth=3;
					ctx.fillStyle='#fff';
					ctx.strokeStyle=item.color;
				}
				ctx.beginPath();
				ctx.arc(obj.x,-obj.h,5,0,Math.PI*2,false);
				ctx.stroke();
				ctx.fill();
			}
		}
		ctx.restore();
	}
	animate(){
		var that=this,
			ctx=this.ctx,
			xdis=that.W-that.padding*2,
			prev,
			x=0,y=0;
		(function run(){
			if(x>xdis){
				that.clearGrid();
				return;
			}
			ctx.save();
			ctx.translate(that.padding,that.H-that.padding);
			for(var i=0,item,il=that.animateArr.length;i<il;i++){
				item=that.animateArr[i];
				if(item.hide)continue;
				ctx.lineWidth=3;
				ctx.strokeStyle=item.color;
				ctx.fillStyle='#fff';
				ctx.beginPath();
				for(var j=0,obj,jl=item.data.length;j<jl;j++){
					obj=item.data[j];
					prev=item.data[j-1];
					if(j==0){
						ctx.moveTo(obj.x,-obj.h);
					} else if(x>=obj.x){
						ctx.lineTo(obj.x,-obj.h);
					} else if(x<obj.x){
						//获取在两个区间之间的y坐标
						y=prev.h+(x-prev.x)/(obj.x-prev.x)*(obj.h-prev.h)
						ctx.lineTo(x,-y);
						break;
					}
				}
				ctx.stroke();
				//画完曲线后再画圆球
				for(var j=0,obj,jl=item.data.length;j<jl;j++){
					obj=item.data[j];
					if(x>=obj.x){
						ctx.beginPath();
						ctx.arc(obj.x,-obj.h,4,0,Math.PI*2,false);
						ctx.stroke();
						ctx.fill();
					}
				}
			}
			ctx.restore();
			x+=20;
			requestAnimationFrame(run);
		}())
	}
	showData(){
		//画数据
		var that=this,
			ctx=this.ctx,
			min=this.info.min,
			max=this.info.max,
			ydis=this.H-this.padding*2-this.paddingTop,
			sl=this.series.filter(s=>!s.hide).length,
			xl=this.xAxis.data.length,
			xs=(that.W-2*that.padding)/(xl-1),
			obj,
			h,x;
		that.animateArr.length=0;
		// 展开数据项，填入动画队列
		for(var i=0,item,len=this.series.length;i<len;i++){
			item=this.series[i];
			obj=Object.assign({},{
				i:i,
				hide:!!item.hide,
				name:item.name,
				color:item.color,
				data:[]
			});
			// if(item.hide)continue;
			item.data.slice(0,xl).forEach((d,j)=>{
				h=(d-min)/(max-min)*ydis;
				x=xs*j;
				obj.data.push({
					num:d,
					h:Math.floor(h+2),
					x:Math.round(x),
					y:1
				});
			});
			that.animateArr.push(obj);
		}
		this.animate();
	}
	drawY(){
		var xdis=this.W-this.padding*2,
			ydis=this.H-this.padding*2-this.paddingTop,
			yl=this.info.num,
			ys=ydis/yl,
			ctx=this.ctx;
		//画Y轴刻度
		ctx.save();
		ctx.fillStyle='hsl(200,100%,60%)';
		ctx.translate(this.padding,this.H-this.padding);
		for(var i=0;i<=yl;i++){
			ctx.beginPath();
			ctx.strokeStyle='hsl(220,100%,50%)';
			ctx.moveTo(-10,-Math.floor(ys*i));
			ctx.lineTo(0,-Math.floor(ys*i));
			ctx.stroke();

			ctx.beginPath();
			ctx.strokeStyle='hsla(0,0%,80%,1)';
			ctx.moveTo(0,-Math.floor(ys*i));
			ctx.lineTo(xdis,-Math.floor(ys*i));
			ctx.stroke();

			ctx.textAlign='right';
			var dim=Math.floor(this.info.step*i+this.info.min),
				txt=this.yAxis.formatter?this.yAxis.formatter.replace('{value}',dim):dim;
			ctx.fillText(txt,-20,-ys*i+10);
		}
		ctx.restore();
	}
	draw(){
		var that=this,
			ctx=this.ctx,
			canvas=this.canvas,
			W=this.W,
			H=this.H,
			padding=this.padding,
			paddingTop=this.paddingTop,
			xl=0,xs=0,xdis=W-padding*2;//x轴单位数，每个单位长度，x轴总长度

		ctx.fillStyle='hsla(0,0%,20%,1)';
		ctx.strokeStyle='hsla(0,0%,10%,1)';
		ctx.lineWidth=1;
		ctx.textAlign='center';
		ctx.textBaseLine='middle';
		ctx.font='24px arial';

		ctx.clearRect(0,0,W,H);
		if(this.title){
			ctx.save();
			ctx.textAlign='left';
			ctx.font='bold 40px arial';
			ctx.fillText(this.title,padding-50,70);
			ctx.restore();
		}
		if(this.yAxis&&this.yAxis.name){
			ctx.fillText(this.yAxis.name,padding,padding+paddingTop-30);
		}

		// x轴
		ctx.save();
		ctx.beginPath();
		ctx.translate(padding,H-padding);
		ctx.moveTo(0,0);
		ctx.lineTo(W-2*padding,0);
		ctx.stroke();
		// x轴刻度
		if(this.xAxis&&(xl=this.xAxis.data.length)){
			xs=(W-2*padding)/(xl-1);
			this.xAxis.data.forEach((obj,i)=>{
				var x=xs*(i+1);
				ctx.moveTo(x,0);
				ctx.lineTo(x,10);
				ctx.stroke();
				ctx.fillText(obj,x-xs,40);
			});
		}
		ctx.restore();

		// y轴
		ctx.save();
		ctx.beginPath();
		ctx.strokeStyle='hsl(220,100%,50%)';
		ctx.translate(padding,H-padding);
		ctx.moveTo(0,0);
		ctx.lineTo(0,2*padding+paddingTop-H);
		ctx.stroke();
		ctx.restore();

		if(this.series.length){			
			var arr=[],txt,dim,info,item,tw=0;
			for(var i=0;i<this.series.length;i++){
				item=this.series[i];
				if(!item.data||!item.data.length){
					this.series.splice(i--,1);continue;
				}
				// 赋予没有颜色的项
				if(!item.color){
					var hsl=i%2?180+20*i/2:20*(i-1);
					item.color='hsla('+hsl+',70%,60%,1)';
				}
				item.name=item.name||'unnamed';

				// 画分组标签
				ctx.save();
				ctx.translate(padding+W/4,paddingTop+40);
				that.legend.push({
					hide:item.hide||false,
					name:item.name,
					color:item.color,
					x:padding+that.W/4+i*90+tw,
					y:paddingTop+40,
					w:60,
					h:30,
					r:5
				});
				ctx.textAlign='left';
				ctx.fillStyle=item.color;
				ctx.strokeStyle=item.color;
				roundRect(ctx,i*90+tw,0,60,30,5);
				ctx.globalAlpha=item.hide?0.3:1;
				ctx.fill();
				ctx.fillText(item.name,i*90+tw+70,26);
				tw+=ctx.measureText(item.name).width;//计算字符长度
				ctx.restore();

				if(item.hide)continue;
				arr=arr.concat(item.data.slice(0,xl));
			}
			// 计算数据在Y轴刻度
			this.info=calculateY(arr);

			// 画y轴刻度
			this.drawY();
			// 画数据
			this.showData();
		}
	}
}
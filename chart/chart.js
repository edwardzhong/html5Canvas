/**
 * canvas chart
 * author:jeff zhong
 */
window.requestAnimationFrame=window.requestAnimationFrame 
    || window.webkitRequestAnimationFrame 
    || window.mozRequestAnimationFrame 
    || window.oRequestAnimationFrame 
    || window.msRequestAnimationFrame 
    || function(callback) {return window.setTimeout(callback, 1000/60); };

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

function calculateNum(arr,isMin){
	if(!arr||!arr.length){
		return {
			num:0,
			step:0,
			min:0,
			max:0
		}
	}
	var high=Math.max.apply(this,arr),
		low=Math.min.apply(this,arr),
		num=0,max=0,min=0,
		pow,sum,step,absLow,i,j;
	outer:
	for(i=0;i<10;i++){
		pow=Math.pow(10,i);
		if(i>1){
			for(j=1;j<=10;j++){
				sum=pow+pow/10*j
				if(sum>high){
					max=sum;
					break outer;
				}
			}	
		}
		for(j=1;j<=10;j++){
			sum=pow*j
			if(sum>high){
				max=sum;
				break outer;
			}
		}
	}
	num=Math.max(j,2);
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

	if(isMin){
		var l=num,m=0;
		for(var i=1;i<l;i++){
			var n=min+i*step;
			if(low<n){break;}
			m=n;
			num--;
		}
		min=m;
	}
	return {
		num:num,
		step:step,
		min:min,
		max:max
	}
}
/**
 * 图表基类
 */
class Chart{
	constructor(container){
		this.container=container;
		this.canvas=document.createElement('canvas');
		this.ctx=this.canvas.getContext('2d');
		this.W=1000;
		this.H=600;
		this.padding=120;
		this.paddingTop=50;
		this.title='';
		this.legend=[];
		this.series=[];
		this.xAxis={};
		this.yAxis=[];
		this.animateArr=[];
		this.info={};
		this.drawing=false;
	}
	init(opt){
		Object.assign(this,opt);
		if(!this.container)return;
		//通过缩小一倍，解决字体模糊问题
		this.W*=2;
		this.H*=2;
		this.canvas.width=this.W;
		this.canvas.height=this.H;
		this.canvas.style.width = this.W/2 + 'px';
		this.canvas.style.height = this.H/2 + 'px';
		this.container.style.position='relative';
		this.tip=document.createElement('div');
		this.tip.style.cssText='display: none; position: absolute; opacity: 0.5; background: #000; color: #fff; border-radius: 5px; padding: 5px; font-size: 8px; z-index: 99;';
		this.container.appendChild(this.canvas);
		this.container.appendChild(this.tip);
		this.create();
		this.bindEvent();
	}
	showInfo(pos,title,arr){
		var box=this.canvas.getBoundingClientRect(),
			con=this.container.getBoundingClientRect(),
			html='',txt='';
		html+='<p>'+title+'</p>';
		arr.forEach(obj=>{
			txt=this.yAxis.formatter?this.yAxis.formatter.replace('{value}',obj.num):obj.num;
			html+='<p>'+obj.name+': '+txt+'</p>';
		})
		this.tip.innerHTML = html; 
		this.tip.style.left=(pos.x+(box.left-con.left)+15)+'px';
		this.tip.style.top=(pos.y+(box.top-con.top)+15)+'px';
		this.tip.style.display='block';
	}
}
/**
 * 柱状图
 */
class Bar extends Chart{
	constructor(container){
		super(container);
	}
	bindEvent(){
		var that=this,
			canvas=this.canvas,
			ctx=this.ctx,
			xl=this.xAxis.data.length,
			xs=(that.W-2*that.padding)/xl,
			index=0;

		if(!this.series.length) return;
		this.canvas.addEventListener('mousemove',function(e){
			var isLegend=false;
			var box=canvas.getBoundingClientRect(),
				pos = {
				x:e.clientX-box.left,
				y:e.clientY-box.top
			};
			// 分组标签
			for(var i=0,item,len=that.legend.length;i<len;i++){
				item=that.legend[i];
				roundRect(ctx,item.x,item.y,item.w,item.h,item.r);
				// 因为缩小了一倍，所以坐标要*2
				if(ctx.isPointInPath(pos.x*2,pos.y*2)){
					canvas.style.cursor='pointer';
					isLegend=true;
					break;
				}
				canvas.style.cursor='default';
			}

			if(isLegend) return;
			// 鼠标位置在图表中时
			if(pos.y*2>that.padding+that.paddingTop && pos.y*2<that.H-that.padding && pos.x*2>that.padding && pos.x*2<that.W-that.padding){
				canvas.style.cursor='pointer';
				for(var i=0;i<xl;i++){
					if(pos.x*2>that.padding+i*xs){
						index=i;
					}
				}

				that.clearGrid(index);

				// 获取处于当前位置的信息
				var arr=[];
				for(var j=0,item,l=that.animateArr.length;j<l;j++){
					item=that.animateArr[j];
					if(item.hide)continue;
					arr.push({name:item.name, num:item.data[index].num})
				}
				that.showInfo(pos,that.xAxis.data[index],arr);
			} else {
				that.tip.style.display='none';
				that.clearGrid();
			}
		},false);

		this.canvas.addEventListener('mousedown',function(e){
			e.preventDefault();
			var box=canvas.getBoundingClientRect(),
				pos = {
				x:e.clientX-box.left,
				y:e.clientY-box.top
			};
			for(var i=0,item,len=that.legend.length;i<len;i++){
				item=that.legend[i];
				roundRect(ctx,item.x,item.y,item.w,item.h,item.r);
				// 因为缩小了一倍，所以坐标要*2
				if(ctx.isPointInPath(pos.x*2,pos.y*2)){
					that.series[i].hide=!that.series[i].hide;
					that.create();
					break;
				}
			}

		},false);
	}
	clearGrid(index){
		var that=this,
			ctx=this.ctx,
			xl=this.xAxis.data.length,
			xs=(this.W-2*this.padding)/xl,
			h=this.H-2*this.padding-this.paddingTop;

		ctx.clearRect(0,0,that.W,that.H);
		// 画坐标系
		this.drawAxis();
		// 画标签
		this.drawTag();
		// 画y轴刻度
		this.drawY();

		ctx.save();
		ctx.translate(that.padding,that.H-that.padding);
		// 选中组
		if(typeof index== 'number'){
			ctx.fillStyle='hsla(0,0%,70%,0.5)';
			ctx.fillRect(xs*index,-h,xs,h-1);
		}

		for(var i=0,item,il=that.animateArr.length;i<il;i++){
			item=that.animateArr[i];
			if(item.hide)continue;			
			ctx.strokeStyle=item.color;
			ctx.lineWidth=item.data[0].w;

			for(var j=0,obj,jl=item.data.length;j<jl;j++){
				obj=item.data[j];
				ctx.beginPath();
				ctx.moveTo(obj.x+obj.w/2,-obj.h);
				ctx.lineTo(obj.x+obj.w/2,-1);
				ctx.stroke();
				// ctx.fillRect(obj.x,-obj.h,obj.w,obj.h-1);
			}
		}
		ctx.restore();
	}
	animate(){
		var that=this,
			ctx=this.ctx,
			obj,h=0,
			isStop=true;

		(function run(){
			ctx.clearRect(0,that.padding+that.paddingTop-5,that.W,that.H-2*that.padding-that.paddingTop+4);
			that.drawY();

			ctx.save();
			ctx.translate(that.padding,that.H-that.padding);
			isStop=true;
			for(var i=0,item;i<that.animateArr.length;i++){
				item=that.animateArr[i];
				if(item.hide) continue;
				ctx.strokeStyle=item.color;
				ctx.lineWidth=item.data[0].w;
				item.isStop=true;
				for(var j=0,jl=item.data.length;j<jl;j++){
					obj=item.data[j];
					if(obj.p>obj.h){
						h=obj.y-4;
						if(h<obj.h){
							obj.y=obj.p=obj.h;
						}
					} else {
						h=obj.y+4;
						if(h>obj.h){
							obj.y=obj.p=obj.h;
						}
					}
					if(obj.p!=obj.h){
						obj.y=h;
						item.isStop=false;
					}

					ctx.beginPath();
					ctx.moveTo(obj.x+obj.w/2,-obj.y);
					ctx.lineTo(obj.x+obj.w/2,-1);
					ctx.stroke();
				}
				if(!item.isStop){isStop=false; }
			}
			ctx.restore();
			if(isStop)return;
			requestAnimationFrame(run);
		}())
	}
	create(){
		// 画坐标系
		this.drawAxis();

		this.initData();
		// 画标签
		this.drawTag();
		// 画y轴刻度
		this.drawY();
		// 执行动画
		this.animate();
	}
	initData(){
		var that=this,
			xl=this.xAxis.data.length,
			xs=(this.W-2*this.padding)/xl,
			ydis=this.H-this.padding*2-this.paddingTop,
			item, obj,arr=[],
			sp=0, sl=0, min=0,max=0,w=0,h=0,index=0;

		if(!this.series.length) return;
		for(var i=0;i<this.series.length;i++){
			item=this.series[i];
			if(!item.data||!item.data.length){
				this.series.splice(i--,1);continue;
			}
			// 赋予没有颜色的项
			if(!item.color){
				var hsl=i%2?180+30*(i-1):30*i/2;
				item.color='hsla('+hsl+',70%,60%,1)';
			}
			item.name=item.name||'unnamed';

			if(item.hide)continue;
			sl++;
			arr=arr.concat(item.data.slice(0,xl));
		}
		// 计算数据在Y轴刻度
		this.info=calculateNum(arr);
		min=this.info.min;
		max=this.info.max;

		for(var i=0;i<this.series.length;i++){
			item=this.series[i];
			sp=Math.max(Math.pow(10-sl,2)/3-4,5);
			w=(xs-sp*(sl+1))/sl;

			if(!this.animateArr[i]){
				obj=Object.assign({},{
					i:index,
					isStop:true,
					create:true,
					hide:!!item.hide,
					name:item.name,
					color:item.color,
					data:[]
				});

				item.data.slice(0,xl).forEach((d,j)=>{
					h=Math.floor((d-min)/(max-min)*ydis+2);
					obj.data.push({
						num:d,
						h:h,
						p:0,
						w:Math.round(w),
						x:Math.round(xs*j+w*index+sp*(index+1)),
						y:0,
						vy:Math.max(300,Math.floor(h*2))/100
					});
				});
				this.animateArr.push(obj);

			} else {//更新				
				if(that.animateArr[i].hide&&!item.hide){
					that.animateArr[i].create=true;
				} else {
					that.animateArr[i].create=false;
				}
				that.animateArr[i].hide=item.hide;
				that.animateArr[i].i=index;
				item.data.slice(0,xl).forEach((d,j)=>{
					if(that.animateArr[i].create){
						that.animateArr[i].data[j].y=0;
						that.animateArr[i].data[j].p=0;
					}
					h=Math.floor((d-min)/(max-min)*ydis+2);
					that.animateArr[i].data[j].w=Math.round(w);
					that.animateArr[i].data[j].x=xs*j+w*index+sp*(index+1);
					that.animateArr[i].data[j].h=h;
					that.animateArr[i].data[j].vy=Math.max(300,Math.floor(h*2))/100;
				});
			}
			if(!item.hide){index++;}
		}
	}
	drawAxis(){
		var that=this,
			ctx=this.ctx,
			W=this.W,
			H=this.H,
			padding=this.padding,
			paddingTop=this.paddingTop,
			xl=0,xs=0;//x轴单位数，每个单位长度

		ctx.fillStyle='hsla(0,0%,30%,1)';
		ctx.strokeStyle='hsla(0,0%,20%,1)';
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
			xs=(W-2*padding)/(xl);
			this.xAxis.data.forEach((txt,i)=>{
				var x=xs*(i+1);
				ctx.moveTo(x,0);
				ctx.lineTo(x,10);
				ctx.stroke();
				ctx.fillText(txt,x-xs/2,40);
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
	}

	drawTag(){
		var tw=0,item,ctx=this.ctx;
		for(var i=0;i<this.series.length;i++){
			item=this.series[i];
			// 画分组标签
			ctx.save();
			ctx.translate(this.padding+this.W/4,this.paddingTop+40);
			this.legend.push({
				hide:!!item.hide,
				name:item.name,
				color:item.color,
				x:this.padding+this.W/4+i*90+tw,
				y:this.paddingTop+40,
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
		}
	}

	drawY(){
		var padding=this.padding,
			xdis=this.W-padding*2,
			ydis=this.H-padding*2-this.paddingTop,
			yl=this.info.num,
			ys=ydis/yl,
			ctx=this.ctx;

		// y轴
		ctx.save();
		ctx.beginPath();
		ctx.strokeStyle='hsl(220,100%,50%)';
		ctx.translate(padding,this.H-padding);
		ctx.moveTo(0,0);
		ctx.lineTo(0,2*padding+this.paddingTop-this.H);
		ctx.stroke();
		ctx.restore();

		//画Y轴刻度
		ctx.save();
		ctx.fillStyle='hsl(200,100%,60%)';
		ctx.translate(padding,this.H-padding);
		for(var i=0;i<=yl;i++){
			ctx.beginPath();
			ctx.strokeStyle='hsl(220,100%,50%)';
			ctx.moveTo(-10,-Math.floor(ys*i));
			ctx.lineTo(0,-Math.floor(ys*i));
			ctx.stroke();

			if(i>0){
				ctx.beginPath();
				ctx.strokeStyle='hsla(0,0%,80%,1)';
				ctx.moveTo(0,-Math.floor(ys*i));
				ctx.lineTo(xdis,-Math.floor(ys*i));
				ctx.stroke();
			}

			ctx.textAlign='right';
			var dim=Math.floor(this.info.step*i+this.info.min),
				txt=this.yAxis.formatter?this.yAxis.formatter.replace('{value}',dim):dim;
			ctx.fillText(txt,-20,-ys*i+10);
		}
		ctx.restore();
		//画数据
	}
}

/**
 * 折线图
 */
class Line extends Chart{
	constructor(container){
		super(container);
	}
	bindEvent(){
		var that=this,
			ctx=that.ctx,
			canvas=that.canvas,
			xl=this.xAxis.data.length,
			xs=(that.W-2*that.padding)/(xl-1),
			index=0;
		if(!this.series.length) return;
		this.canvas.addEventListener('mousemove',function(e){
			var isLegend=false;
			var box=canvas.getBoundingClientRect(),
				pos = {
				x:e.clientX-box.left,
				y:e.clientY-box.top
			};
			// 分组标签
			for(var i=0,item,len=that.legend.length;i<len;i++){
				item=that.legend[i];
				roundRect(ctx,item.x,item.y,item.w,item.h,item.r);
				// 因为缩小了一倍，所以坐标要*2
				if(ctx.isPointInPath(pos.x*2,pos.y*2)){
					canvas.style.cursor='pointer';
					isLegend=true;
					break;
				}
				canvas.style.cursor='default';
			}

			if(isLegend||that.drawing) return;
			// 鼠标位置在图表中时
			if(pos.y*2>that.padding+that.paddingTop && pos.y*2<that.H-that.padding && pos.x*2>that.padding && pos.x*2<that.W-that.padding){
				canvas.style.cursor='pointer';
				for(var i=0;i<xl;i++){
					if(pos.x*2>i*xs){
						index=i;
					}
				}

				that.clearGrid(index);
				// 获取处于当前位置的信息
				var arr=[];
				for(var j=0,item,l=that.animateArr.length;j<l;j++){
					item=that.animateArr[j];
					if(item.hide)continue;
					arr.push({name:item.name, num:item.data[index].num})
				}
				that.showInfo(pos,that.xAxis.data[index],arr);
			} else {
				that.tip.style.display='none';
				that.clearGrid();
			}

		},false);

		this.canvas.addEventListener('mousedown',function(e){
			e.preventDefault();
			var box=that.canvas.getBoundingClientRect(),
				pos = {
				x:e.clientX-box.left,
				y:e.clientY-box.top
			};
			for(var i=0,item,len=that.legend.length;i<len;i++){
				item=that.legend[i];
				roundRect(ctx,item.x,item.y,item.w,item.h,item.r);
				if(ctx.isPointInPath(pos.x*2,pos.y*2)){
					that.series[i].hide=!that.series[i].hide;
					that.create();
					break;
				}
			}
		},false);
	}
	clearGrid(index){
		var that=this,
			obj, r=5,
			ctx=this.ctx;
		ctx.clearRect(0,0,that.W,that.H);
		// 画坐标系
		this.drawAxis();
		// 画标签
		this.drawTag();
		// 画y轴刻度
		this.drawY();

		ctx.save();
		ctx.translate(that.padding,that.H-that.padding);
		// 画标志线
		if(typeof index== 'number'){
			obj=that.animateArr[0].data[index];
			ctx.lineWidth=1;
			ctx.strokeStyle='hsla(0,0%,70%,1)';
			ctx.moveTo(obj.x,-that.H+that.paddingTop+2*that.padding);
			ctx.lineTo(obj.x,0);
			ctx.stroke();
		}

		for(var i=0,item,il=that.animateArr.length;i<il;i++){
			item=that.animateArr[i];
			if(item.hide)continue;
			ctx.lineWidth=4;
			ctx.strokeStyle=item.color;
			ctx.fillStyle='#fff';
			ctx.beginPath();
			for(var j=0,obj,jl=item.data.length;j<jl;j++){
				obj=item.data[j];
				ctx[j==0?'moveTo':'lineTo'](obj.x,-obj.h);
			}
			ctx.stroke();

			//画完曲线后再画圆球
			for(var j=0,jl=item.data.length;j<jl;j++){
				obj=item.data[j];
				ctx.strokeStyle=item.color;
				ctx.lineWidth=index===j?6:4;
				r=index===j?10:5;
				ctx.beginPath();
				ctx.arc(obj.x,-obj.h,r,0,Math.PI*2,false);
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
			prev,h=0, x=0,y=0,
			isStop=true;;

		that.drawing=true;
		(function run(){
			isStop=true;
			ctx.clearRect(0,that.padding+that.paddingTop-5,that.W,that.H-2*that.padding-that.paddingTop+4);
			that.drawY();
			ctx.save();
			ctx.translate(that.padding,that.H-that.padding);
			for(var i=0,item,il=that.animateArr.length;i<il;i++){
				item=that.animateArr[i];
				if(item.hide)continue;
				item.isStop=true;

				ctx.lineWidth=4;
				ctx.strokeStyle=item.color;
				ctx.fillStyle='#fff';
				ctx.beginPath();
				if(item.create){//新增绘制路径动画
					item.xl+=20;
					x=item.xl;
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
							obj.y=obj.p=obj.h;
							ctx.beginPath();
							ctx.arc(obj.x,-obj.h,5,0,Math.PI*2,false);
							ctx.stroke();
							ctx.fill();
						}
					}
					if(item.xl<xdis){
						item.isStop=false;
					}
				} else {//更新位移动画
					for(var j=0,obj,jl=item.data.length;j<jl;j++){
						obj=item.data[j];
						if(obj.p>obj.h){
							h=obj.y-4;
							if(h<obj.h){
								obj.y=obj.p=obj.h;
							}
						} else {
							h=obj.y+4;
							if(h>obj.h){
								obj.y=obj.p=obj.h;
							}
						}
						if(obj.p!=obj.h){
							obj.y=h;
							item.isStop=false;
						}

						ctx[j==0?'moveTo':'lineTo'](obj.x,-obj.y);
					}
					ctx.stroke();
					for(var j=0,obj,jl=item.data.length;j<jl;j++){
						obj=item.data[j];
						ctx.beginPath();
						ctx.arc(obj.x,-obj.y,5,0,Math.PI*2,false);
						ctx.stroke();
						ctx.fill();
					}
				}
				if(!item.isStop){
					isStop=false;
				}
			}
			ctx.restore();
			
			if(isStop){
				that.drawing=false;
				return;
			}
			requestAnimationFrame(run);
		}())
	}
	create(){
		// 画坐标系
		this.drawAxis();
		this.initData();
		// 画标签
		this.drawTag();
		// 画y轴刻度
		this.drawY();
		// 执行动画
		this.animate();
	}
	initData(){
		var that=this,
			xl=this.xAxis.data.length,
			xs=(this.W-2*this.padding)/(xl-1),
			ydis=this.H-this.padding*2-this.paddingTop,
			sl=0, min=0,max=0,
			item, obj,arr=[];

		if(!this.series.length) return;
		for(var i=0;i<this.series.length;i++){
			item=this.series[i];
			if(!item.data||!item.data.length){
				this.series.splice(i--,1);continue;
			}
			// 赋予没有颜色的项
			if(!item.color){
				var hsl=i%2?180+30*(i-1):30*i/2;
				item.color='hsla('+hsl+',70%,60%,1)';
			}
			item.name=item.name||'unnamed';
			
			if(item.hide)continue;
			sl++;
			arr=arr.concat(item.data.slice(0,xl));
		}
		// 计算数据在Y轴刻度
		this.info=calculateNum(arr);
		min=this.info.min;
		max=this.info.max;

		for(var i=0;i<this.series.length;i++){
			item=this.series[i];
			if(!this.animateArr[i]){
				obj=Object.assign({},{
					i:i,
					isStop:true,
					xl:0,
					create:true,
					hide:!!item.hide,
					name:item.name,
					color:item.color,
					data:[]
				});
				item.data.slice(0,xl).forEach((d,j)=>{
					obj.data.push({
						num:d,
						h:Math.floor((d-min)/(max-min)*ydis+2),
						p:0,
						x:Math.round(xs*j),
						y:0
					});
				});
				this.animateArr.push(obj);
			} else {//更新				
				if(that.animateArr[i].hide&&!item.hide){
					that.animateArr[i].create=true;
					that.animateArr[i].xl=0;
				} else {
					that.animateArr[i].create=false;
				}
				that.animateArr[i].hide=item.hide;
				item.data.slice(0,xl).forEach((d,j)=>{
					that.animateArr[i].data[j].h=Math.floor((d-min)/(max-min)*ydis+2);
				});
			}

		}
	}
	drawTag(){
		var tw=0,item,ctx=this.ctx;
		for(var i=0;i<this.series.length;i++){
			item=this.series[i];
			// 画分组标签
			ctx.save();
			ctx.translate(this.padding+this.W/4,this.paddingTop+40);
			this.legend.push({
				hide:item.hide||false,
				name:item.name,
				color:item.color,
				x:this.padding+this.W/4+i*90+tw,
				y:this.paddingTop+40,
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
		}
	}
	drawAxis(){
		var that=this,
			ctx=this.ctx,
			W=this.W,
			H=this.H,
			padding=this.padding,
			paddingTop=this.paddingTop,
			xl=0,xs=0;//x轴单位数，每个单位长度

		ctx.fillStyle='hsla(0,0%,30%,1)';
		ctx.strokeStyle='hsla(0,0%,20%,1)';
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
	}
	drawY(){
		var xdis=this.W-this.padding*2,
			ydis=this.H-this.padding*2-this.paddingTop,
			yl=this.info.num,
			ys=ydis/yl,
			ctx=this.ctx;

		// y轴
		ctx.save();
		ctx.beginPath();
		ctx.strokeStyle='hsl(220,100%,50%)';
		ctx.translate(this.padding,this.H-this.padding);
		ctx.moveTo(0,0);
		ctx.lineTo(0,2*this.padding+this.paddingTop-this.H);
		ctx.stroke();
		ctx.restore();

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

			if(i>0){
				ctx.beginPath();
				ctx.strokeStyle='hsla(0,0%,80%,1)';
				ctx.moveTo(0,-Math.floor(ys*i));
				ctx.lineTo(xdis,-Math.floor(ys*i));
				ctx.stroke();
			}

			ctx.textAlign='right';
			var dim=Math.floor(this.info.step*i+this.info.min),
				txt=this.yAxis.formatter?this.yAxis.formatter.replace('{value}',dim):dim;
			ctx.fillText(txt,-20,-ys*i+10);
		}
		ctx.restore();
	}

}

/**
 * 饼图
 */
class Pie extends Chart{
	constructor(container){
		super(container);
	}
	bindEvent(){
		var that=this,
			canvas=that.canvas,
			ctx=that.ctx;
		if(!this.data.length) return;
		this.canvas.addEventListener('mousemove',function(e){
			var isLegend=false;
			var box=canvas.getBoundingClientRect(),
				pos = {
				x:e.clientX-box.left,
				y:e.clientY-box.top
			};
			// 标签
			for(var i=0,item,len=that.legend.length;i<len;i++){
				item=that.legend[i];
				roundRect(ctx,item.x,item.y,item.w,item.h,item.r);
				if(ctx.isPointInPath(pos.x*2,pos.y*2)){
					canvas.style.cursor='pointer';
					if(!item.hide){
						that.clearGrid(i);
					}
					isLegend=true;
					break;
				}
				canvas.style.cursor='default';
				that.tip.style.display='none';
			}

			if(isLegend) return;
			// 图表
			var startAng=-Math.PI/2;
			for(var i=0,l=that.animateArr.length;i<l;i++){
				item=that.animateArr[i];
				if(item.hide)continue;
				ctx.beginPath();
				ctx.moveTo(that.W/2,that.H/2);
				ctx.arc(that.W/2,that.H/2,that.H/3,startAng,startAng+item.ang,false);
				ctx.closePath();
				startAng+=item.ang;
				if(ctx.isPointInPath(pos.x*2,pos.y*2)){
					canvas.style.cursor='pointer';
					that.clearGrid(i);
					that.showInfo(pos,that.toolTip,[{name:item.name,num:item.num+' ('+item.percent+'%)'}]);
					break;
				}
				canvas.style.cursor='default';
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
				if(ctx.isPointInPath(pos.x*2,pos.y*2)){
					that.data[i].hide=!that.data[i].hide;
					that.create();
					break;
				}
			}
		},false);

	}
	clearGrid(index){
		var that=this,
			ctx=that.ctx,
			canvas=that.canvas,
			item,startAng=-Math.PI/2,
			len=that.animateArr.filter(item=>!item.hide).length,
			j=0,angle=0,
			r=that.H/3;
		ctx.clearRect(0,0,that.W,that.H);
		that.draw();
		ctx.save();
		ctx.translate(that.W/2,that.H/2);

		for(var i=0,l=that.animateArr.length;i<l;i++){
			item=that.animateArr[i];
			if(item.hide)continue;
			ctx.strokeStyle=item.color;
			ctx.fillStyle=item.color;
			angle=j>=len-1?Math.PI*2-Math.PI/2:startAng+item.ang;
			ctx.beginPath();
			ctx.moveTo(0,0);
			if(index===i){
				ctx.save();
				// ctx.shadowColor='hsla(0,0%,50%,1)';
				ctx.shadowColor=item.color;
				ctx.shadowBlur=5;
				ctx.arc(0,0,r+20,startAng,angle,false);
				ctx.closePath();
				ctx.fill();
				ctx.stroke();
				ctx.restore();
			} else {
				ctx.arc(0,0,r,startAng,angle,false);
				ctx.closePath();
				ctx.fill();
			}
			//画描述
			var tr=r+40,tw=0,
				tAng=startAng+item.ang/2,
				x=tr*Math.cos(tAng),
				y=tr*Math.sin(tAng);

			ctx.lineWidth=2;
			ctx.lineCap='round';
			ctx.beginPath();
			ctx.moveTo(0,0);
			ctx.lineTo(x,y);
			if(tAng>=-Math.PI/2&&tAng<=Math.PI/2){
				ctx.lineTo(x+30,y);
				ctx.fillText(item.name,x+40,y+10);
			} else {
				tw=ctx.measureText(item.name).width;//计算字符长度
				ctx.lineTo(x-30,y);
				ctx.fillText(item.name,x-40-tw,y+10);
			}
			
			ctx.stroke();
			startAng+=item.ang;
			j++;
		}
		ctx.restore();
	}
	animate(){
		var that=this,
			ctx=that.ctx,
			canvas=that.canvas,
			item,startAng,ang,
			isStop=true;

		(function run(){
			isStop=true;
			ctx.save();
			ctx.translate(that.W/2,that.H/2);
			ctx.fillStyle='#fff';
			ctx.beginPath();
			ctx.arc(0,0,that.H/3+30,0,Math.PI*2,false);
			ctx.fill();
			for(var i=0,l=that.animateArr.length;i<l;i++){
				item=that.animateArr[i];
				if(item.hide)continue;
				startAng=-Math.PI/2;
				that.animateArr.forEach((obj,j)=>{
					if(j<i&&!obj.hide){startAng+=obj.cur;}
				});

				ctx.fillStyle=item.color;
				if(item.last>item.ang){
					ang=item.cur-0.05;
					if(ang<item.ang){
						item.cur=item.last=item.ang;
					}
				} else {
					ang=item.cur+0.05;
					if(ang>item.ang){
						item.cur=item.last=item.ang;
					}
				}
				if(item.cur!=item.ang){
					item.cur=ang;
					isStop=false;
				}

				ctx.beginPath();
				ctx.moveTo(0,0);
				ctx.arc(0,0,that.H/3,startAng,startAng+item.cur,false);
				ctx.closePath();
				ctx.fill();
			}
			ctx.restore();
			if(isStop) {
				that.clearGrid();
				return;
			}
			requestAnimationFrame(run);
		}());
	}
	create(){
		this.initData();
		this.draw();
		this.animate();
	}
	initData(){
		var that=this,
			item,
			total=0;
		if(!this.data||!this.data.length){return;}
		this.legend.length=0;
		for(var i=0;i<this.data.length;i++){
			item=this.data[i];
			// 赋予没有颜色的项
			if(!item.color){
				var hsl=i%2?180+30*(i-1):30*i/2;
				item.color='hsla('+hsl+',70%,60%,1)';
			}
			item.name=item.name||'unnamed';

			this.legend.push({
				hide:!!item.hide,
				name:item.name,
				color:item.color,
				x:50,
				y:that.paddingTop+40+i*50,
				w:80,
				h:30,
				r:5
			});

			if(item.hide)continue;
			total+=item.value;
		}

		for(var i=0;i<this.data.length;i++){
			item=this.data[i];
			if(!this.animateArr[i]){
				this.animateArr.push({
					i:i,
					create:true,
					hide:!!item.hide,
					name:item.name,
					color:item.color,
					num:item.value,
					percent:Math.round(item.value/total*10000)/100,
					ang:Math.round(item.value/total*Math.PI*2*100)/100,
					last:0,
					cur:0
				});
			} else {//更新				
				if(that.animateArr[i].hide&&!item.hide){
					that.animateArr[i].create=true;
					that.animateArr[i].cur=0;
					that.animateArr[i].last=0;
				} else {
					that.animateArr[i].create=false;
				}
				that.animateArr[i].hide=item.hide;
				that.animateArr[i].percent=Math.round(item.value/total*10000)/100;
				that.animateArr[i].ang=Math.round(item.value/total*Math.PI*2*100)/100;
			}
		}
	}
	draw(){
		var item,ctx=this.ctx;
		ctx.fillStyle='hsla(0,0%,30%,1)';
		ctx.strokeStyle='hsla(0,0%,20%,1)';
		ctx.textBaseLine='middle';
		ctx.font='24px arial';
		
		ctx.clearRect(0,0,this.W,this.H);
		if(this.title){
			ctx.save();
			ctx.textAlign='center';
			ctx.font='bold 40px arial';
			ctx.fillText(this.title,this.W/2,70);
			ctx.restore();
		}
		ctx.save();
		for(var i=0;i<this.legend.length;i++){
			item=this.legend[i];
			// 画标签
			ctx.textAlign='left';
			ctx.fillStyle=item.color;
			ctx.strokeStyle=item.color;
			roundRect(ctx,item.x,item.y,item.w,item.h,item.r);
			ctx.globalAlpha=item.hide?0.3:1;
			ctx.fill();
			ctx.fillText(item.name,item.x+item.w+20,item.y+item.h-5);
		}
		ctx.restore();
	}
}

/**
 * 散点图
 */
class Point extends Chart{
	constructor(container){
		super(container);
	}
	bindEvent(){
		var that=this,
			ctx=that.ctx,
			canvas=that.canvas,
			xl=this.xAxis.data.length,
			xs=(that.W-2*that.padding)/xl,
			index=0;

		if(!this.series.length) return;
		this.canvas.addEventListener('mousemove',function(e){
			var isLegend=false;
			var box=canvas.getBoundingClientRect();
			var pos = {
				x:e.clientX-box.left,
				y:e.clientY-box.top
			};
			// 分组标签
			for(var i=0,item,len=that.legend.length;i<len;i++){
				item=that.legend[i];
				ctx.beginPath();
				ctx.arc(item.x,item.y,item.r,0,Math.PI*2,false);
				if(ctx.isPointInPath(pos.x*2,pos.y*2)){
					canvas.style.cursor='pointer';
					isLegend=true;
					break;
				}
				canvas.style.cursor='default';
			}

			if(isLegend) return;
			// 鼠标位置在图表中时
			if(pos.y*2>that.padding+that.paddingTop && pos.y*2<that.H-that.padding && pos.x*2>that.padding && pos.x*2<that.W-that.padding){
				canvas.style.cursor='pointer';
				// 获取处于当前位置的信息
				var arr=[],title;
				for(var i=0,item,l=that.animateArr.length;i<l;i++){
					item=that.animateArr[i];
					if(item.hide)continue;
					arr=[];
					for(var j=0,obj,jl=item.data.length;j<jl;j++){
						obj=item.data[j];
						ctx.beginPath();
						ctx.arc(that.padding+obj.x,that.H-that.padding-obj.h,obj.radius,0,Math.PI*2,false);
						if(ctx.isPointInPath(pos.x*2,pos.y*2)){
							title=obj.name+' '+item.name;
							for(var v in obj){
								if(!that.desc[v])continue;
								arr.push({name:that.desc[v], num:obj[v]});
							}
							that.clearGrid({i:i,j:j});
							break;
						} 
					}
					if(arr.length){break;}
				}

				if(arr.length){
					that.showInfo(pos,title,arr); 
				} else {
					that.clearGrid();
					that.tip.style.display='none';
				}
				//画十字架和投影到坐标的信息
				that.drawLine(pos);
			} else {
				that.clearGrid();
				that.tip.style.display='none';
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
				ctx.beginPath();
				ctx.arc(item.x,item.y,item.r,0,Math.PI*2,false);
				if(ctx.isPointInPath(pos.x*2,pos.y*2)){
					that.series[i].hide=!that.series[i].hide;
					that.create();
					break;
				}
			}
		},false);
	}

	create(){
		this.initData();
		this.drawAxis();
		this.drawY();
		this.drawTag();
		this.animate();
	}
	initData(){
		var that=this,
			xdis=this.W-this.padding*2,
			ydis=this.H-this.padding*2-this.paddingTop,
			xl=this.xAxis.data.length,
			xs=xdis/xl,
			xmin=this.xAxis.data[0],
			xmax=this.xAxis.data.slice(-1)[0],
			min,max,numMin,numMax,item,obj,arr=[],numArr=[],index=0,r,r2,h;

		if(!this.series.length) return;
		for(var i=0;i<this.series.length;i++){
			item=this.series[i];
			if(!item.data||!item.data.length){
				this.series.splice(i--,1);continue;
			}
			// 赋予没有颜色的项
			if(!item.color){
				var hsl=i%2?180+30*(i-1):30*i/2;
				item.color='hsla('+hsl+',70%,60%,1)';
				item.hsl=hsl;
			}
			item.name=item.name||'unnamed';

			if(item.hide)continue;
			item.data.forEach(d=>{
				arr.push(d.yVal);
				numArr.push(d.num);
			});
		}
		
		numMax=Math.max.apply(null,numArr);
		numMin=Math.min.apply(null,numArr);

		// 计算数据在Y轴刻度
		this.info=calculateNum(arr,true);
		min=this.info.min;
		max=this.info.max;

		for(var i=0;i<this.series.length;i++){
			item=this.series[i];
			if(!this.animateArr[i]){
				obj=Object.assign({},{
					i:index,
					isStop:true,
					create:true,
					hide:!!item.hide,
					name:item.name,
					color:item.color,
					hsl:item.hsl,
					data:[]
				});

				item.data.forEach((d,j)=>{
					h=Math.floor((d.yVal-min)/(max-min)*ydis+2);
					r=getRadius(numMax,numMin,d.num);
					obj.data[j]=d;
					obj.data[j].h=h;
					obj.data[j].p=h;
					obj.data[j].x=Math.floor((d.xVal)/(xmax)*xdis+2);
					obj.data[j].y=h;
					obj.data[j].radius=r;
					obj.data[j].r=0;
					obj.data[j].v=r/50;
				});
				this.animateArr.push(obj);

			} else {//更新				
				if(that.animateArr[i].hide&&!item.hide){
					that.animateArr[i].create=true;
				} else {
					that.animateArr[i].create=false;
				}
				that.animateArr[i].hide=item.hide;
				that.animateArr[i].i=index;
				item.data.forEach((d,j)=>{
					r=getRadius(numMax,numMin,d.num);
					h=Math.floor((d.yVal-min)/(max-min)*ydis+2);
					if(that.animateArr[i].create){
						that.animateArr[i].data[j].p=h;
						that.animateArr[i].data[j].y=h;
						that.animateArr[i].data[j].r=0;
					}
					that.animateArr[i].data[j].radius=r;
					that.animateArr[i].data[j].v=r/50;
					that.animateArr[i].data[j].h=h;
				});
			}
			if(!item.hide){index++;}
		}
		function getRadius(numMax,numMin,num){
			r=Math.floor(num/numMax*xs/3);
			r2=Math.floor(num/(numMin)/30);
			r=r2>xs/4?r:r2;
			return Math.max(6,r);
		}
	}
	drawAxis(){
		var that=this,
			ctx=this.ctx,
			W=this.W,
			H=this.H,
			padding=this.padding,
			paddingTop=this.paddingTop,
			xdis=this.W-this.padding*2,
			xl=this.xAxis.data.length,
			xs=xdis/xl;

		ctx.fillStyle='hsla(0,0%,30%,1)';
		ctx.strokeStyle='hsla(0,0%,20%,1)';
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
		this.xAxis.data.forEach((num,i)=>{
			var x=xs*(i+1),txt;
			ctx.beginPath();
			ctx.strokeStyle='hsla(0,0%,20%,1)';
			ctx.moveTo(x,0);
			ctx.lineTo(x,10);
			ctx.stroke();
			if(that.xAxis.formatter){
				txt=that.xAxis.formatter.replace('{value}',num);
			}
			ctx.fillText(txt,x,40);

			ctx.beginPath();
			ctx.strokeStyle='hsla(0,0%,80%,1)';
			ctx.moveTo(x,0);
			ctx.lineTo(x,2*padding+paddingTop-H);
			ctx.stroke();

		});
		if(this.xAxis.name){
			ctx.textAlign='left';
			ctx.fillText(this.xAxis.name,W-2*padding+20,0);
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
	}
	drawY(){
		var padding=this.padding,
			xdis=this.W-padding*2,
			ydis=this.H-padding*2-this.paddingTop,
			yl=this.info.num,
			ys=ydis/yl,
			ctx=this.ctx;

		// y轴
		ctx.save();
		ctx.beginPath();
		ctx.strokeStyle='hsl(220,100%,50%)';
		ctx.translate(padding,this.H-padding);
		ctx.moveTo(0,0);
		ctx.lineTo(0,2*padding+this.paddingTop-this.H);
		ctx.stroke();
		ctx.restore();

		//画Y轴刻度
		ctx.save();
		ctx.fillStyle='hsl(200,100%,60%)';
		ctx.translate(padding,this.H-padding);
		for(var i=0;i<=yl;i++){
			ctx.beginPath();
			ctx.strokeStyle='hsl(220,100%,50%)';
			ctx.moveTo(-10,-Math.floor(ys*i));
			ctx.lineTo(0,-Math.floor(ys*i));
			ctx.stroke();

			if(i>0){
				ctx.beginPath();
				ctx.strokeStyle='hsla(0,0%,80%,1)';
				ctx.moveTo(0,-Math.floor(ys*i));
				ctx.lineTo(xdis,-Math.floor(ys*i));
				ctx.stroke();
			}

			ctx.textAlign='right';
			var dim=Math.floor(this.info.step*i+this.info.min),
				txt=this.yAxis.formatter?this.yAxis.formatter.replace('{value}',dim):dim;
			ctx.fillText(txt,-20,-ys*i+10);
		}
		ctx.restore();
		//画数据
	}
	drawTag(){
		var that=this,ctx=this.ctx,tw=0,item,obj;
		for(var i=0;i<this.series.length;i++){
			item=this.series[i];
			// 画分组标签
			ctx.save();
			obj=Object.assign({},{
				hide:!!item.hide,
				name:item.name,
				color:item.color,
				x:that.padding+that.W/3+i*80+tw,
				y:that.paddingTop+60,
				r:20
			});
			this.legend.push(obj);
			ctx.textAlign='left';
			ctx.fillStyle=item.color;
			ctx.strokeStyle=item.color;
			ctx.beginPath();
			ctx.arc(obj.x,obj.y,obj.r,0,Math.PI*2,false);
			ctx.globalAlpha=item.hide?0.3:1;
			ctx.fill();
			ctx.fillText(item.name,obj.x+obj.r+10,obj.y+obj.r/2);	
			tw+=ctx.measureText(item.name).width;//计算字符长度
			ctx.restore();
		}
	}
	animate(){
		var that=this,
			ctx=this.ctx,
			item,obj,h,r,isStop=true;
		(function run(){
			ctx.save();
			ctx.clearRect(0,0,that.W,that.H);
			// 画坐标系
			that.drawAxis();
			// 画标签
			that.drawTag();
			// 画y轴刻度
			that.drawY();
			ctx.translate(that.padding,that.H-that.padding);
			ctx.shadowBlur=1;
			isStop=true;
			for(var i=0,l=that.animateArr.length;i<l;i++){
				item=that.animateArr[i];
				if(item.hide)continue;

				item.isStop=true;
				ctx.strokeStyle=item.color;
				ctx.shadowColor=item.color;
				
				for(var j=0,jl=item.data.length;j<jl;j++){
					obj=item.data[j];
					var gradient=ctx.createRadialGradient(obj.x,-obj.h,0,obj.x,-obj.h,obj.radius);
					gradient.addColorStop(0,'hsla('+item.hsl+',70%,80%,0.7)');
					gradient.addColorStop(1,'hsla('+item.hsl+',70%,60%,0.7)');
					ctx.fillStyle=gradient;
					ctx.beginPath();
					if(obj.r>obj.radius){
						r=obj.r-obj.v;
						if(r<obj.radius){
							obj.r=obj.radius;
						}
					} else {
						r=obj.r+obj.v;
						if(r>obj.radius){
							obj.r=obj.radius;
						}
					}
					if(obj.r!=obj.radius){
						obj.r=r;
						item.isStop=false;
					}
					if(obj.p>obj.h){
						h=obj.y-4;
						if(h<obj.h){
							obj.y=obj.p=obj.h;
						}
					} else {
						h=obj.y+4;
						if(h>obj.h){
							obj.y=obj.p=obj.h;
						}
					}
					if(obj.y!=obj.h){
						obj.y=h;
						item.isStop=false;
					}
					ctx.arc(obj.x,-obj.y,obj.r,0,Math.PI*2,false);
					ctx.fill();
					ctx.stroke();
				}
				if(!item.isStop){isStop=false; }
			}
			ctx.restore();
			if(isStop){return;}
			requestAnimationFrame(run);
		}());
	}
	drawLine(pos){
		var that=this,
			ctx=that.ctx,
			padding=this.padding,
			xmax=this.xAxis.data.slice(-1)[0],
			xdis=this.W-padding*2,
			ymin=this.info.min,
			ymax=this.info.max,
			ydis=this.H-padding*2-this.paddingTop,
			yNum,xNum,space=8;
		
		ctx.save();
		ctx.lineWidth=0.5;
		ctx.strokeStyle='hsla(0,0%,30%,1)';
		// 绘制虚线十字坐标
		ctx.beginPath();
		for(var i=0;i*space<=xdis;i++){
			ctx[i%2?'lineTo':'moveTo'](padding+i*space,pos.y*2);
		}
		for(var i=0;i*space<=ydis;i++){
			ctx[i%2?'lineTo':'moveTo'](pos.x*2,padding+that.paddingTop+i*space);
		}
		// ctx.moveTo(padding,pos.y*2);
		// ctx.lineTo(that.W-padding,pos.y*2);
		// ctx.moveTo(pos.x*2,padding+that.paddingTop);
		// ctx.lineTo(pos.x*2,that.H-padding);
		ctx.stroke();

		// 绘制在xy轴对应的数值
		ctx.fillStyle='hsla(0,0%,30%,1)';
		ctx.fillRect(padding-75,pos.y*2-20,70,36);
		ctx.fillRect(pos.x*2-55,that.H-padding+10,110,40);
		yNum=Math.round((ymin+(that.H-padding-pos.y*2)/ydis*(ymax-ymin))*100)/100;
		xNum=Math.round((pos.x*2-padding)/xdis*xmax*100)/100;

		ctx.font='22px arial';
		ctx.textAlign='center';
		ctx.textBaseLine='middle';
		ctx.fillStyle='hsla(0,0%,100%,1)';
		ctx.fillText(yNum,padding-40,pos.y*2+5);
		ctx.fillText(xNum,pos.x*2,that.H-padding+40);
		ctx.restore();
	}
	clearGrid(pos,coord){
		var that=this,
			obj,
			ctx=this.ctx;

		ctx.clearRect(0,0,that.W,that.H);
		// 画坐标系
		this.drawAxis();
		// 画标签
		this.drawTag();
		// 画y轴刻度
		this.drawY();

		for(var i=0,item,il=that.animateArr.length;i<il;i++){
			item=that.animateArr[i];
			if(item.hide)continue;
			for(var j=0,jl=item.data.length;j<jl;j++){
				if(pos&&i==pos.i&&j==pos.j) continue;
				obj=item.data[j];
				drawPoint(item,obj);
			}
		}
		
		if(pos){
			item=that.animateArr[pos.i];
			obj=item.data[pos.j];
			drawPoint(item,obj,true);
		}

		function drawPoint(item,obj,isScale){
			ctx.save();
			ctx.shadowColor=item.color;
			ctx.shadowBlur=1;
			ctx.strokeStyle=item.color;
			ctx.translate(that.padding+obj.x,that.H-that.padding-obj.h);
			var gradient=ctx.createRadialGradient(0,0,0,0,0,obj.radius);
			gradient.addColorStop(0,'hsla('+item.hsl+',70%,85%,0.7)');
			gradient.addColorStop(1,'hsla('+item.hsl+',70%,60%,0.7)');
			ctx.fillStyle=gradient;
			ctx.beginPath();
			if(isScale){
				ctx.scale(1.2,1.2);
			}
			ctx.arc(0,0,obj.radius,0,Math.PI*2,false);
			ctx.fill();
			ctx.stroke();
			ctx.restore();
		}
	}
}


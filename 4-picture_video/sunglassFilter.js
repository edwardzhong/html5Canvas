var onmessage=function(event){
	var imgData=event.data,
		data=imgData.data,
		length=data.length,
		width=imgData.width;

	for(var i=0;i<length;++i){
		if((i+1)%4!==0){
			if((i+1)%(width*4)==0){
				data[i]=data[i-4];
				data[i+1]=data[i-3];
				data[i+2]=data[i-2];
				data[i+3]=data[i-1];
				i+=4;
			} else {
				data[i]=2*data[i]-data[i+4]-0.5*data[i+4];
			}
		}
	}
	postMessage(imgData);
}
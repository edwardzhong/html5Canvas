function Point3d(x, y ,z){
    this.x = x||0;
    this.y = y||0;
    this.z = z||0;
}

Point3d.prototype.rotateX = function(angleX){
    var cosX = Math.cos(angleX),
        sinX = Math.sin(angleX),
          y1 = this.y * cosX - this.z * sinX,
          z1 = this.z * cosX + this.y * sinX;
    
      this.y = y1;
      this.z = z1;
}

Point3d.prototype.rotateY = function(angleY){
    var cosY = Math.cos(angleY),
        sinY = Math.sin(angleY),
          x1 = this.x * cosY - this.z * sinY,
          z1 = this.z * cosY + this.x * sinY;
    
      this.x = x1;
      this.z = z1;
}

Point3d.prototype.rotateZ = function(angleZ){
    var cosZ = Math.cos(angleZ),
        sinZ = Math.sin(angleZ),
          x1 = this.x * cosZ - this.y * sinZ,
          y1 = this.y * cosZ + this.x * sinZ;
    
      this.x = x1;
      this.y = y1;
}
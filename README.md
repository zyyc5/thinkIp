# thinkIp
翻译 ThinkPhp 中的查询ip详情的包，使用方式与ThinkPhp一样

另外添加了对纯真ip库的支持

# 安装
npm install thinkip

# 使用
const thinkIp = require('thinkIp');

let ipinfo = thinkIp.getlocation('218.4.167.72');

console.log(ipinfo);

  { 

    ip: '218.4.167.72',
    
    beginip: '218.4.167.72',
    
    endip: '218.4.173.255',
    
    country: '江苏省苏州市',
    
    area: '电信',
    
    address: '江苏省苏州市电信',
    
    china: [ '江苏', '苏州', '' ] 
    
  }

# API

模仿的ThinkPhp

ipinfo getlocation(ip，ifuseqqwry)

### 参数  ip  

为正常的ipv4格式，例如 8.8.8.8

### 参数ifuseqqwry 

为可选参数，是否使用qqwry（纯真ip库），默认为false

### 返回值 ipinfo 结构见上方

# 特别说明

IP库文件是在包加载时进行的，而且会缓存，不会释放内存（使用的buffer,不会占用V8的内存），因为支持ThinkPHP自带的库和纯真库，所以，这俩文件都会加载并占用内存，如果对内存敏感的话，需要自己修改相关代码

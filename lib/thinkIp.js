const fs = require('fs');
let path = require('path');
var Iconv = require('iconv-lite');
let china = require('china-address');
const php = require('./php');

let dbpath = path.join(__dirname,"../data/UTFWry.dat")
let qqdbpath = path.join(__dirname,"../data/qqwry.dat")
// fs.readFile('UTFWry.dat', function (err, data) {
//    if (err) {
//        return console.error(err);
//    }
//    debugger;
//    console.log((new ipUtil(data)).getlocation('218.4.167.70'));
// });

const ipdbbuffer = fs.readFileSync(dbpath);
const qqipdbbuffer = fs.readFileSync(qqdbpath);

let thinkIp = {};

thinkIp.getlocation = function(ip,useQqwry){
    let buffer = ipdbbuffer;
    if(useQqwry)
        buffer = qqipdbbuffer;
	return (new ipUtil(buffer, useQqwry)).getlocation(ip);
};

function ipUtil(buffer,useQqwry){
	// let buffer = buffer;

	/**
     * 返回读取的长整型数
     *
     * @access private
     * @return int
     */
    function getlong() {
        let result = buffer.readUIntLE(fp, 4);
        fp+=4;
        return result;
    }

    /**
     * 返回读取的3个字节的长整型数
     *
     * @access private
     * @return int
     */
    function getlong3() {
        let result = buffer.readUIntLE(fp, 3);
        fp+=3;
        return result;
    }

    /**
     * 返回压缩后可进行比较的IP地址
     *
     * @access private
     * @param string $ip
     * @return string
     */
    function packip(ip) {
        return parseInt(php.ip2long(ip));
    }

    function read(length,start){

    	let usefp = false;
    	if(typeof start ==='undefined'){
    		start = fp;
    		usefp = true;
    	}
    	let nbuffer = new Buffer(length);
    	// console.log('read',length,start,start+length);
    	try{
    	// buffer.copy(nbuffer,0,start,start+length);
    		for(let i=0;i<length;i++)
    		{
    			nbuffer[i] = buffer[start+i];
    		}
	    }catch(e){
	    	console.log(e,start,start+length);
	    }
    	if(usefp)
    		fp+=length;
    	return nbuffer;
    }

    function seek(sk){
    	fp=sk;
    }

    /**
     * 返回读取的字符串
     *
     * @access private
     * @param string $data
     * @return string
     */
    function getstring(byte) {
        let char = read(1);
        let data = new Buffer(0);
        while (char[0] > 0) {        
            data = Buffer.concat([data,char]);
            char   = read(1);
        }
        if(byte)
        	data = Buffer.concat([byte,data]);    
        // console.log('getstring',data.toString())
        // (new Iconv('GBK','UTF-8')).convert(new Buffer(html,'binary')).toString()
        if(!useQqwry)
            return data.toString();
        return Iconv.decode(data, 'GBK')
    }

    /**
     * 返回地区信息
     *
     * @access private
     * @return string
     */
    function getarea() {
        let byte = read(1);    // 标志字节
        let area = '';
        switch (byte[0]) {
            case 0:                     // 没有区域信息
                area = "";
                break;
            case 1:
            case 2:                     // 标志字节为1或2，表示区域信息被重定向
                seek(getlong3());
                area = getstring();
                break;
            default:                    // 否则，表示区域信息没有被重定向
                area = getstring(byte);
                break;
        }
        return area;
    }


    /**
     * 根据所给 IP 地址或域名返回所在地区信息
     *
     * @access public
     * @param string $ip
     * @return array
     */
    this.getlocation = function(ip='') {
    	// console.log('step 1 ',ip,fp)
        if (!fp) return null;            // 如果数据文件没有被正确打开，则直接返回空
		// if(empty($ip)) $ip = get_client_ip();
		let location = {};
        location['ip'] = ip;//gethostbyname($ip);   // 将输入的域名转化为IP地址
        ip = packip(location['ip']);   // 将输入的IP地址转化为可比较的IP地址
                                                // 不合法的IP地址会被转化为255.255.255.255
        // //对分搜索
        let l = 0;                         // 搜索的下边界
        let u = totalip;            // 搜索的上边界
        let findip = lastip;        // 如果没有找到就返回最后一条IP记录（QQWry.Dat的版本信息）
        while (l <= u) {              // 当上边界小于下边界时，查找失败
            let i = Math.floor((l + u) / 2);  // 计算近似中间记录
            seek(firstip + i * 7);
            let beginip = read(4).readUIntLE(0,4);     // 获取中间记录的开始IP地址
            let endip = '';
            // console.log(ip,i,beginip);
            if (ip < beginip) {       // 用户的IP小于中间记录的开始IP地址时
                u = i - 1;            // 将搜索的上边界修改为中间记录减一
            }
            else {
                seek(getlong3());
                endip = read(4).readUIntLE(0,4);   // 获取中间记录的结束IP地址
                if (ip > endip) {     // 用户的IP大于中间记录的结束IP地址时
                    l = i + 1;        // 将搜索的下边界修改为中间记录加一
                }
                else {                  // 用户的IP在中间记录的IP范围内时
                    findip = firstip + i * 7;
                    break;              // 则表示找到结果，退出循环
                }
                // console.log(endip,fp);
            }
        }

        //获取查找到的IP地理位置信息
        seek(findip);
        location['beginip'] = php.long2ip(getlong());   // 用户IP所在范围的开始地址
        let offset = getlong3();
        seek(offset);
        location['endip'] = php.long2ip(getlong());     // 用户IP所在范围的结束地址
        let byte = read(1);    // 标志字节
        let countryOffset = 0 ;
        // console.log('byte',byte)
        switch (byte[0]) {
            case 1:                     // 标志字节为1，表示国家和区域信息都被同时重定向
                countryOffset = getlong3();         // 重定向地址
                seek(countryOffset);
                byte = read(1);    // 标志字节
                switch (byte[0]) {
                    case 2:             // 标志字节为2，表示国家信息又被重定向
                        seek(getlong3());
                        location['country']    = getstring();
                        seek(countryOffset + 4);
                        location['area']       = getarea();
                        break;
                    default:            // 否则，表示国家信息没有被重定向
                        location['country']    = getstring(byte);
                        location['area']       = getarea();
                        break;
                }
                break;
            case 2:                     // 标志字节为2，表示国家信息被重定向
                seek(getlong3());
                location['country']    = getstring();
                seek(offset + 8);
                location['area']       = getarea();
                // console.log('location',location);
                break;
            default:                    // 否则，表示国家信息没有被重定向
                location['country']    = getstring(byte);
                location['area']       = getarea();
                break;
        }
        if (location['country'] == 'CZ88.NET') {  // CZ88.NET表示没有有效信息
            location['country'] = '未知';
        }
        if (location['area']== 'CZ88.NET') {
            location['area'] = '';
        }
        location['address'] = location['country'] + location['area'];
        location.china = china.location(location['address']);
        return location;
    }

    /**
     * QQWry.Dat文件指针
     *
     * @var resource
     */
    let fp = 0 ;

    /**
     * 第一条IP记录的偏移地址
     *
     * @var int
     */
    let firstip;

    /**
     * 最后一条IP记录的偏移地址
     *
     * @var int
     */
    let lastip;

    /**
     * IP记录的总条数（不包含版本信息记录）
     *
     * @var int
     */
    let totalip;

   firstip  = getlong();
   lastip   = getlong();
   totalip  = (lastip - firstip) / 7;
    console.log("instance: " ,firstip,lastip,totalip);
}

module.exports = thinkIp;
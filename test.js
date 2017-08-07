const thinkIp = require('./index');

let iptest = [
	thinkIp.getlocation('218.4.167.72',true),
	thinkIp.getlocation('195.90.48.15'),
	thinkIp.getlocation('192.36.224.255',true),
	thinkIp.getlocation('13.193.199.255')
];

console.log(iptest);
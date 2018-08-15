const http = require('http');
const https = require('https');
const fs = require('fs');
const fss = require('fs-extra')
const path = require('path');
const cfg = require('./config.js');
const LZString = require('./lzs.js');

String.prototype.splic = function (f) {
	return LZString.decompressFromBase64(this).split(f)
}

let manhuaguiHeaders = {
	'Accept-Language': 'zh-CN,zh;q=0.8,en-US;q=0.6,en;q=0.4',
	'Cache-Control': 'no-cache',
	'Connection': 'keep-alive',
	'Cookie': 'country=CN',
	'Host': 'www.manhuagui.com',
	'Pragma': 'no-cache',
	'Upgrade-Insecure-Requests': '1',
	'User-Agent': 'Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.87 Safari/537.36',
}
let hamreusHeaders = {
	'Accept': 'image/webp,image/*,*/*;q=0.8',
	'Accept-Encoding': 'gzip, deflate, sdch',
	'Accept-Language': 'zh-CN,zh;q=0.8,en-US;q=0.6,en;q=0.4',
	'Cache-Control': 'no-cache',
	'Connection': 'keep-alive',
	'Host': 'i.hamreus.com:8080',
	'Pragma': 'no-cache',
	'Referer': 'http://www.manhuagui.com/comic/5546/51102.html',
	'User-Agent': 'Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.87 Safari/537.36',
}



const req = (path, hostname = 'www.manhuagui.com', port = 443, headers = manhuaguiHeaders) => new Promise((resolve, reject) => {
	https.request({
		hostname,
		path,
		port,
		headers
	}, (res) => {
		if (res.headers['content-type'].indexOf('image') !== -1) res.setEncoding('binary');
		else res.setEncoding('utf8');
		var chunks = "";
		res.on('data', (chunk) => {
			chunks += chunk;
		});
		res.on('end', () => {
			try {
				resolve(chunks);
			} catch (error) {
				reject(error);
			}
		});
		res.on('error', (error) => {
			reject(error);
		})
	})
	.on('error', (error) => {
		reject(error);
	})
	.end()
})

function parse(p, a, c, k, e, d) {
	e = function (c) { return (c < a ? "" : e(parseInt(c / a))) + ((c = c % a) > 35 ? String.fromCharCode(c + 29) : c.toString(36)) }; if (!''.replace(/^/, String)) { while (c--) d[e(c)] = k[c] || e(c); k = [function (e) { return d[e] }]; e = function () { return '\\w+' }; c = 1; }; while (c--) if (k[c]) p = p.replace(new RegExp('\\b' + e(c) + '\\b', 'g'), k[c]); return p;
}

let obj = {
	vol: [],
	promises: []
}
req('/comic/' + cfg.comicID + '/').then(d => {
	d.replace(/<title>(.*?) - 看漫画/, (...args) => {
		obj.title = args[1];
	})
	d.replace(/<\/span><\/h4>.*?comment mt10/im, list => {
		list.match(/<a href="(.*?)" title="(.*?)"/img).forEach((value, index) => {
			value.replace(/href="(\/comic\/\d+\/\d+\.html)" title="(.*?)"/im, (...args) => {
				obj.vol[index] = {
					link: args[1],
					title: args[2],
				}
				obj.promises[index] = req(args[1]);
			})
		});
	});
	Promise.all(obj.promises).then(d => {
		d.forEach((v, i) => {
			String(v).replace(/p;}\((.*?),\{\}/im, $0 => {
				let t = $0.substr(4)
				let s = eval(`[${t}]`);
				let d = parse.apply(this, s);
				var cInfo = JSON.parse(d.split('(')[1].split(')')[0]);
				
				cInfo.files.forEach((value, index) => {
					setTimeout(() => {
						req(encodeURI((`${cInfo.path}${cInfo.files[index]}?cid=${cInfo.cid}&md5=${cInfo.sl.md5}`).replace(/\\/ig, '/')), 'i.hamreus.com', null, hamreusHeaders).then(img => {
							let filePath = path.join(__dirname, cfg.downloadDir, obj.title, obj.vol[i].title)
							let filePathName = path.join(filePath, cInfo.files[index])
							if(!fs.existsSync(filePath)) {
								fss.mkdirpSync(filePath)
							}

							let p = path.join(__dirname, cfg.downloadDir, obj.title, obj.vol[i].title, cInfo.files[index]);
							fs.writeFile(p, img, 'binary', error => {
								console.log('下载完成:', cInfo.files[index]);
								if (error) console.log('写入失败:', cInfo.files[index], error);
							});
						})
					}, index * cfg.timeout)
				})
			})
		})
	}).catch(err => {
		console.log(err)
	})

}).catch(err => {
	console.log(err)
})





process.on('unhandledRejection', (reason, p) => {
	console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
});

process.on('rejectionHandled', (p) => {
	console.log('rejectionHandled:', p);
});

process.on('uncaughtException', (err) => {
	console.log('uncaughtException:', err);
});






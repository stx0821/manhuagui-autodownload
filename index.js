const http = require('http');
const fs = require('fs');
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
	'Referer': 'http://www.manhuagui.com/comic/21093/349687.html',
	'User-Agent': 'Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.87 Safari/537.36',
}



const req = (path, hostname = 'www.manhuagui.com', port = 80, headers = manhuaguiHeaders) => new Promise((resolve, reject) => {
	http.request({
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
	}).end()
})

function parse(p, a, c, k, e, d) {
	e = function (c) { return (c < a ? "" : e(parseInt(c / a))) + ((c = c % a) > 35 ? String.fromCharCode(c + 29) : c.toString(36)) }; if (!''.replace(/^/, String)) { while (c--) d[e(c)] = k[c] || e(c); k = [function (e) { return d[e] }]; e = function () { return '\\w+' }; c = 1; }; while (c--) if (k[c]) p = p.replace(new RegExp('\\b' + e(c) + '\\b', 'g'), k[c]); return p;
}

try {
	fs.mkdirSync(path.join(__dirname, cfg.downloadDir));
} catch (error) {
	// console.log(error);
}

let obj = {
	vol: [],
	promises: []
}
req(cfg.path).then(d => {
	d.replace(/<title>(.*?) - 看漫画/, (...args) => {
		try {
			fs.mkdirSync(path.join(__dirname, cfg.downloadDir, args[1]));
			obj.title = args[1];
		} catch (error) {
			let ts = String(Date.now());
			fs.mkdirSync(path.join(__dirname, cfg.downloadDir, ts));
			obj.title = ts;
			// console.log(error);
		}
	})
	d.replace(/<ul style="display:block">.*?<\/ul>/im, list => {
		list.match(/<a href="(.*?)" title="(.*?)"/img).forEach((value, index) => {
			value.replace(/href="(\/comic\/\d+\/\d+\.html)" title="(.*?)"/im, (...args) => {
				obj.vol[index] = {
					link: args[1],
					title: args[2],
				}
				obj.promises[index] = req(args[1]);
				try {
					fs.mkdirSync(path.join(__dirname, cfg.downloadDir, obj.title, args[2]));
				} catch (error) {
					// console.log(error);
				}
			})
		});
	});
	Promise.all(obj.promises).then(d => {
		d.forEach((v, i) => {
			v.replace(/p;}\((.*?),\{\}/im, $0 => {
				let t = $0.substr(4)
				let s = eval(`[${t}]`);
				let d = parse.apply(this, s);
				eval(d);

				cInfo.files.forEach((value, index) => {
					setTimeout(() => {
						req(encodeURI((`http://i.hamreus.com:8080${path.join(cInfo.path, cInfo.files[index])}`).replace(/\\/ig, '/')), 'i.hamreus.com', 8080, hamreusHeaders).then(img => {
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












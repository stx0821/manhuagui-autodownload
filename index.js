const http = require('http');
const fs = require('fs');
const path = require('path');
const cfg = require('./config.js');
const LZString = require('./lzs.js');
const request = require('request')

String.prototype.splic = function (f) {
	return LZString.decompressFromBase64(this).split(f)
}

let manhuaguiHeaders = {
	'Accept-Language': 'zh-CN,zh;q=0.8,en-US;q=0.6,en;q=0.4',
	'Cache-Control': 'no-cache',
	'Connection': 'keep-alive',
	'Cookie': 'country=CN; opti-userid=3d4ab6b3-2cf0-4ff3-bd7c-49f257c0c7e1; freewheel-detected-bandwidth=68; _gat=1; DigiTrust.v1.identity=eyJpZCI6IkJLM3NFa1F6cFdoWFI1UExNK2c0V2o1UTBxVU95M2J6Y2hXcU1sTEJBbkVGL1dOUGpwVkJUSG43VXJtaWRBODBzMEtGMHZyL0hSdXVvOGRGMzE1TldkYWNoc2dYZm1jN21WRVhWZGpVRW54NDI3NnJIOE9hTk1GaThMUDJVRmdibkVjdzJuNGNsVTNRQ2dpdlpKMUozRFhFeFdQMk03cHNJSVIyeVMxbFpWc0hJdm9hb3ZPU0psNXd0NU9sem1ZZlB1QUVISkl0UTNROWdEckhjempuOW9kMFhsNFh4SVIrNVhzS0Fza0hGdVVXT2tmZGl3TTk2anB1UEJ2VUNuU25VMEprSkpHVDVqMW5iYWIxUEx0d0tBa0ZaNGppN2JkUTladW1QZVFLMmEwNWhvZ3RycHROL2JnSDJkZGJlMmUwWlhqVXY2eTBIdklSblFTZTEwTFhBQT09IiwidmVyc2lvbiI6MiwicHJvZHVjZXIiOiIxQ3JzZFVOQW82IiwicHJpdmFjeSI6eyJvcHRvdXQiOmZhbHNlfSwia2V5diI6NH0%3D; opti-position=205; Hm_lvt_38a1bab61660f620209480de377747ed=1516844523,1516845398,1516845399; Hm_lpvt_38a1bab61660f620209480de377747ed=1516845828; _ga=GA1.2.1439033604.1516844522; _gid=GA1.2.1830736630.1516844522; GED_PLAYLIST_ACTIVITY=W3sidSI6IjdEYWoiLCJ0c2wiOjE1MTY4NDU4MzIsIm52IjowLCJ1cHQiOjE1MTY4NDU0NTMsImx0IjoxNTE2ODQ1NjQzfSx7InUiOiI0K3BzIiwidHNsIjoxNTE2ODQ1NjUzLCJudiI6MCwidXB0IjoxNTE2ODQ1NjAyLCJsdCI6MTUxNjg0NTYwMn1d',
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
		res.setEncoding('utf8');
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


let obj = {
	vol: [],
	promises: []
}
req(cfg.path).then(d => {
	d.replace(/<title>(.*?) - 看漫画/, (...args) => {
		obj.title = args[1];
		try {
			fs.mkdirSync(path.join(__dirname, obj.title));
		} catch (error) {
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
					fs.mkdirSync(path.join(__dirname, obj.title, args[2]));
				} catch (error) {
					// console.log(error);
				}
			})
		});
	});
	Promise.all(obj.promises).then(d => {
		d[0].replace(/p;}\((.*?),\{\}/im, $0 => {
			let t = $0.substr(4)
			let s = eval(`[${t}]`);
			let d = parse.apply(this, s);
			eval(d);

			// console.log(cInfo);
			/* req(path.join('/ps1/L/LLDSJ/01/seemh-057-7b13b.jpg.webp'),'i.hamreus.com',8080,hamreusHeaders).then(img => {
				console.log(img);
				fs.writeFileSync('./a.jpg',img);
			}) */
			// cInfo.files.forEach((value, index) => {
			let index = 0;
			function re(index) {
				if (cInfo.files[index] === undefined) return;
				console.log(`http://i.hamreus.com:8080${path.join(cInfo.path, cInfo.files[index])}`);
				request.post({
					url: `http://i.hamreus.com:8080${path.join(cInfo.path, cInfo.files[index])}`,
					headers: hamreusHeaders,
				}, (error, response, body) => {
					console.log('下载完成:', cInfo.files[index]);
				}).on('response', function (response) {
					index = index + 1;
					re(index);
				}).pipe(fs.createWriteStream(path.join(__dirname, obj.title, cInfo.files[index])))
			}
			re(index)
			// })
		})

	}).catch(err => {
		console.log(err)
	})

}).catch(err => {
	console.log(err)
})












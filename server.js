const cfg = require('./config.js');
var express = require('express');
var path = require('path');
var app = express();
var fs = require("fs");

var bodyParser = require('body-parser');

// 创建 application/x-www-form-urlencoded 编码解析
var urlencodedParser = bodyParser.urlencoded({ extended: false })

var mgdir = path.join(__dirname, cfg.downloadDir);

app.use(express.static(mgdir));
app.set('views', path.join(__dirname, './'));
app.set('view engine', 'hbs');

app.get('/', function (req, res) {
	var pic = fs.readdirSync(mgdir);
	var arr = [];
	pic.map((value,index) =>{
		if(fs.statSync(path.join(mgdir, value)).isDirectory ()){
			// var cover = fs.readdirSync(U + value)[0];
			arr.push(`<a href="/list/${value}/">${value}</a>`);
		}
	})
	res.send('<body>'+arr.join('') + `
		<style>a{width:33%;display:inline-block;position:relative;padding-bottom:20px;}button{position:absolute;top:0;left:0;}</style>
		</body>
	`);
})


/* app.get('/', function (req, res) {
	var pic = fs.readdirSync(U);
	var arr = [];
	pic.map((value,index) =>{
		if(fs.statSync(U + value).isDirectory ()){
			var cover = fs.readdirSync(U + value)[0];
			arr.push(`<a href="/list/${value}/">
			<img width="100%" src="/${value}/${cover}"><br>${value}</a>`);
		}
	})
	res.send('<body>'+arr.join('') + `
		<style>a{width:33%;display:inline-block;position:relative;padding-bottom:20px;}button{position:absolute;top:0;left:0;}</style>
		</body>
	`);
}) */

app.get('/list/:dir', function (req, res) {
	var pic = fs.readdirSync(path.join(mgdir,req.params.dir));
	var arr = [];
	pic.map((value,index) =>{
		if(fs.statSync(path.join(mgdir,req.params.dir, value)).isDirectory ()){
			var cover = fs.readdirSync(path.join(mgdir,req.params.dir, value))[0];
			arr.push(`<a href="/list/${req.params.dir}/${value}/">
			<img width="100%" src="/${req.params.dir}/${value}/${cover}"><br>${value}</a>`);
		}
	})
	res.send('<body>'+arr.join('') + `
		<style>a{width:33%;display:inline-block;position:relative;padding-bottom:20px;}button{position:absolute;top:0;left:0;}</style>
		</body>
	`);
})

app.get('/list/:dir/:section', function (req, res) {
	var pic = fs.readdirSync(path.join(mgdir,req.params.dir,req.params.section));
	var pic2 = pic.map((value,index)  => {
		return `/${req.params.dir}/${req.params.section}/${value}`;
	}) 
	res.render('tp',{img:pic2})
})

var server = app.listen(3004, function () {
  var host = server.address().address
  var port = server.address().port
  console.log("应用实例，访问地址为 http://%s:%s", host, port)
})
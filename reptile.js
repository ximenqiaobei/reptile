//
// Nodejs中 要使用 ES6 的某些特性，必须要加这一行
"use strict"

// 要引入的库：

//  用 request模块 得到网页
const request = require('request')

// 用 cheerio模块 分析网页 （与 DOM API相似）
const cheerio = require('cheerio')

//  fs 本地文件系统模块
const fs = require('fs')


// 定义一个类来保存电影的信息
// 这里只定义了 5 个要保存的数据
// 分别是  电影名 评分 引言 排名 封面图片地址
const Movie = function() {
    this.name = ''
    this.score = 0
    this.quote = ''
    this.ranking = 0
    this.coverUrl = ''
}


// Log
const log = function() {
    console.log.apply(console, arguments)
}

// 切片 得到电影第一个中文名
const nameSlice = function(name) {
    var nameArr = name.split('/')
    var oneName = nameArr[0]
    if (oneName[oneName.length-1] != ' ') {
        return oneName
    }else {
        return oneName.slice(0, oneName.length-1)
    }
}


// 这个函数来从一个电影 div 里面读取电影信息
const movieFromDiv = function(div) {
    const movie = new Movie()
    // 使用 cheerio.load 函数来返回一个可以查询的特殊对象
    const e = cheerio.load(div)

    // 然后就可以使用 querySelector 语法来获取信息了
    // .text() 获取文本信息
    // 电影名
    var nm = e('.title').text()
    movie.name = nameSlice(nm)
    // 评分
    movie.score = e('.rating_num').text()
    // 引言
    movie.quote = e('.inq').text()
    // 排名
    const pic = e('.pic')
    movie.ranking = pic.find('em').text()

    // 电影封面
    // 元素的属性用 .attr('属性名') 确定
    movie.coverUrl = pic.find('img').attr('src')

    return movie
}



// 这个函数用来把一个保存了所有电影对象的数组保存到文件中
const saveMovie = function(movies, path) {
    const s = JSON.stringify(movies, null, 2)
    // writeFile 会覆盖之前的内容
    // appendFile
    fs.writeFile(path, s, function(error) {
        if (error !== null) {
            log('*** 写入文件错误', error)
        } else {
            log('--- 保存成功')
        }
    })
}


const moviesFromUrl = function() {
    var movies = []
    for (var start = 0; start < 250; start+=25) {
        var url = `https://movie.douban.com/top250?start=${start}&filter=`
        log('start',start,'url',url)
        // request 从一个 url 下载数据并调用回调函数
        request(url, function(error, response, body) {
            // 回调函数的三个参数分别是  错误, 响应, 响应数据
            // 检查请求是否成功, statusCode 200 是成功的代码
            if (error === null && response.statusCode == 200) {
                // cheerio.load 用字符串作为参数返回一个可以查询的特殊对象
                var e = cheerio.load(body)
                log('request')
                // 查询对象的查询语法和 DOM API 中的 querySelector 一样
                var movieDivs = e('.item')
                for(var i = 0; i < movieDivs.length; i++) {
                    var element = movieDivs[i]
                    // 获取 div 的元素并且用 movieFromDiv 解析
                    // 然后加入 movies 数组中
                    var div = e(element).html()
                    var m = movieFromDiv(div)
                    movies.push(m)
                    // 保存 movies 数组到文件中
                    saveMovie(movies, 'douban.txt')
                }
            } else {
                log('*** ERROR 请求失败 ', error)
            }
        })
    }
    // log('movies',movies)
    // 保存 movies 数组到文件中
    // saveMovie(movies)
}

// 得到 top250 的所有页面
// 并把数据写入文件中保存
// const urlALL = function() {
//     var start = 0
//     while (start <= 250) {
//         log('start',start)
//         var url0 = `https://movie.douban.com/top250?start=${start}&filter=`
//         moviesFromUrl(url0)
//         start = start + 25
//     }
// }

// 得到所有评分并保存
var getScore = function() {
    fs.readFile('douban.txt','utf-8',function(err,data){
        if(err){
            console.error(err)
        }
        else{
            console.log('data')
            var data = JSON.parse(data)
            var scores = []
            for (var i = 0; i < data.length; i++) {
                var obj = data[i]
                var s = obj.score
                scores.push(s)
            }
            saveMovie(scores, 'scores.txt')
        }
    })
}


// 得到每个分段的占比
var setScore = function() {
    fs.readFile('scores.txt','utf-8',function(err,data){
        if(err){
            console.error(err)
        }
        else{
            console.log('data')
            var data = JSON.parse(data)
            var num8_2 = []
            var num8_6 = []
            var num9 = []
            var num9_4 = []
            var num10 = []
            for (var i = 0; i < data.length; i++) {
                var num = Number(data[i])
                if (num < 8.21) {
                    num8_2.push(num)
                }else if (num > 8.2 && num < 8.61) {
                    num8_6.push(num)
                }else if (num > 8.6 && num < 9.01) {
                    num9.push(num)
                }else if (num > 9 && num < 9.41) {
                    num9_4.push(num)
                }else if (num > 9.4) {
                    num10.push(num)
                }
            }

            var obj = {
                '8-8.2':num8_2.length,
                '8.2-8.6':num8_6.length,
                '8.6-9':num9.length,
                '9-9.4':num9_4.length,
                '9.4-10':num10.length,
            }

            saveMovie(obj, 'obj.txt')
        }
    })
}



const __main = function() {
    // 这是主函数
    // 下载网页, 解析出电影信息, 保存到文件
    // const url = 'https://movie.douban.com/top250?start=125&filter='
    // moviesFromUrl(url)
    // moviesFromUrl()
    // getScore()
    setScore()
}


// 程序开始的主函数
__main()

// fs.readFile(filename,[encoding],[callback(err,data)])
// filename（必选），表示要读取的文件名。
// encoding（可选），表示文件的字符编码。
// callback 是回调函数，用于接收文件的内容。

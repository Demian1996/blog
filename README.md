﻿### 关于博客
本博客采用nodejs的Express框架搭建，使用ejs引擎渲染，数据库使用mongodb。
该博客一开始是博主依着极客学院上的nodejs教程敲得，最后搭建的是多页面博客。后面，博主在此基础上采用后端渲染模版，前端使用ajax获取后端具体页面的具体部分的方式，搭建了这个半单页面博客（具体页面是实际存在的）。建设初期会有很多的bug，也会有很多的功能欠缺，博主会在以后慢慢的完善。
博客配置在腾讯云主机上（学生机1元/月），使用的也是腾讯云的域名。
### 项目安装
环境要求：
nodejs（最好是新版本）、mongodb

clone 后模块安装，blog文件夹下命令行输入
> npm install

模块安装完成后启动程序
> npm start
### 功能
- 路由
 - [x] ajax局部刷新
 - [x] 导航栏前进后退
 - [x] 关于页面
- 功能组件
 - [x] loading动画（注释掉是由于ajax太快根本看不见） 
 - [x] 文章归档
 - [x] 分页
 - [x] 搜索
 - [x] 标签
 - [ ] markdown功能完善
 - [ ] 文章摘要
 - [ ] 评论
 - [ ] 响应式
 - [x] 404页面
### 关于博主

    {
	    "id": "fictitia",
	    "age": 23,
	    "university": "南京邮电大学",
	    "specialty": "软件工程",
	    "introduction": "大四学生，考研dog。"
    }

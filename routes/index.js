var crypto = require('crypto'),
    User = require('../models/user.js'),
    Post = require('../models/post.js'),
    multer = require('multer');

var storage = multer.diskStorage({
  destination: function (req, file, cb){
    cb(null, './public/images');
  },
  filename: function (req, file, cb){
    cb(null, file.originalname)
  }
});
var upload = multer({
  storage: storage
});

//控制权限函数
function checkLogin(req,res,next){//允许登陆的用户操作
  if(!req.session.user){
//  req.flash('error','未登陆');
    res.redirect('/login');
  }
  next();
} 
function checkNotLogin(req,res,next){//允许未登陆的用户操作
  if(req.session.user){
//  req.flash('error','已登陆');
    res.redirect('back');
  }
  next();
}

module.exports = function (app){
  app.get('/', function (req, res) {
    //判断是否是第一页，并把请求的页数转换成 number 类型
    var page = req.query.p ? parseInt(req.query.p) : 1;
    //查询并返回第 page 页的 5 篇文章
    Post.getFive(null, page, function (err, posts, allposts, tagposts, total) {
      if (err) {
        posts = [];
      } 
      res.render('index', {
        posts: posts,
        allposts: allposts,
        tagposts: tagposts,
        page: page,
        totalpage: parseInt((total - 1) / 5) + 1,
	      isFirstPage: (page - 1) == 0,
        isLastPage: ((page - 1) * 5 + posts.length) == total,
        user: req.session.user
//      success: null,
//      error: null
      });
    });
  });
  app.get('/reg',checkNotLogin);
  app.get('/reg', function (req, res) {
    res.render('reg', {
      user: req.session.user
//    success: req.flash('success').toString(),
//    error: req.flash('error').toString()
    });
  });
  app.post('/reg',checkNotLogin);
  app.post('/reg', function (req, res) {
    var name = req.body.name,
        password = req.body.password,
        password_re = req.body['password-repeat'];
    //检查是否输入密码
    if(!password){
//    req.flash('error','请输入密码');
      return res.redirect('/reg');
    }
    //检验用户两次输入的密码是否一致
    if (password_re != password) {
//    req.flash('error', '两次输入的密码不一致!'); 
      return res.redirect('/reg');//返回注册页
    }
    //生成密码的 md5 值
    var md5 = crypto.createHash('md5'),
        password = md5.update(req.body.password).digest('hex');
    var newUser = new User({
      name: name,
      password: password,
      email: req.body.email
    });
    //检查用户名是否已经存在 
    User.get(newUser.name, function (err, user) {
      if (err) {
//      req.flash('error', err);
        return res.redirect('/');
      }
      if (user) {
//      req.flash('error', '用户已存在!');
        return res.redirect('/reg');//返回注册页
      }
      //如果不存在则新增用户
      newUser.save(function (err, user) {
        if (err) {
//        req.flash('error', err);
          return res.redirect('/reg');//注册失败返回主册页
        }
        req.session.user = user;//用户信息存入 session
//      req.flash('success', '注册成功!');
        res.redirect('/');//注册成功后返回主页
      });
    });
  });
  app.get('/login',checkNotLogin);
  app.get('/login', function (req, res) {
    res.render('login', {
      user: req.session.user
//    success: req.flash('success').toString(),
//    error: req.flash('error').toString()
    });
  });
  app.post('/login',checkNotLogin);
  app.post('/login', function (req, res) {
    //生成密码的 md5 值
    var md5 = crypto.createHash('md5'),
        password = md5.update(req.body.password).digest('hex');
    //检查用户是否存在
    User.get(req.body.name, function (err, user) {
      if (!user) {
//      req.flash('error', '用户不存在!'); 
        return res.redirect('/login');//用户不存在则跳转到登录页
      }
      //检查密码是否一致
      if (user.password != password) {
//      req.flash('error', '密码错误!'); 
        return res.redirect('/login');//密码错误则跳转到登录页
      }
      //用户名密码都匹配后，将用户信息存入 session
      req.session.user = user;
//    req.flash('success', '登陆成功!');
      res.redirect('/');//登陆成功后跳转到主页
    });
  });
  app.get('/post',checkLogin);
  app.get('/post', function (req, res) {
    res.render('post',{
      user: req.session.user
//    success: req.flash('success').toString(),
//    error: req.flash('error').toString()
    });
  });
  app.post('/post',checkLogin);
  app.post('/post', function (req, res) {
    var currentUser = req.session.user,
        tags = [req.body.tag1, req.body.tag2 , req.body.tag3],
        post = new Post(currentUser.name, req.body.title, tags ,req.body.post);
    post.save(function (err) {
      if (err) {
//      req.flash('error', err); 
        return res.redirect('/');
      }
//    req.flash('success', '发布成功!');
      res.redirect('/');//发表成功跳转到主页
    });
  });
  app.get('/logout',checkLogin);
  app.get('/logout', function (req, res) {
    req.session.user = null;
//  req.flash('success', '登出成功!');
    res.redirect('/');//登出成功后跳转到主页
  });
  app.get('/upload', checkLogin);
  app.get('/upload', function (req, res) {
    res.render('upload', {
      user: req.session.user
    });
  });
  app.post('/upload', checkLogin);
  app.post('/upload', upload.single('file'),function (req, res) {
//  req.flash('success', '文件上传成功!');
    res.redirect('/upload');
  });
  app.get('/u/:name', function (req, res) {
    var page = req.query.p ? parseInt(req.query.p) : 1;
    //检查用户是否存在
    User.get(req.params.name, function (err, user) {
      if (!user) {
//      req.flash('error', '用户不存在!'); 
        return res.redirect('/');
      }
      //查询并返回该用户第 page 页的 5 篇文章
      Post.getFive(user.name, page, function (err, posts, allposts, tagposts, total) {
        if (err) {
//        req.flash('error', err); 
          return res.redirect('/');
        } 
        res.render('user', {
          posts: posts,
          page: page,
          allposts: allposts,
          tagposts: tagposts,
	        totalpage: parseInt((total - 1) / 5) + 1,
          isFirstPage: (page - 1) == 0,
          isLastPage: ((page - 1) * 5 + posts.length) == total,
          user: req.session.user
        });
      });
    });  
  });
  app.get('/u/:name/:day/:title', function (req, res) {
    if(req.params.title != 'ajax.js'){
    Post.getOne(req.params.name, req.params.day, req.params.title, function (err, post, allposts, tagposts) {
      if (err) {
//      req.flash('error', err); 
        return res.redirect('/');
      }
      res.render('article', {
        post: post,
        allposts: allposts,
        tagposts: tagposts,
        user: req.session.user
      });
    });
    }
  });
  app.get('/edit/:name/:day/:title', checkLogin);
  app.get('/edit/:name/:day/:title', function (req, res) {
    var currentUser = req.session.user;
    Post.edit(currentUser.name, req.params.day, req.params.title, function (err, post) {
      if (err) {
//      req.flash('error', err); 
        return res.redirect('back');
      }
      res.render('edit', {
        post: post,
        user: req.session.user
      });
    });
  });
  app.post('/edit/:name/:day/:title', checkLogin);
  app.post('/edit/:name/:day/:title', function (req, res) {
    var currentUser = req.session.user;
//  console.log(req.body.tags);
//  debugger;
    Post.update(currentUser.name, req.params.day, req.params.title, req.body.post, req.body.tags, function (err) {
//    var url = encodeURI('/u/' + req.params.name + '/' + req.params.day + '/' + req.params.title);
      if (err) {
//      req.flash('error', err); 
        return res.redirect('/');
      }
//    req.flash('success', '修改成功!');
      res.redirect('/');
    });
  });
  app.get('/remove/:name/:day/:title', checkLogin);
  app.get('/remove/:name/:day/:title', function (req, res) {
    var currentUser = req.session.user;
    Post.remove(currentUser.name, req.params.day, req.params.title, function (err) {
      if (err) {
//      req.flash('error', err); 
        return res.redirect('back');
      }
//    req.flash('success', '删除成功!');
      res.redirect('/');
    });
  });
  app.get('/archive/:month', function (req, res) {
    //判断是否是第一页，并把请求的页数转换成 number 类型
    var page = req.query.p ? parseInt(req.query.p) : 1;
    //查询并返回第 page 页的 5 篇文章
    Post.getArchive(req.params.month, page, function (err, posts, allposts, tagposts, total){
      if (err) {
        posts = [];
      } 
      res.render('index', {
        posts: posts,
        allposts: allposts,
        tagposts: tagposts,
        page: page,
        totalpage: parseInt((total - 1) / 5) + 1,
        isFirstPage: (page - 1) == 0,
        isLastPage: ((page - 1) * 5 + posts.length) == total,
        user: req.session.user
//      success: req.flash('success').toString(),
//      error: req.flash('error').toString()
      });
    });
  });
  app.get('/tags/:tag', function (req, res){
    var page = req.query.p ? parseInt(req.query.p) : 1;
    Post.getTag(req.params.tag, page, function (err, posts, allposts, tagposts, total){
      if(err){
        posts = [];
      }
      res.render('index', {
        posts: posts,
        allposts: allposts,
        tagposts: tagposts,
        page: page,
        totalpage: parseInt((total - 1) / 5) + 1,
        isFirstPage: (page - 1) == 0,
        isLastPage: ((page - 1) * 5 + posts.length) == total,
        user: req.session.user
      });
    });
  })
  app.get('/about', function (req, res) {
    res.render('about', {
      user: req.session.user
    });
  });
};
  


var mongodb = require('./db');
var markdown = require('markdown').markdown;

function Post(name, title, tags, post) {
  this.name = name;
  this.title = title;
  this.tags = tags;
  this.post = post;
}

module.exports = Post;

//存储一篇文章及其相关信息
Post.prototype.save = function(callback) {
  var date = new Date();
  //存储各种时间格式，方便以后扩展
  var time = {
      date: date,
      year : date.getFullYear(),
      month : date.getFullYear() + "-" + (date.getMonth() + 1),
      day : date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate(),
      minute : date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " + 
      date.getHours() + ":" + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes()) 
  }
  //要存入数据库的文档
  var post = {
      name: this.name,
      time: time,
      title: this.title,
      tags: this.tags,
      post: this.post
  };
  //打开数据库
  mongodb.open(function (err, db) {
    if (err) {
      return callback(err);
    }
    //读取 posts 集合
    db.collection('posts', function (err, collection) {
      if (err) {
        mongodb.close();
        return callback(err);
      }
      //将文档插入 posts 集合
      collection.insert(post, {
        safe: true
      }, function (err) {
        mongodb.close();
        if (err) {
          return callback(err);//失败！返回 err
        }
        callback(null);//返回 err 为 null
      });
    });
  });
};

//读取用户5篇文章及其相关信息
Post.getFive = function(name, page, callback) {
  var displayArticles,
      archiveArticles,
      total,
      tagArticles;

  mongodb.open(function (err, db) {
    if (err) {
      return callback(err);
    }
    //读取 posts 集合
    db.collection('posts', function(err, collection) {
      if (err) {
        mongodb.close();
        return callback(err);
      }
      var query = {};
      if (name) {
        query.name = name;
      }
      //使用 count 返回特定查询的文档数 total
      collection.count(query, function (err, total) {
        //根据 query 对象查询，并跳过前 (page-1)*5 个结果，返回之后的 5 个结果
        collection.find(query, {
          skip: (page - 1) * 5,
          limit: 5
        }).sort({
          time: -1
        }).toArray(function (err, docs) {
          if (err) {
            return callback(err);
          }
          //解析 markdown 为 html
          docs.forEach(function (doc) {
            doc.post = markdown.toHTML(doc.post);
          });
          displayArticles = docs;
          total = total;
          //返回只包含 name、time、title 属性的文档组成的存档数组
          collection.find({}, {
            "name": 1,
            "time": 1,
            "title": 1
          }).sort({
            time: -1
          }).toArray(function (err, docs) {
            if (err) {
              return callback(err);
            }
            archiveArticles = docs;
            collection.distinct("tags", function (err, docs){
              mongodb.close();
              if(err){
                return callback(err);
              }
              tagArticles = docs;
              callback(null, displayArticles, archiveArticles, tagArticles, total);
            });
          });
        });
      });
    });
  });
};

//读取某个文章
Post.getOne = function(name, day, title, callback) {
  var displayArticle,
      archiveArticles,
      tagArticles;
//打开数据库
  mongodb.open(function (err, db) {
    if (err) {
      return callback(err);
    }
    //读取 posts 集合
    db.collection('posts', function (err, collection) {
      if (err) {
        mongodb.close();
        return callback(err);
      }
      //根据用户名、发表日期及文章名进行查询
      collection.findOne({
        "name": name,
        "time.day": day,
        "title": title
      }, function (err, doc) {
        if (err) {
          return callback(err);
        }
        //解析 markdown 为 html
        doc.post = markdown.toHTML(doc.post);
        displayArticle = doc;
        
        //返回只包含 name、time、title 属性的文档组成的存档数组
        collection.find({}, {
          "name": 1,
          "time": 1,
          "title": 1
        }).sort({
          time: -1
        }).toArray(function (err, docs) {
          if (err) {
            return callback(err);
          }
          archiveArticles = docs;
          collection.distinct('tags', function (err, docs){
            mongodb.close();
            if(err){
              return callback(err);
            }
            tagArticles = docs;
            callback(null, displayArticle, archiveArticles, tagArticles);
          });
        });
      });
    });
  });
};

//返回原始发表的内容（markdown 格式）
Post.edit = function(name, day, title, callback) {
  //打开数据库
  mongodb.open(function (err, db) {
    if (err) {
      return callback(err);
    }
    //读取 posts 集合
    db.collection('posts', function (err, collection) {
      if (err) {
        mongodb.close();
        return callback(err);
      }
      //根据用户名、发表日期及文章名进行查询
      collection.findOne({
        "name": name,
        "time.day": day,
        "title": title
      }, function (err, doc) {
        mongodb.close();
        if (err) {
          return callback(err);
        }
        callback(null, doc);//返回查询的一篇文章（markdown 格式）
      });
    });
  });
};

//更新一篇文章及其相关信息
Post.update = function(name, day, title, post, tags, callback) {
  //打开数据库
  mongodb.open(function (err, db) {
    if (err) {
      return callback(err);
    }
    //读取 posts 集合
    db.collection('posts', function (err, collection) {
      if (err) {
        mongodb.close();
        return callback(err);
      }
      //更新文章内容
      collection.update({
        "name": name,
        "time.day": day,
        "title": title
      }, {
        $set: {
          post: post,
          tags: tags
        }
      }, function (err) {
        mongodb.close();
        if (err) {
          return callback(err);
        }
        callback(null);
      });
    });
  });
};

//删除一篇文章
Post.remove = function(name, day, title, callback) {
  //打开数据库
  mongodb.open(function (err, db) {
    if (err) {
      return callback(err);
    }
    //读取 posts 集合
    db.collection('posts', function (err, collection) {
      if (err) {
        mongodb.close();
        return callback(err);
      }
      //根据用户名、日期和标题查找并删除一篇文章
      collection.remove({
        "name": name,
        "time.day": day,
        "title": title
      }, {
        w: 1
      }, function (err) {
        mongodb.close();
        if (err) {
          return callback(err);
        }
        callback(null);
      });
    });
  });
};
//返回所有文章存档信息
Post.getArchive = function(month, page, callback) {
  var displayArticles,
      archiveArticles,
      total,
      tagArticles;
  //打开数据库
  mongodb.open(function (err, db) {
    if (err) {
      return callback(err);
    }
    var query = {"time.month": month};
    //读取 posts 集合
    db.collection('posts', function (err, collection) {
      if (err) {
        mongodb.close();
        return callback(err);
      }
      collection.count(query, function (err, total){
        collection.find(query, {
          skip: (page - 1) * 5,
          limit: 5
        }).sort({
          time: -1
        }).toArray(function (err, docs){
          if (err) {
            return callback(err);
          }
            //解析 markdown 为 html
          docs.forEach(function (doc) {
            doc.post = markdown.toHTML(doc.post);
          });
        
          displayArticles = docs;
          total = total;

          collection.find({}, {
            "name": 1,
            "time": 1,
            "title": 1
          }).sort({
            time: -1
          }).toArray(function (err, docs) {
            if (err) {
              return callback(err);
            }
            archiveArticles = docs;
            collection.distinct('tags', function (err, docs){
              mongodb.close();
              if(err){
                callback(err);
              }
              tagArticles = docs;
              callback(null, displayArticles, archiveArticles, tagArticles, total);
            });
          });
        });
      });
    });
  });
};
//返回特定标签的所有文章
Post.getTag = function (tag, page, callback){
  var tagArticles,
      archiveArticles,
      total,
      displayArticles;
      
  mongodb.open(function (err, db){
    if (err) {
      return callback(err);
    }
    db.collection('posts', function (err, collection) {
      if (err) {
        mongodb.close();
        return callback(err);
      }
      //distinct 用来找出给定键的所有不同值
      collection.distinct("tags", function (err, docs) {
        if (err) {
          return callback(err);
        }
        tagArticles = docs;
        collection.find({},{
          "name": 1,
          "title": 1,
          "time": 1
        }).sort({
          time: -1
        }).toArray(function (err, docs){
          if(err){
            callback(err);
          }
          archiveArticles = docs;
          collection.count({"tags": tag}, function (err, total){
            if(err){
              callback(err);
            }
            collection.find({"tags": tag},{
              skip: (page - 1) * 5,
              limit: 5 
            }).sort({
              time : -1
            }).toArray(function (err, docs){
              mongodb.close();
              if(err){
                callback(err);
              }
              docs.forEach(function (doc){
                doc.post = markdown.toHTML(doc.post);
              })
              displayArticles = docs;
              total = total;
              callback(null, displayArticles, archiveArticles, tagArticles, total);
            });
          });
        });
      });
    });
  });
};
//返回搜索文章
Post.search = function (keyword, page, callback){
  var displayArticles,
      archiveArticles,
      tagArticles,
      total;
  mongodb.open(function(err, db){
    if(err){
      callback(err);
    }
    db.collection('posts', function (err, collection){
      collection.count({"title":{$regex:keyword,$options:"$gi"}}, function (err, total){
        if(err){
          callback(err); 
        }
        collection.find({"title":{$regex:keyword,$options:"$gi"}}, {
          skip: (page - 1) * 5,
          limit: 5
        }).sort({
          time: -1
        }).toArray(function (err, docs){
          if(err){
            callback(err);
          }
          console.log(docs);
          docs.forEach(function (doc){
            doc.post = markdown.toHTML(doc.post);
          });
          displayArticles = docs;
          collection.find({},{
            "name": 1,
            "title": 1,
            "time": 1
          }).sort({
            time: -1
          }).toArray(function (err, docs){
            if(err){
              callback(err);
            }
            archiveArticles = docs;
            
            collection.distinct("tags", function (err, docs){
              mongodb.close();
              if(err){
                return callback(err);
              }
              tagArticles = docs;
              callback(null, displayArticles, archiveArticles, tagArticles, total);
            });
          });
        });
      });
    });
  });
};

function createXHR(){
  if(typeof XMLHttpRequest != "undefined"){
    return new XMLHttpRequest();
  }else if(typeof ActiveXObject != "undefined"){
    if(typeof arguments.callee.activeXString != "string"){
      let versions = ["MSXML2.XMLHttp.6.0","MSXML2.XMLHttp.3.0","MSXML2.XMLHttp"],
          i,len;
      for(i = 0,len = versions.length; i < len; i++){
        try{
          new ActiveXObject(versions[i]);
          arguments.callee.activeXString = versions[i];
          break;
        }catch(e){
          //skip
        }
      }
      return new ActiveXObject(arguments.callee.activeXString);
    }else{
      throw new Error("no XHR object available.");
    }
  }
}

//ajax请求
function handle(url){
  let xhr = createXHR();
  xhr.open('GET', url, true);
  xhr.responseType = 'document';  
  xhr.timeout = 3000;
  xhr.onreadystatechange = function (){
    if(xhr.readyState == 4){
      content.innerHTML = xhr.responseXML.querySelector("#content").innerHTML;
    }
  }
  xhr.send(null);
}
//此处申明全局变量
let aList = document.querySelector('#navigation').querySelectorAll('a'),
    content = document.querySelector('#content'),
    spinner = document.querySelector('.spinner'),
    bg = document.querySelector('#bg');
    
//导航栏ajax
for(let i = 0, len = aList.length; i < len; i++){
  let url = aList[i].getAttribute("href");
  if(url != '/logout'){
    aList[i].addEventListener('click', function (e){
      //阻止默认行为
      e.preventDefault();
      
      history.pushState({num: i}, null, url);
      handle(url);
      
      //改变样式
      if(this.className == ''){
        this.className = 'primary';
      }
      for(let j = 0; j < len; j++){
        if(j != i){
          aList[j].className = "";
        }
      }
    }, false);
  }
}


//主页下的事件委托ajax
content.addEventListener('click', function (e){
  let target;
  if(aList[0].className == 'primary' && ((target = e.target).tagName == 'A' || (target = e.target.parentNode).tagName == 'A')){
//  content.style.display = 'none';
//  spinner.style.display = 'block';
    
    let url = target.getAttribute('href');
    e.preventDefault();
    history.pushState(null, null, url);
    handle(url);
    
//  spinner.style.display = 'none';
//  content.style.display = 'block';
  }
}, false);

//前进后退
window.addEventListener('popstate', function (e){
  let num = e.state ? e.state.num : 0;
  for(let i = 0; i < aList.length; i++){
    if(i === num){
      aList[i].className = 'primary';
    }else{
      aList[i].className = '';
    }
  }
  let url = location.href;
  //修改search
  
  handle(url);
}, false);


//保存高亮样式使得刷新后显示
(function () {
  var ie = !!(window.attachEvent && !window.opera);
  var wk = /webkit\/(\d+)/i.test(navigator.userAgent) && (RegExp.$1 < 525);
  var fn = [];
  var run = function () { for (var i = 0; i < fn.length; i++) fn[i](); };
  var d = document;
  d.ready = function (f) {
    if (!ie && !wk && d.addEventListener)
      return d.addEventListener('DOMContentLoaded', f, false);
    if (fn.push(f) > 1) return;
    if (ie)
      (function () {
        try { d.documentElement.doScroll('left'); run(); }
        catch (err) { setTimeout(arguments.callee, 0); }
      })();
    else if (wk)
      var t = setInterval(function () {
        if (/^(loaded|complete)$/.test(d.readyState))
          clearInterval(t), run();
      }, 0);
  };
})();
document.ready(function (){
  let path = location.pathname;
  for(let i = 0; i < aList.length; i++){
    aList[i].className = '';
  }
  switch(path){
    case '/': aList[0].className = 'primary';break;
    case '/about': aList[1].className = 'primary';break;
    case '/login': aList[2].className = 'primary';break;
    case '/post': aList[1].className = 'primary';break;
    case '/upload': aList[2].className = 'primary';break;
    case '/logout': aList[3].className = 'primary';break;
    default:
      aList[0].className = 'primary';break;
  }
});





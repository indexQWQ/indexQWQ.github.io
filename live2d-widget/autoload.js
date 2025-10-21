
/*!
 * Live2D Widget
 * https://github.com/stevenjoezhang/live2d-widget
 */

// 推荐使用绝对路径
const live2d_path = "/live2d-widget/";

// 封装异步加载资源的方法
function loadExternalResource(url, type) {
  return new Promise((resolve, reject) => {
    let tag;

    if (type === 'css') {
      tag = document.createElement('link');
      tag.rel = 'stylesheet';
      tag.href = url;
    }
    else if (type === 'js') {
      tag = document.createElement('script');
      tag.type = 'module'; // 模块类型
      tag.src = url;
    }
    if (tag) {
      tag.onload = () => resolve(url);
      tag.onerror = () => reject(url);
      document.head.appendChild(tag);
    }
  });
}

// 主初始化函数（立即执行）
(async () => {
  // 移动端可在此判断是否加载
  // if (screen.width < 768) return;

  // 避免图片资源跨域问题
  const OriginalImage = window.Image;
  window.Image = function(...args) {
    const img = new OriginalImage(...args);
    img.crossOrigin = "anonymous"; // 设置跨域属性
    return img;
  };
  window.Image.prototype = OriginalImage.prototype;
  
  // 加载CSS和JS资源
  await Promise.all([
    loadExternalResource(live2d_path + 'waifu.css', 'css'),
    loadExternalResource(live2d_path + 'waifu-tips.js', 'js')
  ]);
  
  // 初始化看板娘组件
  initWidget({
    waifuPath: live2d_path + 'waifu-tips.json', // 配置文件路径
    //cdnPath: live2d_path,  // 关键：设置cdnPath来启用纹理缓存功能
    cubism2Path: live2d_path + 'live2d.min.js', // Cubism2库路径
    tools: ['hitokoto', 'asteroids', 'switch-model', 'switch-texture', 'photo', 'info', 'quit'], // 工具栏配置
    logLevel: 'info', // 日志级别 warn/info
    drag: true, // 启用拖拽
    model: {
      jsonPath: live2d_path + 'models/potion-Maker-Tia/index.json' // 默认模型路径
    }
  });
})();

// 控制台输出提示
console.log(`\n%cLive2D%cWidget%c\n`, 
  'padding: 8px; background: #cd3e45; font-weight: bold; font-size: large; color: white;', 
  'padding: 8px; background: #ff5450; font-size: large; color: #eee;', 
  '');
/*
く__,.ヘヽ.        /  ,ー､ 〉
         ＼ ', !-─‐-i  /  /´
         ／｀ｰ'       L/／｀ヽ､
       /   ／,   /|   ,   ,       ',
     ｲ   / /-‐/  ｉ  L_ ﾊ ヽ!   i
      ﾚ ﾍ 7ｲ｀ﾄ   ﾚ'ｧ-ﾄ､!ハ|   |
        !,/7 '0'     ´0iソ|    |
        |.从"    _     ,,,, / |./    |
        ﾚ'| i＞.､,,__  _,.イ /   .i   |
          ﾚ'| | / k_７_/ﾚ'ヽ,  ﾊ.  |
            | |/i 〈|/   i  ,.ﾍ |  i  |
           .|/ /  ｉ：    ﾍ!    ＼  |
            kヽ>､ﾊ    _,.ﾍ､    /､!
            !'〈//｀Ｔ´', ＼ ｀'7'ｰr'
            ﾚ'ヽL__|___i,___,ンﾚ|ノ
                ﾄ-,/  |___./
                'ｰ'    !_,.:
*/

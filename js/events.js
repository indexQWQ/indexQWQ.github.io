HTMLElement.prototype.wrap=function(e){this.parentNode.insertBefore(e,this),this.parentNode.removeChild(this),e.appendChild(this)},Fluid.events={registerNavbarEvent:function(){var e,o=jQuery("#navbar");0!==o.length&&(e=jQuery("#navbar .dropdown-menu"),0<o.offset().top&&(o.removeClass("navbar-dark"),e.removeClass("navbar-dark")),Fluid.utils.listenScroll(function(){o[50<o.offset().top?"addClass":"removeClass"]("top-nav-collapse"),e[50<o.offset().top?"addClass":"removeClass"]("dropdown-collapse"),0<o.offset().top?o.removeClass("navbar-dark"):o.addClass("navbar-dark"),e.removeClass("navbar-dark")}),jQuery("#navbar-toggler-btn").on("click",function(){var e=jQuery(this);e.data("animating")||(e.data("animating",!0),jQuery(".animated-icon").toggleClass("open"),jQuery("#navbar").toggleClass("navbar-col-show"),setTimeout(function(){e.data("animating",!1)},300))}))},registerParallaxEvent:function(){var n,r=jQuery('#banner[parallax="true"]');0!==r.length&&0!==(n=jQuery("#board")).length&&Fluid.utils.listenScroll(function(){var e=jQuery(window).scrollTop()/5,o=96+parseInt(n.css("margin-top"),10),o=(r.css({transform:"translate3d(0,"+(e=o<e?o:e)+"px,0)"}),jQuery(".side-col"));o&&o.css({"padding-top":e+"px"})})},registerScrollDownArrowEvent:function(){var e=jQuery(".scroll-down-bar");0!==e.length&&e.on("click",function(){Fluid.utils.scrollToElement("#board",-jQuery("#navbar").height())})},registerScrollTopArrowEvent:function(){var o,n,r,e,t,a=jQuery("#scroll-top-button");0!==a.length&&0!==(o=jQuery("#board")).length&&(r=n=!1,(e=function(){var e=o[0].getClientRects()[0].right,e=document.body.offsetWidth-e;n=50<=e,a.css({bottom:n&&r?"20px":"-60px",right:e-64+"px"})})(),jQuery(window).resize(e),t=o.offset().top,Fluid.utils.listenScroll(function(){var e=document.body.scrollTop+document.documentElement.scrollTop;r=t<=e,a.css({bottom:n&&r?"20px":"-60px"})}),a.on("click",function(){jQuery("body,html").animate({scrollTop:0,easing:"swing"})}))},registerImageLoadedEvent:function(){if("NProgress"in window){var e,n=document.getElementById("banner"),n=(n&&(n=n.style.backgroundImage.match(/\((.*?)\)/)[1].replace(/(['"])/g,""),(e=new Image).onload=function(){window.NProgress&&null!==window.NProgress.status&&window.NProgress.inc(.2)},e.src=n,e.complete)&&e.onload(),jQuery("main img:not([lazyload])")),r=n.length;for(let o of n){let e=o.onload;o.onload=function(){e&&e(),window.NProgress&&null!==window.NProgress.status&&window.NProgress.inc(.5/r)},o.complete&&o.onload()}}},registerRefreshCallback:function(e){Array.isArray(Fluid.events._refreshCallbacks)||(Fluid.events._refreshCallbacks=[]),Fluid.events._refreshCallbacks.push(e)},refresh:function(){if(Array.isArray(Fluid.events._refreshCallbacks))for(var e of Fluid.events._refreshCallbacks)e instanceof Function&&e()},billboard:function(){"console"in window&&console.log(`%c
く__,.ヘヽ.        /  ,ー､ 〉
         ＼ ', !-─‐i  /  /´
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
        Thank you for using Fluid theme
 https://github.com/fluid-dev/hexo-theme-fluid
`,"color: #ff6b6b; font-size: 8px; line-height: 1;")}};
Page({
  data: {
    // 首页中间展示的图片路径
    homeImage: '/images/homepage.png',
    motto: 'Eric 使用指南'
  },

  // 虽然现在有 TabBar，但保留按钮跳转功能作为引导
  goToCoupon() {
    wx.switchTab({
      url: '/pages/privilege/privilege'
    })
  }
})
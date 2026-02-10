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
  },

  goToAdmin() {
    wx.navigateTo({
      url: '/pages/admin/admin',
      success: () => {
        console.log('跳转管理后台成功');
      },
      fail: (err) => {
        console.error('跳转失败，请检查路径是否在 app.json 中注册', err);
        wx.showToast({
          title: '路径配置错误',
          icon: 'none'
        });
      }
    });
  }
})
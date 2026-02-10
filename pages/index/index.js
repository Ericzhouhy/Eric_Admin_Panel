Page({
  data: {
    homeImage: '/images/homepage.png',
    motto: 'Eric 使用指南'
  },

  goToCoupon() {
    wx.switchTab({
      url: '/pages/privilege/privilege'
    })
  },

  async goToAdmin() {
    const ADMIN_OPENID = 'oViSW5Wt0WnNnZlrxSpTQNnDnIhc'; // 你的专属ID

    wx.showLoading({ title: '身份验证中...' });

    try {
      // 1. 获取当前用户的 OpenID
      // 注意：这里需要你有一个名为 'login' 的云函数
      const res = await wx.cloud.callFunction({
        name: 'login' 
      });

      const userOpenId = res.result.openid;

      // 2. 身份比对
      if (userOpenId === ADMIN_OPENID) {
        wx.hideLoading();
        wx.navigateTo({
          url: '/pages/admin/admin'
        });
      } else {
        wx.hideLoading();
        wx.showModal({
          title: '受限区域',
          content: '只有 Eric 大王有管理权限 👑',
          showCancel: false,
          confirmText: '遵命',
          confirmColor: '#FF9500'
        });
      }
    } catch (err) {
      wx.hideLoading();
      console.error('鉴权失败', err);
      wx.showToast({
        title: '网络开小差了',
        icon: 'none'
      });
    }
  }
})
Page({
  data: {
    recipes: [
      { 
        id: 1, 
        name: '奶皮子糖葫芦', 
        desc: '水果，奶油，牛奶', 
        image: '/images/food/奶皮子糖葫芦.jpg' 
      },
      { 
        id: 2, 
        name: '板栗红烧肉', 
        desc: '板栗，五花肉', 
        image: '/images/food/板栗红烧肉.jpg' 
      },
      { 
        id: 3, 
        name: '清炒时蔬', 
        desc: '豆角山药', 
        image: '/images/food/清炒时蔬.jpg' 
      },
      { 
        id: 4, 
        name: '酸辣粉', 
        desc: '午餐肉，鸡蛋，红薯粉', 
        image: '/images/food/酸辣粉.jpg' 
      }
    ],
    isPopupVisible: false,
    newName: '',
    newDesc: '',
    tempImagePath: '' 
  },

  showPopup() {
    this.setData({ isPopupVisible: true });
  },

  hidePopup() {
    this.setData({
      isPopupVisible: false,
      // 清空数据（可选，防止下次打开还有上次填的内容）
      newName: '',
      newDesc: '',
      tempImagePath: ''
    });
  },

  

  // 选择图片
  chooseImage() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      success: (res) => {
        this.setData({ tempImagePath: res.tempFiles[0].tempFilePath });
      }
    });
  },

  // 在你的 Page 逻辑中添加
  preventTouchMove: function() {
    // 什么都不做，拦截滑动事件
    return;
  },

  addRecipe() {
    if (!this.data.newName || !this.data.tempImagePath) {
      wx.showToast({ title: '名字和照片都要有哦', icon: 'none' });
      return;
    }

    const newRecipe = {
      id: Date.now(),
      name: this.data.newName,
      desc: this.data.newDesc || '随缘放料',
      image: this.data.tempImagePath
    };

    this.setData({
      recipes: [newRecipe, ...this.data.recipes],
      isPopupVisible: false,
      newName: '',
      newDesc: '',
      tempImagePath: ''
    });

    wx.showToast({ title: '已加入菜单', icon: 'success' });
  }
});
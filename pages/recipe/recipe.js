// 1. 初始化数据库引用
const db = wx.cloud.database();

Page({
  data: {
    recipes: [], // 初始为空，从云端获取
    isPopupVisible: false,
    newName: '',
    newDesc: '',
    tempImagePath: ''
  },

  /**
   * 页面加载时执行
   */
  onLoad() {
    this.fetchRecipes();
  },

  /**
   * 从云数据库拉取最新菜谱
   */
  fetchRecipes() {
    wx.showLoading({ title: '加载中...' });
    
    // 访问 recipes 集合，按时间倒序排列（最新的在前面）
    db.collection('recipes')
      .orderBy('createdAt', 'desc')
      .get()
      .then(res => {
        this.setData({ recipes: res.data });
        wx.hideLoading();
      })
      .catch(err => {
        console.error("加载失败", err);
        wx.hideLoading();
      });
  },

  /**
   * 核心功能：添加菜谱到后台
   */
  async addRecipe() {
    const { newName, newDesc, tempImagePath } = this.data;

    // 表单校验
    if (!newName || !tempImagePath) {
      wx.showToast({ title: '名字和照片都要有哦', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '正在入库...', mask: true });

    try {
      const cloudPath = `food-photos/${Date.now()}-${Math.floor(Math.random()*1000)}.jpg`;
      
      const uploadRes = await wx.cloud.uploadFile({
        cloudPath: cloudPath,
        filePath: tempImagePath
      });

      const result = await db.collection('recipes').add({
        data: {
          name: newName,
          desc: newDesc || '暂无描述',
          image: uploadRes.fileID, // 存入云端永久 ID
          createdAt: db.serverDate() // 存入服务器时间
        }
      });

      // 步骤 3: 提示成功并刷新列表
      wx.showToast({ title: '入库成功', icon: 'success' });
      
      this.setData({
        isPopupVisible: false,
        newName: '',
        newDesc: '',
        tempImagePath: ''
      });

      this.fetchRecipes(); // 重新拉取列表，看到新菜品

    } catch (err) {
      console.error("操作失败", err);
      wx.showToast({ title: '入库失败，请重试', icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  },

  // --- 其他交互逻辑 ---

  showPopup() {
    this.setData({ isPopupVisible: true });
  },

  hidePopup() {
    this.setData({
      isPopupVisible: false,
      newName: '',
      newDesc: '',
      tempImagePath: ''
    });
  },

  chooseImage() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      success: (res) => {
        this.setData({ tempImagePath: res.tempFiles[0].tempFilePath });
      }
    });
  },

  preventTouchMove() { return; }
});
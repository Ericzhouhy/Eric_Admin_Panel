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
    db.collection('recipes')
      .orderBy('createdAt', 'desc')
      .get()
      .then(async res => {
        let list = res.data;
        
        // 提取所有云文件 ID
        const fileIds = list.map(item => item.image);
        
        // 换取临时链接 (可选，能极大增加加载稳定性)
        const urlRes = await wx.cloud.getTempFileURL({ fileList: fileIds });
        list.forEach((item, index) => {
          item.image = urlRes.fileList[index].tempFileURL;
        });
  
        this.setData({ recipes: list });
        wx.hideLoading();
      });
  },

  /**
   * 核心功能：添加菜谱到后台
   */
  async addRecipe() {
    if (this.data.isSubmitting) return; // 如果正在提交，直接返回
    
    const { newName, newDesc, tempImagePath } = this.data;
    if (!newName || !tempImagePath) {
      wx.showToast({ title: '名字和照片都要有哦', icon: 'none' });
      return;
    }

    this.setData({ isSubmitting: true }); // 加锁
    wx.showLoading({ title: '正在入库...', mask: true });

    try {
      // ... 你的原有逻辑 ...
    } catch (err) {
      // ...
    } finally {
      this.setData({ isSubmitting: false }); // 解锁
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
        const tempFilePath = res.tempFiles[0].tempFilePath;
  
        // 重点：调用微信原生裁剪
        wx.cropImage({
          src: tempFilePath, // 传入刚选好的图片
          aspectRatio: '1:1', // 强制 1:1，适合你的菜谱正方形卡片
          success: (cropRes) => {
            // 裁剪成功后，返回的是裁剪后的新路径
            this.setData({ tempImagePath: cropRes.tempFilePath });
          },
          fail: (err) => {
            console.log('用户取消或裁剪失败', err);
          }
        });
      }
    });
  },

  preventTouchMove() { return; }
});
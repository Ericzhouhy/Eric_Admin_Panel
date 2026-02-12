// 1. 初始化数据库引用
const db = wx.cloud.database();

Page({
  data: {
    recipes: [], // 初始为空，从云端获取
    isPopupVisible: false,
    newName: '',
    newDesc: '',
    showAskPopup: false,
    selectedDish: '',
    tempImagePath: ''
  },

  /**
   * 页面加载时执行
   */
  onLoad() {
    this.fetchRecipes();
  },

  onShow() {
    this.fetchRecipes();
  },

  async onPullDownRefresh() {
    console.log('开始下拉刷新');
    // 震动反馈（可选，增加手感）
    wx.vibrateShort(); 
    
    // 执行刷新逻辑
    await this.fetchRecipes(true);
    
    // 停止下拉动作
    wx.stopPullDownRefresh();
  },

  /**
   * 从云数据库拉取最新菜谱
   */
  fetchRecipes(isSilent = false) {
    if (!isSilent) wx.showLoading({ title: '加载中...' });

    // 返回 Promise 以便配合 await stopPullDownRefresh
    return db.collection('recipes')
      .orderBy('createdAt', 'desc')
      .get()
      .then(async res => {
        let list = res.data;
        
        if (list.length > 0) {
          const fileIds = list.map(item => item.image);
          const urlRes = await wx.cloud.getTempFileURL({ fileList: fileIds });
          list.forEach((item, index) => {
            item.image = urlRes.fileList[index].tempFileURL;
          });
        }
  
        this.setData({ recipes: list });
      })
      .catch(err => {
        console.error("加载失败", err);
      })
      .finally(() => {
        if (!isSilent) wx.hideLoading();
      });
  },

  /**
   * 核心功能：添加菜谱到后台
   */
  /**
   * 核心功能：添加菜谱到后台
   */
  async addRecipe() {
    if (this.data.isSubmitting) return; // 防抖锁
    
    const { newName, newDesc, tempImagePath } = this.data;
    
    // 校验数据
    if (!newName.trim() || !tempImagePath) {
      return wx.showToast({ title: '名字和照片都要有哦', icon: 'none' });
    }

    this.setData({ isSubmitting: true }); 
    wx.showLoading({ title: '正在入库...', mask: true });

    try {
      // 1. 上传图片到云存储
      // 定义云端路径：food-photos/时间戳-随机数.jpg
      const cloudPath = `food-photos/${Date.now()}-${Math.floor(Math.random() * 1000)}.jpg`;
      
      const uploadRes = await wx.cloud.uploadFile({
        cloudPath: cloudPath,
        filePath: tempImagePath // 这里用的是经过裁剪和压缩后的临时路径
      });

      // 2. 将数据写入数据库
      await db.collection('recipes').add({
        data: {
          name: newName,
          desc: newDesc || '暂无描述',
          image: uploadRes.fileID, // 存储云文件 ID
          createdAt: db.serverDate() // 使用服务端时间
        }
      });

      // 3. 成功反馈
      wx.showToast({ title: '入库成功！', icon: 'success' });
      
      // 4. 重置状态并关闭弹窗
      this.setData({
        isPopupVisible: false,
        newName: '',
        newDesc: '',
        tempImagePath: ''
      });

      // 5. 刷新列表显示新菜谱
      this.fetchRecipes();

    } catch (err) {
      console.error("入库失败详情:", err);
      wx.showModal({
        title: '入库失败',
        content: err.message || '网络异常，请稍后重试',
        showCancel: false
      });
    } finally {
      this.setData({ isSubmitting: false }); // 务必解锁
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

  onTapRecipe(e) {
    this.setData({
      selectedDish: e.currentTarget.dataset.name,
      showAskPopup: true
    });
    wx.vibrateShort({ type: 'light' }); // 点击卡片轻微震动
  },

  closeAskPopup() {
    this.setData({ showAskPopup: false });
  },

  async notifyEric() {
    const dish = this.data.selectedDish;
    this.closeAskPopup();
    
    wx.showLoading({ title: '正在传达信号...' });

    wx.request({
      url: 'https://api2.pushdeer.com/message/push',
      method: 'POST',
      header: { 'content-type': 'application/x-www-form-urlencoded' },
      data: {
        pushkey: 'PDU39173TM5FrwQfj4wIKWNfeToTdcg30O6e3t81T',
        text: '🍲 有人馋啦！',
        desp: `Wendy 翻看菜谱后盯上了：【${dish}】。准备开火吧！`
      },
      success: () => {
        wx.showToast({ title: '已收到，准备开火！', icon: 'success' });
        wx.vibrateShort({ type: 'medium' });
      },
      fail: () => {
        wx.showToast({ title: '信号飞走了...', icon: 'none' });
      },
      complete: () => {
        wx.hideLoading();
      }
    });
  },

  chooseImage() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath;
  
        // 1. 先进行裁剪 (保证比例)
        wx.cropImage({
          src: tempFilePath,
          aspectRatio: '1:1',
          success: (cropRes) => {
            
            // 2. 关键：对裁剪后的图片进行压缩
            wx.showLoading({ title: '处理中...' });
            wx.compressImage({
              src: cropRes.tempFilePath, // 裁剪后的路径
              quality: 60, // 建议值 75：在保持清晰度和减小体积之间取得完美平衡
              success: (compressRes) => {
                // 最终存入 data 的是压缩后的路径
                this.setData({ tempImagePath: compressRes.tempFilePath });
              },
              fail: (err) => {
                console.error('压缩失败', err);
                // 如果压缩失败，保底使用裁剪后的原图
                this.setData({ tempImagePath: cropRes.tempFilePath });
              },
              complete: () => wx.hideLoading()
            });
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
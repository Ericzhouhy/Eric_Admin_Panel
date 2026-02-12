const db = wx.cloud.database();

Page({
  data: {
    form: {
      title: '',
      desc: '',
      expiryDate: '2026-12-31',
      icon: '🎁',
      color: '#FF9500'
    },
    existingCards: []
  },

  onLoad() {
    this.fetchExistingCards();
  },

  onDateChange(e) {
    this.setData({ 'form.expiryDate': e.detail.value });
  },

  // 监听标题输入
  onTitleInput(e) {
    this.setData({
      'form.title': e.detail.value
    });
  },

  // 监听描述输入
  onDescInput(e) {
    this.setData({
      'form.desc': e.detail.value
    });
  },

  // 监听 Icon 输入
  onIconInput(e) {
    this.setData({
      'form.icon': e.detail.value
    });
  },

  async fetchExistingCards() {
    const res = await db.collection('privileges').where({ isUsed: false }).get();
    this.setData({ existingCards: res.data });
  },

  async submitCard() {
    // 确保从最新的 data 中解构
    const { title, desc, expiryDate, icon } = this.data.form;
    
    // 调试打印：如果这里 icon 还是 🎁，说明 onIconInput 没触发
    console.log('准备提交的 Icon:', icon);

    if (!title.trim() || !desc.trim()) {
      return wx.showToast({ title: '内容不能为空', icon: 'none' });
    }

    wx.showLoading({ title: '正在施法...' });
    
    try {
      await db.collection('privileges').add({
        data: {
          title: title.trim(),
          desc: desc.trim(),
          expiryDate,
          icon: icon || '🎁', // 如果为空则给个保底
          isUsed: false,
          color: this.getRandomColor(),
          createTime: db.serverDate()
        }
      });
      
      wx.hideLoading(); // 必须加上这一行，否则 Toast 会被 Loading 盖住
      wx.showToast({ title: '特权已送达！' });
      wx.vibrateShort(); // 发卡成功给个小震动，更有仪式感

      // 重置表单，恢复默认设置
      this.setData({ 
        'form.title': '', 
        'form.desc': '',
        'form.icon': '🎁', // 重置回默认表情
        'form.expiryDate': '2026-12-31'
      }); 

      this.fetchExistingCards(); 
    } catch (err) {
      wx.hideLoading();
      console.error('增加失败', err);
      wx.showToast({ title: '发送失败', icon: 'none' });
    }
  },

  getRandomColor() {
    const colors = ['#FF9500', '#FF3B30', '#4CD964', '#5AC8FA', '#AF52DE', '#FF2D55'];
    return colors[Math.floor(Math.random() * colors.length)];
  }
})
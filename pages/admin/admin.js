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

  async fetchExistingCards() {
    const res = await db.collection('privileges').where({ isUsed: false }).get();
    this.setData({ existingCards: res.data });
  },

  async submitCard() {
    const { title, desc, expiryDate, icon } = this.data.form;
    if (!title || !desc) {
      return wx.showToast({ title: '填完整哦', icon: 'none' });
    }

    wx.showLoading({ title: '正在施法...' });
    try {
      await db.collection('privileges').add({
        data: {
          title,
          desc,
          expiryDate,
          icon,
          isUsed: false,
          color: this.getRandomColor(),
          createTime: db.serverDate()
        }
      });
      
      wx.showToast({ title: '特权已送达！' });
      this.setData({ 'form.title': '', 'form.desc': '' }); // 清空表单
      this.fetchExistingCards(); // 刷新列表
    } catch (err) {
      wx.showToast({ title: '发送失败', icon: 'none' });
    }
  },

  getRandomColor() {
    const colors = ['#FF9500', '#FF3B30', '#4CD964', '#5AC8FA', '#AF52DE', '#FF2D55'];
    return colors[Math.floor(Math.random() * colors.length)];
  }
})
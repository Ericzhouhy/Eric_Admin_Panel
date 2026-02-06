// pages/privilege/privilege.js
Page({

  /**
   * Page initial data
   */
  data: {
    privileges: [
      { id: 1, title: '小型特权卡', desc: '每周一张，周一更新，解释权在 Eric', icon: '👑', color: '#FF9500', expiryDate: '2026-05-20' },
      { id: 2, title: '小型特权卡', desc: '每周一张，周一更新，解释权在 Eric', icon: '👑', color: '#FF3B30', expiryDate: '2026-02-10' }, 
      { id: 4, title: '吵架和好卡', desc: '无条件和好一次，解释权在 Eric', icon: '😡', color: '#5AC8FA', expiryDate: '2026-02-15' },
      { id: 5, title: '无条件陪同卡', desc: '一切服从 Wendy 指示一整天，解释权在 Eric', icon: '🌹', color: '#FF9500', expiryDate: '2026-02-15' },
      { id: 6, title: '支配 Eric 病假卡', desc: '让 Eric 请一天病假陪 Wendy', icon: '😷', color: '#FF3B30', expiryDate: '2026-09-01' },
      { id: 7, title: '公粮卡', desc: '顾名思义', icon: '🛏', color: '#5AC8FA', expiryDate: '2026-12-31' },
      { id: 7, title: '禁咪卡', desc: '顾名思义', icon: '🔞', color: '#FF3B30', expiryDate: '2026-12-31' }
    ]
  },

  onLoad() {
    this.sortPrivileges();
    this.updatePrivileges();
  },

  updatePrivileges() {
    const startDate = new Date('2026-02-02T00:00:00'); 
    const now = new Date();
    // 获取今天凌晨的时间戳，用于比较是否过期
    const todayStr = this.formatDate(now);
    const todayTime = new Date(todayStr).getTime();

    const msPerWeek = 7 * 24 * 60 * 60 * 1000;
    const weeksPassed = Math.floor((now - startDate) / msPerWeek);
    
    // 使用 concat 替代 ... 解决你之前的 Babel 报错
    let currentList = [].concat(this.data.privileges);
    const colors = ['#FF9500', '#FF3B30', '#4CD964', '#5AC8FA', '#AF52DE', '#FF2D55'];

    // 1. 自动生成每周新卡
    for (let i = 0; i <= weeksPassed; i++) {
      let thisMonday = new Date(startDate.getTime() + i * msPerWeek);
      let dateString = this.formatDate(thisMonday);
      
      const exists = currentList.some(item => item.expiryDate === dateString && item.title === '小型特权卡');
      
      if (!exists) {
        currentList.push({
          id: 'auto_' + i + '_' + Date.now(),
          title: '小型特权卡',
          desc: '每周一张，周一更新，解释权在 Eric',
          icon: '👑',
          color: colors[Math.floor(Math.random() * colors.length)],
          expiryDate: dateString 
        });
      }
    }

    // 2. 【核心修改】过滤掉已过期的卡片
    // 逻辑：卡片的日期必须 >= 今天凌晨
    currentList = currentList.filter(item => {
      const itemTime = new Date(item.expiryDate).getTime();
      return itemTime >= todayTime;
    });

    // 3. 排序：快过期的排前面
    currentList.sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));

    this.setData({
      privileges: currentList
    });
  },

  sortPrivileges() {
    const list = this.data.privileges;
    // 排序逻辑：将日期字符串转为 Date 对象进行比较
    list.sort((a, b) => {
      return new Date(a.expiryDate) - new Date(b.expiryDate);
    });
    
    this.setData({
      privileges: list
    });
  },

  handleTap(e) {
    const { id, title } = e.currentTarget.dataset;
    wx.showModal({
      title: '确认使用',
      content: `是否立即开启【${title}】？`,
      confirmColor: '#07c160'
    });
  },

  /**
   * Lifecycle function--Called when page load
   */
  onLoad(options) {

  },

  /**
   * Lifecycle function--Called when page is initially rendered
   */
  onReady() {

  },

  /**
   * Lifecycle function--Called when page show
   */
  onShow() {

  },

  /**
   * Lifecycle function--Called when page hide
   */
  onHide() {

  },

  /**
   * Lifecycle function--Called when page unload
   */
  onUnload() {

  },

  /**
   * Page event handler function--Called when user drop down
   */
  onPullDownRefresh() {

  },

  /**
   * Called when page reach bottom
   */
  onReachBottom() {

  },

  /**
   * Called when user click on the top right corner to share
   */
  onShareAppMessage() {

  }
})
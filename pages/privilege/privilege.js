Page({
  data: {
    privileges: [
      { id: 1, title: '小型特权卡', desc: '每周一张，周一更新，解释权在 Eric', icon: '👑', color: '#FF9500', expiryDate: '2026-05-20' },
      { id: 2, title: '小型特权卡', desc: '每周一张，周一更新，解释权在 Eric', icon: '👑', color: '#FF3B30', expiryDate: '2026-02-10' }, 
      { id: 4, title: '吵架和好卡', desc: '无条件和好一次，解释权在 Eric', icon: '😡', color: '#5AC8FA', expiryDate: '2026-02-15' },
      { id: 5, title: '无条件陪同卡', desc: '一切服从 Wendy 指示一整天，解释权在 Eric', icon: '🌹', color: '#FF9500', expiryDate: '2026-02-15' },
      { id: 6, title: '支配 Eric 病假卡', desc: '让 Eric 请一天病假陪 Wendy', icon: '😷', color: '#FF3B30', expiryDate: '2026-09-01' },
      { id: 7, title: '公粮卡', desc: '顾名思义', icon: '🛏', color: '#5AC8FA', expiryDate: '2026-12-31' },
      { id: 8, title: '禁咪卡', desc: '顾名思义', icon: '🔞', color: '#FF3B30', expiryDate: '2026-12-31' }
    ]
  },

  // 【修正】只保留一个 onLoad
  onLoad() {
    this.updatePrivileges();
  },

  updatePrivileges() {
    const startDate = new Date('2026-02-02T00:00:00'); 
    const now = new Date();
    const todayStr = this.formatDate(now);
    const todayTime = new Date(todayStr).getTime();

    const msPerWeek = 7 * 24 * 60 * 60 * 1000;
    const weeksPassed = Math.floor((now - startDate) / msPerWeek);
    
    // 使用 concat 避免旧环境下的解构报错
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

    // 2. 过滤过期卡片
    currentList = currentList.filter(item => {
      const itemTime = new Date(item.expiryDate).getTime();
      return itemTime >= todayTime;
    });

    // 3. 【核心修复】排序逻辑
    // 使用 replace(/-/g, '/') 解决部分 iOS 设备的日期解析兼容性问题
    currentList.sort((a, b) => {
      const dateA = new Date(a.expiryDate.replace(/-/g, '/')).getTime();
      const dateB = new Date(b.expiryDate.replace(/-/g, '/')).getTime();
      return dateA - dateB;
    });

    this.setData({
      privileges: currentList
    });
  },

  formatDate(date) {
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${d}`;
  },

  handleTap(e) {
    const { title } = e.currentTarget.dataset;
    wx.showModal({
      title: '确认使用',
      content: `是否立即开启【${title}】？`,
      confirmColor: '#07c160'
    });
  }
})
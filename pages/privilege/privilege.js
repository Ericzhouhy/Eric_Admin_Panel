const db = wx.cloud.database();

Page({
  data: {
    privileges: []
  },

  onLoad() {
    this.syncAllPrivileges();
  },

  async syncAllPrivileges() {
    wx.showLoading({ title: '女王特权同步中...' });
    try {
      // 1. 获取云端所有未使用的卡片（包含你刚录入的那几张）
      const res = await db.collection('privileges').where({
        isUsed: false
      }).get();
      
      let currentList = res.data;

      // 2. 处理自动生成的“每周周卡”逻辑
      const startDate = new Date('2026-02-16T00:00:00'); 
      const now = new Date();
      const todayStr = this.formatDate(now);
      const todayTime = new Date(todayStr).getTime();
      const msPerWeek = 7 * 24 * 60 * 60 * 1000;
      const weeksPassed = Math.floor((now - startDate) / msPerWeek);
      const colors = ['#FF9500', '#FF3B30', '#4CD964', '#5AC8FA', '#AF52DE', '#FF2D55'];

      for (let i = 0; i <= weeksPassed; i++) {
        let thisMonday = new Date(startDate.getTime() + i * msPerWeek);
        let dateString = this.formatDate(thisMonday);
        
        // 判定条件：云端如果没这张日期的周卡，就本地补全显示
        const exists = currentList.some(item => item.expiryDate === dateString && item.title === '小型特权卡');
        
        if (!exists) {
          currentList.push({
            _id: 'auto_' + i, // 临时ID
            title: '小型特权卡',
            desc: '每周一张，周一更新，解释权在 Eric',
            icon: '👑',
            color: colors[i % colors.length],
            expiryDate: dateString,
            isUsed: false
          });
        }
      }

      // 3. 统一过滤过期卡片
      currentList = currentList.filter(item => {
        const itemTime = new Date(item.expiryDate.replace(/-/g, '/')).getTime();
        return itemTime >= todayTime;
      });

      // 4. 排序：快过期的排在最前面
      currentList.sort((a, b) => {
        return new Date(a.expiryDate.replace(/-/g, '/')) - new Date(b.expiryDate.replace(/-/g, '/'));
      });

      this.setData({ privileges: currentList });

    } catch (err) {
      console.error('同步失败', err);
    } finally {
      wx.hideLoading();
    }
  },

  // 格式化日期辅助函数
  formatDate(date) {
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${d}`;
  },

  handleTap(e) {
    const { title } = e.currentTarget.dataset;

    wx.showModal({
      title: '确认行使特权？',
      content: `亲爱的 Wendy，确定要使用【${title}】吗？一旦点击“确定”，此特权即视为已消耗哦。`,
      confirmColor: '#FF3B30',
      success: (res) => {
        if (res.confirm) {
          this.usePrivilege(title);
        }
      }
    });
  },

  usePrivilege(title) {
    wx.showLoading({ title: '正在生效中...' });
    
    // 这里建议以后可以加上更新数据库 isUsed 状态的逻辑
    setTimeout(() => {
      wx.hideLoading();
      wx.showToast({
        title: '特权已开启！',
        icon: 'success',
        duration: 2000
      });
    }, 800);
  }
})
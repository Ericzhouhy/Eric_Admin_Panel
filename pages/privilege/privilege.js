const db = wx.cloud.database();

Page({
  data: {
    privileges: [],
    showServicePicker: false, // 控制弹窗显示
    tempIndex: null, // 临时记录点击的是哪张卡
    serviceOptions: [
      { name: '按摩', icon: '💆‍♀️', color: '#FF9500' },
      { name: '捏脚', icon: '👣', color: '#FF3B30' },
      { name: '吹头发', icon: '💨', color: '#5AC8FA' },
      { name: '掏耳朵', icon: '👂', color: '#AF52DE' },
      { name: '做饭&洗碗', icon: '🍲', color: '#4CD964' }
    ]
  },

  onLoad() {
    this.syncAllPrivileges();
  },

  async onPullDownRefresh() {
    await this.syncAllPrivileges();
    wx.stopPullDownRefresh(); // 记得停止，不然那个水滴头会一直转
    wx.vibrateShort(); // 拉完震动一下，手感极佳
  },

  async syncAllPrivileges() {
    wx.showLoading({ title: '女王特权同步中...' });
    try {
      // 1. 获取云端所有卡片（不再加 isUsed: false 限制，为了后续判定周卡是否已用）
      const res = await db.collection('privileges').get();
      const allCards = res.data;
      
      // 2. 筛选出【真正未使用的卡】作为初始显示列表
      let displayList = allCards.filter(item => item.isUsed === false);

      // 3. 处理自动生成的“每周周卡”逻辑
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
        
        // 【核心修改】：在所有卡片（allCards）里找，只要这张周卡在数据库里（管它用没用过），就不再重复生成
        const existsInCloud = allCards.some(item => 
          item.expiryDate === dateString && item.title === '小型特权卡'
        );
        
        if (!existsInCloud) {
          displayList.push({
            _id: 'auto_' + i, 
            title: '小型特权卡',
            desc: '每周一张，周一更新，解释权在 Eric',
            icon: '👑',
            color: colors[i % colors.length],
            expiryDate: dateString,
            isUsed: false
          });
        }
      }

      // 4. 统一过滤过期卡片（只看还没过期的）
      displayList = displayList.filter(item => {
        const itemTime = new Date(item.expiryDate.replace(/-/g, '/')).getTime();
        return itemTime >= todayTime;
      });

      // 5. 排序：快过期的排在最前面
      displayList.sort((a, b) => {
        return new Date(a.expiryDate.replace(/-/g, '/')) - new Date(b.expiryDate.replace(/-/g, '/'));
      });

      this.setData({ privileges: displayList });

    } catch (err) {
      console.error('同步失败', err);
    } finally {
      wx.hideLoading();
    }
  },

  showCustomInput(index) {
    wx.showModal({
      title: '想要 Eric 做什么？',
      editable: true,
      placeholderText: '在此输入你的愿望...',
      success: (res) => {
        if (res.confirm && res.content) {
          this.confirmUse(index, res.content);
        }
      }
    });
  },
  
  confirmUse(index, serviceName) {
    wx.showModal({
      title: '女王指令确认',
      content: `已选择：${serviceName}。确定立刻执行吗？`,
      confirmColor: '#FF3B30',
      success: (res) => {
        if (res.confirm) {
          // 把服务名字和索引传过去
          this.usePrivilege(index, serviceName);
        }
      }
    });
  },

  // 格式化日期辅助函数
  formatDate(date) {
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${d}`;
  },

  handleTap(e) {
    const { title, index } = e.currentTarget.dataset;
    
    if (title === '小型特权卡') {
      this.setData({ 
        showServicePicker: true,
        tempIndex: index 
      });
    } else {
      wx.showModal({
        title: '确认行使特权？',
        content: `亲爱的 Wendy，确定要使用【${title}】吗？`,
        confirmColor: '#FF3B30',
        success: (res) => {
          if (res.confirm) this.usePrivilege(index);
        }
      });
    }
  },

  async usePrivilege(index, serviceName = '') {
    wx.showLoading({ title: '正在施法...' });

    // 直接通过 index 锁定那条数据对象
    const cardRecord = this.data.privileges[index];
    
    if (!cardRecord) return;
  
    try {
      if (cardRecord._id && cardRecord._id.startsWith('auto_')) {
        // 自动周卡逻辑
        await db.collection('privileges').add({
          data: {
            title: '小型特权卡',
            desc: `女王选择了服务：${serviceName || '神秘特权'}`,
            isUsed: true,
            expiryDate: cardRecord.expiryDate,
            useTime: db.serverDate()
          }
        });
      } else {
        // 普通卡逻辑：直接用 _id 更新，绝对精准
        await db.collection('privileges').doc(cardRecord._id).update({
          data: {
            isUsed: true,
            useTime: db.serverDate()
          }
        });
      }
      
      this.sendNotificationToEric(cardRecord.title, serviceName);
      wx.vibrateShort({ type: 'medium' });
      wx.hideLoading();
      wx.showToast({ title: 'Eric 已领旨！' });
      
      setTimeout(() => {
        this.syncAllPrivileges(); 
      }, 500);
  
    } catch (err) {
      wx.hideLoading();
      console.error('更新失败:', err);
      wx.showModal({ title: '施法失败', content: '请联系 Eric', showCancel: false });
    }
  },

  selectService(e) {
    const { name } = e.currentTarget.dataset;
    this.setData({ showServicePicker: false });

    if (name === '其他...') {
      this.showCustomInput(this.data.tempIndex);
    } else {
      this.confirmUse(this.data.tempIndex, name);
    }
  },

  closePicker() {
    this.setData({ showServicePicker: false });
  },

  sendNotificationToEric(title, service) {
    const content = service ? `女王选择了：${service}` : `使用了：${title}`;
    
    wx.request({
      url: 'https://api2.pushdeer.com/message/push',
      method: 'POST', // 改为 POST
      header: {
        'content-type': 'application/x-www-form-urlencoded'
      },
      data: {
        pushkey: 'PDU39173TM5FrwQfj4wIKWNfeToTdcg30O6e3t81T', 
        text: '👑 女王行使特权啦！',
        desp: content
      }
    });
  }
})
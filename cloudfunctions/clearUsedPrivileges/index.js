// 云函数 index.js
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  try {
    // 删除所有 isUsed 为 true 的记录
    const result = await db.collection('privileges').where({
      isUsed: true
    }).remove()
    
    return {
      success: true,
      deletedCount: result.stats.removed,
      message: `成功清理了 ${result.stats.removed} 条已使用特权`
    }
  } catch (err) {
    return {
      success: false,
      error: err
    }
  }
}
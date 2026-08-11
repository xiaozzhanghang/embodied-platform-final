const STATUS_SEMANTICS = Object.freeze({
  '进行中': 'processing',
  '采集中': 'processing',
  '处理中': 'processing',
  '标注中': 'processing',
  '标注审核中': 'processing',
  '校验中': 'processing',
  '质检中': 'processing',
  '审核中': 'processing',
  '可领取': 'processing',

  '待采集': 'warning',
  '待分配': 'warning',
  '待处理': 'warning',
  '待审核': 'warning',
  '待质检': 'warning',
  '待校验': 'warning',
  '待标注': 'warning',
  '即将完成': 'warning',
  '待结算': 'warning',
  '维护中': 'warning',

  '完成': 'success',
  '已完成': 'success',
  '通过': 'success',
  '已通过': 'success',
  '已标注': 'success',
  '已结算': 'success',
  '机检通过': 'success',
  '已发布': 'success',
  '正常运行': 'success',
  '在线': 'success',
  '正常': 'success',
  '已连接': 'success',

  '失败': 'error',
  '驳回': 'error',
  '未通过': 'error',
  '离线': 'error',

  '取消': 'default',
  '已取消': 'default',
  '暂停': 'default',
  '未开始': 'default',
  '停用': 'default',
  '已领满': 'default',
});

export function resolveStatusSemantic(status) {
  return STATUS_SEMANTICS[status] || 'default';
}

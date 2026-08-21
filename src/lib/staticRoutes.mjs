export const STATIC_ROUTES = Object.freeze({
  auditDetail: '/annotation/audit/detail',
  auditWorkbench: '/annotation/audit/workbench',
  annotationEditor: '/annotation/editor',
  collectDetail: '/collection/collect/detail',
  collectConnection: '/collection/collect/connection',
  collectData: '/collection/collect/data',
  collectStatus: '/collection/collect/status',
  collectVideo: '/collection/collect/video',
  collectWorkspace: '/collection/collect/workspace',
  configDetail: '/collection/config/detail',
  deviceTypeDetail: '/collection/device-types/detail',
  devicePartDetail: '/collection/device-types/part-detail',
  deviceDetail: '/collection/devices/detail',
  qaDetail: '/collection/qa/detail',
  qaReview: '/collection/qa/review',
  taskbookDetail: '/collection/taskbooks/detail',
  taskDetail: '/collection/tasks/detail',
  templateDetail: '/collection/templates/detail',
});

export function buildStaticHref(path, params = {}) {
  if (typeof path !== 'string' || path.length === 0) {
    throw new TypeError('buildStaticHref requires a non-empty path');
  }

  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      search.set(key, String(value));
    }
  }

  const query = search.toString();
  return query ? `${path}?${query}` : path;
}

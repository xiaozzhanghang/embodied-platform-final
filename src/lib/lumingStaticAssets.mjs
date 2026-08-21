const BASE = '/demo/session_028';

export const LUMING_STATIC_ASSETS = Object.freeze({
  report: `${BASE}/quality-report.json`,
  trajectoryLeft: `${BASE}/trajectory-left.json`,
  trajectoryRight: `${BASE}/trajectory-right.json`,
  checkLog: `${BASE}/check.log`,
  reportText: `${BASE}/quality-report.txt`,
  timestampsLeft: `${BASE}/timestamps-left.csv`,
  timestampsRight: `${BASE}/timestamps-right.csv`,
  queueLeft: `${BASE}/queue-left.csv`,
  queueRight: `${BASE}/queue-right.csv`,
  transformsLeftToRight: `${BASE}/transforms-left-to-right.txt`,
  transformsRightToLeft: `${BASE}/transforms-right-to-left.txt`,
});

export function getLumingStaticAsset(key) {
  const url = LUMING_STATIC_ASSETS[key];
  if (!url) throw new Error(`Unknown Luming static asset: ${key}`);
  return url;
}

export function filterEpisodes(episodes, filters = {}) {
  const {
    sourceType = 'all',
    scene,
    subScene,
    keyword,
  } = filters;
  const normalizedKeyword = String(keyword || '').trim().toLowerCase();

  return episodes.filter((item) => {
    if (sourceType !== 'all' && item.sourceType !== sourceType) return false;
    if (scene && item.scene !== scene) return false;
    if (subScene && item.subScene !== subScene) return false;
    if (!normalizedKeyword) return true;

    return [item.id, item.sourceName, item.scene, item.subScene]
      .some(value => String(value || '').toLowerCase().includes(normalizedKeyword));
  });
}

export function summarizeReadyPool(episodes) {
  return episodes.reduce((summary, item) => {
    summary.total += 1;
    if (Object.hasOwn(summary, item.sourceType)) {
      summary[item.sourceType] += 1;
    }
    return summary;
  }, {
    total: 0,
    collection: 0,
    asset: 0,
    simulation: 0,
  });
}

export function canPublishTask({ name, annotationType, selectedEpisodeIds }) {
  return Boolean(
    String(name || '').trim()
    && annotationType
    && Array.isArray(selectedEpisodeIds)
    && selectedEpisodeIds.length > 0,
  );
}

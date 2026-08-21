export default function StaticVideoPlaceholder({ label = '采集视频' }) {
  return (
    <div style={{ position: 'relative', minHeight: 240, display: 'grid', placeItems: 'center', overflow: 'hidden', borderRadius: 8, background: '#090d16' }}>
      <img
        src="/assets/robot_view.png"
        alt={`${label}静态演示占位`}
        style={{ width: '100%', height: '100%', objectFit: 'contain', opacity: 0.48 }}
      />
      <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', padding: 24, color: '#dbeafe', textAlign: 'center', background: 'linear-gradient(180deg, rgba(9,13,22,0.15), rgba(9,13,22,0.72))' }}>
        <div>
          <div style={{ fontWeight: 700 }}>{label}</div>
          <div style={{ marginTop: 8, fontSize: 12 }}>静态包未包含真实采集视频</div>
        </div>
      </div>
    </div>
  );
}

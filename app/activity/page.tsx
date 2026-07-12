import { FeatureShell } from "../../components/FeatureShell";

export default function ActivityPage() {
  return (
    <FeatureShell title="Activity log">
      <section className="feature-panel">
        <p className="eyebrow accent">Audit trail</p>
        <h2>Activity log</h2>
        <p>Review assignments, approvals, bookings, transfers, and maintenance updates across AssetFlow.</p>
      </section>
    </FeatureShell>
  );
}

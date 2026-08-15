export function ScoreGauge({ value, label }: { value: number; label: string }) {
  const rounded = Math.round(value);
  return (
    <div className="score-gauge" style={{ '--score': rounded } as React.CSSProperties}>
      <div className="score-value">{rounded}</div>
      <div className="score-label">{label}</div>
    </div>
  );
}

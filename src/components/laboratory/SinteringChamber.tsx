type SinteringChamberProps = {
  heating: boolean;
  progress: number;
};

export function SinteringChamber({ heating, progress }: SinteringChamberProps) {
  return (
    <div className={`sintering-chamber${heating ? ' is-heating' : ''}`} aria-label="Sintering heating zone">
      <span className="heating-coil" />
      <span className="chamber-edge" />
      <span className="heat-progress-track"><span style={{ transform: `scaleX(${progress / 100})` }} /></span>
    </div>
  );
}

type SeparationResultProps = {
  oreCount: number;
  impurityCount: number;
};

export function SeparationResult({ oreCount, impurityCount }: SeparationResultProps) {
  return (
    <div className="separation-result" aria-label="Before and after concentration">
      <div className="separation-result-state">
        <span className="eyebrow">Before</span>
        <div className="separation-result-mixed">
          {Array.from({ length: oreCount }, (_, index) => <i key={`ore-${index}`} className="result-particle result-particle--ore" />)}
          {Array.from({ length: impurityCount }, (_, index) => <i key={`impurity-${index}`} className="result-particle result-particle--impurity" />)}
        </div>
        <small>Mixed ore + impurities</small>
      </div>
      <span className="separation-result-arrow" aria-hidden="true">→</span>
      <div className="separation-result-state">
        <span className="eyebrow">After</span>
        <div className="separation-result-fractions">
          <div className="separation-result-concentrate">{Array.from({ length: oreCount }, (_, index) => <i key={index} className="result-particle result-particle--ore" />)}</div>
          <div className="separation-result-impurities">{Array.from({ length: impurityCount }, (_, index) => <i key={index} className="result-particle result-particle--impurity" />)}</div>
        </div>
        <small>Concentrated ore + removed impurities</small>
      </div>
    </div>
  );
}

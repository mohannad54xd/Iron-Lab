type HeatingControlProps = {
  active: boolean;
  enabled: boolean;
  complete: boolean;
  onStart: () => void;
};

export function HeatingControl({ active, enabled, complete, onStart }: HeatingControlProps) {
  return (
    <div className={`sintering-control${active ? ' is-active' : ''}`}>
      <span className="control-lamp" aria-hidden="true" />
      <button type="button" onClick={onStart} disabled={!enabled || active || complete} className={`sintering-start-control${active ? ' is-working' : ''}${complete ? ' is-complete' : ''}`} data-lab-sound="furnace-ignite">
        {complete ? 'SINTERING COMPLETE' : active ? 'SINTERING IN PROGRESS' : 'START SINTERING'}
      </button>
    </div>
  );
}

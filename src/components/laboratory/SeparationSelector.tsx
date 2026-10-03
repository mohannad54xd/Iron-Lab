import type { SeparationMethod, SeparationMethodId } from '../../types/concentration';

type SeparationSelectorProps = {
  methods: SeparationMethod[];
  selectedMethod: SeparationMethodId | null;
  disabled: boolean;
  onSelect: (method: SeparationMethod) => void;
};

function EquipmentGlyph({ id }: { id: SeparationMethodId }) {
  if (id === 'magnetic') {
    return <span className="equipment-glyph equipment-glyph--magnet"><i /><b /><em /></span>;
  }
  if (id === 'electric') {
    return <span className="equipment-glyph equipment-glyph--electric"><i /><b /><em /></span>;
  }
  return <span className="equipment-glyph equipment-glyph--surface"><i /><b /><em /></span>;
}

export function SeparationSelector({ methods, selectedMethod, disabled, onSelect }: SeparationSelectorProps) {
  return (
    <div className="separation-equipment-rack" aria-label="Choose a separation apparatus">
      {methods.map((method) => (
        <button
          key={method.id}
          type="button"
          className={`separation-equipment${selectedMethod === method.id ? ' is-selected' : ''}`}
          data-lab-sound={`separator-${method.id === 'surface-tension' ? 'surface' : method.id}`}
          onClick={() => onSelect(method)}
          disabled={disabled}
          aria-pressed={selectedMethod === method.id}
        >
          <EquipmentGlyph id={method.id} />
          <span>{method.name}</span>
        </button>
      ))}
    </div>
  );
}

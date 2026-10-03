export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function formatMass(value: number, unit = 'g') {
  return `${value.toFixed(1)} ${unit}`;
}

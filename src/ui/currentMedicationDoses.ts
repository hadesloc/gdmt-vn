import type { Dose, DrugEntry } from '../kb-types';

/** Choices describe recorded regimens from KB, never an inferred patient dose. */
export function getRecordedDoseChoices(entry: DrugEntry): Dose[] {
  const choices: Dose[] = [];
  const add = (value: Dose | string | undefined) => {
    if (!value || typeof value === 'string' || !/^\d+(?:\.\d+)?(?:\/\d+(?:\.\d+)?)?$/.test(String(value.amount))) return;
    if (!choices.some((c) => String(c.amount) === String(value.amount) && c.unit === value.unit && c.frequency === value.frequency)) choices.push(value);
  };
  add(entry.start); add(entry.target);
  if (typeof entry.start === 'object' && typeof entry.target === 'object' &&
      entry.start.unit === entry.target.unit && entry.start.frequency === entry.target.frequency && typeof entry.titration?.step === 'string') {
    const chain = entry.titration?.step.match(/((?:\d+(?:\.\d+)?(?:\/\d+(?:\.\d+)?)?\s*(?:->|→)\s*)+\d+(?:\.\d+)?(?:\/\d+(?:\.\d+)?)?)\s*(mg|mcg|µg|g|UI)\b/);
    if (chain && chain[2] === entry.start.unit) {
      for (const amount of chain[1].split(/\s*(?:->|→)\s*/)) add({ ...entry.start, amount });
    }
  }
  return choices.sort((a, b) => parseFloat(String(a.amount)) - parseFloat(String(b.amount)));
}

import type { FormEvent } from 'react';
import { FieldError } from './FieldError';

interface Props {
  value: string; error?: string; disabled: boolean; isRefining: boolean;
  onChange: (value: string) => void; onSubmit: () => void;
}

const suggestions = ['Make it shorter', 'Add more urgency', 'Make it warmer'];

export function RefinementBox({ value, error, disabled, isRefining, onChange, onSubmit }: Props) {
  const submit = (event: FormEvent) => { event.preventDefault(); onSubmit(); };
  return (
    <form className="refinement" onSubmit={submit}>
      <div className="refinement-heading"><div><span className="spark" aria-hidden="true">✦</span><h3>Refine this draft</h3></div><span>{value.length} / 500</span></div>
      <label className="sr-only" htmlFor="refinementInstruction">Refinement instruction</label>
      <textarea id="refinementInstruction" value={value} onChange={(event) => onChange(event.target.value)} maxLength={500} rows={3}
        placeholder="e.g. Make it warmer and add a clearer call to action" disabled={disabled || isRefining}
        aria-invalid={Boolean(error)} aria-describedby={error ? 'refinement-error' : undefined} />
      <FieldError id="refinement-error" message={error} />
      <div className="suggestion-row" aria-label="Refinement suggestions">
        {suggestions.map((suggestion) => <button type="button" key={suggestion} onClick={() => onChange(suggestion)} disabled={disabled || isRefining}>{suggestion}</button>)}
      </div>
      <button className="secondary-button" type="submit" disabled={disabled || isRefining}>
        {isRefining ? <><span className="spinner dark" aria-hidden="true" />Refining…</> : 'Refine email'}
      </button>
    </form>
  );
}

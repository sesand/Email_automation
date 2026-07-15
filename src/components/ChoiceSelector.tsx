interface Props<T extends string> {
  label: string;
  name: string;
  value: T;
  options: readonly T[];
  descriptions: Record<T, string>;
  onChange: (value: T) => void;
  error?: string;
}

export function ChoiceSelector<T extends string>({ label, name, value, options, descriptions, onChange, error }: Props<T>) {
  return (
    <fieldset className="field-group choice-fieldset" aria-describedby={error ? `${name}-error` : undefined}>
      <legend>{label}</legend>
      <div className="choice-grid">
        {options.map((option) => (
          <label className="choice-card" key={option}>
            <input type="radio" name={name} value={option} checked={value === option} onChange={() => onChange(option)} />
            <span><strong>{option}</strong><small>{descriptions[option]}</small></span>
          </label>
        ))}
      </div>
      {error && <p className="field-error" id={`${name}-error`} role="alert">{error}</p>}
    </fieldset>
  );
}

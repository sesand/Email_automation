import type { ChangeEvent, FormEvent } from 'react';
import { templates } from '../data/templates';
import { LENGTHS, TONES, type EmailFormValues, type FieldErrors } from '../types/email';
import { ChoiceSelector } from './ChoiceSelector';
import { FieldError } from './FieldError';
import { TemplateSelector } from './TemplateSelector';

interface Props {
  values: EmailFormValues;
  errors: FieldErrors;
  isGenerating: boolean;
  hasContent: boolean;
  onChange: (values: EmailFormValues) => void;
  onSubmit: () => void;
  onClear: () => void;
}

const toneDescriptions = {
  Professional: 'Polished & direct', Friendly: 'Warm & approachable', Formal: 'Structured & reserved', Assertive: 'Firm & action-led',
};
const lengthDescriptions = {
  Concise: '3–4 short lines', Standard: '2–4 paragraphs', Detailed: '4–6 paragraphs',
};

export function EmailForm({ values, errors, isGenerating, hasContent, onChange, onSubmit, onClear }: Props) {
  const update = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    onChange({ ...values, [event.target.name]: event.target.value, templateId: event.target.name === 'templateId' ? event.target.value : values.templateId });
  };
  const chooseTemplate = (id: string) => {
    const template = templates.find((item) => item.templateId === id);
    if (!template) return;
    onChange({
      ...values,
      templateId: id,
      purpose: template.purpose,
      keyPoints: template.keyPoints,
      tone: template.tone,
      length: template.length,
    });
  };
  const submit = (event: FormEvent) => { event.preventDefault(); onSubmit(); };

  return (
    <form className="panel form-panel" onSubmit={submit} noValidate>
      <div className="panel-heading">
        <div><span className="step">01</span><h2>Email details</h2></div>
        <p>Give the essentials. The draft will stay faithful to them.</p>
      </div>

      <TemplateSelector selectedId={values.templateId} onSelect={chooseTemplate} />

      <div className="form-grid">
        <div className="field-group full-width">
          <label htmlFor="purpose">Email purpose <span aria-hidden="true">*</span></label>
          <input id="purpose" name="purpose" value={values.purpose} onChange={update} maxLength={200}
            placeholder="e.g. Schedule a technical interview" aria-invalid={Boolean(errors.purpose)} aria-describedby={errors.purpose ? 'purpose-error' : 'purpose-help'} />
          <p className="field-help" id="purpose-help">What should this email accomplish?</p>
          <FieldError id="purpose-error" message={errors.purpose} />
        </div>

        <div className="field-group">
          <label htmlFor="recipientName">Recipient name <span aria-hidden="true">*</span></label>
          <input id="recipientName" name="recipientName" value={values.recipientName} onChange={update} maxLength={100}
            placeholder="e.g. Rahul Sharma" aria-invalid={Boolean(errors.recipientName)} aria-describedby={errors.recipientName ? 'recipientName-error' : undefined} />
          <FieldError id="recipientName-error" message={errors.recipientName} />
        </div>

        <div className="field-group">
          <label htmlFor="recipientDesignation">Designation <span className="optional">Optional</span></label>
          <input id="recipientDesignation" name="recipientDesignation" value={values.recipientDesignation} onChange={update} maxLength={120}
            placeholder="e.g. Senior Developer" aria-invalid={Boolean(errors.recipientDesignation)} aria-describedby={errors.recipientDesignation ? 'recipientDesignation-error' : undefined} />
          <FieldError id="recipientDesignation-error" message={errors.recipientDesignation} />
        </div>

        <div className="field-group full-width">
          <div className="label-row"><label htmlFor="keyPoints">Key points <span aria-hidden="true">*</span></label><span>{values.keyPoints.length} / 2,000</span></div>
          <textarea id="keyPoints" name="keyPoints" value={values.keyPoints} onChange={update} maxLength={2_000} rows={7}
            placeholder={'Add one detail per line:\nInterview on Monday\n11:00 AM via Microsoft Teams\nLink will follow'} aria-invalid={Boolean(errors.keyPoints)} aria-describedby={errors.keyPoints ? 'keyPoints-error' : 'keyPoints-help'} />
          <p className="field-help" id="keyPoints-help">Bullet points or plain text both work. More detail creates a stronger draft.</p>
          <FieldError id="keyPoints-error" message={errors.keyPoints} />
        </div>
      </div>

      <ChoiceSelector label="Tone" name="tone" value={values.tone} options={TONES} descriptions={toneDescriptions}
        onChange={(tone) => onChange({ ...values, tone })} error={errors.tone} />
      <ChoiceSelector label="Email length" name="length" value={values.length} options={LENGTHS} descriptions={lengthDescriptions}
        onChange={(length) => onChange({ ...values, length })} error={errors.length} />

      <div className="form-actions">
        <button className="primary-button" type="submit" disabled={isGenerating}>
          {isGenerating ? <><span className="spinner" aria-hidden="true" />Generating email…</> : <>Generate email <span aria-hidden="true">→</span></>}
        </button>
        <button className="text-button" type="button" onClick={onClear} disabled={!hasContent || isGenerating}>Start over</button>
      </div>
    </form>
  );
}

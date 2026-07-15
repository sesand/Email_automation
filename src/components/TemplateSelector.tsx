import { templates } from '../data/templates';

interface Props { selectedId: string; onSelect: (templateId: string) => void }

export function TemplateSelector({ selectedId, onSelect }: Props) {
  return (
    <fieldset className="field-group template-fieldset">
      <legend>Start with a template <span className="optional">Optional</span></legend>
      <div className="template-grid">
        {templates.map((template) => (
          <button
            aria-pressed={selectedId === template.templateId}
            className="template-card"
            key={template.templateId}
            onClick={() => onSelect(template.templateId)}
            type="button"
          >
            <span>{template.name}</span>
            <small>{template.description}</small>
          </button>
        ))}
      </div>
    </fieldset>
  );
}

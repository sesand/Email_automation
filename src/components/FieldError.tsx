interface Props { id: string; message?: string }

export function FieldError({ id, message }: Props) {
  if (!message) return null;
  return <p className="field-error" id={id} role="alert">{message}</p>;
}

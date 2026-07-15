interface Props { label: string; onCopy: () => Promise<void>; copied: boolean; disabled?: boolean }

export function CopyButton({ label, onCopy, copied, disabled }: Props) {
  return (
    <button className="copy-button" type="button" onClick={() => void onCopy()} disabled={disabled}>
      <span aria-hidden="true">{copied ? '✓' : '⧉'}</span> {copied ? 'Copied' : label}
    </button>
  );
}

import type { GeneratedEmail } from '../types/email';
import { CopyButton } from './CopyButton';
import { RefinementBox } from './RefinementBox';

interface Props {
  email: GeneratedEmail | null; isGenerating: boolean; isRefining: boolean; error: string | null;
  refinement: string; refinementError?: string; copied: string | null;
  onEmailChange: (email: GeneratedEmail) => void; onCopy: (kind: 'subject' | 'body' | 'full') => Promise<void>;
  onRefinementChange: (value: string) => void; onRefine: () => void; onRetry: () => void;
}

export function EmailOutput(props: Props) {
  const { email, isGenerating, isRefining, error, refinement, refinementError, copied, onEmailChange, onCopy, onRefinementChange, onRefine, onRetry } = props;
  return (
    <section className="panel output-panel" aria-labelledby="output-heading">
      <div className="panel-heading output-heading">
        <div><span className="step">02</span><h2 id="output-heading">Your draft</h2></div>
        <span className={`status-pill ${email ? 'ready' : ''}`}><i aria-hidden="true" />{email ? 'Ready to edit' : 'Waiting for details'}</span>
      </div>

      <div className="output-content" aria-busy={isGenerating || isRefining}>
        {error && <div className="alert" role="alert"><div><strong>We hit a snag</strong><p>{error}</p></div><button type="button" onClick={onRetry}>Try again</button></div>}

        {!email && !isGenerating && (
          <div className="empty-state">
            <div className="empty-icon" aria-hidden="true"><span>✦</span></div>
            <h3>A polished email will appear here</h3>
            <p>Complete the details on the left, choose a tone and length, then generate your draft.</p>
            <div className="quality-list"><span>✓ Uses every key point</span><span>✓ Never invents details</span><span>✓ Ready to edit and copy</span></div>
          </div>
        )}

        {!email && isGenerating && (
          <div className="draft-skeleton" aria-live="polite"><span className="spinner large" aria-hidden="true" /><h3>Writing your email…</h3><p>Turning your notes into a clear, recruiter-ready draft.</p><div /><div /><div /></div>
        )}

        {email && (
          <div className={`generated-email ${isRefining ? 'is-refining' : ''}`}>
            {isRefining && <div className="refining-overlay" aria-live="polite"><span className="spinner dark" aria-hidden="true" />Refining while keeping your current draft visible…</div>}
            <div className="output-field">
              <div className="output-label"><label htmlFor="generated-subject">Subject</label><CopyButton label="Copy subject" copied={copied === 'subject'} onCopy={() => onCopy('subject')} /></div>
              <input id="generated-subject" value={email.subject} maxLength={300} onChange={(event) => onEmailChange({ ...email, subject: event.target.value })} />
            </div>
            <div className="output-field body-field">
              <div className="output-label"><label htmlFor="generated-body">Email body</label><CopyButton label="Copy body" copied={copied === 'body'} onCopy={() => onCopy('body')} /></div>
              <textarea id="generated-body" value={email.body} onChange={(event) => onEmailChange({ ...email, body: event.target.value })} rows={16} maxLength={10_000} />
              <div className="output-meta"><span>{email.body.trim().split(/\s+/).filter(Boolean).length} words</span><span>Editable draft</span></div>
            </div>
            <CopyButton label="Copy full email" copied={copied === 'full'} onCopy={() => onCopy('full')} />
            <RefinementBox value={refinement} error={refinementError} disabled={!email} isRefining={isRefining} onChange={onRefinementChange} onSubmit={onRefine} />
          </div>
        )}
      </div>
      <p className="sr-only" aria-live="polite">{copied ? `${copied} copied successfully` : ''}{isGenerating ? 'Generating email' : ''}{isRefining ? 'Refining email' : ''}</p>
    </section>
  );
}

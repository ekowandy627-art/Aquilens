export type TutorialStep = {
  id: string;
  stepNumber?: number;
  step_number?: number;
  title: string;
  description?: string;
  responsibleRole?: string;
  responsible_role?: string;
  inputs?: string;
  outputs?: string;
  stepType?: string;
  step_type?: string;
  evidenceRequired?: boolean;
  evidence_required?: boolean;
};

type ProcessTutorialProps = {
  processName: string;
  versionLabel?: string;
  effectiveDate?: string;
  purpose?: string;
  steps: TutorialStep[];
};

function stepNumber(step: TutorialStep) {
  return step.stepNumber ?? step.step_number;
}

function responsibleRole(step: TutorialStep) {
  return step.responsibleRole ?? step.responsible_role;
}

export function ProcessTutorial({
  processName,
  versionLabel,
  effectiveDate,
  purpose,
  steps,
}: ProcessTutorialProps) {
  return (
    <article className="rounded-lg border border-border bg-white" data-testid="process-tutorial">
      <header className="border-b border-border px-6 py-5">
        <p className="text-xs font-medium uppercase tracking-wide text-brand-teal">
          Procedure tutorial
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-950">{processName}</h1>
        <p className="mt-2 text-sm text-text-muted">
          {versionLabel ? `Version ${versionLabel}` : "Published version"}
          {effectiveDate ? ` · Effective ${effectiveDate}` : ""}
        </p>
        {purpose ? (
          <p className="mt-3 text-sm leading-6 text-slate-700">{purpose}</p>
        ) : null}
      </header>

      <ol className="divide-y divide-border">
        {steps.map((step) => {
          const number = stepNumber(step);
          const role = responsibleRole(step);
          const evidenceRequired = step.evidenceRequired ?? step.evidence_required;

          return (
            <li key={step.id} className="px-6 py-5">
              <div className="flex items-start gap-4">
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-teal-50 text-sm font-semibold text-brand-teal">
                  {number ?? "•"}
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="text-base font-semibold text-slate-950">{step.title}</h2>
                  {step.description ? (
                    <p className="mt-2 text-sm leading-6 text-slate-700">{step.description}</p>
                  ) : null}
                  <dl className="mt-3 grid gap-2 text-xs text-text-muted sm:grid-cols-2">
                    {role ? (
                      <div>
                        <dt className="font-medium text-slate-700">Responsible role</dt>
                        <dd>{role}</dd>
                      </div>
                    ) : null}
                    {step.inputs ? (
                      <div>
                        <dt className="font-medium text-slate-700">Inputs</dt>
                        <dd>{step.inputs}</dd>
                      </div>
                    ) : null}
                    {step.outputs ? (
                      <div>
                        <dt className="font-medium text-slate-700">Outputs</dt>
                        <dd>{step.outputs}</dd>
                      </div>
                    ) : null}
                    {evidenceRequired ? (
                      <div>
                        <dt className="font-medium text-slate-700">Evidence</dt>
                        <dd>Required when logging compliance</dd>
                      </div>
                    ) : null}
                  </dl>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </article>
  );
}

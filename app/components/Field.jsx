import {useId} from 'react';

/**
 * A labelled text input with an error slot.
 *
 * The visible label is the placeholder — the design keeps the form to eight
 * fields by leaning on placeholders — but a real <label> is always rendered
 * for screen readers, because a placeholder disappears the moment you type.
 *
 * @param {{
 *   label: string,
 *   name: string,
 *   error?: string|null,
 *   hint?: string,
 *   className?: string,
 *   [key: string]: any,
 * }} props
 */
export function Field({
  label,
  name,
  error = null,
  hint,
  id: providedId,
  className = '',
  ...rest
}) {
  // An explicit id lets an error summary link straight to the field, while
  // keeping the label association intact.
  const generatedId = useId();
  const id = providedId ?? generatedId;
  const errorId = `${id}-error`;

  return (
    <div className={`field ${className}`}>
      <label className="sr-only" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        name={name}
        className="field__input"
        placeholder={label}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? errorId : undefined}
        {...rest}
      />
      {error ? (
        <p className="field__error" id={errorId}>
          {error}
        </p>
      ) : null}
      {!error && hint ? <p className="t-meta">{hint}</p> : null}
    </div>
  );
}

/**
 * A value the buyer did not type — city and state resolved from the pincode.
 * Shown, never editable.
 * @param {{label: string, value: string}} props
 */
export function ReadonlyField({label, value}) {
  return (
    <div className="field">
      <span className="sr-only">{label}</span>
      <div className="field__readonly">{value}</div>
    </div>
  );
}

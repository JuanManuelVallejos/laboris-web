import type {
  InputHTMLAttributes,
  TextareaHTMLAttributes,
  SelectHTMLAttributes,
  ReactNode,
} from "react";

interface FieldProps {
  label?: string;
  hint?: string;
  htmlFor?: string;
  children: ReactNode;
}

export function Field({ label, hint, htmlFor, children }: FieldProps) {
  return (
    <div className="field">
      {label && (
        <label className="field__label" htmlFor={htmlFor}>
          {label}
        </label>
      )}
      {children}
      {hint && <span className="field__hint">{hint}</span>}
    </div>
  );
}

export function TextInput({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={["input", className].filter(Boolean).join(" ")} {...rest} />;
}

export function Textarea({ className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={["textarea", className].filter(Boolean).join(" ")} {...rest} />;
}

export function Select({ className, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={["select", className].filter(Boolean).join(" ")} {...rest} />;
}

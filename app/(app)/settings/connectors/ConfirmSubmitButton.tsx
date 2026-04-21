"use client";

type ConfirmSubmitButtonProps = {
  label: string;
  confirmMessage: string;
  className: string;
  title?: string;
};

export function ConfirmSubmitButton({
  label,
  confirmMessage,
  className,
  title,
}: ConfirmSubmitButtonProps) {
  return (
    <button
      type="submit"
      onClick={(e) => {
        const ok = window.confirm(confirmMessage);
        if (!ok) {
          e.preventDefault();
        }
      }}
      className={className}
      title={title}
    >
      {label}
    </button>
  );
}

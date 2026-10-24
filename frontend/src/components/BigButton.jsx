export default function BigButton({
  children,
  icon,
  onClick,
  type = 'button',
  variant = 'primary',
  disabled = false,
}) {
  return (
    <button
      type={type}
      className={`btn btn-${variant}`}
      onClick={onClick}
      disabled={disabled}
    >
      {icon}
      <span>{children}</span>
    </button>
  );
}

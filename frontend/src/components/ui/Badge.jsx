const variants = {
  default:
    "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300",
  primary:
    "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200",
  success:
    "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200",
}

export default function Badge({
  children,
  variant = "default",
}) {
  return (
    <span
      className={`inline-block px-2 py-1 rounded-md text-xs font-medium ${variants[variant]}`}
    >
      {children}
    </span>
  )
}

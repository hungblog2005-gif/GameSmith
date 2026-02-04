const variants = {
  default:
    "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300",
  primary:
    "bg-primary/10 text-primary",
  success:
    "bg-green-500/10 text-green-600",
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

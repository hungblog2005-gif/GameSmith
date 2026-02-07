export default function Card({ children, className = "" }) {
  return (
    <div
      className={`bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 ${className}`}
    >
      {children}
    </div>
  )
}

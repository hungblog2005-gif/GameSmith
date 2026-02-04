export default function Card({ children, className = "" }) {
  return (
    <div
      className={`bg-surface dark:bg-surface-dark rounded-xl shadow-soft border border-zinc-200 dark:border-zinc-800 ${className}`}
    >
      {children}
    </div>
  )
}

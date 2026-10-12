/** Skeleton for the news listing (shown while ?category / ?page re-render on the server). */
export default function NewsLoading() {
  return (
    <div aria-busy="true" aria-live="polite">
      <div className="border-b border-line bg-surface">
        <div className="container grid gap-4 py-8 md:py-12">
          <span className="skeleton h-4 w-40" />
          <span className="skeleton h-10 w-2/3 max-w-md" />
          <span className="skeleton h-5 w-full max-w-xl" />
        </div>
      </div>
      <div className="container py-10 md:py-14">
        <div className="mb-8 flex gap-2">{[...Array(4)].map((_, i) => <span key={i} className="skeleton h-10 w-24 rounded-full" />)}</div>
        <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr] lg:items-center lg:gap-10">
          <span className="skeleton aspect-[16/10] rounded-[20px]" />
          <div className="grid gap-3"><span className="skeleton h-4 w-32" /><span className="skeleton h-8 w-full" /><span className="skeleton h-4 w-5/6" /></div>
        </div>
        <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <li key={i} className="overflow-hidden rounded-card border border-line bg-surface">
              <span className="skeleton block aspect-[16/9] rounded-none" />
              <div className="grid gap-2 p-5"><span className="skeleton h-3 w-24" /><span className="skeleton h-5 w-full" /><span className="skeleton h-4 w-2/3" /></div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

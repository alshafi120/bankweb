import { Icon } from "@/components/ui/Icon";

/** Accordion built on <details> (works without JS, keyboard accessible). Shared by home, /faq and CMS faq blocks. */
export function FaqList({ items, openFirst = true }: { items: { id: string; question: string; answer: string }[]; openFirst?: boolean }) {
  return (
    <div className="divide-y divide-line rounded-[20px] border border-line bg-surface">
      {items.map((f, i) => (
        <details key={f.id} className="group px-5 md:px-6" open={openFirst && i === 0} data-faq={`${f.question} ${f.answer}`.toLowerCase()}>
          <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 py-3 font-semibold [&::-webkit-details-marker]:hidden">
            {f.question}
            <Icon name="chevron" className="size-5 shrink-0 text-muted transition group-open:rotate-180" />
          </summary>
          <p className="pb-5 text-[15px] text-muted">{f.answer}</p>
        </details>
      ))}
    </div>
  );
}

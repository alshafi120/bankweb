import type { CardProduct } from "@/types/content";

const tones: Record<CardProduct["tone"], string> = {
  jade: "from-[#0C3A36] via-[#165E57] to-[#0C3A36]",
  saffron: "from-[#8A5A14] via-[#C8892A] to-[#7A4E10]",
  lapis: "from-[#18324D] via-[#2D5C8A] to-[#18324D]",
  graphite: "from-[#1C2422] via-[#3A4744] to-[#1C2422]",
};

/** Premium card face with a subtle 3D tilt on hover (transform only — cheap to animate). */
export function BankCard({ card, bankName, label }: { card: CardProduct; bankName: string; label: string }) {
  if (card.image) {
    return (
      <div className="group [perspective:900px]">
        <div className="relative aspect-[1.586] w-full overflow-hidden rounded-2xl border border-line shadow-lift transition duration-300 ease-bank group-hover:[transform:rotateX(6deg)_rotateY(-8deg)_translateY(-4px)]">
          <img src={card.image} alt={label} className="h-full w-full object-cover" />
        </div>
      </div>
    );
  }
  return (
    <div className="group [perspective:900px]">
      <div className={`relative aspect-[1.586] w-full overflow-hidden rounded-2xl bg-gradient-to-br ${tones[card.tone]} p-5 text-white shadow-lift transition duration-300 ease-bank group-hover:[transform:rotateX(6deg)_rotateY(-8deg)_translateY(-4px)]`}>
        <div className="qamariya-pattern absolute inset-0 opacity-60" aria-hidden="true" />
        <div className="relative flex h-full flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="text-sm font-semibold">{bankName}</span>
            <span className="text-[11px] text-white/70">{label}</span>
          </div>
          <span className="h-7 w-10 rounded-md bg-gradient-to-br from-[#E9C77A] to-[#B58A35]" aria-hidden="true" />
          <div className="flex items-end justify-between" dir="ltr">
            <span className="tabular font-mono text-sm tracking-[.2em]">•••• 4721</span>
            <span className="text-sm font-bold italic">{card.network}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

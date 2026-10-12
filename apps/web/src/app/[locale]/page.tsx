import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { isLocale, t } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getHomeContent } from "@/lib/api/client";
import { defaultHomeLayout, sectionRegistry } from "@/components/sections/registry";

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const [content, dict, nonce] = [await getHomeContent(), getDictionary(locale), (await headers()).get("x-nonce") ?? undefined];

  // Structured data: the bank + FAQ (rich results)
  const jsonLd = [
    {
      "@context": "https://schema.org", "@type": "BankOrCreditUnion",
      name: t(content.settings.bankName, locale), telephone: content.settings.phone, email: content.settings.email,
      address: { "@type": "PostalAddress", streetAddress: t(content.settings.address, locale), addressCountry: "YE" },
      sameAs: Object.values(content.settings.social),
    },
    {
      "@context": "https://schema.org", "@type": "FAQPage",
      mainEntity: content.faqs.map((f) => ({ "@type": "Question", name: t(f.question, locale), acceptedAnswer: { "@type": "Answer", text: t(f.answer, locale) } })),
    },
  ];

  return (
    <>
      <script type="application/ld+json" nonce={nonce} dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      {defaultHomeLayout.map((type) => {
        const Section = sectionRegistry[type];
        return <Section key={type} content={content} locale={locale} dict={dict} />;
      })}
    </>
  );
}

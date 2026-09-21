import Link from "next/link";
import { getTranslations } from "next-intl/server";

export default async function Home() {
  const en = await getTranslations({ locale: "en", namespace: "Scaffold" });
  const hi = await getTranslations({ locale: "hi", namespace: "Scaffold" });
  return (
    <main className="mx-auto max-w-3xl space-y-6 px-6 py-16">
      <h1 className="text-4xl font-semibold text-brand">{en("title")}</h1>
      <p>{en("description")}</p>
      <p>{en("notice")}</p>
      <section lang="hi" className="space-y-3">
        <h2 className="text-2xl">{hi("title")}</h2>
        <p>{hi("description")}</p>
        <p>{hi("notice")}</p>
      </section>
      <nav
        aria-label="Scaffold pages"
        className="flex flex-wrap gap-6 underline"
      >
        <Link href="/login">Login</Link>
        <Link href="/app">Application</Link>
        <Link href="/w/example">Public wedding</Link>
      </nav>
    </main>
  );
}

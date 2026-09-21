import Link from "next/link";
export default function PlaceholderPage() {
  return (
    <>
      <h1 className="text-3xl font-semibold text-brand">Wedding workspace</h1>
      <p>Scaffold only. No account or wedding data is loaded.</p>
      <Link href="/" className="underline">
        Return home
      </Link>
    </>
  );
}

export default function AreaLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <main className="mx-auto max-w-3xl space-y-6 px-6 py-16">{children}</main>
  );
}

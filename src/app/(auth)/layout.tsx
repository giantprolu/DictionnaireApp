export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      {/* Logo + subtitle */}
      <div className="mb-8 flex flex-col items-center gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-text">
          Dico<span className="text-accent">Crew</span>
        </h1>
        <p className="text-sm text-text-secondary">
          Le dico de ta bande de potes
        </p>
      </div>

      {/* Auth card */}
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}

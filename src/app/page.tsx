import Link from "next/link";

/* -------------------------------------------------------------------------- */
/*  Inline SVG Icons for feature highlights                                   */
/* -------------------------------------------------------------------------- */

function BookIcon() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#34D399"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" />
      <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#A78BFA"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87" />
      <path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  );
}

function ThumbsUpIcon() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#34D399"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 9V5a3 3 0 00-6 0v4" />
      <path d="M2 11h4v10H2z" />
      <path d="M6 21h10a2 2 0 002-2v-5.586a1 1 0 00-.293-.707l-2-2A1 1 0 0015 10.414V9a1 1 0 00-1-1H8a1 1 0 00-1 1v2L6 21z" />
    </svg>
  );
}

function TrophyIcon() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#A78BFA"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 9H4.5a2.5 2.5 0 010-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 000-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20 17 22" />
      <path d="M18 2H6v7a6 6 0 0012 0V2z" />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/*  Features data                                                             */
/* -------------------------------------------------------------------------- */

const features = [
  {
    Icon: BookIcon,
    title: "Ton propre dico",
    description:
      "Cree des mots, invente des definitions et enrichis le vocabulaire de ta bande.",
  },
  {
    Icon: UsersIcon,
    title: "Entre potes",
    description:
      "Cree des groupes prives et partage ton dico uniquement avec ta crew.",
  },
  {
    Icon: ThumbsUpIcon,
    title: "Vote et commente",
    description:
      "Upvote les meilleures defs, commente et reagis aux trouvailles de tes potes.",
  },
  {
    Icon: TrophyIcon,
    title: "Gagne des badges",
    description:
      "Debloque des succes en contribuant : premier mot, top contributeur, legende...",
  },
] as const;

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* ---- Hero ---- */}
      <section className="flex flex-1 flex-col items-center justify-center px-6 pb-12 pt-24 text-center">
        {/* Logo */}
        <h1 className="text-5xl font-extrabold tracking-tight text-text sm:text-6xl">
          Dico<span className="text-accent">Crew</span>
        </h1>

        {/* Tagline */}
        <p className="mt-4 max-w-md text-lg leading-relaxed text-text-secondary sm:text-xl">
          Le dictionnaire collaboratif de ta bande de potes
        </p>

        {/* CTA buttons */}
        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:gap-4">
          <Link
            href="/register"
            className="inline-flex h-12 items-center justify-center rounded-[14px] bg-accent px-8 text-base font-semibold text-[#0A0A0B] transition-colors hover:bg-[#2bb583] active:bg-[#259e72]"
          >
            Commencer
          </Link>
          <Link
            href="/login"
            className="inline-flex h-12 items-center justify-center rounded-[14px] border border-border bg-transparent px-8 text-base font-semibold text-text transition-colors hover:border-accent hover:text-accent active:bg-card"
          >
            Se connecter
          </Link>
        </div>
      </section>

      {/* ---- Feature highlights ---- */}
      <section className="mx-auto w-full max-w-lg px-6 pb-20">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {features.map(({ Icon, title, description }) => (
            <div
              key={title}
              className="rounded-2xl border border-border bg-card p-5 transition-colors hover:border-accent/30"
            >
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-surface">
                <Icon />
              </div>
              <h3 className="text-sm font-semibold text-text">{title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-text-secondary">
                {description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ---- Footer ---- */}
      <footer className="border-t border-border py-6 text-center text-xs text-text-secondary">
        DicoCrew &mdash; Fait avec passion entre potes
      </footer>
    </div>
  );
}

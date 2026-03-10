import Link from "next/link";

export default function RulesPage() {
  return (
    <main className="min-h-screen w-full flex justify-center items-center bg-neutral-950 px-6 py-16 text-neutral-100">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/20">
        <div className="flex flex-col gap-3">
          <span className="text-xs uppercase tracking-[0.3em] text-neutral-500">
            IncidentHub
          </span>
          <h1 className="text-3xl font-semibold">Terms of Service</h1>
          <p className="text-sm leading-6 text-neutral-400">
            These basic rules define how the IncidentHub application may be used
            after registration.
          </p>
        </div>

        <section className="flex flex-col gap-3 text-sm leading-7 text-neutral-300">
          <h2 className="text-lg font-medium text-white">Acceptable use</h2>
          <p>
            You may use the application only for lawful workspace management,
            collaboration, communication, and task tracking.
          </p>
          <p>
            You must not attempt to abuse the service, access data belonging to
            other users without permission, or disrupt the application.
          </p>
        </section>

        <section className="flex flex-col gap-3 text-sm leading-7 text-neutral-300">
          <h2 className="text-lg font-medium text-white">
            Account responsibility
          </h2>
          <p>
            You are responsible for activity performed through your account and
            for keeping your credentials confidential.
          </p>
        </section>

        <section className="flex flex-col gap-3 text-sm leading-7 text-neutral-300">
          <h2 className="text-lg font-medium text-white">Service changes</h2>
          <p>
            The application may evolve over time, including updates to features,
            routes, and data handling needed to operate the product.
          </p>
        </section>

        <div className="flex items-center gap-4 text-sm text-neutral-400">
          <Link
            href="/register"
            className="text-white underline underline-offset-4"
          >
            Back to register
          </Link>
          <Link href="/privacy" className="hover:text-white transition-colors">
            Privacy Policy
          </Link>
        </div>
      </div>
    </main>
  );
}

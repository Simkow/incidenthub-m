import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen w-full flex justify-center items-center bg-neutral-950 px-6 py-16 text-neutral-100">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/20">
        <div className="flex flex-col gap-3">
          <span className="text-xs uppercase tracking-[0.3em] text-neutral-500">
            IncidentHub
          </span>
          <h1 className="text-3xl font-semibold">Privacy Policy</h1>
          <p className="text-sm leading-6 text-neutral-400">
            This page explains what personal data IncidentHub stores during
            account creation and workspace usage.
          </p>
        </div>

        <section className="flex flex-col gap-3 text-sm leading-7 text-neutral-300">
          <h2 className="text-lg font-medium text-white">Data we collect</h2>
          <p>
            During registration we store your username, email address, password
            hash, and confirmation that you accepted the privacy policy and
            terms.
          </p>
          <p>
            Inside the app we may also store workspace content such as tasks,
            notes, chat messages, calendar events, and membership data.
          </p>
        </section>

        <section className="flex flex-col gap-3 text-sm leading-7 text-neutral-300">
          <h2 className="text-lg font-medium text-white">
            Purpose of processing
          </h2>
          <p>
            Your data is used only to provide authentication, workspace
            collaboration, and core product features required by IncidentHub.
          </p>
        </section>

        <section className="flex flex-col gap-3 text-sm leading-7 text-neutral-300">
          <h2 className="text-lg font-medium text-white">Contact</h2>
          <p>
            For privacy-related questions, contact the project owner or support
            email configured for the application.
          </p>
        </section>

        <div className="flex items-center gap-4 text-sm text-neutral-400">
          <Link
            href="/register"
            className="text-white underline underline-offset-4"
          >
            Back to register
          </Link>
          <Link href="/rules" className="hover:text-white transition-colors">
            Terms of Service
          </Link>
        </div>
      </div>
    </main>
  );
}

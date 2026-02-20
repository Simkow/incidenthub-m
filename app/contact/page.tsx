import { Navbar } from "../home/Navbar";

export default function ContactPage() {
  return (
    <div className="w-full min-h-screen bg-[#090909]">
      <Navbar />
      <main className="pt-32 px-6 md:px-12 lg:px-56 text-neutral-100">
        <h1 className="text-3xl md:text-5xl font-bold">Contact</h1>
        <p className="mt-4 text-neutral-400 max-w-2xl">
          Contact page is not set up yet.
        </p>
      </main>
    </div>
  );
}

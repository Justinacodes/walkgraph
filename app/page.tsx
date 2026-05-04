import Link from "next/link";
import { MapPin, Navigation, QrCode, Accessibility, WifiOff, Building2 } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#141414] text-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-6 lg:px-20">
        <span className="font-display text-2xl tracking-tight">WalkGraph</span>
        <div className="flex items-center gap-4">
          <Link href="/explore" className="text-sm text-white/60 hover:text-white transition-colors font-medium">
            Explore
          </Link>
          <Link href="/auth/login" className="text-sm text-white/60 hover:text-white transition-colors font-medium">
            Sign in
          </Link>
          <Link
            href="/auth/register"
            className="bg-white text-[#141414] text-sm font-bold px-5 py-2.5 rounded-full hover:bg-white/90 transition-colors"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-8 lg:px-20 pt-16 pb-24">
        <div className="max-w-5xl">
          <p className="font-mono text-xs uppercase tracking-[0.4em] text-white/30 mb-6">
            Indoor Navigation — Reimagined
          </p>
          <h1 className="font-display text-7xl lg:text-9xl tracking-tighter leading-[0.9] mb-8">
            Google Maps<br />
            gets you to<br />
            the building.
          </h1>
          <p className="font-display text-4xl lg:text-6xl tracking-tighter text-blue-400 mb-10">
            We get you<br />to the room.
          </p>
          <p className="text-lg text-white/50 max-w-xl mb-10 font-medium leading-relaxed">
            A node-first indoor navigation platform. Create a usable map by physically
            walking through any building — no floor plans required.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/auth/register"
              className="bg-[#3B82F6] text-white font-bold px-8 py-4 rounded-2xl hover:bg-blue-500 transition-colors shadow-blue-glow"
            >
              Start Mapping Free
            </Link>
            <Link
              href="/explore"
              className="bg-white/10 text-white font-bold px-8 py-4 rounded-2xl hover:bg-white/20 transition-colors border border-white/10"
            >
              Explore Buildings
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-[#F1F5F9] text-[#141414] px-8 lg:px-20 py-24">
        <p className="font-mono text-xs uppercase tracking-[0.4em] text-slate-400 mb-12">
          02. Core Features
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              icon: <Building2 className="w-5 h-5" />,
              title: "Walk-to-Map",
              desc: "Walk through any building and drop navigation nodes as you go. No CAD files, no professional surveys.",
            },
            {
              icon: <Navigation className="w-5 h-5" />,
              title: "Shortest Path",
              desc: "Dijkstra-powered indoor routing with human-readable step-by-step directions.",
            },
            {
              icon: <QrCode className="w-5 h-5" />,
              title: "QR Positioning",
              desc: "Print QR codes at key checkpoints. Visitors scan to know exactly where they are.",
            },
            {
              icon: <Accessibility className="w-5 h-5" />,
              title: "Accessibility Routes",
              desc: "Flag accessible paths and avoid stairs automatically for users who need it.",
            },
            {
              icon: <WifiOff className="w-5 h-5" />,
              title: "Offline-First",
              desc: "Download building maps for offline use. Navigate inside buildings with no signal.",
            },
            {
              icon: <MapPin className="w-5 h-5" />,
              title: "Multi-Floor",
              desc: "Full support for staircases, elevators, and floor transitions in any building.",
            },
          ].map((f) => (
            <div key={f.title} className="bg-white p-8 rounded-3xl border border-slate-200 hover:border-[#141414] transition-all group">
              <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center mb-6 group-hover:bg-[#141414] group-hover:text-white transition-all">
                {f.icon}
              </div>
              <h3 className="text-xl font-bold mb-2">{f.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-white px-8 lg:px-20 py-24">
        <p className="font-mono text-xs uppercase tracking-[0.4em] text-slate-400 mb-12">
          03. How It Works
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { step: "01", title: "Create your building", desc: "Add your organization, create a building profile with GPS coordinates." },
            { step: "02", title: "Walk & drop nodes", desc: "Walk through each floor, adding named nodes at key locations as you go." },
            { step: "03", title: "Visitors navigate", desc: "Publish your map. Visitors search for rooms and get step-by-step indoor directions." },
          ].map((s) => (
            <div key={s.step}>
              <p className="font-mono text-5xl font-bold text-slate-100 mb-4">{s.step}</p>
              <h3 className="text-xl font-bold mb-3">{s.title}</h3>
              <p className="text-slate-500 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#141414] px-8 lg:px-20 py-24 text-center">
        <h2 className="font-display text-6xl text-white mb-6">Ready to map your building?</h2>
        <p className="text-white/50 text-lg mb-10 max-w-xl mx-auto">
          Start for free. No floor plans needed. Works for schools, hospitals, offices, churches, and more.
        </p>
        <Link
          href="/auth/register"
          className="inline-block bg-[#3B82F6] text-white font-bold px-10 py-5 rounded-2xl text-lg hover:bg-blue-500 transition-colors shadow-blue-glow"
        >
          Create Your First Map
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 px-8 lg:px-20 py-8 bg-[#141414]">
        <div className="flex items-center justify-between text-white/20">
          <span className="font-mono text-xs uppercase tracking-[0.3em]">WalkGraph Systems © 2026</span>
          <span className="font-mono text-xs">A building map you create by walking.</span>
        </div>
      </footer>
    </div>
  );
}

import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import Hero from '../components/Hero.jsx';
import StatsGrid from '../components/StatsGrid.jsx';
import FeatureGrid from '../components/FeatureGrid.jsx';
import CourseHighlights from '../components/CourseHighlights.jsx';
import PricingGrid from '../components/PricingGrid.jsx';
import Footer from '../components/Footer.jsx';

function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 text-white">
      <Navbar />
      <main className="space-y-16 pb-20 pt-6">
        <Hero />
        <StatsGrid />
        <FeatureGrid />
        <CourseHighlights />
        <section className="mx-auto mt-16 max-w-6xl px-6">
          <div className="rounded-3xl border border-white/10 bg-gradient-to-r from-primary/30 to-accent/30 p-10 text-white shadow-2xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-white/80">
              Weekly Coaching Drops
            </p>
            <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">
              Build unstoppable learning habits with guided routines.
            </h2>
            <p className="mt-3 text-white/80">
              TrackWise blends data, coaching, and community so you always know what to
              study next.
            </p>
            <div className="mt-6 flex flex-wrap gap-4">
              <a
                href="mailto:hello@trackwise.dev"
                className="rounded-full border border-white/30 px-6 py-3 text-sm font-semibold hover:border-white/80 transition"
              >
                Talk to a coach
              </a>
              <Link
                to="/payment"
                className="rounded-full bg-white text-slate-900 px-6 py-3 text-sm font-semibold hover:bg-slate-100 transition"
              >
                Upgrade to Premium
              </Link>
            </div>
          </div>
        </section>
        <PricingGrid />
      </main>
      <Footer />
    </div>
  );
}

export default Home;


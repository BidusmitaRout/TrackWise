import { Link } from 'react-router-dom';

const highlights = [
  { label: 'Top learners', value: '1,200+' },
  { label: 'Avg 12h/week', value: '12h' },
  { label: '4.8 ★ rating', value: '4.8/5' },
];

function Hero() {
  return (
    <section className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-16 lg:flex-row lg:items-center">
      <div className="flex-1 space-y-6">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-accent">
          Track your learning journey
        </span>
        <h1 className="text-4xl font-semibold text-white sm:text-5xl lg:text-6xl">
          Learn better. Track progress. Finish stronger.
        </h1>
        <p className="text-lg text-white/70">
          Organize courses, measure study hours, and celebrate achievements — all
          in one place built for learners who mean business.
        </p>
        <div className="flex flex-wrap gap-4">
          <Link
            to="/signup"
            className="rounded-full bg-gradient-to-r from-primary to-fuchsia-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/40 transition hover:scale-[1.01]"
          >
            Get Started — It&apos;s Free
          </Link>
          <Link
            to="/tracker"
            className="rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white/80 hover:text-white hover:border-white/40 transition"
          >
            Open Tracker
          </Link>
          <Link
            to="/courses"
            className="rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white/80 hover:text-white hover:border-white/40 transition"
          >
            Browse Courses
          </Link>
        </div>
        <div className="flex flex-wrap items-center gap-6 border-t border-white/10 pt-6">
          {highlights.map((item) => (
            <div key={item.label} className="flex items-center gap-2 text-sm">
              <span className="text-white font-semibold">{item.value}</span>
              <span className="text-white/60">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="flex-1">
        <div className="relative mx-auto max-w-lg rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-8 text-white shadow-2xl">
          <div className="flex items-center justify-between text-sm text-white/70">
            <span>Weekly goal</span>
            <span>82% complete</span>
          </div>
          <div className="mt-6 space-y-4">
            {[68, 54, 91].map((value, index) => (
              <div key={value} className="space-y-1">
                <div className="flex items-center justify-between text-sm text-white/70">
                  <span>
                    {index === 0
                      ? 'UI/UX Sprint'
                      : index === 1
                      ? 'DSA Marathon'
                      : 'React Projects'}
                  </span>
                  <span>{value}%</span>
                </div>
                <div className="w-full rounded-full bg-white/10">
                  <div
                    className="h-2 rounded-full bg-gradient-to-r from-primary to-accent"
                    style={{ width: `${value}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 rounded-2xl bg-white/10 p-4 text-sm text-white/80">
            <p className="font-semibold text-white">Study focus</p>
            <p>Average 12h/week across JavaScript, React, and Data Structures.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;


const features = [
  {
    title: 'Track Time',
    description: 'Log study hours and watch weekly trends in real time.',
    icon: '⏱️',
  },
  {
    title: 'Earn Achievements',
    description: 'Unlock badges for streaks, hours, and course completion.',
    icon: '🏆',
  },
  {
    title: 'Get Insights',
    description: 'Interactive analytics reveal focus areas and gaps.',
    icon: '📊',
  },
];

function FeatureGrid() {
  return (
    <section className="mx-auto mt-16 max-w-6xl px-6">
      <div className="grid gap-6 md:grid-cols-3">
        {features.map((feature) => (
          <div
            key={feature.title}
            className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 to-transparent p-6 text-white shadow-lg shadow-slate-900/50"
          >
            <div className="text-3xl">{feature.icon}</div>
            <h3 className="mt-4 text-xl font-semibold">{feature.title}</h3>
            <p className="mt-2 text-sm text-white/70">{feature.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default FeatureGrid;


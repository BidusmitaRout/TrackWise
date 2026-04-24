const stats = [
  { label: 'Hours Logged', value: '12,345' },
  { label: 'Active Learners', value: '1,200' },
  { label: 'Achievements', value: '512' },
  { label: 'Avg Weekly Study', value: '12h' },
];

function StatsGrid() {
  return (
    <section className="mx-auto max-w-6xl px-6">
      <div className="grid gap-4 rounded-3xl border border-white/10 bg-white/5 p-6 text-white shadow-inner sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-2xl bg-white/5 p-4">
            <p className="text-sm text-white/70">{stat.label}</p>
            <p className="mt-2 text-2xl font-semibold">{stat.value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default StatsGrid;


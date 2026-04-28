import { Link } from 'react-router-dom';

const plans = [
  {
    name: 'Basic',
    price: '₹499',
    perks: ['Progress tracker', '3 projects', 'Email support'],
  },
  {
    name: 'Standard',
    price: '₹999',
    perks: ['Everything in Basic', 'Unlimited projects', 'Weekly insights'],
    highlighted: true,
  },
  {
    name: 'Premium',
    price: '₹1499',
    perks: ['1:1 mentor feedback', 'Priority support', 'Certificates'],
  },
];

function PricingGrid() {
  return (
    <section className="mx-auto mt-16 max-w-6xl px-6 text-white">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-accent">
            Pricing Plans
          </p>
          <h2 className="mt-2 text-3xl font-semibold">Flexible tiers for every learner</h2>
        </div>
      </div>
      <div className="mt-8 grid gap-6 md:grid-cols-3">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`rounded-3xl border border-white/10 p-6 shadow-xl ${
              plan.highlighted
                ? 'bg-gradient-to-br from-primary/40 to-primary/10'
                : 'bg-white/5'
            }`}
          >
            <h3 className="text-2xl font-semibold">{plan.name}</h3>
            <p className="mt-4 text-4xl font-bold">{plan.price}</p>
            <ul className="mt-6 space-y-2 text-sm text-white/80">
              {plan.perks.map((perk) => (
                <li key={perk} className="flex items-center gap-2">
                  <span>✓</span>
                  {perk}
                </li>
              ))}
            </ul>
            <Link
              to={`/payment?plan=${encodeURIComponent(plan.name)}`}
              className="mt-8 block w-full rounded-full border border-white/20 px-4 py-3 text-center text-sm font-semibold hover:border-white/60 transition"
            >
              Choose Plan
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}

export default PricingGrid;


import { Link } from 'react-router-dom';

const footerLinks = [
  {
    title: 'Courses',
    items: ['JavaScript Essentials', 'Data Structures', 'React Basics'],
  },
  {
    title: 'Resources',
    items: ['Docs', 'Community', 'Support'],
  },
  {
    title: 'About',
    items: ['Company', 'Careers', 'Contact'],
  },
];

function Footer() {
  return (
    <footer className="mt-20 border-t border-white/10 bg-slate-950">
      <div className="mx-auto max-w-6xl px-6 py-12 text-white/80">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2 text-white">
              <span className="h-3 w-3 rounded bg-primary"></span>
              <span className="font-semibold">TrackWise</span>
            </div>
            <p className="mt-3 text-sm text-white/60">
              We are here to help you learn, track, and grow.
            </p>
          </div>
          {footerLinks.map((section) => (
            <div key={section.title}>
              <h4 className="font-semibold text-white">{section.title}</h4>
              <ul className="mt-3 space-y-2 text-sm text-white/70">
                {section.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-col gap-4 border-t border-white/10 pt-6 text-xs text-white/50 sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} TrackWise. All rights reserved.</span>
          <div className="flex gap-4">
            <Link to="/terms" className="hover:text-white">
              Terms
            </Link>
            <Link to="/privacy" className="hover:text-white">
              Privacy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;


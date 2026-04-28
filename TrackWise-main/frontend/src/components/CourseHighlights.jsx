const courses = [
  {
    title: 'JavaScript Essentials',
    description: 'Syntax, DOM, async, and tooling — all in one track.',
    image:
      'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80',
  },
  {
    title: 'Data Structures with OOP',
    description: 'Master arrays, stacks, trees, and graphs via real projects.',
    image:
      'https://images.unsplash.com/photo-1555949963-aa79dcee981d?auto=format&fit=crop&w=1200&q=80',
  },
  {
    title: 'React Basics',
    description: 'Components, props, hooks, and clean patterns for modern UIs.',
    image:
      'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1200&q=80',
  },
];

function CourseHighlights() {
  return (
    <section className="mx-auto mt-16 max-w-6xl px-6 text-white">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-accent">
            Popular Courses
          </p>
          <h2 className="mt-2 text-3xl font-semibold">Designed for real progress</h2>
        </div>
      </div>
      <div className="mt-8 grid gap-6 md:grid-cols-3">
        {courses.map((course) => (
          <div
            key={course.title}
            className="overflow-hidden rounded-3xl border border-white/10 bg-white/5"
          >
            <img
              src={course.image}
              alt={course.title}
              className="h-52 w-full object-cover"
              loading="lazy"
            />
            <div className="space-y-2 p-5">
              <h3 className="text-xl font-semibold">{course.title}</h3>
              <p className="text-sm text-white/70">{course.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default CourseHighlights;


export default function Home() {
  return (
    <main className="min-h-screen bg-cream">
      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-24 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-orange-50 border border-orange-100 rounded-full px-4 py-1.5 mb-6">
          <span className="w-2 h-2 rounded-full bg-orange-500"></span>
          <span className="text-xs font-medium text-orange-600">Now in beta</span>
        </div>

        <h1 className="font-display text-6xl md:text-7xl font-900 text-zinc-900 leading-none mb-6">
          Music is better<br />
          <span className="text-orange-500 italic">together.</span>
        </h1>

        <p className="text-zinc-500 text-xl max-w-lg mx-auto mb-10">
          Rate albums, write reviews, build lists, and discover what the world is listening to.
        </p>

        <div className="flex items-center justify-center gap-4">
          <a href="/register" className="btn-primary text-base px-8 py-3">
            Get Started Free
          </a>
          <a href="/search" className="btn-ghost text-base">
            Browse Music →
          </a>
        </div>
      </section>

      {/* Feature highlights */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              emoji: '★',
              title: 'Rate Everything',
              description: 'Score albums and tracks on a 0.5–10 scale. Build your taste profile over time.',
            },
            {
              emoji: '✍',
              title: 'Write Reviews',
              description: 'Go beyond a number. Tell the world why an album moved you.',
            },
            {
              emoji: '♫',
              title: 'Build Lists',
              description: 'Curate ranked and unranked lists. Share your all-time favorites.',
            },
          ].map((feature) => (
            <div key={feature.title} className="card p-8">
              <div className="text-3xl mb-4">{feature.emoji}</div>
              <h3 className="font-display text-xl font-bold text-zinc-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-zinc-500 text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
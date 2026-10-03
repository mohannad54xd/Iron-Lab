type ParticleFieldProps = {
  crushed: boolean;
};

const particles = Array.from({ length: 18 }, (_, index) => ({
  left: `${(index * 11) % 90 + 5}%`,
  top: `${(index * 17) % 72 + 12}%`,
  delay: index * 0.08,
  size: 10 + ((index * 7) % 18),
}));

export function ParticleField({ crushed }: ParticleFieldProps) {
  return (
    <div className="relative flex h-52 items-center justify-center overflow-hidden rounded-[28px] border border-dashed border-ink/20 bg-[#f5efe8]">
      {!crushed ? (
        <div className="text-center text-sm uppercase tracking-[0.2em] text-slate-500">Ore ready to crush</div>
      ) : (
        <div className="absolute inset-0">
          {particles.map((particle, index) => (
            <span
              key={index}
              className="particle"
              style={{
                left: particle.left,
                top: particle.top,
                width: `${particle.size}px`,
                height: `${particle.size}px`,
                animationDelay: `${particle.delay}s`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

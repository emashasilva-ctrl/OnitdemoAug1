export function Marquee({ items }: { items: string[] }) {
  const track = [...items, ...items];

  return (
    <div className="relative z-20 overflow-hidden whitespace-nowrap border-b border-primary/30 bg-[#14181C] py-2.5">
      <div className="marquee-track inline-block">
        {track.map((item, i) => (
          <span key={i} className="mr-7 text-xs font-bold tracking-wider text-primary uppercase">
            {item}
            <span className="ml-7 text-primary/50" aria-hidden="true">
              &#10022;
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

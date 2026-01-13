interface LegendProps {
  className?: string;
}

/**
 * Legend component with color AND symbol indicators for accessibility.
 * Ensures color is not the only means of conveying information (WCAG 1.4.1).
 */
export default function Legend({ className = '' }: LegendProps) {
  const items = [
    {
      color: 'bg-blue-500',
      label: 'Democrat Running',
      symbol: 'D',
      symbolClass: 'text-blue-600 font-bold',
    },
    {
      color: 'bg-red-500',
      label: 'Republican Running',
      symbol: 'R',
      symbolClass: 'text-red-600 font-bold',
    },
    {
      color: 'bg-purple-500',
      label: 'Both Parties (Contested)',
      symbol: 'C',
      symbolClass: 'text-purple-600 font-bold',
    },
    {
      color: 'bg-amber-400',
      label: 'Filed (Party Unknown)',
      symbol: '?',
      symbolClass: 'text-amber-600 font-bold',
    },
    {
      color: 'bg-gray-200 border border-gray-300',
      label: 'No Candidates Yet',
      symbol: '—',
      symbolClass: 'text-gray-400',
    },
  ];

  return (
    <div
      className={`flex flex-wrap gap-4 ${className}`}
      role="list"
      aria-label="Map legend"
    >
      {items.map((item) => (
        <div
          key={item.label}
          className="flex items-center gap-2"
          role="listitem"
        >
          <div
            className={`w-4 h-4 rounded ${item.color} flex items-center justify-center`}
            aria-hidden="true"
          >
            <span className={`text-[8px] ${item.symbolClass}`}>{item.symbol}</span>
          </div>
          <span className="text-sm text-gray-600">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

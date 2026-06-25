import { Gamepad2, Monitor, Swords } from 'lucide-react';

const tabs = [
  { key: 'gacha', label: 'Gacha', icon: Gamepad2 },
  { key: 'pc', label: 'PC Box', icon: Monitor },
  { key: 'team', label: 'Equipo', icon: Swords },
];

export default function NavBar({ active, onChange }) {
  return (
    <nav className="flex gap-1 mb-4">
      {tabs.map(({ key, label, icon: Icon }) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={`flex items-center gap-1 px-4 py-2 text-[10px] border-2 border-black transition-all ${
            active === key
              ? 'bg-pokemon-yellow text-black shadow-[2px_2px_0px_rgba(0,0,0,0.5)]'
              : 'bg-gb-case text-gray-600 hover:bg-gray-300'
          }`}
        >
          <Icon size={14} />
          {label}
        </button>
      ))}
    </nav>
  );
}

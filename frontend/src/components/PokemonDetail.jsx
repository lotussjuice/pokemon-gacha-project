import { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import api from '../api/axios';
import { X } from 'lucide-react';

const natures = [
  'hardy', 'lonely', 'brave', 'adamant', 'naughty',
  'bold', 'docile', 'relaxed', 'impish', 'lax',
  'timid', 'hasty', 'serious', 'jolly', 'naive',
  'modest', 'mild', 'quiet', 'bashful', 'rash',
  'calm', 'gentle', 'sassy', 'careful', 'quirky'
];

const statsLabels = {
  hp: 'HP', attack: 'ATK', defense: 'DEF',
  sp_attack: 'SP.ATK', sp_defense: 'SP.DEF', speed: 'SPD'
};

export default function PokemonDetail({ capture, onClose, onUpdate }) {
  const { userId } = useUser();
  const [cap, setCap] = useState(capture);
  const [nickname, setNickname] = useState(capture.nickname || '');
  const [nature, setNature] = useState(capture.nature || '');
  const [evolving, setEvolving] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => { setCap(capture); setNickname(capture.nickname || ''); setNature(capture.nature || ''); }, [capture]);

  const spriteUrl = (shiny) =>
    `https://raw.githubusercontent.com/msikma/pokesprite/master/pokemon-gen8/${shiny ? 'shiny' : 'regular'}/${cap.pokemonName.toLowerCase()}.png`;

  const patch = async (url, body) => {
    const { data } = await api.patch(url, { userId, ...body });
    return data;
  };

  const handleNickname = async () => {
    if (!nickname.trim()) return;
    const data = await patch(`/capturas/apodo/${cap.id}`, { nickname });
    setCap(prev => ({ ...prev, nickname: data.captura.nickname }));
  };

  const handleNature = async (val) => {
    setDetailLoading(true);
    try {
      const data = await patch(`/capturas/naturaleza/${cap.id}`, { nature: val });
      setCap(prev => ({ ...prev, nature: val, stats: data.captura.stats }));
      setNature(val);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleShiny = async () => {
    const data = await patch(`/capturas/sprite/${cap.id}`, { isShiny: !cap.isShiny });
    setCap(prev => ({ ...prev, isShiny: data.captura.isShiny }));
  };

  const handleStatChange = async (statName, value) => {
    const val = parseInt(value);
    if (isNaN(val) || val < 0) return;
    await patch(`/capturas/stat/${cap.id}`, { statName, value: val });
    setCap(prev => ({ ...prev, stats: { ...prev.stats, [statName]: val } }));
  };

  const handleEvolve = async () => {
    if (!window.confirm(`¿Evolucionar a ${cap.pokemonName}?`)) return;
    setEvolving(true);
    try {
      const { data } = await api.put(`/capturas/evolucionar/${cap.id}`, { userId });
      setCap(prev => ({ ...prev, ...data.captura }));
      onUpdate();
    } finally {
      setEvolving(false);
    }
  };

  const handleRelease = async () => {
    if (!window.confirm(`¿Liberar a ${cap.nickname || cap.pokemonName}?`)) return;
    await api.delete(`/capturas/${cap.id}`);
    onClose();
    onUpdate();
  };

  if (!cap) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-gb-case p-6 rounded-t-3xl rounded-br-[4rem] rounded-bl-3xl border-4 border-black w-full max-w-md max-h-[90vh] overflow-y-auto relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-600 hover:text-black">
          <X size={18} />
        </button>

        {/* Sprite + Name */}
        <div className="flex flex-col items-center mb-4">
          <div className="relative">
            <img src={spriteUrl(cap.isShiny)} alt={cap.pokemonName} className="w-24 h-24 object-contain image-rendering-pixelated" />
            {cap.isShiny && <span className="absolute -top-1 -right-1 text-lg text-yellow-300 drop-shadow-[1px_1px_0px_#000]">★</span>}
          </div>
          <p className="text-xs text-gray-700 mt-1 uppercase">{cap.nickname || cap.pokemonName}</p>
          {cap.nature && <p className="text-[10px] text-gray-500">{cap.nature}</p>}
        </div>

        <div className="flex gap-2 mb-4 justify-center">
          <button onClick={handleShiny} className="btn-gameboy text-[10px] px-3 py-1">
            {cap.isShiny ? 'REGULAR' : 'SHINY'}
          </button>
          <button
            onClick={handleEvolve}
            disabled={evolving}
            className="btn-gameboy text-[10px] px-3 py-1"
          >
            {evolving ? '...' : 'EVOLUCIONAR'}
          </button>
          <button onClick={handleRelease} className="btn-gameboy text-[10px] px-3 py-1 bg-red-800">
            LIBERAR
          </button>
        </div>

        {/* Nickname */}
        <div className="mb-4">
          <p className="text-[10px] text-gray-600 mb-1">Apodo</p>
          <div className="flex gap-2">
            <input
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="flex-1 px-2 py-1 text-xs border-2 border-black bg-gb-screen text-gb-screen-dark outline-none"
            />
            <button onClick={handleNickname} className="btn-gameboy text-[10px] px-3 py-1">
              OK
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-4">
          <p className="text-[10px] text-gray-600 mb-1">Stats</p>
          <div className="grid grid-cols-2 gap-1">
            {Object.entries(statsLabels).map(([key, label]) => (
              <div key={key} className="flex items-center gap-1 text-[10px]">
                <span className="w-12 text-gray-600">{label}</span>
                <input
                  type="number"
                  defaultValue={cap.stats?.[key] ?? 0}
                  onBlur={(e) => handleStatChange(key, e.target.value)}
                  className="w-16 px-1 py-0.5 text-xs border border-black bg-gb-screen text-gb-screen-dark text-center outline-none"
                  min="0"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Nature */}
        <div className="mb-4">
          <p className="text-[10px] text-gray-600 mb-1">Naturaleza</p>
          <div className="flex flex-wrap gap-1">
            {natures.map((n) => (
              <button
                key={n}
                onClick={() => handleNature(n)}
                disabled={detailLoading}
                className={`text-[8px] px-2 py-1 border border-black transition-colors ${
                  cap.nature === n
                    ? 'bg-pokemon-yellow text-black'
                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

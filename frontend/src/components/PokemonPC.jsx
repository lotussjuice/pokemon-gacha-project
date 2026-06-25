import { useState, useEffect, useCallback } from 'react';
import { useUser } from '../context/UserContext';
import api from '../api/axios';
import PokemonDetail from './PokemonDetail';

export default function PokemonPC() {
  const { userId } = useUser();
  const [captures, setCaptures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  const fetchCaptures = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const { data } = await api.get('/capturas', { params: { userId } });
      setCaptures(data);
    } catch (err) {
      console.error('Error al obtener capturas', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { fetchCaptures(); }, [fetchCaptures]);

  const spriteUrl = (name, shiny) =>
    `https://raw.githubusercontent.com/msikma/pokesprite/master/pokemon-gen8/${shiny ? 'shiny' : 'regular'}/${name.toLowerCase()}.png`;

  if (loading) {
    return (
      <div className="bg-gb-case p-6 rounded-t-3xl rounded-br-[4rem] rounded-bl-3xl border-4 border-black w-full max-w-2xl">
        <p className="text-[10px] text-center text-gray-600">Cargando PC...</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-gb-case p-6 rounded-t-3xl rounded-br-[4rem] rounded-bl-3xl border-4 border-black w-full max-w-2xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xs text-gray-700">PC BOX ({captures.length}/∞)</h2>
          <button
            onClick={fetchCaptures}
            className="text-[10px] px-3 py-1 border-2 border-black bg-gray-200 hover:bg-gray-300"
          >
            REFRESH
          </button>
        </div>

        {captures.length === 0 ? (
          <p className="text-[10px] text-center text-gray-500 py-8">
            No hay Pokémon capturados. ¡Ve al Gacha!
          </p>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {captures.map((cap) => (
              <button
                key={cap.id}
                onClick={() => setSelected(cap)}
                className="bg-gb-screen p-2 border-2 border-black flex flex-col items-center hover:scale-105 transition-transform"
              >
                <img
                  src={spriteUrl(cap.pokemonName, cap.isShiny)}
                  alt={cap.pokemonName}
                  className="w-12 h-12 object-contain image-rendering-pixelated"
                />
                <p className="text-[8px] text-gb-screen-dark mt-1 uppercase truncate w-full text-center">
                  {cap.nickname || cap.pokemonName}
                </p>
                {cap.isShiny && (
                  <span className="text-[10px] text-yellow-300 drop-shadow-[1px_1px_0px_#000]">★</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <PokemonDetail
          capture={selected}
          onClose={() => { setSelected(null); fetchCaptures(); }}
          onUpdate={fetchCaptures}
        />
      )}
    </>
  );
}

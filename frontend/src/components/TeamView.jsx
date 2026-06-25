import { useState, useEffect, useCallback } from 'react';
import { useUser } from '../context/UserContext';
import api from '../api/axios';

export default function TeamView() {
  const { userId } = useUser();
  const [captures, setCaptures] = useState([]);
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const [capRes, teamRes] = await Promise.all([
        api.get('/capturas', { params: { userId } }),
        api.get(`/equipos/${userId}`)
      ]);
      setCaptures(capRes.data);
      setTeam(teamRes.data.equipo || []);
    } catch (err) {
      console.error('Error al cargar datos', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const togglePokemon = (captureId) => {
    setTeam(prev => {
      if (prev.includes(captureId)) return prev.filter(id => id !== captureId);
      if (prev.length >= 6) return prev;
      return [...prev, captureId];
    });
  };

  const saveTeam = async () => {
    setSaving(true);
    try {
      await api.put(`/equipos/${userId}`, { pokemonIds: team });
      alert('¡Equipo guardado!');
    } catch (err) {
      alert('Error al guardar equipo');
    } finally {
      setSaving(false);
    }
  };

  const spriteUrl = (name, shiny) =>
    `https://raw.githubusercontent.com/msikma/pokesprite/master/pokemon-gen8/${shiny ? 'shiny' : 'regular'}/${name.toLowerCase()}.png`;

  if (loading) {
    return (
      <div className="bg-gb-case p-6 rounded-t-3xl rounded-br-[4rem] rounded-bl-3xl border-4 border-black w-full max-w-2xl">
        <p className="text-[10px] text-center text-gray-600">Cargando...</p>
      </div>
    );
  }

  const teamCaptures = captures.filter(c => team.includes(c.id));
  const available = captures.filter(c => !team.includes(c.id));

  return (
    <div className="bg-gb-case p-6 rounded-t-3xl rounded-br-[4rem] rounded-bl-3xl border-4 border-black w-full max-w-2xl">
      {/* Team Slots */}
      <h2 className="text-xs text-gray-700 mb-2">EQUIPO ({team.length}/6)</h2>
      <div className="flex gap-2 mb-6 justify-center">
        {Array.from({ length: 6 }).map((_, i) => {
          const cap = teamCaptures[i];
          return (
            <div
              key={i}
              className={`w-16 h-16 border-2 border-black flex items-center justify-center ${
                cap ? 'bg-gb-screen cursor-pointer' : 'bg-gray-300'
              }`}
              onClick={() => cap && togglePokemon(cap.id)}
            >
              {cap ? (
                <div className="flex flex-col items-center">
                  <img src={spriteUrl(cap.pokemonName, cap.isShiny)} alt={cap.pokemonName} className="w-10 h-10 object-contain image-rendering-pixelated" />
                  <span className="text-[6px] text-gb-screen-dark uppercase truncate w-full text-center">{cap.nickname || cap.pokemonName}</span>
                </div>
              ) : (
                <span className="text-[10px] text-gray-500">-</span>
              )}
            </div>
          );
        })}
      </div>

      <button
        onClick={saveTeam}
        disabled={saving}
        className="btn-gameboy text-xs py-2 w-full mb-6"
      >
        {saving ? 'GUARDANDO...' : 'GUARDAR EQUIPO'}
      </button>

      {/* Available Captures */}
      <h3 className="text-[10px] text-gray-600 mb-2">TUS POKÉMON DISPONIBLES</h3>
      {available.length === 0 ? (
        <p className="text-[10px] text-center text-gray-500 py-4">
          {captures.length === 0 ? 'No tienes Pokémon capturados' : 'Todos están en el equipo'}
        </p>
      ) : (
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
          {available.map((cap) => (
            <button
              key={cap.id}
              onClick={() => togglePokemon(cap.id)}
              className="bg-gb-screen p-1 border-2 border-black flex flex-col items-center hover:scale-105 transition-transform"
            >
              <img src={spriteUrl(cap.pokemonName, cap.isShiny)} alt={cap.pokemonName} className="w-8 h-8 object-contain image-rendering-pixelated" />
              <span className="text-[6px] text-gb-screen-dark uppercase truncate w-full text-center">
                {cap.nickname || cap.pokemonName}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

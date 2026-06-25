import { useState } from 'react';
import { useUser } from '../context/UserContext';
import api from '../api/axios';
import { motion, AnimatePresence } from 'framer-motion';

const GachaMachine = () => {
  const { userId } = useUser();
  const [pokemon, setPokemon] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isShiny, setIsShiny] = useState(false);
  const [captured, setCaptured] = useState(false);
  const [capturing, setCapturing] = useState(false);

  const pullGacha = async () => {
    setLoading(true);
    setPokemon(null);
    setIsShiny(false);
    setCaptured(false);
    try {
      const { data } = await api.get('/pokedex/random');
      setTimeout(() => {
        setPokemon(data);
        setLoading(false);
      }, 1500);
    } catch (error) {
      console.error("Error en el gacha", error);
      setLoading(false);
    }
  };

  const handleCapture = async () => {
    if (!pokemon || capturing) return;
    setCapturing(true);
    try {
      await api.post('/capturas', {
        userId,
        pokemonId: pokemon.id,
        pokemonName: pokemon.name,
        isShiny
      });
      setCaptured(true);
    } catch (error) {
      console.error("Error al capturar", error);
      alert('Error al capturar');
    } finally {
      setCapturing(false);
    }
  };

  const spriteUrl = pokemon
    ? `https://raw.githubusercontent.com/msikma/pokesprite/master/pokemon-gen8/${isShiny ? 'shiny' : 'regular'}/${pokemon.name.toLowerCase()}.png`
    : '';

  return (
    <div className="flex flex-col items-center p-8 bg-gb-case rounded-t-3xl rounded-br-[4rem] rounded-bl-3xl border-4 border-black shadow-[10px_10px_0px_rgba(0,0,0,0.4)] w-80 md:w-96">

      <div className="w-full flex justify-between px-4 mb-6">
        <div className="h-1 w-12 bg-gray-400 border-y border-gray-500"></div>
        <div className="h-1 w-12 bg-gray-400 border-y border-gray-500"></div>
      </div>

      <p className="text-xs mb-2 text-gray-600 tracking-tighter">DOT MATRIX WITH STEREO SOUND</p>

      <div className="w-full bg-slate-700 p-4 rounded-t-lg rounded-bl-lg rounded-br-3xl border-4 border-black shadow-inner flex flex-col items-center relative">

        <div className="absolute left-2 top-1/2 w-2 h-2 rounded-full bg-red-500 shadow-[0_0_5px_#ff0000]"></div>

        <div className="w-full h-48 bg-gb-screen border-4 border-black overflow-hidden relative flex items-center justify-center shadow-inner">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 0.5, ease: "steps(4)" }}
                className="text-4xl text-gb-screen-dark"
              >
                ☯
              </motion.div>
            ) : pokemon ? (
              <motion.div
                key={isShiny ? 'shiny' : 'regular'}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1.5, opacity: 1 }}
                className="flex flex-col items-center"
              >
                <div className="relative">
                  <img
                    src={spriteUrl}
                    alt={pokemon.name}
                    className="w-20 h-20 object-contain drop-shadow-[2px_2px_0px_#0F380F]"
                  />
                  {isShiny && (
                    <span className="absolute -top-2 -right-2 text-lg text-yellow-300 drop-shadow-[1px_1px_0px_#000]">★</span>
                  )}
                </div>
                <p className="mt-4 text-[10px] text-gb-screen-dark text-center uppercase">
                  N.{pokemon.pokedex_number} {pokemon.name}
                </p>
              </motion.div>
            ) : (
              <p className="text-[10px] text-gb-screen-dark text-center px-4 uppercase leading-relaxed">
                Inserta Moneda<br/>Pulse START
              </p>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Action buttons */}
      {pokemon && !loading && (
        <div className="flex gap-2 mt-4 w-full justify-center">
          <button
            onClick={() => setIsShiny(s => !s)}
            className="btn-gameboy text-[10px] px-3 py-1"
          >
            {isShiny ? '★ REGULAR' : '☆ SHINY'}
          </button>
          <button
            onClick={handleCapture}
            disabled={capturing || captured}
            className={`btn-gameboy text-[10px] px-4 py-1 ${captured ? 'opacity-50' : ''}`}
          >
            {captured ? '¡CAPTURADO!' : capturing ? '...' : 'CAPTURAR'}
          </button>
        </div>
      )}

      <div className="w-full mt-6 flex justify-between items-end px-4">
        <div className="w-20 h-20 relative">
          <div className="absolute top-1/4 left-0 w-full h-1/2 bg-black rounded-sm"></div>
          <div className="absolute left-1/4 top-0 w-1/2 h-full bg-black rounded-sm"></div>
          <div className="absolute left-1/4 top-1/4 w-1/2 h-1/2 bg-gray-800 rounded-full shadow-inner"></div>
        </div>

        <div className="flex gap-4 mb-2 rotate-12">
          <button
            onClick={pullGacha}
            disabled={loading}
            className="btn-gameboy w-12 h-12 rounded-full flex items-center justify-center text-[10px] active:translate-y-2 active:translate-x-0"
          >
            B
          </button>
          <button
            onClick={pullGacha}
            disabled={loading}
            className="btn-gameboy w-12 h-12 rounded-full flex items-center justify-center text-[10px] active:translate-y-2 active:translate-x-0 mt-4"
          >
            A
          </button>
        </div>
      </div>
    </div>
  );
};

export default GachaMachine;

import { useState } from 'react';
import { useUser } from '../context/UserContext';
import api from '../api/axios';

export default function UserSetup() {
  const { setUserId } = useUser();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [mode, setMode] = useState('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'register') {
        const { data } = await api.post('/usuarios', {
          username,
          email,
          contrasena: 'temporal'
        });
        setUserId(data.id);
      } else {
        setUserId(username);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Error al conectar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-pokemon-blue flex items-center justify-center p-4">
      <div className="bg-gb-case p-8 rounded-t-3xl rounded-br-[4rem] rounded-bl-3xl border-4 border-black shadow-[10px_10px_0px_rgba(0,0,0,0.4)] w-80">
        <h1 className="text-lg text-center mb-6 text-pokemon-yellow drop-shadow-[2px_2px_0px_#2a3698]">
          GACHAMON
        </h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Username / ID"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="px-3 py-2 text-xs border-2 border-black bg-gb-screen text-gb-screen-dark placeholder:text-gb-screen-dark/50 outline-none"
            required
          />

          {mode === 'register' && (
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="px-3 py-2 text-xs border-2 border-black bg-gb-screen text-gb-screen-dark placeholder:text-gb-screen-dark/50 outline-none"
              required
            />
          )}

          {error && <p className="text-red-600 text-[10px]">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="btn-gameboy text-xs py-2"
          >
            {loading ? '...' : mode === 'register' ? 'REGISTRAR' : 'ENTRAR'}
          </button>
        </form>

        <p className="text-[10px] text-center mt-4 text-gray-600">
          {mode === 'register' ? (
            <>¿Ya tienes cuenta?{' '}<button onClick={() => setMode('login')} className="underline">Entrar</button></>
          ) : (
            <>¿Nuevo?{' '}<button onClick={() => setMode('register')} className="underline">Registrarse</button></>
          )}
        </p>
      </div>
    </div>
  );
}

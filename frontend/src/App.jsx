import GachaMachine from './components/GachaMachine';

function App() {
  return (
    <div className="min-h-screen bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-pokemon-blue flex flex-col items-center justify-center p-4">
      <header className="text-center mb-8">
        <h1 className="text-3xl md:text-5xl text-pokemon-yellow drop-shadow-[4px_4px_0px_#2a3698] tracking-widest">
          POKEMON PC
        </h1>
      </header>

      <main>
        <GachaMachine />
      </main>

      <footer className="mt-8 text-xs text-white drop-shadow-[2px_2px_0px_#000]">
        SilkCorp - UBB 2026
      </footer>
    </div>
  );
}

export default App;
import TodoList from './components/TodoList';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="app-header">
        <h1>Locus Todo App</h1>
        <p className="subtitle">A modern fullstack application demo</p>
      </header>
      <main>
        <TodoList />
      </main>
      <footer className="app-footer">
        <p>Built with React + Vite + TypeScript</p>
      </footer>
    </div>
  );
}

export default App;

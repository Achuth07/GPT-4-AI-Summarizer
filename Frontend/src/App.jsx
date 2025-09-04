import { Provider } from 'react-redux';
import { store } from './store';
import Home from './pages/Home';
import './App.css';

const App = () => {
  return (
    <Provider store={store}>
      <main>
        <div className='main'>
          <div className='gradient' />
        </div>

        <div className='app'>
          <Home />
        </div>
      </main>
    </Provider>
  );
};

export default App;
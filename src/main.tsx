import { render } from 'preact';
import { App } from './app';
import { Gate } from './components/Gate';
import { loadData } from './store';
import './styles.css';

const root = document.getElementById('app')!;

loadData()
  .then(() =>
    render(
      <Gate>
        <App />
      </Gate>,
      root,
    ),
  )
  .catch((e) => {
    root.textContent = 'データを読み込めませんでした: ' + e;
  });

import { useEffect, useState } from 'preact/hooks';
import { Manage } from './screens/Manage';
import { MapView } from './screens/MapView';
import { Settings } from './screens/Settings';
import { Today } from './screens/Today';

const TABS = [
  { path: '/', label: '今日', icon: '●' },
  { path: '/map', label: 'マップ', icon: '◇' },
  { path: '/manage', label: '行動', icon: '≡' },
  { path: '/settings', label: '設定', icon: '⚙' },
];

function parseHash() {
  const raw = location.hash.replace(/^#/, '') || '/';
  const [path, query = ''] = raw.split('?');
  return { path, params: new URLSearchParams(query) };
}

export function App() {
  const [route, setRoute] = useState(parseHash);

  useEffect(() => {
    const onChange = () => {
      setRoute(parseHash());
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  const key = route.path + '?' + route.params.toString();
  let screen;
  switch (route.path) {
    case '/map':
      screen = <MapView />;
      break;
    case '/manage':
      screen = <Manage key={key} editId={route.params.get('edit') ?? undefined} />;
      break;
    case '/settings':
      screen = <Settings />;
      break;
    default:
      screen = <Today />;
  }

  return (
    <>
      {screen}
      <nav class="tabbar">
        {TABS.map((t) => (
          <a href={`#${t.path}`} class={route.path === t.path ? 'tab on' : 'tab'}>
            <span class="tab-icon" aria-hidden="true">
              {t.icon}
            </span>
            {t.label}
          </a>
        ))}
      </nav>
    </>
  );
}

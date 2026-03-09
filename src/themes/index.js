import truefinance from './truefinance';
import rallo from './rallo';

// 1. Dicionário de temas disponíveis
const themes = {
  truefinance,
  rallo
};

// 2. Detecta o cliente via Variável de Ambiente
// Tenta ler do Vite (VITE_CLIENT) ou Create React App (REACT_APP_CLIENT)
// Se não encontrar nada, cai para 'truefinance' como padrão (fallback)
const clientKey = (
  import.meta.env?.VITE_CLIENT || 
  process.env.REACT_APP_CLIENT || 
  'truefinance'
).toLowerCase();

// 3. Exporta o tema selecionado
export const currentTheme = themes[clientKey] || themes.truefinance;

// 4. Função mágica para injetar CSS Variables no :root do HTML
export const applyTheme = () => {
  const root = document.documentElement;
  
  // Percorre todas as cores definidas no tema e aplica no CSS
  Object.entries(currentTheme.colors).forEach(([cssVarName, value]) => {
    root.style.setProperty(cssVarName, value);
  });

  // Opcional: Atualiza o Title da página
  document.title = currentTheme.labels.appName;

  // Atualiza o Favicon dinamicamente
  let favicon = document.querySelector("link[rel~='icon']");
  if (!favicon) {
    favicon = document.createElement('link');
    favicon.rel = 'icon';
    document.head.appendChild(favicon);
  }
  favicon.href = currentTheme.assets.favicon;
};

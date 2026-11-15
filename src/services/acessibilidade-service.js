/**
 * Serviço de preferências DUA (tipografia, escala, espaçamento, contraste e síntese de voz).
 */

import { accessibilityService } from 'fzl-fund-appshell--lit';

const PREFIX =
  typeof __APP_STORAGE_PREFIX__ !== 'undefined' ? __APP_STORAGE_PREFIX__ : 'leitordaldb';
const STORAGE_KEY = `${PREFIX}:a11y-leitura:v1`;

const DEFAULTS = {
  fonte: 'padrao',
  tamanho: 100,
  espacamento: 'normal',
  tema: 'padrao',
  velocidadeFala: 1.0,
};

function carregar() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULTS };
  }
}

let prefs = carregar();

function sincronizarShell(p) {
  const shellFontMap = {
    padrao: 'system',
    atkinson: 'atkinson',
    opendyslexic: 'opendyslexic',
    serifa: 'system',
  };
  const shellFont = shellFontMap[p.fonte];
  if (shellFont && typeof accessibilityService?.setFont === 'function') {
    accessibilityService.setFont(shellFont);
  }

  if (typeof accessibilityService?.setTextScale === 'function') {
    const escala = Math.min(2, Math.max(1, Number((p.tamanho / 100).toFixed(2))));
    accessibilityService.setTextScale(escala);
  }
}

export function aplicarPreferencias(novas = prefs) {
  prefs = { ...DEFAULTS, ...novas };
  const root = document.documentElement;
  root.setAttribute('data-leitura-fonte', prefs.fonte);
  root.setAttribute('data-leitura-espacamento', prefs.espacamento);
  root.style.setProperty('--leitura-font-scale', String(prefs.tamanho / 100));

  if (prefs.tema === 'padrao') {
    root.removeAttribute('data-leitura-tema');
  } else {
    root.setAttribute('data-leitura-tema', prefs.tema);
  }

  sincronizarShell(prefs);

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    /* ignore */
  }

  window.dispatchEvent(new CustomEvent('leitura:a11y-alterada', { detail: { ...prefs } }));
  return { ...prefs };
}

export function getPreferencias() {
  return { ...prefs };
}

export function resetarPreferencias() {
  return aplicarPreferencias({ ...DEFAULTS });
}

/* Síntese de voz (Web Speech API — pt-BR) */
let falandoAtivo = false;
let falandoId = null;

function notificarFala() {
  window.dispatchEvent(
    new CustomEvent('leitura:fala-estado', {
      detail: { falando: falandoAtivo, id: falandoId },
    })
  );
}

export function ttsSuportado() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function getEstadoFala() {
  return { falando: falandoAtivo, id: falandoId };
}

export function pararLeitura() {
  if (ttsSuportado()) {
    window.speechSynthesis.cancel();
  }
  falandoAtivo = false;
  falandoId = null;
  notificarFala();
}

export function lerEmVozAlta(texto, id = null) {
  if (!ttsSuportado() || !texto) return false;
  window.speechSynthesis.cancel();

  const utter = new SpeechSynthesisUtterance(texto);
  utter.lang = 'pt-BR';
  utter.rate = Number(prefs.velocidadeFala) || 1.0;

  const voices = window.speechSynthesis.getVoices();
  const ptVoice = voices.find((v) => v.lang?.toLowerCase().startsWith('pt'));
  if (ptVoice) utter.voice = ptVoice;

  falandoAtivo = true;
  falandoId = id;
  notificarFala();

  utter.onend = () => {
    falandoAtivo = false;
    falandoId = null;
    notificarFala();
  };
  utter.onerror = () => {
    falandoAtivo = false;
    falandoId = null;
    notificarFala();
  };

  window.speechSynthesis.speak(utter);
  return true;
}

// Aplica preferências iniciais na carga do módulo
aplicarPreferencias(prefs);

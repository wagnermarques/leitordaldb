/**
 * Serviço de estudo pessoal (grifos, notas, favoritos e rótulos customizáveis)
 * persistido localmente em localStorage sem envio a servidores externos.
 */

import { MAPA_CORES_GRIFO } from '../grifos.js';

const PREFIX =
  typeof __APP_STORAGE_PREFIX__ !== 'undefined' ? __APP_STORAGE_PREFIX__ : 'leitordaldb';
const STORAGE_KEY = `${PREFIX}:estudo:v1`;

function estadoInicial() {
  return {
    grifos: {},
    notas: {},
    favoritos: [],
    rotulosCores: {},
  };
}

function carregarEstado() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return estadoInicial();
    const parsed = JSON.parse(raw);
    return {
      grifos: parsed.grifos || {},
      notas: parsed.notas || {},
      favoritos: Array.isArray(parsed.favoritos) ? parsed.favoritos : [],
      rotulosCores: parsed.rotulosCores || {},
    };
  } catch {
    return estadoInicial();
  }
}

let cache = carregarEstado();

function salvar() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  } catch {
    /* localStorage indisponível (modo privado estrito) */
  }
  window.dispatchEvent(new CustomEvent('estudo:alterado', { detail: cache }));
}

export function getGrifo(dispId) {
  return cache.grifos[dispId] || null;
}

export function setGrifo({ id, caminho, normaSigla, rotulo, textoResumo, cor }) {
  cache.grifos[id] = {
    id,
    caminho,
    normaSigla: normaSigla || 'LDB',
    rotulo,
    textoResumo: String(textoResumo || '').slice(0, 280),
    cor,
    atualizadoEm: new Date().toISOString(),
  };
  salvar();
}

export function removerGrifo(dispId) {
  if (cache.grifos[dispId]) {
    delete cache.grifos[dispId];
    salvar();
  }
}

export function listarGrifos() {
  return Object.values(cache.grifos).sort((a, b) =>
    (b.atualizadoEm || '').localeCompare(a.atualizadoEm || '')
  );
}

export function getNota(dispId) {
  return cache.notas[dispId] || null;
}

export function setNota({ id, caminho, normaSigla, rotulo, textoResumo, texto }) {
  const limpo = String(texto || '').trim();
  if (!limpo) {
    removerNota(id);
    return;
  }
  cache.notas[id] = {
    id,
    caminho,
    normaSigla: normaSigla || 'LDB',
    rotulo,
    textoResumo: String(textoResumo || '').slice(0, 220),
    texto: limpo,
    atualizadoEm: new Date().toISOString(),
  };
  salvar();
}

export function removerNota(dispId) {
  if (cache.notas[dispId]) {
    delete cache.notas[dispId];
    salvar();
  }
}

export function listarNotas() {
  return Object.values(cache.notas).sort((a, b) =>
    (b.atualizadoEm || '').localeCompare(a.atualizadoEm || '')
  );
}

export function isFavorito(dispId) {
  return cache.favoritos.includes(dispId);
}

export function toggleFavorito(dispId) {
  if (isFavorito(dispId)) {
    cache.favoritos = cache.favoritos.filter((x) => x !== dispId);
  } else {
    cache.favoritos = [...cache.favoritos, dispId];
  }
  salvar();
  return isFavorito(dispId);
}

export function getRotuloCor(corId) {
  return cache.rotulosCores[corId] || MAPA_CORES_GRIFO[corId]?.padraoPara || corId;
}

export function setRotuloCor(corId, novoRotulo) {
  const limpo = String(novoRotulo || '').trim();
  if (!limpo) {
    delete cache.rotulosCores[corId];
  } else {
    cache.rotulosCores[corId] = limpo;
  }
  salvar();
}

export function resetRotulosCores() {
  cache.rotulosCores = {};
  salvar();
}

export function limparEstudo() {
  cache = estadoInicial();
  salvar();
}

export function exportarEstudoMarkdown() {
  const grifos = listarGrifos();
  const notas = listarNotas();
  const linhas = [
    '# Caderno de Estudos — Leitor da LDB (GEPIS/Unesp)',
    `Exportado em: ${new Date().toLocaleString('pt-BR')}`,
    '',
    '## Grifos Salvos',
    '',
  ];

  if (!grifos.length) {
    linhas.push('_Nenhum grifo registrado até o momento._', '');
  } else {
    for (const g of grifos) {
      const cat = getRotuloCor(g.cor);
      linhas.push(`- **[${g.normaSigla}] ${g.rotulo}** (${g.cor} — ${cat})`);
      linhas.push(`  > ${g.textoResumo}`);
      const nota = getNota(g.id);
      if (nota) {
        linhas.push(`  - **Nota:** ${nota.texto}`);
      }
    }
    linhas.push('');
  }

  const notasSemGrifo = notas.filter((n) => !cache.grifos[n.id]);
  if (notasSemGrifo.length) {
    linhas.push('## Notas Avulsas', '');
    for (const n of notasSemGrifo) {
      linhas.push(`- **[${n.normaSigla}] ${n.rotulo}**`);
      if (n.textoResumo) linhas.push(`  > ${n.textoResumo}`);
      linhas.push(`  - **Nota:** ${n.texto}`);
    }
  }

  return linhas.join('\n');
}

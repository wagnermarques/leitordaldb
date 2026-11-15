/**
 * Serviço de leitura, indexação e busca do acervo legislativo da LDB e CF/88.
 */

export const EIXOS_TEMATICOS = [
  'Princípios, Fins e Direito à Educação',
  'Organização e Regime de Colaboração',
  'Educação Básica e Etapas',
  'Educação Profissional e Tecnológica',
  'Educação Superior',
  'Educação Especial, Bilíngue e Inclusiva',
  'Modalidades e Diversidade',
  'Profissionais da Educação',
  'Financiamento e Recursos',
];

let indiceCache = null;
const normasCache = new Map();

function dataUrl(relativo) {
  const base = import.meta.env.BASE_URL || '/';
  return `${base}data/${relativo}`.replace(/\/+/g, '/');
}

export function normalizarTexto(texto = '') {
  return String(texto)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export async function carregarIndice() {
  if (indiceCache) return indiceCache;
  const resp = await fetch(dataUrl('indice.json'));
  if (!resp.ok) {
    throw new Error(`Falha ao carregar índice do acervo (HTTP ${resp.status}).`);
  }
  indiceCache = await resp.json();
  return indiceCache;
}

export async function carregarNorma(caminho) {
  const cleanPath = String(caminho || '').replace(/^\/+|\/+$/g, '');
  if (normasCache.has(cleanPath)) {
    return normasCache.get(cleanPath);
  }

  const [normaResp, estResp, dispResp] = await Promise.all([
    fetch(dataUrl(`${cleanPath}/norma.json`)),
    fetch(dataUrl(`${cleanPath}/estrutura.json`)),
    fetch(dataUrl(`${cleanPath}/dispositivos.json`)),
  ]);

  if (!normaResp.ok || !estResp.ok || !dispResp.ok) {
    throw new Error(`Norma não encontrada em "${cleanPath}".`);
  }

  const [norma, estrutura, dispositivos] = await Promise.all([
    normaResp.json(),
    estResp.json(),
    dispResp.json(),
  ]);

  const mapa = new Map(dispositivos.map((d) => [d.id, d]));
  const bundle = { caminho: cleanPath, norma, estrutura, dispositivos, mapa };
  normasCache.set(cleanPath, bundle);
  return bundle;
}

export function versaoVigente(disp) {
  if (!disp?.versoes?.length) return null;
  return disp.versoes[disp.versoes.length - 1];
}

export function profundidade(disp, mapa) {
  let depth = 0;
  let cursor = disp?.pai;
  const guard = new Set();
  while (cursor && mapa.has(cursor) && !guard.has(cursor)) {
    guard.add(cursor);
    depth += 1;
    cursor = mapa.get(cursor).pai;
  }
  return depth;
}

function primeiroArtigoDaDivisao(node) {
  if (!node) return null;
  if (node.tipo === 'artigo' && node.id) return node.id;
  for (const filho of node.filhos || []) {
    const found = primeiroArtigoDaDivisao(filho);
    if (found) return found;
  }
  return null;
}

/**
 * Extrai divisões hierárquicas (Título, Capítulo, Seção) com id do primeiro artigo.
 */
export function divisoesDoSumario(estrutura = [], maxDepth = 3) {
  const resultado = [];

  function percorrer(nos, depth) {
    if (depth > maxDepth) return;
    for (const no of nos || []) {
      if (no.tipo !== 'artigo') {
        resultado.push({
          tipo: no.tipo,
          rotulo: no.rotulo,
          rubrica: no.rubrica || '',
          nota: no.nota || '',
          depth,
          primeiroArtigoId: primeiroArtigoDaDivisao(no),
        });
        percorrer(no.filhos, depth + 1);
      }
    }
  }

  percorrer(estrutura, 1);
  return resultado;
}

/**
 * Busca global por palavra-chave, número de artigo, lei alteradora ou eixo temático.
 */
export async function buscarEmTodasNormas(termo = '', { tema = '', apenasAlterados = false } = {}) {
  const indice = await carregarIndice();
  const termoNorm = normalizarTexto(termo);
  const tokens = termoNorm ? termoNorm.split(/\s+/).filter(Boolean) : [];
  const temaNorm = normalizarTexto(tema);

  if (!tokens.length && !temaNorm && !apenasAlterados) {
    return [];
  }

  const pacotes = await Promise.all(indice.map((item) => carregarNorma(item.caminho)));
  const resultados = [];

  for (const pacote of pacotes) {
    const { norma, caminho, dispositivos, mapa } = pacote;
    for (const disp of dispositivos) {
      const versao = versaoVigente(disp);
      const texto = versao?.texto || '';
      const alterado = (versao?.evento && versao.evento !== 'original') || (disp.observacoes?.length > 0);

      if (apenasAlterados && !alterado) continue;
      if (temaNorm && !(disp.temas || []).some((t) => normalizarTexto(t) === temaNorm)) continue;

      if (tokens.length) {
        const paiRotulo = disp.pai && mapa.get(disp.pai) ? mapa.get(disp.pai).rotulo : '';
        const alvo = normalizarTexto(
          `${disp.rotulo} ${paiRotulo} ${texto} ${(disp.observacoes || []).join(' ')} ${(disp.temas || []).join(' ')}`
        );
        if (!tokens.every((tok) => alvo.includes(tok))) continue;
      }

      resultados.push({
        caminho,
        norma,
        disp,
        versao,
        texto,
        alterado,
        paiRotulo: disp.pai && mapa.get(disp.pai) ? mapa.get(disp.pai).rotulo : '',
      });
    }
  }

  return resultados;
}

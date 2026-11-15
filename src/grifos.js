/**
 * Paleta pedagógica de marcação para estudo da LDB (Lei nº 9.394/1996)
 * e utilitário de citação conforme ABNT NBR 6023.
 */

export const CORES_GRIFO = [
  {
    id: 'amarelo',
    nome: 'Amarelo',
    padraoPara: 'Princípios, direitos e deveres do Estado',
    swatch: '#ffd43b',
    bg: '#fff3a8',
    bgDark: 'rgba(255, 212, 59, 0.25)',
    border: '#c99700',
  },
  {
    id: 'verde',
    nome: 'Verde',
    padraoPara: 'Educação Básica, Educação Especial e inclusão',
    swatch: '#51cf66',
    bg: '#d3f9d8',
    bgDark: 'rgba(81, 207, 102, 0.24)',
    border: '#2b8a3e',
  },
  {
    id: 'azul',
    nome: 'Azul',
    padraoPara: 'Organização, competências dos entes e colaboração',
    swatch: '#4dabf7',
    bg: '#d0ebff',
    bgDark: 'rgba(77, 171, 247, 0.26)',
    border: '#1971c2',
  },
  {
    id: 'rosa',
    nome: 'Rosa',
    padraoPara: 'Profissionais da educação, formação e carreira',
    swatch: '#f06595',
    bg: '#ffdeeb',
    bgDark: 'rgba(240, 101, 149, 0.25)',
    border: '#a61e4d',
  },
  {
    id: 'roxo',
    nome: 'Roxo',
    padraoPara: 'Alterações legislativas, vigência e financiamento',
    swatch: '#9775fa',
    bg: '#e5dbff',
    bgDark: 'rgba(151, 117, 250, 0.26)',
    border: '#5f3dc4',
  },
];

export const MAPA_CORES_GRIFO = Object.fromEntries(CORES_GRIFO.map((c) => [c.id, c]));

/**
 * Gera referência bibliográfica ABNT NBR 6023 para norma ou dispositivo específico.
 */
export function formatarCitacaoABNT(norma, disp = null) {
  if (!norma) return '';
  const hoje = new Date();
  const meses = [
    'jan.', 'fev.', 'mar.', 'abr.', 'maio', 'jun.',
    'jul.', 'ago.', 'set.', 'out.', 'nov.', 'dez.',
  ];
  const acesso = `${String(hoje.getDate()).padStart(2, '0')} ${meses[hoje.getMonth()]} ${hoje.getFullYear()}`;
  const dispositivo = disp?.rotulo ? ` ${disp.rotulo}.` : '';
  const url = norma.urlFonte ? ` Disponível em: ${norma.urlFonte}.` : '';

  if ((norma.categoria || '').toLowerCase().includes('constitui')) {
    return `BRASIL. [Constituição (1988)]. Constituição da República Federativa do Brasil de 1988.${dispositivo} Brasília, DF: Senado Federal, 1988.${url} Acesso em: ${acesso}.`;
  }

  return `BRASIL. ${norma.nome} (${norma.sigla}). ${norma.ementa || ''}${dispositivo} Brasília, DF: Presidência da República, ${norma.ano || 1996}.${url} Acesso em: ${acesso}.`.replace(/\.\./g, '.');
}

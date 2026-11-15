import { LitElement, html, css } from 'lit';
import {
  EIXOS_TEMATICOS,
  carregarNorma,
  divisoesDoSumario,
  normalizarTexto,
  profundidade,
  versaoVigente,
} from '../services/dados-service.js';
import { CORES_GRIFO, MAPA_CORES_GRIFO, formatarCitacaoABNT } from '../grifos.js';
import {
  getGrifo,
  getNota,
  getRotuloCor,
  isFavorito,
  removerGrifo,
  removerNota,
  setGrifo,
  setNota,
  toggleFavorito,
} from '../services/estudo-service.js';
import {
  getEstadoFala,
  lerEmVozAlta,
  pararLeitura,
  ttsSuportado,
} from '../services/acessibilidade-service.js';

/**
 * Visualizador integral acessível de normas educacionais (LDB e CF/88)
 * com filtros por eixo temático, alterações legislativas, salto rápido,
 * grifos pedagógicos, notas pessoais, citação ABNT e leitura em voz alta.
 */
export class NormaView extends LitElement {
  static properties = {
    caminho: { type: String },
    ir: { type: String },
    tema: { type: String },
    alterados: { type: Boolean },
    _bundle: { type: Object, state: true },
    _childrenMap: { type: Object, state: true },
    _divisoes: { type: Array, state: true },
    _erro: { type: String, state: true },
    _carregando: { type: Boolean, state: true },
    _filtroTexto: { type: String, state: true },
    _filtroTema: { type: String, state: true },
    _apenasAlterados: { type: Boolean, state: true },
    _ocultarRevogados: { type: Boolean, state: true },
    _mostrarObs: { type: Boolean, state: true },
    _saltoArtigo: { type: String, state: true },
    _selecionadoId: { type: String, state: true },
    _editandoNota: { type: Boolean, state: true },
    _rascunhoNota: { type: String, state: true },
    _feedback: { type: String, state: true },
    _falaEstado: { type: Object, state: true },
    _estudoVersao: { type: Number, state: true },
  };

  static styles = css`
    :host {
      display: block;
      max-width: var(--leitura-max-width, 76ch);
      margin: 0 auto;
      padding: 18px 16px 120px;
      font-family: var(--leitura-font-family, system-ui, sans-serif);
      color: var(--leitura-fg, #14171a);
      letter-spacing: var(--leitura-letter-spacing, 0em);
      word-spacing: var(--leitura-word-spacing, 0em);
    }
    .norma-header {
      background: var(--leitura-surface, #f4f6f9);
      border: 1px solid var(--leitura-border, #cbd4e1);
      border-radius: 16px;
      padding: 18px 20px;
      margin-bottom: 16px;
    }
    .norma-header h1 {
      margin: 0 0 6px;
      font-size: 1.45rem;
      color: var(--leitura-accent, #1f3a5f);
    }
    .ementa {
      margin: 6px 0 12px;
      font-style: italic;
      color: var(--leitura-muted, #454f5e);
      line-height: 1.5;
    }
    .meta-row {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      align-items: center;
      font-size: 0.85rem;
    }
    .toolbar {
      position: sticky;
      top: 8px;
      z-index: 20;
      background: var(--leitura-bg, #ffffff);
      border: 1px solid var(--leitura-border, #cbd4e1);
      border-radius: 14px;
      padding: 12px 14px;
      margin-bottom: 20px;
      box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .toolbar-row {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      align-items: center;
    }
    .toolbar input[type='search'],
    .toolbar input[type='text'],
    .toolbar select {
      min-height: 36px;
      padding: 0 10px;
      border-radius: 8px;
      border: 1px solid var(--leitura-border, #cbd4e1);
      background: var(--leitura-surface, #f4f6f9);
      color: var(--leitura-fg, #14171a);
      font-family: inherit;
      font-size: 0.88rem;
    }
    .toolbar .grow {
      flex: 1 1 200px;
    }
    .btn {
      cursor: pointer;
      min-height: 34px;
      padding: 4px 12px;
      border-radius: 999px;
      border: 1px solid var(--leitura-border, #cbd4e1);
      background: var(--leitura-surface, #f4f6f9);
      color: var(--leitura-fg, #14171a);
      font-family: inherit;
      font-size: 0.84rem;
      font-weight: 600;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 5px;
    }
    .btn-primary {
      background: var(--leitura-accent, #1f3a5f);
      color: var(--leitura-accent-fg, #ffffff);
      border-color: var(--leitura-accent, #1f3a5f);
    }
    .btn[aria-pressed='true'] {
      background: var(--leitura-accent, #1f3a5f);
      color: var(--leitura-accent-fg, #ffffff);
      border-color: var(--leitura-accent, #1f3a5f);
    }
    .div-titulo {
      margin: 28px 0 8px;
      padding-bottom: 6px;
      border-bottom: 2px solid var(--leitura-accent, #1f3a5f);
      color: var(--leitura-accent, #1f3a5f);
      font-size: 1.25rem;
    }
    .div-capitulo {
      margin: 22px 0 6px;
      color: var(--leitura-accent, #1f3a5f);
      font-size: 1.1rem;
    }
    .div-secao,
    .div-subsecao {
      margin: 16px 0 4px;
      font-size: 1rem;
      color: var(--leitura-muted, #454f5e);
    }
    .div-rubrica {
      display: block;
      font-weight: 600;
      font-size: 0.92em;
      color: var(--leitura-fg, #14171a);
    }
    .div-nota {
      margin: 0 0 10px;
      font-size: 0.82rem;
      color: var(--leitura-muted, #454f5e);
      font-style: italic;
    }
    .artigo-card {
      background: var(--leitura-bg, #ffffff);
      border: 1px solid var(--leitura-border, #cbd4e1);
      border-radius: 12px;
      padding: 12px 14px;
      margin-bottom: 12px;
    }
    .disp-item {
      padding: 6px 10px;
      border-radius: 8px;
      border-left: 4px solid transparent;
      cursor: pointer;
      line-height: var(--leitura-line-height, 1.68);
      transition: background-color 0.12s ease, border-color 0.12s ease;
    }
    .disp-item:hover {
      background: var(--leitura-surface, #f4f6f9);
    }
    .disp-item.selected {
      outline: 2px solid var(--leitura-accent, #1f3a5f);
      outline-offset: 1px;
    }
    .disp-item.alvo-ir {
      box-shadow: 0 0 0 3px var(--leitura-focus-ring, #b85d00);
    }
    .disp-item.depth-1 {
      margin-left: 14px;
    }
    .disp-item.depth-2 {
      margin-left: 30px;
    }
    .disp-item.depth-3,
    .disp-item.depth-4 {
      margin-left: 44px;
    }
    .disp-rotulo {
      font-weight: 700;
      margin-right: 6px;
      color: var(--leitura-accent, #1f3a5f);
    }
    .disp-texto.revogado {
      text-decoration: line-through;
      opacity: 0.72;
    }
    .disp-texto.vetado {
      opacity: 0.78;
      font-style: italic;
    }
    .badges {
      display: inline-flex;
      flex-wrap: wrap;
      gap: 4px;
      margin-left: 6px;
      vertical-align: middle;
    }
    .badge {
      display: inline-block;
      padding: 1px 7px;
      border-radius: 999px;
      font-size: 0.72rem;
      font-weight: 700;
      border: 1px solid var(--leitura-border, #cbd4e1);
      background: var(--leitura-surface, #f4f6f9);
    }
    .obs-box {
      margin: 4px 0 2px;
      font-size: 0.8rem;
      color: var(--leitura-muted, #454f5e);
      font-style: italic;
    }
    .nota-pessoal {
      margin: 6px 0 2px;
      padding: 6px 10px;
      border-radius: 8px;
      background: var(--leitura-surface, #f4f6f9);
      border: 1px dashed var(--leitura-accent, #1f3a5f);
      font-size: 0.86rem;
    }
    .floating-dock {
      position: fixed;
      left: 50%;
      bottom: 44px;
      transform: translateX(-50%);
      z-index: 40;
      width: min(680px, calc(100vw - 24px));
      background: var(--leitura-bg, #ffffff);
      border: 2px solid var(--leitura-accent, #1f3a5f);
      border-radius: 16px;
      padding: 12px 14px;
      box-shadow: 0 14px 36px rgba(0, 0, 0, 0.25);
    }
    .dock-row {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      align-items: center;
      justify-content: space-between;
    }
    .swatch {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      border: 2px solid rgba(0, 0, 0, 0.3);
      cursor: pointer;
    }
    .swatch[aria-pressed='true'] {
      outline: 3px solid var(--leitura-accent, #1f3a5f);
      outline-offset: 2px;
    }
    textarea {
      width: 100%;
      box-sizing: border-box;
      min-height: 76px;
      margin-top: 8px;
      padding: 8px 10px;
      border-radius: 8px;
      border: 1px solid var(--leitura-border, #cbd4e1);
      background: var(--leitura-surface, #f4f6f9);
      color: var(--leitura-fg, #14171a);
      font-family: inherit;
      font-size: 0.9rem;
    }
    .toast {
      font-size: 0.84rem;
      color: var(--leitura-accent, #1f3a5f);
      font-weight: 700;
    }
  `;

  constructor() {
    super();
    this.caminho = 'br/federal/lei/1996-9394';
    this.ir = '';
    this.tema = '';
    this.alterados = false;
    this._bundle = null;
    this._childrenMap = new Map();
    this._divisoes = [];
    this._erro = '';
    this._carregando = true;
    this._filtroTexto = '';
    this._filtroTema = '';
    this._apenasAlterados = false;
    this._ocultarRevogados = false;
    this._mostrarObs = true;
    this._saltoArtigo = '';
    this._selecionadoId = '';
    this._editandoNota = false;
    this._rascunhoNota = '';
    this._feedback = '';
    this._falaEstado = getEstadoFala();
    this._estudoVersao = 0;

    this._onEstudo = () => {
      this._estudoVersao += 1;
    };
    this._onFala = (e) => {
      this._falaEstado = e.detail;
    };
  }

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener('estudo:alterado', this._onEstudo);
    window.addEventListener('leitura:fala-estado', this._onFala);
    this._carregar();
  }

  disconnectedCallback() {
    window.removeEventListener('estudo:alterado', this._onEstudo);
    window.removeEventListener('leitura:fala-estado', this._onFala);
    super.disconnectedCallback();
  }

  updated(changed) {
    if (changed.has('caminho') && changed.get('caminho') !== undefined) {
      this._carregar();
    }
    if (changed.has('tema')) {
      this._filtroTema = this.tema || '';
    }
    if (changed.has('alterados')) {
      this._apenasAlterados = Boolean(this.alterados);
    }
    if (changed.has('ir') && this.ir && this._bundle) {
      this._scrollParaDispositivo(this.ir);
    }
  }

  async _carregar() {
    this._carregando = true;
    this._erro = '';
    this._filtroTema = this.tema || '';
    this._apenasAlterados = Boolean(this.alterados);
    try {
      const bundle = await carregarNorma(this.caminho);
      const childrenMap = new Map();
      for (const d of bundle.dispositivos) {
        if (!d.pai) continue;
        if (!childrenMap.has(d.pai)) childrenMap.set(d.pai, []);
        childrenMap.get(d.pai).push(d);
      }
      this._bundle = bundle;
      this._childrenMap = childrenMap;
      this._divisoes = divisoesDoSumario(bundle.estrutura, 2);
      await this.updateComplete;
      if (this.ir) {
        this._scrollParaDispositivo(this.ir);
      }
    } catch (err) {
      this._erro = err.message || 'Erro ao carregar norma.';
    } finally {
      this._carregando = false;
    }
  }

  _scrollParaDispositivo(id) {
    requestAnimationFrame(() => {
      const el = this.shadowRoot?.getElementById(`disp-${id}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  }

  _saltarParaArtigo(e) {
    e.preventDefault();
    if (!this._bundle) return;
    const raw = this._saltoArtigo.trim().toLowerCase().replace(/^art\.?\s*/i, '');
    if (!raw) return;
    const alvoNorm = normalizarTexto(raw);
    const artigo = this._bundle.dispositivos.find((d) => {
      if (d.tipo !== 'artigo') return false;
      const rotNorm = normalizarTexto(d.rotulo.replace(/^Art\.\s*/i, '').replace(/[º°]/g, ''));
      const rawClean = alvoNorm.replace(/[º°]/g, '');
      return rotNorm === rawClean || rotNorm.startsWith(rawClean);
    });
    if (artigo) {
      this._selecionadoId = artigo.id;
      this._scrollParaDispositivo(artigo.id);
      this._feedback = `Localizado ${artigo.rotulo}.`;
    } else {
      this._feedback = `Artigo "${this._saltoArtigo}" não encontrado nesta norma.`;
    }
  }

  _coletarSubarvore(rootDisp) {
    const lista = [rootDisp];
    const filhos = this._childrenMap.get(rootDisp.id) || [];
    for (const f of filhos) {
      lista.push(...this._coletarSubarvore(f));
    }
    return lista;
  }

  _dispCasaFiltros(disp, tokens, temaNorm) {
    const v = versaoVigente(disp);
    const evento = v?.evento || 'original';
    if (this._ocultarRevogados && (evento === 'revogado' || evento === 'vetado')) {
      return false;
    }
    const alterado = evento !== 'original' || (disp.observacoes?.length > 0);
    if (this._apenasAlterados && !alterado) return false;
    if (temaNorm && !(disp.temas || []).some((t) => normalizarTexto(t) === temaNorm)) {
      return false;
    }
    if (tokens.length) {
      const texto = v?.texto || '';
      const alvo = normalizarTexto(
        `${disp.rotulo} ${texto} ${(disp.observacoes || []).join(' ')}`
      );
      if (!tokens.every((tok) => alvo.includes(tok))) return false;
    }
    return true;
  }

  _artigoVisivel(artId, tokens, temaNorm) {
    const root = this._bundle.mapa.get(artId);
    if (!root) return false;
    const sub = this._coletarSubarvore(root);
    return sub.some((d) => this._dispCasaFiltros(d, tokens, temaNorm));
  }

  _selecionar(disp) {
    if (this._selecionadoId === disp.id) {
      this._selecionadoId = '';
      this._editandoNota = false;
      return;
    }
    this._selecionadoId = disp.id;
    this._editandoNota = false;
    this._rascunhoNota = getNota(disp.id)?.texto || '';
  }

  _textoParaFala(disp) {
    if (disp.tipo === 'artigo') {
      const sub = this._coletarSubarvore(disp);
      return sub
        .map((d) => `${d.rotulo}. ${versaoVigente(d)?.texto || ''}`)
        .join(' ');
    }
    return `${disp.rotulo}. ${versaoVigente(disp)?.texto || ''}`;
  }

  async _copiarABNT(disp = null) {
    if (!this._bundle) return;
    const citacao = formatarCitacaoABNT(this._bundle.norma, disp);
    try {
      await navigator.clipboard.writeText(citacao);
      this._feedback = disp
        ? `Citação ABNT de ${disp.rotulo} copiada.`
        : 'Citação ABNT da norma copiada.';
    } catch {
      this._feedback = citacao;
    }
  }

  _renderBadgeEvento(disp, versao) {
    const evento = versao?.evento || 'original';
    const etiquetas = {
      revogado: 'Revogado',
      vetado: 'Vetado',
      incluido: 'Acrescido',
      'redacao-dada': 'Redação alterada',
    };
    const label = etiquetas[evento];
    if (!label && !versao?.origem) return '';
    return html`
      <span class="badges">
        ${label ? html`<span class="badge">${label}</span>` : ''}
        ${versao?.origem ? html`<span class="badge">${versao.origem}</span>` : ''}
      </span>
    `;
  }

  _renderDispositivo(disp, tokens, temaNorm) {
    const v = versaoVigente(disp);
    const evento = v?.evento || 'original';
    if (this._ocultarRevogados && (evento === 'revogado' || evento === 'vetado')) {
      return '';
    }

    const depth = profundidade(disp, this._bundle.mapa);
    const grifo = getGrifo(disp.id);
    const nota = getNota(disp.id);
    const fav = isFavorito(disp.id);
    const corObj = grifo ? MAPA_CORES_GRIFO[grifo.cor] : null;
    const estiloGrifo = corObj
      ? `background: color-mix(in srgb, ${corObj.swatch} 26%, transparent); border-left-color: ${corObj.border};`
      : '';

    const classesItem = [
      'disp-item',
      `depth-${Math.min(depth, 4)}`,
      this._selecionadoId === disp.id ? 'selected' : '',
      this.ir === disp.id ? 'alvo-ir' : '',
    ]
      .filter(Boolean)
      .join(' ');

    const classesTexto = [
      'disp-texto',
      evento === 'revogado' ? 'revogado' : '',
      evento === 'vetado' ? 'vetado' : '',
    ]
      .filter(Boolean)
      .join(' ');

    const filhos = this._childrenMap.get(disp.id) || [];

    return html`
      <div
        id=${`disp-${disp.id}`}
        class=${classesItem}
        style=${estiloGrifo}
        role="button"
        tabindex="0"
        aria-pressed=${this._selecionadoId === disp.id}
        @click=${(e) => {
          e.stopPropagation();
          this._selecionar(disp);
        }}
        @keydown=${(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            e.stopPropagation();
            this._selecionar(disp);
          }
        }}
      >
        <span class="disp-rotulo">
          ${fav ? '★ ' : ''}${disp.rotulo}
        </span>
        <span class=${classesTexto}>${v?.texto || ''}</span>
        ${this._renderBadgeEvento(disp, v)}
        ${this._mostrarObs && disp.observacoes?.length
          ? html`<div class="obs-box">(${disp.observacoes.join(' • ')})</div>`
          : ''}
        ${nota
          ? html`<div class="nota-pessoal"><strong>Nota:</strong> ${nota.texto}</div>`
          : ''}
      </div>
      ${filhos.map((f) => this._renderDispositivo(f, tokens, temaNorm))}
    `;
  }

  _renderNoEstrutura(node, tokens, temaNorm) {
    if (node.tipo === 'artigo') {
      if (!this._artigoVisivel(node.id, tokens, temaNorm)) return null;
      const disp = this._bundle.mapa.get(node.id);
      return html`
        <article class="artigo-card">
          ${this._renderDispositivo(disp, tokens, temaNorm)}
        </article>
      `;
    }

    const filhosRenderizados = (node.filhos || [])
      .map((f) => this._renderNoEstrutura(f, tokens, temaNorm))
      .filter(Boolean);

    if (!filhosRenderizados.length) return null;

    const cabecalho = html`
      ${node.tipo === 'titulo'
        ? html`
            <h2 class="div-titulo">
              ${node.rotulo}
              ${node.rubrica ? html`<span class="div-rubrica">${node.rubrica}</span>` : ''}
            </h2>
          `
        : node.tipo === 'capitulo'
        ? html`
            <h3 class="div-capitulo">
              ${node.rotulo}
              ${node.rubrica ? html`<span class="div-rubrica">${node.rubrica}</span>` : ''}
            </h3>
          `
        : html`
            <h4 class="div-secao">
              ${node.rotulo}
              ${node.rubrica ? html`<span class="div-rubrica">${node.rubrica}</span>` : ''}
            </h4>
          `}
      ${this._mostrarObs && node.nota
        ? html`<p class="div-nota">(${node.nota})</p>`
        : ''}
    `;

    return html`${cabecalho}${filhosRenderizados}`;
  }

  _renderDock() {
    if (!this._selecionadoId || !this._bundle) return '';
    const disp = this._bundle.mapa.get(this._selecionadoId);
    if (!disp) return '';
    const v = versaoVigente(disp);
    const grifoAtual = getGrifo(disp.id);
    const fav = isFavorito(disp.id);
    const falandoEste =
      this._falaEstado.falando && this._falaEstado.id === disp.id;

    return html`
      <div
        class="floating-dock"
        role="toolbar"
        aria-label="Ferramentas de estudo do dispositivo selecionado"
      >
        <div class="dock-row">
          <strong>${disp.rotulo}</strong>
          <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;">
            ${CORES_GRIFO.map(
              (c) => html`
                <button
                  type="button"
                  class="swatch"
                  style=${`background:${c.swatch}`}
                  title=${`${c.nome}: ${getRotuloCor(c.id)}`}
                  aria-label=${`Grifar de ${c.nome}: ${getRotuloCor(c.id)}`}
                  aria-pressed=${grifoAtual?.cor === c.id}
                  @click=${() => {
                    if (grifoAtual?.cor === c.id) {
                      removerGrifo(disp.id);
                    } else {
                      setGrifo({
                        id: disp.id,
                        caminho: this.caminho,
                        normaSigla: this._bundle.norma.sigla,
                        rotulo: disp.rotulo,
                        textoResumo: v?.texto || '',
                        cor: c.id,
                      });
                    }
                  }}
                ></button>
              `
            )}
            ${grifoAtual
              ? html`
                  <button
                    type="button"
                    class="btn"
                    @click=${() => removerGrifo(disp.id)}
                  >
                    Sem grifo
                  </button>
                `
              : ''}
            <button
              type="button"
              class="btn"
              aria-pressed=${fav}
              @click=${() => toggleFavorito(disp.id)}
            >
              ${fav ? '★ Favorito' : '☆ Favoritar'}
            </button>
            <button
              type="button"
              class="btn"
              aria-pressed=${this._editandoNota}
              @click=${() => {
                this._editandoNota = !this._editandoNota;
                this._rascunhoNota = getNota(disp.id)?.texto || '';
              }}
            >
              Nota
            </button>
            <button
              type="button"
              class="btn"
              @click=${() => this._copiarABNT(disp)}
            >
              ABNT
            </button>
            ${ttsSuportado()
              ? html`
                  <button
                    type="button"
                    class="btn"
                    @click=${() => {
                      if (falandoEste) {
                        pararLeitura();
                      } else {
                        lerEmVozAlta(this._textoParaFala(disp), disp.id);
                      }
                    }}
                  >
                    ${falandoEste ? 'Parar áudio' : 'Ouvir'}
                  </button>
                `
              : ''}
            <button
              type="button"
              class="btn"
              aria-label="Fechar barra de ferramentas"
              @click=${() => {
                this._selecionadoId = '';
                this._editandoNota = false;
              }}
            >
              Fechar
            </button>
          </div>
        </div>

        ${this._editandoNota
          ? html`
              <div>
                <textarea
                  aria-label="Anotação pessoal sobre este dispositivo"
                  placeholder="Escreva sua observação pedagógica ou jurídica…"
                  .value=${this._rascunhoNota}
                  @input=${(e) => {
                    this._rascunhoNota = e.target.value;
                  }}
                ></textarea>
                <div style="display:flex;gap:8px;margin-top:8px;">
                  <button
                    type="button"
                    class="btn btn-primary"
                    @click=${() => {
                      setNota({
                        id: disp.id,
                        caminho: this.caminho,
                        normaSigla: this._bundle.norma.sigla,
                        rotulo: disp.rotulo,
                        textoResumo: v?.texto || '',
                        texto: this._rascunhoNota,
                      });
                      this._editandoNota = false;
                    }}
                  >
                    Salvar nota
                  </button>
                  ${getNota(disp.id)
                    ? html`
                        <button
                          type="button"
                          class="btn"
                          @click=${() => {
                            removerNota(disp.id);
                            this._rascunhoNota = '';
                            this._editandoNota = false;
                          }}
                        >
                          Excluir nota
                        </button>
                      `
                    : ''}
                </div>
              </div>
            `
          : ''}
      </div>
    `;
  }

  render() {
    if (this._carregando) {
      return html`<p role="status">Carregando texto integral…</p>`;
    }
    if (this._erro) {
      return html`<p role="alert">${this._erro}</p>`;
    }
    if (!this._bundle) return html``;

    const { norma, estrutura, dispositivos } = this._bundle;
    const termoNorm = normalizarTexto(this._filtroTexto);
    const tokens = termoNorm ? termoNorm.split(/\s+/).filter(Boolean) : [];
    const temaNorm = normalizarTexto(this._filtroTema);
    const totalArtigos = dispositivos.filter((d) => d.tipo === 'artigo').length;
    const blocos = estrutura
      .map((no) => this._renderNoEstrutura(no, tokens, temaNorm))
      .filter(Boolean);

    return html`
      <header class="norma-header">
        <h1>${norma.nome}</h1>
        <p class="ementa">${norma.ementa}</p>
        <div class="meta-row">
          <span><strong>${norma.sigla}</strong> • ${totalArtigos} artigos (${dispositivos.length} dispositivos)</span>
          ${norma.urlFonte
            ? html`<a href=${norma.urlFonte} target="_blank" rel="noopener noreferrer">Fonte oficial (Câmara)</a>`
            : ''}
          <button type="button" class="btn" @click=${() => this._copiarABNT(null)}>
            Copiar citação ABNT
          </button>
          ${ttsSuportado() && this._falaEstado.falando
            ? html`
                <button type="button" class="btn" @click=${() => pararLeitura()}>
                  Parar leitura em voz alta
                </button>
              `
            : ''}
        </div>
        ${this._feedback
          ? html`<p class="toast" role="status">${this._feedback}</p>`
          : ''}
      </header>

      <div class="toolbar" aria-label="Filtros e salto rápido na norma">
        <div class="toolbar-row">
          <input
            class="grow"
            type="search"
            aria-label="Filtrar artigos nesta norma"
            placeholder="Filtrar texto, artigo ou lei alteradora…"
            .value=${this._filtroTexto}
            @input=${(e) => {
              this._filtroTexto = e.target.value;
            }}
          />

          <select
            aria-label="Filtrar por eixo temático"
            .value=${this._filtroTema}
            @change=${(e) => {
              this._filtroTema = e.target.value;
            }}
          >
            <option value="">Todos os eixos temáticos</option>
            ${EIXOS_TEMATICOS.map(
              (t) => html`<option value=${t}>${t}</option>`
            )}
          </select>

          <select
            aria-label="Saltar para divisão estrutural"
            @change=${(e) => {
              if (e.target.value) this._scrollParaDispositivo(e.target.value);
            }}
          >
            <option value="">Saltar para Título/Capítulo…</option>
            ${this._divisoes.map(
              (div) => html`
                <option value=${div.primeiroArtigoId || ''}>
                  ${'— '.repeat(div.depth - 1)}${div.rotulo}${div.rubrica ? ` — ${div.rubrica.slice(0, 46)}` : ''}
                </option>
              `
            )}
          </select>
        </div>

        <div class="toolbar-row">
          <form @submit=${this._saltarParaArtigo} style="display:flex;gap:6px;align-items:center;">
            <input
              type="text"
              style="width:128px;"
              aria-label="Ir para artigo número"
              placeholder="Ir p/ Art. (ex. 58)"
              .value=${this._saltoArtigo}
              @input=${(e) => {
                this._saltoArtigo = e.target.value;
              }}
            />
            <button type="submit" class="btn">Ir</button>
          </form>

          <button
            type="button"
            class="btn"
            aria-pressed=${this._apenasAlterados}
            @click=${() => {
              this._apenasAlterados = !this._apenasAlterados;
            }}
          >
            Alterações legislativas
          </button>

          <button
            type="button"
            class="btn"
            aria-pressed=${this._ocultarRevogados}
            @click=${() => {
              this._ocultarRevogados = !this._ocultarRevogados;
            }}
          >
            Ocultar revogados/vetados
          </button>

          <button
            type="button"
            class="btn"
            aria-pressed=${this._mostrarObs}
            @click=${() => {
              this._mostrarObs = !this._mostrarObs;
            }}
          >
            Notas legislativas
          </button>

          ${this._filtroTexto || this._filtroTema || this._apenasAlterados
            ? html`
                <button
                  type="button"
                  class="btn"
                  @click=${() => {
                    this._filtroTexto = '';
                    this._filtroTema = '';
                    this._apenasAlterados = false;
                  }}
                >
                  Limpar filtros
                </button>
              `
            : ''}
        </div>
      </div>

      ${blocos.length
        ? blocos
        : html`<p role="status">Nenhum dispositivo corresponde aos filtros ativos.</p>`}

      ${this._renderDock()}
    `;
  }
}

customElements.define('norma-view', NormaView);

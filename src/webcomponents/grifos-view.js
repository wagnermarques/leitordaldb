import { LitElement, html, css } from 'lit';
import { CORES_GRIFO, MAPA_CORES_GRIFO } from '../grifos.js';
import {
  listarGrifos,
  listarNotas,
  getNota,
  removerGrifo,
  removerNota,
  getRotuloCor,
  setRotuloCor,
  resetRotulosCores,
  exportarEstudoMarkdown,
  limparEstudo,
} from '../services/estudo-service.js';

/**
 * Inventário de grifos e notas pessoais com filtro por cor, legenda editável
 * e exportação em Markdown.
 */
export class GrifosView extends LitElement {
  static properties = {
    _grifos: { type: Array, state: true },
    _notas: { type: Array, state: true },
    _filtroCor: { type: String, state: true },
    _confirmarLimpar: { type: Boolean, state: true },
    _feedback: { type: String, state: true },
  };

  static styles = css`
    :host {
      display: block;
      max-width: 960px;
      margin: 0 auto;
      padding: 20px 16px 56px;
      font-family: var(--leitura-font-family, system-ui, sans-serif);
      color: var(--leitura-fg, #14171a);
    }
    h1 {
      margin: 0 0 8px;
      font-size: 1.5rem;
      color: var(--leitura-accent, #1f3a5f);
    }
    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin: 14px 0 18px;
      align-items: center;
    }
    .btn {
      cursor: pointer;
      min-height: 38px;
      padding: 0 14px;
      border-radius: 999px;
      border: 1px solid var(--leitura-border, #cbd4e1);
      background: var(--leitura-bg, #ffffff);
      color: var(--leitura-fg, #14171a);
      font-family: inherit;
      font-size: 0.88rem;
      font-weight: 600;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .btn-primary {
      background: var(--leitura-accent, #1f3a5f);
      color: var(--leitura-accent-fg, #ffffff);
      border-color: var(--leitura-accent, #1f3a5f);
    }
    .panel {
      background: var(--leitura-surface, #f4f6f9);
      border: 1px solid var(--leitura-border, #cbd4e1);
      border-radius: 16px;
      padding: 16px 18px;
      margin-bottom: 18px;
    }
    .legend-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 10px;
      margin-top: 10px;
    }
    .legend-item {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .dot {
      width: 16px;
      height: 16px;
      border-radius: 50%;
      flex: 0 0 auto;
      border: 1px solid rgba(0, 0, 0, 0.25);
    }
    .legend-item input {
      flex: 1 1 auto;
      min-height: 34px;
      padding: 0 10px;
      border-radius: 8px;
      border: 1px solid var(--leitura-border, #cbd4e1);
      background: var(--leitura-bg, #ffffff);
      color: var(--leitura-fg, #14171a);
      font-family: inherit;
      font-size: 0.86rem;
    }
    .filter-row {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 16px;
    }
    .pill[aria-pressed='true'] {
      background: var(--leitura-accent, #1f3a5f);
      color: var(--leitura-accent-fg, #ffffff);
      border-color: var(--leitura-accent, #1f3a5f);
    }
    .item-card {
      background: var(--leitura-surface, #f4f6f9);
      border: 1px solid var(--leitura-border, #cbd4e1);
      border-left-width: 6px;
      border-radius: 12px;
      padding: 14px 16px;
      margin-bottom: 12px;
    }
    .item-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 6px;
    }
    .nota-box {
      margin: 8px 0;
      padding: 8px 12px;
      border-radius: 8px;
      background: var(--leitura-bg, #ffffff);
      border: 1px solid var(--leitura-border, #cbd4e1);
      font-size: 0.9rem;
    }
    .status {
      font-size: 0.88rem;
      color: var(--leitura-accent, #1f3a5f);
      font-weight: 600;
    }
  `;

  constructor() {
    super();
    this._grifos = listarGrifos();
    this._notas = listarNotas();
    this._filtroCor = '';
    this._confirmarLimpar = false;
    this._feedback = '';
    this._onAlterado = () => {
      this._grifos = listarGrifos();
      this._notas = listarNotas();
    };
  }

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener('estudo:alterado', this._onAlterado);
  }

  disconnectedCallback() {
    window.removeEventListener('estudo:alterado', this._onAlterado);
    super.disconnectedCallback();
  }

  _baixarMarkdown() {
    const md = exportarEstudoMarkdown();
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'caderno-estudos-ldb.md';
    a.click();
    URL.revokeObjectURL(url);
    this._feedback = 'Arquivo Markdown exportado.';
  }

  async _copiarMarkdown() {
    try {
      await navigator.clipboard.writeText(exportarEstudoMarkdown());
      this._feedback = 'Caderno em Markdown copiado para a área de transferência.';
    } catch {
      this._feedback = 'Não foi possível copiar automaticamente neste navegador.';
    }
  }

  render() {
    const grifosFiltrados = this._filtroCor
      ? this._grifos.filter((g) => g.cor === this._filtroCor)
      : this._grifos;

    const notasSemGrifo = !this._filtroCor
      ? this._notas.filter((n) => !this._grifos.some((g) => g.id === n.id))
      : [];

    return html`
      <h1>Grifos e Notas de Estudo</h1>
      <p style="margin:0;color:var(--leitura-muted,#555);">
        Seus marca-textos e comentários ficam salvos apenas neste dispositivo.
      </p>

      <div class="actions">
        <button type="button" class="btn btn-primary" @click=${this._baixarMarkdown}>
          Exportar Markdown (.md)
        </button>
        <button type="button" class="btn" @click=${this._copiarMarkdown}>
          Copiar Markdown
        </button>
        ${this._grifos.length || this._notas.length
          ? this._confirmarLimpar
            ? html`
                <button
                  type="button"
                  class="btn"
                  @click=${() => {
                    limparEstudo();
                    this._confirmarLimpar = false;
                    this._feedback = 'Grifos e notas removidos.';
                  }}
                >
                  Confirmar limpeza total
                </button>
                <button
                  type="button"
                  class="btn"
                  @click=${() => {
                    this._confirmarLimpar = false;
                  }}
                >
                  Cancelar
                </button>
              `
            : html`
                <button
                  type="button"
                  class="btn"
                  @click=${() => {
                    this._confirmarLimpar = true;
                  }}
                >
                  Limpar tudo
                </button>
              `
          : ''}
        ${this._feedback
          ? html`<span class="status" role="status">${this._feedback}</span>`
          : ''}
      </div>

      <details class="panel">
        <summary style="cursor:pointer;font-weight:700;">
          Personalizar legenda pedagógica das cores
        </summary>
        <div class="legend-grid">
          ${CORES_GRIFO.map(
            (c) => html`
              <label class="legend-item">
                <span class="dot" style=${`background:${c.swatch}`}></span>
                <input
                  type="text"
                  aria-label=${`Legenda para a cor ${c.nome}`}
                  .value=${getRotuloCor(c.id)}
                  @change=${(e) => setRotuloCor(c.id, e.target.value)}
                />
              </label>
            `
          )}
        </div>
        <div style="margin-top:10px;">
          <button
            type="button"
            class="btn"
            @click=${() => resetRotulosCores()}
          >
            Restaurar legendas padrão
          </button>
        </div>
      </details>

      <div class="filter-row" role="group" aria-label="Filtrar grifos por cor">
        <button
          type="button"
          class="btn pill"
          aria-pressed=${this._filtroCor === ''}
          @click=${() => {
            this._filtroCor = '';
          }}
        >
          Todos (${this._grifos.length})
        </button>
        ${CORES_GRIFO.map((c) => {
          const count = this._grifos.filter((g) => g.cor === c.id).length;
          return html`
            <button
              type="button"
              class="btn pill"
              aria-pressed=${this._filtroCor === c.id}
              @click=${() => {
                this._filtroCor = c.id;
              }}
            >
              <span class="dot" style=${`background:${c.swatch}`}></span>
              ${c.nome} (${count})
            </button>
          `;
        })}
      </div>

      ${!grifosFiltrados.length && !notasSemGrifo.length
        ? html`
            <div class="panel">
              <p style="margin:0;">
                Nenhum grifo ou nota encontrado neste filtro. Selecione qualquer
                dispositivo na leitura da LDB ou CF/88 para grifar ou anotar.
              </p>
            </div>
          `
        : ''}

      ${grifosFiltrados.map((g) => {
        const corObj = MAPA_CORES_GRIFO[g.cor] || CORES_GRIFO[0];
        const nota = getNota(g.id);
        return html`
          <article
            class="item-card"
            style=${`border-left-color:${corObj.border}`}
          >
            <div class="item-head">
              <strong>[${g.normaSigla}] ${g.rotulo}</strong>
              <span style="font-size:0.82rem;color:var(--leitura-muted,#555);">
                ${corObj.nome}: ${getRotuloCor(g.cor)}
              </span>
            </div>
            <p style="margin:6px 0;">${g.textoResumo}</p>
            ${nota
              ? html`<div class="nota-box"><strong>Nota:</strong> ${nota.texto}</div>`
              : ''}
            <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px;">
              <a
                class="btn btn-primary"
                href=${`#/norma/${g.caminho}?ir=${encodeURIComponent(g.id)}`}
              >
                Ver na norma
              </a>
              <button
                type="button"
                class="btn"
                @click=${() => removerGrifo(g.id)}
              >
                Remover grifo
              </button>
            </div>
          </article>
        `;
      })}

      ${notasSemGrifo.map(
        (n) => html`
          <article class="item-card" style="border-left-color:#64748b">
            <div class="item-head">
              <strong>[${n.normaSigla}] ${n.rotulo} (Anotação)</strong>
            </div>
            ${n.textoResumo ? html`<p style="margin:6px 0;">${n.textoResumo}</p>` : ''}
            <div class="nota-box"><strong>Nota:</strong> ${n.texto}</div>
            <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px;">
              <a
                class="btn btn-primary"
                href=${`#/norma/${n.caminho}?ir=${encodeURIComponent(n.id)}`}
              >
                Ver na norma
              </a>
              <button
                type="button"
                class="btn"
                @click=${() => removerNota(n.id)}
              >
                Remover nota
              </button>
            </div>
          </article>
        `
      )}
    `;
  }
}

customElements.define('grifos-view', GrifosView);

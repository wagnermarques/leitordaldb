import { LitElement, html, css } from 'lit';
import {
  getPreferencias,
  aplicarPreferencias,
  resetarPreferencias,
  ttsSuportado,
} from '../services/acessibilidade-service.js';

/**
 * Painel modal de configurações DUA (Desenho Universal para a Aprendizagem):
 * tipografia acessível offline, escala de texto, espaçamento, contraste e TTS.
 */
export class AcessibilidadeDialog extends LitElement {
  static properties = {
    aberto: { type: Boolean },
    prefs: { type: Object },
  };

  static styles = css`
    :host {
      font-family: var(--leitura-font-family, system-ui, sans-serif);
    }
    .backdrop {
      position: fixed;
      inset: 0;
      z-index: 9999;
      background: rgba(10, 16, 28, 0.62);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
    }
    .dialog {
      width: min(560px, 100%);
      max-height: 90vh;
      overflow-y: auto;
      background: var(--leitura-bg, #ffffff);
      color: var(--leitura-fg, #14171a);
      border: 2px solid var(--leitura-border, #cbd4e1);
      border-radius: 16px;
      padding: 20px 24px;
      box-shadow: 0 18px 48px rgba(0, 0, 0, 0.28);
    }
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 16px;
      border-bottom: 1px solid var(--leitura-border, #cbd4e1);
      padding-bottom: 12px;
    }
    h2 {
      margin: 0;
      font-size: 1.2rem;
    }
    .section {
      margin-bottom: 18px;
    }
    .section-title {
      display: block;
      font-weight: 700;
      font-size: 0.92rem;
      margin-bottom: 8px;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 8px;
    }
    button.choice {
      cursor: pointer;
      padding: 10px 12px;
      border-radius: 10px;
      border: 1px solid var(--leitura-border, #cbd4e1);
      background: var(--leitura-surface, #f3f6fa);
      color: var(--leitura-fg, #14171a);
      font-family: inherit;
      font-size: 0.88rem;
      font-weight: 600;
      text-align: center;
      transition: border-color 0.15s ease, background-color 0.15s ease;
    }
    button.choice[aria-pressed='true'] {
      background: var(--leitura-accent, #1f3a5f);
      color: var(--leitura-accent-fg, #ffffff);
      border-color: var(--leitura-accent, #1f3a5f);
    }
    .scale-row {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .scale-row input[type='range'] {
      flex: 1 1 auto;
    }
    .scale-value {
      min-width: 48px;
      text-align: right;
      font-weight: 700;
      font-variant-numeric: tabular-nums;
    }
    .footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      padding-top: 14px;
      border-top: 1px solid var(--leitura-border, #cbd4e1);
      flex-wrap: wrap;
    }
    .btn {
      cursor: pointer;
      padding: 8px 16px;
      border-radius: 999px;
      border: 1px solid var(--leitura-border, #cbd4e1);
      background: var(--leitura-surface, #f3f6fa);
      color: var(--leitura-fg, #14171a);
      font-family: inherit;
      font-size: 0.9rem;
      font-weight: 600;
    }
    .btn-primary {
      background: var(--leitura-accent, #1f3a5f);
      color: var(--leitura-accent-fg, #ffffff);
      border-color: var(--leitura-accent, #1f3a5f);
    }
  `;

  constructor() {
    super();
    this.aberto = false;
    this.prefs = getPreferencias();
    this._onAbrir = () => this.abrir();
    this._onKeyDown = (e) => {
      if (this.aberto && e.key === 'Escape') {
        this.fechar();
      }
    };
  }

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener('leitura:abrir-acessibilidade', this._onAbrir);
    window.addEventListener('keydown', this._onKeyDown);
  }

  disconnectedCallback() {
    window.removeEventListener('leitura:abrir-acessibilidade', this._onAbrir);
    window.removeEventListener('keydown', this._onKeyDown);
    super.disconnectedCallback();
  }

  abrir() {
    this.prefs = getPreferencias();
    this.aberto = true;
  }

  fechar() {
    this.aberto = false;
  }

  _atualizar(parcial) {
    this.prefs = aplicarPreferencias({ ...this.prefs, ...parcial });
  }

  _resetar() {
    this.prefs = resetarPreferencias();
  }

  render() {
    if (!this.aberto) return html``;

    const fontes = [
      { id: 'padrao', rotulo: 'Padrão do sistema' },
      { id: 'atkinson', rotulo: 'Atkinson Hyperlegible' },
      { id: 'opendyslexic', rotulo: 'OpenDyslexic' },
      { id: 'serifa', rotulo: 'Com Serifa' },
    ];

    const espacamentos = [
      { id: 'normal', rotulo: 'Normal' },
      { id: 'confortavel', rotulo: 'Confortável' },
      { id: 'amplo', rotulo: 'Amplo' },
    ];

    const temas = [
      { id: 'padrao', rotulo: 'Seguir AppShell' },
      { id: 'claro', rotulo: 'Claro nítido' },
      { id: 'sepia', rotulo: 'Sépia papel' },
      { id: 'escuro', rotulo: 'Escuro suave' },
      { id: 'alto-contraste-amarelo', rotulo: 'Alto Contraste (Amarelo)' },
      { id: 'alto-contraste-branco', rotulo: 'Alto Contraste (Branco)' },
    ];

    return html`
      <div
        class="backdrop"
        @click=${(e) => e.target === e.currentTarget && this.fechar()}
      >
        <div
          class="dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby="a11y-dialog-title"
        >
          <div class="header">
            <h2 id="a11y-dialog-title">Preferências de Leitura e Acessibilidade</h2>
            <button
              type="button"
              class="btn"
              aria-label="Fechar configurações"
              @click=${this.fechar}
            >
              Fechar
            </button>
          </div>

          <div class="section">
            <span class="section-title">Tipografia</span>
            <div class="grid">
              ${fontes.map(
                (f) => html`
                  <button
                    type="button"
                    class="choice"
                    aria-pressed=${this.prefs.fonte === f.id}
                    @click=${() => this._atualizar({ fonte: f.id })}
                  >
                    ${f.rotulo}
                  </button>
                `
              )}
            </div>
          </div>

          <div class="section">
            <label class="section-title" for="escala-texto">
              Tamanho do texto
            </label>
            <div class="scale-row">
              <button
                type="button"
                class="btn"
                aria-label="Diminuir texto"
                @click=${() =>
                  this._atualizar({ tamanho: Math.max(100, this.prefs.tamanho - 10) })}
              >
                A-
              </button>
              <input
                id="escala-texto"
                type="range"
                min="100"
                max="180"
                step="10"
                .value=${String(this.prefs.tamanho)}
                @input=${(e) =>
                  this._atualizar({ tamanho: Number(e.target.value) })}
              />
              <button
                type="button"
                class="btn"
                aria-label="Aumentar texto"
                @click=${() =>
                  this._atualizar({ tamanho: Math.min(180, this.prefs.tamanho + 10) })}
              >
                A+
              </button>
              <span class="scale-value">${this.prefs.tamanho}%</span>
            </div>
          </div>

          <div class="section">
            <span class="section-title">Espaçamento entre linhas e letras</span>
            <div class="grid">
              ${espacamentos.map(
                (esp) => html`
                  <button
                    type="button"
                    class="choice"
                    aria-pressed=${this.prefs.espacamento === esp.id}
                    @click=${() => this._atualizar({ espacamento: esp.id })}
                  >
                    ${esp.rotulo}
                  </button>
                `
              )}
            </div>
          </div>

          <div class="section">
            <span class="section-title">Contraste e Tema de Leitura</span>
            <div class="grid">
              ${temas.map(
                (t) => html`
                  <button
                    type="button"
                    class="choice"
                    aria-pressed=${this.prefs.tema === t.id}
                    @click=${() => this._atualizar({ tema: t.id })}
                  >
                    ${t.rotulo}
                  </button>
                `
              )}
            </div>
          </div>

          ${ttsSuportado()
            ? html`
                <div class="section">
                  <span class="section-title">Velocidade da leitura em voz alta</span>
                  <div class="grid">
                    ${[0.75, 1.0, 1.25, 1.5].map(
                      (vel) => html`
                        <button
                          type="button"
                          class="choice"
                          aria-pressed=${Number(this.prefs.velocidadeFala) === vel}
                          @click=${() => this._atualizar({ velocidadeFala: vel })}
                        >
                          ${vel}x
                        </button>
                      `
                    )}
                  </div>
                </div>
              `
            : ''}

          <div class="footer">
            <button type="button" class="btn" @click=${this._resetar}>
              Restaurar padrões
            </button>
            <button type="button" class="btn btn-primary" @click=${this.fechar}>
              Concluir
            </button>
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define('acessibilidade-dialog', AcessibilidadeDialog);

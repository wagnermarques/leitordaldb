import { LitElement, html, css } from 'lit';

/**
 * Página institucional sobre o Leitor da LDB, GEPIS/Unesp, fontes oficiais,
 * padrões de acessibilidade e licença livre AGPL-3.0.
 */
export class SobreView extends LitElement {
  static styles = css`
    :host {
      display: block;
      max-width: 820px;
      margin: 0 auto;
      padding: 20px 16px 48px;
      line-height: var(--leitura-line-height, 1.68);
      font-family: var(--leitura-font-family, system-ui, sans-serif);
    }
    .card {
      background: var(--leitura-surface, #f4f6f9);
      border: 1px solid var(--leitura-border, #cbd4e1);
      border-radius: 16px;
      padding: 20px 24px;
      margin-bottom: 16px;
    }
    h1 {
      margin: 0 0 8px;
      font-size: 1.6rem;
      color: var(--leitura-accent, #1f3a5f);
    }
    h2 {
      margin: 0 0 10px;
      font-size: 1.15rem;
      color: var(--leitura-accent, #1f3a5f);
    }
    p,
    li {
      color: var(--leitura-fg, #14171a);
    }
    ul {
      padding-left: 20px;
      margin: 8px 0;
    }
    a {
      color: var(--leitura-accent, #1f3a5f);
      font-weight: 600;
    }
    .logo-row {
      display: flex;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;
      margin-bottom: 12px;
    }
    .logo-row img {
      height: 56px;
      width: auto;
      border-radius: 8px;
    }
  `;

  render() {
    const base = import.meta.env.BASE_URL || '/';
    return html`
      <div class="card">
        <div class="logo-row">
          <img src=${`${base}gepis-logo.png`} alt="Logotipo do GEPIS/Unesp" />
          <div>
            <h1>Sobre o Leitor da LDB</h1>
            <p style="margin:0;">
              GEPIS/Unesp — Grupo de Estudos e Pesquisas em Inclusão Social
            </p>
          </div>
        </div>
        <p>
          O <strong>Leitor da LDB</strong> é um aplicativo web progressivo (PWA)
          gratuito e de código aberto voltado à leitura acessível, busca
          estruturada, estudo pessoal e citação acadêmica da
          <strong>Lei de Diretrizes e Bases da Educação Nacional (Lei nº 9.394/1996)</strong>
          em conjunto com a <strong>Constituição Federal de 1988 (Arts. 205 a 214)</strong>.
        </p>
      </div>

      <div class="card">
        <h2>Fontes Legislativas Oficiais</h2>
        <p>
          Os textos integrais e notas de alteração legislativa são extraídos e
          estruturados diretamente a partir de fontes oficiais do Estado brasileiro:
        </p>
        <ul>
          <li>
            <a
              href="https://www2.camara.leg.br/legin/fed/lei/1996/lei-9394-20-dezembro-1996-362578-normaatualizada-pl.html"
              target="_blank"
              rel="noopener noreferrer"
            >
              Portal da Câmara dos Deputados — Lei nº 9.394/1996 (Texto consolidado)
            </a>
          </li>
          <li>
            <a
              href="https://www.planalto.gov.br/ccivil_03/leis/l9394.htm"
              target="_blank"
              rel="noopener noreferrer"
            >
              Presidência da República / Planalto — LDB
            </a>
          </li>
          <li>
            <a
              href="https://www.lexml.gov.br/urn/urn:lex:br:federal:lei:1996-12-20;9394"
              target="_blank"
              rel="noopener noreferrer"
            >
              LexML Brasil — Identificador URN oficial da LDB
            </a>
          </li>
          <li>
            <a
              href="https://www.gov.br/mec/pt-br/cne"
              target="_blank"
              rel="noopener noreferrer"
            >
              Conselho Nacional de Educação (CNE / MEC)
            </a>
          </li>
        </ul>
      </div>

      <div class="card">
        <h2>Acessibilidade, DUA e Privacidade Local-First</h2>
        <ul>
          <li>
            Projetado segundo os princípios do <strong>Desenho Universal para a Aprendizagem (DUA)</strong>,
            <strong>WCAG 2.2 (AA)</strong> e <strong>eMAG 3.1</strong>.
          </li>
          <li>
            Fontes auto-hospedadas para funcionamento <strong>100% offline</strong>
            (<code>Atkinson Hyperlegible Next</code> e <code>OpenDyslexic</code>),
            ajuste tipográfico de 100% a 180%, temas claro, sépia, escuro e alto
            contraste, além de leitura em voz alta (Web Speech API).
          </li>
          <li>
            <strong>Privacidade total:</strong> seus grifos, anotações e favoritos
            permanecem exclusivamente no armazenamento local do navegador
            (<code>localStorage</code>), sem telemetria obrigatória ou cadastro.
          </li>
        </ul>
      </div>

      <div class="card">
        <h2>Licença e Código Aberto</h2>
        <p>
          Desenvolvido com tecnologias livres no ecossistema FZL / GEPIS-Unesp,
          distribuído sob licença <strong>AGPL-3.0-or-later</strong>.
        </p>
      </div>
    `;
  }
}

customElements.define('sobre-view', SobreView);

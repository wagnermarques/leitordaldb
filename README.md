# Leitor da LDB

Aplicativo Web Progressivo (PWA) de leitura acessível, busca estruturada, estudo pessoal e citação acadêmica da **Lei de Diretrizes e Bases da Educação Nacional (Lei nº 9.394/1996)** e dos dispositivos educacionais da **Constituição Federal de 1988 (Arts. 205 a 214)**.

Desenvolvido no âmbito do **GEPIS/Unesp — Grupo de Estudos e Pesquisas em Inclusão Social**, sob licença livre **AGPL-3.0-or-later**.

## Recursos Principais

- **Texto integral consolidado e offline**: todos os 9 Títulos da LDB (Art. 1º ao Art. 92, incluindo redações atualizadas, vetos e revogações sinalizadas) e os Arts. 205 a 214 da CF/88 (incluindo o Art. 212-A / FUNDEB).
- **9 Eixos Temáticos Pedagógicos**: filtragem imediata por princípios, organização federativa, educação básica, educação profissional, educação superior, educação especial e bilíngue de surdos, modalidades e diversidade, profissionais da educação e financiamento.
- **Busca Global e Salto Rápido**: pesquisa sem acentos por palavra-chave, número do artigo (`Art. 58`, `Art. 26-A`), número da lei alteradora (`14.945`, `14.191`, `12.796`) ou eixo temático.
- **Caderno de Estudos Local-First**: grifos em 5 cores com legenda personalizável, notas por dispositivo, favoritos e exportação completa em Markdown (`.md`) armazenados localmente no navegador.
- **Acessibilidade (DUA / WCAG 2.2 AA / eMAG 3.1)**:
  - Fontes auto-hospedadas offline: `Atkinson Hyperlegible Next` e `OpenDyslexic`.
  - Escala tipográfica ajustável (100% a 180%) e espaçamento entre linhas.
  - Temas claro, sépia, escuro e alto contraste (amarelo e branco sobre preto).
  - Leitura em voz alta via `Web Speech API` (`pt-BR`) e cópia de citação **ABNT NBR 6023**.

## Arquitetura e Submódulo `fzl-fund-ui`

A interface utiliza **Lit 3**, **Material Web (`@material/web`)** e o ecossistema **FZL (`fzl-fund-ui`)** conectado como submódulo Git em `fzl-fund-ui/`:

- `fzl-fund-appshell--lit`: shell responsivo com roteamento hash, drawer lateral, breadcrumbs, registro PWA e fontes auto-hospedadas offline.
- `@fzl/webcomponents-lit` e `@fzl/design-tokens`: componentes e tokens visuais reutilizáveis via npm workspaces.

Ao clonar o repositório com o submódulo:

```bash
git clone --recurse-submodules git@github.com:wagnermarques/leitordaldb.git
cd leitordaldb
```

Se já tiver clonado sem `--recurse-submodules`:

```bash
git submodule update --init --recursive
```

## Instalação, Dados e Build

```bash
# Instalar dependências da aplicação e dos workspaces de fzl-fund-ui
npm install

# Regenerar os JSONs em public/data/ a partir do cache HTML oficial (ou use --refresh para baixar da Câmara)
npm run dados
python3 scripts/gerar-dados-ldb.py --refresh

# Servidor de desenvolvimento local
npm run dev

# Build dos pacotes UI + bundle PWA de produção em dist/
npm run build

# Visualizar build gerado localmente
npm run preview
```

## Estrutura de Pastas

```text
leitordaldb/
├── appshell.config.js          # Configuração do AppShell, PWA e Workbox
├── vite.config.js              # Preset Vite do fzl-fund-appshell--lit
├── scripts/
│   ├── gerar-dados-ldb.py      # Parser oficial da Câmara dos Deputados -> JSONs
│   └── cache/                  # Cache HTML oficial da LDB e CF/88 (Arts. 205–214)
├── public/
│   ├── data/                   # Dados estruturados estáticos e indice.json
│   └── icons/                  # Ícones PWA e identidade visual GEPIS/Unesp
├── fzl-fund-ui/                # Submódulo Git com workspaces FZL
└── src/
    ├── main.js                 # Inicialização do AppShell e rotas
    ├── grifos.js               # Paleta de cores pedagógicas e citação ABNT
    ├── styles/
    │   └── acessibilidade.css  # Regras DUA, espaçamento e contraste
    ├── services/
    │   ├── dados-service.js
    │   ├── estudo-service.js
    │   └── acessibilidade-service.js
    └── webcomponents/
        ├── acessibilidade-dialog.js
        ├── busca-view.js
        ├── grifos-view.js
        ├── home-view.js
        ├── norma-view.js
        ├── sobre-view.js
        ├── sumario-normas.js
        └── textos-integrais-nav.js
```

## Fontes Oficiais

- Portal da Câmara dos Deputados — Lei nº 9.394/1996 (Texto consolidado atualizado)
- Portal da Câmara dos Deputados — Constituição Federal de 1988 (Título VIII, Capítulo III, Seção I — Da Educação)
- Presidência da República / Planalto, LexML Brasil e Conselho Nacional de Educação (CNE)

#!/usr/bin/env python3
"""Gera o banco de dados estruturado do Leitor da LDB (GEPIS/Unesp).

Fontes oficiais utilizadas:
- Lei nº 9.394/1996 (LDB consolidada): Portal da Câmara dos Deputados
- Constituição Federal de 1988 (Arts. 205 a 214): Portal da Câmara dos Deputados

Saída em public/data/:
- indice.json
- br/federal/lei/1996-9394/{norma,estrutura,dispositivos}.json
- br/federal/constituicao/1988-educacao/{norma,estrutura,dispositivos}.json
"""

from __future__ import annotations

import argparse
import html
import json
import os
import re
import unicodedata
import urllib.request
from datetime import date
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parent.parent
CACHE_DIR = ROOT / "scripts" / "cache"
OUT_DIR = ROOT / "public" / "data"
CAPTURED_DATE = date.today().isoformat()

LDB_URL = (
    "https://www2.camara.leg.br/legin/fed/lei/1996/"
    "lei-9394-20-dezembro-1996-362578-normaatualizada-pl.html"
)
CF88_URL = (
    "https://www2.camara.leg.br/legin/fed/consti/1988/"
    "constituicao-1988-5-outubro-1988-322142-normaatualizada-pl.html"
)

EIXOS_TEMATICOS = [
    "Princípios, Fins e Direito à Educação",
    "Organização e Regime de Colaboração",
    "Educação Básica e Etapas",
    "Educação Profissional e Tecnológica",
    "Educação Superior",
    "Educação Especial, Bilíngue e Inclusiva",
    "Modalidades e Diversidade",
    "Profissionais da Educação",
    "Financiamento e Recursos",
]

NOTE_PREFIX_RE = re.compile(
    r"^(?:[\"\u201c\u201d]?\s*Caput|Artigo|Par[aá]grafo|Inciso|Al[ií]nea|"
    r"Cap[ií]tulo|Se[cç][aã]o|Subse[cç][aã]o|Reda[cç][aã]o|Acrescid|Inclu[ií]d|"
    r"Alterad|Revogad|VETADO|Vetad|Vide|Execu[cç][aã]o|Vig[eê]ncia|Declarad)",
    re.IGNORECASE,
)

HEADER_RE = re.compile(r"^(TÍTULO|CAPÍTULO|Seção|Subseção)\b", re.IGNORECASE)
ART_RE = re.compile(
    r"^Art\.\s*(\d+)[ºo°]?(?:-([A-Z]+))?[ºo°]?(?:\s*[.-]\s*|\s+)(.*)$"
)
PAR_RE = re.compile(
    r"^(?:§\s*(\d+)[ºo°]?(?:-([A-Z]+))?[ºo°]?|Parágrafo\s+único)(?:\s*[.-]\s*|\s+)(.*)$",
    re.IGNORECASE,
)
INC_RE = re.compile(r"^([IVXLCDM]+(?:-[A-Z]+)?)\s*[-–.]\s*(.*)$")
ALI_RE = re.compile(r"^([a-z](?:-[a-z0-9]+)?)\)\s*(.*)$")
FULL_PAREN_RE = re.compile(r"^\((.+)\)$")
TRAILING_PAREN_RE = re.compile(r"\s*\(([^()]+)\)\s*$")
DATE_SLASH_RE = re.compile(r"(\d{1,2})/(\d{1,2})/(\d{4})")
YEAR_ONLY_RE = re.compile(r"\bde\s+(\d{4})\b")


def strip_accents(text: str) -> str:
    """Remove diacríticos para comparação lexical uniforme."""
    nfkd = unicodedata.normalize("NFKD", text)
    return "".join(ch for ch in nfkd if not unicodedata.combining(ch)).lower()


def slugify_num(token: str) -> str:
    """Normaliza rótulo numérico/romano para uso em identificador."""
    clean = token.replace("º", "").replace("°", "").strip().lower()
    return re.sub(r"[^a-z0-9]+", "_", clean).strip("_")


def fetch_html(url: str, cache_path: Path, refresh: bool = False) -> str:
    """Carrega HTML do cache local ou baixa da fonte oficial."""
    if cache_path.exists() and not refresh:
        return cache_path.read_text(encoding="utf-8")

    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    req = urllib.request.Request(url, headers={"User-Agent": "LeitorLDB-GEPIS/1.0"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        raw = resp.read().decode("utf-8", errors="replace")
    cache_path.write_text(raw, encoding="utf-8")
    return raw


def extract_clean_blocks(raw_html: str) -> list[str]:
    """Extrai parágrafos e títulos HTML com normalização de espaços."""
    matches = re.findall(
        r"<(?:p|h[1-6])\b[^>]*>(.*?)</(?:p|h[1-6])>",
        raw_html,
        flags=re.DOTALL | re.IGNORECASE,
    )
    blocks: list[str] = []
    for chunk in matches:
        text = re.sub(r"<[^>]+>", " ", chunk)
        text = html.unescape(text).replace("\xa0", " ")
        text = re.sub(r"\s+", " ", text).strip()
        if text:
            blocks.append(text)
    return blocks


def split_trailing_notes(body: str) -> tuple[str, list[str]]:
    """Separa notas legislativas entre parênteses no final de um dispositivo."""
    remaining = body.strip()
    notes_reversed: list[str] = []

    while True:
        match = TRAILING_PAREN_RE.search(remaining)
        if not match:
            break
        candidate = match.group(1).strip()
        if not NOTE_PREFIX_RE.match(candidate):
            break
        notes_reversed.append(candidate)
        remaining = remaining[: match.start()].rstrip()

    notes = list(reversed(notes_reversed))
    if not remaining and notes:
        return body.strip(), notes
    return remaining, notes


def infer_version_meta(
    notes: list[str], default_date: str
) -> tuple[str, str, str | None]:
    """Infere evento normativo, data de vigência e norma alteradora pelas notas."""
    if not notes:
        return "original", default_date, None

    joined = " ".join(notes)
    low = strip_accents(joined)

    if "revogad" in low:
        evento = "revogado"
    elif low.startswith("(vetado") or "vetado" in low and "mantido pelo congresso" not in low:
        evento = "vetado"
    elif "acrescid" in low or "incluid" in low:
        evento = "incluido"
    elif "redacao" in low or "alterad" in low:
        evento = "redacao-dada"
    else:
        evento = "original"

    last_note = notes[-1]
    vigente_desde = default_date
    m_date = DATE_SLASH_RE.findall(last_note)
    if m_date:
        day, month, year = m_date[-1]
        vigente_desde = f"{int(year):04d}-{int(month):02d}-{int(day):02d}"
    else:
        m_year = YEAR_ONLY_RE.findall(last_note)
        if m_year:
            vigente_desde = f"{int(m_year[-1]):04d}-01-01"

    m_origem = re.search(
        r"(Lei(?:\s+Complementar)?\s+n[º°]\s*[\d.]+|Emenda\s+Constitucional\s+n[º°]\s*[\d.]+)",
        last_note,
        flags=re.IGNORECASE,
    )
    origem = m_origem.group(1) if m_origem else None
    return evento, vigente_desde, origem


def classify_temas_ldb(
    titulo_rotulo: str,
    capitulo_rotulo: str,
    secao_rotulo: str,
    texto: str,
    observacoes: list[str],
) -> list[str]:
    """Classifica um dispositivo da LDB nos 9 eixos temáticos pedagógicos."""
    temas: list[str] = []
    haystack = strip_accents(f"{texto} {' '.join(observacoes)}")
    tit = strip_accents(titulo_rotulo)
    cap = strip_accents(capitulo_rotulo)
    sec = strip_accents(secao_rotulo)

    def add(tema: str) -> None:
        if tema not in temas:
            temas.append(tema)

    if tit in {"titulo i", "titulo ii", "titulo iii"}:
        add("Princípios, Fins e Direito à Educação")
    elif tit == "titulo iv":
        add("Organização e Regime de Colaboração")
    elif tit == "titulo vi":
        add("Profissionais da Educação")
    elif tit == "titulo vii":
        add("Financiamento e Recursos")
    elif tit == "titulo v":
        if cap in {"capitulo i", "capitulo ii"} and sec != "secao iv-a" and sec != "secao v":
            add("Educação Básica e Etapas")
        if sec == "secao iv-a" or cap == "capitulo iii":
            add("Educação Profissional e Tecnológica")
        if cap == "capitulo iv":
            add("Educação Superior")
        if cap in {"capitulo v", "capitulo v-a"}:
            add("Educação Especial, Bilíngue e Inclusiva")
        if sec == "secao v":
            add("Modalidades e Diversidade")

    keyword_rules = [
        ("Princípios, Fins e Direito à Educação", [
            "direito a educacao", "direito publico subjetivo", "obrigatori",
            "gratuid", "gestao democratica", "acesso e permanencia",
            "dever do estado", "busca ativa",
        ]),
        ("Organização e Regime de Colaboração", [
            "regime de colaboracao", "incumb", "conselho nacional de educacao",
            "sistema de ensino", "sistemas de ensino", "base nacional comum",
            "projeto pedagogico", "carga horaria", "dias letivos",
        ]),
        ("Educação Básica e Etapas", [
            "educacao infantil", "creche", "pre-escola", "ensino fundamental",
            "ensino medio", "educacao basica", "alfabetizacao", "itinerario",
        ]),
        ("Educação Profissional e Tecnológica", [
            "educacao profissional", "tecnologica", "tecnico de nivel medio",
            "habilitacao profissional", "itinerario de formacao tecnica",
        ]),
        ("Educação Superior", [
            "educacao superior", "universidad", "graduacao", "pos-graduacao",
            "extensao", "diploma", "enade", "pesquisa",
        ]),
        ("Educação Especial, Bilíngue e Inclusiva", [
            "educacao especial", "atendimento educacional especializado",
            "deficiencia", "transtornos globais", "altas habilidades",
            "superdotacao", "libras", "surd", "acessibilidade", "braille",
        ]),
        ("Modalidades e Diversidade", [
            "jovens e adultos", "indigena", "afro-brasileira", "africana",
            "etnico-racial", "quilombola", "campo", "rural", "a distancia",
            "diversidade", "direitos humanos", "violencia contra a mulher",
        ]),
        ("Profissionais da Educação", [
            "profissionais da educacao", "professor", "docente", "magisterio",
            "licenciatura", "pedagogia", "piso salarial", "plano de carreira",
            "formacao continuada",
        ]),
        ("Financiamento e Recursos", [
            "recursos financeiros", "manutencao e desenvolvimento do ensino",
            "fundeb", "custo minimo", "percentual", "despesas", "impostos",
            "transferencias", "prestacao de contas", "orcament",
        ]),
    ]
    for tema, terms in keyword_rules:
        if any(term in haystack for term in terms):
            add(tema)

    if not temas:
        add("Organização e Regime de Colaboração")
    return temas


def classify_temas_cf(art_rotulo: str, texto: str) -> list[str]:
    """Classifica dispositivos dos Arts. 205 a 214 da CF/88 nos 9 eixos."""
    art_num = int(re.search(r"\d+", art_rotulo).group(0))
    haystack = strip_accents(texto)
    temas: list[str] = []

    def add(tema: str) -> None:
        if tema not in temas:
            temas.append(tema)

    if art_num in {205, 206, 208, 209}:
        add("Princípios, Fins e Direito à Educação")
    if art_num == 207:
        add("Educação Superior")
    if art_num == 210:
        add("Educação Básica e Etapas")
        add("Modalidades e Diversidade")
    if art_num in {211, 214}:
        add("Organização e Regime de Colaboração")
    if art_num in {212, 213}:
        add("Financiamento e Recursos")
    if "especializado" in haystack or "deficiencia" in haystack:
        add("Educação Especial, Bilíngue e Inclusiva")
    if "profissionais da educacao" in haystack or "piso salarial" in haystack:
        add("Profissionais da Educação")
    if "plano nacional de educacao" in haystack or "fundeb" in haystack:
        add("Financiamento e Recursos")
    if "jovens e adultos" in haystack or "indigena" in haystack:
        add("Modalidades e Diversidade")

    if not temas:
        add("Princípios, Fins e Direito à Educação")
    return temas


def normalize_header_kind(raw_word: str) -> str:
    """Converte cabeçalho textual em tipo padronizado de divisão."""
    word = strip_accents(raw_word)
    if word.startswith("titulo"):
        return "titulo"
    if word.startswith("capitulo"):
        return "capitulo"
    if word.startswith("secao"):
        return "secao"
    return "subsecao"


def format_header_rotulo(kind: str, text: str) -> str:
    """Padroniza rótulo de divisão (TÍTULO, CAPÍTULO, Seção, Subseção)."""
    if kind in {"titulo", "capitulo"}:
        return text.upper()
    return text


def build_norma_from_blocks(
    blocks: list[str],
    prefix: str,
    default_date: str,
    fonte: str,
    initial_divisions: list[tuple[str, str, str]] | None = None,
) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    """Constrói árvores de estrutura.json e lista plana de dispositivos.json."""
    estrutura: list[dict[str, Any]] = []
    dispositivos: list[dict[str, Any]] = []

    stack: list[tuple[int, dict[str, Any]]] = []
    rank_map = {"titulo": 1, "capitulo": 2, "secao": 3, "subsecao": 4}

    def push_division(kind: str, rotulo: str, rubrica: str | None) -> dict[str, Any]:
        rank = rank_map[kind]
        while stack and stack[-1][0] >= rank:
            stack.pop()
        node: dict[str, Any] = {
            "tipo": kind,
            "rotulo": format_header_rotulo(kind, rotulo),
            "rubrica": rubrica,
            "filhos": [],
        }
        if stack:
            stack[-1][1]["filhos"].append(node)
        else:
            estrutura.append(node)
        stack.append((rank, node))
        return node

    if initial_divisions:
        for kind, rotulo, rubrica in initial_divisions:
            push_division(kind, rotulo, rubrica)

    def current_division_labels() -> tuple[str, str, str]:
        by_kind = {node["tipo"]: node["rotulo"] for _, node in stack}
        return (
            by_kind.get("titulo", ""),
            by_kind.get("capitulo", ""),
            by_kind.get("secao", ""),
        )

    cur_art_id: str | None = None
    cur_par_id: str | None = None
    cur_inc_id: str | None = None
    seen_ids: set[str] = set()
    pending_div_note: tuple[dict[str, Any], str] | None = None

    def make_unique_id(base_id: str) -> str:
        candidate = base_id
        idx = 2
        while candidate in seen_ids:
            candidate = f"{base_id}_{idx}"
            idx += 1
        seen_ids.add(candidate)
        return candidate

    def append_dispositivo(
        dev_id: str,
        tipo: str,
        rotulo: str,
        pai: str | None,
        body: str,
        extra_note: str | None = None,
    ) -> None:
        texto, notes = split_trailing_notes(body)
        if extra_note and extra_note not in notes:
            observacoes = [extra_note, *notes]
        else:
            observacoes = list(notes)

        note_for_meta = notes if notes else ([extra_note] if extra_note else [])
        evento, vigente_desde, origem = infer_version_meta(note_for_meta, default_date)

        tit_rot, cap_rot, sec_rot = current_division_labels()
        if prefix == "cf":
            temas = classify_temas_cf(cur_art_id or rotulo, texto)
        else:
            temas = classify_temas_ldb(tit_rot, cap_rot, sec_rot, texto, observacoes)

        dispositivos.append(
            {
                "id": dev_id,
                "tipo": tipo,
                "rotulo": rotulo,
                "rubrica": None,
                "pai": pai,
                "temas": temas,
                "versoes": [
                    {
                        "texto": texto,
                        "vigenteDesde": vigente_desde,
                        "vigenteAte": None,
                        "evento": evento,
                        "origem": origem,
                        "vigenciaConfirmada": True,
                        "capturadoEm": CAPTURED_DATE,
                        "fonte": fonte,
                    }
                ],
                "observacoes": observacoes,
            }
        )

    i = 0
    while i < len(blocks):
        line = blocks[i]
        m_head = HEADER_RE.match(line)
        if m_head:
            kind = normalize_header_kind(m_head.group(1))
            rubrica = blocks[i + 1] if i + 1 < len(blocks) else None
            node = push_division(kind, line, rubrica)
            pending_div_note = None
            i += 2
            continue

        m_full_paren = FULL_PAREN_RE.match(line)
        if m_full_paren and NOTE_PREFIX_RE.match(m_full_paren.group(1).strip()):
            note_text = m_full_paren.group(1).strip()
            if stack:
                stack[-1][1]["nota"] = note_text
                pending_div_note = (stack[-1][1], note_text)
            i += 1
            continue

        m_art = ART_RE.match(line)
        if m_art:
            num_str, suffix, body = m_art.group(1), m_art.group(2), m_art.group(3)
            ordinal = "º" if int(num_str) <= 9 else ""
            sfx = f"-{suffix.upper()}" if suffix else ""
            art_rotulo = f"Art. {num_str}{ordinal}{sfx}"
            art_slug = slugify_num(f"{num_str}{sfx}")
            art_id = make_unique_id(f"{prefix}_art{art_slug}")
            cur_art_id = art_id
            cur_par_id = None
            cur_inc_id = None

            art_leaf = {
                "tipo": "artigo",
                "rotulo": art_rotulo,
                "rubrica": None,
                "id": art_id,
                "filhos": [],
            }
            if stack:
                stack[-1][1]["filhos"].append(art_leaf)
            else:
                estrutura.append(art_leaf)

            extra_note = pending_div_note[1] if pending_div_note else None
            pending_div_note = None
            append_dispositivo(art_id, "artigo", art_rotulo, None, body, extra_note)
            i += 1
            continue

        m_par = PAR_RE.match(line)
        if m_par and cur_art_id:
            par_num, suffix, body = m_par.group(1), m_par.group(2), m_par.group(3)
            if par_num:
                ordinal = "º" if int(par_num) <= 9 else ""
                sfx = f"-{suffix.upper()}" if suffix else ""
                par_rotulo = f"§ {par_num}{ordinal}{sfx}"
                par_slug = slugify_num(f"{par_num}{sfx}")
                par_id = make_unique_id(f"{cur_art_id}_par{par_slug}")
            else:
                par_rotulo = "Parágrafo único"
                par_id = make_unique_id(f"{cur_art_id}_par_unico")

            cur_par_id = par_id
            cur_inc_id = None
            append_dispositivo(par_id, "paragrafo", par_rotulo, cur_art_id, body)
            i += 1
            continue

        m_inc = INC_RE.match(line)
        if m_inc and cur_art_id:
            roman, body = m_inc.group(1).upper(), m_inc.group(2)
            parent = cur_par_id or cur_art_id
            inc_id = make_unique_id(f"{parent}_inc{slugify_num(roman)}")
            cur_inc_id = inc_id
            append_dispositivo(inc_id, "inciso", f"{roman} -", parent, body)
            i += 1
            continue

        m_ali = ALI_RE.match(line)
        if m_ali and cur_art_id:
            letter, body = m_ali.group(1), m_ali.group(2)
            parent = cur_inc_id or cur_par_id or cur_art_id
            al_id = make_unique_id(f"{parent}_al_{slugify_num(letter)}")
            append_dispositivo(al_id, "alinea", f"{letter})", parent, body)
            i += 1
            continue

        raise ValueError(f"Bloco não classificado em '{prefix}': {line}")

    return estrutura, dispositivos


def parse_ldb(refresh: bool) -> dict[str, Any]:
    """Processa o texto consolidado completo da LDB (Lei nº 9.394/1996)."""
    raw = fetch_html(LDB_URL, CACHE_DIR / "ldb-camara.html", refresh=refresh)
    blocks = extract_clean_blocks(raw)
    start = next(i for i, b in enumerate(blocks) if b.startswith("TÍTULO I"))
    end = next(i for i, b in enumerate(blocks) if b.startswith("Art. 92."))
    body_blocks = blocks[start : end + 1]

    estrutura, dispositivos = build_norma_from_blocks(
        body_blocks,
        prefix="ldb",
        default_date="1996-12-20",
        fonte="camara",
    )

    norma = {
        "urn": "urn:lex:br:federal:lei:1996-12-20;9394",
        "nome": "Lei de Diretrizes e Bases da Educação Nacional (LDB)",
        "sigla": "LDB - Lei 9.394/1996",
        "ano": 1996,
        "ementa": "Estabelece as diretrizes e bases da educação nacional.",
        "dataPublicacao": "1996-12-20",
        "fonte": "camara",
        "urlFonte": LDB_URL,
        "capturadoEm": CAPTURED_DATE,
        "categoria": "Lei Ordinária",
        "temas": list(EIXOS_TEMATICOS),
    }

    return {
        "caminho": "br/federal/lei/1996-9394",
        "norma": norma,
        "estrutura": estrutura,
        "dispositivos": dispositivos,
    }


def parse_cf88_educacao(refresh: bool) -> dict[str, Any]:
    """Processa a Seção I - Da Educação (Arts. 205 a 214) da CF/88."""
    cache_file = CACHE_DIR / "cf88-educacao-camara.html"
    if cache_file.exists() and not refresh:
        raw_slice = cache_file.read_text(encoding="utf-8")
    else:
        req = urllib.request.Request(
            CF88_URL, headers={"User-Agent": "LeitorLDB-GEPIS/1.0"}
        )
        with urllib.request.urlopen(req, timeout=30) as resp:
            full_raw = resp.read().decode("utf-8", errors="replace")
        tags = list(
            re.finditer(
                r"<(?:p|h[1-6])\b[^>]*>(.*?)</(?:p|h[1-6])>",
                full_raw,
                flags=re.DOTALL | re.IGNORECASE,
            )
        )

        def clean_tag(fragment: str) -> str:
            t = html.unescape(re.sub(r"<[^>]+>", " ", fragment)).replace("\xa0", " ")
            return re.sub(r"\s+", " ", t).strip()

        texts = [clean_tag(m.group(1)) for m in tags]
        s_idx = next(i for i, t in enumerate(texts) if t.startswith("Art. 205."))
        chap_idx = max(
            i for i in range(s_idx) if texts[i].upper().startswith("CAPÍTULO III")
        )
        e_idx = next(
            i for i, t in enumerate(texts) if i > s_idx and t.startswith("Art. 215.")
        )
        raw_slice = (
            '<html><head><meta charset="utf-8"></head><body>\n'
            + full_raw[tags[chap_idx].start() : tags[e_idx].start()]
            + "\n</body></html>"
        )
        CACHE_DIR.mkdir(parents=True, exist_ok=True)
        cache_file.write_text(raw_slice, encoding="utf-8")

    blocks = extract_clean_blocks(raw_slice)
    estrutura, dispositivos = build_norma_from_blocks(
        blocks,
        prefix="cf",
        default_date="1988-10-05",
        fonte="camara",
        initial_divisions=[("titulo", "TÍTULO VIII", "DA ORDEM SOCIAL")],
    )

    temas_presentes = [
        tema
        for tema in EIXOS_TEMATICOS
        if any(tema in d["temas"] for d in dispositivos)
    ]

    norma = {
        "urn": "urn:lex:br:federal:constituicao:1988-10-05",
        "nome": "Constituição Federal de 1988 — Da Educação",
        "sigla": "CF/88 (Arts. 205–214)",
        "ano": 1988,
        "ementa": (
            "Constituição da República Federativa do Brasil de 1988. "
            "Título VIII, Capítulo III, Seção I — Da Educação (Arts. 205 a 214)."
        ),
        "dataPublicacao": "1988-10-05",
        "fonte": "camara",
        "urlFonte": CF88_URL,
        "capturadoEm": CAPTURED_DATE,
        "categoria": "Constituição Federal",
        "temas": temas_presentes,
    }

    return {
        "caminho": "br/federal/constituicao/1988-educacao",
        "norma": norma,
        "estrutura": estrutura,
        "dispositivos": dispositivos,
    }


def write_json(path: Path, data: Any) -> None:
    """Grava arquivo JSON formatado em UTF-8."""
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )


def main() -> None:
    parser = argparse.ArgumentParser(description="Gera dados estruturados da LDB e CF/88.")
    parser.add_argument(
        "--refresh",
        action="store_true",
        help="Baixa novamente os textos oficiais da Câmara dos Deputados.",
    )
    args = parser.parse_args()

    normas = [parse_ldb(args.refresh), parse_cf88_educacao(args.refresh)]

    indice = []
    for item in normas:
        target = OUT_DIR / item["caminho"]
        write_json(target / "norma.json", item["norma"])
        write_json(target / "estrutura.json", item["estrutura"])
        write_json(target / "dispositivos.json", item["dispositivos"])

        art_count = sum(1 for d in item["dispositivos"] if d["tipo"] == "artigo")
        print(
            f"[OK] {item['norma']['sigla']}: {art_count} artigos, "
            f"{len(item['dispositivos'])} dispositivos em {target}"
        )

        indice.append(
            {
                "urn": item["norma"]["urn"],
                "nome": item["norma"]["nome"],
                "sigla": item["norma"]["sigla"],
                "ano": item["norma"]["ano"],
                "categoria": item["norma"]["categoria"],
                "caminho": item["caminho"],
                "temas": item["norma"]["temas"],
            }
        )

    write_json(OUT_DIR / "indice.json", indice)
    print(f"[OK] Índice gravado com {len(indice)} normas em {OUT_DIR / 'indice.json'}")


if __name__ == "__main__":
    main()

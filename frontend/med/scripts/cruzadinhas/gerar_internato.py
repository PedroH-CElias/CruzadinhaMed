"""
Gerador das cruzadinhas do CICLO AVANÇADO / INTERNATO do CruzadinhaMed.

O que faz:
1. Lê o banco de palavras e dicas (banco-internato.txt, ao lado deste arquivo).
   Formato: um cabeçalho "## <categoria> <dificuldade>" seguido de linhas "RESPOSTA|Dica".
   Respostas em MAIÚSCULAS, sem acento e sem espaço, com 3 a 13 letras.
2. Monta 4 cruzadinhas por categoria e dificuldade (fácil 6 palavras, médio 7,
   difícil 8 ou 7), escolhendo as grades mais compactas.
3. Valida cada grade: letras consistentes nos cruzamentos, nenhuma sequência de letras
   que não seja uma palavra e todas as palavras conectadas.
4. Regrava src/data/puzzles.js (as cruzadinhas do ciclo básico são mantidas como estão)
   e gera a planilha de revisão docs/revisao-perguntas-internato.csv.

Uso (na pasta frontend/med):  python3 scripts/cruzadinhas/gerar_internato.py
É seguro rodar de novo: as cruzadinhas do ciclo avançado são refeitas do zero com a
mesma semente, então o resultado só muda se o banco de palavras mudar.
ATENÇÃO: se uma cruzadinha já publicada mudar, o progresso salvo dela pode não bater.
"""
import re, os, sys, json, random, collections

HERE = os.path.dirname(os.path.abspath(__file__))
BANKS_FILE = os.path.join(HERE, "banco-internato.txt")
PUZZLES_FILE = os.path.join(HERE, "..", "..", "src", "data", "puzzles.js")
REVIEW_FILE = os.path.join(HERE, "..", "..", "..", "..", "docs", "revisao-perguntas-internato.csv")
SEED = 11
TARGET = {"facil": [6], "medio": [7], "dificil": [8, 7]}   # palavras por cruzadinha (preferência)
LEVELS = 4
MAX_ROWS, MAX_COLS = 15, 13

def load_banks():
    banks = collections.defaultdict(list); key = None
    for line in open(BANKS_FILE, encoding="utf-8").read().splitlines():
        if line.startswith("## "): key = tuple(line[3:].split()); continue
        if line.strip():
            a, c = line.split("|", 1); banks[key].append((a.strip(), c.strip()))
    return banks

def can_place(grid, owner, word, r, c, d):
    """Valida a posição: letras batem, cruza ao menos uma vez, não encosta em outras palavras."""
    dr, dc = (0, 1) if d == "across" else (1, 0)
    # células antes do início e depois do fim precisam estar vazias
    if (r - dr, c - dc) in grid or (r + dr * len(word), c + dc * len(word)) in grid:
        return -1
    crossings = 0
    for i, ch in enumerate(word):
        p = (r + dr * i, c + dc * i)
        if p in grid:
            if grid[p] != ch or d in owner[p]:
                return -1
            crossings += 1
        else:
            # vizinhos perpendiculares de uma célula nova precisam estar vazios
            n1 = (p[0] + dc, p[1] + dr); n2 = (p[0] - dc, p[1] - dr)
            if n1 in grid or n2 in grid:
                return -1
    return crossings

def bbox(cells):
    rs = [p[0] for p in cells]; cs = [p[1] for p in cells]
    return min(rs), max(rs), min(cs), max(cs)

def place(grid, owner, word, r, c, d):
    dr, dc = (0, 1) if d == "across" else (1, 0)
    for i, ch in enumerate(word):
        p = (r + dr * i, c + dc * i); grid[p] = ch; owner[p].add(d)

def try_build(words, target, rng):
    """Tenta montar uma grade com `target` palavras escolhidas de `words`."""
    pool = words[:]; rng.shuffle(pool)
    pool.sort(key=lambda w: -len(w[0]) + rng.random() * 4)   # tende a começar pelas longas
    first = pool.pop(0)
    grid, owner = {}, collections.defaultdict(set)
    d0 = rng.choice(["across", "down"])
    place(grid, owner, first[0], 0, 0, d0)
    placed = [(first, 0, 0, d0)]
    while len(placed) < target:
        best = None
        rng.shuffle(pool)
        for w in pool:
            word = w[0]
            for (pr, pc), ch in list(grid.items()):
                for i, wc in enumerate(word):
                    if wc != ch: continue
                    for d in ("across", "down"):
                        if d in owner[(pr, pc)]: continue
                        r, c = (pr, pc - i) if d == "across" else (pr - i, pc)
                        cross = can_place(grid, owner, word, r, c, d)
                        if cross < 1: continue
                        cells = list(grid) + [(r + (i2 if d == "down" else 0), c + (i2 if d == "across" else 0)) for i2 in range(len(word))]
                        r0, r1, c0, c1 = bbox(cells)
                        h, wd = r1 - r0 + 1, c1 - c0 + 1
                        if h > MAX_ROWS or wd > MAX_COLS: continue
                        score = h * wd - cross * 6 + rng.random() * 3
                        if best is None or score < best[0]:
                            best = (score, w, r, c, d)
            if best and len(placed) < 2: break   # no início não precisa varrer tudo
        if not best: return None
        _, w, r, c, d = best
        place(grid, owner, w[0], r, c, d); placed.append((w, r, c, d)); pool.remove(w)
    return grid, placed

def number_entries(placed):
    """Normaliza para (0,0) e numera as palavras pela posição inicial (linha, coluna)."""
    cells = []
    for (w, _), r, c, d in [((p[0][0], p[0][1]), p[1], p[2], p[3]) for p in placed]:
        for i in range(len(w)):
            cells.append((r + (i if d == "down" else 0), c + (i if d == "across" else 0)))
    r0, r1, c0, c1 = bbox(cells)
    starts = sorted({(p[1] - r0, p[2] - c0) for p in placed})
    num = {s: n + 1 for n, s in enumerate(starts)}
    entries = []
    for (word, clue), r, c, d in placed:
        rr, cc = r - r0, c - c0
        entries.append({"number": num[(rr, cc)], "answer": word, "clue": clue, "row": rr, "col": cc, "dir": d})
    entries.sort(key=lambda e: (e["number"], e["dir"]))
    return entries, r1 - r0 + 1, c1 - c0 + 1

def validate(entries, rows, cols):
    """Confere: letras consistentes, sem sequências não previstas e tudo conectado."""
    grid = {}
    for e in entries:
        for i, ch in enumerate(e["answer"]):
            p = (e["row"] + (i if e["dir"] == "down" else 0), e["col"] + (i if e["dir"] == "across" else 0))
            assert 0 <= p[0] < rows and 0 <= p[1] < cols, "fora da grade"
            assert grid.get(p, ch) == ch, "conflito de letra"
            grid[p] = ch
    expected = {(e["row"], e["col"], e["dir"]) for e in entries}
    for d, (dr, dc) in (("across", (0, 1)), ("down", (1, 0))):
        for p in grid:
            if (p[0] - dr, p[1] - dc) in grid: continue
            n = 0
            while (p[0] + dr * n, p[1] + dc * n) in grid: n += 1
            if n >= 2: assert (p[0], p[1], d) in expected, f"sequência não prevista em {p} {d}"
    seen, stack = set(), [next(iter(grid))]
    while stack:
        p = stack.pop()
        if p in seen: continue
        seen.add(p)
        for q in ((p[0]+1,p[1]),(p[0]-1,p[1]),(p[0],p[1]+1),(p[0],p[1]-1)):
            if q in grid: stack.append(q)
    assert len(seen) == len(grid), "grade desconectada"

def generate(seed=7, avoid=frozenset()):
    rng = random.Random(seed)
    banks = load_banks()
    result, report = {}, []
    for (cat, diff), words in sorted(banks.items()):
        remaining = words[:]
        puzzles = []
        for level in range(1, LEVELS + 1):
            best = None
            for target in TARGET[diff]:
                for attempt in range(400):
                    # prefere palavras que ainda não existem no app
                    fresh = [w for w in remaining if w[0] not in avoid]
                    cand = fresh if len(fresh) >= target + 3 and attempt % 3 else remaining
                    built = try_build(cand, target, rng)
                    if not built: continue
                    entries, rows, cols = number_entries(built[1])
                    area = rows * cols
                    if best is None or area < best[0]: best = (area, entries, rows, cols)
                    if attempt > 120 and best: break
                if best: break
            if not best:
                report.append(f"FALHOU {cat} {diff} nível {level} (restam {len(remaining)})"); break
            _, entries, rows, cols = best
            validate(entries, rows, cols)
            used = {e["answer"] for e in entries}
            remaining = [w for w in remaining if w[0] not in used]
            puzzles.append({"level": level, "rows": rows, "cols": cols, "entries": entries})
            report.append(f"{cat:12} {diff:8} n{level}: {len(entries)} palavras, {rows}x{cols}")
        result[(cat, diff)] = puzzles
    return result, report

# ---------------------------------------------------------------------------
# Categorias e ciclos
# ---------------------------------------------------------------------------

CYCLES = [
    {"id": "basico", "name": "Ciclo básico", "description": "Fundamentos da medicina"},
    {"id": "avancado", "name": "Ciclo avançado / Internato", "description": "Especialidades e prática clínica"},
]

# Categorias novas do ciclo avançado (as do básico vêm do puzzles.js atual)
ADVANCED_CATEGORIES = [
    {"id": "clinica", "name": "Clínica médica", "color": "#8B5CF6", "icon": "clipboard-pulse"},
    {"id": "urgencia", "name": "Urgência e emergência", "color": "#EF4444", "icon": "ambulance"},
    {"id": "pediatria", "name": "Pediatria", "color": "#38BDF8", "icon": "baby-face-outline"},
    {"id": "cirurgia", "name": "Cirurgia geral", "color": "#F97316", "icon": "hospital-box-outline"},
    {"id": "ginecologia", "name": "Ginecologia e obstetrícia", "color": "#F472B6", "icon": "human-pregnant"},
    {"id": "mfc", "name": "Medicina de família e comunidade", "color": "#84CC16", "icon": "home-heart"},
]
DIFFICULTY_NAMES = {"facil": "Fácil", "medio": "Médio", "dificil": "Difícil"}

HEADER = """// Banco de puzzles do CruzadinhaMed.
// Ciclo básico: 48 cruzadinhas (4 categorias x 3 dificuldades x 4 níveis).
// Ciclo avançado / Internato: 72 cruzadinhas (6 categorias x 3 dificuldades x 4 níveis),
// geradas por scripts/cruzadinhas/gerar_internato.py a partir do banco-internato.txt.
// Todas as grades validadas: palavras conectadas, sem conflito de interseção.
// NÃO edite as cruzadinhas do ciclo avançado aqui: altere o banco e rode o script.
"""

FOOTER = """
export const getPuzzle = (id) => PUZZLES.find((p) => p.id === id);

export const getPuzzlesByCategory = (categoryId) =>
  PUZZLES.filter((p) => p.category === categoryId);

export const getCategory = (id) => CATEGORIES.find((c) => c.id === id);

/** Categorias de um ciclo ('basico' ou 'avancado'), na ordem de exibição. */
export const getCategoriesByCycle = (cycleId) =>
  CATEGORIES.filter((c) => c.cycle === cycleId);
"""

def write_outputs():
    src_js = open(PUZZLES_FILE, encoding="utf-8").read()
    categories = json.loads(re.search(r"export const CATEGORIES = (\[.*?\]);", src_js, re.S).group(1))
    puzzles = json.loads(re.search(r"export const PUZZLES = (\[.*\]);", src_js, re.S).group(1))
    difficulties_js = re.search(r"export const DIFFICULTIES = \[.*?\];", src_js, re.S).group(0)

    advanced_ids = {c["id"] for c in ADVANCED_CATEGORIES}
    basic_categories = [dict(c, cycle="basico") for c in categories if c["id"] not in advanced_ids]
    basic_puzzles = [p for p in puzzles if p["category"] not in advanced_ids]
    basic_answers = {e["answer"]: c for p in basic_puzzles for e in p["entries"] for c in [p["categoryName"]]}

    generated, report = generate(SEED, frozenset(basic_answers))
    failures = [r for r in report if "FALHOU" in r]
    if failures:
        sys.exit("Não foi possível montar todas as cruzadinhas:\n" + "\n".join(failures))

    new_categories = [dict(c, cycle="avancado") for c in ADVANCED_CATEGORIES]
    cat_by_id = {c["id"]: c for c in new_categories}
    new_puzzles = []
    for cat in ADVANCED_CATEGORIES:
        for diff in ("facil", "medio", "dificil"):
            for pz in generated[(cat["id"], diff)]:
                new_puzzles.append({
                    "id": f'{cat["id"]}-{diff}-{pz["level"]}',
                    "category": cat["id"], "categoryName": cat["name"], "color": cat["color"],
                    "difficulty": diff, "difficultyName": DIFFICULTY_NAMES[diff],
                    "level": pz["level"], "rows": pz["rows"], "cols": pz["cols"],
                    "entries": pz["entries"],
                })

    out = (HEADER
           + "\nexport const CYCLES = " + json.dumps(CYCLES, ensure_ascii=False, indent=2) + ";\n"
           + "\nexport const CATEGORIES = " + json.dumps(basic_categories + new_categories, ensure_ascii=False, indent=2) + ";\n"
           + "\n" + difficulties_js + "\n"
           + "\nexport const PUZZLES = " + json.dumps(basic_puzzles + new_puzzles, ensure_ascii=False, separators=(", ", ": ")) + ";\n"
           + FOOTER)
    with open(PUZZLES_FILE, "w", encoding="utf-8", newline="\n") as f:
        f.write(out)

    # Planilha de revisão (Excel em português: separador ";" e UTF-8 com BOM)
    os.makedirs(os.path.dirname(REVIEW_FILE), exist_ok=True)
    def cell(v):
        v = str(v)
        return '"' + v.replace('"', '""') + '"' if any(ch in v for ch in ';"\n') else v
    rows = [["Categoria", "Dificuldade", "Nível", "Nº", "Direção", "Resposta", "Dica", "Também aparece em"]]
    for pz in new_puzzles:
        for e in pz["entries"]:
            rows.append([pz["categoryName"], pz["difficultyName"], pz["level"], e["number"],
                         "Horizontal" if e["dir"] == "across" else "Vertical",
                         e["answer"], e["clue"], basic_answers.get(e["answer"], "")])
    with open(REVIEW_FILE, "w", encoding="utf-8-sig", newline="") as f:
        f.write("\r\n".join(";".join(cell(v) for v in r) for r in rows) + "\r\n")

    print(f"puzzles.js: {len(basic_puzzles)} do ciclo básico + {len(new_puzzles)} do ciclo avançado")
    print(f"revisão: {len(rows) - 1} perguntas em {os.path.normpath(REVIEW_FILE)}")


if __name__ == "__main__":
    write_outputs()

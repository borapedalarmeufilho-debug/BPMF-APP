# Como adicionar uma nova cicloviagem ao app

[Certeza] A arquitetura do app já é multi-rota — não precisa mexer em código pra lançar uma nova jornada. `turmas.json` aponta cada turma pra um arquivo de aventura (`aventuraId` + `.json`), e todo o app (Home, Rota, Cronograma, Checklist, Conteúdo, SOS) renderiza dinamicamente a partir desse arquivo. O logo, a marca e a navegação são fixos — só o conteúdo da viagem muda.

## Passo a passo

1. **Crie o arquivo `[nome-da-rota].json`** copiando `rota-da-luz.json` como modelo. Campos obrigatórios:
   - `id`, `nome`, `subtitulo`, `totalKm`, `totalDias`, `fonteRota`
   - `dias[]` — um objeto por dia: `n`, `data`, `from`, `to`, `saida`, `km`, `elev`, `tempo`, `chegada`, `refs`, `link` (Wikiloc/Strava), `gpxFile`, `alerta` (opcional), `pousadas[]` (`nome`, `desc`, `tel`, `rec`), `paradas[]` (`km`, `nome`, `tag`, `desc`, `ideia`, `fonte`)
   - `checklist` — objeto com categorias e listas de itens
   - `climaEsperado`, `cidadesEmergencia[]`, `portaFrase`
   - `conteudoSemana[]` — pauta de conteúdo por etapa (reel + carrossel, speech, AI prompts)

2. **Adicione os arquivos GPX** da nova rota na mesma pasta, com o nome exato usado em `dias[].gpxFile` de cada dia.

3. **Adicione uma nova turma em `turmas.json`**:
   ```json
   {
     "id": "turma-[algo-unico]",
     "aventuraId": "[nome-da-rota]",
     "pin": "[PIN NOVO — nunca reaproveitar um já usado]",
     "label": "[Nome da rota] — [grupo]",
     "status": "ativa",
     "dataInicio": "AAAA-MM-DD",
     "dataFim": "AAAA-MM-DD",
     "participantesPadrao": ["Nome 1", "Nome 2", "..."]
   }
   ```
   `participantesPadrao` pode ter qualquer número de pessoas — o app não depende mais de serem exatamente 3 (bug corrigido em 26/08/2026).

4. **Encerrando uma turma antiga:** mude o `status` dela pra `"arquivada"` — ela some do app mesmo que alguém ainda digite o PIN antigo. Nunca reaproveitar PIN já usado.

5. **Deploy:** suba os arquivos novos (`.json` da rota + `.gpx` + `turmas.json` atualizado) manualmente no GitHub (mesmo processo de drag-and-drop já usado pro app). Não precisa subir `index.html` de novo a menos que o código do app também tenha mudado.

## O que é fixo (não muda por rota)

- Logo/marca: `logo-bpmf-oficial.png`, `icon-192.png`, `icon-512.png` — usados em todas as viagens.
- `index.html`, `manifest.json`, `service-worker.js` — código do app, comum a todas as rotas.
- Paleta e tipografia — `BRAND-KIT-CICLOAVENTURAS.md`.

## Cuidado ao escrever o `.json` da rota

Nunca inventar dado de pousada, telefone, waypoint ou distância. Cada campo do `rota-da-luz.json` tem uma tag de confiança (`[Certeza]`/`[Provável]`) na fonte — manter esse padrão nas rotas novas. Se não tiver a informação confirmada, deixar `null`/em branco e sinalizar, como já foi feito com "Buscar 2ª opção em Santa Branca".

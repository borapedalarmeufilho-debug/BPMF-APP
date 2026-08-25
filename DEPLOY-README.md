# BPMF CicloAventuras — como publicar

App estático (PWA) — sem backend, sem servidor rodando, sem custo de hospedagem. Roda inteiro em GitHub Pages, igual ao painel-marcela e painel-trac, mas num repositório **novo e separado** (você escolheu isso).

## O que tem nesta pasta

- `index.html` — o app inteiro (PIN gate + Home + Rota/Mapa + Cronograma + Checklist + Gastos + Conteúdo + SOS)
- `manifest.json` + `service-worker.js` — deixam o app instalável e funcionando offline
- `icon.svg` — ícone provisório (emblema BPMF simplificado). Se quiser o logo oficial em PNG, me mande o arquivo de imagem numa próxima sessão que eu troco.
- `rota-da-luz.json` — todo o conteúdo da 1ª Aventura (dias, paradas, pousadas, checklist, pauta de conteúdo, SOS)
- `turmas.json` — a lista de turmas ativas/arquivadas e seus PINs de acesso
- `dia1-mogi-santabranca.gpx`, `dia2-santabranca-redencao.gpx`, `dia3-redencao-aparecida.gpx` — os arquivos GPX reais
- `BRAND-KIT-CICLOAVENTURAS.md` — paleta e tipografia oficiais (do manual de marca)

## Repositório oficial

`https://github.com/borapedalarmeufilho-debug/BPMF-APP` (criado por Alexandre em 25/08/2026)

## Passo a passo pra publicar (primeira vez)

1. Repositório já criado — pule pro passo 2.
2. No PowerShell, dentro desta pasta (`BPMF-CicloAventuras-APP`):
   ```powershell
   git init
   git add .
   git commit -m "BPMF CicloAventuras — v1"
   git branch -M main
   git remote add origin https://github.com/borapedalarmeufilho-debug/BPMF-APP.git
   git push -u origin main
   ```
   Se pedir login, use suas credenciais do GitHub (ou um Personal Access Token, se tiver 2FA ativado).
3. No GitHub: entre no repositório → Settings → Pages → Source: branch `main`, pasta `/ (root)` → Save.
4. Em alguns minutos o app estará em `https://borapedalarmeufilho-debug.github.io/BPMF-APP/`.
5. Envie esse link + o PIN (`ROTA2026` por padrão — troque antes de mandar pra galera de verdade) pro grupo.

## Toda vez que atualizar conteúdo

```powershell
git add .
git commit -m "atualiza conteúdo"
git push
```

Use o `deploy-cicloaventuras.ps1` (incluso nesta pasta) pra automatizar esses 3 comandos, do mesmo jeito que o `deploy-paineis.ps1` já funciona pros outros painéis.

## Como abrir/fechar uma turma

- **Abrir turma nova:** edite `turmas.json`, adicione um novo objeto no array `turmas` com `pin` novo, `status: "ativa"`, datas e nomes. Rode o deploy.
- **Arquivar turma:** troque o `status` daquela turma de `"ativa"` pra `"arquivada"`. Rode o deploy. O PIN antigo para de funcionar imediatamente (mesmo que a pessoa digite certo).
- **Nunca reaproveite um PIN já usado** — mesmo arquivada, deixe o registro no JSON (histórico), só crie um PIN novo pra próxima turma.

## Limitações importantes (leia antes de usar com clientes de verdade)

- **PIN não é senha de banco.** É uma cerca simples, checada no próprio navegador — qualquer pessoa técnica consegue contornar olhando o código-fonte. Serve pra organizar acesso entre turmas, não pra proteger dado sensível.
- **Gastos e checklist não sincronizam entre celulares.** Cada aparelho guarda o que registrou nele. Ao final do dia, o grupo compara/soma manualmente (é o padrão mais realista pra rota sem sinal).
- **Mapa offline (pan/zoom) ainda não funciona 100% fora de área com sinal.** O botão "Baixar Aventura" já guarda o conteúdo de texto e os arquivos GPX, mas os tiles do mapa (as "imagens" do território) fora da área que você já visualizou online ainda dependem de internet. Isso é a v2 que ficou combinada.

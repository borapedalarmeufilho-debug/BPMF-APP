# deploy-cicloaventuras.ps1
# Uso: abra o PowerShell nesta pasta e rode:  .\deploy-cicloaventuras.ps1 "mensagem do commit"
# Mesmo padrao do deploy-paineis.ps1 que voce ja usa pro painel-marcela/painel-trac,
# mas apontando pro repositorio novo e separado do BPMF CicloAventuras:
# https://github.com/borapedalarmeufilho-debug/BPMF-APP
#
# PRIMEIRA VEZ (repo ainda sem nada pushado)? Rode antes disso:
#   git init
#   git remote add origin https://github.com/borapedalarmeufilho-debug/BPMF-APP.git
#   git branch -M main
# Depois disso, so usar este script normalmente daqui pra frente.

param(
    [string]$Mensagem = "atualiza BPMF CicloAventuras"
)

Write-Host "Publicando BPMF CicloAventuras..." -ForegroundColor Green
git add .
git commit -m "$Mensagem"
git push

Write-Host "Pronto. Pode levar alguns minutos pro GitHub Pages atualizar." -ForegroundColor Green

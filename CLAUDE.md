# Projeto: garimpo-bio

Página de links da bio do **Garimpo Outdoor** (achados de pesca, camping e trilha da Shopee). Site estático em
`docs/` no GitHub Pages, repositório `madthiago/garimpo-bio`, endereço `https://madthiago.github.io/garimpo-bio/`
(sem domínio próprio por enquanto: sem `docs/CNAME`).

Adaptado em 2026-11-25 do `apurados-bio` (outra marca). O `README.md` é o manual de origem, com placeholders.

## Ligação com os outros projetos
- O `../garimpo-admin` publica aqui sozinho (canal Site): commit em `docs/produtos.json` por git/SSH (deploy key com
  escrita). Em modo teste vai para o branch `teste-admin`.
- O admin lê `ferramentas/categorias.json` na carga inicial (`sementes`): são os nichos dele.
- `ferramentas/bio.py` (Python stdlib, `py`) é manutenção à mão. Os comandos `importar` e `conferir` vieram do
  projeto de origem e dependem de pastas que não existem aqui; com o admin no ar, a conferência é dele.

## Regras
- Tudo em pt-BR. Repositório público: sem segredos nem dados pessoais.
- Só os campos de `CAMPOS_PUBLICOS` (`bio.py`; cópia em `garimpo-admin/backend/apurados/canais/site.py`) vão ao site.
- Categorias: o produto cai na primeira cuja palavra aparece no nome; não ponha palavras genéricas ("pesca",
  "camping") numa categoria, senão "Camisa UV Pesca" sai de Roupas.
- Cores: fundo `#001e01`, destaque `#fe8101` (as variáveis no CSS ainda se chamam `--preto`/`--amarelo`).
- Foto só a real do anúncio; preço sempre com a data; manter o aviso `#publi` no rodapé.
- Validar com `bio previa` em 375 px antes de publicar. Nunca o admin e o `bio publicar` escrevendo juntos no `main`.

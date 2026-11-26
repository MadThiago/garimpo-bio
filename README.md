# apurados-bio

Página de links da bio para afiliados da Shopee: um site estático, publicado pelo GitHub Pages, com três partes:
- os links das redes (Instagram e canal do Telegram);
- os achados da Shopee, cada um com preço, data da apuração e link de afiliado;
- busca e filtro por categoria.

Os dados ficam num único arquivo, `docs/produtos.json`. Ele é alimentado de duas formas:
- **pelo [apurados-admin](#1-como-os-achados-chegam)**, que publica sozinho pelo canal Site;
- **pela CLI `ferramentas/bio.py`**, para manutenção à mão. É só Python, sem dependências.

## Placeholders usados neste documento

Troque pelos valores da sua marca. Na seção [Personalizar para a sua marca](#7-personalizar-para-a-sua-marca) está
onde cada um aparece nos arquivos.

| Placeholder | O que é | Exemplo |
|---|---|---|
| `<DOMINIO_DO_SITE>` | Domínio do site | `exemplo.com.br` |
| `<NOME_DA_MARCA>` | Nome exibido no título e na prévia de compartilhamento | `Achados da Ana` |
| `<USUARIO_GITHUB>` | Dono do repositório no GitHub | `seu-usuario` |
| `<USUARIO_INSTAGRAM>` | Perfil do Instagram | `seu.perfil` |
| `<CANAL_TELEGRAM>` | Canal do Telegram (`t.me/...`) | `seucanal` |
| `<CODIGO_GOATCOUNTER>` | Código do site no GoatCounter | `seusite` |
| `<PASTA_DAS_CAMPANHAS>` | Pasta com as execuções de campanha que o `importar` lê | `C:\caminho\campanhas` |
| `<CLI_SHOPEE>` | CLI da Shopee Affiliate Open API usada para links e conferência | `C:\caminho\shopee-api\shopee.cmd` |

## Índice

1. [Como os achados chegam](#1-como-os-achados-chegam)
2. [Estrutura](#2-estrutura)
3. [Formato do `produtos.json`](#3-formato-do-produtosjson)
4. [CLI `bio.py`](#4-cli-biopy)
5. [Categorias](#5-categorias)
6. [Conferir se os achados ainda valem](#6-conferir-se-os-achados-ainda-valem)
7. [Personalizar para a sua marca](#7-personalizar-para-a-sua-marca)
8. [Hospedagem (GitHub Pages + domínio)](#8-hospedagem-github-pages--domínio)
9. [Contagem de visitas e cliques](#9-contagem-de-visitas-e-cliques)
10. [Regras](#10-regras)

---

## 1. Como os achados chegam

**Pelo apurados-admin (o caminho normal)**
- O canal **Site** do apurados-admin faz um commit em `docs/produtos.json` neste repositório, por git/SSH, com uma
  deploy key com permissão de escrita.
- Em **modo teste**, o commit vai para o branch `teste-admin`, que o GitHub Pages não serve. Fora do modo teste, vai
  para o `main`.
- O site atualiza em cerca de 1 minuto.
- A conferência dos achados e a limpeza dos antigos também ficam com o admin.
- A configuração está no README do apurados-admin (Config › Site).

**Pela CLI (manutenção à mão)** — `bio.py` adiciona, oculta, destaca, recategoriza e publica (seção 4).

**Nunca os dois escrevendo ao mesmo tempo no `main`.** O `bio publicar` não faz `pull` antes do `push`. Antes de usar a
CLI, rode `git pull`; o admin se recupera sozinho com `pull --rebase` se o push for recusado.

## 2. Estrutura

```
docs/index.html              página
docs/assets/estilo.css       identidade visual (cores e fontes)
docs/assets/app.js           monta os cards a partir de produtos.json: busca, filtro por categoria, rolagem infinita (12 por vez)
docs/assets/fontes/          Barlow (licença OFL em OFL.txt)
docs/assets/img/             perfil.webp, favicon.png, apple-touch-icon.png, og.jpg (1200×630)
docs/produtos.json           dados (gerado; pode editar à mão, mantendo o JSON válido)
docs/CNAME                   domínio do GitHub Pages
docs/privacidade*.html       políticas de privacidade (do site; e a exigida pelo app de backup do Google, se usar)
ferramentas/bio.py           CLI
ferramentas/categorias.json  categorias da página e regras de classificação (o apurados-admin também lê)
ferramentas/cache-links.json links de afiliado já gerados (fora do git)
bio.bat                      atalho no Windows: bio <comando> = py ferramentas\bio.py <comando>
```

## 3. Formato do `produtos.json`

```json
{
  "atualizado_em": "AAAA-MM-DDTHH:MM:SS",
  "categorias": [ ... ],
  "produtos": [
    {"id": "<itemid da Shopee>", "nome": "…", "preco": "199,00", "link": "<link de afiliado>",
     "foto": "<URL da imagem do anúncio>", "loja": "…", "categoria": "casa", "apurado_em": "AAAA-MM-DD",
     "adicionado_em": "…", "ativo": true}
  ]
}
```

**Campos**
- Só os campos de `CAMPOS_PUBLICOS` (em `bio.py`) chegam ao site:
  - `id`, `nome`, `preco`, `link`, `foto`, `loja`;
  - `categoria`, `categoria_manual`;
  - `campanha`, `campanha_titulo`;
  - `apurado_em`, `adicionado_em`;
  - `destaque`, `ativo`;
  - `conferido_em`, `oculto_por`, `motivo`.
- O apurados-admin tem uma cópia dessa lista (`backend/apurados/canais/site.py`). **Mudou num, mude no outro.**
- O `id` é o `itemid` da Shopee. Reimportar o mesmo item atualiza preço, link e data.

## 4. CLI `bio.py`

**Requisitos**
- Python 3. No Windows, `py`; no Linux e no Mac, `python3 ferramentas/bio.py`.
- Para `importar` e `conferir`, e para gerar links:
  - ajuste no topo de `ferramentas/bio.py` as constantes `DADOS_CAMPANHAS` (`<PASTA_DAS_CAMPANHAS>`) e `SHOPEE`
    (`<CLI_SHOPEE>`);
  - a CLI da Shopee precisa ter as credenciais da Open API configuradas.

```
bio adicionar --nome "Fone X" --preco 89,90 --link <link de afiliado> --foto <URL da imagem> [--loja ...] [--categoria casa] [--publicar]
bio importar <pasta da execução ou manifest.json> [--titulo "Nome curto"] [--item <itemid>] [--publicar]
bio listar [--todos]                 # --todos mostra também os ocultos e o motivo
bio destacar <id> [--nao]            # fixa no topo
bio ocultar <id> | bio mostrar <id> | bio remover <id>
bio limpar --dias 30                 # oculta achados apurados há mais de N dias
bio categorizar [<id> <categoria|auto>]
bio conferir [--publicar]
bio previa [--porta 8000]            # abre http://localhost:8000
bio publicar [-m "mensagem"]         # commit de docs/ e push no main; o site atualiza em ~1 min
```

**`importar`**
- Lê o `manifest.json` de uma execução de campanha: o campo `pedido.produtos` e o `comite/candidatos.json`, que dá os
  ids de categoria.
- Gera um link de afiliado próprio por item, com os sub_ids `bio <campanha> site a <itemid>`. As vendas da página
  saem separadas nos relatórios.
- Os links ficam em `ferramentas/cache-links.json`, para não chamar a API de novo.
- `--link-campanha` usa o link da campanha em vez de gerar outro.

**Antes de publicar:** confira com `bio previa` em largura de celular (375 px).

## 5. Categorias

Cada achado ganha uma `categoria` automática, e a página mostra filtros só das categorias que têm achado. A tabela
fica em `ferramentas/categorias.json`: ordem dos filtros, nomes e regras.

**Regras, na ordem.** Cada produto cai na primeira que bater:
1. **ids de categoria da Shopee** (`productCatIds`), o nível mais específico primeiro;
2. **palavras no nome**, na ordem das categorias;
3. `padrao` ("Outros"). Nesse caso, o terminal avisa para incluir o id na tabela.

```
bio categorizar                       # reclassifica todos depois de editar a tabela (--sem-api: só o que já se sabe)
bio categorizar <itemid> beleza       # fixa à mão (vale mais que a automática, inclusive em reimportações)
bio categorizar <itemid> auto         # volta à automática
```

**Link direto** para uma categoria: `https://<DOMINIO_DO_SITE>/#<id da categoria>`.

## 6. Conferir se os achados ainda valem

`bio conferir [--publicar]` consulta cada achado visível na Open API, pelo itemid (1 chamada por item):

| Situação na API | O que acontece |
|---|---|
| item não encontrado | some do site (`oculto_por: conferir`) |
| oferta encerrada (`periodEndTime` no passado) | some do site |
| comissão zerada | some do site |
| preço mudou | atualiza o preço |
| ok | só renova "Preço apurado em" para hoje |

**O que volta ao site**
- O que o `conferir` ou o `limpar` ocultou é conferido de novo e volta se ainda valer.
- O que foi ocultado à mão (`bio ocultar`) nunca volta sozinho.
- Erro da API não oculta nada.

Com o apurados-admin no ar, essa conferência roda pelo trabalhador dele, a cada 3 horas.

## 7. Personalizar para a sua marca

| Onde | O que trocar |
|---|---|
| `docs/CNAME` | `<DOMINIO_DO_SITE>` |
| `docs/index.html` | `<title>`, `canonical`, as tags `og:*` (`og:site_name`, `og:title`, `og:url`, `og:image` com URL absoluta em `<DOMINIO_DO_SITE>`), os links do Instagram (`instagram.com/<USUARIO_INSTAGRAM>/`) e do Telegram (`t.me/<CANAL_TELEGRAM>`), e o script do GoatCounter (`https://<CODIGO_GOATCOUNTER>.goatcounter.com/count`) |
| `docs/assets/img/` | `perfil.webp`, `favicon.png`, `apple-touch-icon.png` e `og.jpg` (1200×630) |
| `docs/assets/estilo.css` | Cores e fontes da identidade |
| `docs/privacidade*.html` | Nome da marca, domínio e contato |
| `ferramentas/bio.py` | `DADOS_CAMPANHAS`, `SHOPEE` e o texto de ajuda que cita o domínio |
| `ferramentas/categorias.json` | Categorias e regras do seu nicho |

## 8. Hospedagem (GitHub Pages + domínio)

1. **GitHub Pages:** em Settings › Pages, escolha a branch `main`, pasta `/docs`, domínio `<DOMINIO_DO_SITE>` e
   **Enforce HTTPS**.
2. **DNS do domínio**, no seu provedor de DNS:
   - registros **A** do domínio raiz para os IPs do GitHub Pages: `185.199.108.153`, `185.199.109.153`,
     `185.199.110.153` e `185.199.111.153`;
   - **CNAME** `www` para `<USUARIO_GITHUB>.github.io`;
   - na Cloudflare, deixe esses registros em **Somente DNS** (nuvem cinza): com proxy, o certificado do GitHub não
     sai.
3. **Certificado HTTPS:** o GitHub emite e renova sozinho, para o domínio e o `www`. O `www` e o `http` redirecionam
   para `https://<DOMINIO_DO_SITE>/`.
   - **Se o certificado não sair**, normalmente é porque o domínio foi cadastrado no Pages antes de o DNS existir. Em
     Settings › Pages, tire e recoloque o domínio; isso gera 2 commits no `docs/CNAME`.
   - Depois, ligue o HTTPS obrigatório com
     `gh api -X PUT repos/<USUARIO_GITHUB>/<repositório>/pages -F https_enforced=true`.
4. **Prévia de compartilhamento:** `docs/assets/img/og.jpg`, 1200×630, com URL absoluta no domínio.

## 9. Contagem de visitas e cliques

GoatCounter, sem cookies. Crie um site em goatcounter.com e ponha o código no `index.html` (seção 7). O painel fica
em `https://<CODIGO_GOATCOUNTER>.goatcounter.com`.

| Evento | Como aparece |
|---|---|
| Clique em produto | `clique/<itemid>` |
| Clique nas redes | `rede/<nome>` |
| Filtro de categoria | `categoria/<id>` |

O contador ignora `localhost`, então a prévia não conta.

## 10. Regras

- **O repositório é público:** nada de segredos nem de dados pessoais nele.
- **Só campos públicos** vão para `docs/produtos.json`. Comissão, justificativas, sub_ids e outros dados internos
  nunca entram (`CAMPOS_PUBLICOS`).
- **Foto** é sempre a do anúncio (URL da Shopee). A página usa a miniatura `_tn`.
- **Preço** sempre com "Preço apurado em DD/MM. Pode mudar.", e o rodapé tem o aviso `#publi` de link de afiliado.
- **Dados da Shopee** só pela Open API. Nunca abrir as páginas da Shopee para conferir: os termos do programa de
  afiliados proíbem scraping.
- **Commits** separados por escopo. O `bio publicar` faz commit só de `docs/`.

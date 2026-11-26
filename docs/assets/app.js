// Monta a lista de achados a partir de produtos.json (mantido por ferramentas/bio.py).
(() => {
  const lista = document.getElementById("lista");
  const filtros = document.getElementById("filtros");
  const busca = document.getElementById("busca");
  const vazio = document.getElementById("vazio");
  document.getElementById("ano").textContent = new Date().getFullYear();

  let produtos = [];
  let categorias = [];
  // Categoria ativa vem do endereço (#beleza): dá para mandar o link direto de uma categoria.
  let categoriaAtiva = decodeURIComponent(location.hash.slice(1));

  const semAcento = (s) => (s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

  const dataCurta = (iso) => {
    const [, m, d] = (iso || "").split("-");
    return d && m ? `${d}/${m}` : "";
  };

  // Foto da Shopee: versão miniatura (_tn); se falhar, usa a original.
  const miniatura = (url) => /cf\.shopee\.com\.br\/file\/[^/?#]+$/.test(url) && !url.endsWith("_tn") ? url + "_tn" : url;

  const el = (tag, cls, texto) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (texto != null) e.textContent = texto;
    return e;
  };

  function card(p) {
    const li = el("li");
    const a = el("a", "card");
    a.href = p.link;
    a.target = "_blank";
    a.rel = "noopener sponsored";
    a.dataset.id = p.id;
    a.dataset.nome = p.nome;
    a.setAttribute("aria-label", `${p.nome}, R$ ${p.preco}. Comprar na Shopee`);

    const foto = el("div", "card__foto");
    const img = el("img");
    img.src = miniatura(p.foto);
    img.alt = "";
    img.loading = "lazy";
    img.decoding = "async";
    img.addEventListener("error", () => { if (img.src !== p.foto) img.src = p.foto; }, { once: true });
    foto.append(img);
    if (p.campanha_titulo) foto.append(el("span", "card__tag", p.campanha_titulo));

    const corpo = el("div", "card__corpo");
    corpo.append(el("h3", "card__nome", p.nome));
    if (p.loja) corpo.append(el("p", "card__loja", p.loja.trim()));

    const [int, cent = "00"] = String(p.preco).split(",");
    const preco = el("div", "preco");
    preco.append(el("span", "preco__rs", "R$"), el("span", "preco__int", int), el("span", "preco__cent", "," + cent));
    corpo.append(preco);
    const data = dataCurta(p.apurado_em);
    if (data) corpo.append(el("p", "card__nota", `Preço apurado em ${data}. Pode mudar.`));

    const botao = el("span", "card__botao", "Comprar");
    botao.insertAdjacentHTML("beforeend", '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/></svg>');
    corpo.append(botao);

    a.append(foto, corpo);
    li.append(a);
    return li;
  }

  // Rolagem infinita: mostra POR_PAGINA achados por vez (12 = fecha linha de 2 e de 3 colunas) e acrescenta
  // mais quando o marcador abaixo da lista chega perto da tela. Busca e filtro recomeçam da primeira página.
  const POR_PAGINA = 12;
  let visiveis = [];
  let mostrados = 0;
  const marcador = el("div", "mais");
  marcador.setAttribute("aria-hidden", "true");
  lista.after(marcador);

  const observador = "IntersectionObserver" in window
    ? new IntersectionObserver((entradas) => { if (entradas.some((e) => e.isIntersecting)) mostrarMais(); },
      { rootMargin: "0px 0px 600px 0px" })
    : null;

  function mostrarMais() {
    // Sem IntersectionObserver (navegador antigo): mostra tudo de uma vez.
    const ate = observador ? mostrados + POR_PAGINA : visiveis.length;
    lista.append(...visiveis.slice(mostrados, ate).map(card));
    mostrados = Math.min(ate, visiveis.length);
    const acabou = mostrados >= visiveis.length;
    marcador.hidden = acabou;
    if (!observador) return;
    observador.unobserve(marcador);
    // Observar de novo faz o navegador reavaliar: se o marcador ainda estiver à vista (tela alta), carrega mais.
    if (!acabou) observador.observe(marcador);
  }

  function desenhar() {
    const termo = semAcento(busca.value.trim());
    visiveis = produtos.filter((p) =>
      (!categoriaAtiva || p.categoria === categoriaAtiva) &&
      (!termo || semAcento(`${p.nome} ${p.loja || ""} ${p.campanha_titulo || ""} ${nomeCategoria(p.categoria)}`).includes(termo)));
    lista.replaceChildren();
    mostrados = 0;
    vazio.hidden = visiveis.length > 0;
    mostrarMais();
  }

  const nomeCategoria = (id) => (categorias.find((c) => c.id === id) || {}).nome || "";

  // Filtros: só as categorias que têm achado, da que tem mais para a que tem menos (empate: ordem de
  // categorias.json). Rótulo curto ("Casa e cozinha" -> "Casa") para caberem todos no celular sem rolar de lado.
  const rotuloCurto = (c) => c.curto || c.nome.split(" e ")[0];
  function montarFiltros() {
    const qtd = (id) => produtos.filter((p) => !id || p.categoria === id).length;
    const usadas = categorias.filter((c) => qtd(c.id) > 0)
      .map((c, i) => ({ c, i, n: qtd(c.id) }))
      .sort((x, y) => y.n - x.n || x.i - y.i)
      .map((x) => x.c);
    if (!usadas.some((c) => c.id === categoriaAtiva)) categoriaAtiva = "";
    if (usadas.length < 2) { filtros.replaceChildren(); return; }
    const botao = (id, texto, titulo) => {
      const b = el("button", "filtro", texto);
      b.type = "button";
      b.append(el("span", "filtro__n", String(qtd(id))));
      if (titulo) b.title = titulo;
      b.setAttribute("aria-pressed", String(id === categoriaAtiva));
      b.addEventListener("click", () => {
        categoriaAtiva = id;
        filtros.querySelectorAll(".filtro").forEach((f) => f.setAttribute("aria-pressed", String(f === b)));
        history.replaceState(null, "", id ? `#${id}` : location.pathname + location.search);
        if (id) contar(`categoria/${id}`, titulo || texto);
        desenhar();
      });
      return b;
    };
    filtros.replaceChildren(botao("", "Todos"), ...usadas.map((c) => botao(c.id, rotuloCurto(c), c.nome)));
  }

  busca.addEventListener("input", desenhar);

  // Cliques (GoatCounter): produtos viram /clique/<id>, redes viram /rede/<nome>. Sem o contador, não faz nada.
  function contar(caminho, titulo) {
    try {
      if (window.goatcounter && window.goatcounter.count) window.goatcounter.count({ path: caminho, title: titulo, event: true });
    } catch (_) { /* contagem nunca atrapalha o clique */ }
  }
  lista.addEventListener("click", (ev) => {
    const a = ev.target.closest("a.card");
    if (a) contar(`clique/${a.dataset.id}`, a.dataset.nome);
  });
  document.querySelectorAll("[data-rede]").forEach((a) =>
    a.addEventListener("click", () => contar(`rede/${a.dataset.rede}`, a.dataset.rede)));

  fetch("produtos.json", { cache: "no-cache" })
    .then((r) => r.json())
    .then((dados) => {
      categorias = dados.categorias || [];
      produtos = (dados.produtos || [])
        .filter((p) => p.ativo !== false)
        .sort((a, b) => (b.destaque === true) - (a.destaque === true) || (b.adicionado_em || "").localeCompare(a.adicionado_em || ""));
      montarFiltros();
      desenhar();
    })
    .catch(() => { vazio.textContent = "Não deu para carregar os achados agora. Atualize a página."; vazio.hidden = false; });
})();

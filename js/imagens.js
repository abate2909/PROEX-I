(function () {
  "use strict";

  const CHAVE_CACHE = "frotasegura_imagens";
  const WIKIPEDIAS = ["https://pt.wikipedia.org/w/api.php", "https://en.wikipedia.org/w/api.php"];
  const requisicoesPendentes = new Map();

  function lerCache() {
    try {
      return JSON.parse(localStorage.getItem(CHAVE_CACHE) || "{}");
    } catch (erro) {
      console.warn("Não foi possível ler o cache de imagens.", erro);
      return {};
    }
  }

  function salvarCache(cache) {
    try {
      localStorage.setItem(CHAVE_CACHE, JSON.stringify(cache));
    } catch (erro) {
      console.warn("Não foi possível salvar o cache de imagens.", erro);
    }
  }

  function urlConsulta(base, parametros) {
    return `${base}?${new URLSearchParams({ ...parametros, format: "json", origin: "*" })}`;
  }

  async function consultar(base, parametros) {
    const resposta = await fetch(urlConsulta(base, parametros));
    if (!resposta.ok) throw new Error(`Consulta de imagem retornou HTTP ${resposta.status}.`);
    const resultado = await resposta.json();
    const paginas = resultado.query && resultado.query.pages
      ? Object.values(resultado.query.pages)
      : [];
    const paginaComImagem = paginas.find((pagina) => pagina.thumbnail && pagina.thumbnail.source);
    return paginaComImagem ? paginaComImagem.thumbnail.source : null;
  }

  async function buscarImagemCarro(nome) {
    let cache = lerCache();
    if (!cache || typeof cache !== "object" || Array.isArray(cache)) cache = {};
    if (typeof cache[nome] === "string") return cache[nome];
    if (requisicoesPendentes.has(nome)) return requisicoesPendentes.get(nome);

    const requisicao = (async () => {
      let imagem = null;
      async function consultarIdiomas(parametros) {
        for (const base of WIKIPEDIAS) {
          try {
            const resultado = await consultar(base, parametros);
            if (resultado) return resultado;
          } catch (erro) {
            console.warn(`Falha na consulta de imagem em ${base}.`, erro);
          }
        }
        return null;
      }

      try {
        imagem = await consultarIdiomas({
          action: "query",
          titles: nome,
          prop: "pageimages",
          piprop: "thumbnail",
          pithumbsize: "600",
          redirects: "1"
        });

        if (!imagem) {
          imagem = await consultarIdiomas({
            action: "query",
            generator: "search",
            gsrsearch: `${nome} carro`,
            gsrlimit: "1",
            prop: "pageimages",
            piprop: "thumbnail",
            pithumbsize: "600"
          });
        }
      } catch (erro) {
        console.warn(`Não foi possível buscar imagem para ${nome}.`, erro);
      }

      if (imagem) {
        cache[nome] = imagem;
        salvarCache(cache);
      }
      return imagem;
    })();

    requisicoesPendentes.set(nome, requisicao);
    try {
      return await requisicao;
    } finally {
      requisicoesPendentes.delete(nome);
    }
  }

  window.FrotaSeguraImagens = { buscarImagemCarro };
})();

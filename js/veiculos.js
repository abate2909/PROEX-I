(function () {
  "use strict";

  const dados = window.FrotaSeguraDados;
  let veiculos = dados.carregar();

  const grade = document.getElementById("gradeVeiculos");
  const busca = document.getElementById("busca");
  const filtro = document.getElementById("filtroStatus");
  const modal = document.getElementById("modalHistorico");
  const conteudoHistorico = document.getElementById("conteudoHistorico");
  let sequenciaRender = 0;
  let sequenciaModal = 0;

  function formatarDataHora(valor) {
    if (!valor) return "Não informado";
    const data = new Date(valor);
    return Number.isNaN(data.getTime()) ? valor : data.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
  }

  function atualizarResumo() {
    const emUso = veiculos.filter((veiculo) => veiculo.status === "Em uso").length;
    document.getElementById("totalVeiculos").textContent = veiculos.length;
    document.getElementById("veiculosEmUso").textContent = emUso;
    document.getElementById("veiculosDisponiveis").textContent = veiculos.length - emUso;
  }

  function mostrarPlaceholder(container, nome) {
    container.classList.remove("image-loading");
    container.removeAttribute("aria-busy");
    container.innerHTML = `<div class="image-placeholder" role="img" aria-label="Imagem indisponível para ${nome}"><span aria-hidden="true">🚘</span></div>`;
  }

  function aplicarImagem(container, nome, url) {
    if (!url) {
      mostrarPlaceholder(container, nome);
      return;
    }

    const imagem = document.createElement("img");
    imagem.loading = "lazy";
    imagem.alt = `Foto do ${nome}`;
    imagem.addEventListener("load", () => {
      container.classList.remove("image-loading");
      container.removeAttribute("aria-busy");
    }, { once: true });
    imagem.addEventListener("error", () => mostrarPlaceholder(container, nome), { once: true });
    container.replaceChildren(imagem);
    container.classList.add("image-loading");
    imagem.src = url;
  }

  function fotoHistorico(url, alt) {
    if (!url || url === "img/placeholder.svg") {
      return '<div class="history-photo-placeholder" role="img" aria-label="Foto de demonstração indisponível"><span aria-hidden="true">🚘</span></div>';
    }
    return `<img src="${url}" alt="${alt}">`;
  }

  function criarCard(veiculo) {
    const emUso = veiculo.status === "Em uso";
    const retirada = emUso ? formatarDataHora(veiculo.retiradaAtual) : "Veículo disponível";
    return `
      <article class="vehicle-card" tabindex="0" role="button" aria-label="Ver histórico de ${veiculo.modelo}, placa ${veiculo.placa}" data-id="${veiculo.id}">
        <div class="vehicle-image image-loading" data-imagem-veiculo="${veiculo.id}" aria-busy="true"><span class="image-skeleton" aria-hidden="true"></span></div>
        <div class="vehicle-body">
          <div class="vehicle-title">
            <div><h2>${veiculo.modelo}</h2><span class="plate">${veiculo.placa}</span></div>
            <span class="status ${emUso ? "busy" : "available"}">${veiculo.status}</span>
          </div>
          <div class="vehicle-meta">
            <div>Cor<strong>${veiculo.cor}</strong></div>
            <div>${emUso ? "Condutor" : "Retirada"}<strong>${emUso ? veiculo.condutorAtual : retirada}</strong></div>
          </div>
          ${emUso ? `<div class="vehicle-meta"><div>Horário de retirada<strong>${retirada}</strong></div></div>` : ""}
        </div>
      </article>`;
  }

  function renderizar() {
    const renderAtual = ++sequenciaRender;
    const texto = busca.value.trim().toLowerCase();
    const status = filtro.value;
    const filtrados = veiculos.filter((veiculo) => {
      const atendeTexto = veiculo.placa.toLowerCase().includes(texto) || veiculo.modelo.toLowerCase().includes(texto);
      const atendeStatus = status === "todos" || veiculo.status === status;
      return atendeTexto && atendeStatus;
    });

    grade.innerHTML = filtrados.length
      ? filtrados.map(criarCard).join("")
      : '<div class="empty-state">Nenhum veículo encontrado.</div>';

    Promise.all(filtrados.map(async (veiculo) => ({
      veiculo,
      url: await window.FrotaSeguraImagens.buscarImagemCarro(veiculo.modelo)
    }))).then((imagens) => {
      if (renderAtual !== sequenciaRender) return;
      imagens.forEach(({ veiculo, url }) => {
        const container = grade.querySelector(`[data-imagem-veiculo="${veiculo.id}"]`);
        if (container) aplicarImagem(container, veiculo.modelo, url);
      });
    });
  }

  function abrirHistorico(veiculo) {
    const aberturaAtual = ++sequenciaModal;
    document.getElementById("modalTitulo").textContent = `${veiculo.modelo} - ${veiculo.placa}`;
    const conteudoVeiculo = `<div class="modal-vehicle-image image-loading" id="fotoModeloHistorico" aria-busy="true"><span class="image-skeleton" aria-hidden="true"></span></div>`;
    if (!veiculo.historico.length) {
      conteudoHistorico.innerHTML = `${conteudoVeiculo}<p class="empty-state">Este veículo ainda não possui usos registrados.</p>`;
    } else {
      conteudoHistorico.innerHTML = `${conteudoVeiculo}<div class="history-list">${veiculo.historico.map((uso) => `
        <article class="history-item">
          <div class="history-head"><strong>${uso.condutor}</strong><span>Matrícula ${uso.matricula}</span></div>
          <div class="history-details">
            Retirada: ${formatarDataHora(uso.retirada)} &nbsp; | &nbsp;
            Devolução: ${formatarDataHora(uso.devolucao)} &nbsp; | &nbsp;
            KM: ${uso.kmInicial.toLocaleString("pt-BR")} → ${uso.kmFinal.toLocaleString("pt-BR")}
          </div>
          ${uso.possivelDano ? '<p class="danger">Possível dano identificado</p>' : ""}
          ${uso.observacoes ? `<p>${uso.observacoes}</p>` : ""}
          <div class="history-photos">
            <figure><figcaption>Antes</figcaption>${fotoHistorico(uso.fotoAntes, `Foto antes do uso por ${uso.condutor}`)}</figure>
            <figure><figcaption>Depois</figcaption>${fotoHistorico(uso.fotoDepois, `Foto depois do uso por ${uso.condutor}`)}</figure>
          </div>
        </article>`).join("")}</div>`;
    }
    modal.hidden = false;
    window.FrotaSeguraImagens.buscarImagemCarro(veiculo.modelo).then((url) => {
      if (aberturaAtual !== sequenciaModal) return;
      const container = document.getElementById("fotoModeloHistorico");
      if (container) aplicarImagem(container, veiculo.modelo, url);
    });
  }

  grade.addEventListener("click", (evento) => {
    const card = evento.target.closest(".vehicle-card");
    if (!card) return;
    const veiculo = veiculos.find((item) => item.id === card.dataset.id);
    if (veiculo) abrirHistorico(veiculo);
  });

  grade.addEventListener("keydown", (evento) => {
    if (evento.key !== "Enter" && evento.key !== " ") return;
    const card = evento.target.closest(".vehicle-card");
    if (card) card.click();
  });

  modal.addEventListener("click", (evento) => {
    if (evento.target.matches("[data-fechar-modal]")) modal.hidden = true;
  });
  document.addEventListener("keydown", (evento) => {
    if (evento.key === "Escape") modal.hidden = true;
  });
  busca.addEventListener("input", renderizar);
  filtro.addEventListener("change", renderizar);

  atualizarResumo();
  renderizar();
})();

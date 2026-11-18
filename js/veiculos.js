(function () {
  "use strict";

  const dados = window.FrotaSeguraDados;
  let veiculos = dados.carregar();

  const grade = document.getElementById("gradeVeiculos");
  const busca = document.getElementById("busca");
  const filtro = document.getElementById("filtroStatus");
  const limparFiltros = document.getElementById("limparFiltros");
  const modal = document.getElementById("modalHistorico");
  const conteudoHistorico = document.getElementById("conteudoHistorico");
  let sequenciaRender = 0;
  let sequenciaModal = 0;
  let acionadorModal = null;

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
    container.innerHTML = `<div class="image-placeholder" role="img" aria-label="Imagem indisponível para ${nome}"></div>`;
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
      return '<div class="history-photo-placeholder" role="img" aria-label="Foto de demonstração indisponível"></div>';
    }
    return `<img src="${url}" alt="${alt}">`;
  }

  function criarLinha(veiculo) {
    const emUso = veiculo.status === "Em uso";
    const retirada = emUso ? formatarDataHora(veiculo.retiradaAtual) : "—";
    return `
      <tr>
        <td data-label="Foto">
          <div class="tabela-miniatura image-loading" data-imagem-veiculo="${veiculo.id}" aria-busy="true">
            <span class="image-skeleton" aria-hidden="true"></span>
          </div>
        </td>
        <td data-label="Veículo">${veiculo.modelo}</td>
        <td data-label="Placa"><span class="placa">${veiculo.placa}</span></td>
        <td data-label="Cor">${veiculo.cor}</td>
        <td data-label="Status"><span class="status ${emUso ? "status--em-uso" : "status--disponivel"}">${veiculo.status}</span></td>
        <td data-label="Condutor">${emUso ? veiculo.condutorAtual : "—"}</td>
        <td data-label="Retirada">${retirada}</td>
        <td data-label="Ação">
          <button class="botao botao--secundario" type="button" data-historico-id="${veiculo.id}" aria-label="Ver histórico de ${veiculo.modelo}, placa ${veiculo.placa}">Ver histórico</button>
        </td>
      </tr>`;
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
      ? filtrados.map(criarLinha).join("")
      : '<tr><td class="estado-vazio" colspan="8">Nenhum veículo encontrado para os filtros aplicados.</td></tr>';

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

  function abrirHistorico(veiculo, acionador) {
    const aberturaAtual = ++sequenciaModal;
    acionadorModal = acionador;
    document.getElementById("modalTitulo").textContent = `${veiculo.modelo} - ${veiculo.placa}`;
    const conteudoVeiculo = `<div class="modal-vehicle-image image-loading" id="fotoModeloHistorico" aria-busy="true"><span class="image-skeleton" aria-hidden="true"></span></div>`;
    if (!veiculo.historico.length) {
      conteudoHistorico.innerHTML = `${conteudoVeiculo}<p class="estado-vazio">Este veículo ainda não possui usos registrados.</p>`;
    } else {
      conteudoHistorico.innerHTML = `${conteudoVeiculo}<div class="history-list">${veiculo.historico.map((uso) => `
        <article class="history-item">
          <div class="history-head"><strong>${uso.condutor}</strong><span>Matrícula ${uso.matricula}</span></div>
          <div class="history-details">
            <span>Retirada: ${formatarDataHora(uso.retirada)}</span>
            <span>Devolução: ${formatarDataHora(uso.devolucao)}</span>
            <span>KM: ${uso.kmInicial.toLocaleString("pt-BR")} → ${uso.kmFinal.toLocaleString("pt-BR")}</span>
          </div>
          ${uso.possivelDano ? '<p class="danger">Possível dano identificado</p>' : ""}
          ${uso.observacoes ? `<p>${uso.observacoes}</p>` : ""}
          <div class="history-photos">
            <figure>
              <figcaption>Antes do uso</figcaption>
              ${fotoHistorico(uso.fotoAntes, `Foto antes do uso por ${uso.condutor}`)}
              <small class="data-foto">${formatarDataHora(uso.retirada)}</small>
            </figure>
            <figure>
              <figcaption>Depois do uso</figcaption>
              ${fotoHistorico(uso.fotoDepois, `Foto depois do uso por ${uso.condutor}`)}
              <small class="data-foto">${formatarDataHora(uso.devolucao)}</small>
            </figure>
          </div>
        </article>`).join("")}</div>`;
    }
    modal.hidden = false;
    document.getElementById("fecharHistorico").focus();
    window.FrotaSeguraImagens.buscarImagemCarro(veiculo.modelo).then((url) => {
      if (aberturaAtual !== sequenciaModal) return;
      const container = document.getElementById("fotoModeloHistorico");
      if (container) aplicarImagem(container, veiculo.modelo, url);
    });
  }

  grade.addEventListener("click", (evento) => {
    const botao = evento.target.closest("[data-historico-id]");
    if (!botao) return;
    const veiculo = veiculos.find((item) => item.id === botao.dataset.historicoId);
    if (veiculo) abrirHistorico(veiculo, botao);
  });

  function fecharHistorico() {
    modal.hidden = true;
    if (acionadorModal && acionadorModal.isConnected) acionadorModal.focus();
  }

  modal.addEventListener("click", (evento) => {
    if (evento.target.matches("[data-fechar-modal]")) fecharHistorico();
  });
  document.addEventListener("keydown", (evento) => {
    if (evento.key === "Escape" && !modal.hidden) fecharHistorico();
  });
  busca.addEventListener("input", renderizar);
  filtro.addEventListener("change", renderizar);
  limparFiltros.addEventListener("click", () => {
    busca.value = "";
    filtro.value = "todos";
    renderizar();
    busca.focus();
  });

  atualizarResumo();
  renderizar();
})();

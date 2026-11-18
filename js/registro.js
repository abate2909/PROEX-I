(function () {
  "use strict";

  const dados = window.FrotaSeguraDados;
  let veiculos = dados.carregar();
  let fotoAntesBase64 = "";
  let fotoDepoisBase64 = "";

  const formRetirada = document.getElementById("formRetirada");
  const formDevolucao = document.getElementById("formDevolucao");
  const selectRetirada = document.getElementById("veiculoRetirada");
  const selectDevolucao = document.getElementById("veiculoDevolucao");
  const mensagem = document.getElementById("mensagemSucesso");
  const camposRetirada = ["veiculoRetirada", "nomeCondutor", "matricula", "finalidade", "kmInicial", "fotoAntes"];
  const camposDevolucao = ["veiculoDevolucao", "kmFinal", "fotoDepois"];
  let etapaAtual = "retirada";
  let sequenciaImagem = 0;

  function formatarDataHora(valor) {
    return new Date(valor).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
  }

  function mostrarEtapa(etapa) {
    etapaAtual = etapa;
    document.getElementById("etapaRetirada").hidden = etapa !== "retirada";
    document.getElementById("etapaDevolucao").hidden = etapa !== "devolucao";
    document.querySelectorAll(".etapa").forEach((botao) => {
      const ativo = botao.dataset.etapa === etapa;
      botao.classList.toggle("ativo", ativo);
      if (ativo) botao.setAttribute("aria-current", "step");
      else botao.removeAttribute("aria-current");
    });
    document.getElementById("indicacaoEtapa").textContent = etapa === "retirada"
      ? "Etapa 1 de 2 - Retirada"
      : "Etapa 2 de 2 - Devolução";
    atualizarVeiculoSelecionado();
  }

  function atualizarSelects() {
    const disponiveis = veiculos.filter((veiculo) => veiculo.status === "Disponível");
    const emUso = veiculos.filter((veiculo) => veiculo.status === "Em uso");
    selectRetirada.innerHTML = disponiveis.length
      ? '<option value="">Selecione um veículo</option>' + disponiveis.map((veiculo) => `<option value="${veiculo.id}">${veiculo.modelo} - ${veiculo.placa}</option>`).join("")
      : '<option value="">Nenhum veículo disponível</option>';
    selectDevolucao.innerHTML = emUso.length
      ? '<option value="">Selecione um veículo</option>' + emUso.map((veiculo) => `<option value="${veiculo.id}">${veiculo.modelo} - ${veiculo.placa}</option>`).join("")
      : '<option value="">Nenhum veículo em uso</option>';
  }

  function mostrarPlaceholderVeiculo() {
    const container = document.getElementById("fotoVeiculoSelecionado");
    container.classList.remove("image-loading");
    container.removeAttribute("aria-busy");
    container.innerHTML = '<div class="image-placeholder" role="img" aria-label="Foto do veículo indisponível"></div>';
  }

  async function atualizarVeiculoSelecionado() {
    const id = etapaAtual === "retirada" ? selectRetirada.value : selectDevolucao.value;
    const veiculo = veiculos.find((item) => item.id === id);
    const container = document.getElementById("fotoVeiculoSelecionado");
    const dadosVeiculo = document.getElementById("dadosVeiculoSelecionado");
    const sequencia = ++sequenciaImagem;

    if (!veiculo) {
      dadosVeiculo.textContent = "Selecione um veículo para visualizar a foto.";
      mostrarPlaceholderVeiculo();
      return;
    }

    dadosVeiculo.textContent = `${veiculo.modelo} · ${veiculo.placa} · ${veiculo.cor}`;
    container.classList.add("image-loading");
    container.setAttribute("aria-busy", "true");
    container.innerHTML = '<span class="image-skeleton" aria-hidden="true"></span>';
    try {
      const url = await window.FrotaSeguraImagens.buscarImagemCarro(veiculo.modelo);
      if (sequencia !== sequenciaImagem) return;
      if (!url) {
        mostrarPlaceholderVeiculo();
        return;
      }

      const imagem = document.createElement("img");
      imagem.loading = "lazy";
      imagem.alt = `Foto do ${veiculo.modelo}`;
      imagem.addEventListener("load", () => {
        container.classList.remove("image-loading");
        container.removeAttribute("aria-busy");
      }, { once: true });
      imagem.addEventListener("error", mostrarPlaceholderVeiculo, { once: true });
      container.replaceChildren(imagem);
      imagem.src = url;
    } catch (erro) {
      console.warn(`Não foi possível exibir a foto do ${veiculo.modelo}.`, erro);
      if (sequencia === sequenciaImagem) mostrarPlaceholderVeiculo();
    }
  }

  function mostrarErro(elemento, texto) {
    elemento.textContent = texto;
    elemento.hidden = false;
  }

  function marcarErroCampo(id, texto) {
    const campo = document.getElementById(id);
    if (!campo) return;
    const idErro = `${id}Erro`;
    let erroCampo = document.getElementById(idErro);
    if (!erroCampo) {
      erroCampo = document.createElement("small");
      erroCampo.id = idErro;
      erroCampo.className = "erro-campo";
      erroCampo.setAttribute("role", "alert");
      if (campo.type === "file") {
        const grupo = campo.closest(".campo");
        grupo.querySelector(".botao-arquivo").classList.add("arquivo-invalido");
        grupo.append(erroCampo);
      } else {
        campo.insertAdjacentElement("afterend", erroCampo);
      }
    }
    erroCampo.textContent = texto;
    campo.setAttribute("aria-invalid", "true");
    const descricoes = new Set((campo.getAttribute("aria-describedby") || "").split(/\s+/).filter(Boolean));
    descricoes.add(idErro);
    campo.setAttribute("aria-describedby", Array.from(descricoes).join(" "));
  }

  function limparErroCampo(id) {
    const campo = document.getElementById(id);
    if (!campo) return;
    campo.removeAttribute("aria-invalid");
    const idErro = `${id}Erro`;
    document.getElementById(idErro)?.remove();
    if (campo.type === "file") {
      campo.closest(".campo").querySelector(".botao-arquivo").classList.remove("arquivo-invalido");
    }
    const descricoes = (campo.getAttribute("aria-describedby") || "")
      .split(/\s+/)
      .filter((descricao) => descricao && descricao !== idErro);
    if (descricoes.length) campo.setAttribute("aria-describedby", descricoes.join(" "));
    else campo.removeAttribute("aria-describedby");
  }

  function limparErrosCampos(ids) {
    ids.forEach(limparErroCampo);
  }

  function limparFotoSelecionada(idCampo, idPrevia, antes) {
    if (antes) fotoAntesBase64 = "";
    else fotoDepoisBase64 = "";
    document.getElementById(idCampo).value = "";
    const previa = document.getElementById(idPrevia);
    previa.removeAttribute("src");
    previa.hidden = true;
    limparErroCampo(idCampo);
  }

  function acompanharCorrecao(id, evento) {
    const campo = document.getElementById(id);
    campo.addEventListener(evento, () => {
      limparErroCampo(id);
      limparErro(document.getElementById(camposRetirada.includes(id) ? "erroRetirada" : "erroDevolucao"));
    });
  }

  function limparErro(elemento) {
    elemento.hidden = true;
    elemento.textContent = "";
  }

  function mostrarSucesso(texto) {
    mensagem.textContent = texto;
    mensagem.hidden = false;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Redimensiona a imagem no navegador e converte o resultado em base64.
  function redimensionarImagem(arquivo) {
    return new Promise((resolve, reject) => {
      if (!arquivo || !arquivo.type.startsWith("image/")) {
        reject(new Error("Selecione um arquivo de imagem válido."));
        return;
      }
      const leitor = new FileReader();
      leitor.onload = () => {
        const imagem = new Image();
        imagem.onload = () => {
          const escala = Math.min(1, 800 / imagem.width);
          const largura = Math.round(imagem.width * escala);
          const altura = Math.round(imagem.height * escala);
          const canvas = document.createElement("canvas");
          canvas.width = largura;
          canvas.height = altura;
          canvas.getContext("2d").drawImage(imagem, 0, 0, largura, altura);
          resolve(canvas.toDataURL("image/jpeg", 0.78));
        };
        imagem.onerror = () => reject(new Error("Não foi possível ler a imagem."));
        imagem.src = leitor.result;
      };
      leitor.onerror = () => reject(new Error("Não foi possível carregar o arquivo."));
      leitor.readAsDataURL(arquivo);
    });
  }

  async function processarFoto(input, callback) {
    limparErroCampo(input.id);
    limparErro(document.getElementById(camposRetirada.includes(input.id) ? "erroRetirada" : "erroDevolucao"));
    try {
      const base64 = await redimensionarImagem(input.files[0]);
      callback(base64);
    } catch (erro) {
      callback("");
      marcarErroCampo(input.id, erro.message);
    }
  }

  document.getElementById("fotoAntes").addEventListener("change", async (evento) => {
    await processarFoto(evento.target, (base64) => {
      fotoAntesBase64 = base64;
      const preview = document.getElementById("previewAntes");
      preview.src = base64;
      preview.hidden = !base64;
    });
  });

  document.getElementById("fotoDepois").addEventListener("change", async (evento) => {
    await processarFoto(evento.target, (base64) => {
      fotoDepoisBase64 = base64;
      const preview = document.getElementById("previewDepois");
      preview.src = base64;
      preview.hidden = !base64;
      if (base64) {
        document.getElementById("comparacaoFotos").hidden = false;
        document.getElementById("dataFotoDepois").textContent = `Enviada em ${formatarDataHora(new Date().toISOString())}`;
      }
    });
  });
  selectRetirada.addEventListener("change", () => {
    limparFotoSelecionada("fotoAntes", "previewAntes", true);
    atualizarVeiculoSelecionado();
  });
  ["veiculoRetirada", "nomeCondutor", "matricula", "finalidade", "kmInicial"].forEach((id) => {
    acompanharCorrecao(id, id === "veiculoRetirada" ? "change" : "input");
  });
  ["veiculoDevolucao", "kmFinal"].forEach((id) => {
    acompanharCorrecao(id, id === "veiculoDevolucao" ? "change" : "input");
  });

  formRetirada.addEventListener("submit", (evento) => {
    evento.preventDefault();
    const erro = document.getElementById("erroRetirada");
    limparErro(erro);
    limparErrosCampos(camposRetirada);
    const id = selectRetirada.value;
    const condutor = document.getElementById("nomeCondutor").value.trim();
    const matricula = document.getElementById("matricula").value.trim();
    const finalidade = document.getElementById("finalidade").value.trim();
    const kmInicial = Number(document.getElementById("kmInicial").value);

    if (!id) marcarErroCampo("veiculoRetirada", "Selecione um veículo disponível.");
    if (!condutor) marcarErroCampo("nomeCondutor", "Informe o nome do condutor.");
    if (!matricula) marcarErroCampo("matricula", "Informe a matrícula funcional.");
    if (!finalidade) marcarErroCampo("finalidade", "Informe a finalidade do uso.");
    if (document.getElementById("kmInicial").value === "") marcarErroCampo("kmInicial", "Informe a quilometragem atual.");
    if (!fotoAntesBase64) marcarErroCampo("fotoAntes", "Selecione a foto antes do uso.");
    if (!id || !condutor || !matricula || !finalidade || document.getElementById("kmInicial").value === "" || !fotoAntesBase64) {
      mostrarErro(erro, "Revise os campos indicados antes de confirmar a retirada.");
      return;
    }
    if (kmInicial < 0) {
      marcarErroCampo("kmInicial", "A quilometragem atual não pode ser negativa.");
      mostrarErro(erro, "A quilometragem atual não pode ser negativa.");
      return;
    }

    const veiculo = veiculos.find((item) => item.id === id);
    const retirada = new Date().toISOString();
    veiculo.status = "Em uso";
    veiculo.condutorAtual = condutor;
    veiculo.retiradaAtual = retirada;
    veiculo.kmAtual = kmInicial;
    veiculo.usoAtual = { condutor, matricula, finalidade, kmInicial, retirada, fotoAntes: fotoAntesBase64 };
    if (!dados.salvar(veiculos)) {
      mostrarErro(erro, "Não foi possível salvar os dados. Limpe imagens grandes ou restaure a demonstração.");
      return;
    }

    formRetirada.reset();
    fotoAntesBase64 = "";
    document.getElementById("previewAntes").hidden = true;
    document.getElementById("dataRetirada").value = formatarDataHora(retirada);
    atualizarSelects();
    mostrarSucesso(`Retirada registrada: ${veiculo.modelo} - ${veiculo.placa}.`);
    mostrarEtapa("devolucao");
  });

  selectDevolucao.addEventListener("change", () => {
    limparFotoSelecionada("fotoDepois", "previewDepois", false);
    document.getElementById("dataFotoDepois").textContent = "Data e hora da devolução";
    atualizarVeiculoSelecionado();
    const veiculo = veiculos.find((item) => item.id === selectDevolucao.value);
    const info = document.getElementById("infoRetirada");
    const fotoAntes = document.getElementById("fotoComparacaoAntes");
    if (!veiculo || !veiculo.usoAtual) {
      info.hidden = true;
      document.getElementById("comparacaoFotos").hidden = true;
      return;
    }
    const uso = veiculo.usoAtual;
    info.innerHTML = `<strong>${uso.condutor}</strong> (${uso.matricula}) - ${uso.finalidade}<br>Retirada em ${formatarDataHora(uso.retirada)} | KM inicial: ${uso.kmInicial.toLocaleString("pt-BR")}`;
    info.hidden = false;
    document.getElementById("dataFotoAntes").textContent = `Retirada em ${formatarDataHora(uso.retirada)}`;
    const placeholderAntes = document.getElementById("placeholderComparacaoAntes");
    const fotoLegada = !uso.fotoAntes || uso.fotoAntes === "img/placeholder.svg";
    fotoAntes.hidden = fotoLegada;
    placeholderAntes.hidden = !fotoLegada;
    if (!fotoLegada) fotoAntes.src = uso.fotoAntes;
    document.getElementById("comparacaoFotos").hidden = false;
  });

  formDevolucao.addEventListener("submit", (evento) => {
    evento.preventDefault();
    const erro = document.getElementById("erroDevolucao");
    limparErro(erro);
    limparErrosCampos(camposDevolucao);
    const id = selectDevolucao.value;
    const kmFinal = Number(document.getElementById("kmFinal").value);
    if (!id) marcarErroCampo("veiculoDevolucao", "Selecione um veículo em uso.");
    if (document.getElementById("kmFinal").value === "") marcarErroCampo("kmFinal", "Informe a quilometragem final.");
    if (!fotoDepoisBase64) marcarErroCampo("fotoDepois", "Selecione a foto depois do uso.");
    if (!id || document.getElementById("kmFinal").value === "" || !fotoDepoisBase64) {
      mostrarErro(erro, "Revise os campos indicados antes de confirmar a devolução.");
      return;
    }
    const veiculo = veiculos.find((item) => item.id === id);
    if (!veiculo || !veiculo.usoAtual) {
      mostrarErro(erro, "Selecione um veículo válido que esteja em uso.");
      return;
    }
    if (kmFinal < veiculo.usoAtual.kmInicial) {
      marcarErroCampo("kmFinal", "A quilometragem final não pode ser menor que a inicial.");
      mostrarErro(erro, "A quilometragem final não pode ser menor que a quilometragem inicial.");
      return;
    }
    const uso = veiculo.usoAtual;
    const devolucao = new Date().toISOString();
    veiculo.historico.unshift({
      id: `uso-${Date.now()}`,
      condutor: uso.condutor,
      matricula: uso.matricula,
      finalidade: uso.finalidade,
      kmInicial: uso.kmInicial,
      kmFinal,
      retirada: uso.retirada,
      devolucao,
      fotoAntes: uso.fotoAntes,
      fotoDepois: fotoDepoisBase64,
      observacoes: document.getElementById("observacoes").value.trim(),
      possivelDano: document.getElementById("possivelDano").checked
    });
    veiculo.status = "Disponível";
    veiculo.condutorAtual = null;
    veiculo.retiradaAtual = null;
    veiculo.kmAtual = kmFinal;
    veiculo.usoAtual = null;
    if (!dados.salvar(veiculos)) {
      mostrarErro(erro, "Não foi possível salvar a devolução no localStorage.");
      return;
    }

    formDevolucao.reset();
    fotoDepoisBase64 = "";
    document.getElementById("comparacaoFotos").hidden = true;
    document.getElementById("infoRetirada").hidden = true;
    document.getElementById("previewDepois").hidden = true;
    document.getElementById("fotoComparacaoAntes").hidden = true;
    document.getElementById("placeholderComparacaoAntes").hidden = true;
    document.getElementById("dataFotoDepois").textContent = "Data e hora da devolução";
    limparErrosCampos(["veiculoRetirada", "nomeCondutor", "matricula", "finalidade", "kmInicial", "fotoAntes", "veiculoDevolucao", "kmFinal", "fotoDepois"]);
    atualizarSelects();
    atualizarVeiculoSelecionado();
    mostrarSucesso(`Devolução registrada: ${veiculo.modelo} - ${veiculo.placa}.`);
  });

  document.querySelectorAll(".etapa").forEach((botao) => {
    botao.addEventListener("click", () => mostrarEtapa(botao.dataset.etapa));
  });

  document.getElementById("restaurarDados").addEventListener("click", () => {
    if (!window.confirm("Restaurar todos os dados fictícios de demonstração?")) return;
    dados.restaurar();
    veiculos = dados.carregar();
    fotoAntesBase64 = "";
    fotoDepoisBase64 = "";
    limparErrosCampos(camposRetirada.concat(camposDevolucao));
    limparErro(document.getElementById("erroRetirada"));
    limparErro(document.getElementById("erroDevolucao"));
    limparFotoSelecionada("fotoAntes", "previewAntes", true);
    limparFotoSelecionada("fotoDepois", "previewDepois", false);
    formRetirada.reset();
    formDevolucao.reset();
    document.getElementById("dataFotoDepois").textContent = "Data e hora da devolução";
    document.getElementById("comparacaoFotos").hidden = true;
    document.getElementById("infoRetirada").hidden = true;
    document.getElementById("previewAntes").hidden = true;
    atualizarSelects();
    mostrarEtapa("retirada");
    mostrarSucesso("Dados de demonstração restaurados.");
  });

  const agora = new Date();
  document.getElementById("dataRetirada").value = formatarDataHora(agora);
  atualizarSelects();
  atualizarVeiculoSelecionado();
})();

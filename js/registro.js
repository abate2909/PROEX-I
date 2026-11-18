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
  let etapaAtual = "retirada";
  let sequenciaImagem = 0;

  function formatarDataHora(valor) {
    return new Date(valor).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
  }

  function mostrarEtapa(etapa) {
    etapaAtual = etapa;
    document.getElementById("etapaRetirada").hidden = etapa !== "retirada";
    document.getElementById("etapaDevolucao").hidden = etapa !== "devolucao";
    document.querySelectorAll(".step").forEach((botao) => {
      botao.classList.toggle("active", botao.dataset.etapa === etapa);
    });
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
    container.innerHTML = '<div class="image-placeholder" role="img" aria-label="Foto do veículo indisponível"><span aria-hidden="true">🚘</span></div>';
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
    try {
      const base64 = await redimensionarImagem(input.files[0]);
      callback(base64);
    } catch (erro) {
      callback("");
      alert(erro.message);
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
      if (base64) document.getElementById("comparacaoFotos").hidden = false;
    });
  });
  selectRetirada.addEventListener("change", atualizarVeiculoSelecionado);

  formRetirada.addEventListener("submit", (evento) => {
    evento.preventDefault();
    const erro = document.getElementById("erroRetirada");
    limparErro(erro);
    const id = selectRetirada.value;
    const condutor = document.getElementById("nomeCondutor").value.trim();
    const matricula = document.getElementById("matricula").value.trim();
    const finalidade = document.getElementById("finalidade").value.trim();
    const kmInicial = Number(document.getElementById("kmInicial").value);

    if (!id || !condutor || !matricula || !finalidade || document.getElementById("kmInicial").value === "" || !fotoAntesBase64) {
      mostrarErro(erro, "Preencha todos os campos obrigatórios e envie a foto antes do uso.");
      return;
    }
    if (kmInicial < 0) {
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
    const placeholderAntes = document.getElementById("placeholderComparacaoAntes");
    const fotoLegada = !uso.fotoAntes || uso.fotoAntes === "img/placeholder.svg";
    fotoAntes.hidden = fotoLegada;
    placeholderAntes.hidden = !fotoLegada;
    if (!fotoLegada) fotoAntes.src = uso.fotoAntes;
    document.getElementById("comparacaoFotos").hidden = !fotoDepoisBase64;
  });

  formDevolucao.addEventListener("submit", (evento) => {
    evento.preventDefault();
    const erro = document.getElementById("erroDevolucao");
    limparErro(erro);
    const id = selectDevolucao.value;
    const kmFinal = Number(document.getElementById("kmFinal").value);
    if (!id || document.getElementById("kmFinal").value === "" || !fotoDepoisBase64) {
      mostrarErro(erro, "Selecione o veículo, informe a quilometragem final e envie a foto depois do uso.");
      return;
    }
    const veiculo = veiculos.find((item) => item.id === id);
    if (!veiculo || !veiculo.usoAtual) {
      mostrarErro(erro, "Selecione um veículo válido que esteja em uso.");
      return;
    }
    if (kmFinal < veiculo.usoAtual.kmInicial) {
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
    atualizarSelects();
    atualizarVeiculoSelecionado();
    mostrarSucesso(`Devolução registrada: ${veiculo.modelo} - ${veiculo.placa}.`);
  });

  document.querySelectorAll(".step").forEach((botao) => {
    botao.addEventListener("click", () => mostrarEtapa(botao.dataset.etapa));
  });

  document.getElementById("restaurarDados").addEventListener("click", () => {
    if (!window.confirm("Restaurar todos os dados fictícios de demonstração?")) return;
    dados.restaurar();
    veiculos = dados.carregar();
    fotoAntesBase64 = "";
    fotoDepoisBase64 = "";
    formRetirada.reset();
    formDevolucao.reset();
    document.getElementById("previewAntes").hidden = true;
    document.getElementById("comparacaoFotos").hidden = true;
    document.getElementById("infoRetirada").hidden = true;
    atualizarSelects();
    mostrarEtapa("retirada");
    mostrarSucesso("Dados de demonstração restaurados.");
  });

  const agora = new Date();
  document.getElementById("dataRetirada").value = formatarDataHora(agora);
  atualizarSelects();
  atualizarVeiculoSelecionado();
})();

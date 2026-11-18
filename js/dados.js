(function () {
  "use strict";

  const CHAVE = "frotaSeguraDados";

  const dadosIniciais = [
    {
      id: "veiculo-1", modelo: "Chevrolet Onix", placa: "SFS3A21", cor: "Prata",
      status: "Disponível", condutorAtual: null, retiradaAtual: null, kmAtual: 42860,
      usoAtual: null,
      historico: [
        { id: "uso-101", condutor: "Ana Souza", matricula: "10421", finalidade: "Fiscalização urbana", kmInicial: 42110, kmFinal: 42180, retirada: "2026-10-25T08:30", devolucao: "2026-10-25T12:10", fotoAntes: "", fotoDepois: "", observacoes: "Nenhuma alteração observada.", possivelDano: false }
      ]
    },
    {
      id: "veiculo-2", modelo: "Fiat Toro", placa: "RGT8B44", cor: "Branca",
      status: "Em uso", condutorAtual: "Carlos Menezes", retiradaAtual: "2026-11-18T08:15", kmAtual: 68420,
      usoAtual: { condutor: "Carlos Menezes", matricula: "20738", finalidade: "Inspeção em unidades", kmInicial: 68420, retirada: "2026-11-18T08:15", fotoAntes: "" },
      historico: []
    },
    {
      id: "veiculo-3", modelo: "Toyota Corolla", placa: "MNC2C73", cor: "Preta",
      status: "Disponível", condutorAtual: null, retiradaAtual: null, kmAtual: 53210,
      usoAtual: null,
      historico: [
        { id: "uso-103", condutor: "Marina Lima", matricula: "30965", finalidade: "Reunião administrativa", kmInicial: 52980, kmFinal: 53045, retirada: "2026-11-10T13:20", devolucao: "2026-11-10T17:40", fotoAntes: "", fotoDepois: "", observacoes: "Sem ocorrências.", possivelDano: false }
      ]
    },
    {
      id: "veiculo-4", modelo: "Volkswagen Saveiro", placa: "HQS7D09", cor: "Cinza",
      status: "Disponível", condutorAtual: null, retiradaAtual: null, kmAtual: 92140,
      usoAtual: null, historico: []
    },
    {
      id: "veiculo-5", modelo: "Hyundai HB20", placa: "KLP1E56", cor: "Azul",
      status: "Em uso", condutorAtual: "Beatriz Alves", retiradaAtual: "2026-11-18T09:05", kmAtual: 37600,
      usoAtual: { condutor: "Beatriz Alves", matricula: "11804", finalidade: "Atendimento externo", kmInicial: 37600, retirada: "2026-11-18T09:05", fotoAntes: "" },
      historico: [
        { id: "uso-105", condutor: "Rafael Costa", matricula: "41228", finalidade: "Entrega de documentos", kmInicial: 37120, kmFinal: 37205, retirada: "2026-11-12T07:50", devolucao: "2026-11-12T11:35", fotoAntes: "", fotoDepois: "", observacoes: "Marca pequena detectada no para-choque.", possivelDano: true }
      ]
    },
    {
      id: "veiculo-6", modelo: "Renault Duster", placa: "PDA4F82", cor: "Vermelha",
      status: "Disponível", condutorAtual: null, retiradaAtual: null, kmAtual: 58770,
      usoAtual: null, historico: []
    },
    {
      id: "veiculo-7", modelo: "Ford Ranger", placa: "ZBB6G31", cor: "Preta",
      status: "Disponível", condutorAtual: null, retiradaAtual: null, kmAtual: 110230,
      usoAtual: null,
      historico: [
        { id: "uso-107", condutor: "Lucas Prado", matricula: "52119", finalidade: "Suporte operacional", kmInicial: 109840, kmFinal: 109990, retirada: "2026-11-05T06:45", devolucao: "2026-11-05T15:20", fotoAntes: "", fotoDepois: "", observacoes: "Sem ocorrências.", possivelDano: false }
      ]
    },
    {
      id: "veiculo-8", modelo: "Jeep Compass", placa: "NFR9H18", cor: "Branca",
      status: "Disponível", condutorAtual: null, retiradaAtual: null, kmAtual: 34590,
      usoAtual: null, historico: []
    }
  ];

  function copia(valor) {
    return JSON.parse(JSON.stringify(valor));
  }

  function carregar() {
    const salvo = localStorage.getItem(CHAVE);
    if (!salvo) {
      salvar(copia(dadosIniciais));
      return copia(dadosIniciais);
    }
    try {
      return JSON.parse(salvo);
    } catch (erro) {
      console.error("Dados de demonstração inválidos.", erro);
      salvar(copia(dadosIniciais));
      return copia(dadosIniciais);
    }
  }

  function salvar(dados) {
    try {
      localStorage.setItem(CHAVE, JSON.stringify(dados));
      return true;
    } catch (erro) {
      console.error("Não foi possível salvar no localStorage.", erro);
      return false;
    }
  }

  function restaurar() {
    localStorage.removeItem(CHAVE);
    salvar(copia(dadosIniciais));
  }

  window.FrotaSeguraDados = { carregar, salvar, restaurar };
})();

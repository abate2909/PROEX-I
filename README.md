# FrotaSegura

Protótipo de apresentação para controle de uso de uma frota de veículos. O sistema demonstra o registro de retiradas e devoluções, incluindo fotos para comparação e histórico por veículo.

> **Demonstração fictícia:** este projeto não é um sistema oficial do DETRAN, não se conecta a serviços governamentais e não deve ser usado para registrar dados reais.

## Funcionalidades

- Consulta dos veículos em tabela, com busca por modelo ou placa e filtro por status.
- Indicadores de frota disponível e em uso.
- Histórico de utilização com condutor, horários, quilometragem, observações e comparação de fotos.
- Registro de retirada e devolução em duas etapas.
- Redimensionamento das fotos enviadas para até 800 px de largura antes de salvá-las.
- Persistência dos dados de demonstração no `localStorage`.
- Busca de fotos de veículos pela API da Wikipédia, com cache local e placeholder quando uma imagem não está disponível.
- Layout responsivo para desktop e celular.

## Tecnologias

- HTML, CSS e JavaScript puro.
- Sem frameworks, ferramentas de build ou backend.
- Os dados ficam no navegador; não há envio das informações do registro para um servidor.

## Estrutura

```text
.
├── index.html          # Lista e histórico dos veículos
├── registro.html       # Formulários de retirada e devolução
├── css/
│   └── style.css       # Estilos e regras responsivas
└── js/
    ├── dados.js        # Dados fictícios e persistência local
    ├── imagens.js      # Busca e cache de fotos da Wikipédia
    ├── veiculos.js     # Tabela, filtros e histórico
    └── registro.js     # Fluxo de retirada e devolução
```

## Como executar

Não é necessário instalar dependências.

1. Abra `index.html` diretamente no navegador; ou
2. Para uma origem local consistente entre páginas, inicie um servidor estático na pasta do projeto, por exemplo:

   ```bash
   python -m http.server 8000
   ```

   Depois acesse `http://localhost:8000`.

Os registros funcionam sem internet. Para buscar as fotos de veículos na Wikipédia, é necessária uma conexão; se a API ou a imagem não responder, o sistema exibe um placeholder neutro.

## Testar a demonstração

1. Na página **Veículos**, confira os indicadores, pesquise por modelo ou placa e filtre por status.
2. Clique em **Ver histórico** para consultar as utilizações registradas e as fotos antes/depois.
3. Acesse **Registrar uso** e selecione um veículo disponível.
4. Preencha os dados do condutor e do uso, informe a quilometragem e selecione uma foto antes de confirmar a retirada.
5. Na etapa de devolução, selecione o veículo em uso, informe a quilometragem final, envie a foto depois do uso e, se necessário, preencha observações e marque possível dano.
6. Volte à página **Veículos** e abra o histórico para conferir o uso recém-registrado.
7. Use **Restaurar dados de demonstração** para descartar as alterações e restaurar os dados iniciais.

## Dados locais e imagens

- Os registros são armazenados sob a chave `frotaSeguraDados`.
- As URLs encontradas para as fotos são armazenadas sob `frotasegura_imagens`.
- O cache e os registros pertencem ao navegador e à origem usados para abrir o projeto. Limpar os dados do site no navegador também os remove.
- As imagens enviadas nos registros são convertidas para JPEG em base64 e armazenadas no `localStorage`; evite fotos grandes ou muitos registros no mesmo navegador.
- A busca pela Wikipédia depende de internet e da disponibilidade da API. A apresentação e o registro local continuam funcionais sem ela.

## Aviso sobre as imagens

As imagens de veículos são consultadas nas Wikipédias em português e inglês. Elas são conteúdo externo, podem não corresponder exatamente ao modelo ou à versão cadastrados e podem deixar de estar disponíveis. Verifique a licença e a atribuição da imagem antes de reutilizá-la fora desta demonstração.

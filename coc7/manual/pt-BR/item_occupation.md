# Tipo de item: Ocupacao

Uma _ocupacao_ ajuda a definir o historico do personagem. Pense nela como a definicao do conjunto de _pericias ocupacionais_ (aquelas em que o personagem pode gastar pontos de ocupacao), alem da formula para calcular a quantidade de pontos de ocupacao disponiveis. A _ocupacao_ tambem permite definir o valor minimo e maximo de _Nivel de Credito_ para um personagem com essa ocupacao.

Tenha em mente que o conjunto de _pericias ocupacionais_ nao precisa ser fixo. O sistema permite configurar a _ocupacao_ para que, quando ela for arrastada para uma ficha de Personagem, ofereca a opcao de selecionar uma ou mais pericias de uma lista fechada, ou ate adicionar um numero predefinido de pericias escolhidas entre todas as disponiveis.

1. Abra a aba [fa-solid fa-suitcase]Diretorio de Itens
2. Clique em [fa-solid fa-suitcase]Criar Item

   1. De um nome a ocupacao, por exemplo _Bibliotecario_
   2. Defina _Tipo_ como _Ocupacao_

3. Na aba _Descricao_ voce pode alterar o nome, icone, nome do livro de origem e descricao
4. Na aba _Detalhes_ voce pode controlar:

   1. Selecionar o _Tipo de Ocupacao_
   2. Definir as caracteristicas usadas para calcular os _pontos de ocupacao_. Voce pode marcar as caracteristicas desejadas e definir o multiplicador. Para as caracteristicas marcadas como _Opcional_, o jogador tera de escolher uma delas durante a criacao.

      1. Por exemplo, se uma ocupacao usa _EDU * 2 + (FOR ou DES) * 2_, selecione _Educacao_ e coloque _2_ no _Multiplicador_ sem marcar _Opcional_. Depois, para _Forca_ e _Destreza_, marque ambas, marque _Opcional_ em ambas e coloque _2_ no Multiplicador de ambas.
      2. Por fim, defina o valor _Minimo_ e _Maximo_ da pericia _Nivel de Credito_ para essa ocupacao.

   3. Nomes das secoes de biografia (clique no `+` para adicionar secoes extras de Biografia); isso pode ser substituido por uma biografia em bloco unico nas configuracoes
   4. Em itens, voce pode arrastar e soltar itens e armas padrao

5. Na aba _Pericias_, voce pode arrastar e soltar pericias em varias secoes. Uma ocupacao tipica tem 8 pericias alem da pericia _Nivel de Credito_.

   1. _Pericias Comuns_ inclui as pericias ocupacionais padrao que nao podem ser alteradas
   2. A secao _Grupos de pericias opcionais_ permite adicionar grupos (voce pode criar varios) de pericias para o jogador escolher. Ao clicar no sinal `+`, um grupo e criado; voce pode definir o _Numero a escolher_ e montar um conjunto de pericias disponiveis arrastando-as para o grupo.
   3. Por fim, _Pericias Adicionais_ permite informar um numero de pericias que o jogador pode escolher entre as demais pericias disponiveis.

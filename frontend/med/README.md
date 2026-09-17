# CruzadinhaMed 🩺

Jogo educativo de **palavras cruzadas de medicina** feito em React Native (Expo). Design moderno, escuro e intuitivo, com teclado próprio e grade interativa.

Categorias incluídas: **Anatomia**, **Casos clínicos**, **Fisiologia** e **Farmacologia**. Cada categoria tem **12 cruzadinhas** distribuídas em três níveis de dificuldade — **4 Fácil, 4 Médio e 4 Difícil** (48 puzzles no total), todas com grades interligadas e validadas.

## Como rodar

Pré-requisitos: [Node.js](https://nodejs.org) (18+) e o app **Expo Go** atualizado no celular (Android/iOS).

O projeto usa o **Expo SDK 57**. Sempre que as versões mudarem, apague a instalação antiga antes de reinstalar. No **PowerShell** (Windows):

```powershell
cd CruzadinhaMed
Remove-Item -Recurse -Force node_modules
Remove-Item -Force package-lock.json
npm install
npx expo install --fix     # garante versões alinhadas ao SDK 57
npx expo start -c          # -c limpa o cache do Metro
```

Escaneie o QR Code com o **Expo Go** (Android) ou a **Câmera** (iOS). Para emulador: `npm run android` ou `npm run ios`. Para testar no navegador: `npm run web`.

## Como jogar

- Toque numa célula para selecioná-la; toque de novo para alternar entre **Horizontal** e **Vertical**.
- Use o teclado na parte de baixo para digitar. A seleção avança sozinha.
- Barra inferior mostra a **dica** da palavra atual; use as setas ‹ › para navegar entre as palavras.
- Botão **Dica** (topo direito) revela a palavra selecionada.
- A barra de progresso enche conforme você acerta as palavras. Ao completar tudo, aparece a tela de conclusão.

## Estrutura do projeto

```
CruzadinhaMed/
├── App.js                     # Navegação (Home → Categorias → Níveis → Jogo)
├── app.json                   # Configuração Expo
├── src/
│   ├── theme.js               # Cores, espaçamentos, tipografia
│   ├── engine.js              # Motor: monta a grade e valida respostas
│   ├── data/puzzles.js        # Banco de 48 puzzles + categorias e dificuldades
│   ├── components/
│   │   ├── CrosswordGrid.js   # Grade interativa
│   │   └── Keyboard.js        # Teclado na tela
│   └── screens/
│       ├── HomeScreen.js
│       ├── CategoriesScreen.js
│       ├── LevelsScreen.js    # Níveis por dificuldade
│       └── GameScreen.js      # Lógica de jogo
```

## Adicionar novas cruzadinhas

Os puzzles em `src/data/puzzles.js` foram gerados por um script que garante que todas as palavras se cruzem sem conflito. Cada puzzle tem `id`, `name`, `color`, `rows`, `cols` e uma lista de `entries` (palavra, dica, posição e direção). Basta seguir o mesmo formato para incluir novas categorias ou níveis.

## Próximos passos sugeridos

- Salvar progresso do jogador (AsyncStorage).
- Vários níveis por categoria e sistema de pontuação/tempo.
- Feedback visual/sonoro ao acertar uma palavra.
- Ícone e splash personalizados do app.

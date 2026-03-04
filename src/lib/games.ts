export interface GameMeta {
  id: string;
  title: string;
  category: string;
  description: string;
  isPlayable: boolean;
  requiresAi?: boolean; // Defaults to true if not specified
}

export const GAMES: GameMeta[] = [
  { id: 'tictactoe', title: 'Tic-Tac-Toe', category: 'Logic', description: 'Classic 3x3 grid game against AI.', isPlayable: true },
  { id: 'connect4', title: 'Connect 4', category: 'Strategy', description: 'Drop discs to connect 4 in a row.', isPlayable: true },
  { id: 'wordchain', title: 'Word Chain', category: 'Word', description: 'Chain words using the last letter of the previous word.', isPlayable: true },
  { id: 'chess', title: 'Chess', category: 'Strategy', description: 'Classic game of kings and queens.', isPlayable: true },
  { id: 'checkers', title: 'Checkers', category: 'Strategy', description: 'Jump over opponent pieces to win.', isPlayable: true },
  { id: 'sudoku', title: 'Sudoku', category: 'Logic', description: 'Fill the 9x9 grid with numbers 1-9.', isPlayable: true },
  { id: '2048', title: '2048', category: 'Math', description: 'Slide tiles to combine them and reach 2048.', isPlayable: true },
  { id: 'memory', title: 'Memory Match', category: 'Memory', description: 'Find matching pairs of cards.', isPlayable: true },
  { id: 'minesweeper', title: 'Minesweeper', category: 'Logic', description: 'Clear the board without detonating hidden mines.', isPlayable: true },
  { id: 'wordle', title: 'Wordle Clone', category: 'Word', description: 'Guess the 5-letter word in 6 tries.', isPlayable: true },
  { id: 'hangman', title: 'Hangman', category: 'Word', description: 'Guess the word before the man is hanged.', isPlayable: true },
  { id: 'reversi', title: 'Reversi (Othello)', category: 'Strategy', description: 'Flip opponent discs to your color.', isPlayable: true },
  { id: 'battleship', title: 'Battleship', category: 'Strategy', description: 'Sink the AI fleet before it sinks yours.', isPlayable: true },
  { id: 'mastermind', title: 'Mastermind', category: 'Logic', description: 'Guess the secret color code.', isPlayable: true },
  { id: 'simonsays', title: 'Simon Says', category: 'Memory', description: 'Repeat the growing sequence of colors.', isPlayable: true },
  { id: 'anagrams', title: 'Anagrams', category: 'Word', description: 'Form words from scrambled letters.', isPlayable: true },
  { id: 'mathquiz', title: 'Math Quiz', category: 'Math', description: 'Solve math problems quickly.', isPlayable: true },
  { id: 'patternmatch', title: 'Pattern Match', category: 'Logic', description: 'Identify the next item in the pattern.', isPlayable: true },
  { id: 'trivia', title: 'Trivia', category: 'Knowledge', description: 'Answer general knowledge questions.', isPlayable: true },
  { id: 'gofish', title: 'Go Fish', category: 'Card', description: 'Collect sets of 4 matching cards.', isPlayable: true },
  { id: 'blackjack', title: 'Blackjack', category: 'Card', description: 'Beat the dealer by getting closest to 21.', isPlayable: true },
  { id: 'war', title: 'War Cards', category: 'Card', description: 'Simple high-card battle game.', isPlayable: true },
  { id: 'baccarat', title: 'Baccarat', category: 'Card', description: 'Royal casino game of chance.', isPlayable: true },
  { id: 'poker', title: 'Elite Poker', category: 'Card', description: 'Texas Hold\'em against the AI.', isPlayable: true },
  { id: 'solitaire', title: 'Solitaire', category: 'Card', description: 'Classic Klondike Solitaire.', isPlayable: true },
  { id: 'mahjong', title: 'Mahjong', category: 'Puzzle', description: 'Match open pairs of identical tiles.', isPlayable: true },
  { id: 'slidingpuzzle', title: 'Sliding Puzzle', category: 'Puzzle', description: 'Slide tiles to assemble a picture.', isPlayable: true },
  { id: 'emojicharades', title: 'Emoji Charades', category: 'Word', description: 'Guess the phrase from AI emojis.', isPlayable: true },
  { id: 'cryptogram', title: 'Cryptogram', category: 'Word', description: 'Decode encrypted messages.', isPlayable: true },
  { id: 'crossword', title: 'Crossword', category: 'Word', description: 'Fill in words based on clues.', isPlayable: true },
  { id: 'wordsearch', title: 'Word Search', category: 'Word', description: 'Find hidden words in a grid.', isPlayable: true },
  { id: 'boggle', title: 'Boggle', category: 'Word', description: 'Find words in adjacent letters.', isPlayable: true },
  { id: 'scrabble', title: 'Scrabble Clone', category: 'Word', description: 'Form words on a board for points.', isPlayable: true },
  { id: 'dots', title: 'Dots and Boxes', category: 'Strategy', description: 'Connect dots to form boxes.', isPlayable: true },
  { id: 'nim', title: 'Nim', category: 'Strategy', description: 'Take turns removing objects from heaps.', isPlayable: true },
  { id: 'mancala', title: 'Mancala', category: 'Strategy', description: 'Sow seeds to capture the most.', isPlayable: true },
  { id: 'backgammon', title: 'Backgammon', category: 'Strategy', description: 'Move pieces according to dice rolls.', isPlayable: true },

  // New AI/Logic Concepts
  { id: 'circuitmapping', title: 'Circuit Mapping', category: 'Logic', description: 'Map logic gates correctly to complete the circuit.', isPlayable: true },
  { id: 'circuitconnector', title: 'Circuit Connector', category: 'Puzzle', description: 'Connect nodes without crossing wires.', isPlayable: true },
  { id: 'wiring', title: 'Wiring Connection', category: 'Puzzle', description: 'Correctly wire the power grid.', isPlayable: true },
  { id: 'networkrouting', title: 'Network Routing', category: 'Strategy', description: 'Route packets through a hostile network.', isPlayable: true },
  { id: 'physicsdrop', title: 'Physics Drop', category: 'Simulation', description: 'Use physics principles to drop an object into a target.', isPlayable: true, requiresAi: false },
  { id: 'plantgrowth', title: 'Plant Growth', category: 'Simulation', description: 'Balance nutrients to grow a thriving plant.', isPlayable: true },
  { id: 'mlhyperparameter', title: 'ML Tuning', category: 'Knowledge', description: 'Tune a neutral network to minimize loss.', isPlayable: true },
  { id: 'aiknowledge', title: 'AI Knowledge Board', category: 'Knowledge', description: 'Answer advanced AI architecture questions.', isPlayable: true },
  { id: 'logicevaluation', title: 'Logic Evaluator', category: 'Logic', description: 'Evaluate complex boolean expressions.', isPlayable: true },
  { id: 'algorithmassembly', title: 'Algorithm Assembly', category: 'Logic', description: 'Assemble pseudo-code to solve a problem.', isPlayable: true },
  { id: 'datastructure', title: 'Data Structure Flow', category: 'Knowledge', description: 'Choose the correct data structure.', isPlayable: true },
  { id: 'cybersecurity', title: 'Cyber Defense', category: 'Strategy', description: 'Defend your server from a cyber attack.', isPlayable: true },
  { id: 'cryptocurrency', title: 'Crypto Market Sim', category: 'Simulation', description: 'Trade simulated crypto against the market.', isPlayable: true },
  { id: 'genetic', title: 'Gene Breeder', category: 'Simulation', description: 'Breed subjects to reach a fitness target.', isPlayable: true },
  { id: 'neuralnetwork', title: 'Neural Architect', category: 'Logic', description: 'Design layers for a specific AI task.', isPlayable: true },
  { id: 'robotpath', title: 'Robot Pathfinding', category: 'Strategy', description: 'Guide a robot through a heavily weighted maze.', isPlayable: true },
  { id: 'quantumlogic', title: 'Quantum Gate Logic', category: 'Logic', description: 'Apply quantum gates to entangle qubits.', isPlayable: true },
  { id: 'turingmachine', title: 'Turing Simulator', category: 'Logic', description: 'Program tape rules to halt correctly.', isPlayable: true },
  { id: 'regexgolf', title: 'RegEx Golf', category: 'Puzzle', description: 'Write the shortest regular expression.', isPlayable: true },
  { id: 'sqlmystery', title: 'SQL Murder Mystery', category: 'Puzzle', description: 'Write SQL queries to find the culprit.', isPlayable: true },
  { id: 'storyteller', title: 'AI Story Teller', category: 'Creative', description: 'Generate epic stories based on Thirukural morals.', isPlayable: true },
  { id: 'mazesolver', title: 'Maze Master', category: 'Logic', description: 'Navigate through AI-generated labyrinths.', isPlayable: true }
];

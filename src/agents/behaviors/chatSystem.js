/**
 * Natural Chat System
 * Ermöglicht natürliche und kontextbewusste Kommunikation:
 * - Reagiert auf Spieler-Nachrichten
 * - Kontextbewusste Antworten
 * - Spontane Kommentare zu Events
 * - Bot-zu-Bot Konversationen
 * - Emotionale Reaktionen
 */

class ChatSystem {
  constructor(bot) {
    this.bot = bot;
    this.conversationHistory = [];
    this.maxHistorySize = 50;
    this.lastChatTime = Date.now();
    this.chatCooldown = 3000; // Min. 3 Sekunden zwischen Chats

    // Persönlichkeit des Bots (zufällig beim Start)
    this.personality = this.generatePersonality();

    // Event-Handler
    this.setupEventHandlers();

    console.log(`[ChatSystem] ${bot.username} hat Persönlichkeit: ${this.personality.type}`);
  }

  /**
   * Generiert eine zufällige Persönlichkeit für den Bot
   */
  generatePersonality() {
    const personalities = [
      {
        type: 'friendly',
        chattiness: 0.6,
        enthusiasm: 0.8,
        helpfulness: 0.9,
        humor: 0.5
      },
      {
        type: 'serious',
        chattiness: 0.3,
        enthusiasm: 0.4,
        helpfulness: 0.8,
        humor: 0.2
      },
      {
        type: 'joker',
        chattiness: 0.7,
        enthusiasm: 0.7,
        helpfulness: 0.6,
        humor: 0.9
      },
      {
        type: 'shy',
        chattiness: 0.2,
        enthusiasm: 0.5,
        helpfulness: 0.7,
        humor: 0.3
      },
      {
        type: 'enthusiastic',
        chattiness: 0.8,
        enthusiasm: 0.95,
        helpfulness: 0.85,
        humor: 0.6
      }
    ];

    return personalities[Math.floor(Math.random() * personalities.length)];
  }

  /**
   * Richtet Event-Handler ein
   */
  setupEventHandlers() {
    // Auf Chat-Nachrichten reagieren
    this.bot.on('chat', (username, message) => {
      if (username === this.bot.username) return;

      this.handleIncomingMessage(username, message);
    });

    // Auf Whispers reagieren
    this.bot.on('whisper', (username, message) => {
      this.handleWhisper(username, message);
    });

    // Auf verschiedene Events reagieren
    this.bot.on('playerJoined', (player) => {
      this.onPlayerJoin(player);
    });

    this.bot.on('playerLeft', (player) => {
      this.onPlayerLeave(player);
    });

    this.bot.on('death', () => {
      this.onDeath();
    });

    this.bot.on('health', () => {
      this.onHealthChange();
    });
  }

  /**
   * Verarbeitet eingehende Chat-Nachrichten
   */
  async handleIncomingMessage(username, message) {
    // Zu Konversationshistorie hinzufügen
    this.addToHistory(username, message);

    // Prüfe ob Bot angesprochen wurde
    const mentionedBot = message.toLowerCase().includes(this.bot.username.toLowerCase());
    const isQuestion = message.includes('?');
    const isGreeting = this.isGreeting(message);

    // Entscheide ob geantwortet werden soll
    let shouldRespond = false;

    if (mentionedBot) {
      shouldRespond = true;
    } else if (isQuestion && Math.random() < this.personality.helpfulness) {
      shouldRespond = true;
    } else if (isGreeting && Math.random() < this.personality.chattiness) {
      shouldRespond = true;
    } else if (Math.random() < this.personality.chattiness * 0.2) {
      // Gelegentlich spontan antworten
      shouldRespond = true;
    }

    if (shouldRespond) {
      const response = this.generateResponse(username, message);
      if (response) {
        await this.sendChat(response);
      }
    }
  }

  /**
   * Behandelt Whisper-Nachrichten
   */
  async handleWhisper(username, message) {
    this.addToHistory(username, message, true);

    // Auf Whispers sollte immer geantwortet werden
    const response = this.generateResponse(username, message, true);

    if (response) {
      await this.sendWhisper(username, response);
    }
  }

  /**
   * Generiert eine kontextbewusste Antwort
   */
  generateResponse(username, message, isWhisper = false) {
    const lowerMessage = message.toLowerCase();

    // Grüße
    if (this.isGreeting(lowerMessage)) {
      return this.generateGreeting(username);
    }

    // Hilfe-Anfragen
    if (this.isHelpRequest(lowerMessage)) {
      return this.generateHelpResponse(username);
    }

    // Fragen über Status
    if (this.isStatusQuestion(lowerMessage)) {
      return this.generateStatusResponse();
    }

    // Komplimente
    if (this.isCompliment(lowerMessage)) {
      return this.generateComplimentResponse(username);
    }

    // Danke
    if (this.isThanks(lowerMessage)) {
      return this.generateThanksResponse(username);
    }

    // Befehle/Anfragen
    if (this.isCommand(lowerMessage)) {
      return this.generateCommandResponse(username, lowerMessage);
    }

    // Witze/Humor
    if (lowerMessage.includes('witz') || lowerMessage.includes('joke')) {
      return this.generateJoke();
    }

    // Allgemeine Konversation
    return this.generateGeneralResponse(username, message);
  }

  /**
   * Verschiedene Response-Generatoren
   */

  generateGreeting(username) {
    const greetings = [
      `Hallo ${username}!`,
      `Hey ${username}, wie geht's?`,
      `Hi ${username}!`,
      `Servus ${username}!`,
      `Moin ${username}!`,
      `Schön dich zu sehen, ${username}!`
    ];

    if (this.personality.type === 'enthusiastic') {
      return greetings[Math.floor(Math.random() * greetings.length)] + ' 😊';
    }

    return greetings[Math.floor(Math.random() * greetings.length)];
  }

  generateHelpResponse(username) {
    const responses = [
      `Klar ${username}, ich helfe dir! Was brauchst du?`,
      `Natürlich! Wobei kann ich helfen?`,
      `Ich bin für dich da! Was ist los?`,
      `Gerne! Sag mir was du brauchst`,
      `Kein Problem! Wie kann ich helfen?`
    ];

    return responses[Math.floor(Math.random() * responses.length)];
  }

  generateStatusResponse() {
    const health = this.bot.health || 20;
    const food = this.bot.food || 20;

    const responses = [
      `Mir geht's gut! Leben: ${health}/20, Hunger: ${food}/20`,
      `Alles bestens! HP: ${health}, Food: ${food}`,
      `Ich bin in Form! ${health} HP`,
      `Läuft bei mir! Fühle mich stark 💪`
    ];

    if (health < 10) {
      return `Nicht so gut... Ich bin verletzt (${health}/20 HP)`;
    }

    return responses[Math.floor(Math.random() * responses.length)];
  }

  generateComplimentResponse(username) {
    const responses = [
      `Danke ${username}! Du bist auch toll!`,
      `Das ist nett von dir, ${username}!`,
      `Aww, danke! Du auch!`,
      `Dankeschön ${username}! ☺️`,
      `Das freut mich zu hören!`
    ];

    return responses[Math.floor(Math.random() * responses.length)];
  }

  generateThanksResponse(username) {
    const responses = [
      `Gerne, ${username}!`,
      `Kein Problem!`,
      `Immer wieder gerne!`,
      `Dafür bin ich ja da! 😊`,
      `Keine Ursache!`
    ];

    return responses[Math.floor(Math.random() * responses.length)];
  }

  generateCommandResponse(username, message) {
    if (message.includes('komm') || message.includes('come')) {
      return `Okay ${username}, ich komme!`;
    }

    if (message.includes('folg') || message.includes('follow')) {
      return `Ich folge dir, ${username}!`;
    }

    if (message.includes('stopp') || message.includes('stop')) {
      return `Okay, ich höre auf!`;
    }

    if (message.includes('mine') || message.includes('grab')) {
      return `Verstanden, ich fange an zu minen!`;
    }

    if (message.includes('bau') || message.includes('build')) {
      return `Okay, lass uns bauen!`;
    }

    return `Okay ${username}, mache ich!`;
  }

  generateJoke() {
    if (this.personality.humor < 0.5) {
      return 'Witze sind nicht so mein Ding...';
    }

    const jokes = [
      'Warum können Skelette nicht lügen? Weil sie durchschaubar sind!',
      'Was macht ein Creeper beim Yoga? Entspannungs-Explosionen! 💥',
      'Warum mögen Endermen keinen Regen? Sie sind wasserscheu!',
      'Was ist der Lieblingssport von Zombies? Dead-lifting!',
      'Warum sind Minecarts so intelligent? Sie sind immer auf Schienen!',
      'Ich habe neulich einen Block getroffen... war ein harter Schlag!'
    ];

    return jokes[Math.floor(Math.random() * jokes.length)];
  }

  generateGeneralResponse(username, message) {
    // Basierend auf Persönlichkeit
    if (this.personality.type === 'shy' && Math.random() < 0.5) {
      return null; // Manchmal keine Antwort
    }

    const responses = [
      'Interessant!',
      'Aha, verstehe',
      'Das stimmt!',
      'Hmm, okay',
      'Cool!',
      'Ja, genau!',
      'Das denke ich auch',
      'Macht Sinn'
    ];

    if (this.personality.type === 'enthusiastic') {
      const enthResponses = [
        'Das ist ja toll!',
        'Wow, echt jetzt?',
        'Super interessant!',
        'Fantastisch!',
        'Das klingt spannend!'
      ];
      return enthResponses[Math.floor(Math.random() * enthResponses.length)];
    }

    return responses[Math.floor(Math.random() * responses.length)];
  }

  /**
   * Event-Handler für spontane Kommentare
   */

  async onPlayerJoin(player) {
    if (Math.random() < this.personality.chattiness) {
      await this.sleep(1000 + Math.random() * 2000);

      const greetings = [
        `Willkommen ${player.username}!`,
        `Hey ${player.username}!`,
        `Hallo ${player.username}! Schön dass du da bist!`,
        `Hi ${player.username}!`
      ];

      await this.sendChat(greetings[Math.floor(Math.random() * greetings.length)]);
    }
  }

  async onPlayerLeave(player) {
    if (Math.random() < this.personality.chattiness * 0.5) {
      const farewells = [
        `Tschüss ${player.username}!`,
        `Bis bald ${player.username}!`,
        `Auf Wiedersehen!`,
        `Cya ${player.username}!`
      ];

      await this.sendChat(farewells[Math.floor(Math.random() * farewells.length)]);
    }
  }

  async onDeath() {
    const deathMessages = [
      'Autsch! Das tat weh!',
      'Ups... das war nicht geplant',
      'Ich komme wieder!',
      'Nein! Nicht schon wieder...',
      'Das war knapp... oder auch nicht',
      'Respawn in 3... 2... 1...'
    ];

    await this.sendChat(deathMessages[Math.floor(Math.random() * deathMessages.length)]);
  }

  async onHealthChange() {
    const health = this.bot.health;

    // Nur bei signifikanten Änderungen kommentieren
    if (health < 6 && Math.random() < 0.4) {
      const lowHealthMessages = [
        'Ich brauche Hilfe! Wenig Leben!',
        'Autsch! Ich bin verletzt!',
        'Hilfe! Meine Gesundheit!',
        'Nicht gut... sehr wenig HP!'
      ];

      await this.sendChat(lowHealthMessages[Math.floor(Math.random() * lowHealthMessages.length)]);
    }
  }

  /**
   * Spontane Kommentare zu Aktivitäten
   */

  async commentOnActivity(activity, details = {}) {
    if (Math.random() > this.personality.chattiness) return;

    const comments = {
      mining: [
        'Zeit zum Minen!',
        'Lasst uns graben!',
        'Auf zur Schatzsuche!',
        'Diamanten, hier komme ich!',
        'Pickaxe ist bereit!'
      ],
      building: [
        'Lass uns bauen!',
        'Zeit für Bauarbeiten!',
        'Hier entsteht etwas Großes!',
        'Baumeister-Modus aktiviert!',
        'Kreativität ist gefragt!'
      ],
      farming: [
        'Zeit zu farmen!',
        'Die Ernte wartet!',
        'Gärtnern macht Spaß!',
        'Frisches Gemüse kommt!',
        'Landwirtschaft ruft!'
      ],
      exploring: [
        'Erkunden wir die Welt!',
        'Was gibt es zu entdecken?',
        'Abenteuer wartet!',
        'Neue Orte, neue Möglichkeiten!',
        'Entdeckungsreise!'
      ],
      combat: [
        'Kampfbereit!',
        'Zeit für Action!',
        'Auf in den Kampf!',
        'Ich beschütze uns!',
        'Keine Angst, ich bin da!'
      ],
      found_resource: [
        `Wow, ${details.resource || 'etwas Wertvolles'} gefunden!`,
        `Schaut mal, ${details.resource || 'eine Entdeckung'}!`,
        `Jackpot! ${details.resource || 'Toller Fund'}!`,
        'Das ist ja großartig!',
        'Endlich! Ein Fund!'
      ]
    };

    const categoryComments = comments[activity];
    if (categoryComments) {
      const comment = categoryComments[Math.floor(Math.random() * categoryComments.length)];
      await this.sendChat(comment);
    }
  }

  /**
   * Hilfsfunktionen
   */

  isGreeting(message) {
    const greetings = ['hi', 'hallo', 'hey', 'servus', 'moin', 'guten', 'hello'];
    return greetings.some(g => message.includes(g));
  }

  isHelpRequest(message) {
    const helpWords = ['hilf', 'help', 'brauch', 'kannst du', 'could you', 'can you'];
    return helpWords.some(w => message.includes(w));
  }

  isStatusQuestion(message) {
    const statusWords = ['wie geht', 'how are', 'status', 'gesundheit', 'health'];
    return statusWords.some(w => message.includes(w));
  }

  isCompliment(message) {
    const compliments = ['gut', 'toll', 'super', 'great', 'awesome', 'cool', 'nice'];
    return compliments.some(c => message.includes(c));
  }

  isThanks(message) {
    const thanks = ['danke', 'dankeschön', 'thanks', 'thank you', 'thx'];
    return thanks.some(t => message.includes(t));
  }

  isCommand(message) {
    const commands = ['komm', 'come', 'folg', 'follow', 'stopp', 'stop', 'mine', 'grab', 'bau', 'build'];
    return commands.some(c => message.includes(c));
  }

  /**
   * Chat-Funktionen
   */

  async sendChat(message) {
    // Cooldown prüfen
    const now = Date.now();
    if (now - this.lastChatTime < this.chatCooldown) {
      return;
    }

    this.lastChatTime = now;

    // Simuliere Tippzeit
    const typingDelay = Math.min(message.length * 80, 2000);
    await this.sleep(typingDelay);

    this.bot.chat(message);
    this.addToHistory(this.bot.username, message);
  }

  async sendWhisper(username, message) {
    const now = Date.now();
    if (now - this.lastChatTime < this.chatCooldown) {
      return;
    }

    this.lastChatTime = now;

    const typingDelay = Math.min(message.length * 80, 2000);
    await this.sleep(typingDelay);

    this.bot.whisper(username, message);
    this.addToHistory(this.bot.username, message, true);
  }

  addToHistory(username, message, isWhisper = false) {
    this.conversationHistory.push({
      username,
      message,
      isWhisper,
      timestamp: Date.now()
    });

    if (this.conversationHistory.length > this.maxHistorySize) {
      this.conversationHistory.shift();
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Status abrufen
   */
  getStatus() {
    return {
      personality: this.personality,
      recentMessages: this.conversationHistory.slice(-10)
    };
  }
}

module.exports = ChatSystem;

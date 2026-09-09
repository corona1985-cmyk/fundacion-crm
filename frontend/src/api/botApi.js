import {
  askIntelligentBot,
  loadBotMemory,
  markBotUseful,
  markBotNotUseful
} from '../utils/botIntelligence';

export async function askBot(message) {
  return askIntelligentBot(message);
}

export const botApi = {
  chat: async (message) => {
    const reply = await askBot(message);
    return { reply };
  },
  memory: () => loadBotMemory(),
  markUseful: (query, reply) => markBotUseful(query, reply),
  markNotUseful: (query, reply) => markBotNotUseful(query, reply)
};

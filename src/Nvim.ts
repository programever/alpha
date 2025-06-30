import * as readline from 'readline';
import * as EventSource from 'eventsource';
import { sseSchema } from './Data/SSE';
import Env from './Env';
import AI from './AI';
import * as Msg from './Data/Message';
import * as Conv from './Data/Conversation';
import { parseJsonValue } from 'elytra-ts';

const conversation = Conv.create({ ai: AI, max: 50, keep: 20 });

const es = new EventSource.EventSource(Env.apiHost + '/sse');
es.onmessage = (event) => {
  const parse = parseJsonValue(event.data);
  if (parse._t === 'Err') {
    printData(`SSE error!\n`);
    return;
  }

  const r = sseSchema.safeParse(parse.value);
  if (r.success === false) {
    printData(`SSE error!\n`);
    return;
  }
  switch (r.data._t) {
    case 'Summary':
      printData(`${r.data.value}\n`);
      break;
    case 'NewWhatsapp':
      printData(`### Whatsapp:\n${r.data.value}\n`);
      break;
    case 'NewGmail':
      printData(`### New Gmail:\n${r.data.value}\n`);
      break;
    case 'CommingGEvent':
      printData(`### Comming Event:\n${r.data.value}\n`);
      break;
  }
};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

rl.on('line', async (line) => {
  const trimmed = line.trim().replaceAll('[ALPHA_INPUT_SEPERATOR]', '\n');
  if (trimmed.length === 0) return;

  const messages = await conversation
    .addMessage(Msg.createUserMsg(trimmed))
    .then(AI.run)
    .then(([m, t]) => {
      conversation.addTokens(t);
      return conversation.addMessage(m);
    });

  const newMessage = messages.at(-1);
  if (newMessage) {
    printData(`# Alpha:\n${Msg.messageString(newMessage)}\n\n`);
  }
});

rl.on('close', () => {
  es.close();
  process.exit(0);
});

function printData(data: string): void {
  // eslint-disable-next-line
  console.log(data);
}

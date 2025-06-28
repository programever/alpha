import blessed from 'blessed';
import fs from 'fs';
import { spawn } from 'child_process';
import { parseJsonValue } from 'elytra-ts';
import Env from './Env';
import AI from './AI';
import * as EventSource from 'eventsource';
import { sseSchema } from './Data/SSE';
import { sleep } from './Data/Timer';
import * as Msg from './Data/Message';
import * as Conv from './Data/Conversation';

async function mainLoop() {
  await sleep(3000); // To hide the console log messages from the Conversation module

  const conversation = Conv.create({ ai: AI, max: 50, keep: 20 });
  const { screen, box, input, renderLine } = renderUI();

  // Input handler
  attachInputHandlers(screen, box, input, renderLine, conversation);

  // SSE messages
  const es = new EventSource.EventSource(Env.apiHost + '/sse');
  es.onmessage = (event) => {
    const parse = parseJsonValue(event.data);
    if (parse._t === 'Err') {
      renderLine(`SSE errror!\n\n`, 'magenta');
      return;
    }

    const r = sseSchema.safeParse(parse.value);
    if (r.success === false) {
      renderLine(`SSE errror!\n\n`, 'magenta');
      return;
    }

    switch (r.data._t) {
      case 'Summary':
        renderLine(`${r.data.value}\n\n`, 'magenta');
        break;
      case 'NewWhatsapp':
        renderLine(`### Whatsapp: ${r.data.value}\n\n`, 'magenta');
        break;
      case 'NewGmail':
        renderLine(`### New Gmail:\n${r.data.value}\n\n`, 'magenta');
        break;
      case 'CommingGEvent':
        renderLine(`### Comming Event:\n${r.data.value}\n\n`, 'magenta');
        break;
    }
  };

  renderLine(
    '# Alpha is ready! \nExit with send `exit` message!\nPress Option+a to go to Neovim editor.\n\n',
    'cyan'
  );
}

function attachInputHandlers(
  screen: blessed.Widgets.Screen,
  box: blessed.Widgets.BoxElement,
  input: blessed.Widgets.TextareaElement,
  renderLine: (msg: string, color?: string) => void,
  conversation: Conv.Conversation
) {
  input.on('keypress', async (_, key) => {
    switch (key.full) {
      case 'C-c': {
        process.exit(0);
      }

      case 'C-k':
      case 'tab': {
        input.cancel();
        input.style.border.fg = 'cyan';
        box.focus();
        box.style.border.fg = 'red';
        screen.render();
        break;
      }

      case 'enter': {
        const trimmed = input.getValue().trim();
        input.clearValue();
        if (trimmed.toLowerCase() === 'exit') {
          process.exit(0);
        } else if (trimmed === '') {
          return;
        }

        renderLine(`# You:\n${trimmed}\n\n`, 'green');
        box.setScrollPerc(100);
        input.focus();
        screen.render();

        const messages = await conversation
          .addMessage(Msg.createUserMsg(trimmed))
          .then(AI.run)
          .then(conversation.addMessage);
        const newMessage = messages.at(-1);
        if (newMessage) {
          renderLine(`# Alpha:\n${Msg.messageString(newMessage)}\n\n`, 'grey');
        }
        break;
      }

      case 'å': {
        const boxValue = box.getContent();
        const newInputValue = await editWithNeovim(screen, input.getValue().trim());
        const {
          screen: newScreen,
          box: newBox,
          input: newInput,
          renderLine: newRenderLine
        } = renderUI();
        newBox.setContent(boxValue);
        newBox.setScrollPerc(100);
        newInput.setValue(newInputValue);
        attachInputHandlers(newScreen, newBox, newInput, newRenderLine, conversation);
        newScreen.render();
        break;
      }
    }
  });

  box.on('keypress', async (_, key) => {
    switch (key.full) {
      case 'C-c': {
        process.exit(0);
      }

      case 'linefeed':
      case 'tab': {
        box.style.border.fg = 'cyan';
        input.focus();
        input.style.border.fg = 'red';
        screen.render();
        break;
      }

      case 'å': {
        const inputValue = input.getValue();
        const boxValue = box.getContent();
        await editWithNeovim(screen, stripAnsiCodes(boxValue));
        const {
          screen: newScreen,
          box: newBox,
          input: newInput,
          renderLine: newRenderLine
        } = renderUI();
        newBox.setContent(boxValue);
        newBox.setScrollPerc(100);
        newInput.setValue(inputValue);
        attachInputHandlers(newScreen, newBox, newInput, newRenderLine, conversation);
        newScreen.render();
        break;
      }
    }
  });

  screen.key(['escape'], (_, __) => {
    // Do nothing to make nvim inline terminal work properly
  });
}

function stripAnsiCodes(str: string): string {
  // oxlint-disable no-control-regex
  return str.replace(/\x1B\[[0-9;]*m/g, '');
}

function renderUI(): {
  screen: blessed.Widgets.Screen;
  box: blessed.Widgets.BoxElement;
  input: blessed.Widgets.TextareaElement;
  renderLine: (msg: string, color?: string) => void;
} {
  const screen = blessed.screen();

  // Message box
  const box = blessed.box({
    top: 0,
    left: 0,
    width: '100%',
    content: '',
    tags: true,
    scrollable: true,
    alwaysScroll: true,
    scrollbar: {
      style: {
        bg: 'blue',
        fg: 'red'
      },
      ch: '|'
    },
    border: { type: 'line' },
    style: {
      fg: 'white',
      border: { fg: 'cyan' }
    },
    keys: true,
    vi: true,
    mouse: true
  });
  screen.append(box);

  // Input box
  const input = blessed.textarea({
    bottom: 0,
    left: 0,
    width: '100%',
    height: 3,
    inputOnFocus: true,
    scrollable: true,
    alwaysScroll: true,
    scrollbar: {
      style: {
        bg: 'blue',
        fg: 'red'
      },
      ch: '|'
    },
    border: { type: 'line' },
    style: {
      fg: 'grey',
      border: { fg: 'cyan' }
    },
    keys: true,
    vi: true,
    mouse: true
  });
  screen.append(input);

  function updateLayout() {
    box.height = Number(screen.height) - 3;
    screen.render();
  }
  updateLayout();

  function renderLine(msg: string, color = 'white') {
    box.pushLine(`{${color}-fg}${msg}{/${color}-fg}`);
    box.setScrollPerc(100);
    screen.render();
  }

  screen.on('resize', updateLayout);
  input.focus();
  input.style.border.fg = 'red';
  screen.render();

  return { screen, input, box, renderLine };
}

async function editWithNeovim(
  screen: blessed.Widgets.Screen,
  initialContent: string
): Promise<string> {
  const tmpFile = `${Env.nvimPath}/alpha-edit-${Date.now()}.md`;
  fs.writeFileSync(tmpFile, initialContent, 'utf8');

  screen.destroy();

  await new Promise<void>((resolve, reject) => {
    const nvim = spawn('nvim', [tmpFile], { stdio: 'inherit' });
    nvim.on('exit', () => resolve());
    nvim.on('error', reject);
  });

  const editedContent = fs.readFileSync(tmpFile, 'utf8');
  fs.unlinkSync(tmpFile);

  return editedContent;
}

mainLoop().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});

import express, { Response } from 'express';
import Path from 'path';
import env from './Env';
import AI from './AI';
import * as Background from './Background';
import * as SSE from './Data/SSE';
import webHandler from './Web';

const app = express();
app.use(express.json());
const clients: Array<Response> = [];

app.get('/health', async (_req, res) => {
  res.send('OK');
});

app.get('/sse', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();
  res.write(': connected\n\n');

  clients.push(res);
  console.info(`✅ New client connected. Total clients: ${clients.length}`);
  SSE.flush(clients);

  req.on('error', () => {
    const idx = clients.indexOf(res);
    if (idx !== -1) clients.splice(idx, 1);
  });

  req.on('close', () => {
    const idx = clients.indexOf(res);
    if (idx !== -1) clients.splice(idx, 1);
  });
});

app.get('/alpha', (_req, res) => {
  res.sendFile(Path.join(__dirname, 'Web.html'));
});

app.post('/chat', (req, res) => {
  webHandler(req, res);
});

app.listen(env.port, () => {
  console.info(`✅ Alpha Server is running at http://localhost:${env.port}`);
});

Background.run(AI, clients);

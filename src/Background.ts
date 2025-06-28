import { Response } from 'express';
import * as Reader from './Background/Reader';
import * as MySummary from './Background/MySummary';
import * as News from './Background/News';
import * as GEvent from './Background/GEvent';
import * as SSE from './Data/SSE';
import { AI } from './Data/AI';

export async function run(ai: AI, reses: Response[]): Promise<void> {
  await News.sync();
  console.info('✅ Background: DevTo sync successfully');

  await Reader.run(ai);
  console.info('✅ Background: Reader run successfully');

  // Send summary every time start server
  mySummary(ai, reses);

  // Run every 30 minutes
  const minutes30 = 30 * 60 * 1000;
  setInterval(() => mySummary(ai, reses), minutes30);
  setInterval(() => gEvent(reses), minutes30);
}

async function mySummary(ai: AI, reses: Response[]): Promise<void> {
  const output = await MySummary.run(ai);
  if (output == null) {
    console.info(`❌ Background: My summary run unsuccessfully: ${new Date().toISOString()}`);
  } else {
    SSE.send(reses, SSE.sseSummary(output));
    console.info(`✅ Background: My summary run successfully: ${new Date().toISOString()}`);
  }
}

async function gEvent(reses: Response[]): Promise<void> {
  const output = await GEvent.run();
  if (output == null) {
    console.info(`❌ Background: Gevent run unsuccessfully: ${new Date().toISOString()}`);
  } else {
    await Promise.all(output.map((s) => SSE.send(reses, SSE.sseNewGEvent(s))));
    console.info(`✅ Background: Gevent run successfully: ${new Date().toISOString()}`);
  }
}

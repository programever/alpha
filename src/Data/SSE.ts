import { Response } from 'express';
import { z } from 'zod';

const newWhatsappSchema = z.object({ _t: z.literal('NewWhatsapp'), value: z.string() });
const newGmailSchema = z.object({ _t: z.literal('NewGmail'), value: z.string() });
const commingGEventSchema = z.object({ _t: z.literal('CommingGEvent'), value: z.string() });
const summarySchema = z.object({ _t: z.literal('Summary'), value: z.string() });

export const sseSchema = z.union([
  newWhatsappSchema,
  newGmailSchema,
  commingGEventSchema,
  summarySchema
]);

export type SSE = z.infer<typeof sseSchema>;

let holdData: string[] = [];
export function send(reses: Response[], value: SSE): void {
  if (reses.length === 0) {
    const str = JSON.stringify(value);
    const summary = holdData.find((data) => data.startsWith('# Summary for you at:') === true);
    holdData =
      value._t === 'Summary'
        ? holdData.filter((data) => data.startsWith('# Summary for') === false)
        : holdData.filter(
            (data) => data !== str && data.startsWith('# Summary for you at:') === false
          );
    holdData = [...holdData, str, ...(summary ? [summary] : [])];
    console.info(`Hold SSE data: ${holdData.length} items`);
    return;
  }

  for (const res of reses) {
    res.write(`data: ${JSON.stringify(value)}\n\n`);
  }
}

export function flush(reses: Response[]): void {
  console.info(`Flush SSE data: ${holdData.length} items`);
  for (const data of holdData) {
    for (const res of reses) {
      res.write(`data: ${data}\n\n`);
    }
  }
  holdData = [];
}

export function sseSummary(value: string): SSE {
  return { _t: 'Summary', value };
}

export function sseNewWhatsapp(value: string): SSE {
  return { _t: 'NewWhatsapp', value };
}

export function sseNewGmail(value: string): SSE {
  return { _t: 'NewGmail', value };
}

export function sseNewGEvent(value: string): SSE {
  return { _t: 'CommingGEvent', value };
}

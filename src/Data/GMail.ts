import { gmail_v1, google } from 'googleapis';
import { z } from 'zod';
import { gAuth, createAuthenticatedClient } from './Google';
import { err, ok, Result } from 'elytra-ts';

export const gmailListItemSchema = z.object({
  id: z.string(),
  snippet: z.string(),
  subject: z.string(),
  from: z.string(),
  date: z.string()
});
export type GMailListItem = z.infer<typeof gmailListItemSchema>;

export const gmailDataSchema = z.object({
  mailId: z.string(),
  from: z.string(),
  title: z.string(),
  body: z.string()
});
export type GMail = z.infer<typeof gmailDataSchema>;

async function getGmail(): Promise<gmail_v1.Gmail> {
  const auth = gAuth ? gAuth : await createAuthenticatedClient();
  return google.gmail({ version: 'v1', auth });
}

export async function listMail(unread: boolean): Promise<Result<string, GMail[]>> {
  try {
    const gmail = await getGmail();
    const res = await gmail.users.messages.list({
      userId: 'me',
      maxResults: 30,
      labelIds: ['INBOX'],
      q: unread ? 'is:unread' : undefined
    });
    const { messages } = res.data;
    if (messages == null) {
      return err(`listMail cannot find messages`);
    }

    const detailedMessages = await Promise.all(
      messages.map(async ({ id }) => (id ? getMail(id) : null))
    );

    return ok(detailedMessages.filter((m) => m != null));
  } catch (error) {
    return err(`listMail error: ${error}`);
  }
}

export async function getMail(mailId: string): Promise<GMail | null> {
  try {
    const gmail = await getGmail();
    const res = await gmail.users.messages.get({
      userId: 'me',
      id: mailId,
      format: 'full'
    });

    const payload = res.data.payload;

    const headers = payload?.headers || [];
    const from = headers.find((h) => h.name === 'From')?.value || '(Unknown sender)';
    const title = headers.find((h) => h.name === 'Subject')?.value || '(No subject)';

    let bodyData = '';

    if (payload?.parts?.length) {
      const textPart = payload.parts.find((p) => p.mimeType === 'text/plain');
      bodyData = textPart?.body?.data || '';
    }

    if (bodyData === '') {
      bodyData = payload?.body?.data || '';
    }

    const decodedBody = bodyData
      ? Buffer.from(bodyData, 'base64').toString('utf-8')
      : 'No body content found';

    return {
      mailId,
      from,
      title,
      body: decodedBody
    };
  } catch {
    return null;
  }
}

export async function markMails(): Promise<Result<string, 'Done'>> {
  try {
    const gmail = await getGmail();
    const res = await gmail.users.messages.list({
      userId: 'me',
      maxResults: 30,
      labelIds: ['INBOX']
    });

    const messages = res.data.messages || [];
    for (const { id } of messages) {
      if (id) {
        await gmail.users.messages.modify({
          userId: 'me',
          id,
          requestBody: {
            removeLabelIds: ['UNREAD']
          }
        });
      }
    }
    return ok('Done');
  } catch (error) {
    return err(`markMails error: ${error}`);
  }
}

export async function deleteMails(): Promise<Result<string, 'Done'>> {
  try {
    const gmail = await getGmail();
    const res = await gmail.users.messages.list({
      userId: 'me',
      maxResults: 30,
      labelIds: ['INBOX'],
      q: 'is:read'
    });

    const messages = res.data.messages || [];
    for (const message of messages) {
      if (message.id) {
        await gmail.users.messages.trash({
          userId: 'me',
          id: message.id
        });
      }
    }
    return ok('Done');
  } catch (error) {
    return err(`deleteMails error: ${error}`);
  }
}

export async function sendMail(
  to: string,
  subject: string,
  body: string
): Promise<Result<string, 'Done'>> {
  try {
    const gmail = await getGmail();
    const raw = buildRawMail({ to, subject, body });

    await gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw }
    });

    return ok('Done');
  } catch (error) {
    return err(`sendMail error: ${error}`);
  }
}

export async function replyMail(mailId: string, body: string): Promise<Result<string, 'Done'>> {
  try {
    const gmail = await getGmail();
    const original = await gmail.users.messages.get({
      userId: 'me',
      id: mailId,
      format: 'metadata',
      metadataHeaders: ['Subject', 'From', 'Message-ID']
    });

    const headers = original.data.payload?.headers || [];
    const subject = headers.find((h) => h.name === 'Subject')?.value || '';
    const from = headers.find((h) => h.name === 'From')?.value || '';
    const messageIdHeader = headers.find((h) => h.name === 'Message-ID')?.value || '';
    const threadId = original.data.threadId;

    const raw = buildRawMail({
      to: from,
      subject: subject.startsWith('Re:') ? subject : `Re: ${subject}`,
      body,
      inReplyTo: messageIdHeader,
      references: messageIdHeader
    });

    await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw,
        threadId
      }
    });
    return ok('Done');
  } catch (error) {
    return err(`replyMail error: ${error}`);
  }
}

type BuilRawMailParams = {
  to: string;
  subject: string;
  body: string;
  inReplyTo?: string;
  references?: string;
};
function buildRawMail({ to, subject, body, inReplyTo, references }: BuilRawMailParams): string {
  const headers = [
    `To: ${to}`,
    'Content-Type: text/plain; charset="UTF-8"',
    'MIME-Version: 1.0',
    `Subject: ${subject}`
  ];

  if (inReplyTo) headers.push(`In-Reply-To: ${inReplyTo}`);
  if (references) headers.push(`References: ${references}`);

  const email = [...headers, '', body].join('\n');

  return Buffer.from(email)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

import { z } from 'zod';
import { Request, Response } from 'express';
import * as Msg from './Data/Message';
import * as Conv from './Data/Conversation';
import AI from './AI';
import { Maybe, Tuple } from 'elytra-ts';

const convoMap: Map<string, Conv.Conversation> = new Map();

export default async function handler(req: Request, res: Response): Promise<void> {
  const paramR = z
    .object({ convoID: z.string().nullable(), message: z.string() })
    .safeParse(req.body);
  if (paramR.success === false) return errorRes(res, 'Invalid payload');

  const { convoID, message } = paramR.data;
  const trimmed = message.trim();
  if (trimmed.length === 0) return errorRes(res, 'Nothing to reply');

  const convoR = getConvoInfo(convoID);
  if (convoR == null) return errorRes(res, 'Cannot find your conversation');
  const [convoID_, conversation] = convoR;

  const messages = await conversation
    .addMessage(Msg.createUserMsg(trimmed))
    .then(AI.run)
    .then(conversation.addMessage);

  const newMessage = messages.at(-1);
  if (newMessage == null) return errorRes(res, 'Cannot find your message');

  res.status(200);
  res.json({ convoID: convoID_, message: Msg.messageString(newMessage) });
  return;
}

function getConvoInfo(convoID: Maybe<string>): Maybe<Tuple<string, Conv.Conversation>> {
  if (convoID == null) {
    convoID = Date.now().toString();
    const conversation = Conv.create({ ai: AI, max: 50, keep: 20 });
    convoMap.set(convoID, conversation);
    return [convoID, conversation];
  } else {
    const conversation = convoMap.get(convoID);
    return conversation ? [convoID, conversation] : null;
  }
}

function errorRes(res: Response, message: string): void {
  res.status(500);
  res.json({ _t: 'ServerError', message });
}

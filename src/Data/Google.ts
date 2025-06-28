import fs from 'fs/promises';
import { z } from 'zod';
import { createInterface } from 'readline';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { writeFile } from './File';
import Env from '../Env';
import { Maybe, parseJsonValue } from 'elytra-ts';

const oAuthSchema = z.object({
  installed: z.object({
    client_id: z.string(),
    project_id: z.string(),
    auth_uri: z.string().url(),
    token_uri: z.string().url(),
    auth_provider_x509_cert_url: z.string().url(),
    client_secret: z.string(),
    redirect_uris: z.array(z.string().url())
  })
});

const tokenSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string().optional(),
  scope: z.string(),
  token_type: z.literal('Bearer'),
  refresh_token_expires_in: z.number(),
  expiry_date: z.number()
});

// Personal use so, why dont we just allow all LOL
const SCOPES = [
  // Gmail CRUD
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.insert',
  'https://www.googleapis.com/auth/gmail.labels',

  // Contacts CRUD
  'https://www.googleapis.com/auth/contacts',
  'https://www.googleapis.com/auth/contacts.other.readonly',

  // Calendar CRUD
  'https://www.googleapis.com/auth/calendar',

  // Tasks CRUD
  'https://www.googleapis.com/auth/tasks',

  // Drive CRUD
  'https://www.googleapis.com/auth/drive',

  // Google Photos Library CRUD
  'https://www.googleapis.com/auth/photoslibrary',
  'https://www.googleapis.com/auth/photoslibrary.sharing'
];

export let gAuth: Maybe<OAuth2Client> = null;
let initializingAuth: Maybe<Promise<OAuth2Client>> = null;

export async function createAuthenticatedClient(): Promise<OAuth2Client> {
  if (gAuth) return gAuth;
  if (initializingAuth) return initializingAuth;

  initializingAuth = (async () => {
    // Download your secret file from https://console.cloud.google.com/auth/clients/
    // When create the OAuth 2.0 Client IDs, you may set the redirect url to localhost
    // We do not care the redirect url, we will just copy the code from url and paste to the console, read more at getNewToken
    const oAuthR = await fs.readFile(`${Env.googlePath}/credentials.json`, 'utf-8').then((s) => {
      const r = parseJsonValue(s);
      return oAuthSchema.safeParse(r._t === 'Ok' ? r.value : {});
    });
    if (oAuthR.success === false) {
      throw `❌ Invalid Google credentials ${oAuthR.error}`;
    }
    const { client_secret, client_id, redirect_uris } = oAuthR.data.installed;

    const oAuth2Client = new google.auth.OAuth2(
      client_id,
      client_secret,
      redirect_uris[0] || 'http://localhost'
    );

    oAuth2Client.on('tokens', async (tokens) => {
      const tokenR = await fs.readFile(`${Env.googlePath}/token.json`, 'utf-8').then((s) => {
        const r = parseJsonValue(s);
        return tokenSchema.safeParse(r._t === 'Ok' ? r.value : {});
      });

      const mergedTokens = {
        ...(tokenR.success === true ? tokenR.data : {}),
        ...tokens
      };
      if (tokens.refresh_token || tokens.access_token) {
        await writeFile(`${Env.googlePath}/token.json`, JSON.stringify(mergedTokens, null, 2));
      }
    });

    try {
      // Check and refresh token
      const tokenR = await fs.readFile(`${Env.googlePath}/token.json`, 'utf-8').then((s) => {
        const r = parseJsonValue(s);
        return tokenSchema.safeParse(r._t === 'Ok' ? r.value : {});
      });
      if (tokenR.success === false) {
        throw `❌ Invalid Google token ${oAuthR.error}`;
      }

      oAuth2Client.setCredentials(tokenR.data);
      gAuth = oAuth2Client;
      initializingAuth = null;
    } catch {
      // First time run you will go here because it will throw haha
      gAuth = await getNewToken(oAuth2Client);
      initializingAuth = null;
    }
    return gAuth;
  })();
  return initializingAuth;
}

// You need to open console to click on Google link
// Do NOT PANIC when Google redirect you back to localhost!!! I assume you redirect to localhost
// Then you need to enter the code from http://localhost/?code=XXXXXX&scope=... into the console
async function getNewToken(oAuth2Client: OAuth2Client): Promise<OAuth2Client> {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent'
  });
  console.info('Authorize this app by visiting this URL:', authUrl);

  const rl = createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const code = await new Promise<string>((resolve) => {
    rl.question('Enter the code from url: ', (input) => {
      rl.close();
      resolve(input);
    });
  });

  const { tokens } = await oAuth2Client.getToken(code);
  oAuth2Client.setCredentials(tokens);

  await writeFile(`${Env.googlePath}/token.json`, JSON.stringify(tokens, null, 2));
  return oAuth2Client;
}

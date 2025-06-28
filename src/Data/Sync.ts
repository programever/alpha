import { writeFile } from './File';
import * as Google from './Google';
import * as GContact from './GContact';
import Env from '../Env';

(async () => {
  if (Env.withGoogle === true) {
    console.info('Sync Google contact.');
    await Google.createAuthenticatedClient();
    const gEmails = await GContact.getEmailList();
    await writeFile(`${Env.googlePath}/emails.json`, JSON.stringify(gEmails, null, 2));
    const gContacts = await GContact.getContactList();
    await writeFile(`${Env.googlePath}/contacts.json`, JSON.stringify(gContacts, null, 2));
  }

  console.info('Sync completed successfully.');
  process.exit(0);
})();

import { google, people_v1 } from 'googleapis';
import { createAuthenticatedClient, gAuth } from './Google';
import { Maybe } from 'elytra-ts';

type ContactInfo = {
  name: string;
  phones: string[];
};

type EmailInfo = {
  name: string;
  email: string;
};

export async function getContactList(): Promise<ContactInfo[]> {
  const auth = gAuth ? gAuth : await createAuthenticatedClient();

  const people = google.people({ version: 'v1', auth });
  const res = await people.people.connections.list({
    resourceName: 'people/me',
    pageSize: 1000,
    personFields: 'names,emailAddresses,phoneNumbers,metadata',
    sortOrder: 'FIRST_NAME_ASCENDING'
  });

  const connections = res.data.connections || [];
  return connections
    .filter((person) => person.metadata?.sources?.some((source) => source.type === 'CONTACT'))
    .map(extractContactInfo)
    .filter((i) => i != null);
}

function extractContactInfo(person: people_v1.Schema$Person): Maybe<ContactInfo> {
  const name = person.names?.[0]?.displayName || 'Unknown Name';

  const phones = (person.phoneNumbers || []).map((p) => {
    const raw = p.canonicalForm || p.value || '';
    return raw.startsWith('0') ? raw.replace(/^0/, '+84') : raw;
  });

  if (name === 'Unknown Name' && phones.length === 0) return null;
  return { name, phones };
}

export async function getEmailList(): Promise<EmailInfo[]> {
  const auth = gAuth ? gAuth : await createAuthenticatedClient();

  const people = google.people({ version: 'v1', auth });
  const res = await people.otherContacts.list({
    readMask: 'names,emailAddresses',
    pageSize: 1000
  });

  const otherContacts = res.data.otherContacts || [];
  return otherContacts.map(extractEmailInfo).filter((i) => i != null);
}

function extractEmailInfo(otherContact: people_v1.Schema$Person): Maybe<EmailInfo> {
  let name = '';
  if (otherContact.names && otherContact.names.length > 0) {
    const primaryName = otherContact.names.find((n) => n.metadata?.primary);
    name = primaryName?.displayName || otherContact.names[0].displayName || '';
  }

  let email = '';
  if (otherContact.emailAddresses && otherContact.emailAddresses.length > 0) {
  }

  if (otherContact.names && otherContact.names.length > 0) {
    const primaryName = otherContact.names.find((n) => n.metadata?.primary);
    name = primaryName?.displayName || otherContact.names[0].displayName || '';
  }

  if (otherContact.emailAddresses && otherContact.emailAddresses.length > 0) {
    const primaryEmail = otherContact.emailAddresses.find((e) => e.metadata?.primary);
    email = primaryEmail?.value || otherContact.emailAddresses[0].value || '';
  }

  if (name === '' || email === '') return null;
  return { name, email };
}

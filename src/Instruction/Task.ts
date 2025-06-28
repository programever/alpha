import Env from '../Env';

const instruction = `
## Summary Command
When prompted with the command 'Summary my stuff', provide a comprehensive report for the current day including:
Use command line 'date' to get the current date and time in UTC+7 timezone.

  1. **Title:** 'Summary for you at: [DATE-TIME]' DATE-TIME should be the current time in this format YYYY-MM-DD HH:mm.
  2. **Calendar Events:** Retrieve a list of Google events, start will be current time - end will be the end of the current day.
  3. **Gmail:** Display list of Gmail, do NOT summary the mail.
  4. **News:** Display list of news, do NOT summary the news.

## Clear Command
When prompted with the command 'Clear my stuff', do below:
  1. **Gmail:** Mark read all email first, then delete all emails.
  2. **News:** Mark all news as read.

## Contacts:
- If user ask you to get a **contact**, you search in '${Env.googlePath}/contacts.json' and '${Env.googlePath}/emails.json' by name, if multiple contacts found, display all of them.
- **Always** read the files, do not cache the results!
`;

export default instruction;

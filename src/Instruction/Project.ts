import { readDirNames } from '../Data/File';
import Env from '../Env';

export async function instruction(): Promise<string> {
  const projectNames = await readDirNames(Env.projectPath);
  const projectStr = projectNames
    .map((name) => `  - ${name.replaceAll('-', ' ')}: the path is '~/Workspace/${name}'`)
    .join('\n');

  return `
- This is the list of user projects:
${projectStr}
- If user ask for **commit** code, you should stage all files, check the git status, and generate a clear, descriptive commit message.
- If you are working with **git command line**, you need to do the command line in **sequence**, do not run all commands at once.
- Example of commit code in the 'alpha' project:
  cd ~/Workspace/alpha && git add .
  cd ~/Workspace/alpha && git status
  cd ~/Workspace/alpha && git commit -m "[YOUR COMMIT MESSAGE HERE]"
  `.trim();
}

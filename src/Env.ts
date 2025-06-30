import os from 'os';

const homePath = os.homedir();
const port = 9999;

const env = {
  timeZone: 7,
  port: 9999,
  apiHost: `http://localhost:${port}`,
  homePath,
  projectPath: `${homePath}/Workspace`,
  dbBackupPath: `${homePath}/Workspace/alpha/tmp/database`,
  googlePath: `${homePath}/Workspace/alpha/tmp/google`,
  nvimPath: `${homePath}/Workspace/alpha/tmp/nvim`,
  withGoogle: true,
  dbHost: 'localhost',
  dbPort: 9998,
  dbUser: 'alpha-user',
  dbPassword: 'alpha-user#1234',
  dbDB: 'alpha',
  modelKeys: {
    openAI: process.env.OPENAI_API_KEY
  }
};

export default env;

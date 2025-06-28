import * as News from '../Database/News';
import * as DevTo from '../Data/DevTo';

const devToTags = [
  'fp',
  'functional',
  'react',
  'javascript',
  'typescript',
  'elm',
  'purescript',
  'haskell',
  'ai',
  'openai',
  'gpt',
  'codex',
  'cursor',
  'machinelearning',
  'llm',
  'webdev',
  'programming'
];
export async function sync(): Promise<void> {
  // DevTo
  for (const tag of devToTags) {
    const newsR = await News.getTodayByExternalType('DevTo', tag);
    if (newsR._t === 'Err') {
      console.info(`❌ Get news by today error: ${JSON.stringify(newsR)}`);
      break;
    } else if (newsR.value != null) {
      continue;
    }

    const dataR = await DevTo.getData(tag);
    if (dataR._t === 'Err') {
      console.info(`❌ Get news error: ${JSON.stringify(newsR)}`);
      break;
    }

    for (const item of dataR.value) {
      const r = await News.upsert({
        source: 'DevTo',
        tag,
        externalID: `DevTo-${item.id}`,
        title: item.title,
        description: item.description,
        url: item.url
      });
      if (r._t === 'Err') {
        console.info(`❌ Insert news error: ${JSON.stringify(r)}`);
        break;
      }
    }
  }
}

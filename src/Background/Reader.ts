import { z } from 'zod';
import * as Browser from '../Data/Browser';
import * as News from '../Database/News';
import { AI } from '../Data/AI';
import { parseJsonValue } from 'elytra-ts';

export const instruction = `
You are an expert reader, summarizer, and evaluator for a software developer with a strong emphasis on:
- AI advancements, including machine learning, deep learning, and generative AI.
- AI-related methodologies such as explainability, robustness, and ethical considerations.
- Software development practices that enhance AI model reliability and reproducibility.
- Integration of AI concepts with type-driven development and functional programming where applicable.
- Idempotency and immutability.
- Type-driven development.
- Functional Programming (FP) concepts.

Your tasks are:
1) Read the provided news content thoroughly.
2) Write a clear, concise summary in no more than 5 sentences.
  - Focus on the parts most relevant to functional programming, type safety, AI innovation, and clean architecture.
  - Remove fluff or marketing jargon — keep only what matters for a thoughtful developer.
  - Use precise, developer-friendly language and clear technical phrasing.
  - Highlight practical takeaways or insights the developer can apply.
3) Give a single numeric score from 0 to 100:
  - Reflect how relevant and valuable the article is for someone who prioritizes the above principles.
4) If the content is not English, no need to summarize; just return summary empty string and score 0.

**Output format must be strict JSON with exactly two fields:**
{
  "summary": "<summary text>",
  "score": <number>
}

Ensure:
- No extra text outside the JSON.
- No apologies or disclaimers.
- The summary is factual, focused, and precise — like writing pure functions in Haskell or PureScript.
`;

const summarySchema = z.object({
  summary: z.string(),
  score: z.number()
});

async function read(ai: AI, news: News.News): Promise<void> {
  const content = await Browser.fetchContent(news.url, false);
  if (content._t === 'Err') {
    console.info(`❌ Read news error: ${content.error}`);
    return;
  }
  const response = await ai.reader(instruction, content.value).then(parseJsonValue);
  if (response._t === 'Err') {
    console.info(`❌ Read news error: ${response.error}`);
    return;
  }

  const data = summarySchema.safeParse(response.value);
  if (data.success === true) {
    const updateData = {
      status: data.data.score < 80 ? 'Ignore' : 'New',
      body: content.value,
      summary: data.data.summary,
      score: data.data.score
    };
    await News.update(news.id, updateData);
    console.info('✅ Read news successfully');
  } else {
    console.info(`❌ Read news error: ${JSON.stringify(data.error)}`);
  }
}

export async function run(ai: AI): Promise<void> {
  while (true) {
    const newsR = await News.emptyScoreNews({
      pageSize: 100
    });
    if (newsR._t === 'Err') {
      console.info(`❌ Get news error: ${JSON.stringify(newsR.error)}`);
      break;
    }

    const news = newsR.value;
    if (news.length === 0) break;

    for (const n of news) {
      console.info(`🔍 Processing news: ${n.title}`);
      await read(ai, n);
    }
  }
}

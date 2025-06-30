# 🗿 Alpha

**Disclaimer:** Use this project at your own risk.

Alpha is a personal assistant built with an AI model and the MCP tool.

> **Note:** Alpha is currently a prototype for personal experimentation. It is not built for public use. Please fork or watch this repo to stay updated.

## ✨ Features

- **Google Services Integration:** Manage Gmail, Calendar, Tasks, and more.
- **News Aggregation & Summarization:** Fetch news, rate based on user preferences, and generate concise summaries.
- **Project Assistance:** Automate tasks like Git commands, running scripts, and code reviews.
- **Personalized Summaries:** Summarize content based on user preferences.

## 🚧 Roadmap / Next Steps

- Improve user experience while user is waiting for Alpha to response
- Enable Alpha to perform full database CRUD operations and maintain its own persistent memory.
- Mobile integration for on-the-go interaction.
- Expose Alpha as a Remote MCP node for communication with other AI systems.

---

# ⚙️ Environment Setup

## OpenAI API Key

- Ensure `process.env.OPENAI_API_KEY` is set to run OpenAI.
- If not using OpenAI, LangChain support or custom agent implementation is possible.
- Update configurations in `src/Env.ts` as needed.
- If database config changes, update your `docker-compose` setup accordingly.

---

# 📧 Google Services Setup (Required only if `Env.withGoogle = true`)

1. Create a new project at [Google Cloud Console](https://console.cloud.google.com/auth/clients/). Depend on your requirements, you need to enable Google API service like: Gmail, Calendar,...
2. Set the redirect URI to `http://localhost`.
3. Review available Google scopes in `src/Data/Google.ts`.
4. Download `credentials.json` to `Env.googlePath/credentials.json`.
5. Run `npm run sync` and follow the Google Authentication URL.
6. Copy the auth code from `http://localhost/?code=...` into the console.
7. Ensure `npm run sync` completes successfully.
8. Test with `npm run check` to confirm setup.

---

# 💻 Local Development Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start database and apply migrations:

   ```bash
   npm run db:start && npm run db:migrate
   ```

3. Start the Web API:

   ```bash
   npm run api
   ```

4. Run check ops:

   ```bash
   npm run check:ops
   ```

5. Interfaces:

   - **Neovim:** Set up manually as per your configuration.
   - **Terminal:**
     ```bash
     npm run cli
     # OR run any where by update your .zshrc with below
     alias alpha="ts-node ~/Workspace/alpha/src/Cli.ts"
     alpha
     ```
   - **Browser:** Open `http://localhost:9999/alpha`
        + UI is not really good, because I am not using it so much, please try to improve it by yourself
        + Kindly note that, you may need to update `src/Instruction/ResponseFormat.md`

> Once setup is complete, interact with Alpha using commands like: `What can you do?`

---

# 🧩 System Design & Interfaces

## AI Interface: `src/Data/AI.ts`

- Defines how any AI module should behave:
  - `run`: Handle a list of messages.
  - `summarize`: Summarize conversations.
  - `reader`: Read content from web/news/blogs.
- Each interface includes task-specific instructions.
- Required to return number of used tokens, so that, each AI/Framework must provide a function to calculate it. Eg: `src/AI/Alpha.ts` - calculateTokens

## Messaging Interface: `src/Data/Message.ts`

- Defines message flow:
  - User ➡ Msg ➡ Alpha ➡ Agent Msg ➡ Agent
  - Agent ➡ Agent Msg ➡ Alpha ➡ Msg ➡ User
- Any agent that can convert its internal message format to this structure can be integrated.

## Conversation Management: `src/Data/Conversation.ts`

- Keeps conversation history optimized to reduce token usage.

## Tool Interface: `src/Data/Tool.ts`

- Internal tool interface ensuring:
  - Unified functional structure for all tools.
  - Smooth integration into new agents with minimal changes.

> Note: This is **not** for tools like `@modelcontextprotocol/server-filesystem`. We only applied Tool to our internal tools!

---

# 📁 File & Folder Structure

- `database`: Database related scripts, migrations, and import/export utilities.
- `lua`: Lua configuration for Neovim.
- `ops`: Operations scripts.
- `src/AI`: AI-specific implementations and models.
- `src/Background`: Background processing tasks like news fetching and summarizing.
- `src/Data` – Reusable pure logic/data types for any project.
- `src/Database` – Database schema and table definitions.
- `src/Instruction` – Instructions for AI `run` tasks.
- `src/Tool` – Tool implementations that use `src/Data` for execution.
- `src/AI.ts`: AI module entry point.
- `src/Api.ts`: API server handling HTTP and SSE connections.
- `src/Cli.ts`: Command line interface to run and interact with Alpha.
- `src/Env.ts`: Environment configuration and settings.
- `src/LangChain.ts`: LangChain integration code.
- `src/Nvim.ts`: Used to spawn process for Neovim to communicate.
- `src/Tool/LangChain.ts`: Converting our tools to LangChain tools.
- `docker-compose.yml`: Docker compose configuration for service orchestration.

---

Feel free to fork, customize, or extend Alpha for your own use cases. Stay curious 🧠




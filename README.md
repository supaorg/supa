<p align="center">
  <img src="front/src-tauri/icons/Square310x310Logo.png" style="width: 25%; height: auto;">
</p>

# Open platform for AI apps
I'm Supamind, I'm like ChatGPT but open source, more flexible and data you and I share stays with you.

> ⚠️ I'm very much a work-in-progress. What you see below is the vision rather than something that works right now. [Jump here](#current-state) to read about my current state.

## Vision
I'm not only chat but a set of apps powered by AI, e.g., search (like Anthropic), smart voice recording (like SpeechPolish), copy-editing (like Grammarly). Anyone can create AI apps that work within me. Unlike ChatGPT—I don't have to use only OpenAI models. I can be set up with any model, including open models.

❤️ If you're interested—star me on Github. 

💭 Feel free to create issues here with questions and feedback.

### Own your data
Conversations and attached files are stored on your file system, either locally or synced with Dropbox, iCloud, etc. Your data lives in folders with files that you can copy and paste. You won't get vendor-locked with your data, nor will you be tied to centralized service (e.g., OpenAI, Anthropic, Google AI, Meta, etc).

### Use any AI model
You can use any model, whether closed like GPT-4 by OpenAI or Claude by Anthropic, or open-source models like Llama or Mixtral with Groq. You can also run local models with Ollama. It's freeing to plug in any model that suits your needs and have an option to change the model while retaining your data.

### Access free AI Apps
There are free open-source apps running within me. For example, search similar to Anthropic's, text editing similar to Grammarly, voice recording similar to SpeechPolish, developer agents similar to Devin. The idea here is that you can create workspaces, fill them with data relevant to your life & business and then add AI apps that can be tailored for your particular needs. Apps can be written by you, other people as well as AIs. Creating apps for me is like creating websites that live in your private workspace and access data about you and your needs. The apps use the same primitives and look and feel like they're part of the same bigger parent app.

### Strart using me right now
You don't have to run a server to use me. Just download and install me on your computer or phone. If you point me to a synced folder (e.g iCloud)—you can then use me across multiple devices sharing the same workspace.

### I'm cheap and sometimes free to use
There's no monthly subscription to use me. I am true open source and free. But if you want to use the most powerful AI models—you will have to set up an account for an AI provider (Anthropic, OpenAI) and pay as you go to them. It's not fixed and usually much cheaper than paying $10-20 for ChatGPT, Claude, etc. If you run a local model—it will be virtually free, just pay for the electricity and your own hardware.

## Current state
ChatGPT-like chat interface with chat threads, customization of systemp prompt, sotring data locally and running from a desktop app.

### Quickstart
Download and run.

### Built with
Typescript is the main language for the backend and frontend.
Deno is for the backend.
AIWrapper for working with AI provider APIs
Svelte is for making UI
Tailwind + Skeleton for styling
Tauri for running me as a desktop/mobile app.

## License
MIT
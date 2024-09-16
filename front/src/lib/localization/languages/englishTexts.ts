import type { Texts } from "../texts";

/*
  We can write procedural translations like this:
  
  function pluralize(count: number, one: string, many: string): string {
    return count === 1 ? one : many;
  }

  export const russianTexts: Partial<Texts> = {
    basics: {
      name: "Имя",
      // Other translations...
    },
    appPage: {
      title: "Приложения",
      buttonNewConfig: (count: number) => pluralize(count, "Новая конфигурация чата", "Новые конфигурации чата"),
    },
    // Other sections...
  };  
*/


export const englishTexts: Texts = {
  basics: {
    name: "Name",
    button: "Button",
    description: "Description",
    instructions: "Instructions",
    optional: "Optional",
    loading: "Loading...",
    thinking: "Thinking...",
    model: "Model",
  },

  agentsPage: {
    title: "Apps",
    buttonNewConfig: "New Chat Config",
  },

  agentConfigPage: {
    newConfigTitle: "New Chat Config",
    editConfigTitle: "Edit Chat Config",
    defaultConfigTitle: "Default Chat Config",
    newConfigButton: "New thread button (optional)",
    buttonCreate: "Create",
    buttonSave: "Save Changes",
    namePlaceholder: "Name your app",
    descriptionPlaceholder: "A short description of what this app does",
    instructionsPlaceholder:
      "Start with 'You are a ...'. Instruct the AI as if you were writing an instruction for a new employee",
    buttonPlaceholder: "A short actionable text for a button",
    gotoNewConfig: "Go here if you want to create a new chat config",
    errorValidationRequired: "This field is required",
    errorAgentLoadFailure: "Failed to load app config",
  },

  settingsPage: {
    title: "Settings",
  }
};

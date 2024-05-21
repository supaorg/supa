import type { Texts } from "../texts";

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
    title: "Agents",
    buttonNewConfig: "New Agent Config",
  },

  agentConfigPage: {
    newConfigTitle: "New Agent Config",
    editConfigTitle: "Edit Agent Config",
    defaultConfigTitle: "Default Agent Config",
    newConfigButton: "New thread button (optional)",
    buttonCreate: "Create",
    buttonSave: "Save Changes",
    namePlaceholder: "Name your agent",
    descriptionPlaceholder: "A short description of what this agent does",
    instructionsPlaceholder:
      "Start with 'You are a ...'. Instruct the agent as if you were writing an instruction for a new employee",
    buttonPlaceholder: "A short actionable text for a button",
    gotoNewConfig: "Go here if you want to create a new agent config",
    errorValidationRequired: "This field is required",
    errorAgentLoadFailure: "Failed to load agent config",
  },
};

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
    supa: "Supa",
    name: "Name",
    button: "Button",
    description: "Description",
    instructions: "Instructions",
    optional: "Optional",
    loading: "Loading...",
    thinking: "Thinking...",
    model: "Model",
    apps: "Apps",
  },

  messageForm: {
    placeholder: "Write a message...",
    attachFile: "Attach file",
    send: "Send message",
    stop: "Stop generation"
  },

  appPage: {
    title: "Apps",
    buttonNewConfig: "New Chat Config",
  },

  appConfigPage: {
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
    errorAppConfigLoadFailure: "Failed to load app config",
  },

  settingsPage: {
    title: "Settings",
    appearance: {
      title: "Appearance",
      theme: "Theme"
    },
    providers: {
      title: "Model Providers"
    },
    spaces: {
      title: "Spaces",
      spaceCount: (count: number) => `You have ${count === 1 ? '1 space' : `${count} spaces`}`,
      manageButton: "Manage"
    },
    developers: {
      title: "For developers",
      toggleDevMode: "Toggle Dev Mode"
    }
  },

  spacesPage: {
    title: "Your Spaces",
    description: "A space is where your AI apps and other data is stored. You can have multiple spaces and switch between them. For example, one can be for work and another personal.",
    opener: {
      createTitle: "Create a new space",
      createDescription: "Choose a folder for your new space. It could be local folder or a folder synced with iCloud, Dropbox, Google Drive, etc. Make sure the folder is empty.",
      createButton: "Create",
      openTitle: "Open a space",
      openDescription: "Open a folder that contains your space.",
      openButton: "Open",
      errorCreate: "Failed to create space",
      errorOpen: "Failed to open space",
      dialogCreateTitle: "Select a folder for a new space",
      dialogOpenTitle: "Select a folder with a space"
    }
  }
};

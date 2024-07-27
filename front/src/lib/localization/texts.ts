export interface Texts {
  basics: {
    name: string;
    button: string;
    description: string;
    instructions: string;
    optional: string;
    loading: string;
    thinking: string;
    model: string;
  }

  agentsPage: {
    title: string;
    buttonNewConfig: string;
  }

  agentConfigPage: {
    newConfigTitle: string;
    editConfigTitle: string;
    defaultConfigTitle: string;
    newConfigButton: string;
    buttonCreate: string;
    buttonSave: string;
    namePlaceholder: string;
    descriptionPlaceholder: string;
    instructionsPlaceholder: string;
    buttonPlaceholder: string;
    gotoNewConfig: string;
    errorValidationRequired: string;
    errorAgentLoadFailure: string;
  }

  settingsPage: {
    title: string;
  }
}

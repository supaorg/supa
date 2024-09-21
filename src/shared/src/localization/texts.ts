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

  appPage: {
    title: string;
    buttonNewConfig: string;
  }

  appConfigPage: {
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
    errorAppConfigLoadFailure: string;
  }

  settingsPage: {
    title: string;
  }
}
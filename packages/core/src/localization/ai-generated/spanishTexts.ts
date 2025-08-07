import type { Texts } from "../texts";

export const spanishTexts: Partial<Texts> = {
  basics: {
    name: "Nombre",
    button: "Botón",
    description: "Descripción",
    instructions: "Instrucciones",
    optional: "Opcional",
    loading: "Cargando...",
    thinking: "Pensando...",
    model: "Modelo",
    apps: "Aplicaciones",
  },

  messageForm: {
    placeholder: "Escribe un mensaje...",
    attachFile: "Adjuntar archivo",
    send: "Enviar mensaje",
    stop: "Detener generación"
  },

  appPage: {
    title: "Aplicaciones",
    buttonNewConfig: "Nueva Configuración de Chat",
    chatsTitle: "Chats",
    contactMessage: "La capacidad de crear otros tipos de aplicaciones llegará pronto. Escribe a <a class=\"anchor\" href=\"mailto:d@dkury.com\">d@dkury.com</a> si tienes ideas o sugerencias para una aplicación."
  },

  appConfigPage: {
    newConfigTitle: "Nueva Configuración de Chat",
    editConfigTitle: "Editar Configuración de Chat",
    defaultConfigTitle: "Configuración de Chat Predeterminada",
    newConfigButton: "Botón de nuevo tema (opcional)",
    buttonCreate: "Crear",
    buttonSave: "Guardar Cambios",
    namePlaceholder: "Nombra tu aplicación",
    descriptionPlaceholder: "Una breve descripción de lo que hace esta aplicación",
    instructionsPlaceholder: "Comienza con 'Eres un...'. Instruye a la IA como si estuvieras escribiendo instrucciones para un nuevo empleado",
    buttonPlaceholder: "Un texto breve de acción para el botón",
    gotoNewConfig: "Ve aquí si quieres crear una nueva configuración de chat",
    errorValidationRequired: "Este campo es obligatorio",
    errorAppConfigLoadFailure: "Error al cargar la configuración de la aplicación",
    tableCell: {
      deleteButton: "Eliminar",
      visibilityLabel: "Alternar visibilidad de la aplicación",
      deleteLabel: "Eliminar configuración de la aplicación"
    },
    defaultConfigMessage: "Esta es la configuración de la aplicación de chat predeterminada. Solo puedes cambiar el modelo que utiliza.<br /><a href=\"/apps/new-config\" class=\"anchor\">{defaultConfigGotoNew}</a> si quieres crear una nueva configuración de chat.",
    defaultConfigGotoNew: "Ve aquí",
    description: "Puedes crear tus propios prompts del sistema (instrucciones) basados en la aplicación de chat predeterminada. Será posible crear otros tipos de aplicaciones con herramientas y APIs externas en futuras versiones de Sila."
  },

  appConfigDropdown: {
    placeholder: "Seleccionar configuración..."
  },

  modelSelection: {
    manageProviders: "Gestionar proveedores de modelos",
    done: "Listo",
    backToSelection: "Volver a la selección de modelo"
  },

  settingsPage: {
    title: "Configuración",
    appearance: {
      title: "Apariencia",
      theme: "Tema",
      language: "Idioma"
    },
    providers: {
      title: "Proveedores de Modelos"
    },
    spaces: {
      title: "Espacios",
      spaceCount: (count: number) => `Tienes ${count} espacio${count === 1 ? '' : 's'}`,
      manageButton: "Gestionar"
    },
    developers: {
      title: "Para desarrolladores",
      toggleDevMode: "Alternar Modo Desarrollador"
    }
  },

  spacesPage: {
    title: "Tus Espacios",
    description: "Un espacio es donde se almacenan tus aplicaciones de IA y otros datos. Puedes tener múltiples espacios y cambiar entre ellos. Por ejemplo, uno puede ser para trabajo y otro personal.",
    opener: {
      createTitle: "Crear nuevo espacio",
      createDescription: "Elige una carpeta para tu nuevo espacio. Puede ser una carpeta local o una carpeta sincronizada con iCloud, Dropbox, Google Drive, etc. Asegúrate de que la carpeta esté vacía.",
      createButton: "Crear",
      openTitle: "Abrir espacio",
      openDescription: "Abre una carpeta que contenga tu espacio.",
      openButton: "Abrir",
      errorCreate: "Error al crear el espacio",
      errorOpen: "Error al abrir el espacio",
      dialogCreateTitle: "Selecciona una carpeta para el nuevo espacio",
      dialogOpenTitle: "Selecciona una carpeta con un espacio"
    }
  }
}; 
import type { Texts } from "../texts";

function pluralize(count: number, one: string, few: string, many: string): string {
  // Russian pluralization rules:
  // 1 item - one form
  // 2-4 items - few form
  // 5-20 items - many form
  // Then the pattern repeats: 21 - one form, 22-24 few form, 25-30 many form, etc.
  const lastDigit = count % 10;
  const lastTwoDigits = count % 100;

  if (lastTwoDigits >= 11 && lastTwoDigits <= 19) {
    return many;
  }

  if (lastDigit === 1) {
    return one;
  }

  if (lastDigit >= 2 && lastDigit <= 4) {
    return few;
  }

  return many;
}

export const russianTexts: Texts = {
  basics: {
    supa: "Супа",
    name: "Имя",
    button: "Кнопка",
    description: "Описание",
    instructions: "Инструкции",
    optional: "Необязательно",
    loading: "Загрузка...",
    thinking: "Думаю...",
    model: "Модель",
    apps: "Приложения",
  },

  messageForm: {
    placeholder: "Напишите сообщение...",
    attachFile: "Прикрепить файл",
    send: "Отправить сообщение",
    stop: "Остановить генерацию"
  },

  appPage: {
    title: "Приложения",
    buttonNewConfig: "Новая конфигурация чата",
    chatsTitle: "Чаты",
    contactMessage: "Возможность создавать другие типы приложений появится позже. Напишите на <a class=\"anchor\" href=\"mailto:hi@supa.cloud\">hi@supa.cloud</a>, если у вас есть идеи или предложения для приложения."
  },

  appConfigPage: {
    newConfigTitle: "Новая конфигурация чата",
    editConfigTitle: "Редактировать конфигурацию чата",
    defaultConfigTitle: "Конфигурация чата по умолчанию",
    newConfigButton: "Кнопка новой беседы (необязательно)",
    buttonCreate: "Создать",
    buttonSave: "Сохранить изменения",
    namePlaceholder: "Назовите ваше приложение",
    descriptionPlaceholder: "Краткое описание того, что делает это приложение",
    instructionsPlaceholder: 
      "Начните с 'Ты - ...'. Инструктируйте ИИ так, как если бы вы писали инструкцию для нового сотрудника",
    buttonPlaceholder: "Короткий текст действия для кнопки",
    gotoNewConfig: "Перейдите сюда, если хотите создать новую конфигурацию чата",
    errorValidationRequired: "Это поле обязательно для заполнения",
    errorAppConfigLoadFailure: "Не удалось загрузить конфигурацию приложения",
    tableCell: {
      deleteButton: "Удалить",
      visibilityLabel: "Переключить видимость приложения",
      deleteLabel: "Удалить конфигурацию приложения"
    },
    defaultConfigMessage: "Это конфигурация чата по умолчанию. Вы можете изменить только используемую модель.<br /><a href=\"/apps/new-config\" class=\"anchor\">{defaultConfigGotoNew}</a>, если хотите создать новую конфигурацию чата.",
    defaultConfigGotoNew: "Перейдите сюда",
    description: "Вы можете создавать свои собственные системные промпты (инструкции) на основе чата по умолчанию. В будущих версиях Supamind будет возможно создавать другие типы приложений с инструментами и внешними API."
  },

  appConfigDropdown: {
    placeholder: "Выберите конфигурацию..."
  },

  modelSelection: {
    manageProviders: "Управление провайдерами моделей",
    done: "Готово",
    backToSelection: "Вернуться к выбору модели"
  },

  settingsPage: {
    title: "Настройки",
    appearance: {
      title: "Внешний вид",
      theme: "Тема",
      language: "Язык"
    },
    providers: {
      title: "Провайдеры моделей"
    },
    spaces: {
      title: "Пространства",
      spaceCount: (count: number) => `У вас ${pluralize(
        count,
        "1 пространство",
        `${count} пространства`,
        `${count} пространств`
      )}`,
      manageButton: "Управление"
    },
    developers: {
      title: "Для разработчиков",
      toggleDevMode: "Переключить режим разработчика"
    }
  },

  spacesPage: {
    title: "Ваши пространства",
    description: "Пространство - это место, где хранятся ваши ИИ-приложения и другие данные. У вас может быть несколько пространств, между которыми можно переключаться. Например, одно для работы, другое для личного использования.",
    opener: {
      createTitle: "Создать новое пространство",
      createDescription: "Выберите папку для нового пространства. Это может быть локальная папка или папка, синхронизированная с iCloud, Dropbox, Google Drive и т.д. Убедитесь, что папка пуста.",
      createButton: "Создать",
      openTitle: "Открыть пространство",
      openDescription: "Откройте папку, содержащую ваше пространство.",
      openButton: "Открыть",
      errorCreate: "Не удалось создать пространство",
      errorOpen: "Не удалось открыть пространство",
      dialogCreateTitle: "Выберите папку для нового пространства",
      dialogOpenTitle: "Выберите папку с пространством"
    }
  }
}; 
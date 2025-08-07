import type { Texts } from "../texts";

// TODO: This file requires RTL (Right-to-Left) support in the UI
// RTL implementation needed for proper Arabic text display and layout

export const arabicTexts: Partial<Texts> = {
  basics: {
    name: "الاسم",
    button: "زر",
    description: "الوصف",
    instructions: "التعليمات",
    optional: "اختياري",
    loading: "جارٍ التحميل...",
    thinking: "جارٍ التفكير...",
    model: "النموذج",
    apps: "التطبيقات",
  },

  messageForm: {
    placeholder: "اكتب رسالة...",
    attachFile: "إرفاق ملف",
    send: "إرسال الرسالة",
    stop: "إيقاف التوليد"
  },

  appPage: {
    title: "التطبيقات",
    buttonNewConfig: "إعداد دردشة جديد",
    chatsTitle: "الدردشات",
    contactMessage: "ستتوفر قريباً القدرة على إنشاء أنواع أخرى من التطبيقات. اكتب إلى <a class=\"anchor\" href=\"mailto:d@dkury.com\">d@dkury.com</a> إذا كان لديك أفكار أو اقتراحات لتطبيق."
  },

  appConfigPage: {
    newConfigTitle: "إعداد دردشة جديد",
    editConfigTitle: "تعديل إعداد الدردشة",
    defaultConfigTitle: "إعداد الدردشة الافتراضي",
    newConfigButton: "زر موضوع جديد (اختياري)",
    buttonCreate: "إنشاء",
    buttonSave: "حفظ التغييرات",
    namePlaceholder: "اسم تطبيقك",
    descriptionPlaceholder: "وصف مختصر لما يفعله هذا التطبيق",
    instructionsPlaceholder: "ابدأ بـ 'أنت...' قم بتوجيه الذكاء الاصطناعي كما لو كنت تكتب تعليمات لموظف جديد",
    buttonPlaceholder: "نص إجرائي قصير للزر",
    gotoNewConfig: "اذهب هنا إذا كنت تريد إنشاء إعداد دردشة جديد",
    errorValidationRequired: "هذا الحقل مطلوب",
    errorAppConfigLoadFailure: "فشل تحميل إعداد التطبيق",
    tableCell: {
      deleteButton: "حذف",
      visibilityLabel: "تبديل رؤية التطبيق",
      deleteLabel: "حذف إعداد التطبيق"
    },
    defaultConfigMessage: "هذا هو إعداد تطبيق الدردشة الافتراضي. يمكنك فقط تغيير النموذج الذي يستخدمه.<br /><a href=\"/apps/new-config\" class=\"anchor\">{defaultConfigGotoNew}</a> إذا كنت تريد إنشاء إعداد دردشة جديد.",
    defaultConfigGotoNew: "اذهب هنا",
    description: "يمكنك إنشاء توجيهات النظام الخاصة بك (التعليمات) بناءً على تطبيق الدردشة الافتراضي. سيكون من الممكن إنشاء أنواع أخرى من التطبيقات باستخدام الأدوات وواجهات برمجة التطبيقات الخارجية في الإصدارات المستقبلية من Sila.",
  },

  appConfigDropdown: {
    placeholder: "اختر الإعداد..."
  },

  modelSelection: {
    manageProviders: "إدارة مزودي النماذج",
    done: "تم",
    backToSelection: "العودة إلى اختيار النموذج"
  },

  settingsPage: {
    title: "الإعدادات",
    appearance: {
      title: "المظهر",
      theme: "السمة",
      language: "اللغة"
    },
    providers: {
      title: "مزودو النماذج"
    },
    spaces: {
      title: "المساحات",
      spaceCount: (count: number) => `لديك ${count === 1 ? 'مساحة واحدة' : count === 2 ? 'مساحتان' : `${count} مساحات`}`,
      manageButton: "إدارة"
    },
    developers: {
      title: "للمطورين",
      toggleDevMode: "تبديل وضع المطور"
    }
  },

  spacesPage: {
    title: "مساحاتك",
    description: "المساحة هي المكان الذي يتم فيه تخزين تطبيقات الذكاء الاصطناعي والبيانات الأخرى الخاصة بك. يمكن أن يكون لديك مساحات متعددة والتبديل بينها. على سبيل المثال، يمكن أن تكون واحدة للعمل وأخرى شخصية.",
    opener: {
      createTitle: "إنشاء مساحة جديدة",
      createDescription: "اختر مجلداً لمساحتك الجديدة. يمكن أن يكون مجلداً محلياً أو مجلداً متزامناً مع iCloud أو Dropbox أو Google Drive وما إلى ذلك. تأكد من أن المجلد فارغ.",
      createButton: "إنشاء",
      openTitle: "فتح مساحة",
      openDescription: "افتح مجلداً يحتوي على مساحتك.",
      openButton: "فتح",
      errorCreate: "فشل إنشاء المساحة",
      errorOpen: "فشل فتح المساحة",
      dialogCreateTitle: "اختر مجلداً لمساحة جديدة",
      dialogOpenTitle: "اختر مجلداً يحتوي على مساحة"
    }
  }
}; 
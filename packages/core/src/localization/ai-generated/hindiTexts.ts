import type { Texts } from "../texts";

export const hindiTexts: Partial<Texts> = {
  basics: {
    name: "नाम",
    button: "बटन",
    description: "विवरण",
    instructions: "निर्देश",
    optional: "वैकल्पिक",
    loading: "लोड हो रहा है...",
    thinking: "सोच रहा है...",
    model: "मॉडल",
    apps: "एप्लिकेशन",
  },

  messageForm: {
    placeholder: "संदेश लिखें...",
    attachFile: "फ़ाइल जोड़ें",
    send: "संदेश भेजें",
    stop: "जनरेशन रोकें"
  },

  appPage: {
    title: "एप्लिकेशन",
    buttonNewConfig: "नया चैट कॉन्फ़िगरेशन",
    chatsTitle: "चैट",
    contactMessage: "अन्य प्रकार के एप्लिकेशन बनाने की क्षमता जल्द ही आ रही है। यदि आपके पास एप्लिकेशन के लिए विचार या सुझाव हैं, तो <a class=\"anchor\" href=\"mailto:d@dkury.com\">d@dkury.com</a> पर लिखें।"
  },

  appConfigPage: {
    newConfigTitle: "नया चैट कॉन्फ़िगरेशन",
    editConfigTitle: "चैट कॉन्फ़िगरेशन संपादित करें",
    defaultConfigTitle: "डिफ़ॉल्ट चैट कॉन्फ़िगरेशन",
    newConfigButton: "नया थ्रेड बटन (वैकल्पिक)",
    buttonCreate: "बनाएं",
    buttonSave: "परिवर्तन सहेजें",
    namePlaceholder: "अपने एप्लिकेशन का नाम दें",
    descriptionPlaceholder: "यह एप्लिकेशन क्या करता है इसका संक्षिप्त विवरण",
    instructionsPlaceholder: "'आप एक...' से शुरू करें। AI को निर्देश दें जैसे आप एक नए कर्मचारी को निर्देश दे रहे हों",
    buttonPlaceholder: "बटन के लिए संक्षिप्त क्रिया टेक्स्ट",
    gotoNewConfig: "यदि आप नया चैट कॉन्फ़िगरेशन बनाना चाहते हैं तो यहाँ जाएं",
    errorValidationRequired: "यह फ़ील्ड आवश्यक है",
    errorAppConfigLoadFailure: "एप्लिकेशन कॉन्फ़िगरेशन लोड करने में विफल",
    tableCell: {
      deleteButton: "हटाएं",
      visibilityLabel: "एप्लिकेशन की दृश्यता टॉगल करें",
      deleteLabel: "एप्लिकेशन कॉन्फ़िगरेशन हटाएं"
    },
    defaultConfigMessage: "यह डिफ़ॉल्ट चैट एप्लिकेशन का कॉन्फ़िगरेशन है। आप केवल इसके द्वारा उपयोग किए जाने वाले मॉडल को बदल सकते हैं।<br /><a href=\"/apps/new-config\" class=\"anchor\">{defaultConfigGotoNew}</a> यदि आप नया चैट कॉन्फ़िगरेशन बनाना चाहते हैं।",
    defaultConfigGotoNew: "यहाँ जाएं",
    description: "आप डिफ़ॉल्ट चैट एप्लिकेशन के आधार पर अपने खुद के सिस्टम प्रॉम्प्ट (निर्देश) बना सकते हैं। Sila के भविष्य के संस्करणों में टूल्स और बाहरी API के साथ अन्य प्रकार के एप्लिकेशन बनाना संभव होगा।"
  },

  appConfigDropdown: {
    placeholder: "कॉन्फ़िगरेशन चुनें..."
  },

  modelSelection: {
    manageProviders: "मॉडल प्रदाताओं को प्रबंधित करें",
    done: "पूर्ण",
    backToSelection: "मॉडल चयन पर वापस जाएं"
  },

  settingsPage: {
    title: "सेटिंग्स",
    appearance: {
      title: "दिखावट",
      theme: "थीम",
      language: "भाषा"
    },
    providers: {
      title: "मॉडल प्रदाता"
    },
    spaces: {
      title: "स्पेस",
      spaceCount: (count: number) => `आपके पास ${count} स्पेस ${count === 1 ? 'है' : 'हैं'}`,
      manageButton: "प्रबंधित करें"
    },
    developers: {
      title: "डेवलपर्स के लिए",
      toggleDevMode: "डेवलपर मोड टॉगल करें"
    }
  },

  spacesPage: {
    title: "आपके स्पेस",
    description: "स्पेस वह जगह है जहां आपके AI एप्लिकेशन और अन्य डेटा संग्रहीत होते हैं। आपके पास कई स्पेस हो सकते हैं और आप उनके बीच स्विच कर सकते हैं। उदाहरण के लिए, एक काम के लिए और दूसरा व्यक्तिगत उपयोग के लिए हो सकता है।",
    opener: {
      createTitle: "नया स्पेस बनाएं",
      createDescription: "अपने नए स्पेस के लिए एक फ़ोल्डर चुनें। यह एक स्थानीय फ़ोल्डर या iCloud, Dropbox, Google Drive आदि के साथ सिंक किया गया फ़ोल्डर हो सकता है। सुनिश्चित करें कि फ़ोल्डर खाली है।",
      createButton: "बनाएं",
      openTitle: "स्पेस खोलें",
      openDescription: "अपना स्पेस वाला फ़ोल्डर खोलें।",
      openButton: "खोलें",
      errorCreate: "स्पेस बनाने में विफल",
      errorOpen: "स्पेस खोलने में विफल",
      dialogCreateTitle: "नए स्पेस के लिए फ़ोल्डर चुनें",
      dialogOpenTitle: "स्पेस वाला फ़ोल्डर चुनें"
    }
  }
}; 
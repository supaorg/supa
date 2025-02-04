import type { Texts } from "../texts";

export const turkishTexts: Partial<Texts> = {
  basics: {
    supa: "Supa",
    name: "İsim",
    button: "Düğme",
    description: "Açıklama",
    instructions: "Talimatlar",
    optional: "İsteğe bağlı",
    loading: "Yükleniyor...",
    thinking: "Düşünüyor...",
    model: "Model",
    apps: "Uygulamalar",
  },

  messageForm: {
    placeholder: "Bir mesaj yazın...",
    attachFile: "Dosya ekle",
    send: "Mesaj gönder",
    stop: "Üretimi durdur"
  },

  appPage: {
    title: "Uygulamalar",
    buttonNewConfig: "Yeni Sohbet Yapılandırması",
    chatsTitle: "Sohbetler",
    contactMessage: "Diğer uygulama türlerini oluşturma özelliği yakında gelecek. Uygulama için fikir veya önerileriniz varsa <a class=\"anchor\" href=\"mailto:hi@supa.cloud\">hi@supa.cloud</a> adresine yazın."
  },

  appConfigPage: {
    newConfigTitle: "Yeni Sohbet Yapılandırması",
    editConfigTitle: "Sohbet Yapılandırmasını Düzenle",
    defaultConfigTitle: "Varsayılan Sohbet Yapılandırması",
    newConfigButton: "Yeni konu düğmesi (isteğe bağlı)",
    buttonCreate: "Oluştur",
    buttonSave: "Değişiklikleri Kaydet",
    namePlaceholder: "Uygulamanıza isim verin",
    descriptionPlaceholder: "Bu uygulamanın ne yaptığına dair kısa bir açıklama",
    instructionsPlaceholder: "'Sen bir ...' ile başlayın. Yapay zekayı yeni bir çalışana talimat veriyormuş gibi yönlendirin",
    buttonPlaceholder: "Düğme için kısa bir eylem metni",
    gotoNewConfig: "Yeni bir sohbet yapılandırması oluşturmak istiyorsanız buraya gidin",
    errorValidationRequired: "Bu alan zorunludur",
    errorAppConfigLoadFailure: "Uygulama yapılandırması yüklenemedi",
    tableCell: {
      deleteButton: "Sil",
      visibilityLabel: "Uygulama görünürlüğünü değiştir",
      deleteLabel: "Uygulama yapılandırmasını sil"
    },
    defaultConfigMessage: "Bu varsayılan sohbet uygulamasının yapılandırmasıdır. Sadece kullandığı modeli değiştirebilirsiniz.<br /><a href=\"/apps/new-config\" class=\"anchor\">{defaultConfigGotoNew}</a> yeni bir sohbet yapılandırması oluşturmak istiyorsanız.",
    defaultConfigGotoNew: "Buraya gidin",
    description: "Varsayılan sohbet uygulamasına dayalı kendi sistem komutlarınızı (talimatlar) oluşturabilirsiniz. Supamind'ın gelecek sürümlerinde araçlar ve harici API'lerle başka tür uygulamalar oluşturmak mümkün olacak."
  },

  appConfigDropdown: {
    placeholder: "Yapılandırma seçin..."
  },

  modelSelection: {
    manageProviders: "Model sağlayıcılarını yönet",
    done: "Tamam",
    backToSelection: "Model seçimine geri dön"
  },

  settingsPage: {
    title: "Ayarlar",
    appearance: {
      title: "Görünüm",
      theme: "Tema",
      language: "Dil"
    },
    providers: {
      title: "Model Sağlayıcıları"
    },
    spaces: {
      title: "Alanlar",
      spaceCount: (count: number) => `${count} alan${count === 1 ? '' : 'ınız'} var`,
      manageButton: "Yönet"
    },
    developers: {
      title: "Geliştiriciler için",
      toggleDevMode: "Geliştirici Modunu Aç/Kapat"
    }
  },

  spacesPage: {
    title: "Alanlarınız",
    description: "Alan, yapay zeka uygulamalarınızın ve diğer verilerinizin saklandığı yerdir. Birden fazla alanınız olabilir ve bunlar arasında geçiş yapabilirsiniz. Örneğin, biri iş için diğeri kişisel kullanım için olabilir.",
    opener: {
      createTitle: "Yeni alan oluştur",
      createDescription: "Yeni alanınız için bir klasör seçin. Bu, yerel bir klasör veya iCloud, Dropbox, Google Drive vb. ile senkronize edilen bir klasör olabilir. Klasörün boş olduğundan emin olun.",
      createButton: "Oluştur",
      openTitle: "Alan aç",
      openDescription: "Alanınızı içeren klasörü açın.",
      openButton: "Aç",
      errorCreate: "Alan oluşturulamadı",
      errorOpen: "Alan açılamadı",
      dialogCreateTitle: "Yeni alan için klasör seçin",
      dialogOpenTitle: "Alan içeren klasörü seçin"
    }
  }
}; 
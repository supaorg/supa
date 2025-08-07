import type { Texts } from "../texts";

export const japaneseTexts: Partial<Texts> = {
  basics: {
    name: "名前",
    button: "ボタン",
    description: "説明",
    instructions: "指示",
    optional: "任意",
    loading: "読み込み中...",
    thinking: "考え中...",
    model: "モデル",
    apps: "アプリ",
  },

  messageForm: {
    placeholder: "メッセージを入力...",
    attachFile: "ファイルを添付",
    send: "メッセージを送信",
    stop: "生成を停止"
  },

  appPage: {
    title: "アプリ",
    buttonNewConfig: "新規チャット設定",
    chatsTitle: "チャット",
    contactMessage: "他のタイプのアプリを作成する機能は近日公開予定です。アプリについてのアイデアや提案がありましたら、<a class=\"anchor\" href=\"mailto:d@dkury.com\">d@dkury.com</a>までご連絡ください。"
  },

  appConfigPage: {
    newConfigTitle: "新規チャット設定",
    editConfigTitle: "チャット設定を編集",
    defaultConfigTitle: "デフォルトチャット設定",
    newConfigButton: "新規スレッドボタン（任意）",
    buttonCreate: "作成",
    buttonSave: "変更を保存",
    namePlaceholder: "アプリの名前を入力してください",
    descriptionPlaceholder: "このアプリの簡単な説明を入力してください",
    instructionsPlaceholder: "「あなたは...です」から始めてください。新入社員への指示を書くように、AIに指示を与えてください",
    buttonPlaceholder: "ボタンの簡潔な動作テキスト",
    gotoNewConfig: "新しいチャット設定を作成する場合はこちらへ",
    errorValidationRequired: "この項目は必須です",
    errorAppConfigLoadFailure: "アプリ設定の読み込みに失敗しました",
    tableCell: {
      deleteButton: "削除",
      visibilityLabel: "アプリの表示を切り替え",
      deleteLabel: "アプリ設定を削除"
    },
    defaultConfigMessage: "これはデフォルトチャットアプリの設定です。使用するモデルのみ変更可能です。<br /><a href=\"/apps/new-config\" class=\"anchor\">{defaultConfigGotoNew}</a> 新しいチャット設定を作成する場合はこちらをクリックしてください。",
    defaultConfigGotoNew: "こちらへ",
    description: "デフォルトチャットアプリをベースに、独自のシステムプロンプト（指示）を作成できます。Silaの将来のバージョンでは、ツールや外部APIを使用して他のタイプのアプリを作成することが可能になります。"
  },

  appConfigDropdown: {
    placeholder: "設定を選択..."
  },

  modelSelection: {
    manageProviders: "モデルプロバイダーを管理",
    done: "完了",
    backToSelection: "モデル選択に戻る"
  },

  settingsPage: {
    title: "設定",
    appearance: {
      title: "外観",
      theme: "テーマ",
      language: "言語"
    },
    providers: {
      title: "モデルプロバイダー"
    },
    spaces: {
      title: "スペース",
      spaceCount: (count: number) => `${count}個のスペースがあります`,
      manageButton: "管理"
    },
    developers: {
      title: "開発者向け",
      toggleDevMode: "開発者モードを切り替え"
    }
  },

  spacesPage: {
    title: "スペース",
    description: "スペースは、AIアプリやその他のデータを保存する場所です。複数のスペースを持ち、それらを切り替えることができます。例えば、仕事用と個人用のスペースを分けることができます。",
    opener: {
      createTitle: "新規スペースを作成",
      createDescription: "新しいスペース用のフォルダを選択してください。ローカルフォルダ、またはiCloud、Dropbox、Google Driveなどと同期されているフォルダを選択できます。フォルダが空であることを確認してください。",
      createButton: "作成",
      openTitle: "スペースを開く",
      openDescription: "スペースを含むフォルダを開きます。",
      openButton: "開く",
      errorCreate: "スペースの作成に失敗しました",
      errorOpen: "スペースを開けませんでした",
      dialogCreateTitle: "新規スペース用のフォルダを選択",
      dialogOpenTitle: "スペースを含むフォルダを選択"
    }
  }
}; 
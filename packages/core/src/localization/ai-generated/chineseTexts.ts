import type { Texts } from "../texts";

export const chineseTexts: Texts = {
  basics: {
    supa: "Supa",
    name: "名称",
    button: "按钮",
    description: "描述",
    instructions: "指令",
    optional: "可选",
    loading: "加载中...",
    thinking: "思考中...",
    model: "模型",
    apps: "应用",
  },

  messageForm: {
    placeholder: "输入消息...",
    attachFile: "附加文件",
    send: "发送消息",
    stop: "停止生成"
  },

  appPage: {
    title: "应用",
    buttonNewConfig: "新建聊天配置",
    chatsTitle: "聊天",
    contactMessage: "创建其他类型应用的功能即将推出。如果您有应用的想法或建议，请发送邮件至 <a class=\"anchor\" href=\"mailto:hi@supa.cloud\">hi@supa.cloud</a>"
  },

  appConfigPage: {
    newConfigTitle: "新建聊天配置",
    editConfigTitle: "编辑聊天配置",
    defaultConfigTitle: "默认聊天配置",
    newConfigButton: "新建主题按钮（可选）",
    buttonCreate: "创建",
    buttonSave: "保存更改",
    namePlaceholder: "为您的应用命名",
    descriptionPlaceholder: "简短描述此应用的功能",
    instructionsPlaceholder: "以'你是一个...'开头。像指导新员工一样指导AI",
    buttonPlaceholder: "按钮的简短操作文本",
    gotoNewConfig: "如果要创建新的聊天配置，请点击这里",
    errorValidationRequired: "此字段为必填项",
    errorAppConfigLoadFailure: "加载应用配置失败",
    tableCell: {
      deleteButton: "删除",
      visibilityLabel: "切换应用可见性",
      deleteLabel: "删除应用配置"
    },
    defaultConfigMessage: "这是默认聊天应用的配置。您只能更改它使用的模型。<br /><a href=\"/apps/new-config\" class=\"anchor\">{defaultConfigGotoNew}</a> 如果您想创建新的聊天配置。",
    defaultConfigGotoNew: "点击这里",
    description: "您可以基于默认聊天应用创建自己的系统提示（指令）。在Supamind的未来版本中，将可以使用工具和外部API创建其他类型的应用。"
  },

  appConfigDropdown: {
    placeholder: "选择配置..."
  },

  modelSelection: {
    manageProviders: "管理模型提供商",
    done: "完成",
    backToSelection: "返回选择模型"
  },

  settingsPage: {
    title: "设置",
    appearance: {
      title: "外观",
      theme: "主题",
      language: "语言"
    },
    providers: {
      title: "模型提供商"
    },
    spaces: {
      title: "空间",
      spaceCount: (count: number) => `您有${count}个空间`,
      manageButton: "管理"
    },
    developers: {
      title: "开发者选项",
      toggleDevMode: "切换开发者模式"
    }
  },

  spacesPage: {
    title: "您的空间",
    description: "空间是存储您的AI应用和其他数据的地方。您可以拥有多个空间并在它们之间切换。例如，一个用于工作，另一个用于个人用途。",
    opener: {
      createTitle: "创建新空间",
      createDescription: "为新空间选择一个文件夹。可以是本地文件夹或与iCloud、Dropbox、Google Drive等同步的文件夹。请确保文件夹为空。",
      createButton: "创建",
      openTitle: "打开空间",
      openDescription: "打开包含您空间的文件夹。",
      openButton: "打开",
      errorCreate: "创建空间失败",
      errorOpen: "打开空间失败",
      dialogCreateTitle: "选择新空间的文件夹",
      dialogOpenTitle: "选择包含空间的文件夹"
    }
  }
}; 
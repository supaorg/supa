import type { Texts } from "../texts";

export const koreanTexts: Texts = {
  basics: {
    supa: "Supa",
    name: "이름",
    button: "버튼",
    description: "설명",
    instructions: "지시사항",
    optional: "선택사항",
    loading: "로딩 중...",
    thinking: "생각하는 중...",
    model: "모델",
    apps: "앱",
  },

  messageForm: {
    placeholder: "메시지를 입력하세요...",
    attachFile: "파일 첨부",
    send: "메시지 보내기",
    stop: "생성 중단"
  },

  appPage: {
    title: "앱",
    buttonNewConfig: "새 채팅 설정",
    chatsTitle: "채팅",
    contactMessage: "다른 유형의 앱을 만드는 기능이 곧 제공될 예정입니다. 앱에 대한 아이디어나 제안이 있으시다면 <a class=\"anchor\" href=\"mailto:hi@supa.cloud\">hi@supa.cloud</a>로 연락해 주세요."
  },

  appConfigPage: {
    newConfigTitle: "새 채팅 설정",
    editConfigTitle: "채팅 설정 편집",
    defaultConfigTitle: "기본 채팅 설정",
    newConfigButton: "새 스레드 버튼 (선택사항)",
    buttonCreate: "생성",
    buttonSave: "변경사항 저장",
    namePlaceholder: "앱 이름을 지정하세요",
    descriptionPlaceholder: "이 앱이 하는 일에 대한 간단한 설명",
    instructionsPlaceholder: "'당신은...'으로 시작하세요. 새로운 직원에게 지시하듯이 AI에게 지시를 해주세요",
    buttonPlaceholder: "버튼을 위한 간단한 동작 텍스트",
    gotoNewConfig: "새로운 채팅 설정을 만들고 싶으시다면 여기로 이동하세요",
    errorValidationRequired: "이 필드는 필수입니다",
    errorAppConfigLoadFailure: "앱 설정을 불러오지 못했습니다",
    tableCell: {
      deleteButton: "삭제",
      visibilityLabel: "앱 표시 여부 전환",
      deleteLabel: "앱 설정 삭제"
    },
    defaultConfigMessage: "이것은 기본 채팅 앱의 설정입니다. 사용하는 모델만 변경할 수 있습니다.<br /><a href=\"/apps/new-config\" class=\"anchor\">{defaultConfigGotoNew}</a> 새로운 채팅 설정을 만들고 싶으시다면 클릭하세요.",
    defaultConfigGotoNew: "여기로 이동",
    description: "기본 채팅 앱을 기반으로 자신만의 시스템 프롬프트(지시사항)를 만들 수 있습니다. Supamind의 향후 버전에서는 도구와 외부 API를 사용하여 다른 유형의 앱을 만들 수 있게 될 예정입니다."
  },

  appConfigDropdown: {
    placeholder: "설정 선택..."
  },

  modelSelection: {
    manageProviders: "모델 제공자 관리",
    done: "완료",
    backToSelection: "모델 선택으로 돌아가기"
  },

  settingsPage: {
    title: "설정",
    appearance: {
      title: "외관",
      theme: "테마",
      language: "언어"
    },
    providers: {
      title: "모델 제공자"
    },
    spaces: {
      title: "스페이스",
      spaceCount: (count: number) => `스페이스 ${count}개가 있습니다`,
      manageButton: "관리"
    },
    developers: {
      title: "개발자용",
      toggleDevMode: "개발자 모드 전환"
    }
  },

  spacesPage: {
    title: "내 스페이스",
    description: "스페이스는 AI 앱과 기타 데이터가 저장되는 공간입니다. 여러 개의 스페이스를 가질 수 있으며 이들 사이를 전환할 수 있습니다. 예를 들어, 하나는 업무용으로, 다른 하나는 개인용으로 사용할 수 있습니다.",
    opener: {
      createTitle: "새 스페이스 만들기",
      createDescription: "새 스페이스를 위한 폴더를 선택하세요. 로컬 폴더이거나 iCloud, Dropbox, Google Drive 등과 동기화된 폴더일 수 있습니다. 폴더가 비어있는지 확인하세요.",
      createButton: "만들기",
      openTitle: "스페이스 열기",
      openDescription: "스페이스가 있는 폴더를 엽니다.",
      openButton: "열기",
      errorCreate: "스페이스 생성 실패",
      errorOpen: "스페이스 열기 실패",
      dialogCreateTitle: "새 스페이스를 위한 폴더 선택",
      dialogOpenTitle: "스페이스가 있는 폴더 선택"
    }
  }
}; 
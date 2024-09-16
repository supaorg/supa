interface ProcessMsgBase {
  type: string;
}

export interface ProcessPortMsg extends ProcessMsgBase {
  type: "port";
  value: number;
}
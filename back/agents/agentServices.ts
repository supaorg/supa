import { AppDb } from "../db/appDb.ts";

export class AgentServices {
  public db: AppDb | null;

  constructor() {
    this.db = null;
  }
}
import { Router } from "../../shared/neorest/Router.ts";
import { AppDb } from "../db/appDb.ts";

export class BackServices {
  public router: Router;
  public db: AppDb | null;

  constructor(router: Router) {
    this.router = router;
    this.db = null;
  }

  setupDatabase(path: string) {
    if (this.db !== null) {
      throw new Error("Database is already initialized");
    }

    this.db = new AppDb(path);
  }
  
  getDbNotSetupError() {
    return "Database is not initialized";
  }
}

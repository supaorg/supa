import { Router } from "../neorest/Router.ts";

export class BackServices {
  public router: Router;

  constructor(router: Router) {
    this.router = router;
  }
}

import { Router } from "../neorest/Router.ts";
import { BackServices } from "./backServices.ts";

export function setupControllers(router: Router) {
  const services: BackServices = new BackServices(router);

  console.log("Setup controllers");
}

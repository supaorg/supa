import { Router } from "../../shared/neorest/Router.ts";
import { BackServices } from "./backServices.ts";
import { workspaceController } from "./workspaceController.ts";
import { agentController } from "./agentController.ts";
import { threadsController } from "./threadsController.ts";
import { providersController } from './providersController.ts';
import { rootController } from "./rootController.ts";

export function setupControllers(router: Router) {
  const services: BackServices = new BackServices(router);

  rootController(services);
  workspaceController(services);
  agentController(services);
  threadsController(services);
  providersController(services); 
}

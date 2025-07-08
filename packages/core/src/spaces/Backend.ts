import Space from "./Space";
import ChatAppBackend from "../apps/ChatAppBackend";

/**
 * Monitors all incoming ops and sends them to back-ends specific to app trees.
 * And also checks if there are jobs available to be taken
 */
export class Backend {
  private appBackends: ChatAppBackend[] = [];

  constructor(private space: Space, private inLocalMode: boolean = false) {
    /*
    if (!inLocalMode) {
      throw new Error("Backend is not supported for remote spaces yet");
    }
    */

    space.observeTreeLoad((appTreeId) => {
      const appTree = space.getAppTree(appTreeId);
      if (!appTree) {
        throw new Error(`App tree with id ${appTreeId} not found`);
      }

      if (appTree.getAppId() !== "default-chat") {
        console.warn(`There's no backend for app ${appTree.getAppId()}`);
        return;
      }

      this.appBackends.push(new ChatAppBackend(space, appTree));
    });
  }
}

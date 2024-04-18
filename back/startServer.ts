import { Application } from "https://deno.land/x/oak/mod.ts";

export async function startServer(
  app: Application,
  startingPort: number,
  callback: (port: number) => void,
) {
  let port = startingPort;
  while (true) {
    try {
      console.log(`Started the server on port ${port}.`);
      callback(port);
      await app.listen({ port });
      break;
    } catch (error) {
      if (error instanceof Deno.errors.AddrInUse) {
        console.log(
          `Port ${port} is already in use. Trying port ${port + 1}...`,
        );
        port++; // Try the next port
      } else {
        console.log(`Failed to start server: ${error}`);
        break; // Exit the loop if there's a different error
      }
    }
  }
}
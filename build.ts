async function runCmd(cwd: string, cmd: string, ...args: string[]) {
  const command = new Deno.Command(cmd, {
    cwd: cwd,
    args: args,
    stdout: "piped", 
    stderr: "piped",
  });

  const { code, stdout, stderr } = await command.output();

  if (code !== 0) {
    const error = new TextDecoder().decode(stderr);
    throw new Error(`Command failed with args: ${args.join(' ')} and stderr: ${error}`);
  }

  console.log(new TextDecoder().decode(stdout));
}

await runCmd("./back", "deno", "compile", "--allow-all", "--output", "../front/src-tauri/binaries/server-aarch64-apple-darwin", "main.ts");

await runCmd("./front", "npm", "run", "tauri", "build", "--", "—debug");

export {};
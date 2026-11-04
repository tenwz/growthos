import { Command } from "commander";
import { registerCapture } from "./commands/capture.js";
import { registerCockpit } from "./commands/cockpit.js";
import { registerDemo } from "./commands/demo.js";
import { registerDoctor } from "./commands/doctor.js";
import { registerExperiment } from "./commands/experiment.js";
import { registerInit } from "./commands/init.js";
import { registerMcp } from "./commands/mcp.js";
import { registerScore } from "./commands/score.js";
import { registerStatus } from "./commands/status.js";
import { registerTask } from "./commands/task.js";
import { CliError, EXIT } from "./ui/exit-codes.js";
import { failure } from "./ui/output.js";
import { VERSION } from "./version.js";

const program = new Command();

program
  .name("growthos")
  .description(
    "Marketing memory, receipts, and a scoreboard for AI agents.\n\n" +
      "Every claim cites a signal. Every experiment ends in a decision. Every repo gets a score.",
  )
  .version(VERSION, "-v, --version", "print the version")
  .showHelpAfterError()
  .addHelpText(
    "after",
    `
Examples:
  $ npx growthos demo                      See the evidence loop in ~5 seconds
  $ npx growthos init my-growth-os         Scaffold a Growth OS repo
  $ npx growthos capture --source x_post \\
      --url https://x.com/... --quote "..."  Capture a verbatim signal
  $ npx growthos task compile customer-truth Build an agent prompt with receipts
  $ npx growthos score --explain           Show every point
`,
  );

registerInit(program);
registerDemo(program);
registerDoctor(program);
registerCapture(program);
registerStatus(program);
registerTask(program);
registerExperiment(program);
registerScore(program);
registerCockpit(program);
registerMcp(program);

try {
  await program.parseAsync(process.argv);
} catch (error) {
  if (error instanceof CliError) {
    failure(error.message);
    process.exitCode = error.code;
  } else if (error instanceof Error) {
    failure(error.message);
    process.exitCode = EXIT.VALIDATION;
  } else {
    throw error;
  }
}

import { createProvider } from "../providers/index.js";
import { loadRepo } from "../repo/load.js";
import { type CompileOptions, type CompiledTask, compileTask } from "./compiler.js";
import {
  type ApplyResult,
  type OutputBlock,
  applyOutputs,
  parseFileBlocks,
  validateOutputPath,
  writeDiff,
  writeRunOutputs,
} from "./writeback.js";

export interface RunOptions extends CompileOptions {
  providerId?: string;
  model?: string;
  apply?: boolean;
}

export interface RunResult {
  task: CompiledTask;
  output: string;
  blocks: OutputBlock[];
  applyResult: ApplyResult;
  applied: boolean;
}

export async function runTask(
  root: string,
  jobId: string,
  options: RunOptions = {},
): Promise<RunResult> {
  const repo = loadRepo(root);
  const task = compileTask(repo, jobId, options);
  const provider = createProvider(repo.config, {
    id: options.providerId,
    model: options.model,
  });

  const output = await provider.complete({
    system: task.system,
    prompt: task.prompt,
    model: options.model,
  });
  const blocks = parseFileBlocks(output);
  if (blocks.length === 0) {
    throw new Error(
      "Provider output contained no file blocks. Expected ---FILE: growth/...--- ... ---END FILE---.",
    );
  }

  writeRunOutputs(task.runDir, blocks);

  let applyResult: ApplyResult;
  if (options.apply) {
    applyResult = applyOutputs(repo, blocks, task.outputPaths);
  } else {
    applyResult = { written: [], skipped: [] };
    for (const block of blocks) {
      try {
        const relative = validateOutputPath(repo.root, block.path);
        if (task.outputPaths.length > 0 && !task.outputPaths.includes(relative)) {
          applyResult.skipped.push({
            path: block.path,
            reason: "Path was not declared in the job output contract.",
          });
        } else {
          applyResult.written.push(relative);
        }
      } catch (error) {
        applyResult.skipped.push({ path: block.path, reason: (error as Error).message });
      }
    }
  }

  writeDiff(task.runDir, applyResult, !options.apply);

  return {
    task,
    output,
    blocks,
    applyResult,
    applied: Boolean(options.apply),
  };
}

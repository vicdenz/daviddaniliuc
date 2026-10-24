import { createExecutionSandbox } from "./providers/index.mjs";
import { executionProvider, executionStatus } from "./providers/config.mjs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { isDeepStrictEqual } from "node:util";
import { cppDriver } from "./cpp-driver.mjs";
import { beginUsage, finishUsage } from "./usage.mjs";

const root = path.join(process.cwd(), "prep");
const quote = (s) => "'" + String(s).replaceAll("'", "'\\''") + "'";
const limit = `import os,resource,sys,ctypes
if ctypes.CDLL(None).prctl(38,1,0,0,0) != 0: raise RuntimeError('Could not restrict privilege escalation')
cpu=int(sys.argv[1]); memory=int(sys.argv[2])
resource.setrlimit(resource.RLIMIT_CPU,(cpu,cpu+1))
resource.setrlimit(resource.RLIMIT_AS,(memory,memory))
resource.setrlimit(resource.RLIMIT_FSIZE,(8*1024*1024,8*1024*1024))
resource.setrlimit(resource.RLIMIT_NOFILE,(64,64))
resource.setrlimit(resource.RLIMIT_NPROC,(32,32))
resource.setrlimit(resource.RLIMIT_CORE,(0,0))
os.execv(sys.argv[3],sys.argv[3:])
`;

export function createExecutor({
  createSandbox = createExecutionSandbox,
  begin = beginUsage,
  finish = finishUsage,
  provider = executionProvider,
  status = executionStatus,
} = {}) {
  return async function execute(
    problem,
    code,
    language,
    cases,
    artifacts = [],
  ) {
    const selectedProvider = provider();
    if (!status().available)
      throw new Error(
        `${selectedProvider === "modal" ? "Modal" : "Vercel"} execution environment is not configured.`,
      );
    const usage = await begin(selectedProvider);
    let sandbox;
    try {
      sandbox = await createSandbox(selectedProvider);
    } catch (e) {
      await finish(usage, undefined, false);
      throw e;
    }
    const { cwd, python } = sandbox;
    const put = (name, content) => ({
      path: `${cwd}/${name}`,
      content: Buffer.from(content),
    });
    const text = async (name) => {
      try {
        return (
          (
            await sandbox.readFileToBuffer({ path: `${cwd}/${name}` })
          )?.toString("utf8") || ""
        );
      } catch {
        return "";
      }
    };
    try {
      const files = [put("main.py", code), put("limit.py", limit)];
      for (const file of ["worker.py", "interfaces.py"])
        files.push(
          put(file, await readFile(path.join(root, "runner", file), "utf8")),
        );
      for (const artifact of artifacts) {
        const origin = (problem.origins || []).find((p) =>
          artifact.path.startsWith(p + "/"),
        );
        if (!origin) continue;
        const relative = artifact.path.slice(origin.length + 1);
        if (
          !relative.endsWith(".py") ||
          ["main.py", "worker.py", "interfaces.py", "limit.py"].includes(
            relative,
          ) ||
          relative.split("/").includes("..") ||
          relative.startsWith("/")
        )
          continue;
        files.push(put(relative, artifact.content));
      }
      if (language === "cpp") {
        files.push(
          put(
            "json.hpp",
            await readFile(path.join(root, "vendor/json.hpp"), "utf8"),
          ),
        );
        files.push(
          put(
            "main.cpp",
            '#include "json.hpp"\n#include <bits/stdc++.h>\nusing nlohmann::json;\nusing namespace std;\n' +
              (problem.judge ? `class ${problem.judge.className};\n` : "") +
              code +
              cppDriver(problem),
          ),
        );
      }
      await sandbox.writeFiles(files);
      const command = async (args, input, timeout, compiling = false) => {
        await sandbox.writeFiles([
          put("input.json", JSON.stringify(input)),
          put("protocol.json", ""),
        ]);
        const start = performance.now();
        let exitCode = -1,
          timeoutError = null;
        try {
          const cmd = await sandbox.runCommand({
            cmd: "sh",
            args: [
              "-c",
              `timeout --kill-after=1s ${timeout}s ${quote(python)} limit.py ${Math.ceil(timeout)} ${compiling ? 1073741824 : 536870912} ${args.map(quote).join(" ")} <input.json >stdout.log 2>stderr.log 3>protocol.json`,
            ],
            cwd,
            timeoutMs: (timeout + 3) * 1000,
            env: {
              PYTHONDONTWRITEBYTECODE: "1",
              PYTEST_DISABLE_PLUGIN_AUTOLOAD: "1",
              PYTHONIOENCODING: "utf-8",
            },
          });
          exitCode = cmd.exitCode;
          if ([124, 137, 152].includes(exitCode))
            timeoutError = "Time limit exceeded.";
        } catch (e) {
          timeoutError = /timeout|deadline/i.test(e.message)
            ? "Time limit exceeded."
            : e.message;
        }
        const [protocol, stdout, stderr] = await Promise.all([
          text("protocol.json"),
          text("stdout.log"),
          text("stderr.log"),
        ]);
        return {
          exitCode,
          protocol,
          stdout: stdout.slice(0, 65536),
          stderr: stderr.slice(0, 131072),
          error: timeoutError,
          timeMs: performance.now() - start,
        };
      };
      if (language === "cpp") {
        const compiled = await command(
          [
            "/usr/bin/g++",
            "-std=c++20",
            "-O2",
            "-I.",
            "main.cpp",
            "-o",
            "program",
          ],
          [],
          40,
          true,
        );
        if (compiled.exitCode !== 0 || compiled.error)
          return cases.map((c) => ({
            id: c.id,
            name: c.name,
            status: "compilation_error",
            actual: null,
            error: compiled.error || compiled.stderr || "Compilation failed.",
            timeMs: compiled.timeMs,
            memoryKb: null,
          }));
      }
      const results = [];
      for (const c of cases) {
        if (language === "cpp" && c.kind !== "function") {
          results.push({
            id: c.id,
            name: c.name,
            status: "unsupported",
            actual: null,
            error:
              "This visible case uses a preserved Python test suite. Run it in Python; portable function cases also support C++.",
            timeMs: 0,
            memoryKb: null,
          });
          continue;
        }
        const runCase = (input) =>
          command(
            language === "cpp" ? [`${cwd}/program`] : [python, "worker.py"],
            language === "cpp"
              ? input
              : {
                  ...c,
                  input,
                  entry: c.entry || problem.entry,
                  judge: problem.judge,
                },
            Math.min(30, Math.max(0.1, c.timeout || 8)),
          );
        const run = await runCase(c.input);
        let data;
        try {
          data = JSON.parse(run.protocol);
        } catch {
          data = {
            actual: null,
            error: run.stderr || run.stdout || "No valid result was returned.",
          };
        }
        let error =
          run.error ||
          data.error ||
          (run.exitCode !== 0
            ? run.stderr || `Process exited ${run.exitCode}.`
            : null);
        let equal = isDeepStrictEqual(data.actual, c.expected);
        if (c.growthInput && !error) {
          const smaller = await runCase(c.growthInput);
          try {
            const small = JSON.parse(smaller.protocol);
            if (
              smaller.error ||
              small.error ||
              !isDeepStrictEqual(small.actual, c.growthExpected)
            ) {
              equal = false;
              error =
                smaller.error ||
                small.error ||
                "Smaller growth workload returned an incorrect result.";
            } else if (
              data.timeMs >
              Math.max(c.growthFloorMs, small.timeMs) * c.growthFactor
            ) {
              equal = false;
              error = `Runtime grew from ${small.timeMs.toFixed(2)}ms to ${data.timeMs.toFixed(2)}ms; allowed factor ${c.growthFactor}.`;
            }
          } catch {
            equal = false;
            error = "Could not measure the smaller growth workload.";
          }
        }
        results.push({
          ...data,
          id: c.id,
          name: c.name,
          status: error
            ? run.error?.includes("Time")
              ? "timeout"
              : "runtime_error"
            : equal
              ? "passed"
              : "failed",
          error,
          stdout: data.stdout || run.stdout + run.stderr,
          timeMs: data.timeMs ?? run.timeMs,
          memoryKb: data.memoryKb ?? null,
        });
      }
      return results;
    } finally {
      let stopped = false;
      try {
        await sandbox.stop();
        stopped = true;
      } finally {
        await finish(usage, sandbox.activeCpuUsageMs, stopped);
      }
    }
  };
}

export const execute = createExecutor();

export async function prepareCode(problem, source, language) {
  if (language !== "python" || !problem.judge) return source;
  const [result] = await execute(problem, "", "python", [
    {
      id: "prepare",
      name: "Prepare code",
      kind: "prepare",
      source,
      input: [],
      expected: null,
      timeout: 3,
    },
  ]);
  if (result.error) throw new Error(result.error);
  return result.actual;
}

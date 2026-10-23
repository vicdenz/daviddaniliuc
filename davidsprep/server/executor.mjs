import { spawn, spawnSync } from "node:child_process";
import {
  mkdtemp,
  writeFile,
  copyFile,
  rm,
  chmod,
  realpath,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { isDeepStrictEqual } from "node:util";
import { fileURLToPath } from "node:url";
const base = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const python =
  process.env.FASTPREP_PYTHON ||
  spawnSync("which", ["python3"], { encoding: "utf8" }).stdout.trim();
const compiler =
  process.env.FASTPREP_CXX ||
  (process.platform === "darwin"
    ? spawnSync("/usr/bin/xcrun", ["--find", "clang++"], {
        encoding: "utf8",
      }).stdout.trim()
    : spawnSync("which", ["g++"], { encoding: "utf8" }).stdout.trim());
const MB = 1024 * 1024;
export const sandboxBackend =
  process.env.FASTPREP_SANDBOX ||
  (process.platform === "darwin" ? "seatbelt" : "docker");
export function sandboxInfo() {
  if (sandboxBackend === "seatbelt")
    return {
      backend: "macOS Seatbelt",
      available:
        process.platform === "darwin" &&
        spawnSync("/usr/bin/sandbox-exec", [
          "-p",
          "(version 1)(allow default)",
          "/usr/bin/true",
        ]).status === 0,
    };
  const r = spawnSync("docker", ["image", "inspect", "fastprep-runner:local"], {
    timeout: 3000,
    stdio: "ignore",
  });
  return { backend: "Docker", available: r.status === 0 };
}
function seatbelt(dir, compiling) {
  const readRoots = [
    "/usr",
    "/System",
    "/Library",
    "/Applications/Xcode.app",
    "/opt/homebrew",
    path.dirname(path.dirname(python)),
    dir,
  ];
  const quoted = (v) => JSON.stringify(v);
  return `(version 1)(deny default)(allow process-exec)(allow signal (target self))(allow sysctl-read)(allow file-read-metadata)(allow file-read* ${readRoots.map((p) => `(subpath ${quoted(p)})`).join(" ")} (literal "/") (literal "/dev") (literal "/dev/null") (literal "/dev/urandom") (literal "/dev/random"))(allow file-write* (subpath ${quoted(dir)}) (literal "/dev/null"))${compiling ? "(allow process-fork)" : ""}`;
}
async function restricted(
  command,
  args,
  dir,
  input,
  timeout = 8,
  compiling = false,
) {
  let executable, argv;
  if (sandboxBackend === "seatbelt") {
    executable = python;
    argv = [
      path.join(base, "runner/limit_exec.py"),
      String(Math.ceil(timeout)),
      String(512 * MB),
      "/usr/bin/sandbox-exec",
      "-p",
      seatbelt(dir, compiling),
      command,
      ...args,
    ];
  } else {
    const name =
      "fastprep-" +
      path.basename(dir) +
      "-" +
      Math.random().toString(36).slice(2);
    executable = "docker";
    argv = [
      "run",
      "--name",
      name,
      "--rm",
      "-i",
      "--network=none",
      "--read-only",
      "--cap-drop=ALL",
      "--security-opt=no-new-privileges",
      "--pids-limit=32",
      "--memory=512m",
      "--cpus=1",
      "--ulimit",
      `cpu=${Math.ceil(timeout)}:${Math.ceil(timeout) + 1}`,
      "--ulimit",
      "fsize=33554432:33554432",
      "--tmpfs",
      "/tmp:rw,noexec,nosuid,size=32m",
      "-v",
      `${dir}:/work:rw`,
      "fastprep-runner:local",
      command === python
        ? "python3"
        : command === compiler
          ? "g++"
          : command.replace(dir, "/work"),
      ...args,
    ];
    // Docker cannot forward arbitrary fd 3. The worker writes its protocol into the job directory instead.
    const converted = input;
    input = converted;
  }
  return new Promise((resolve) => {
    const start = performance.now();
    let stdout = "",
      stderr = "",
      protocol = "",
      size = 0,
      reason = null,
      memoryKb = 0,
      finished = false;
    const child = spawn(executable, argv, {
      cwd: dir,
      detached: process.platform !== "win32",
      env: {
        PATH: "/usr/bin:/bin:/opt/homebrew/bin",
        HOME: dir,
        TMPDIR: dir,
        PYTHONDONTWRITEBYTECODE: "1",
        PYTEST_DISABLE_PLUGIN_AUTOLOAD: "1",
        PYTHONIOENCODING: "utf-8",
      },
      stdio: ["pipe", "pipe", "pipe", "pipe"],
    });
    function kill(why) {
      if (reason) return;
      reason = why;
      try {
        process.kill(-child.pid, "SIGKILL");
      } catch {}
      if (sandboxBackend === "docker") {
        const i = argv.indexOf("--name");
        spawn("docker", ["rm", "-f", argv[i + 1]], { stdio: "ignore" });
      }
    }
    const timer = setTimeout(() => kill("Time limit exceeded"), timeout * 1000);
    const monitor =
      process.platform === "darwin"
        ? setInterval(() => {
            const ps = spawnSync("/bin/ps", ["-axo", "pgid=,rss="], {
              encoding: "utf8",
              timeout: 200,
            });
            const rss = (ps.stdout || "")
              .trim()
              .split("\n")
              .reduce((sum, line) => {
                const [group, rss] = line.trim().split(/\s+/).map(Number);
                return sum + (group === child.pid ? rss : 0);
              }, 0);
            memoryKb = Math.max(memoryKb, rss);
            if (rss > 512 * 1024) kill("Memory limit exceeded");
          }, 100)
        : null;
    function receive(which, data) {
      size += data.length;
      if (size > 32 * MB) {
        kill("Output limit exceeded");
        return;
      }
      if (which === "stdout") stdout += data;
      else if (which === "stderr") stderr += data;
      else protocol += data;
    }
    child.stdout.on("data", (d) => receive("stdout", d));
    child.stderr.on("data", (d) => receive("stderr", d));
    child.stdio[3].on("data", (d) => receive("protocol", d));
    child.stdin.on("error", () => {});
    child.stdin.end(input || "");
    function finish(code, error) {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      if (monitor) clearInterval(monitor);
      resolve({
        code,
        stdout,
        stderr,
        protocol,
        timeMs: performance.now() - start,
        memoryKb,
        error: reason || error,
      });
    }
    child.on("error", (e) => finish(-1, e.message));
    child.on("close", (code, signal) =>
      finish(code, signal ? `Process terminated (${signal})` : null),
    );
  });
}
function cppDriver(problem) {
  const args = problem.args.map((a, i) => `arg${i}`).join(", ");
  const variables = problem.args
    .map((a, i) => `auto arg${i} = args.at(${i}).get<${a.type}>();`)
    .join("\n");
  const judge = problem.judge;
  let dispatch = "",
    call = `${problem.entry}(${args})`;
  if (judge?.mode === "method") {
    const fallback =
      judge.legacyEntry && !judge.legacyEntry.includes(".")
        ? `${judge.legacyEntry}(std::forward<Args>(values)...)`
        : `T{}.${judge.method}(std::forward<Args>(values)...)`;
    dispatch = `template<class T, class... Args> auto davidsprep_invoke(Args&&... values) {
      if constexpr (requires(T instance) { instance.${judge.method}(std::forward<Args>(values)...); })
        return T{}.${judge.method}(std::forward<Args>(values)...);
      else return ${fallback};
    }`;
    call = `davidsprep_invoke<${judge.className}>(${args})`;
  } else if (judge?.mode === "load-balancer") {
    dispatch = `template<class T, class N, class Logs> auto davidsprep_invoke(N count, Logs& logs) {
      if constexpr (requires(T instance) { instance.handle_request(logs[0]); }) {
        T instance(count); vector<long long> results;
        for (auto& line : logs) { auto target = instance.handle_request(line); if (target.has_value()) results.push_back(*target); }
        return results;
      } else return solve(count, logs);
    }`;
    call = `davidsprep_invoke<${judge.className}>(${args})`;
  }
  return `
#include <iostream>
#include <chrono>
#include <sys/resource.h>
#include <unistd.h>
#include <fstream>
${dispatch}
int main(){try { json args; cin >> args; std::cout.rdbuf(std::cerr.rdbuf());
 ${variables}
 auto start=std::chrono::steady_clock::now(); auto result = ${call};
 auto elapsed=std::chrono::duration<double,std::milli>(std::chrono::steady_clock::now()-start).count();
 struct rusage usage; getrusage(RUSAGE_SELF,&usage);
 json payload={{"actual",result},{"timeMs",elapsed},{"memoryKb",usage.ru_maxrss/${process.platform === "darwin" && sandboxBackend === "seatbelt" ? "1024.0" : "1.0"}}};
 auto text=payload.dump();
 ${sandboxBackend === "docker" ? 'std::ofstream("protocol.json") << text;' : "size_t offset=0; while(offset<text.size()){auto n=write(3,text.data()+offset,text.size()-offset);if(n<=0)return 2;offset+=n;}"}
 } catch(const exception& e){cerr << e.what(); return 1;} }
`;
}
export async function execute(problem, code, language, cases, artifacts = []) {
  if (!sandboxInfo().available)
    throw new Error(
      "Execution sandbox unavailable. On Linux start Docker and build the runner image; on macOS enable sandbox-exec. Execution never falls back to unrestricted host processes.",
    );
  const dir = await realpath(await mkdtemp(path.join(tmpdir(), "fastprep-")));
  await chmod(dir, 0o777);
  const results = [];
  try {
    await copyFile(
      path.join(base, "runner/worker.py"),
      path.join(dir, "worker.py"),
    );
    await copyFile(
      path.join(base, "runner/interfaces.py"),
      path.join(dir, "interfaces.py"),
    );
    await writeFile(path.join(dir, "main.py"), code);
    if (sandboxBackend === "docker") {
      // Use file protocol for Python because container stdio has no fd 3.
      const { readFile } = await import("node:fs/promises");
      const worker = await readFile(path.join(dir, "worker.py"), "utf8");
      await writeFile(
        path.join(dir, "worker.py"),
        worker.replace(
          "with os.fdopen(3,'w') as out:",
          "with open('protocol.json','w') as out:",
        ),
      );
    }
    for (const artifact of artifacts) {
      const origin = problem.origins.find((p) =>
        artifact.path.startsWith(p + "/"),
      );
      if (!origin) continue;
      const rel = artifact.path.slice(origin.length + 1);
      if (["main.py", "worker.py", "interfaces.py"].includes(rel)) continue;
      const destination = path.resolve(dir, rel);
      if (!destination.startsWith(dir + path.sep)) continue;
      const { mkdir } = await import("node:fs/promises");
      await mkdir(path.dirname(destination), { recursive: true });
      await writeFile(destination, artifact.content);
    }
    if (language === "cpp") {
      await copyFile(
        path.join(base, "vendor/json.hpp"),
        path.join(dir, "json.hpp"),
      );
      await writeFile(
        path.join(dir, "main.cpp"),
        '#include "json.hpp"\n#include <iostream>\n#include <algorithm>\n#include <optional>\n#include <queue>\n#include <stack>\n#include <set>\n#include <unordered_set>\n#include <unordered_map>\n#include <numeric>\nusing nlohmann::json;\nusing namespace std;\n' +
          (problem.judge ? `class ${problem.judge.className};\n` : "") +
          code +
          cppDriver(problem),
      );
      const compiled = await restricted(
        compiler,
        [
          "-std=c++20",
          "-O2",
          ...(process.platform === "darwin" && sandboxBackend === "seatbelt"
            ? [
                "-isysroot",
                spawnSync("/usr/bin/xcrun", ["--show-sdk-path"], {
                  encoding: "utf8",
                }).stdout.trim(),
              ]
            : []),
          "-I.",
          "main.cpp",
          "-o",
          "program",
        ],
        dir,
        "",
        40,
        true,
      );
      if (compiled.code !== 0 || compiled.error)
        return cases.map((c) => ({
          id: c.id,
          name: c.name,
          status: "compilation_error",
          actual: null,
          error: compiled.error || compiled.stderr || compiled.stdout,
          timeMs: compiled.timeMs,
          memoryKb: compiled.memoryKb,
        }));
    }
    for (const c of cases) {
      if (language === "cpp" && c.kind !== "function") {
        results.push({
          id: c.id,
          name: c.name,
          status: "unsupported",
          actual: null,
          error:
            "This preserved Python test uses pytest/unittest or object-specific assertions. It remains part of the full suite; run it in Python. Portable JSON tests are available for C++.",
          timeMs: 0,
          memoryKb: null,
        });
        continue;
      }
      const request = {
        ...c,
        entry: c.entry || problem.entry,
        judge: problem.judge,
      };
      const run =
        language === "cpp"
          ? await restricted(
              path.join(dir, "program"),
              [],
              dir,
              JSON.stringify(c.input),
              c.timeout || 8,
            )
          : await restricted(
              python,
              ["worker.py"],
              dir,
              JSON.stringify(request),
              c.timeout || 8,
            );
      if (sandboxBackend === "docker") {
        const { readFile, unlink } = await import("node:fs/promises");
        try {
          run.protocol = await readFile(
            path.join(dir, "protocol.json"),
            "utf8",
          );
          await unlink(path.join(dir, "protocol.json"));
        } catch {}
      }
      let data;
      try {
        data = JSON.parse(run.protocol);
        if (language === "cpp") data.stdout = run.stdout + run.stderr;
      } catch {
        data = {
          actual: null,
          error: run.stderr || run.stdout || "No valid result was returned.",
        };
      }
      const error =
        run.error ||
        data.error ||
        (run.code !== 0 ? run.stderr || `Process exited ${run.code}` : null);
      let equal = isDeepStrictEqual(data.actual, c.expected);
      let growthError = null;
      if (c.growthInput && !error) {
        const smaller = { ...request, input: c.growthInput };
        const sample =
          language === "python"
            ? await restricted(
                python,
                ["worker.py"],
                dir,
                JSON.stringify(smaller),
                c.timeout || 8,
              )
            : await restricted(
                path.join(dir, "program"),
                [],
                dir,
                JSON.stringify(c.growthInput),
                c.timeout || 8,
              );
        try {
          if (sandboxBackend === "docker") {
            const { readFile, unlink } = await import("node:fs/promises");
            sample.protocol = await readFile(
              path.join(dir, "protocol.json"),
              "utf8",
            );
            await unlink(path.join(dir, "protocol.json"));
          }
          const small = JSON.parse(sample.protocol);
          if (
            sample.error ||
            small.error ||
            !isDeepStrictEqual(small.actual, c.growthExpected)
          )
            growthError =
              sample.error ||
              small.error ||
              "Smaller growth workload returned an incorrect result.";
          if (
            data.timeMs >
            Math.max(c.growthFloorMs, small.timeMs) * c.growthFactor
          )
            growthError = `Runtime grew from ${small.timeMs.toFixed(2)}ms to ${data.timeMs.toFixed(2)}ms; allowed factor ${c.growthFactor}.`;
        } catch {
          growthError =
            sample.error ||
            sample.stderr ||
            "Could not measure the smaller growth workload.";
        }
      }
      if (growthError) equal = false;
      results.push({
        ...data,
        id: c.id,
        name: c.name,
        status: error
          ? run.error?.includes("Time")
            ? "timeout"
            : run.error?.includes("Memory")
              ? "memory_limit"
              : "runtime_error"
          : equal
            ? "passed"
            : "failed",
        error: error || growthError,
        timeMs: data.timeMs ?? run.timeMs,
        memoryKb: data.memoryKb ?? run.memoryKb,
      });
    }
    return results;
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

// Source adaptation is parsing only, and still runs inside the execution sandbox.
export async function prepareCode(problem, source, language) {
  if (language !== "python" || !problem.judge) return source;
  const [result] = await execute(problem, "", "python", [
    {
      id: "prepare",
      name: "Prepare editor code",
      kind: "prepare",
      source,
      expected: null,
      timeout: 3,
    },
  ]);
  if (result.error) throw new Error(result.error);
  return result.actual;
}

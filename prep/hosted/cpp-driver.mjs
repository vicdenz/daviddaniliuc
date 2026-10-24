const sandboxBackend = "vercel";
export function cppDriver(problem) {
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
    dispatch = `template<class T, class... Args> auto prep_invoke(Args&&... values) {
      if constexpr (requires(T instance) { instance.${judge.method}(std::forward<Args>(values)...); })
        return T{}.${judge.method}(std::forward<Args>(values)...);
      else return ${fallback};
    }`;
    call = `prep_invoke<${judge.className}>(${args})`;
  } else if (judge?.mode === "load-balancer") {
    dispatch = `template<class T, class N, class Logs> auto prep_invoke(N count, Logs& logs) {
      if constexpr (requires(T instance) { instance.handle_request(logs[0]); }) {
        T instance(count); vector<long long> results;
        for (auto& line : logs) { auto target = instance.handle_request(line); if (target.has_value()) results.push_back(*target); }
        return results;
      } else return solve(count, logs);
    }`;
    call = `prep_invoke<${judge.className}>(${args})`;
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

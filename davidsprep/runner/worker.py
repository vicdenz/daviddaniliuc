"""Runs inside the OS sandbox. The parent owns verdicts and expected outputs."""
import ast, copy, contextlib, importlib.util, io, json, os, resource, sys, time, traceback
from pathlib import Path
from interfaces import adapt_source, install_bridges, resolve
import typing

# Small capped log stream: user prints cannot consume unlimited memory.
class Log(io.TextIOBase):
 def __init__(self):self.parts=[];self.count=0
 def write(self,s):
  if self.count<65536:self.parts.append(s[:65536-self.count]);self.count+=len(s)
  return len(s)
 def getvalue(self):return ''.join(self.parts)

spec=importlib.util.spec_from_file_location('main',Path('main.py').resolve())
module=importlib.util.module_from_spec(spec);sys.modules['main']=module
module.__dict__.update({name:getattr(typing,name) for name in typing.__all__})
log=Log()
request=json.loads(sys.stdin.read())
start=time.perf_counter()
try:
 with contextlib.redirect_stdout(log),contextlib.redirect_stderr(log):
  if request['kind']!='prepare':
   spec.loader.exec_module(module)
   install_bridges(module,request.get('judge'))
  if request['kind']=='prepare':
   actual=adapt_source(request['source'],request.get('judge'))
  elif request['kind']=='function':
   entry=request['entry']
   func=resolve(module,entry,request.get('judge'))
   original=copy.deepcopy(request['input']) if request.get('preserveInput') else None
   actual=func(*request['input'])
   if original is not None and any(request['input'][i] != original[i] for i in request['preserveInput']):raise AssertionError('Failure counts were mutated; the original test requires reusable failure counts.')
  else:
   import pytest
   import random
   random.seed(24317)
   reports=[]
   class Reporter:
    def pytest_runtest_logreport(self,report):
     if report.when=='call' or report.failed:
      reports.append({'phase':report.when,'outcome':report.outcome,'error':str(report.longrepr) if report.failed else None})
   if request.get('editedSource'):
    tree=ast.parse(Path(request['filename']).read_text())
    replacement=ast.parse(request['input']).body[0]
    selector=request['selector'].split('::')
    nodes=tree.body if len(selector)==1 else next(n for n in tree.body if isinstance(n,ast.ClassDef) and n.name==selector[0]).body
    index=next(i for i,n in enumerate(nodes) if isinstance(n,ast.FunctionDef) and n.name==selector[-1])
    replacement.name=selector[-1]
    nodes[index]=replacement
    Path('edited_test.py').write_text(ast.unparse(ast.fix_missing_locations(tree)))
    request['filename']='edited_test.py'
   code=pytest.main(['-q','-p','no:cacheprovider','--disable-warnings','--tb=long',request['filename']+'::'+request['selector']],plugins=[Reporter()])
   if code!=0:raise AssertionError('\n'.join(r['error'] for r in reports if r['error']) or f'Original test runner exited {code}: '+log.getvalue())
   actual=request['expected']
 result={'actual':actual,'error':None}
except BaseException:
 result={'actual':None,'error':traceback.format_exc()}
result.update(timeMs=round((time.perf_counter()-start)*1000,3),memoryKb=resource.getrusage(resource.RUSAGE_SELF).ru_maxrss/(1024 if sys.platform=='darwin' else 1),stdout=log.getvalue())
# A separate inherited descriptor avoids user stdout corrupting the result protocol.
with os.fdopen(3,'w') as out:json.dump(result,out,ensure_ascii=False)

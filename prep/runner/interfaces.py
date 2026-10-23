"""Class-interface adapters. Parsing never executes supplied source code."""
import ast
import re
import textwrap


def main_guard(node):
    if not isinstance(node, ast.If) or node.orelse or not isinstance(node.test, ast.Compare):
        return False
    test = node.test
    return (len(test.ops) == 1 and isinstance(test.ops[0], ast.Eq)
            and {ast.unparse(test.left), ast.unparse(test.comparators[0])}
            == {'__name__', "'__main__'"})


def adapt_source(source, judge):
    """Wrap the entry function without reformatting its body or dropping helpers.

    Invalid/incomplete drafts remain untouched. Original work is archived by the
    migration before this function's output is persisted.
    """
    try:
        tree = ast.parse(source)
    except SyntaxError:
        return source
    if not judge:
        return source
    lines = source.splitlines(keepends=True)
    edits = []
    for node in tree.body:
        if main_guard(node):
            edits.append((node.lineno - 1, node.end_lineno, ''))
    name, method = judge['className'], judge.get('method')
    classes = {n.name: n for n in tree.body if isinstance(n, ast.ClassDef)}
    legacy = judge.get('legacyEntry')
    if judge['mode'] == 'load-balancer':
        # The runner owns the query loop; users implement only the design class.
        for node in tree.body:
            if isinstance(node, ast.FunctionDef) and node.name == legacy:
                edits.append((node.lineno - 1, node.end_lineno, ''))
    elif judge['mode'] == 'design':
        old = judge.get('legacyClass')
        if old and old in classes and name not in classes:
            node = classes[old]
            start = node.lineno - 1
            edits.append((start, start + 1, re.sub(r'\bclass\s+' + re.escape(old) + r'\b', 'class ' + name, lines[start], count=1)))
    elif name not in classes and legacy and '.' not in legacy:
        entry = next((n for n in tree.body if isinstance(n, ast.FunctionDef) and n.name == legacy), None)
        # Decorators and async functions can have different binding semantics.
        if entry and not entry.decorator_list:
            start, end = entry.lineno - 1, entry.end_lineno
            block = ''.join(lines[start:end])
            block = re.sub(r'^(def\s+)' + re.escape(legacy) + r'\s*\(', r'\g<1>' + method + '(self' + (', ' if entry.args.args or entry.args.posonlyargs or entry.args.vararg or entry.args.kwonlyargs or entry.args.kwarg else ''), block, count=1)
            edits.append((start, end, 'class ' + name + ':\n' + textwrap.indent(block.rstrip() + '\n', '    ')))
    for start, end, replacement in sorted(edits, reverse=True):
        lines[start:end] = [replacement]
    result = ''.join(lines).rstrip() + '\n'
    try:
        ast.parse(result)
    except SyntaxError:
        return source
    return result


def install_bridges(module, judge):
    """Let original pytest imports exercise the new class implementations."""
    if not judge:
        return
    name = judge['className']
    if judge['mode'] == 'design':
        old = judge.get('legacyClass')
        if old:
            if hasattr(module, name):
                setattr(module, old, getattr(module, name))
            elif hasattr(module, old):
                setattr(module, name, getattr(module, old))
    elif judge['mode'] == 'load-balancer':
        if hasattr(module, name):
            def solve(num_targets, logs):
                balancer = getattr(module, name)(num_targets)
                result = []
                for line in logs:
                    target = balancer.handle_request(line)
                    if target is not None:
                        result.append(target)
                return result
            setattr(module, judge['legacyEntry'], solve)
    else:
        legacy, method = judge.get('legacyEntry'), judge['method']
        if legacy and '.' not in legacy and hasattr(module, name):
            def invoke(*args, **kwargs):
                return getattr(getattr(module, name)(), method)(*args, **kwargs)
            setattr(module, legacy, invoke)


def resolve(module, entry, judge):
    if judge and judge['mode'] == 'method':
        canonical = judge['className'] + '.' + judge['method']
        if entry in (judge.get('legacyEntry'), canonical) and hasattr(module, judge['className']):
            return getattr(getattr(module, judge['className'])(), judge['method'])
    if '.' in entry:
        cls, method = entry.split('.', 1)
        return getattr(getattr(module, cls)(), method)
    return getattr(module, entry)

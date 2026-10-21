"""Runs one learner program and its tests, the same way the browser worker does.

Usage: python -I tools/run_tests.py < job.json
job.json: { "code": "...", "tests": [ { "output": ... } | { "contains": ... } | { "call", "returns", "setup"? } ], "input": "line one\\nline two" }
Prints JSON: { "error": null | "text", "results": [ { "pass": bool, "message": "..." } ] }
"""
import ast
import builtins
import contextlib
import io
import json
import os
import shutil
import sys
import tempfile


def tidy(text):
    return "\n".join(line.rstrip() for line in text.split("\n")).strip()


def main():
    job = json.load(sys.stdin)
    lines = (job.get("input") or "").replace("\r\n", "\n").split("\n")
    if lines and lines[-1] == "":
        lines.pop()
    pending = lines if job.get("input") else []

    def fake_input(prompt=""):
        print(prompt, end="")
        if not pending:
            raise EOFError("input() needs another line.")
        line = pending.pop(0)
        print(line)
        return line

    builtins.input = fake_input
    folder = tempfile.mkdtemp()
    os.chdir(folder)
    buffer = io.StringIO()
    scope = {"__name__": "__main__"}
    error = None
    results = []
    try:
        with contextlib.redirect_stdout(buffer):
            try:
                exec(compile(job["code"], "<exec>", "exec"), scope)
            except BaseException as exc:  # a learner's program can fail in any way
                error = f"{type(exc).__name__}: {exc}"
        printed = buffer.getvalue()
        if error is None:
            for test in job.get("tests", []):
                if "output" in test:
                    ok = tidy(printed) == tidy(test["output"])
                    results.append({"pass": ok, "message": "output " + ("matches" if ok else f"differs: {printed!r}")})
                elif "contains" in test:
                    ok = test["contains"] in printed
                    results.append({"pass": ok, "message": f"contains {test['contains']!r}: {ok}"})
                else:
                    try:
                        if test.get("setup"):
                            exec(test["setup"], scope)
                        got = eval(test["call"], scope)
                        want = ast.literal_eval(test["returns"])
                        ok = got == want
                        results.append({"pass": ok, "message": f"{test['call']} -> {got!r} (want {want!r})"})
                    except Exception as exc:
                        results.append({"pass": False, "message": f"{test['call']} raised {type(exc).__name__}: {exc}"})
    finally:
        os.chdir("/")
        shutil.rmtree(folder, ignore_errors=True)
    print(json.dumps({"error": error, "results": results}))


main()

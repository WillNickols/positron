# noqa: INP001
#
# Copyright (C) 2025 Posit Software, PBC. All rights reserved.
# Licensed under the Elastic License 2.0. See LICENSE.txt for license information.
#

import nox


@nox.session(python=False)
def test(session):
    session.run(
        "python",
        "-m",
        "pytest",
        "positron/tests/",
        *session.posargs,
    )


@nox.session(python=False)
def lint(session):
    session.run("ruff", "check", ".")
    session.run("ruff", "format", "--check", ".")
    session.run("pyright", ".")


@nox.session(python=False)
def lint_fix(session):
    session.run("ruff", "check", "--fix", ".")
    session.run("ruff", "format", ".")


@nox.session()
@nox.parametrize("pandas", ["1.5.3"])
@nox.parametrize("numpy", ["1.24.4"])
@nox.parametrize("torch", ["1.12.1"])
@nox.parametrize("lightning", ["2.1.4"])
def test_minimum_reqs(session, pandas, numpy, torch, lightning):
    session.install("-r", "python_files/posit/pinned-test-requirements.txt")

    # Install lightning first, since it may override numpy/torch.
    session.install("--force-reinstall", f"lightning=={lightning}")

    session.install("--force-reinstall", f"pandas=={pandas}")
    session.install("--force-reinstall", f"numpy=={numpy}")
    session.install("--force-reinstall", f"torch=={torch}")

    test_args = session.posargs if session.posargs else []
    session.run("pytest", *test_args)

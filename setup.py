from pathlib import Path
from setuptools import setup, find_packages


# ---------------------------------------------------------------------------
# Read install_requires straight from requirements.txt
# ---------------------------------------------------------------------------
def parse_requirements(filename: str = "requirements.txt") -> list[str]:
    req_file = Path(__file__).parent / filename
    lines = req_file.read_text().splitlines()
    return [
        line.strip()
        for line in lines
        if line.strip() and not line.startswith("#")
    ]


# ---------------------------------------------------------------------------
# Layout note
# ---------------------------------------------------------------------------
# setup.py and main.py live at the project root (flat layout):
#
#   qscan_project/
#   ├── setup.py
#   ├── main.py          ← declared via py_modules, not find_packages()
#   ├── requirements.txt
#   ├── scanner/
#   │   ├── __init__.py
#   │   └── ...
#   ├── utils/
#   │   ├── __init__.py
#   │   └── ...
#   └── ...
#
# find_packages() picks up every sub-directory that has an __init__.py.
# Root-level .py files (main.py) are NOT found by find_packages(); they must
# be listed explicitly in py_modules.
# ---------------------------------------------------------------------------

setup(
    name="qscan",
    version="1.0.0",
    description="QScan Quantum Readiness Assessment Platform",
    python_requires=">=3.11",

    # Sub-packages (directories with __init__.py) discovered automatically.
    packages=find_packages(),

    # Root-level modules that are not inside any package directory.
    py_modules=["main"],

    include_package_data=True,
    install_requires=parse_requirements(),

    # Entry point: "qscan" command → main.py → main()
    # Because main.py is a top-level module (not inside qscan/main.py), the
    # reference is simply "main:main", not "qscan.main:main".
    entry_points={
        "console_scripts": [
            "qscan=main:main",
        ],
    },
)

#!/usr/bin/env python3
"""Fail-closed checks for ZEVON's GitHub Pages branch-based production boundary."""

from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[2]
EXPECTED_DOMAIN = "zevonmobility.com"
REQUIRED_ROOT_FILES = ("index.html", "404.html", "robots.txt", "sitemap.xml", "CNAME")
FORBIDDEN_PAGES_DEPLOY_PATTERNS = (
    re.compile(r"actions/deploy-pages@", re.IGNORECASE),
    re.compile(r"peaceiris/actions-gh-pages@", re.IGNORECASE),
    re.compile(r"^\\s*pages\\s*:\\s*write\\s*$", re.MULTILINE),
)


def main() -> int:
    missing = [name for name in REQUIRED_ROOT_FILES if not (ROOT / name).is_file()]
    if missing:
        print("Missing required production website root files: " + ", ".join(missing), file=sys.stderr)
        return 1

    domain = (ROOT / "CNAME").read_text(encoding="utf-8").strip()
    if domain != EXPECTED_DOMAIN:
        print(f"CNAME must remain {EXPECTED_DOMAIN!r}; found {domain!r}", file=sys.stderr)
        return 1

    workflow_dir = ROOT / ".github" / "workflows"
    violations = []
    if workflow_dir.exists():
        for workflow in sorted(workflow_dir.glob("*.yml")) + sorted(workflow_dir.glob("*.yaml")):
            content = workflow.read_text(encoding="utf-8")
            if any(pattern.search(content) for pattern in FORBIDDEN_PAGES_DEPLOY_PATTERNS):
                violations.append(str(workflow.relative_to(ROOT)))

    if violations:
        print(
            "Unexpected GitHub Pages Actions deployment workflow(s) detected: "
            + ", ".join(violations)
            + ". Production Pages publishing is intentionally isolated to the main branch root setting.",
            file=sys.stderr,
        )
        return 1

    print("Production website boundary OK: root site files and CNAME are present; no Pages Actions deployment path detected.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

import re
import pathlib

replacements = [
    (
        r"return NextResponse\.json\(\s*\{\s*error:\s*'([^']+)',\s*details:\s*error instanceof Error \? error\.message : 'Unknown error'\s*\},\s*\{\s*status:\s*(\d+)\s*\}\s*\);",
        r"return apiErrorResponse({ message: '\1', status: \2, cause: error });",
    ),
    (
        r"return NextResponse\.json\(\s*\{\s*success:\s*false,\s*error:\s*'([^']+)',\s*details:\s*error instanceof Error \? error\.message : 'Unknown error'\s*\},\s*\{\s*status:\s*(\d+)\s*\}\s*\);",
        r"return apiErrorResponse({ message: '\1', status: \2, cause: error });",
    ),
    (
        r"return NextResponse\.json\(\s*\{\s*error:\s*error instanceof Error \? error\.message : '([^']+)'\s*\},\s*\{\s*status:\s*(\d+)\s*\}\s*\);",
        r"return apiErrorResponse({ message: '\1', status: \2, cause: error });",
    ),
    (
        r"return NextResponse\.json\(\s*\{\s*error:\s*'([^']+)',\s*details:\s*error instanceof Error \? error\.message : 'Unknown error'\s*\},\s*\{\s*status:\s*(\d+)\s*\}\s*\)",
        r"return apiErrorResponse({ message: '\1', status: \2, cause: error })",
    ),
]

for path in pathlib.Path("src/app/api").rglob("route.ts"):
    text = path.read_text(encoding="utf-8")
    orig = text
    if "apiErrorResponse" not in text and (
        "details:" in text or "error instanceof Error ? error.message" in text
    ):
        if "from '@/lib/safe-errors'" not in text:
            lines = text.split("\n")
            for i, line in enumerate(lines):
                if line.startswith("import ") and (
                    i + 1 >= len(lines) or not lines[i + 1].startswith("import ")
                ):
                    lines.insert(i + 1, "import { apiErrorResponse } from '@/lib/safe-errors';")
                    break
            text = "\n".join(lines)
    for pat, rep in replacements:
        text = re.sub(pat, rep, text, flags=re.MULTILINE)
    if text != orig:
        path.write_text(text, encoding="utf-8")
        print("updated", path)

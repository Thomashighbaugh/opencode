---
name: document-processor
description: Convert documents (PDF, EPUB, HTML, DOCX, MD) to clean Markdown using pandoc and pdftotext for ingestion into project context
level: 1
---

# Document Processor

Convert a wide range of document formats into clean Markdown for project context ingestion. Supports PDF, EPUB, HTML, DOCX, ODT, RTF, Markdown, and plain text.

## When to Use

- You have a PDF, EPUB, HTML file, or DOCX and need its text as Markdown
- You want to ingest an external document into `.opencode/context/research/`
- You need to extract text from a non-Markdown document for analysis
- You have a web article saved as HTML that should be readable Markdown

## Available Tools

- **`pandoc`** — Universal document converter (handles PDF, EPUB, HTML, DOCX, MD, and 30+ formats)
- **`pdftotext`** — PDF text extraction fallback (faster, less formatting)
- **`webfetch`** — Fetch URLs to get HTML for conversion
- **`Read`** — Read files from the filesystem
- **`Write`** — Save converted output

## Workflow

### Step 1: Input Source

Determine the source type and read it:

**Local file:**
```bash
pandoc /path/to/file.{pdf,epub,html,docx} -t markdown --wrap=none -o /tmp/opencode/converted.md
```

**URL (fetch first, then convert):**
```bash
# Fetch the URL content
webfetch the url
# Save as HTML, then convert
pandoc /tmp/opencode/page.html -t markdown --wrap=none -o /tmp/opencode/converted.md
```

**Directory of documents:**
```bash
for f in /path/to/dir/*.{pdf,epub,html,docx}; do
  [ -f "$f" ] && pandoc "$f" -t markdown --wrap=none -o "/tmp/opencode/$(basename "$f").md"
done
```

### Step 2: Format Conversion Table

| Input Format | Command |
|-------------|---------|
| **PDF** | `pandoc input.pdf -t markdown --wrap=none -o output.md` |
| **PDF (fallback)** | `pdftotext -layout input.pdf output.md` |
| **EPUB** | `pandoc input.epub -t markdown --wrap=none -o output.md` |
| **HTML** | `pandoc input.html -t markdown --wrap=none -o output.md` |
| **DOCX** | `pandoc input.docx -t markdown --wrap=none -o output.md` |
| **ODT** | `pandoc input.odt -t markdown --wrap=none -o output.md` |
| **RTF** | `pandoc input.rtf -t markdown --wrap=none -o output.md` |
| **Plain Text** | `cp input.txt output.md` |

### Step 3: Verify & Clean

After conversion, verify the output:
```bash
wc -l /tmp/opencode/converted.md
head -50 /tmp/opencode/converted.md
```

If the output has garbled text or bad formatting, try alternatives:
- For PDFs: `pdftotext -layout input.pdf output.md` (better for column layouts)
- For HTML: Strip navigation boilerplate before conversion
- For scanned PDFs: OCR is not supported — user will need OCR software first

### Step 4: Save as Context

Save the converted Markdown to the project context directory:
```bash
cp /tmp/opencode/converted.md .opencode/context/research/{descriptive-name}.md
```

Or output the content directly for review before saving.

## Usage Examples

```
# Convert a PDF to Markdown
pandoc ./docs/api-manual.pdf -t markdown --wrap=none -o .opencode/context/research/api-manual.md

# Convert an EPUB to Markdown
pandoc ./ebook.epub -t markdown --wrap=none -o /tmp/opencode/ebook.md
Read /tmp/opencode/ebook.md
Write .opencode/context/research/ebook-summary.md (after summarizing)

# Convert a URL to context
webfetch https://example.com/docs
Save the content as .opencode/context/research/example-docs.md

# Bulk convert all PDFs in a directory
for f in ./references/*.pdf; do
  pandoc "$f" -t markdown --wrap=none -o "/tmp/opencode/$(basename "$f" .pdf).md"
done
```

## Limitations

- Scanned/image-based PDFs cannot be converted (no OCR) — use `pdftotext` which may return empty
- Very large documents (>500 pages) may need chunking
- Complex tables and math equations may not convert cleanly
- HTML from JavaScript-rendered sites should be fetched with `webfetch` first

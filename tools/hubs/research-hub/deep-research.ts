import { HubSubcommandSpec } from "../../hub-data"

import { TOOLS_BASH } from "../shared-spec-fragments"
const spec: HubSubcommandSpec = {
  label: "deep-research",
  description: "Two-phase deep research — outline + parallel item research with structured report",
  reminder: "Generate outline → deep-research items in parallel → compile structured report.",
  inline: true,

  detailedDescription: `Deep research workflow inspired by Weizhena/Deep-Research-skills (OpenCode variant). Two-phase approach with human-in-the-loop control:

Phase 1 - Outline Generation (/research equivalent):
1. Analyze topic and generate initial research items + field framework using model knowledge
2. Web search supplement via web-search-agent to find missing items/fields
3. Ask if user has existing field definitions to merge
4. Generate outline.yaml and fields.yaml in ./{topic_slug}/ directory
5. User confirms or iterates (add items/fields)

Phase 2 - Deep Research (/research-deep equivalent):
1. Locate outline.yaml and read items + execution config (batch_size, items_per_agent)
2. Check for completed results to support resume
3. For each item, dispatch web-search-agent (can run in parallel batches) with strict prompt enforcing JSON output per fields.yaml schema
4. Each agent validates output with validation script (validate_json.py)
5. Track progress, handle retries

Phase 3 - Report Generation (/research-report equivalent):
1. Collect all JSON results from output_dir
2. Compile into comprehensive markdown report with TOC, tables, sources
3. Save as report.md in topic directory

Key features:
- Structured JSON output per item following custom field schema
- Parallel agent execution with batch control
- Resume capability (skip completed items)
- Uncertain field tracking with [uncertain] markers
- Validation ensures complete field coverage
- Uses web-search-agent with module-based search strategies (GitHub issues, academic papers, Chinese tech, StackOverflow, general web)
- All sources cited in final report

Use for academic research, benchmark comparisons, technology evaluations, market analysis, due diligence. For quick single-fact lookups, use websearch/webfetch directly.`,

  tools: TOOLS_BASH,
  relatedSkills: ["deep-research", "wiki"],
  rules: ["efficiency-first"],
}

export default spec

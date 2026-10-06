/**
 * Skill Initializer — creates a new skill from template.
 *
 * Replaces init_skill.py. Run with pnpm's TypeScript runner:
 *   pnpx tsx init-skill.ts <skill-name> --path <path>
 *
 * Examples:
 *   pnpx tsx init-skill.ts my-new-skill --path skills/public
 *   pnpx tsx init-skill.ts my-api-helper --path skills/private
 */
import { existsSync, mkdirSync, writeFileSync, chmodSync } from "node:fs";
import { resolve, join } from "node:path";

const titleCase = (name: string): string =>
  name.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

const skillTemplate = (skillName: string, skillTitle: string): string => `---
name: ${skillName}
description: [TODO: Complete and informative explanation of what the skill does and when to use it. Include WHEN to use this skill - specific scenarios, file types, or tasks that trigger it.]
---

# ${skillTitle}

## Overview

[TODO: 1-2 sentences explaining what this skill enables]

## Structuring This Skill

[TODO: Choose the structure that best fits this skill's purpose. Common patterns:

**1. Workflow-Based** (best for sequential processes)
- Works well when there are clear step-by-step procedures
- Example: a build skill with "Workflow Decision Tree" -> "Build" -> "Test" -> "Release"
- Structure: ## Overview -> ## Workflow Decision Tree -> ## Step 1 -> ## Step 2...

**2. Task-Based** (best for tool collections)
- Works well when the skill offers different operations/capabilities
- Example: a git skill with "Quick Start" -> "Commit" -> "Rebase" -> "PR"
- Structure: ## Overview -> ## Quick Start -> ## Task Category 1 -> ## Task Category 2...

**3. Reference/Guidelines** (best for standards or specifications)
- Works well for brand guidelines, coding standards, or requirements
- Example: Brand styling with "Brand Guidelines" -> "Colors" -> "Typography" -> "Features"
- Structure: ## Overview -> ## Guidelines -> ## Specifications -> ## Usage...

**4. Capabilities-Based** (best for integrated systems)
- Works well when the skill provides multiple interrelated features
- Example: Product Management with "Core Capabilities" -> numbered capability list
- Structure: ## Overview -> ## Core Capabilities -> ### 1. Feature -> ### 2. Feature...

Patterns can be mixed and matched as needed. Most skills combine patterns (e.g., start with task-based, add workflow for complex operations).

Delete this entire "Structuring This Skill" section when done - it's just guidance.]

## [TODO: Replace with the first main section based on chosen structure]

[TODO: Add content here. See examples in existing skills:
- Code samples for technical skills
- Decision trees for complex workflows
- Concrete examples with realistic user requests
- References to scripts/templates/references as needed]

## Resources

This skill includes example resource directories that demonstrate how to organize different types of bundled resources:

### scripts/
Executable code (shell/TypeScript/etc.) that can be run directly to perform specific operations.

**Examples from other skills:**
- icon-generator: \`scripts/generate-icons.sh\` - coordinates rsvg-convert + ImageMagick
- vectorize-context: \`scripts/vectorize.ts\` - runs via \`pnpx tsx\`

**Appropriate for:** shell scripts, TypeScript scripts, or any executable code that performs automation, data processing, or specific operations.

**Note:** Scripts may be executed without loading into context, but can still be read by the AI for patching or environment adjustments.

### references/
Documentation and reference material intended to be loaded into context to inform the AI's process and thinking.

**Examples from other skills:**
- Product management: \`communication.md\`, \`context_building.md\` - detailed workflow guides
- BigQuery: API reference documentation and query examples
- Finance: Schema documentation, company policies

**Appropriate for:** In-depth documentation, API references, database schemas, comprehensive guides, or any detailed information that the AI should reference while working.

### assets/
Files not intended to be loaded into context, but rather used within the output the AI produces.

**Examples from other skills:**
- Brand styling: PowerPoint template files (.pptx), logo files
- Frontend builder: HTML boilerplate project directories
- Typography: Font files (.ttf, .woff2)

**Appropriate for:** Templates, boilerplate code, document templates, images, icons, fonts, or any files meant to be copied or used in the final output.

---

**Any unneeded directories can be deleted.** Not every skill requires all three types of resources.
`;

const exampleScript = (skillName: string): string => `#!/usr/bin/env bash
# Example helper script for ${skillName}
#
# This is a placeholder that can be executed directly.
# Replace with actual implementation or delete if not needed.
set -euo pipefail

echo "This is an example script for ${skillName}"
# TODO: Add actual script logic here (data processing, file conversion, shelling out, etc.)
`;

const exampleReference = (skillTitle: string): string => `# Reference Documentation for ${skillTitle}

This is a placeholder for detailed reference documentation.
Replace with actual reference content or delete if not needed.

## When Reference Docs Are Useful

Reference docs are ideal for:
- Comprehensive API documentation
- Detailed workflow guides
- Complex multi-step processes
- Information too lengthy for main SKILL.md
- Content that's only needed for specific use cases

## Structure Suggestions

### API Reference Example
- Overview
- Authentication
- Endpoints with examples
- Error codes
- Rate limits

### Workflow Guide Example
- Prerequisites
- Step-by-step instructions
- Common patterns
- Troubleshooting
- Best practices
`;

const exampleAsset = `# Example Asset File

This placeholder represents where asset files would be stored.
Replace with actual asset files (templates, images, fonts, etc.) or delete if not needed.

Asset files are NOT intended to be loaded into context, but rather used within
the output the AI produces.

## Common Asset Types

- Templates: .pptx, .docx, boilerplate directories
- Images: .png, .jpg, .svg, .gif
- Fonts: .ttf, .otf, .woff, .woff2
- Boilerplate code: Project directories, starter files
- Icons: .ico, .svg
- Data files: .csv, .json, .xml, .yaml

Note: This is a text placeholder. Actual assets can be any file type.
`;

function initSkill(skillName: string, path: string): string | null {
  const skillDir = join(resolve(path), skillName);

  if (existsSync(skillDir)) {
    console.log(`❌ Error: Skill directory already exists: ${skillDir}`);
    return null;
  }

  try {
    mkdirSync(skillDir, { recursive: true });
    console.log(`✅ Created skill directory: ${skillDir}`);
  } catch (e) {
    console.log(`❌ Error creating directory: ${e}`);
    return null;
  }

  const skillTitle = titleCase(skillName);
  try {
    writeFileSync(join(skillDir, "SKILL.md"), skillTemplate(skillName, skillTitle));
    console.log("✅ Created SKILL.md");
  } catch (e) {
    console.log(`❌ Error creating SKILL.md: ${e}`);
    return null;
  }

  try {
    mkdirSync(join(skillDir, "scripts"));
    const script = join(skillDir, "scripts", "example.sh");
    writeFileSync(script, exampleScript(skillName));
    chmodSync(script, 0o755);
    console.log("✅ Created scripts/example.sh");

    mkdirSync(join(skillDir, "references"));
    writeFileSync(join(skillDir, "references", "api_reference.md"), exampleReference(skillTitle));
    console.log("✅ Created references/api_reference.md");

    mkdirSync(join(skillDir, "assets"));
    writeFileSync(join(skillDir, "assets", "example_asset.txt"), exampleAsset);
    console.log("✅ Created assets/example_asset.txt");
  } catch (e) {
    console.log(`❌ Error creating resource directories: ${e}`);
    return null;
  }

  console.log(`\n✅ Skill '${skillName}' initialized successfully at ${skillDir}`);
  console.log("\nNext steps:");
  console.log("1. Edit SKILL.md to complete the TODO items and update the description");
  console.log("2. Customize or delete the example files in scripts/, references/, and assets/");
  console.log("3. Run the validator when ready to check the skill structure");
  return skillDir;
}

function main(): void {
  const args = process.argv.slice(2);
  if (args.length < 3 || args[1] !== "--path") {
    console.log("Usage: pnpx tsx init-skill.ts <skill-name> --path <path>");
    console.log("\nSkill name requirements:");
    console.log("  - Hyphen-case identifier (e.g., 'data-analyzer')");
    console.log("  - Lowercase letters, digits, and hyphens only");
    console.log("  - Max 40 characters");
    console.log("  - Must match directory name exactly");
    process.exit(1);
  }

  const skillName = args[0];
  const path = args[2];

  console.log(`🚀 Initializing skill: ${skillName}`);
  console.log(`   Location: ${path}`);
  console.log();

  process.exit(initSkill(skillName, path) ? 0 : 1);
}

main();

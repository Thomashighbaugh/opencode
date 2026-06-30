# CoT Template: Skill Creator

When creating a skill, follow these steps in order:

1. **Check what exists** — Scan existing skills first. Is there already
   something similar? Can you extend an existing skill instead?

2. **Understand the workflow** — What exactly should this skill do?
   What are the inputs, outputs, and steps? Who uses it and when?

3. **Design the structure** — Single SKILL.md or with REFERENCE.md?
   What scripts are needed? Where do they go?

4. **Write frontmatter** — name (≤64 chars), description (≤200 chars
   with "use when" trigger phrase).

5. **Write the body** — Progressive disclosure: most important info
   first, detailed reference later. Include BAD/GOOD examples.

6. **Validate** — Frontmatter format, name length, description quality,
   file references, security scan.

7. **Test triggers** — Would a natural language prompt actually invoke
   this skill? If not, improve the description.

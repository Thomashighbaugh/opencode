import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "jtbd",
  description: "Jobs-to-be-done — frame requirements around customer functional jobs",
  reminder: "Frame requirements around customer jobs.",
  inline: true,

  detailedDescription: `Jobs-to-be-Done framework: frames requirements around what the customer is trying to accomplish (the "job"), not features. A job is the progress a person is trying to make in a particular circumstance.

Process:
1. Identify the functional job: what is the customer trying to get done? (e.g. "commute to work", not "drive a car").
2. Identify emotional/social jobs: how do they want to feel / be perceived?
3. Map the job steps: understand, look, decide, use, maintain.
4. Identify pains (obstacles) and gains (desired outcomes) at each step.
5. Derive requirements from the job steps, not from feature wishes.

Output: a JTBD map + requirements derived from jobs. Use when feature requests are vague and you need to understand the underlying need. Especially useful for product strategy.`,

  tools: ["bash"],
  relatedSkills: [],
}

export default spec
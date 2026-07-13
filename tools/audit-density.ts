export const description = "Measure code density (LOC/task)";
export const schema = {
  file: { type: "string", description: "File or directory to audit" }
};
export async function handler({ file }: { file: string }) {
  // Shell command: find file -name '*.ts' | xargs wc -l
  return `Density audit: $(find ${file} -name '*.ts' | xargs wc -l)`;
}

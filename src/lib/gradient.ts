const GRADIENTS: [string, string][] = [
  ["#E7EEF5", "#0F4C81"],
  ["#EDF1F5", "#4A6FA5"],
  ["#E3EAF0", "#22405F"],
  ["#EAF3F7", "#3D9BC2"],
  ["#E6EBF0", "#2E4A6B"],
  ["#EAF0EC", "#3E6B5C"],
];

function hashSeed(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash);
}

export function gradientForSeed(seed: string): { from: string; to: string; angle: number } {
  const hash = hashSeed(seed);
  const [from, to] = GRADIENTS[hash % GRADIENTS.length];
  const angle = 100 + (hash % 60);
  return { from, to, angle };
}

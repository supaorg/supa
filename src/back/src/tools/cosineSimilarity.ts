export function cosineSimilarity(v1: number[], v2: number[]): number {
  let dotProduct = 0.0;
  let magnitudeV1 = 0.0;
  let magnitudeV2 = 0.0;

  for (let i = 0; i < v1.length; i++) {
    dotProduct += v1[i] * v2[i];
    magnitudeV1 += Math.pow(v1[i], 2);
    magnitudeV2 += Math.pow(v2[i], 2);
  }

  magnitudeV1 = Math.sqrt(magnitudeV1);
  magnitudeV2 = Math.sqrt(magnitudeV2);

  return dotProduct / (magnitudeV1 * magnitudeV2);
}
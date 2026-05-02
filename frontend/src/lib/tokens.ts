import { encode } from 'gpt-tokenizer'

/**
 * Client-side token counter using gpt-tokenizer (cl100k/o200k compatible
 * for OpenAI families). For non-OpenAI models we fall back to the same
 * encoding which is a reasonable proxy and matches what the backend does
 * for unknown models. The accurate path is the backend `/api/tokens/count`
 * endpoint, which uses the real tiktoken encodings.
 */
export function countTokensLocal(text: string): number {
  if (!text) return 0
  try {
    return encode(text).length
  } catch {
    // Fallback to a chars/4 heuristic if tokenizer fails for any reason.
    return Math.ceil(text.length / 4)
  }
}

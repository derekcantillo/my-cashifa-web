import { clsx, type ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

/**
 * tailwind-merge only knows Tailwind's default scales: without this, a custom size like
 * `text-body` is mistaken for a color and drops `text-accent-ink` (and vice versa).
 * Keep in sync with the type/shadow/radius tokens in src/theme/tokens.css.
 */
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: ['display-xl', 'display-lg', 'display-md', 'title', 'body', 'body-sm', 'eyebrow'],
      shadow: ['raised', 'floating', 'pressed'],
      radius: ['card'],
    },
  },
})

/** Merges class names, resolving conflicting Tailwind utilities (last one wins). */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

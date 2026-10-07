import { z } from "zod";

import { CURRENCIES } from "../model/products";

const currencySchema = z.enum(CURRENCIES);

/** Réponse de `GET /v1/products`, limitée aux champs utilisés. */
export const productListResponseSchema = z.object({
  items: z
    .array(
      z.object({
        id: z.string(),
        name: z.string().min(1).max(200),
        price: z.object({
          amount: z.string().regex(/^\d+\.\d{2}$/),
          currency: currencySchema,
        }),
      }),
    )
    .max(100),
  nextCursor: z.string().nullable(),
});

export type ProductListResponse = z.infer<typeof productListResponseSchema>;

/**
 * Paramètres d'URL de la page : chaque champ invalide ou répété est retiré
 * sans invalider l'autre.
 */
export const productsSearchParamsSchema = z.object({
  currency: currencySchema.optional().catch(undefined),
  cursor: z
    .string()
    .min(1)
    .max(200)
    .regex(/^[A-Za-z0-9_-]+$/)
    .optional()
    .catch(undefined),
});

export type ProductsSearchParams = z.infer<typeof productsSearchParamsSchema>;

import { Maybe } from 'elytra-ts';
import { z } from 'zod';

export function nullableParse<T>(s: z.Schema<T>, v: unknown): Maybe<T> {
  const r = s.safeParse(v);
  return r.success ? r.data : null;
}

export const maybeSchema = <T extends z.ZodTypeAny>(schema: T) => schema.nullable();

export const resultSchema = <E extends z.ZodTypeAny, T extends z.ZodTypeAny>(
  errorSchema: E,
  valueSchema: T
) =>
  z.union([
    z.object({
      _t: z.literal('Err'),
      error: errorSchema
    }),
    z.object({
      _t: z.literal('Ok'),
      value: valueSchema
    })
  ]);

export const doneSchema = z.literal('Done');
export type Done = z.infer<typeof doneSchema>;

export const emptyObjectSchema = z.object({});
export type EmptyObject = z.infer<typeof emptyObjectSchema>;

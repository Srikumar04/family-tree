import { z } from 'zod';

export const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const LoginSchema = RegisterSchema;

export const CreateTreeSchema = z.object({
  name: z.string().min(1).max(100),
});

export const CreatePersonSchema = z.object({
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  birthDate: z.string().nullable().optional(),
  deathDate: z.string().nullable().optional(),
  gender: z.enum(['male', 'female', 'unknown']).default('unknown'),
  bio: z.string().max(2000).nullable().optional(),
  photoUrl: z.string().nullable().optional(),
});

export const UpdatePersonSchema = CreatePersonSchema.partial();

export const CreateRelationshipSchema = z.object({
  person1Id: z.number().int().positive(),
  person2Id: z.number().int().positive(),
  type: z.enum(['parent-child', 'spouse', 'sibling']),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type CreateTreeInput = z.infer<typeof CreateTreeSchema>;
export type CreatePersonInput = z.infer<typeof CreatePersonSchema>;
export type UpdatePersonInput = z.infer<typeof UpdatePersonSchema>;
export type CreateRelationshipInput = z.infer<typeof CreateRelationshipSchema>;

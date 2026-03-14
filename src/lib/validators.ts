import { z } from "zod"

export const registerSchema = z.object({
  email: z
    .string()
    .min(1, "L'email est requis")
    .email("Email invalide"),
  username: z
    .string()
    .min(3, "Le pseudo doit contenir au moins 3 caracteres")
    .max(20, "Le pseudo ne doit pas depasser 20 caracteres"),
  password: z
    .string()
    .min(6, "Le mot de passe doit contenir au moins 6 caracteres"),
})

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "L'email est requis")
    .email("Email invalide"),
  password: z
    .string()
    .min(1, "Le mot de passe est requis"),
})

export const createGroupSchema = z.object({
  name: z
    .string()
    .min(2, "Le nom doit contenir au moins 2 caracteres")
    .max(50, "Le nom ne doit pas depasser 50 caracteres"),
  description: z
    .string()
    .max(200, "La description ne doit pas depasser 200 caracteres")
    .optional(),
  emoji: z
    .string()
    .optional(),
})

export const createWordSchema = z.object({
  term: z
    .string()
    .min(1, "Le mot est requis")
    .max(100, "Le mot ne doit pas depasser 100 caracteres"),
  phonetic: z
    .string()
    .optional(),
  origin: z
    .string()
    .optional(),
  isNSFW: z
    .boolean(),
  content: z
    .string()
    .min(1, "La definition est requise")
    .max(1000, "La definition ne doit pas depasser 1000 caracteres"),
  example: z
    .string()
    .optional(),
  tagIds: z
    .array(z.string())
    .optional(),
})

export const createDefinitionSchema = z.object({
  content: z
    .string()
    .min(1, "La definition est requise")
    .max(1000, "La definition ne doit pas depasser 1000 caracteres"),
  example: z
    .string()
    .optional(),
})

export const createCommentSchema = z.object({
  content: z
    .string()
    .min(1, "Le commentaire est requis")
    .max(500, "Le commentaire ne doit pas depasser 500 caracteres"),
  parentId: z
    .string()
    .optional(),
})

export const updateProfileSchema = z.object({
  username: z
    .string()
    .min(3, "Le pseudo doit contenir au moins 3 caracteres")
    .max(20, "Le pseudo ne doit pas depasser 20 caracteres"),
  bio: z
    .string()
    .max(200, "La bio ne doit pas depasser 200 caracteres")
    .optional(),
  avatar: z
    .string()
    .optional(),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type CreateGroupInput = z.infer<typeof createGroupSchema>
export type CreateWordInput = z.infer<typeof createWordSchema>
export type CreateDefinitionInput = z.infer<typeof createDefinitionSchema>
export type CreateCommentInput = z.infer<typeof createCommentSchema>
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>

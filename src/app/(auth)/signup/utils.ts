import { z } from 'zod'

export const signupSchema = z
  .object({
    email: z.string().email().min(1, 'Email is required.'),
    password: z.string().min(8, 'Password is too short.').max(255, 'Password is too long.'),
    confirm_password: z.string().min(1, 'Please confirm your password'),
  })
  .superRefine((values, ctx) => {
    if (values.confirm_password !== values.password) {
      ctx.addIssue({
        code: 'custom',
        path: ['confirm_password'],
        message: 'Password does not match',
      })
    }

    return z.never
  })

export type SignupSchema = z.infer<typeof signupSchema>

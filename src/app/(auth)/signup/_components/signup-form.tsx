'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '~/components/ui/form'
import { cn } from '~/lib/utils'
import { Input } from '~/components/ui/input'
import { Button } from '~/components/ui/button'
import { signupSchema, SignupSchema } from '../utils'
import { useMutation } from '@tanstack/react-query'
import { handleError } from '~/lib/error'
import { toast } from 'sonner'
import { signup } from '../queries'
import { useRouter } from 'next/navigation'

type SignupFormProps = {
  className?: string
  style?: React.CSSProperties
}

export default function SignupForm({ className, style }: SignupFormProps) {
  const router = useRouter()

  const form = useForm<SignupSchema>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: '',
      password: '',
      confirm_password: '',
    },
  })

  const signupMutation = useMutation({
    mutationFn: signup,
    onError: handleError,
    onSuccess: () => {
      router.replace('/dashboard')
      toast.success('Signed up successfully.')
    },
  })

  function handleSignup(values: SignupSchema) {
    signupMutation.mutate(values)
  }

  return (
    <Form {...form}>
      <form
        className={cn('flex flex-col gap-6', className)}
        style={style}
        onSubmit={form.handleSubmit(handleSignup)}
      >
        <div className="flex flex-col items-center text-center">
          <h1 className="text-2xl font-bold">Signup</h1>
          <p className="text-muted-foreground text-balance">
            Get started with pulpit now by creating an account.
          </p>
        </div>

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="m@.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="Your secure password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirm_password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="Your secure password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full cursor-pointer" disabled={signupMutation.isPending}>
          Signup
        </Button>
      </form>
    </Form>
  )
}

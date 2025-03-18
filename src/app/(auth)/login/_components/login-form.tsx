'use client'

import { useForm } from 'react-hook-form'
import { loginSchema, LoginSchema } from '../utils'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '~/components/ui/form'
import { cn } from '~/lib/utils'
import { Input } from '~/components/ui/input'
import { Button } from '~/components/ui/button'
import { useMutation } from '@tanstack/react-query'
import { handleError } from '~/lib/error'
import { toast } from 'sonner'
import { login } from '../queries'
import { useRouter } from 'next/navigation'

type LoginFormProps = {
  className?: string
  style?: React.CSSProperties
}

export default function LoginForm({ className, style }: LoginFormProps) {
  const router = useRouter()

  const form = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const loginMutation = useMutation({
    mutationFn: login,
    onError: handleError,
    onSuccess: () => {
      router.replace('/dashboard')
      toast.success('Logged in successfully.')
    },
  })

  function handleLogin(values: LoginSchema) {
    loginMutation.mutate(values)
  }

  return (
    <Form {...form}>
      <form
        className={cn('flex flex-col gap-6', className)}
        style={style}
        onSubmit={form.handleSubmit(handleLogin)}
      >
        <div className="flex flex-col items-center text-center">
          <h1 className="text-2xl font-bold">Welcome back</h1>
          <p className="text-muted-foreground text-balance">Login to your pulpit account</p>
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
              <FormDescription>
                <a href="#" className="ml-auto text-sm underline-offset-2 hover:underline">
                  Forgot your password?
                </a>
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full cursor-pointer" disabled={loginMutation.isPending}>
          Login
        </Button>
      </form>
    </Form>
  )
}

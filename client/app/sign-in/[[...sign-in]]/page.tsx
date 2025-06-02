import { SignIn } from '@clerk/nextjs'

const signIn = () => {
  return (
    <main className="flex items-center justify-center">
      <SignIn/>
    </main>
  )
}

export default signIn
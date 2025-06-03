'use client'

import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { useUser } from '@clerk/nextjs'

type Message = {
  from: 'user' | 'ai'
  content: string
}

export default function MoodChat({ onSend }: { onSend: (msg: string) => void }) {
  const { user, isLoaded, isSignedIn } = useUser()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
const [isLoading, setIsLoading] = useState(false)

  const handleSend = async  () => {
    if (!input.trim() || isLoading) return
    const userMessage: Message = { from: 'user', content: input.trim() }
    setMessages((prev) => [...prev, userMessage])
    const messageText = input.trim()
    setInput('')
    setIsLoading(true)
    try {
      // Get AI response and add it immediately
      const aiResponse = await onSend(messageText)
      const aiMessage: Message = { from: 'ai', content: aiResponse }
      setMessages((prev) => [...prev, aiMessage])
    } catch (error) {
      console.error('Error sending message:', error)
      const errorMessage: Message = { from: 'ai', content: 'Sorry, something went wrong. Please try again.' }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return

   const channel = supabase
      .channel('chat-messages')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'ChatMessage' },
        (payload) => {
          console.log('[SUPABASE PAYLOAD]', payload)

          const isUserMsg = payload.new.userId === user?.id
          const isBotMsg = payload.new.from === 'ai'

          if (isUserMsg || isBotMsg) {
            // Fix: Use 'content' field instead of 'text'
            setMessages((prev) => {
              // Avoid duplicates by checking if message already exists
              const messageText = payload.new.content
              const isDuplicate = prev.some(msg => 
                msg.content === messageText && msg.from === (isBotMsg ? 'ai' : 'user')
              )
              
              if (isDuplicate) return prev
              
              return [
                ...prev,
                {
                  from: isBotMsg ? 'ai' : 'user',
                  content: messageText, // ← Use 'content' to match Message type
                },
              ]
            })
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [isLoaded, isSignedIn, user?.id])

   return (
    <Card className="w-full max-w-xl mx-auto shadow-lg rounded-2xl p-4 bg-muted">
      <CardContent className="space-y-4">
        <ScrollArea className="h-[400px] pr-2">
          <div className="space-y-3">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={cn(
                  'p-3 max-w-[80%] rounded-xl text-sm',
                  msg.from === 'user'
                    ? 'ml-auto bg-primary text-primary-foreground'
                    : 'mr-auto bg-background border'
                )}
              >
                {msg.content}
              </div>
            ))}
            {isLoading && (
              <div className="mr-auto bg-background border p-3 max-w-[80%] rounded-xl text-sm text-muted-foreground">
                AI is typing...
              </div>
            )}
          </div>
        </ScrollArea>
        <div className="flex items-center gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="How are you feeling today?"
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            disabled={isLoading}
          />
          <Button onClick={handleSend} disabled={isLoading}>
            {isLoading ? 'Sending...' : 'Send'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
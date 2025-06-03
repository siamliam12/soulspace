import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

const HUGGINGFACE_API_TOKEN = process.env.HUGGING_FACE_INTERFACE || ''
const HUGGINGFACE_MODEL = 'facebook/bart-large-cnn' // change to preferred model

export async function POST(req: Request) {
  const body = await req.json()
  const { userId, message } = body

  if (!userId || !message) {
    return NextResponse.json({ error: 'Missing input' }, { status: 400 })
  }

  // Store user's message in DB
  await prisma.chatMessage.create({
    data: {
      userId,
      from: 'user',
      content: message,
    },
  })

  // Call Hugging Face Inference API
  const response = await fetch(`https://api-inference.huggingface.co/models/${HUGGINGFACE_MODEL}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${HUGGINGFACE_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ inputs: message }),
  })
    if (!response.ok) {
    const errorText = await response.text()
    console.error('API error:', errorText)
    throw new Error(`API error: ${response.status} ${response.statusText}`)
    }
  const data = await response.json()
  console.log("data:",data)
  // Extract reply text depending on model output format
  let reply = "Sorry, I didn't get that."
  if (Array.isArray(data) && data[0]?.summary_text) {
    reply = data[0]?.summary_text
  } else if (data.summary_text) {
    reply = data.summary_text
  } else if (data.error) {
    reply = `Error from Hugging Face: ${data.error}`
  }

  // Store AI's response
  await prisma.chatMessage.create({
    data: {
      userId,
      from: 'ai',
      content: reply,
    },
  })

  return NextResponse.json({ reply })
}

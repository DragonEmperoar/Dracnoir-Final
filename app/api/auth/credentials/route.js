import { NextResponse } from 'next/server'
import { MongoClient } from 'mongodb'
import bcrypt from 'bcryptjs'

let client
let db

async function getDb() {
  if (!client) {
    client = new MongoClient(process.env.MONGO_URL)
    await client.connect()
    db = client.db(process.env.DB_NAME)
  }
  return db
}

export async function POST(request) {
  try {
    const db = await getDb()
    const body = await request.json()
    const { mode, email, password, name } = body || {}

    if (!email || !password || !mode) {
      return NextResponse.json(
        { error: 'Email, password and mode are required' },
        { status: 400 },
      )
    }

    const usersCol = db.collection('users')

    if (mode === 'signup') {
      const existing = await usersCol.findOne({ email })
      if (existing) {
        return NextResponse.json(
          { error: 'An account with this email already exists' },
          { status: 409 },
        )
      }
      const hash = await bcrypt.hash(password, 10)
      const user = {
        id: crypto.randomUUID(),
        name: name || email.split('@')[0],
        email,
        passwordHash: hash,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      await usersCol.insertOne(user)
      return NextResponse.json({ success: true })
    }

    if (mode === 'login') {
      const user = await usersCol.findOne({ email })
      if (!user || !user.passwordHash) {
        return NextResponse.json(
          { error: 'Invalid email or password' },
          { status: 401 },
        )
      }
      const isValid = await bcrypt.compare(password, user.passwordHash)
      if (!isValid) {
        return NextResponse.json(
          { error: 'Invalid email or password' },
          { status: 401 },
        )
      }

      // For simplicity, rely on NextAuth session for Google and separate email login for now
      // Here we just confirm credentials are correct
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid mode' }, { status: 400 })
  } catch (error) {
    console.error('Credentials API error', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

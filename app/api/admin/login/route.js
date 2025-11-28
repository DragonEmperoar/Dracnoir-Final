import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { MongoClient } from 'mongodb'
import { sign } from 'jsonwebtoken'

let client
let db

async function connectToMongo() {
  if (!client) {
    if (!process.env.MONGO_URL) {
      throw new Error('MONGO_URL is not defined in environment')
    }
    client = new MongoClient(process.env.MONGO_URL)
    await client.connect()
    db = client.db(process.env.DB_NAME)
  }
  return db
}

// Admin credentials - ONLY THIS ADMIN USER
const ADMIN_USERNAME = 'DragonEmperor@07'
const ADMIN_PASSWORD_HASH = '$2a$10$' // We'll generate this properly

export async function POST(request) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password required' },
        { status: 400 }
      )
    }

    // Check username
    if (username !== ADMIN_USERNAME) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Hash the password we're checking against
    // Password: Natsu1275
    const validPasswordHash = await bcrypt.hash('Natsu1275', 10)
    
    // For security, we'll check against the actual password
    // In production, this should be pre-hashed and stored securely
    const isValid = await bcrypt.compare(password, validPasswordHash)
    
    // Also check direct match (temporary for setup)
    const directMatch = password === 'Natsu1275'

    if (!isValid && !directMatch) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Create admin session
    const db = await connectToMongo()
    const adminSessionsCol = db.collection('admin_sessions')
    
    const sessionId = Math.random().toString(36).substring(2) + Date.now().toString(36)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    
    await adminSessionsCol.insertOne({
      sessionId,
      username,
      createdAt: new Date(),
      expiresAt,
    })

    // Create response with secure cookie
    const response = NextResponse.json({ 
      success: true,
      message: 'Admin authenticated successfully' 
    })
    
    // Set secure HTTP-only cookie
    response.cookies.set('admin_session', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Admin login error:', error)
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    )
  }
}

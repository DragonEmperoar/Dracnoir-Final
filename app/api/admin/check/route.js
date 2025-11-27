import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import { MongoClient } from 'mongodb'

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

// List of admin emails - UPDATE THIS WITH YOUR EMAIL
const ADMIN_EMAILS = [
  // Add your email here
  'your-email@example.com', // REPLACE WITH YOUR ACTUAL EMAIL
]

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ isAdmin: false, error: 'Not authenticated' }, { status: 401 })
    }

    const db = await connectToMongo()
    const usersCol = db.collection('users')
    
    // Check if user exists and has admin flag
    const user = await usersCol.findOne({ email: session.user.email })
    
    if (!user) {
      return NextResponse.json({ isAdmin: false, error: 'User not found' }, { status: 404 })
    }

    // Check if user is in admin emails list OR has isAdmin flag in database
    const isAdmin = ADMIN_EMAILS.includes(session.user.email) || user.isAdmin === true

    // If user is admin but doesn't have the flag in DB, set it
    if (ADMIN_EMAILS.includes(session.user.email) && !user.isAdmin) {
      await usersCol.updateOne(
        { email: session.user.email },
        { $set: { isAdmin: true, updatedAt: new Date() } }
      )
    }

    return NextResponse.json({ 
      isAdmin,
      email: session.user.email,
      name: session.user.name 
    })
  } catch (error) {
    console.error('Admin check error:', error)
    return NextResponse.json({ isAdmin: false, error: 'Server error' }, { status: 500 })
  }
}

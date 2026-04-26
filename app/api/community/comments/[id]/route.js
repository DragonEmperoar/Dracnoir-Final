import { MongoClient } from 'mongodb'
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../auth/[...nextauth]/route'

const ADMIN_EMAILS = ['chirayu1264@gmail.com']

let client, db

async function connectDB() {
  if (!client) {
    client = new MongoClient(process.env.MONGO_URL)
    await client.connect()
    db = client.db(process.env.DB_NAME)
  }
  return db
}

async function checkIsAdmin(request, database) {
  try {
    // 1. Check admin_session cookie (username/password login)
    const adminSessionCookie = request.cookies?.get?.('admin_session')
    if (adminSessionCookie?.value) {
      const adminSession = await database.collection('admin_sessions').findOne({
        sessionId: adminSessionCookie.value,
        expiresAt: { $gt: new Date() },
      })
      if (adminSession) return true
    }
    // 2. Check NextAuth Google OAuth session
    const session = await getServerSession(authOptions)
    if (session?.user?.email) {
      if (ADMIN_EMAILS.includes(session.user.email)) return true
      const user = await database.collection('users').findOne({ email: session.user.email })
      if (user?.isAdmin === true) return true
    }
    return false
  } catch { return false }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params
    const database = await connectDB()

    const comment = await database.collection('community_comments').findOne({ id })
    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
    }

    const isAdmin = await checkIsAdmin(request, database)
    const isOwner = comment.userId === session.user.id

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await database.collection('community_comments').deleteOne({ id })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Delete comment error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

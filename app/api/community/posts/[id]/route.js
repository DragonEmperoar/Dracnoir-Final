import { MongoClient } from 'mongodb'
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../auth/[...nextauth]/route'

// Hardcoded admin emails — mirrors /api/admin/check/route.js
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

// Mirrors requireAdmin exactly as in /api/admin/check/route.js
async function checkIsAdmin(request, database) {
  try {
    // 1. Check admin_session cookie (username/password admin login)
    const adminSessionCookie = request.cookies?.get?.('admin_session')
    if (adminSessionCookie?.value) {
      const adminSession = await database.collection('admin_sessions').findOne({
        sessionId: adminSessionCookie.value,
        expiresAt: { $gt: new Date() },
      })
      if (adminSession) return true
    }

    // 2. Check NextAuth (Google OAuth) session
    const session = await getServerSession(authOptions)
    if (session?.user?.email) {
      // Check hardcoded admin email list first (same as admin/check route)
      if (ADMIN_EMAILS.includes(session.user.email)) return true
      // Also allow if user has isAdmin flag set in DB
      const user = await database.collection('users').findOne({ email: session.user.email })
      if (user?.isAdmin === true) return true
    }

    return false
  } catch (err) {
    console.error('checkIsAdmin error:', err)
    return false
  }
}

export async function GET(request, { params }) {
  try {
    const { id } = params
    const database = await connectDB()

    const post = await database.collection('community_posts').findOne({ id })
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    const commentCount = await database.collection('community_comments').countDocuments({ postId: id })

    const session = await getServerSession(authOptions)
    const userId = session?.user?.id

    const { _id, upvotes, ...cleanPost } = post
    return NextResponse.json({
      ...cleanPost,
      commentCount,
      userUpvoted: userId ? (upvotes || []).includes(userId) : false,
    })
  } catch (err) {
    console.error('Get post error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params
    const database = await connectDB()

    const post = await database.collection('community_posts').findOne({ id })
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // Admin can delete any post
    const isAdmin = await checkIsAdmin(request, database)
    if (isAdmin) {
      await database.collection('community_posts').deleteOne({ id })
      await database.collection('community_comments').deleteMany({ postId: id })
      return NextResponse.json({ success: true })
    }

    // Regular user can only delete their own post
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (post.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden — only the post author or admin can delete this' }, { status: 403 })
    }

    await database.collection('community_posts').deleteOne({ id })
    await database.collection('community_comments').deleteMany({ postId: id })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Delete post error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

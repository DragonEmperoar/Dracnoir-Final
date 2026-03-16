import { MongoClient } from 'mongodb'
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../auth/[...nextauth]/route'

let client, db

async function connectDB() {
  if (!client) {
    client = new MongoClient(process.env.MONGO_URL)
    await client.connect()
    db = client.db(process.env.DB_NAME)
  }
  return db
}

export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params
    const database = await connectDB()
    const userId = session.user.id

    const post = await database.collection('community_posts').findOne({ id })
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    const upvotes = post.upvotes || []
    const alreadyUpvoted = upvotes.includes(userId)
    const newUpvotes = alreadyUpvoted
      ? upvotes.filter(uid => uid !== userId)
      : [...upvotes, userId]

    await database.collection('community_posts').updateOne(
      { id },
      { $set: { upvotes: newUpvotes, upvoteCount: newUpvotes.length } }
    )

    return NextResponse.json({
      upvoteCount: newUpvotes.length,
      userUpvoted: !alreadyUpvoted,
    })
  } catch (err) {
    console.error('Upvote error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

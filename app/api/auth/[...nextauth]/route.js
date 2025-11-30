import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import { MongoClient, ObjectId } from 'mongodb'
import bcrypt from 'bcryptjs'

let client
let clientPromise

if (!global._mongoClientPromise) {
  client = new MongoClient(process.env.MONGO_URL)
  global._mongoClientPromise = client.connect()
}
clientPromise = global._mongoClientPromise

export const authOptions = {
  session: {
    strategy: 'jwt',
  },

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),

    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: {},
        password: {},
      },

      async authorize(credentials) {
        const client = await clientPromise
        const db = client.db(process.env.DB_NAME)
        const usersCol = db.collection('users')

        const user = await usersCol.findOne({ email: credentials.email })

        if (!user) throw new Error('User not found')
        if (!user.passwordHash) throw new Error('User has no password')

        const isValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        )

        if (!isValid) throw new Error('Invalid email or password')

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id
      }
      return token
    },

    async session({ session, token }) {
      if (token?.userId) {
        session.user.id = token.userId
      }
      return session
    },
  },
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }

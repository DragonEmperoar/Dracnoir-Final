import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import { MongoClient } from 'mongodb'
import { MongoDBAdapter } from '@auth/mongodb-adapter'
import bcrypt from 'bcryptjs'

let clientPromise

// Reuse Mongo connection across hot reloads / serverless executions
if (!global._mongoClientPromise) {
  const client = new MongoClient(process.env.MONGO_URL)
  global._mongoClientPromise = client.connect()
}
clientPromise = global._mongoClientPromise

export const authOptions = {
  adapter: MongoDBAdapter(clientPromise, {
    databaseName: process.env.DB_NAME,
  }),

  providers: [
    // GOOGLE LOGIN
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),

    // EMAIL + PASSWORD LOGIN
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required')
        }

        const client = new MongoClient(process.env.MONGO_URL)
        await client.connect()
        const db = client.db(process.env.DB_NAME)
        const usersCol = db.collection('users')

        const user = await usersCol.findOne({ email: credentials.email })
        if (!user || !user.passwordHash) {
          throw new Error('Invalid email or password')
        }

        const isValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        )

        if (!isValid) {
          throw new Error('Invalid email or password')
        }

        return { id: user.id, name: user.name, email: user.email }
      },
    }),
  ],

  session: {
    strategy: 'jwt',
  },

  callbacks: {
    // 🔥 **CRITICAL FIX FOR GOOGLE OAUTH CALLBACK ERROR**
    async redirect({ url, baseUrl }) {
      return baseUrl // Always return dracnoir.in
    },

    async jwt({ token, user, account }) {
      if (account && user) {
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

  // Redirect errors to the signin page
  pages: {
    error: '/login',
  },
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }

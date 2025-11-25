import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { MongoClient } from 'mongodb'
import { MongoDBAdapter } from '@auth/mongodb-adapter'

let clientPromise

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
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
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
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }

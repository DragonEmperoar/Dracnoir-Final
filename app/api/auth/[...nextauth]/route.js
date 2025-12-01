import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import { MongoClient } from "mongodb"
import { MongoDBAdapter } from "@auth/mongodb-adapter"
import bcrypt from "bcryptjs"

let client
let clientPromise

if (!global._mongo) {
  client = new MongoClient(process.env.MONGO_URL)
  global._mongo = client.connect()
}
clientPromise = global._mongo

export const authOptions = {
  adapter: MongoDBAdapter(clientPromise, {
    databaseName: process.env.DB_NAME,
  }),

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),

    CredentialsProvider({
      name: "Credentials",
      credentials: {},
      async authorize(credentials) {
        const dbClient = await clientPromise
        const db = dbClient.db(process.env.DB_NAME)
        const usersCol = db.collection("users")

        const user = await usersCol.findOne({ email: credentials.email })
        if (!user) throw new Error("Invalid Email or Password")

        const valid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        )
        if (!valid) throw new Error("Invalid Email or Password")

        return {
          id: user.id,
          name: user.name,
          email: user.email,
        }
      },
    }),
  ],

  session: {
    strategy: "jwt",
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) token.userId = user.id
      return token
    },
    async session({ session, token }) {
      if (token?.userId) session.user.id = token.userId
      return session
    },
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }

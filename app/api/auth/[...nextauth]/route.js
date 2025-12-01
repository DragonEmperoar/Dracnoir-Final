import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { MongoClient } from "mongodb"
import { MongoDBAdapter } from "@auth/mongodb-adapter"

// ---------- MONGO CLIENT ----------
let client
let clientPromise

if (!global._mongoClient) {
  client = new MongoClient(process.env.MONGO_URL)
  global._mongoClient = client.connect()
}
clientPromise = global._mongoClient

// ---------- NEXTAUTH ----------
export const authOptions = {
  adapter: MongoDBAdapter(clientPromise, {
    databaseName: process.env.DB_NAME,
  }),

  providers: [
    // GOOGLE LOGIN ---------------------
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),

    // EMAIL + PASSWORD LOGIN -----------
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials) {
        const { email, password } = credentials

        if (!email || !password) {
          throw new Error("Email and password required")
        }

        const client = new MongoClient(process.env.MONGO_URL)
        await client.connect()
        const db = client.db(process.env.DB_NAME)

        const user = await db.collection("users").findOne({ email })

        if (!user || !user.passwordHash) {
          throw new Error("Invalid email or password")
        }

        const isValid = await bcrypt.compare(password, user.passwordHash)
        if (!isValid) {
          throw new Error("Invalid email or password")
        }

        return {
          id: user._id.toString(),
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

  pages: {
    signIn: "/login", // your login page route
  },

  secret: process.env.NEXTAUTH_SECRET,
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }

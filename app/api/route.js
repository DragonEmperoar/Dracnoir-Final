import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { MongoClient } from "mongodb";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    // Only admins can view users
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = new MongoClient(process.env.MONGO_URL);
    await client.connect();
    const db = client.db(process.env.DB_NAME);

    const users = await db.collection("users").find().toArray();

    const formatted = users.map((u) => ({
      id: u._id.toString(),
      name: u.name || "",
      email: u.email || "",
      image: u.image || null,
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("Admin GET /users error:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

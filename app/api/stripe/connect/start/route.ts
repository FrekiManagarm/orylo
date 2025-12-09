import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth.server";
import { headers } from "next/headers";
import { SignJWT } from "jose";

export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get organization ID from request body
    const body = await req.json();
    const { organizationId } = body;

    if (!organizationId) {
      return NextResponse.json(
        { error: "Organization ID is required" },
        { status: 400 },
      );
    }

    // Verify user has access to this organization
    // TODO: Add proper authorization check here
    // For now, we trust the organizationId from the request

    // Generate state token (JWT signed with our secret)
    const secret = new TextEncoder().encode(
      process.env.STRIPE_CONNECT_STATE_SECRET || process.env.BETTER_AUTH_SECRET,
    );

    const state = await new SignJWT({
      organizationId,
      userId: session.user.id,
      timestamp: Date.now(),
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("15m") // State expires in 15 minutes
      .sign(secret);

    // Construct Stripe Connect OAuth URL
    const stripeClientId = process.env.STRIPE_CONNECT_CLIENT_ID;
    if (!stripeClientId) {
      throw new Error("STRIPE_CONNECT_CLIENT_ID is not configured");
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.orylo.com";
    const redirectUri = `${baseUrl}/api/stripe/connect/callback`;

    const stripeAuthUrl = new URL("https://connect.stripe.com/oauth/authorize");
    stripeAuthUrl.searchParams.set("client_id", stripeClientId);
    stripeAuthUrl.searchParams.set("state", state);
    stripeAuthUrl.searchParams.set("redirect_uri", redirectUri);
    stripeAuthUrl.searchParams.set("response_type", "code");
    stripeAuthUrl.searchParams.set("scope", "read_write");
    stripeAuthUrl.searchParams.set("stripe_user[business_type]", "company");

    console.log(`🔗 Generated Stripe Connect URL for org ${organizationId}`);

    return NextResponse.json({
      url: stripeAuthUrl.toString(),
    });
  } catch (error) {
    console.error("❌ Error generating Stripe Connect URL:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}

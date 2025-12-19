import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth.server";
import { headers } from "next/headers";
import { SignJWT } from "jose";
import Stripe from "stripe";

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

    // Construct Stripe Connect OAuth URL
    const stripeClientId = process.env.STRIPE_CONNECT_CLIENT_ID;
    if (!stripeClientId) {
      throw new Error("STRIPE_CONNECT_CLIENT_ID is not configured");
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://orylo.app";
    const redirectUri = `${baseUrl}/api/stripe/connect/callback`;

    const stripeAuthUrl = new URL("https://connect.stripe.com/oauth/authorize");
    stripeAuthUrl.searchParams.set("client_id", stripeClientId);
    stripeAuthUrl.searchParams.set("state", organizationId);
    stripeAuthUrl.searchParams.set("redirect_uri", redirectUri);
    stripeAuthUrl.searchParams.set("response_type", "code");
    stripeAuthUrl.searchParams.set("scope", "read_write");
    stripeAuthUrl.searchParams.set("stripe_user[business_type]", "company");

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2025-12-15.clover",
    });

    const url = stripe.oauth.authorizeUrl({
      client_id: stripeClientId,
      state: organizationId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "read_write",
      stripe_user: {
        business_type: "company",
      },
    });

    console.log(`🔗 Generated Stripe Connect URL for org ${organizationId}`);

    return NextResponse.json({
      url: url.toString(),
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

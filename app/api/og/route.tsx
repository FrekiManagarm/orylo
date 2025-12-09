import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

const interSemiBold = fetch(
  new URL(
    "https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuI6fAZ9hjp-Ek-_EeA.woff",
  ),
).then((res) => res.arrayBuffer());

const interBold = fetch(
  new URL(
    "https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuFuYAZ9hjp-Ek-_EeA.woff",
  ),
).then((res) => res.arrayBuffer());

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get("title") || "Stop fraud.";
  const highlight = searchParams.get("highlight") || "Understand why.";
  const subtitle =
    searchParams.get("subtitle") ||
    "AI-powered protection for Stripe merchants. Every decision explained.";

  const [fontSemiBold, fontBold] = await Promise.all([
    interSemiBold,
    interBold,
  ]);

  return new ImageResponse(
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        backgroundColor: "#000000",
        position: "relative",
        fontFamily: '"Inter", sans-serif',
        overflow: "hidden",
      }}
    >
      {/* Grid background pattern */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          maskImage:
            "radial-gradient(circle at center, black 40%, transparent 100%)",
        }}
      />

      {/* Ambient Glow */}
      <div
        style={{
          position: "absolute",
          top: -200,
          left: "50%",
          transform: "translateX(-50%)",
          width: 1000,
          height: 1000,
          background:
            "radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 60%)",
          filter: "blur(80px)",
        }}
      />

      {/* Dashboard Preview (Peeking from bottom) */}
      <div
        style={{
          position: "absolute",
          bottom: -320,
          left: "50%",
          transform: "translateX(-50%)",
          width: 900,
          height: 500,
          display: "flex",
          flexDirection: "column",
          borderRadius: "24px",
          border: "1px solid rgba(255,255,255,0.1)",
          backgroundColor: "rgba(24, 24, 27, 0.8)", // zinc-900
          boxShadow:
            "0 -20px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255,255,255,0.05) inset",
          padding: 4,
          zIndex: 5,
        }}
      >
        {/* Inner Dashboard UI */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: "100%",
            height: "100%",
            borderRadius: "20px",
            backgroundColor: "#09090b", // zinc-950
            overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              height: 50,
              width: "100%",
              borderBottom: "1px solid rgba(255,255,255,0.05)",
              alignItems: "center",
              padding: "0 20px",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", gap: 8 }}>
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  backgroundColor: "#27272a",
                }}
              />
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  backgroundColor: "#27272a",
                }}
              />
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  backgroundColor: "#27272a",
                }}
              />
            </div>
            <div
              style={{
                width: 100,
                height: 6,
                borderRadius: 3,
                backgroundColor: "#27272a",
              }}
            />
          </div>

          {/* Body with Sidebar */}
          <div style={{ display: "flex", flex: 1 }}>
            {/* Sidebar */}
            <div
              style={{
                width: 200,
                borderRight: "1px solid rgba(255,255,255,0.05)",
                padding: 20,
                display: "flex",
                flexDirection: "column",
                gap: 16,
              }}
            >
              <div
                style={{
                  width: "80%",
                  height: 10,
                  borderRadius: 4,
                  backgroundColor: "#27272a",
                }}
              />
              <div
                style={{
                  width: "60%",
                  height: 10,
                  borderRadius: 4,
                  backgroundColor: "#27272a",
                }}
              />
              <div
                style={{
                  width: "70%",
                  height: 10,
                  borderRadius: 4,
                  backgroundColor: "#27272a",
                }}
              />
              <div
                style={{
                  width: "65%",
                  height: 10,
                  borderRadius: 4,
                  backgroundColor: "#27272a",
                }}
              />
            </div>

            {/* Main Content */}
            <div style={{ flex: 1, padding: 30, display: "flex", gap: 20 }}>
              {/* Card 1 */}
              <div
                style={{
                  flex: 1,
                  height: 180,
                  borderRadius: 12,
                  backgroundColor: "#18181b",
                  border: "1px solid rgba(255,255,255,0.05)",
                  padding: 20,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 8,
                    backgroundColor: "rgba(99, 102, 241, 0.2)",
                    marginBottom: 10,
                  }}
                />
                <div
                  style={{
                    width: "60%",
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: "#3f3f46",
                  }}
                />
                <div
                  style={{
                    width: "40%",
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: "#27272a",
                  }}
                />
              </div>

              {/* Card 2 */}
              <div
                style={{
                  flex: 1,
                  height: 180,
                  borderRadius: 12,
                  backgroundColor: "#18181b",
                  border: "1px solid rgba(255,255,255,0.05)",
                  padding: 20,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 8,
                    backgroundColor: "rgba(16, 185, 129, 0.2)",
                    marginBottom: 10,
                  }}
                />
                <div
                  style={{
                    width: "60%",
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: "#3f3f46",
                  }}
                />
                <div
                  style={{
                    width: "40%",
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: "#27272a",
                  }}
                />
              </div>

              {/* Card 3 (Partial) */}
              <div
                style={{
                  flex: 1,
                  height: 180,
                  borderRadius: 12,
                  backgroundColor: "#18181b",
                  border: "1px solid rgba(255,255,255,0.05)",
                  padding: 20,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 8,
                    backgroundColor: "rgba(239, 68, 68, 0.2)",
                    marginBottom: 10,
                  }}
                />
                <div
                  style={{
                    width: "60%",
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: "#3f3f46",
                  }}
                />
                <div
                  style={{
                    width: "40%",
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: "#27272a",
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Glow on top of dashboard */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "1px",
            background:
              "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)",
          }}
        />
      </div>

      {/* Main Content - Text */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-start",
          paddingTop: 60,
          zIndex: 10,
          width: "100%",
        }}
      >
        {/* Badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "8px 16px",
            borderRadius: 999,
            backgroundColor: "rgba(255, 255, 255, 0.05)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            marginBottom: 20,
            gap: 8,
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              backgroundColor: "#818cf8",
              boxShadow: "0 0 10px rgba(129, 140, 248, 0.5)",
            }}
          />
          <span
            style={{
              color: "#a1a1aa",
              fontSize: 16,
              fontWeight: 600,
              letterSpacing: "0.02em",
            }}
          >
            Beta coming soon
          </span>
        </div>

        {/* Title */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            lineHeight: 1.1,
            marginBottom: 20,
          }}
        >
          <span
            style={{
              fontSize: 70,
              fontWeight: 900,
              color: "#ffffff",
              letterSpacing: "-0.03em",
            }}
          >
            {title}
          </span>
          <span
            style={{
              fontSize: 70,
              fontWeight: 900,
              background:
                "linear-gradient(to bottom, #ffffff 40%, #94a3b8 100%)",
              backgroundClip: "text",
              color: "transparent",
              letterSpacing: "-0.03em",
            }}
          >
            {highlight}
          </span>
        </div>

        {/* Subtitle */}
        <p
          style={{
            fontSize: 24,
            color: "#a1a1aa",
            textAlign: "center",
            maxWidth: 700,
            lineHeight: 1.5,
            margin: 0,
            fontWeight: 500,
          }}
        >
          {subtitle}
        </p>
      </div>

      {/* Logo Bottom Right */}
      <div
        style={{
          position: "absolute",
          bottom: 40,
          right: 40,
          display: "flex",
          alignItems: "center",
          gap: 12,
          zIndex: 20,
        }}
      >
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: 6,
            background: "linear-gradient(135deg, #6366f1, #818cf8)",
          }}
        />
        <span
          style={{
            fontSize: 24,
            fontWeight: 700,
            color: "#ffffff",
            letterSpacing: "-0.02em",
          }}
        >
          Orylo
        </span>
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: "Inter",
          data: fontSemiBold,
          style: "normal",
          weight: 600,
        },
        {
          name: "Inter",
          data: fontBold,
          style: "normal",
          weight: 900,
        },
      ],
    },
  );
}

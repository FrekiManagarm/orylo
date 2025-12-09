import { createTool } from "@mastra/core";
import { z } from "zod";

/**
 * Tool to get IP geolocation and check for VPN/proxy usage
 * This is a simple mock - in production, you'd use services like:
 * - ipapi.co
 * - ip-api.com
 * - MaxMind GeoIP2
 */
export const getIPGeolocationTool = createTool({
  id: "get-ip-geolocation",
  description:
    "Get IP geolocation information and detect VPN, proxy, or datacenter IPs that may indicate fraud",
  inputSchema: z.object({
    ipAddress: z.string().describe("IP address to lookup"),
  }),
  outputSchema: z.object({
    country: z.string(),
    countryCode: z.string(),
    city: z.string().optional(),
    region: z.string().optional(),
    isVPN: z.boolean(),
    isProxy: z.boolean(),
    isDatacenter: z.boolean(),
    isSuspicious: z.boolean(),
    riskLevel: z.enum(["low", "medium", "high"]),
    signals: z.any(),
  }),
  execute: async ({ context }) => {
    const { ipAddress } = context;

    // In a real implementation, you'd call an IP geolocation API
    // For now, we'll return mock data with some heuristics

    const signals: Record<string, any> = { ip: ipAddress };

    // Simple check for private/local IPs
    const isPrivateIP =
      ipAddress.startsWith("192.168.") ||
      ipAddress.startsWith("10.") ||
      ipAddress.startsWith("127.") ||
      ipAddress.startsWith("172.");

    if (isPrivateIP) {
      return {
        country: "Unknown",
        countryCode: "XX",
        city: undefined,
        region: undefined,
        isVPN: false,
        isProxy: false,
        isDatacenter: false,
        isSuspicious: false,
        riskLevel: "low" as const,
        signals: { private_ip: true },
      };
    }

    // Mock implementation - in production, call real API
    // Example with ipapi.co: https://ipapi.co/${ipAddress}/json/
    try {
      // For demonstration purposes, we'll return mock data
      // In production, uncomment this and use real API:
      /*
      const response = await fetch(`https://ipapi.co/${ipAddress}/json/`);
      const data = await response.json();
      
      return {
        country: data.country_name,
        countryCode: data.country_code,
        city: data.city,
        region: data.region,
        isVPN: data.threat?.is_vpn || false,
        isProxy: data.threat?.is_proxy || false,
        isDatacenter: data.threat?.is_datacenter || false,
        isSuspicious: data.threat?.is_threat || false,
        riskLevel: data.threat?.is_threat ? 'high' : 'low',
        signals: data.threat || {},
      };
      */

      // Mock response for development
      const mockHighRiskCountries = ["NG", "GH", "PK", "ID", "RO"];
      const randomCountry = mockHighRiskCountries[0]; // For testing

      const isVPN = Math.random() > 0.8; // 20% chance
      const isProxy = Math.random() > 0.9; // 10% chance
      const isDatacenter = Math.random() > 0.85; // 15% chance

      const isSuspicious = isVPN || isProxy || isDatacenter;

      let riskLevel: "low" | "medium" | "high" = "low";
      if (mockHighRiskCountries.includes(randomCountry)) {
        riskLevel = "medium";
      }
      if (isSuspicious) {
        riskLevel = "high";
      }

      if (isVPN) signals.vpn_detected = true;
      if (isProxy) signals.proxy_detected = true;
      if (isDatacenter) signals.datacenter_ip = true;

      return {
        country: "Mock Country",
        countryCode: randomCountry,
        city: "Mock City",
        region: "Mock Region",
        isVPN,
        isProxy,
        isDatacenter,
        isSuspicious,
        riskLevel,
        signals,
      };
    } catch (error) {
      console.error("Error fetching IP geolocation:", error);

      // Return safe defaults on error
      return {
        country: "Unknown",
        countryCode: "XX",
        city: undefined,
        region: undefined,
        isVPN: false,
        isProxy: false,
        isDatacenter: false,
        isSuspicious: false,
        riskLevel: "low" as const,
        signals: { error: true },
      };
    }
  },
});

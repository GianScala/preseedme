/**
 * Normalize social media URLs - handles usernames, partial URLs, and full URLs
 */
export const normalizeUrl = (
    input: string | null | undefined,
    platform: "x" | "linkedin" | "github" | "website"
  ): string | null => {
    if (!input) return null;
    const trimmed = input.trim();
    if (!trimmed) return null;
  
    // Already has protocol - keep as is
    if (/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(trimmed)) {
      return trimmed;
    }
  
    // Remove common prefixes users might add
    let cleaned = trimmed
      .replace(/^@/, "") // Remove @ prefix
      .replace(/^(www\.)/, "") // Remove www.
      .replace(/^(https?:\/\/)/, ""); // Remove protocol if somehow still there
  
    // Platform-specific URL construction
    switch (platform) {
      case "x":
        // Handle: "GmScala", "x.com/GmScala", "twitter.com/GmScala"
        if (cleaned.includes("/")) {
          // Has path - extract username
          const username = cleaned.split("/").pop();
          return username ? `https://x.com/${username}` : null;
        }
        // Just username
        return `https://x.com/${cleaned}`;
  
      case "linkedin":
        // Handle: "GmScala", "linkedin.com/in/GmScala", "in/GmScala"
        if (cleaned.includes("linkedin.com/")) {
          cleaned = cleaned.replace(/.*linkedin\.com\//, "");
        }
        if (!cleaned.startsWith("in/") && !cleaned.startsWith("company/")) {
          cleaned = `in/${cleaned}`;
        }
        return `https://linkedin.com/${cleaned}`;
  
      case "github":
        // Handle: "GmScala", "github.com/GmScala"
        if (cleaned.includes("/")) {
          const username = cleaned.split("/").pop();
          return username ? `https://github.com/${username}` : null;
        }
        return `https://github.com/${cleaned}`;
  
      case "website":
        // For websites, just add https://
        return `https://${cleaned}`;
  
      default:
        return `https://${cleaned}`;
    }
  };
  
  // Legacy function for backward compatibility
  export const ensureHttps = (url?: string | null): string | null => {
    if (!url) return null;
    const trimmed = url.trim();
    if (!trimmed) return null;
  
    if (/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(trimmed)) {
      return trimmed;
    }
  
    return `https://${trimmed}`;
  };
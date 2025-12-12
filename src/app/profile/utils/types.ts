export const INITIAL_DATA = {
    email: "",
    preferredPhoneNumber: "",
    address: "",
    username: "",
    handle: "",
    photoURL: "",
    bio: "",
    location: "",
    role: "founder" as "founder" | "investor" | "both",
    xUrl: "",
    linkedinUrl: "",
    websiteUrl: "",
    githubUrl: "",
  };
  
  export type ProfileFormData = typeof INITIAL_DATA;
  
  export type StatusState =
    | { type: "error"; message: string }
    | { type: "success"; message: string }
    | null;
  
  export type ProfileTab = "basic" | "contact" | "links";
  export type ProjectsView = "created" | "liked";
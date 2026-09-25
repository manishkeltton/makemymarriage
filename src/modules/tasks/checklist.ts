// Stable IDs are persisted as generation keys: never derive identity from editable titles.
export const checklistGroups = {
 venue: ["Shortlist venue", "Finalise venue", "Pay venue advance", "Confirm venue timings"],
 catering: ["Finalise caterer", "Finalise menu", "Confirm guest estimate", "Pay catering advance"],
 photography: ["Finalise photographer", "Sign photography agreement", "Pay photography advance", "Confirm photography event schedule"],
 decoration: ["Finalise decorator", "Approve decoration concept", "Pay decoration advance"],
 ceremony: ["Confirm pandit", "Confirm ceremony timing", "Arrange pooja materials", "Arrange varmala", "Arrange mandap requirements"],
 invitations: ["Prepare guest list", "Finalise invitation", "Send invitations", "Follow up on RSVP"],
 clothing: ["Choose bride outfits", "Choose groom outfits", "Choose family outfits", "Complete alterations"],
} as const;
export const checklistItems = Object.entries(checklistGroups).flatMap(([category, titles]) => titles.map((title, index) => ({ key: `hindu-v1:${category}:${index + 1}`, category, title, daysBefore: [60, 30, 14, 7, 3][index], priority: (index === 0 ? "HIGH" : "MEDIUM") as "HIGH" | "MEDIUM" })));

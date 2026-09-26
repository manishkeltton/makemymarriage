import { z } from "zod";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const submitGuestbookSchema = z
  .object({
    guestName: z.string().min(1, "Guest name is required").max(100, "Name is too long").trim(),
    type: z.enum(["TEXT", "AUDIO", "VIDEO"]).default("TEXT"),
    text: z.string().max(2000, "Wish text is too long").trim().optional(),
    mediaId: z.string().regex(objectIdRegex, "Invalid media ID").optional().or(z.literal("")),
  })
  .refine(
    (data) => {
      if (data.type === "TEXT") {
        return !!data.text && data.text.length > 0;
      }
      if (data.type === "AUDIO" || data.type === "VIDEO") {
        return !!data.mediaId && data.mediaId.length > 0;
      }
      return true;
    },
    {
      message: "Text wishes require text content; audio/video wishes require attached media",
      path: ["text"],
    }
  );

export const moderateGuestbookSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
});

export type SubmitGuestbookInput = z.infer<typeof submitGuestbookSchema>;
export type ModerateGuestbookInput = z.infer<typeof moderateGuestbookSchema>;

import { z } from "zod";

export const loginSchema = z.object({
    username: z.string().min(1, "Vui lòng nhập username"),
    password: z.string().min(1, "Vui lòng nhập password"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

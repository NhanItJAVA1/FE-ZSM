import { z } from "zod";

export const registerSchema = z.object({
    username: z.string().min(1, "Vui lòng nhập username"),
    email: z.string().min(1, "Vui lòng nhập email").email("Email không hợp lệ"),
    password: z.string().min(6, "Password cần ít nhất 6 ký tự"),
    displayName: z.string().min(1, "Vui lòng nhập tên hiển thị"),
    avatarUrl: z.string().trim(),
});

export type RegisterFormValues = z.infer<typeof registerSchema>;

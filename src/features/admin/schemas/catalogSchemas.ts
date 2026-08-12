import { z } from "zod";

export const mapFormSchema = z.object({
    name: z.string().trim().min(1, "Hãy nhập tên map."),
    rate: z.coerce.number().int().min(1).max(7),
    imageUrl: z.string().trim(),
});

export type MapFormValues = z.infer<typeof mapFormSchema>;

export const vehicleFormSchema = z.object({
    name: z.string().trim().min(1),
    type: z.coerce.number().int().min(0).max(2),
    rank: z.coerce.number().int().min(0).max(7),
    imageUrl: z.string().trim(),
});

export type VehicleFormValues = z.infer<typeof vehicleFormSchema>;

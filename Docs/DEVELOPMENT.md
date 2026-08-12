# ZSM Frontend — Tài liệu phát triển

> ZingSpeed Mobile Records — React 19 + TypeScript + Vite

## 1. Cấu trúc thư mục

```
src/
├── assets/                 # Hình ảnh, icon tĩnh
├── components/             # Component dùng chung (không gắn domain)
│   ├── auth/               # GuestRoute, ProtectedRoute
│   └── ui/                 # ImagePickerModal, ...
├── constants/              # Hằng số app-wide
│   ├── admin.ts            # Danh sách admin username
│   ├── queryKeys.ts        # React Query keys
│   └── routes.ts           # Đường dẫn route
├── features/               # Module theo nghiệp vụ (feature-based)
│   ├── auth/
│   │   ├── components/     # LoginForm, LoginBrand
│   │   ├── hooks/          # useLogin
│   │   ├── schemas/        # loginSchema (zod)
│   │   ├── services/       # authService
│   │   └── types.ts
│   ├── catalog/            # Map, Vehicle, GameMode
│   │   ├── components/     # MapPickerModal, VehiclePickerModal
│   │   ├── hooks/          # useCatalogQueries
│   │   └── types.ts
│   ├── records/            # Kỷ lục, filter, submit
│   │   ├── components/     # HomeHero, RecordFilterBar, RecordViewer, ...
│   │   ├── hooks/          # useRecordsQuery, useRecordFilters, useSubmitRecord
│   │   └── types.ts
│   └── admin/              # Kiểm duyệt
│       ├── components/     # PendingRecordCard, AdminPendingList
│       └── hooks/          # useModeration
├── hooks/                  # Hook dùng chung (useIsAdmin, useRequireAdmin)
├── layouts/                # AppLayout, SiteHeader, PageHeading
├── pages/                  # Page mỏng — chỉ compose feature components
│   ├── admin/
│   ├── auth/
│   ├── home/
│   ├── notfound/
│   ├── submit/
│   ├── maps/               # (dự phòng) quản lý map
│   ├── records/            # (dự phòng) chi tiết record
│   └── vehicles/           # (dự phòng) quản lý xe
├── routes/                 # Cấu hình React Router
├── services/               # Tầng hạ tầng
│   ├── api/                # axios instance + REST clients
│   └── storage/            # token, user, pendingRecords (localStorage)
├── stores/                 # Redux Toolkit (auth slice)
├── types/                  # Re-export types (backward compat)
└── utils/                  # format, catalog helpers
```

### Nguyên tắc tổ chức

| Tầng | Trách nhiệm |
|------|-------------|
| `pages/` | Orchestration — ghép layout + feature components, không chứa logic nặng |
| `features/` | UI + hooks + types theo domain; mỗi feature độc lập |
| `services/api/` | Gọi HTTP thuần, không biết React |
| `components/ui/` | Primitive UI tái sử dụng |
| `layouts/` | Khung trang (header, heading) |

---

## 2. Những gì đã hoàn thành

### Authentication
- Trang `/login` với form validation (react-hook-form + zod)
- JWT lưu `localStorage`, Redux persist user
- `ProtectedRoute` / `GuestRoute` bảo vệ route

### Trang chủ (`/`)
- Filter: tìm tên map, rate, chọn map/xe qua **modal lưới ảnh**
- Nút reset filter
- Video player + panel thông tin (map, rate, thời gian, ngày, người đua, xe)
- Danh sách record dạng chip

### Đăng kỷ lục (`/submit`)
- Form: map, xe (modal ảnh), game mode, tên người đua, thời gian, video
- Ngày đăng tự động (readonly)
- Upload S3 qua presigned URL (`POST /api/Records/video-upload-url`)
- **Không đăng thẳng** — lưu vào hàng đợi pending (localStorage)

### Admin (`/admin`)
- Chỉ user trong `VITE_ADMIN_USERNAMES` (mặc định `admin`)
- Xem video pending, duyệt (POST record) hoặc từ chối

### Hạ tầng
- Axios proxy `/api` → backend `https://localhost:7046`
- React Query cache maps, vehicles, records, gameModes
- Tailwind CSS v4 + custom CSS variables

---

## 3. Luồng kiểm duyệt (tạm thời)

Backend **chưa có** field `Status` / API pending. FE dùng workaround:

```
User submit → upload video S3 → lưu pendingRecords (localStorage)
Admin duyệt → POST /api/Records → xóa khỏi pending
Admin từ chối → xóa khỏi pending
```

**Hạn chế:** pending chỉ tồn tại trên trình duyệt hiện tại; mất khi xóa cache.

---

## 4. API Backend đang dùng

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/api/Users/login` | Đăng nhập |
| GET | `/api/Maps` | Danh sách map |
| GET | `/api/Vehicles` | Danh sách xe |
| GET | `/api/GameModes` | Danh sách mode |
| GET | `/api/Records` | Danh sách kỷ lục |
| POST | `/api/Records/video-upload-url` | Presigned URL upload video |
| POST | `/api/Records` | Tạo kỷ lục (sau duyệt) |

---

## 5. Cấu hình môi trường

File `.env`:

```env
VITE_API_URL=/api
VITE_ADMIN_USERNAMES=admin
```

Chạy dev:

```powershell
# Backend
cd BE-Source-ZSM\BE-ZSM\BE-ZSM
dotnet run

# Frontend
cd FE-Source-ZSM\ZSM-FE
npm run dev
```

---

## 6. Hướng phát triển tiếp theo

### Backend (ưu tiên cao)
1. **Thêm `RecordStatus`** (`Pending`, `Approved`, `Rejected`) vào entity Record
2. API `GET /api/Records/pending` — danh sách chờ duyệt
3. API `PATCH /api/Records/{id}/approve` và `/reject`
4. **Role admin** trên User (thay vì hardcode username ở FE)
5. Field **`RacerDisplayName`** riêng (tách khỏi username tài khoản)

### Frontend
1. **Trang đăng ký** (`/register`) — API đã có `POST /api/Users/register`
2. **`pages/maps/`**, **`pages/vehicles/`** — CRUD quản trị catalog (API đã có)
3. **`pages/records/`** — trang chi tiết record `/records/:id`
4. Thay localStorage pending bằng API khi BE sẵn sàng
5. Toast notification (thay `form-status` text)
6. Pagination / infinite scroll cho danh sách record
7. Skeleton loading thay empty state
8. Unit test: hooks (`useRecordFilters`, `useSubmitRecord`) + utils (`format`, `parseFinishTimeInput`)
9. E2E: login → submit → admin approve

### DevOps / chất lượng
1. CI: `npm run build` + lint
2. `.env.example` commit vào repo (không commit `.env` thật)
3. Error boundary toàn app
4. i18n nếu cần đa ngôn ngữ

---

## 7. Ghi chú kỹ thuật

- **FinishTime:** BE nhận `TimeSpan` dạng `"HH:mm:ss.fff"` — dùng `secondsToTimeSpan()` trong `utils/format.ts`
- **Typo cũ:** folder `features/auth/serivces` đã đổi thành `features/auth/services`
- **Import path:** dùng `.js` extension theo `module: nodenext` của tsconfig

---

*Cập nhật: 11/08/2026*

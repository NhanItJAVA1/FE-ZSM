# Dynamic RBAC Management — Frontend Report

## Kiến trúc frontend đã rà soát

- React `19.2.8`, TypeScript `7.0.2`, Vite `8.2.1`.
- Routing dùng React Router DOM `7.18.2`; trang `/admin` nằm sau `ProtectedRoute` nên yêu cầu phiên đăng nhập.
- Redux Toolkit giữ client state đăng nhập. TanStack Query `5.101.4` quản lý server state và cache; Axios `1.19.0` gọi API.
- Access token nằm trong `localStorage` (`accessToken`); refresh token dùng cookie qua `withCredentials`. Axios gắn Bearer token, refresh khi nhận 401 và xếp hàng request đang chờ refresh.
- Project chưa dùng UI component library. UI dùng React components, class CSS trong `src/index.css` và design tokens trong `src/styles/theme.css`.
- Admin page, AppLayout, SiteHeader, PageHeading, auth guards và các service hiện có được giữ theo convention của project. Không thêm dependency.

## Các phần đã triển khai

- `src/features/rbac/types.ts`: DTO Role, Permission, User và payload thay thế Role/Permission.
- `src/services/api/rbacService.ts`: hàm gọi roles, permissions, user list và role assignments.
- `src/services/api/apiError.ts`, `src/features/rbac/apiErrors.ts`: giữ HTTP status và backend `errorCode` để hiển thị lỗi 400/403/404/409 phù hợp.
- `src/features/rbac/components/RoleManagementPanel.tsx`: danh sách, tạo, sửa và xóa Role; xác nhận xóa; bảo vệ Role mặc định theo quy tắc backend (ID 1/2 hoặc tên User/Admin). Role mới không được tự cấp Permission.
- `src/features/rbac/components/PermissionManagementPanel.tsx`: chọn Role, nhóm Permission theo module, chọn từng quyền/chọn cả nhóm và PUT danh sách ID thay thế. Có cảnh báo trước khi lưu và refetch sau thành công.
- `src/features/rbac/components/UserRoleAssignmentPanel.tsx`: chọn User, tải Role được gán, chỉnh nhiều Role và lưu bằng PUT. Không cho lưu danh sách rỗng, refetch sau lưu, nhận diện `LAST_ADMIN_PROTECTED`.
- `src/features/rbac/components/RbacStates.tsx`: loading, empty và lỗi/403 states.
- `src/pages/admin/AdminPage.tsx`, `src/layouts/SiteHeader.tsx`, `src/routes/index.tsx`: thêm ba khu vực Roles, Permissions, User roles và mở route/menu cho user đã đăng nhập. Authorization thực tế vẫn do backend quyết định.
- `src/index.css`: responsive styles cho RBAC, theo tokens hiện tại và dùng góc bo gọn.

## API integration và response contract

DTO được đối chiếu với backend Phase 4 tại `BE-ZSM/DTOs/Rbac` và controllers trong `BE-ZSM/Controllers`:

- `RoleResponseDto`: `{ id, name, description }`.
- `PermissionResponseDto`: `{ id, code, description }`.
- `UserResponseDto`: `{ id, username, email, displayName, avatarUrl, role, roles, createdAt, updatedAt }`.
- Các GET collection trả trực tiếp array DTO; PUT thay Permission trả array Permission; PUT thay User roles trả array Role.
- Payload là `{ name, description }`, `{ permissionIds: number[] }`, và `{ roleIds: number[] }`.
- Role assignment cần User picker. Backend source có `GET /api/users` (được bảo vệ bởi `users.read`) cùng DTO `UserResponseDto`, nên UI dùng endpoint đó ngoài danh sách endpoint ban đầu.
- User picker cần `users.read`; đọc/ghi danh sách Role của user cần `users.manage-roles`. Nếu thiếu một trong các quyền tương ứng, UI hiển thị 403.
- Backend mặc định chặn sửa tên/xóa Role User và Admin, không cho Role User nhận RBAC management permissions, yêu cầu mỗi User có ít nhất một Role, và trả conflict `LAST_ADMIN_PROTECTED` nếu thao tác loại bỏ RBAC administrator cuối cùng.

## Authorization và giới hạn backend

- Backend Phase 4 bảo vệ endpoints bằng permission codes trong database. FE không suy ra quyền từ tên Role hoặc JWT role claim. `/admin` yêu cầu đăng nhập; các request thiếu quyền hiện thông báo 403. Ẩn/hiện action theo từng permission chưa thể triển khai an toàn vì source backend hiện không có endpoint trả effective permissions của user đăng nhập.
- Đề xuất backend bổ sung `GET /api/users/me/permissions` (hoặc `GET /api/auth/me/permissions`) trả danh sách permission codes hiệu lực. Khi endpoint có sẵn, FE có thể thêm `hasPermission()` để ẩn menu/action và guard routes; backend vẫn phải tiếp tục thực thi authorization.
- Backend Phase 4 report ghi chú migration phải được áp dụng ở môi trường đích trước khi endpoints RBAC hoạt động; chưa xác minh DB môi trường này đã migrate.

## Kiểm tra

- `pnpm exec tsc --noEmit`: PASS.
- `pnpm lint`: PASS.
- `pnpm build`: PASS. Lightning CSS in cảnh báo về các directive Tailwind `@theme`/`@tailwind` hiện có, nhưng Vite hoàn tất build.
- Không tìm thấy test suite hoặc test script frontend; không có automated FE tests để chạy.

## Hướng dẫn kiểm thử thủ công

1. Chạy backend sau khi Phase 4 migrations đã được áp dụng; đăng nhập bằng user có các permission quản trị phù hợp.
2. Mở `/admin` → Roles: tạo Role mới và xác nhận Role xuất hiện nhưng chưa có Permission; sửa tên/mô tả; thử xóa Role đang được dùng để xác nhận lỗi 409; kiểm tra Role User/Admin bị khóa.
3. Mở Permissions: chọn Role, chọn/bỏ chọn nhiều quyền hoặc cả module; lưu; tải lại trang/tab và xác nhận danh sách khớp backend. Xác nhận cảnh báo nêu PUT thay toàn bộ danh sách.
4. Mở User roles: chọn User, đổi nhiều Role và lưu; tải lại để xác nhận. Thử bỏ hết Role (nút lưu phải bị khóa) và thử làm mất quyền của RBAC administrator cuối cùng (hiển thị lỗi tương ứng).
5. Đăng nhập bằng user thiếu permission và thử gọi các tab/API. FE phải hiển thị 403, còn backend phải từ chối thao tác.

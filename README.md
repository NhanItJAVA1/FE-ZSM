## 15. Luồng dữ liệu của Todo

```text
TodoListPage
	-> useTodoListPageModel()
	-> lấy data, state và callback
	-> truyền props xuống component con
	-> component con gọi callback khi người dùng thao tác
	-> hook cập nhật state
	-> React render lại UI
```

`TodoListPage` chủ yếu lắp ráp giao diện. Logic được tách vào
`useTodoListPageModel` và các custom hook chuyên trách.

```text
TodoListPage
	├── TodoCategoryPanel
	├── TodoPanel
	│   ├── TodoPanelToolbar
	│   ├── TodoTable
	│   └── TodoPagination
	└── TodoDialog
```

## 16. `useTodoListPageModel`

File `src/features/todo/hooks/useTodoListPageModel.ts` là nơi điều phối chính
của Todo page.

| Hook | Mục đích |
| --- | --- |
| `useTodoFilters` | Search, filter và pagination |
| `useTodosQuery` | Lấy danh sách Todo từ backend |
| `useTodoCategoriesQuery` | Lấy danh sách category |
| `useTodoMutations` | Tạo, sửa, xóa Todo và category |
| `useTodoSelection` | Quản lý Todo đang được chọn |
| `useTodoTableEditing` | Quản lý draft và chỉnh sửa inline |
| `useTodoDialogActions` | Quản lý dialog và category actions |
| `useTodoPageSize` | Tính số Todo theo kích thước panel |

Mỗi hook chịu trách nhiệm cho một nhóm logic, giúp component UI không phải
trực tiếp xử lý toàn bộ nghiệp vụ.

## 17. Props và data flow trong React

Props là dữ liệu hoặc function được truyền từ component cha xuống component con:

```tsx
<TodoPanel {...panelProps} />
```

Tương đương với:

```tsx
<TodoPanel
		actions={panelProps.actions}
		data={panelProps.data}
		editing={panelProps.editing}
		filters={panelProps.filters}
		pagination={panelProps.pagination}
/>
```

Dữ liệu đi một chiều:

```text
Component cha -> props -> component con
```

Khi component con cần thông báo sự kiện, component cha truyền callback xuống:

```tsx
<input
		value={search}
		onChange={(event) => onSearchChange(event.target.value)}
/>
```

`TodoPanelToolbar` chỉ gọi `onSearchChange`; state thực tế được cập nhật trong
`useTodoFilters`. Đây là mô hình unidirectional data flow.

## 18. Controlled component

Input search là controlled component vì giá trị của nó do React state kiểm soát:

```text
search state -> value của input
người dùng nhập -> onChange -> cập nhật state -> render lại
```

State là nguồn dữ liệu duy nhất của input, giúp giao diện luôn đồng bộ với logic.

## 19. Search Todo

```text
TodoPanelToolbar
	-> onSearchChange
	-> useTodoFilters
	-> debounce 350ms
	-> tạo TodoQuery
	-> useTodosQuery
	-> todoService.getAll
	-> GET /api/todos
	-> backend tìm trong title/description
	-> TodoTable hiển thị kết quả
```

Search được debounce để tránh gọi API sau mỗi ký tự:

```ts
const [search, setSearch] = useState("");
const debouncedSearch = useDebouncedValue(search, 350);
```

Keyword được trim trước khi gửi. Backend tìm trên `title` và `description`.
Search Todo là server-side search.

## 20. Pagination Todo

```text
TodoPagination
	-> onSetPage
	-> page state thay đổi
	-> TodoQuery thay đổi
	-> queryKey thay đổi
	-> TanStack Query gọi API page mới
	-> TodoTable render dữ liệu mới
```

`Math.max` và `Math.min` bảo vệ page không nhỏ hơn `1` hoặc lớn hơn
`totalPages`.

## 21. Draft và inline editing

Todo mới được giữ trong `drafts`; Todo đã tồn tại được giữ thay đổi tạm thời
trong `editedRows`.

```text
Người dùng chỉnh sửa
	-> cập nhật state local
	-> chưa gọi API
	-> bấm Save
	-> gom drafts và editedRows
	-> PUT /api/todos/batch
```

Payload hỗ trợ:

```text
id = null, isDeleted = false -> tạo mới
id có giá trị, isDeleted = false -> cập nhật
id có giá trị, isDeleted = true -> xóa
```

Cách này phù hợp với inline editing và thao tác lưu nhiều dòng một lần.

## 22. TanStack Query

Dự án dùng `@tanstack/react-query` để quản lý server state:

- Gọi API bằng `useQuery`.
- Ghi dữ liệu bằng `useMutation`.
- Quản lý loading và error.
- Cache và request deduplication.
- Refetch và invalidate cache.
- Giữ dữ liệu cũ khi query mới đang tải.
- Hỗ trợ hủy request bằng `AbortSignal`.

Ví dụ:

```ts
const todosQuery = useQuery({
		queryKey: ["todos", "user", userId, query],
		queryFn: ({ signal }) => todoService.getAll(query, signal),
});
```

`staleTime: 30_000` trong `main.tsx` nghĩa là query được xem là fresh trong
30 giây. `staleTime` áp dụng cho query, không áp dụng cho mutation.

## 23. Query key và caching

Query key định danh dữ liệu trong cache:

```ts
["todos", "user", userId, query]
```

Search, page hoặc filter khác nhau sẽ tạo cache khác nhau. Các request có cùng
query key đang chạy sẽ được TanStack Query dùng chung thay vì gửi trùng.

Sau mutation thành công, dự án invalidate query liên quan:

```ts
queryClient.invalidateQueries({
		queryKey: QUERY_KEYS.todos(userId),
});
```

Cache được đánh dấu stale và query đang được sử dụng có thể được refetch.

## 24. AbortController

React Query cung cấp `signal` cho `queryFn`:

```ts
queryFn: ({ signal }) => todoService.getAll(query, signal)
```

Service truyền signal vào Axios:

```ts
api.get("/todos", {
		params: query,
		signal,
});
```

Khi query cũ không còn cần thiết, request có thể được hủy. Kết hợp với debounce
giúp giảm request không cần thiết khi người dùng search nhanh.

## 25. Redux Toolkit

Dự án dùng `@reduxjs/toolkit` và `react-redux` cho client state. Redux store
hiện có `auth` slice:

```ts
export const store = configureStore({
		reducer: {
				auth: authReducer,
		},
});
```

Redux Toolkit quản lý:

- User hiện tại.
- Trạng thái đăng nhập.
- `setAuth` sau khi login/register thành công.
- `logout` khi người dùng đăng xuất.

Todo, records, maps và vehicles là server state nên do TanStack Query quản lý,
không lưu trong Redux.

## 26. Auth flow

Khi login thành công:

```ts
const response = await authService.login(values);
dispatch(setAuth(response.user));
```

`setAuth` cập nhật Redux và lưu user vào storage. Khi logout:

```ts
dispatch(logout());
queryClient.clear();
navigate(ROUTES.login);
```

Redux xóa auth state, TanStack Query xóa server cache, còn Router chuyển về
trang login. Việc clear cache tránh hiển thị dữ liệu của user trước.

## 27. Redux Toolkit và TanStack Query

| Nội dung | Redux Toolkit | TanStack Query |
| --- | --- | --- |
| Loại state | Client state | Server state |
| Dữ liệu trong dự án | Auth/user | Todo, records, maps, vehicles |
| API hook | Không tự cung cấp | `useQuery`, `useMutation` |
| Cache API | Không tự có | Có |
| Deduplicate request | Không tự có | Có |
| `staleTime` | Không có | Có |
| Invalidate query | Không có | Có |

Dự án không dùng RTK Query. `@reduxjs/toolkit` và RTK Query không đồng nghĩa:

```text
Redux Toolkit -> thư viện quản lý state
RTK Query -> module server state trong hệ Redux
TanStack Query -> thư viện server state đang dùng
```

## 28. Công nghệ và công cụ

### React và React DOM

Xây dựng giao diện theo component, quản lý render, event và lifecycle.

### TypeScript

Định nghĩa DTO, props, query, payload và kiểm tra kiểu dữ liệu lúc build.

### Vite

Development server, hot reload, đọc biến môi trường và production bundling.

```bash
pnpm dev
pnpm build
pnpm preview
```

### TanStack Query

Quản lý server state, cache, query, mutation, refetch, invalidate và abort
request.

### Redux Toolkit và React Redux

Tạo Redux store, `authSlice`, `useAppSelector` và `useAppDispatch`.

### Axios

HTTP client dùng để gọi backend, gửi query parameters, xử lý token/refresh
token và truyền `AbortSignal`.

### React Router DOM

Định nghĩa route, điều hướng, protected route và admin route.

### React Hook Form và Zod

React Hook Form quản lý form; Zod định nghĩa schema validation; resolver kết
nối hai thư viện.

### Tailwind CSS và CSS custom

Tailwind cung cấp utility class; `src/index.css`, `src/App.css` và các file CSS
feature định nghĩa style riêng của ứng dụng.

### Lucide React

Cung cấp icon như `Check`, `Trash2`, `X` và `Filter` cho UI.

### ESLint

Kiểm tra chất lượng JavaScript/TypeScript, React Hook và React Refresh.

```bash
pnpm lint
```

### pnpm và Node.js

`pnpm` quản lý dependency và chạy script. Node.js cung cấp môi trường chạy
Vite, ESLint và các công cụ build.

## 29. Vite proxy

Trong `vite.config.js`, request `/api` được proxy tới backend:

```js
server: {
		proxy: {
				"/api": {
						target: backendUrl,
						changeOrigin: true,
						secure: false,
				},
		},
}
```

Backend mặc định chạy tại `http://localhost:8080`. Có thể thay đổi bằng biến
môi trường `VITE_BACKEND_URL`.

```text
VITE_BACKEND_URL=http://localhost:5000
```

## 30. Các lệnh phát triển

```bash
pnpm install
pnpm dev
pnpm build
pnpm lint
pnpm preview
```

## 31. Tổng kết kiến trúc

```text
Page
	-> custom hook/model
	-> component UI
	-> props
	-> callback
	-> state update
	-> render lại
```

Kiến trúc chính của dự án:

```text
React
	-> render component

Redux Toolkit
	-> quản lý auth/client state

TanStack Query
	-> quản lý server state

Axios
	-> gửi HTTP request

Vite
	-> development server và build

TypeScript
	-> kiểm tra kiểu dữ liệu

React Hook Form + Zod
	-> quản lý và validation form

React Router
	-> điều hướng và bảo vệ route

Tailwind CSS + CSS custom
	-> styling giao diện

ESLint
	-> kiểm tra chất lượng code
```
Nothing here
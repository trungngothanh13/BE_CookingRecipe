# Cooking Recipe API - Backend

Ứng dụng backend API cho hệ thống quản lý công thức nấu ăn, được xây dựng với Node.js, Express.js và PostgreSQL. API hỗ trợ đầy đủ các chức năng từ quản lý người dùng, công thức nấu ăn, giỏ hàng, giao dịch thanh toán đến đánh giá và quản lý hình ảnh.

## Mục lục

- [Tổng quan](#tổng-quan)
- [Tính năng](#tính-năng)
- [Công nghệ sử dụng](#công-nghệ-sử-dụng)
- [Cấu trúc dự án](#cấu-trúc-dự-án)
- [Yêu cầu hệ thống](#yêu-cầu-hệ-thống)
- [Cài đặt](#cài-đặt)
- [Cấu hình](#cấu-hình)
- [Khởi chạy](#khởi-chạy)
- [API Documentation](#api-documentation)
- [Cấu trúc Database](#cấu-trúc-database)
- [Deployment](#deployment)
- [Bảo mật](#bảo-mật)
- [Troubleshooting](#troubleshooting)

## Tổng quan

Backend API này cung cấp các endpoint RESTful để quản lý:
- Xác thực người dùng (đăng ký, đăng nhập, quản lý profile)
- Quản lý công thức nấu ăn (CRUD operations)
- Hệ thống giỏ hàng và thanh toán
- Giao dịch với xác minh thanh toán
- Đánh giá và bình luận công thức
- Upload và quản lý hình ảnh qua Cloudinary
- Phân quyền người dùng (user/admin)

## Tính năng

### Xác thực và Phân quyền
- Đăng ký tài khoản người dùng mới
- Đăng nhập với JWT token
- Xác thực token cho các request bảo mật
- Phân quyền admin cho các chức năng quản trị
- Quản lý profile và ảnh đại diện

### Quản lý Công thức
- Xem danh sách công thức với phân trang và lọc
- Tìm kiếm công thức theo tên, độ khó, thời gian nấu
- Xem chi tiết công thức (chỉ người đã mua hoặc admin)
- Tạo, cập nhật, xóa công thức (chỉ admin)
- Quản lý nguyên liệu, hướng dẫn nấu ăn
- Hỗ trợ video YouTube
- Thống kê lượt xem và lượt mua

### Giỏ hàng và Thanh toán
- Thêm/xóa công thức khỏi giỏ hàng
- Xem giỏ hàng của người dùng
- Tạo giao dịch thanh toán
- Upload ảnh chứng minh thanh toán
- Xác minh giao dịch (admin)
- Từ chối giao dịch với ghi chú (admin)

### Đánh giá và Bình luận
- Chỉ người đã mua công thức mới được đánh giá
- Xem đánh giá và bình luận
- Cập nhật đánh giá đã có
- Tính điểm trung bình tự động

### Quản lý Hình ảnh
- Upload ảnh lên Cloudinary
- Upload ảnh chứng minh thanh toán
- Quản lý ảnh đại diện người dùng

## Công nghệ sử dụng

- **Node.js**: Runtime environment
- **Express.js**: Web framework
- **PostgreSQL**: Database
- **JWT (jsonwebtoken)**: Xác thực người dùng
- **bcrypt**: Mã hóa mật khẩu
- **Cloudinary**: Quản lý hình ảnh
- **Multer**: Xử lý upload file
- **Swagger**: API documentation
- **dotenv**: Quản lý biến môi trường
- **CORS**: Cross-origin resource sharing

## Cấu trúc dự án

```
BE_CookingRecipe/
├── server.js                 # Entry point của ứng dụng
├── package.json              # Dependencies và scripts
├── render.yaml               # Cấu hình deployment Render
├── renderSetup.md           # Hướng dẫn deploy lên Render
├── src/
│   ├── config/
│   │   ├── app.js           # Cấu hình Express app
│   │   ├── database.js      # Kết nối PostgreSQL
│   │   ├── middleware.js    # Cấu hình middleware
│   │   ├── swagger.js       # Cấu hình Swagger docs
│   │   └── databaseQueries/
│   │       ├── insert.pgsql # Schema database
│   │       └── mockdata.pgsql # Dữ liệu mẫu
│   ├── routes/
│   │   ├── auth.js          # Routes xác thực
│   │   ├── recipes.js       # Routes công thức
│   │   ├── cart.js          # Routes giỏ hàng
│   │   ├── transactions.js  # Routes giao dịch
│   │   ├── ratings.js       # Routes đánh giá
│   │   └── images.js        # Routes hình ảnh
│   ├── services/
│   │   ├── authService.js   # Logic xác thực
│   │   ├── recipeService.js # Logic công thức
│   │   ├── cartService.js   # Logic giỏ hàng
│   │   ├── transactionService.js # Logic giao dịch
│   │   ├── ratingService.js # Logic đánh giá
│   │   └── imageService.js  # Logic hình ảnh
│   ├── middlewares/
│   │   ├── authMiddleware.js # Middleware xác thực
│   │   └── errorHandler.js   # Xử lý lỗi
│   ├── docs/
│   │   ├── auth.js          # Swagger docs cho auth
│   │   ├── recipes.js       # Swagger docs cho recipes
│   │   ├── cart.js          # Swagger docs cho cart
│   │   ├── transactions.js  # Swagger docs cho transactions
│   │   ├── ratings.js       # Swagger docs cho ratings
│   │   ├── images.js        # Swagger docs cho images
│   │   └── schemas.js       # Swagger schemas
│   └── route.js             # Router chính
└── temp/                    # Thư mục tạm cho file upload
```

## Yêu cầu hệ thống

- Node.js >= 16.0.0
- PostgreSQL >= 12.0
- npm hoặc yarn
- Tài khoản Cloudinary (cho upload ảnh)

## Cài đặt

1. Clone repository:
```bash
git clone <repository-url>
cd BE_CookingRecipe
```

2. Cài đặt dependencies:
```bash
npm install
```

3. Tạo file `.env` trong thư mục gốc:
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=your_database_name
DB_USER=your_database_user
DB_PASSWORD=your_database_password

# JWT Secret
JWT_SECRET=your_super_secret_jwt_key_change_this

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Server Configuration
PORT=5000
NODE_ENV=development
```

4. Tạo database PostgreSQL và chạy schema:
```bash
# Kết nối PostgreSQL
psql -U your_database_user -d your_database_name

# Chạy file schema
\i src/config/databaseQueries/insert.pgsql
```

## Cấu hình

### Database
Cấu hình kết nối database trong file `.env`. Ở môi trường production (Render), hệ thống tự động sử dụng `DATABASE_URL` từ biến môi trường.

### Cloudinary
Đăng ký tài khoản tại https://cloudinary.com và lấy các thông tin:
- Cloud Name
- API Key
- API Secret

Điền vào file `.env`.

### JWT Secret
Tạo một chuỗi bí mật mạnh cho JWT token. Không chia sẻ giá trị này.

## Khởi chạy

### Development mode
```bash
npm run dev
```
Server sẽ chạy tại `http://localhost:5000` với nodemon để tự động reload khi có thay đổi.

### Production mode
```bash
npm start
```

### Kiểm tra server
Truy cập:
- Health check: `http://localhost:5000/api/health`
- API Documentation: `http://localhost:5000/api-docs`

## API Documentation

API documentation được cung cấp qua Swagger UI tại endpoint `/api-docs` khi server đang chạy.

### Các endpoint chính:

#### Authentication (`/api/auth`)
- `POST /api/auth/register` - Đăng ký tài khoản mới
- `POST /api/auth/login` - Đăng nhập
- `GET /api/auth/profile` - Lấy thông tin profile (yêu cầu token)

#### Recipes (`/api/recipes`)
- `GET /api/recipes` - Lấy danh sách công thức (phân trang, lọc)
- `GET /api/recipes/my-recipes` - Lấy công thức đã mua (yêu cầu token)
- `GET /api/recipes/:id` - Lấy chi tiết công thức (yêu cầu token)
- `POST /api/recipes` - Tạo công thức mới (yêu cầu admin)
- `PUT /api/recipes/:id` - Cập nhật công thức (yêu cầu admin)
- `DELETE /api/recipes/:id` - Xóa công thức (yêu cầu admin)

#### Cart (`/api/cart`)
- `POST /api/cart` - Thêm công thức vào giỏ hàng (yêu cầu token)
- `GET /api/cart` - Lấy giỏ hàng (yêu cầu token)
- `DELETE /api/cart/:recipeId` - Xóa công thức khỏi giỏ hàng (yêu cầu token)

#### Transactions (`/api/transactions`)
- `POST /api/transactions` - Tạo giao dịch mới (yêu cầu token)
- `GET /api/transactions` - Lấy giao dịch của user (yêu cầu token)
- `GET /api/transactions/all` - Lấy tất cả giao dịch (yêu cầu admin)
- `PUT /api/transactions/:id/payment` - Nộp ảnh chứng minh thanh toán (yêu cầu token)
- `PUT /api/transactions/:id/verify` - Xác minh giao dịch (yêu cầu admin)
- `PUT /api/transactions/:id/reject` - Từ chối giao dịch (yêu cầu admin)

#### Ratings (`/api/ratings`)
- `GET /api/ratings/recipe/:recipeId` - Lấy đánh giá của công thức
- `POST /api/ratings` - Tạo đánh giá mới (yêu cầu token, chỉ người đã mua)
- `PUT /api/ratings/:id` - Cập nhật đánh giá (yêu cầu token)

#### Images (`/api/images`)
- `POST /api/images/upload` - Upload ảnh (yêu cầu token)

### Authentication
Hầu hết các endpoint yêu cầu xác thực. Gửi token trong header:
```
Authorization: Bearer <your_jwt_token>
```

## Cấu trúc Database

### Các bảng chính:

- **User**: Thông tin người dùng (UserID, Username, Password, ProfilePicture, Role)
- **Recipe**: Công thức nấu ăn (RecipeID, RecipeTitle, Description, Price, Difficulty, etc.)
- **Recipe_Ingredient**: Nguyên liệu của công thức
- **Recipe_Instruction**: Hướng dẫn nấu ăn từng bước
- **Rating**: Đánh giá và bình luận
- **Purchase**: Lịch sử mua công thức
- **Cart**: Giỏ hàng
- **Transaction**: Giao dịch thanh toán
- **Transaction_Recipe**: Chi tiết công thức trong giao dịch
- **Image**: Quản lý hình ảnh
- **Recipe_Image**: Liên kết hình ảnh với công thức
- **Nutrition**: Thông tin dinh dưỡng

Xem chi tiết schema trong file `src/config/databaseQueries/insert.pgsql`.

## Deployment

### Deploy lên Render

Xem hướng dẫn chi tiết trong file `renderSetup.md`.

Tóm tắt các bước:
1. Tạo file `render.yaml` (đã có sẵn)
2. Push code lên GitHub
3. Tạo Blueprint trên Render
4. Cấu hình environment variables
5. Khởi tạo database schema
6. Kiểm tra deployment

### Environment Variables cho Production

Trên Render dashboard, thêm các biến môi trường:
- `NODE_ENV=production`
- `JWT_SECRET=<your_secret>`
- `CLOUDINARY_CLOUD_NAME=<your_cloud_name>`
- `CLOUDINARY_API_KEY=<your_api_key>`
- `CLOUDINARY_API_SECRET=<your_api_secret>`

Lưu ý: `DATABASE_URL` được tự động cấu hình bởi Render.

## Bảo mật

- Mật khẩu được hash bằng bcrypt trước khi lưu vào database
- JWT token có thời gian hết hạn
- Xác thực token cho các endpoint bảo mật
- Phân quyền admin cho các chức năng quản trị
- Validation đầu vào để tránh SQL injection
- CORS được cấu hình để kiểm soát truy cập
- File upload được giới hạn kích thước và loại file

## Troubleshooting

### Lỗi kết nối database
- Kiểm tra thông tin kết nối trong `.env`
- Đảm bảo PostgreSQL đang chạy
- Kiểm tra firewall và port

### Lỗi JWT
- Kiểm tra `JWT_SECRET` đã được cấu hình
- Đảm bảo token được gửi đúng format trong header

### Lỗi Cloudinary
- Kiểm tra các thông tin Cloudinary trong `.env`
- Đảm bảo tài khoản Cloudinary còn hoạt động

### Lỗi upload file
- Kiểm tra thư mục `temp/` có tồn tại
- Kiểm tra quyền ghi file
- Kiểm tra giới hạn kích thước file (5MB)

### Port đã được sử dụng
Thay đổi PORT trong `.env` hoặc dừng process đang sử dụng port đó.

## Scripts

- `npm start`: Chạy server ở production mode
- `npm run dev`: Chạy server ở development mode với nodemon

## License

Dự án này được phát triển cho mục đích học tập.

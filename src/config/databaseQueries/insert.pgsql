-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS StudentProgress CASCADE;
DROP TABLE IF EXISTS LessonContent CASCADE;
DROP TABLE IF EXISTS Lesson CASCADE;
DROP TABLE IF EXISTS Module CASCADE;
DROP TABLE IF EXISTS "Order" CASCADE;
DROP TABLE IF EXISTS CourseAccess CASCADE;
DROP TABLE IF EXISTS CartItem CASCADE;
DROP TABLE IF EXISTS CourseReview CASCADE;
DROP TABLE IF EXISTS Course CASCADE;
DROP TABLE IF EXISTS "User" CASCADE;

-- Create Users table with role support
CREATE TABLE "User" (
    UserID SERIAL PRIMARY KEY,
    Username VARCHAR(50) UNIQUE NOT NULL,
    Name VARCHAR(120),
    Email VARCHAR(100) UNIQUE,
    Password VARCHAR(100) NOT NULL,
    ProfilePicture TEXT,
    Role VARCHAR(20) DEFAULT 'user' CHECK (Role IN ('user', 'admin')),
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Courses table (hardcoded by admin through API)
CREATE TABLE Course (
    CourseID SERIAL PRIMARY KEY,
    CourseTitle VARCHAR(255) NOT NULL,
    Description TEXT,
    ThumbNail TEXT,
    Price DECIMAL(10, 2) DEFAULT 0.00,
    Difficulty VARCHAR(20) CHECK (LOWER(Difficulty) IN ('beginner', 'intermediate', 'advanced')),
    Duration INTEGER, -- in minutes (total for all lessons)
    ModuleCount INTEGER DEFAULT 0,
    Category VARCHAR(50),
    ViewCount INTEGER DEFAULT 0,
    PurchaseCount INTEGER DEFAULT 0,
    AverageRating DECIMAL(3, 2) DEFAULT 0.00,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Modules table (groups lessons within a course)
CREATE TABLE Module (
    ModuleID SERIAL PRIMARY KEY,
    CourseID INTEGER REFERENCES Course(CourseID) ON DELETE CASCADE,
    ModuleTitle VARCHAR(255) NOT NULL,
    Description TEXT,
    ModuleOrder INTEGER NOT NULL, -- Position in course
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Lessons table (individual content units)
CREATE TABLE Lesson (
    LessonID SERIAL PRIMARY KEY,
    ModuleID INTEGER REFERENCES Module(ModuleID) ON DELETE CASCADE,
    LessonTitle VARCHAR(255) NOT NULL,
    Description TEXT,
    LessonOrder INTEGER NOT NULL, -- Position in module
    ContentType VARCHAR(20) CHECK (LOWER(ContentType) IN ('article', 'video', 'assignment')),
    DurationMinutes INTEGER, -- For videos
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create LessonContent table (polymorphic content storage)
CREATE TABLE LessonContent (
    ContentID SERIAL PRIMARY KEY,
    LessonID INTEGER REFERENCES Lesson(LessonID) ON DELETE CASCADE,
    ContentType VARCHAR(20) CHECK (LOWER(ContentType) IN ('article', 'video', 'assignment')),
    
    -- Article fields
    ArticleText TEXT,
    
    -- Video fields
    VideoUrl TEXT,
    VideoDuration INTEGER, -- in seconds
    
    -- Assignment fields
    AssignmentQuestions JSONB, -- Array of questions with options
    PassingScore INTEGER DEFAULT 70, -- percentage
    
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(LessonID) -- One content per lesson
);

-- Tracks completion and assignment score per user per lesson.
CREATE TABLE StudentProgress (
    ProgressID SERIAL PRIMARY KEY,
    UserID INTEGER REFERENCES "User"(UserID) ON DELETE CASCADE,
    LessonID INTEGER REFERENCES Lesson(LessonID) ON DELETE CASCADE,
    IsCompleted BOOLEAN DEFAULT FALSE,
    CompletedAt TIMESTAMP,
    Score INTEGER, -- Optional assignment score (any integer)
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(UserID, LessonID) -- One progress record per user per lesson
);

-- Create CourseReview table (students can rate courses they've purchased)
CREATE TABLE CourseReview (
    ReviewID SERIAL PRIMARY KEY,
    CourseID INTEGER REFERENCES Course(CourseID) ON DELETE CASCADE,
    UserID INTEGER REFERENCES "User"(UserID) ON DELETE CASCADE,
    RatingScore INTEGER CHECK (RatingScore >= 1 AND RatingScore <= 5),
    ReviewText TEXT,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(CourseID, UserID) -- One review per user per course
);

-- Final ownership grants after payment approval
CREATE TABLE CourseAccess (
    AccessID SERIAL PRIMARY KEY,
    UserID INTEGER REFERENCES "User"(UserID) ON DELETE CASCADE,
    CourseID INTEGER REFERENCES Course(CourseID) ON DELETE CASCADE,
    Price DECIMAL(10, 2) NOT NULL,
    GrantedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(UserID, CourseID) -- Prevent duplicate purchases
);

-- Pending course selections before checkout
CREATE TABLE CartItem (
    CartID SERIAL PRIMARY KEY,
    UserID INTEGER REFERENCES "User"(UserID) ON DELETE CASCADE,
    CourseID INTEGER REFERENCES Course(CourseID) ON DELETE CASCADE,
    AddedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(UserID, CourseID) -- One entry per course per user
);

-- Checkout/payment records (table name quoted because ORDER is SQL keyword)
CREATE TABLE "Order" (
    OrderID SERIAL PRIMARY KEY,
    UserID INTEGER REFERENCES "User"(UserID) ON DELETE CASCADE,
    TotalAmount DECIMAL(10, 2) NOT NULL,
    Items JSONB NOT NULL DEFAULT '[]'::jsonb, -- [{ courseId, title, thumbnail, price }]
    PaymentMethod VARCHAR(50),
    PaymentProof TEXT, -- URL or text for payment proof
    Status VARCHAR(20) DEFAULT 'pending' CHECK (Status IN ('pending', 'verified', 'rejected')),
    VerifiedAt TIMESTAMP,
    VerifiedBy INTEGER REFERENCES "User"(UserID),
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

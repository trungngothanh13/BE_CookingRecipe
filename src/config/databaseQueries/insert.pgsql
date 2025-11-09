-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS Transaction CASCADE;
DROP TABLE IF EXISTS Purchase CASCADE;
DROP TABLE IF EXISTS Cart CASCADE;
DROP TABLE IF EXISTS Nutrition CASCADE;
DROP TABLE IF EXISTS Recipe_Instruction CASCADE;
DROP TABLE IF EXISTS Recipe_Ingredient CASCADE;
DROP TABLE IF EXISTS Transaction_Recipe CASCADE;
DROP TABLE IF EXISTS Rating CASCADE;
DROP TABLE IF EXISTS Recipe CASCADE;
DROP TABLE IF EXISTS "User" CASCADE;

-- Create Users table with role support
CREATE TABLE "User" (
    UserID SERIAL PRIMARY KEY,
    Username VARCHAR(50) UNIQUE NOT NULL,
    Password VARCHAR(100) NOT NULL,
    ProfilePicture TEXT,
    Role VARCHAR(20) DEFAULT 'user' CHECK (Role IN ('user', 'admin')),
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Recipes table with selling features
CREATE TABLE Recipe (
    RecipeID SERIAL PRIMARY KEY,
    RecipeTitle VARCHAR(255) NOT NULL,
    Description TEXT,
    VideoUrl TEXT,
    VideoThumbnail TEXT,
    Price DECIMAL(10, 2) DEFAULT 0.00,
    IsForSale BOOLEAN DEFAULT true,
    Difficulty VARCHAR(20) CHECK (Difficulty IN ('easy', 'medium', 'hard')),
    CookingTime INTEGER, -- in minutes
    Servings INTEGER,
    Category VARCHAR(50),
    ViewCount INTEGER DEFAULT 0,
    PurchaseCount INTEGER DEFAULT 0,
    UserID INTEGER REFERENCES "User"(UserID) ON DELETE CASCADE,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Recipe_Ingredient table (recipe-specific ingredients with quantities)
CREATE TABLE Recipe_Ingredient (
    RecipeIngredientID SERIAL PRIMARY KEY,
    RecipeID INTEGER REFERENCES Recipe(RecipeID) ON DELETE CASCADE,
    Label VARCHAR(100) NOT NULL,
    Quantity DECIMAL(10, 2),
    Measurement VARCHAR(20)
);

-- Create Recipe_Instruction table (recipe-specific instructions)
CREATE TABLE Recipe_Instruction (
    RecipeInstructionID SERIAL PRIMARY KEY,
    RecipeID INTEGER REFERENCES Recipe(RecipeID) ON DELETE CASCADE,
    Step INTEGER NOT NULL,
    Content TEXT NOT NULL
);

-- Create Rating table (only purchasers can rate)
CREATE TABLE Rating (
    RatingID SERIAL PRIMARY KEY,
    RecipeID INTEGER REFERENCES Recipe(RecipeID) ON DELETE CASCADE,
    UserID INTEGER REFERENCES "User"(UserID) ON DELETE CASCADE,
    RatingScore INTEGER CHECK (RatingScore >= 1 AND RatingScore <= 5),
    Comment TEXT,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(RecipeID, UserID)
);

-- Create Purchase table (tracks recipe purchases)
CREATE TABLE Purchase (
    PurchaseID SERIAL PRIMARY KEY,
    UserID INTEGER REFERENCES "User"(UserID) ON DELETE CASCADE,
    RecipeID INTEGER REFERENCES Recipe(RecipeID) ON DELETE CASCADE,
    Price DECIMAL(10, 2) NOT NULL,
    PurchasedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(UserID, RecipeID) -- Prevent duplicate purchases
);

-- Create Cart table (shopping cart)
CREATE TABLE Cart (
    CartID SERIAL PRIMARY KEY,
    UserID INTEGER REFERENCES "User"(UserID) ON DELETE CASCADE,
    RecipeID INTEGER REFERENCES Recipe(RecipeID) ON DELETE CASCADE,
    AddedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(UserID, RecipeID) -- One entry per recipe per user
);

-- Create Transaction table (payment verification)
CREATE TABLE Transaction (
    TransactionID SERIAL PRIMARY KEY,
    UserID INTEGER REFERENCES "User"(UserID) ON DELETE CASCADE,
    TotalAmount DECIMAL(10, 2) NOT NULL,
    PaymentMethod VARCHAR(50),
    PaymentProof TEXT, -- URL or text for payment proof
    Status VARCHAR(20) DEFAULT 'pending' CHECK (Status IN ('pending', 'verified', 'rejected')),
    AdminNotes TEXT,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    VerifiedAt TIMESTAMP,
    VerifiedBy INTEGER REFERENCES "User"(UserID) ON DELETE SET NULL
);

-- Create Transaction_Recipe junction table (recipes in each transaction)
CREATE TABLE Transaction_Recipe (
    TransactionID INTEGER REFERENCES Transaction(TransactionID) ON DELETE CASCADE,
    RecipeID INTEGER REFERENCES Recipe(RecipeID) ON DELETE CASCADE,
    Price DECIMAL(10, 2) NOT NULL,
    PRIMARY KEY (TransactionID, RecipeID)
);

-- Create Nutrition table (optional nutrition information)
CREATE TABLE Nutrition (
    NutritionID SERIAL PRIMARY KEY,
    RecipeID INTEGER REFERENCES Recipe(RecipeID) ON DELETE CASCADE,
    Type VARCHAR(50) NOT NULL, -- e.g., 'calories', 'protein', 'carbs', 'fat'
    Quantity DECIMAL(10, 2),
    Measurement VARCHAR(20) -- e.g., 'kcal', 'g', 'mg'
);
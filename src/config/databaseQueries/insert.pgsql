-- Ensure custom schema exists and use it
CREATE SCHEMA IF NOT EXISTS "CookingRecipe";
SET search_path TO "CookingRecipe";

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS "User" CASCADE;
DROP TABLE IF EXISTS Ingredient CASCADE;
DROP TABLE IF EXISTS Instruction CASCADE;
DROP TABLE IF EXISTS Recipe CASCADE;
DROP TABLE IF EXISTS Recipe_Ingredient CASCADE;
DROP TABLE IF EXISTS Recipe_Instruction CASCADE;
DROP TABLE IF EXISTS Orders CASCADE;
DROP TABLE IF EXISTS OrderItems CASCADE;
DROP TABLE IF EXISTS UserPurchases CASCADE;


-- Create Users table
CREATE TABLE "User" (
    UserID INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    Username VARCHAR(50) UNIQUE NOT NULL,
    Password VARCHAR(100) NOT NULL, -- Should be hashed
    ProfilePicture TEXT -- URL to image
);

-- Create Ingredients table
CREATE TABLE Ingredient (
    IngredientID INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    Label VARCHAR(100) NOT NULL,
    Quantity DECIMAL(10,2),
    Measurement VARCHAR(20)
);

-- Create Instructions table
CREATE TABLE Instruction (
    InstructionID INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    Step INTEGER NOT NULL,
    Content TEXT NOT NULL
);

-- Create Recipes table
CREATE TABLE Recipe (
    RecipeID INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    RecipeTitle VARCHAR(255) NOT NULL,
    Origin VARCHAR(100),
    Duration INTEGER, -- cooking time in minutes
    Description TEXT,
    UserID INTEGER REFERENCES "User"(UserID) ON DELETE CASCADE,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- New fields for video and selling
    YouTubeVideoID VARCHAR(50), -- YouTube video ID
    VideoThumbnail TEXT, -- YouTube thumbnail URL
    Price DECIMAL(10,2) DEFAULT 0.00, -- Price in USD
    IsForSale BOOLEAN DEFAULT false, -- Whether recipe is for sale
    Difficulty VARCHAR(20) DEFAULT 'Medium', -- Easy, Medium, Hard
    Servings INTEGER DEFAULT 1, -- Number of servings
    Category VARCHAR(50), -- Vietnamese, Asian, Western, Dessert, etc.
    Tags TEXT[], -- Array of tags for better search
    ViewCount INTEGER DEFAULT 0, -- Number of views
    PurchaseCount INTEGER DEFAULT 0 -- Number of purchases
);

-- Create Recipe_Ingredient junction table (many-to-many)
CREATE TABLE Recipe_Ingredient (
    RecipeID INTEGER REFERENCES Recipe(RecipeID) ON DELETE CASCADE,
    IngredientID INTEGER REFERENCES Ingredient(IngredientID) ON DELETE CASCADE,
    PRIMARY KEY (RecipeID, IngredientID)
);

-- Create Recipe_Instruction junction table (many-to-many)
CREATE TABLE Recipe_Instruction (
    RecipeID INTEGER REFERENCES Recipe(RecipeID) ON DELETE CASCADE,
    InstructionID INTEGER REFERENCES Instruction(InstructionID) ON DELETE CASCADE,
    PRIMARY KEY (RecipeID, InstructionID)
);

-- Create Orders table
CREATE TABLE Orders (
    OrderID INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    UserID INTEGER REFERENCES "User"(UserID) ON DELETE CASCADE,
    TotalAmount DECIMAL(10,2) NOT NULL,
    Status VARCHAR(20) DEFAULT 'pending', -- pending, paid, cancelled, refunded
    PaymentMethod VARCHAR(50), -- stripe, paypal, etc.
    PaymentIntentID VARCHAR(255), -- Payment provider transaction ID
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create OrderItems table
CREATE TABLE OrderItems (
    OrderItemID INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    OrderID INTEGER REFERENCES Orders(OrderID) ON DELETE CASCADE,
    RecipeID INTEGER REFERENCES Recipe(RecipeID) ON DELETE CASCADE,
    Price DECIMAL(10,2) NOT NULL, -- Price at time of purchase
    Quantity INTEGER DEFAULT 1,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create UserPurchases table (for tracking what users have bought)
CREATE TABLE UserPurchases (
    PurchaseID INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    UserID INTEGER REFERENCES "User"(UserID) ON DELETE CASCADE,
    RecipeID INTEGER REFERENCES Recipe(RecipeID) ON DELETE CASCADE,
    OrderID INTEGER REFERENCES Orders(OrderID) ON DELETE CASCADE,
    PurchaseDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(UserID, RecipeID) -- One purchase per user per recipe
);
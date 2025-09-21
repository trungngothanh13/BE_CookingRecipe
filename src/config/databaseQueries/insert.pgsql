-- Drop tables if they exist (for clean setup)
DROP TABLE IF EXISTS Recipe_Instruction CASCADE;
DROP TABLE IF EXISTS Recipe_Ingredient CASCADE;
DROP TABLE IF EXISTS Rating CASCADE;
DROP TABLE IF EXISTS Recipe CASCADE;
DROP TABLE IF EXISTS Instruction CASCADE;
DROP TABLE IF EXISTS Ingredient CASCADE;
DROP TABLE IF EXISTS "User" CASCADE;

-- Create Users table
CREATE TABLE "User" (
    UserID SERIAL PRIMARY KEY,
    Username VARCHAR(50) UNIQUE NOT NULL,
    Password VARCHAR(100) NOT NULL, -- Should be hashed
    ProfilePicture TEXT -- URL to image
);

-- Create Ingredients table
CREATE TABLE Ingredient (
    IngredientID SERIAL PRIMARY KEY,
    Label VARCHAR(100) NOT NULL,
    Quantity DECIMAL(10,2),
    Measurement VARCHAR(20)
);

-- Create Instructions table
CREATE TABLE Instruction (
    InstructionID SERIAL PRIMARY KEY,
    Step INTEGER NOT NULL,
    Content TEXT NOT NULL
);

-- Create Recipes table
CREATE TABLE Recipe (
    RecipeID SERIAL PRIMARY KEY,
    RecipeTitle VARCHAR(255) NOT NULL,
    Origin VARCHAR(100),
    Duration INTEGER, -- cooking time in minutes
    Description TEXT,
    UserID INTEGER REFERENCES "User"(UserID) ON DELETE CASCADE,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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

-- Create Rating table
CREATE TABLE Rating (
    RatingID SERIAL PRIMARY KEY,
    RecipeID INTEGER REFERENCES Recipe(RecipeID) ON DELETE CASCADE,
    UserID INTEGER REFERENCES "User"(UserID) ON DELETE CASCADE,
    RatingScore INTEGER CHECK (RatingScore >= 1 AND RatingScore <= 5),
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(RecipeID, UserID) -- One rating per user per recipe
);
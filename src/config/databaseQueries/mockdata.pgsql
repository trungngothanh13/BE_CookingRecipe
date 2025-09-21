-- Insert sample data
INSERT INTO "User" (Username, Password, ProfilePicture) VALUES
('chef_mario', '$2b$10$hashedpassword1', 'https://example.com/mario.jpg'),
('home_cook_anna', '$2b$10$hashedpassword2', 'https://example.com/anna.jpg'),
('spice_master', '$2b$10$hashedpassword3', 'https://example.com/spice.jpg');

INSERT INTO Recipe (RecipeTitle, Origin, Duration, Description, UserID) VALUES
('Spaghetti Carbonara', 'Italian', 20, 'Classic Italian pasta dish with eggs, cheese, and bacon', 1),
('Chicken Curry', 'Indian', 45, 'Spicy and flavorful curry with coconut milk', 2),
('Beef Tacos', 'Mexican', 30, 'Quick and delicious tacos with seasoned ground beef', 1),
('Pad Thai', 'Thai', 25, 'Sweet and tangy stir-fried rice noodles', 3),
('Caesar Salad', 'American', 15, 'Fresh romaine lettuce with creamy Caesar dressing', 2);

INSERT INTO Ingredient (Label, Quantity, Measurement) VALUES
('Spaghetti pasta', 400, 'grams'),
('Eggs', 4, 'pieces'),
('Bacon', 200, 'grams'),
('Parmesan cheese', 100, 'grams'),
('Chicken breast', 500, 'grams'),
('Curry powder', 2, 'tablespoons'),
('Coconut milk', 400, 'ml'),
('Onions', 2, 'pieces'),
('Ground beef', 500, 'grams'),
('Taco shells', 8, 'pieces'),
('Lettuce', 1, 'head'),
('Tomatoes', 2, 'pieces');

INSERT INTO Instruction (Step, Content) VALUES
(1, 'Cook spaghetti according to package instructions until al dente'),
(2, 'In a bowl, whisk eggs with grated Parmesan cheese'),
(3, 'Cook bacon until crispy, then remove excess fat'),
(4, 'Mix hot pasta with egg mixture and bacon'),
(1, 'Cut chicken into bite-sized pieces'),
(2, 'Heat oil in a large pan and cook onions until soft'),
(3, 'Add chicken and cook until golden brown'),
(4, 'Add curry powder and cook for 1 minute'),
(5, 'Pour in coconut milk and simmer for 20 minutes');

-- Link recipes with ingredients
INSERT INTO Recipe_Ingredient (RecipeID, IngredientID) VALUES
(1, 1), (1, 2), (1, 3), (1, 4), -- Carbonara ingredients
(2, 5), (2, 6), (2, 7), (2, 8), -- Curry ingredients
(3, 9), (3, 10), (3, 11), (3, 12); -- Tacos ingredients

-- Link recipes with instructions
INSERT INTO Recipe_Instruction (RecipeID, InstructionID) VALUES
(1, 1), (1, 2), (1, 3), (1, 4), -- Carbonara instructions
(2, 5), (2, 6), (2, 7), (2, 8), (2, 9); -- Curry instructions

-- Insert sample ratings
INSERT INTO Rating (RecipeID, UserID, RatingScore) VALUES
(1, 2, 5), (1, 3, 4),
(2, 1, 4), (2, 3, 5),
(3, 2, 3), (3, 3, 4);




-- Create a view for recipes with average ratings
CREATE VIEW recipe_with_ratings AS
SELECT 
    r.RecipeID,
    r.RecipeTitle,
    r.Origin,
    r.Duration,
    r.Description,
    r.UserID,
    r.CreatedAt,
    r.UpdatedAt,
    COALESCE(ROUND(AVG(rt.RatingScore)::numeric, 2), 0) as AvgRating,
    COUNT(rt.RatingID) as TotalRatings
FROM Recipe r
LEFT JOIN Rating rt ON r.RecipeID = rt.RecipeID
GROUP BY r.RecipeID, r.RecipeTitle, r.Origin, r.Duration, r.Description, r.UserID, r.CreatedAt, r.UpdatedAt;

-- Get all recipes with their average ratings
SELECT * FROM recipe_with_ratings ORDER BY AvgRating DESC;

-- Search recipes by title or origin
SELECT r.*, COALESCE(ROUND(AVG(rt.RatingScore)::numeric, 2), 0) as AvgRating
FROM Recipe r
LEFT JOIN Rating rt ON r.RecipeID = rt.RecipeID
WHERE r.RecipeTitle ILIKE '%curry%' OR r.Origin ILIKE '%indian%'
GROUP BY r.RecipeID;

-- Get recipes by cooking time (quick meals - under 30 minutes)
SELECT * FROM recipe_with_ratings 
WHERE Duration <= 30 
ORDER BY Duration ASC;

-- Get recipes with few ingredients (3 or less)
SELECT r.RecipeTitle, r.Duration, COUNT(ri.IngredientID) as IngredientCount
FROM Recipe r
LEFT JOIN Recipe_Ingredient ri ON r.RecipeID = ri.RecipeID
GROUP BY r.RecipeID, r.RecipeTitle, r.Duration
HAVING COUNT(ri.IngredientID) <= 3
ORDER BY IngredientCount ASC;

-- Get full recipe details including ingredients and instructions
SELECT 
    r.RecipeTitle,
    r.Origin,
    r.Duration,
    r.Description,
    u.Username as CreatedBy,
    STRING_AGG(DISTINCT CONCAT(i.Quantity, ' ', i.Measurement, ' ', i.Label), ', ') as Ingredients,
    STRING_AGG(DISTINCT CONCAT('Step ', inst.Step, ': ', inst.Content), ' | ' ORDER BY inst.Step) as Instructions,
    COALESCE(ROUND(AVG(rt.RatingScore)::numeric, 2), 0) as AvgRating
FROM Recipe r
LEFT JOIN "User" u ON r.UserID = u.UserID
LEFT JOIN Recipe_Ingredient ri ON r.RecipeID = ri.RecipeID
LEFT JOIN Ingredient i ON ri.IngredientID = i.IngredientID
LEFT JOIN Recipe_Instruction rin ON r.RecipeID = rin.RecipeID
LEFT JOIN Instruction inst ON rin.InstructionID = inst.InstructionID
LEFT JOIN Rating rt ON r.RecipeID = rt.RecipeID
WHERE r.RecipeID = 1
GROUP BY r.RecipeID, r.RecipeTitle, r.Origin, r.Duration, r.Description, u.Username;

-- Get user's own recipes
SELECT r.*, COALESCE(ROUND(AVG(rt.RatingScore)::numeric, 2), 0) as AvgRating
FROM Recipe r
LEFT JOIN Rating rt ON r.RecipeID = rt.RecipeID
WHERE r.UserID = 1
GROUP BY r.RecipeID
ORDER BY r.CreatedAt DESC;

-- Get foreign dishes (non-American origin)
SELECT * FROM recipe_with_ratings 
WHERE Origin NOT IN ('American', 'USA') 
ORDER BY AvgRating DESC;

SELECT * FROM "User";
SELECT * FROM Recipe;
SELECT * FROM Ingredient;
SELECT * FROM Instruction;
SELECT * FROM Recipe_Ingredient;
SELECT * FROM Recipe_Instruction;
SELECT * FROM Rating;
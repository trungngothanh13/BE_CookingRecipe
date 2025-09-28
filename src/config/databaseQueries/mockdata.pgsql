-- Insert sample data
-- INSERT INTO "User" (Username, Password) VALUES
-- ('chef_mario', '$2b$10$hashedpassword1'),
-- ('home_cook_anna', '$2b$10$hashedpassword2'),
-- ('spice_master', '$2b$10$hashedpassword3');

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

SELECT * FROM "User";
SELECT * FROM Recipe;
SELECT * FROM Ingredient;
SELECT * FROM Instruction;
SELECT * FROM Image;
SELECT * FROM Rating;
SELECT * FROM Recipe_Ingredient;
SELECT * FROM Recipe_Instruction;
SELECT * FROM Recipe_Image;

-- Insert sample users (UserID order: admin, salsa_man, linguini, trungngothanh13)
-- Passwords (in order of UserID): "adminpassword", "password1", "password2", "Supernegative1"
INSERT INTO "User" (Username, Password, Role) VALUES
('admin', '$2b$10$DbrVlKXmFJf6IXo/jF3l5ONDBF1GWzZ4NC6s79rJNdOEnwdQfE1.S', 'admin'),
('salsa_man', '$2b$10$WetrwTpaUmRmU1ieux92hO4cSO6EKDint6jPJa0GTeNvqzd1Ce1i6', 'user'),
('linguini', '$2b$10$FsnyjyobjqtQ7jBedVP1F.VXqb3J1iBauU2wl.9zjfCoJ.Wxl8qWi', 'user'),
('trungngothanh13', '$2b$10$kSRL9HRPlKCvv6HWJgvMSe40a8LpkxDAG7AbA8686jjwPZYebIlZy', 'user');

-- Insert recipes with pricing and selling features
INSERT INTO Recipe (RecipeTitle, Description, VideoUrl, VideoThumbnail, Price, IsForSale, Difficulty, CookingTime, Servings, Category, ViewCount, PurchaseCount, UserID) VALUES
('Spaghetti Carbonara', 'Classic Italian pasta dish with eggs, cheese, and bacon. Perfect for a quick and delicious dinner.', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'https://example.com/carbonara-thumb.jpg', 9.99, true, 'medium', 20, 4, 'Italian', 150, 45, 1),
('Chicken Curry', 'Spicy and flavorful curry with coconut milk. A traditional Indian dish that will warm your soul.', 'https://www.youtube.com/watch?v=jNQXAC9IVRw', 'https://example.com/curry-thumb.jpg', 12.99, true, 'hard', 45, 6, 'Indian', 200, 78, 1),
('Beef Tacos', 'Quick and delicious tacos with seasoned ground beef. Perfect for family dinners or parties.', 'https://www.youtube.com/watch?v=EJXmH0r6Q8A', 'https://example.com/tacos-thumb.jpg', 7.99, true, 'easy', 30, 4, 'Mexican', 120, 92, 1),
('Pad Thai', 'Sweet and tangy stir-fried rice noodles with shrimp and vegetables. Authentic Thai street food.', 'https://www.youtube.com/watch?v=9bZkp7q19f0', 'https://example.com/padthai-thumb.jpg', 11.99, true, 'medium', 25, 2, 'Thai', 180, 56, 1),
('Caesar Salad', 'Fresh romaine lettuce with creamy Caesar dressing, croutons, and parmesan cheese.', 'https://www.youtube.com/watch?v=kJQP7kiw5Fk', 'https://example.com/salad-thumb.jpg', 6.99, true, 'easy', 15, 2, 'American', 95, 34, 1);

-- Insert recipe ingredients (recipe-specific)
-- Spaghetti Carbonara
INSERT INTO Recipe_Ingredient (RecipeID, Label, Quantity, Measurement) VALUES
(1, 'Spaghetti pasta', 400, 'grams'),
(1, 'Eggs', 4, 'pieces'),
(1, 'Bacon', 200, 'grams'),
(1, 'Parmesan cheese', 100, 'grams'),
(1, 'Black pepper', 1, 'teaspoon');

-- Chicken Curry
INSERT INTO Recipe_Ingredient (RecipeID, Label, Quantity, Measurement) VALUES
(2, 'Chicken breast', 500, 'grams'),
(2, 'Curry powder', 2, 'tablespoons'),
(2, 'Coconut milk', 400, 'ml'),
(2, 'Onions', 2, 'pieces'),
(2, 'Garlic', 4, 'cloves'),
(2, 'Ginger', 1, 'tablespoon');

-- Beef Tacos
INSERT INTO Recipe_Ingredient (RecipeID, Label, Quantity, Measurement) VALUES
(3, 'Ground beef', 500, 'grams'),
(3, 'Taco shells', 8, 'pieces'),
(3, 'Lettuce', 1, 'head'),
(3, 'Tomatoes', 2, 'pieces'),
(3, 'Cheese', 200, 'grams'),
(3, 'Sour cream', 100, 'ml');

-- Pad Thai
INSERT INTO Recipe_Ingredient (RecipeID, Label, Quantity, Measurement) VALUES
(4, 'Rice noodles', 200, 'grams'),
(4, 'Shrimp', 300, 'grams'),
(4, 'Bean sprouts', 100, 'grams'),
(4, 'Eggs', 2, 'pieces'),
(4, 'Fish sauce', 2, 'tablespoons'),
(4, 'Tamarind paste', 1, 'tablespoon');

-- Caesar Salad
INSERT INTO Recipe_Ingredient (RecipeID, Label, Quantity, Measurement) VALUES
(5, 'Romaine lettuce', 1, 'head'),
(5, 'Caesar dressing', 100, 'ml'),
(5, 'Croutons', 50, 'grams'),
(5, 'Parmesan cheese', 50, 'grams');

-- Insert recipe instructions
-- Spaghetti Carbonara
INSERT INTO Recipe_Instruction (RecipeID, Step, Content) VALUES
(1, 1, 'Cook spaghetti according to package instructions until al dente. Drain and set aside, reserving some pasta water.'),
(1, 2, 'In a bowl, whisk eggs with grated Parmesan cheese and black pepper until well combined.'),
(1, 3, 'Cook bacon in a large pan until crispy, then remove excess fat.'),
(1, 4, 'Add hot pasta to the pan with bacon, remove from heat and quickly mix in egg mixture. Add pasta water if needed to create a creamy sauce. Serve immediately.');

-- Chicken Curry
INSERT INTO Recipe_Instruction (RecipeID, Step, Content) VALUES
(2, 1, 'Cut chicken into bite-sized pieces and season with salt and pepper.'),
(2, 2, 'Heat oil in a large pan and cook onions until soft and translucent.'),
(2, 3, 'Add minced garlic and ginger, cook for 1 minute until fragrant.'),
(2, 4, 'Add chicken pieces and cook until golden brown on all sides.'),
(2, 5, 'Add curry powder and cook for 1 minute to release flavors.'),
(2, 6, 'Pour in coconut milk, bring to a boil, then reduce heat and simmer for 20 minutes until chicken is tender. Serve with rice.');

-- Beef Tacos
INSERT INTO Recipe_Instruction (RecipeID, Step, Content) VALUES
(3, 1, 'Heat a large pan over medium-high heat and cook ground beef until browned, breaking it up as it cooks.'),
(3, 2, 'Add taco seasoning and stir well. Cook for an additional 2 minutes.'),
(3, 3, 'Warm taco shells according to package instructions.'),
(3, 4, 'Prepare toppings: shred lettuce, dice tomatoes, and grate cheese.'),
(3, 5, 'Fill each taco shell with beef, then top with lettuce, tomatoes, cheese, and sour cream. Serve immediately.');

-- Pad Thai
INSERT INTO Recipe_Instruction (RecipeID, Step, Content) VALUES
(4, 1, 'Soak rice noodles in warm water for 30 minutes until soft, then drain.'),
(4, 2, 'Heat oil in a wok or large pan and cook shrimp until pink, then remove and set aside.'),
(4, 3, 'Scramble eggs in the same pan and break into small pieces.'),
(4, 4, 'Add noodles, fish sauce, and tamarind paste. Stir-fry for 2 minutes.'),
(4, 5, 'Add shrimp back, along with bean sprouts. Toss everything together and cook for 1 more minute.'),
(4, 6, 'Serve hot with lime wedges and crushed peanuts.');

-- Caesar Salad
INSERT INTO Recipe_Instruction (RecipeID, Step, Content) VALUES
(5, 1, 'Wash and dry romaine lettuce, then chop into bite-sized pieces.'),
(5, 2, 'Place lettuce in a large bowl and add Caesar dressing. Toss to coat evenly.'),
(5, 3, 'Add croutons and grated Parmesan cheese. Toss again gently.'),
(5, 4, 'Serve immediately as a side dish or add grilled chicken for a main course.');

-- Insert sample purchases (users who have bought recipes)
-- salsa_man bought: Carbonara, Tacos
-- linguini bought: Carbonara, Curry, Pad Thai
-- trungngothanh13 bought: Curry, Tacos
INSERT INTO Purchase (UserID, RecipeID, Price) VALUES
(2, 1, 9.99),
(2, 3, 7.99),
(3, 1, 9.99),
(3, 2, 12.99),
(3, 4, 11.99),
(4, 2, 12.99),
(4, 3, 7.99);

-- Insert sample ratings (users who purchased recipes can rate)
-- salsa_man rated: Tacos (5 stars)
-- linguini rated: Curry (4 stars)
-- trungngothanh13 rated: Curry (1 stars)
INSERT INTO Rating (RecipeID, UserID, RatingScore, Comment) VALUES
(3, 2, 5, 'This is a great recipe!'),
(2, 3, 4, 'My son likes it'),
(2, 4, 3, 'Not fond of the taste');

-- Insert sample cart items
-- salsa_man: Pad Thai in cart
-- linguini: Caesar Salad in cart
-- trungngothanh13: Carbonara in cart
INSERT INTO Cart (UserID, RecipeID) VALUES
(2, 4),
(3, 5),
(4, 1);

-- Insert sample transaction (pending payment verification)
-- salsa_man: Transaction 1 (Pad Thai)
-- linguini: Transaction 2 (Caesar Salad)
INSERT INTO Transaction (UserID, TotalAmount, PaymentMethod, PaymentProof, Status) VALUES
(2, 11.99, 'bank_transfer', 'https://example.com/payment-proof-1.jpg', 'pending'),
(3, 6.99, 'paypal', 'https://example.com/payment-proof-2.jpg', 'pending');

-- Link transactions with recipes
INSERT INTO Transaction_Recipe (TransactionID, RecipeID, Price) VALUES
(1, 4, 11.99), -- Transaction 1 (salsa_man): Pad Thai
(2, 5, 6.99); -- Transaction 2 (linguini): Caesar Salad

-- Insert sample nutrition data (optional)
INSERT INTO Nutrition (RecipeID, Type, Quantity, Measurement) VALUES
(1, 'calories', 520, 'kcal'),
(1, 'protein', 25, 'g'),
(1, 'carbs', 65, 'g'),
(1, 'fat', 18, 'g'),
(2, 'calories', 380, 'kcal'),
(2, 'protein', 35, 'g'),
(2, 'carbs', 12, 'g'),
(2, 'fat', 22, 'g'),
(5, 'calories', 180, 'kcal'),
(5, 'protein', 8, 'g'),
(5, 'carbs', 15, 'g'),
(5, 'fat', 12, 'g');



-- Select all TABLES
SELECT * FROM "User";
SELECT * FROM Recipe;
SELECT * FROM Recipe_Ingredient;
SELECT * FROM Recipe_Instruction;
SELECT * FROM Rating;
SELECT * FROM Nutrition;
SELECT * FROM Purchase;
SELECT * FROM Cart;
SELECT * FROM Transaction;
SELECT * FROM Transaction_Recipe;
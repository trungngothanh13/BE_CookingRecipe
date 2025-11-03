-- Insert sample data
SET search_path TO "CookingRecipe";

BEGIN;

-- Reset tables for repeatable runs (local and deploy)
TRUNCATE TABLE
"User",
Recipe,
Ingredient,
Instruction,
Recipe_Ingredient,
Recipe_Instruction,
Orders,
OrderItems,
UserPurchases
RESTART IDENTITY CASCADE;

-- Insert sample users (dev-only password placeholders)
INSERT INTO "User" (Username, Password) VALUES
('chef_Trung', 'chef123'),
('chef_Tuan', 'chef123');

-- Insert featured recipes matching FE Home.tsx
INSERT INTO Recipe (
  RecipeTitle, Origin, Duration, Description, UserID,
  YouTubeVideoID, VideoThumbnail, Price, IsForSale,
  Difficulty, Servings, Category, ViewCount, PurchaseCount
) VALUES
('BÚN CHẢ', 'Vietnam', 120, 'Traditional Vietnamese grilled pork with vermicelli and herbs', 1,
  'V37douhyx_0', 'https://img.youtube.com/vi/V37douhyx_0/maxresdefault.jpg', 9.99, TRUE,
  'Medium', 4, 'Vietnamese', 156, 0),
('CƠM TẤM', 'Vietnam', 120, 'Classic broken rice with grilled pork chop and accompaniments', 2,
  'P50LW8SzfXQ', 'https://img.youtube.com/vi/P50LW8SzfXQ/maxresdefault.jpg', 9.99, TRUE,
  'Medium', 4, 'Vietnamese', 320, 0),
('GIẢ CẦY', 'Vietnam', 90, 'Vietnamese-style mock dog stew with aromatic spices', 1,
  'S-fBig2UEvA', 'https://img.youtube.com/vi/S-fBig2UEvA/maxresdefault.jpg', 7.99, TRUE,
  'Medium', 4, 'Vietnamese', 210, 0),
('ẾCH ĐỒNG NƯỚNG NGHỆ', 'Vietnam', 30, 'Grilled field frog with turmeric, a rustic Vietnamese specialty', 2,
  '4BvbfoMT4SA', 'https://img.youtube.com/vi/4BvbfoMT4SA/maxresdefault.jpg', 4.99, TRUE,
  'Easy', 4, 'Vietnamese', 145, 0),
('XỐT CHẤM HẢI SẢN VÀ THỊT NƯỚNG', 'Vietnam', 20, 'Signature Vietnamese dipping sauce for seafood and BBQ', 1,
  'LU6nK8Kn-tE', 'https://img.youtube.com/vi/LU6nK8Kn-tE/maxresdefault.jpg', 2.99, TRUE,
  'Easy', 4, 'Vietnamese', 98, 0),
('GIÒ HEO CHIÊN MẮM GIÒN TAN', 'Vietnam', 180, 'Crispy deep-fried pork knuckle glazed with fish sauce', 2,
  'eV9U9CVCGlI', 'https://img.youtube.com/vi/eV9U9CVCGlI/maxresdefault.jpg', 12.99, TRUE,
  'Hard', 4, 'Vietnamese', 180, 0),
('PHỞ BÒ', 'Vietnam', 300, 'Iconic Vietnamese beef noodle soup with aromatic broth', 1,
  '6YlPZWMjQCE', 'https://img.youtube.com/vi/6YlPZWMjQCE/maxresdefault.jpg', 19.99, TRUE,
  'Hard', 4, 'Vietnamese', 540, 0),
('MIẾN LƯƠNG', 'Vietnam', 90, 'Vietnamese eel glass noodle soup, rich and flavorful', 2,
  '86oXUJNszjQ', 'https://img.youtube.com/vi/86oXUJNszjQ/maxresdefault.jpg', 7.99, TRUE,
  'Medium', 4, 'Vietnamese', 260, 0),
('NEM THÍNH', 'Vietnam', 90, 'Fermented pork roll with toasted rice powder and herbs', 1,
  'CpsqnvGzC-w', 'https://img.youtube.com/vi/CpsqnvGzC-w/maxresdefault.jpg', 4.99, TRUE,
  'Medium', 4, 'Vietnamese', 100, 0);

-- Seed Ingredients for 9 featured Vietnamese recipes
INSERT INTO Ingredient (Label, Quantity, Measurement) VALUES
-- 1 BÚN CHẢ
('Pork belly', NULL, NULL),
('Ground pork', NULL, NULL),
('Fish sauce', NULL, NULL),
('Vermicelli noodles (bún)', NULL, NULL),
('Mixed herbs', NULL, NULL),
-- 2 CƠM TẤM
('Pork chops', NULL, NULL),
('Broken rice', NULL, NULL),
('Pork skin (bì)', NULL, NULL),
('Chả trứng', NULL, NULL),
-- 3 GIẢ CẦY
('Pork trotters', NULL, NULL),
('Galangal', NULL, NULL),
('Fermented rice (mẻ)', NULL, NULL),
('Shrimp paste (mắm tôm)', NULL, NULL),
-- 4 ẾCH ĐỒNG NƯỚNG NGHỆ
('Frog meat', NULL, NULL),
('Turmeric', NULL, NULL),
('Garlic', NULL, NULL),
-- 5 XỐT CHẤM HẢI SẢN VÀ THỊT NƯỚNG
('Green chilies', NULL, NULL),
('Lime juice', NULL, NULL),
('Salt & sugar', NULL, NULL),
-- 6 GIÒ HEO CHIÊN MẮM GIÒN TAN
('Pork knuckle', NULL, NULL),
('Fish sauce (for glaze)', NULL, NULL),
('Garlic & shallots', NULL, NULL),
-- 7 PHỞ BÒ
('Beef bones', NULL, NULL),
('Pho noodles', NULL, NULL),
('Cinnamon & star anise', NULL, NULL),
-- 8 MIẾN LƯƠNG
('Eel', NULL, NULL),
('Vermicelli (miến)', NULL, NULL),
('Turmeric & shallots', NULL, NULL),
-- 9 NEM THÍNH
('Boiled pork', NULL, NULL),
('Pork skin', NULL, NULL),
('Toasted rice powder (thính)', NULL, NULL);

-- Seed Instructions for 9 featured recipes
INSERT INTO Instruction (Step, Content) VALUES
-- 1 BÚN CHẢ (4 steps)
(1, 'Slice pork belly; season ground pork; marinate 1 hour'),
(2, 'Shape patties and grill pork belly and patties until golden'),
(3, 'Mix dipping sauce and add pickles'),
(4, 'Serve with bún, herbs, and dipping sauce'),
-- 2 CƠM TẤM (5 steps)
(1, 'Cook broken rice with proper water ratio'),
(2, 'Tenderize and marinate pork chops; grill over charcoal'),
(3, 'Make bì: boil skin, slice, toss with pork and toasted rice powder'),
(4, 'Steam chả trứng 25–30 minutes; glaze with yolk'),
(5, 'Mix sweet fish sauce; assemble and serve'),
-- 3 GIẢ CẦY (4 steps)
(1, 'Grill trotters lightly; cut to pieces'),
(2, 'Marinate with aromatics, mẻ, mắm tôm, turmeric, fish sauce, seasonings'),
(3, 'Sear marinated pork; add liquid; simmer 45–60 minutes'),
(4, 'Adjust seasoning; serve hot with noodles or rice'),
-- 4 ẾCH ĐỒNG (4 steps)
(1, 'Clean and cut frog to bite-size'),
(2, 'Marinate with turmeric, aromatics, and seasonings 20–30 minutes'),
(3, 'Grill over charcoal until cooked and slightly charred'),
(4, 'Serve hot with herbs or dipping sauce'),
-- 5 XỐT CHẤM (3 steps)
(1, 'Blend green chili sauce ingredients until smooth; chill 1 hour'),
(2, 'Mix salt, pepper, lime juice, chili for muối tiêu chanh'),
(3, 'Serve with seafood/meats'),
-- 6 GIÒ HEO (4 steps)
(1, 'Clean/blanch knuckle; boil until just cooked; ice-bath; dry thoroughly'),
(2, 'Deep-fry until golden and crisp'),
(3, 'Sauté aromatics; make fish sauce-sugar glaze'),
(4, 'Toss knuckle to coat; chop and serve immediately'),
-- 7 PHỞ BÒ (3 steps)
(1, 'Simmer beef bones with spices for clear, rich broth'),
(2, 'Prepare noodles and beef cuts; assemble with garnishes'),
(3, 'Season with lime and chili to taste'),
-- 8 MIẾN LƯƠNG (2 steps)
(1, 'Clean eel; choose fry, steam, or marinate & grill method'),
(2, 'Prepare miến and broth/sauce; assemble with eel and herbs'),
-- 9 NEM THÍNH (3 steps)
(1, 'Boil and slice pork; slice skin'),
(2, 'Coat pork with toasted rice powder'),
(3, 'Serve with fresh herbs and fish sauce-garlic-chili dipping');

-- Link recipes with ingredients (IDs are sequential from above inserts)
-- Ingredient IDs mapping start at 1 in the order inserted

INSERT INTO Recipe_Ingredient (RecipeID, IngredientID) VALUES
-- 1 BÚN CHẢ uses 1..5
(1, 1), (1, 2), (1, 3), (1, 4), (1, 5),
-- 2 CƠM TẤM uses 6..9
(2, 6), (2, 7), (2, 8), (2, 9),
-- 3 GIẢ CẦY uses 10..13
(3, 10), (3, 11), (3, 12), (3, 13),
-- 4 ẾCH ĐỒNG uses 14..16
(4, 14), (4, 15), (4, 16),
-- 5 XỐT CHẤM uses 17..19
(5, 17), (5, 18), (5, 19),
-- 6 GIÒ HEO uses 20..22
(6, 20), (6, 21), (6, 22),
-- 7 PHỞ BÒ uses 23..25
(7, 23), (7, 24), (7, 25),
-- 8 MIẾN LƯƠNG uses 26..28
(8, 26), (8, 27), (8, 28),
-- 9 NEM THÍNH uses 29..31
(9, 29), (9, 30), (9, 31)
ON CONFLICT (RecipeID, IngredientID) DO NOTHING;

-- Link recipes with instructions (IDs are sequential from above inserts)
-- Calculate instruction ID ranges:
-- 1 BÚN CHẢ: 1-4, 2 CƠM TẤM: 5-9, 3 GIẢ CẦY: 10-13, 4 ẾCH: 14-17,
-- 5 XỐT CHẤM: 18-20, 6 GIÒ HEO: 21-24, 7 PHỞ BÒ: 25-27, 8 MIẾN: 28-29, 9 NEM THÍNH: 30-32

INSERT INTO Recipe_Instruction (RecipeID, InstructionID) VALUES
(1, 1), (1, 2), (1, 3), (1, 4),
(2, 5), (2, 6), (2, 7), (2, 8), (2, 9),
(3, 10), (3, 11), (3, 12), (3, 13),
(4, 14), (4, 15), (4, 16), (4, 17),
(5, 18), (5, 19), (5, 20),
(6, 21), (6, 22), (6, 23), (6, 24),
(7, 25), (7, 26), (7, 27),
(8, 28), (8, 29),
(9, 30), (9, 31), (9, 32)
ON CONFLICT (RecipeID, InstructionID) DO NOTHING;

COMMIT;

SELECT * FROM "User";
SELECT * FROM Recipe;
SELECT * FROM Ingredient;
SELECT * FROM Instruction;
SELECT * FROM Recipe_Ingredient;
SELECT * FROM Recipe_Instruction;

-- Insert sample users
-- Passwords: "adminpassword", "student1password", "student2password"
INSERT INTO "User" (Username, Email, Password, Role) VALUES
('admin', 'admin@cookingcourse.com', '$2b$10$DbrVlKXmFJf6IXo/jF3l5ONDBF1GWzZ4NC6s79rJNdOEnwdQfE1.S', 'admin'),
('student_john', 'john@example.com', '$2b$10$FsnyjyobjqtQ7jBedVP1F.VXqb3J1iBauU2wl.9zjfCoJ.Wxl8qWi', 'user'),
('student_sarah', 'sarah@example.com', '$2b$10$kSRL9HRPlKCvv6HWJgvMSe40a8LpkxDAG7AbA8686jjwPZYebIlZy', 'user');

-- Insert sample courses (admin-managed, hardcoded in system)
-- Course 1: Italian Pasta Fundamentals
-- Course 2: Thai Street Food Mastery
INSERT INTO Course (CourseTitle, Description, ThumbNail, Price, Difficulty, Duration, LessonCount, Category, ViewCount, PurchaseCount, AverageRating) VALUES
('Italian Pasta Fundamentals', 'Learn the art of making perfect pasta from scratch. This beginner-friendly course covers pasta basics, sauce pairing, and classic Italian recipes.', 'https://example.com/pasta-thumb.jpg', 49.99, 'beginner', 180, 6, 'Italian', 523, 42, 4.5),
('Thai Street Food Mastery', 'Master authentic Thai cooking techniques and create restaurant-quality dishes at home. Includes knife skills, traditional ingredients, and signature recipes.', 'https://example.com/thai-thumb.jpg', 59.99, 'intermediate', 240, 8, 'Thai', 287, 18, 4.8);

-- Insert modules for Course 1 (Italian Pasta)
-- Module 1: Pasta Basics
INSERT INTO Module (CourseID, ModuleTitle, Description, ModuleOrder) VALUES
(1, 'Pasta Basics', 'Learn the fundamentals of pasta making: types, ingredients, and preparation', 1),
(1, 'Sauces & Pairings', 'Discover how to make traditional Italian sauces and pair them perfectly', 2),
(1, 'Classic Recipes', 'Master iconic Italian pasta dishes', 3);

-- Insert modules for Course 2 (Thai Food)
-- Module 1: Thai Fundamentals
INSERT INTO Module (CourseID, ModuleTitle, Description, ModuleOrder) VALUES
(2, 'Thai Fundamentals', 'Introduction to Thai cuisine, ingredients, and cooking methods', 1),
(2, 'Knife Skills & Prep', 'Traditional Thai knife techniques and ingredient preparation', 2),
(2, 'Signature Dishes', 'Learn to cook authentic Thai street food favorites', 3);

-- Insert lessons for Course 1, Module 1 (Pasta Basics)
INSERT INTO Lesson (ModuleID, LessonTitle, Description, LessonOrder, ContentType, DurationMinutes) VALUES
(1, 'Types of Pasta', 'Understand different pasta shapes and their uses', 1, 'video', 15),
(1, 'Making Fresh Pasta Dough', 'Step-by-step guide to creating pasta dough from scratch', 2, 'article', 0),
(1, 'Pasta Shaping Techniques', 'Learn various methods to shape pasta at home', 3, 'video', 20);

-- Insert lessons for Course 1, Module 2 (Sauces)
INSERT INTO Lesson (ModuleID, LessonTitle, Description, LessonOrder, ContentType, DurationMinutes) VALUES
(2, 'Tomato-Based Sauces', 'Create authentic Italian tomato sauces', 1, 'video', 25),
(2, 'Cream Sauces', 'Master creamy sauces like carbonara and alfredo', 2, 'article', 0);

-- Insert lessons for Course 1, Module 3 (Recipes)
INSERT INTO Lesson (ModuleID, LessonTitle, Description, LessonOrder, ContentType, DurationMinutes) VALUES
(3, 'Spaghetti Carbonara Challenge', 'Test your skills with this classic recipe', 1, 'assignment', 0);

-- Insert lessons for Course 2, Module 1 (Thai Fundamentals)
INSERT INTO Lesson (ModuleID, LessonTitle, Description, LessonOrder, ContentType, DurationMinutes) VALUES
(4, 'Introduction to Thai Flavors', 'Explore the balance of sweet, sour, salty, and spicy', 1, 'video', 18),
(4, 'Essential Thai Ingredients', 'Learn about staple ingredients used in Thai cooking', 2, 'article', 0);

-- Insert lessons for Course 2, Module 2 (Knife Skills)
INSERT INTO Lesson (ModuleID, LessonTitle, Description, LessonOrder, ContentType, DurationMinutes) VALUES
(5, 'Thai Knife Techniques', 'Master the proper knife grip and cutting techniques', 1, 'video', 22),
(5, 'Ingredient Prep Guide', 'Learn how to prepare common Thai ingredients correctly', 2, 'article', 0);

-- Insert lessons for Course 2, Module 3 (Dishes)
INSERT INTO Lesson (ModuleID, LessonTitle, Description, LessonOrder, ContentType, DurationMinutes) VALUES
(6, 'Pad Thai Mastery', 'Learn to cook the most iconic Thai street food', 1, 'video', 30),
(6, 'Green Curry from Scratch', 'Make authentic green curry paste and curry dish', 2, 'video', 28),
(6, 'Thai Cooking Quiz', 'Test your knowledge with this 10-question quiz', 3, 'assignment', 0);

-- Insert content for video lessons (Course 1)
INSERT INTO LessonContent (LessonID, ContentType, VideoUrl, VideoDuration) VALUES
(1, 'video', 'https://youtube.com/watch?v=pasta-types', 900),
(3, 'video', 'https://youtube.com/watch?v=pasta-shaping', 1200);

-- Insert content for article lessons (Course 1)
INSERT INTO LessonContent (LessonID, ContentType, ArticleText) VALUES
(2, 'article', '<h2>Making Fresh Pasta Dough</h2><p>Fresh pasta begins with the right ratio of flour to eggs...</p><p>The traditional ratio is 100g of flour per egg...</p>'),
(4, 'video', 'https://youtube.com/watch?v=tomato-sauce', 1500),
(5, 'article', '<h2>Cream Sauces</h2><p>Authentic Italian cream sauces require patience and technique...</p>');

-- Insert content for video lessons (Course 2)
INSERT INTO LessonContent (LessonID, ContentType, VideoUrl, VideoDuration) VALUES
(7, 'video', 'https://youtube.com/watch?v=thai-flavors', 1080),
(9, 'video', 'https://youtube.com/watch?v=knife-techniques', 1320),
(11, 'video', 'https://youtube.com/watch?v=pad-thai', 1800),
(12, 'video', 'https://youtube.com/watch?v=green-curry', 1680);

-- Insert content for article lessons (Course 2)
INSERT INTO LessonContent (LessonID, ContentType, ArticleText) VALUES
(8, 'article', '<h2>Essential Thai Ingredients</h2><p>Thai cuisines relies on a specific set of flavoring ingredients...</p><p>Key items include fish sauce, lime leaves, and Thai basil...</p>'),
(10, 'article', '<h2>Ingredient Prep Guide</h2><p>Proper preparation of ingredients is crucial in Thai cooking...</p>');

-- Insert assignment content
INSERT INTO LessonContent (LessonID, ContentType, AssignmentQuestions, PassingScore) VALUES
(6, 'assignment', '[{"question":"What is the main ingredient in carbonara sauce?","options":["Cream","Eggs and bacon","Garlic","Olive oil"],"correct":1},{"question":"How long should pasta be cooked for al dente?","options":["5-7 minutes","8-10 minutes","12-15 minutes","2-3 minutes"],"correct":1}]'::jsonb, 70),
(13, 'assignment', '[{"question":"What are the 4 main flavors in Thai cuisine?","options":["Sweet, salty, sour, spicy","Hot, mild, fresh, dried","Light, heavy, tangy, smooth","Mild, medium, hot, extreme"],"correct":0},{"question":"What is the traditional name of the green curry paste?","options":["Kreng Green","Nam Prik Gaeng Keow","Sauce Vert","Thai Green Mix"],"correct":1},{"question":"Which ingredient is essential to Thai cooking?","options":["Soy sauce","Fish sauce","Worcestershire sauce","Hot sauce"],"correct":1}]'::jsonb, 75);

-- Insert purchases (users have bought courses)
-- student_john (UserID 2): Purchased Italian Pasta, considering Thai Street Food
-- student_sarah (UserID 3): Purchased Thai Street Food, considering Italian Pasta
INSERT INTO Purchase (UserID, CourseID, Price) VALUES
(2, 1, 49.99),
(3, 2, 59.99);

-- Insert cart items
-- student_john (UserID 2): Thai Street Food (considering)
-- student_sarah (UserID 3): Italian Pasta (considering)
INSERT INTO Cart (UserID, CourseID) VALUES
(2, 2),
(3, 1);

-- Insert course reviews
INSERT INTO CourseReview (CourseID, UserID, RatingScore, ReviewText) VALUES
(1, 2, 5, 'Excellent course! The recipes are authentic. I made carbonara for dinner and it was perfect!'),
(2, 3, 5, 'Amazing! The knife techniques section was especially helpful. I feel much more confident cooking Thai food now.');

-- Insert student progress (student_john is taking Italian Pasta course)
INSERT INTO StudentProgress (UserID, LessonID, IsCompleted, CompletedAt, Score) VALUES
(2, 1, true, NOW() - INTERVAL '2 days', NULL),
(2, 2, true, NOW() - INTERVAL '1 day', NULL),
(2, 3, true, NOW(), NULL),
(2, 4, false, NULL, NULL);

-- Insert student progress (student_sarah is taking Thai Street Food course)
INSERT INTO StudentProgress (UserID, LessonID, IsCompleted, CompletedAt, Score) VALUES
(3, 7, true, NOW() - INTERVAL '5 days', NULL),
(3, 8, true, NOW() - INTERVAL '4 days', NULL),
(3, 9, true, NOW() - INTERVAL '3 days', NULL),
(3, 10, true, NOW() - INTERVAL '2 days', NULL),
(3, 11, true, NOW() - INTERVAL '1 day', NULL),
(3, 12, true, NOW(), 85),
(3, 13, false, NULL, NULL);

-- Insert sample transactions (payment for course purchases)
INSERT INTO Transaction (UserID, TotalAmount, PaymentMethod, PaymentProof, Status) VALUES
(2, 49.99, 'credit_card', 'https://example.com/payment-proof-1.jpg', 'verified'),
(3, 59.99, 'paypal', 'https://example.com/payment-proof-2.jpg', 'verified');

-- Display sample data
SELECT 'Users' as Table_Name; SELECT * FROM "User";
SELECT 'Courses' as Table_Name; SELECT * FROM Course;
SELECT 'Modules' as Table_Name; SELECT * FROM Module;
SELECT 'Lessons' as Table_Name; SELECT * FROM Lesson;
SELECT 'Lesson Content' as Table_Name; SELECT LessonID, ContentType FROM LessonContent;
SELECT 'Student Progress' as Table_Name; SELECT * FROM StudentProgress;
SELECT 'Course Reviews' as Table_Name; SELECT * FROM CourseReview;
SELECT 'Purchases' as Table_Name; SELECT * FROM Purchase;
SELECT 'Cart' as Table_Name; SELECT * FROM Cart;
SELECT 'Transactions' as Table_Name; SELECT * FROM Transaction;
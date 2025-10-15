-- Make the current user an admin by updating their profile
UPDATE profiles SET role = 'admin' WHERE email = 'jeffgus@gmail.com';
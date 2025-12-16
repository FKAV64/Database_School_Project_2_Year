USE TestBankasi;
GO

-- =============================================
-- LEVEL 0: The Foundation (No Foreign Keys)
-- =============================================
INSERT INTO Rol (RolAdi) VALUES ('Admin'), ('Ogretmen'), ('Ogrenci');
INSERT INTO ZorlukSeviye (ZorlukAdi) VALUES ('Kolay'), ('Orta'), ('Zor');
INSERT INTO Kurum (KurumAdi) VALUES ('Fen Lisesi'), ('Anadolu Lisesi');

-- =============================================
-- LEVEL 1: Users & Education Hierarchy
-- =============================================
-- Note: '1' assumes 'Admin' was the first row inserted above.
INSERT INTO Kullanici (RolID, Ad, Soyad, DogumTarihi, Email, Sifre) VALUES
(1, 'Ali', 'Yilmaz', '2000-01-01', 'ali@test.com', 'hashed_pass_123'),
(2, 'Ahmet', 'Gul', '2003-06-01', 'ahmet@test.com', 'hashed_pass_163'), 
(3, 'Mehmet', 'Ogrenci', '2005-01-01', 'mehmet@student.com', '12345');


-- Insert Grades for 'Fen Lisesi' (Assuming ID 1)
INSERT INTO EgitimSeviye (KurumID, SeviyeAdi, SeviyeSira) VALUES 
(1, '9. Sinif', 9),
(1, '10. Sinif', 10);

-- =============================================
-- LEVEL 2: Lessons & Topics
-- =============================================
-- Insert Math for 9. Sinif (Assuming ID 1)
INSERT INTO Ders (SeviyeID, DersAdi) VALUES (1, 'Matematik');

-- Insert Topics for Math (Assuming DersID 1)
INSERT INTO Konu (DersID, KonuAdi) VALUES 
(1, 'Kümeler'),   -- KonuID 1
(1, 'Denklemler'); -- KonuID 2

-- =============================================
-- LEVEL 3 & 4: Questions & Options
-- =============================================
-- Question 1: Easy Question on "Kümeler" (Topic 1)
INSERT INTO Soru (KonuID, ZorlukID, SoruMetin)VALUES
(1, 1, 'A = {1,2}, s(A) kactir?'),
(2, 2, 'A = {1,2,3}, s(A) kactir?');
-- Options for Question 1 (Assuming SoruID 1)
INSERT INTO SoruSecenek (SoruID, SecenekMetin, DogruMu) VALUES 
(1, '1', 0),
(1, '2', 1), -- Correct Answer
(1, '3', 0),
(1, '4', 0),
(2, '1', 0),
(2, '2', 0), 
(2, '3', 1),-- Correct Answer
(2, '4', 0);

-- =============================================
-- LEVEL 5: EXAM SCENARIOS (The Critical Test)
-- =============================================

-- CASE 1: Specific Exam (Algebra Only)
-- This follows "Strict 3NF". We know the Lesson, Topic, and Difficulty.
INSERT INTO TestOturum (KullaniciID, DersID, KonuID, ZorlukID, BaslaZaman) 
VALUES (1, 1, 1, 1, GETDATE()); 

-- CASE 2: The "General" Exam (Logic Test)
-- User wants a "Math Practice" exam. NO specific topic, NO specific difficulty.
-- This inserts NULL into KonuID and ZorlukID.
INSERT INTO TestOturum (KullaniciID, DersID, KonuID, ZorlukID, BaslaZaman) 
VALUES (1, 1, NULL, NULL, GETDATE());

-- =============================================
-- LEVEL 6: User Answers
-- =============================================
-- User answers Question 1 in Session 1
INSERT INTO KullaniciTestSoru (OturumID, SoruID, SecenekID, SoruSira)VALUES
(1, 1, 2, 1), -- Selected Option 2 (Correct)
(2, 1, 2, 1),
(2, 2, 7, 2);
PRINT 'Data Seeded Successfully';
GO


-- 1. Restore Question 1 (Undelete it for testing purposes)
--UPDATE Soru SET SilinmeTarihi = NULL WHERE SoruID = 1;

-- 2. Add New Questions for "Kümeler" (Topic 1)
INSERT INTO Soru (KonuID, ZorlukID, SoruMetin) VALUES 
(1, 1, 'Kümeler Soru 3 (Kolay)'),
(1, 2, 'Kümeler Soru 4 (Orta)');

-- 3. Add New Questions for "Denklemler" (Topic 2)
INSERT INTO Soru (KonuID, ZorlukID, SoruMetin) VALUES 
(2, 1, 'Denklemler Soru 3 (Kolay)'),
(2, 3, 'Denklemler Soru 4 (Zor)');

-- 4. Add Options for these new questions (Required for integrity)
-- We insert dummy options just so the FK constraints don't complain later
INSERT INTO SoruSecenek (SoruID, SecenekMetin, DogruMu)
SELECT SoruID, 'Option A', 1 FROM Soru WHERE SoruID > 2;

/*EXEC sp_BaslatSinav 
    @KullaniciID = 2, 
    @DersID = 1, 
    @KonuListesi = NULL,  -- <--- The Application sends this string
    @ZorlukID = NULL, 
    @SoruSayisi = 2, 
    @SureDakika = 30;
EXEC sp_BaslatSinav 
    @KullaniciID = 2, 
    @DersID = 1, 
    @KonuListesi = NULL, 
    @ZorlukID = NULL, 
    @SoruSayisi = 2, 
    @SureDakika = 30;*/

 --All the topics done in a particular quiz
SELECT DISTINCT K.KonuAdi
FROM KullaniciTestSoru KTS
INNER JOIN Soru S ON KTS.SoruID = S.SoruID
INNER JOIN Konu K ON S.KonuID = K.KonuID
WHERE KTS.OturumID = 2; -- The ID of the "General Exam"s
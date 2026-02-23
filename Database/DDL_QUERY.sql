CREATE DATABASE TestBankasi;
GO
USE TestBankasi;
GO

-- =============================================
-- 1. LEVEL 0 TABLES (No dependencies)
-- =============================================

CREATE TABLE Rol(
    RolID INT PRIMARY KEY IDENTITY(1,1),
    RolAdi NVARCHAR(20)
);

CREATE TABLE Kurum(
    KurumID INT PRIMARY KEY IDENTITY(1,1),
    KurumAdi NVARCHAR(100)
);

CREATE TABLE ZorlukSeviye(
    ZorlukID INT PRIMARY KEY IDENTITY(1,1),
    ZorlukAdi NVARCHAR(20)
);


-- =============================================
-- 2. LEVEL 1 TABLES
-- =============================================

CREATE TABLE Kullanici(
    KullaniciID INT PRIMARY KEY IDENTITY(1,1),
    RolID INT NOT NULL,
    Ad NVARCHAR(100) NOT NULL,
    Soyad NVARCHAR(100) NOT NULL,
    DogumTarihi DATE NOT NULL,
    -- UNIQUE automatically creates a nonclustered index which will help us during user logins
    Email NVARCHAR(100) NOT NULL UNIQUE,
    Sifre NVARCHAR(225) NOT NULL,
    SeviyeID INT NOT NULL,
    CONSTRAINT FK_Rol_Kullanici FOREIGN KEY(RolID) REFERENCES Rol(RolID),
    CONSTRAINT FK_Kullanici_Seviye FOREIGN KEY (SeviyeID) REFERENCES EgitimSeviye(SeviyeID)
);

CREATE TABLE EgitimSeviye(
    SeviyeID INT PRIMARY KEY IDENTITY(1,1),
    KurumID INT NOT NULL,
    SeviyeAdi NVARCHAR(50) NOT NULL,
    SeviyeSira INT NOT NULL,
    CONSTRAINT FK_Kurum_EgitimSeviye FOREIGN KEY(KurumID)
    REFERENCES Kurum(KurumID) ON DELETE CASCADE,
    CONSTRAINT UQ_kurum_sira UNIQUE (KurumID,SeviyeSira)
);

-- =============================================
-- 3. LEVEL 2 TABLES
-- =============================================

CREATE TABLE Ders(
    DersID INT PRIMARY KEY IDENTITY(1,1),
    SeviyeID INT NOT NULL,
    DersAdi NVARCHAR(50) NOT NULL,
    -- CRITICAL FOR HISTORY: We do not delete questions. We archive them.
    SilinmeTarihi DATETIME DEFAULT NULL,
    -- To avoid having lesson having the name in the same level.
    CONSTRAINT UQ_SeviyeID_DersAdi UNIQUE(SeviyeID, DersAdi),

    CONSTRAINT FK_EgitimSeviye_Ders FOREIGN KEY(SeviyeID)
    REFERENCES EgitimSeviye(SeviyeID) ON DELETE CASCADE
);
CREATE TABLE Konu(
    KonuID INT PRIMARY KEY IDENTITY(1,1),
    DersID INT NOT NULL,
    KonuAdi NVARCHAR(100) NOT NULL,
    SilinmeTarihi DATETIME DEFAULT NULL,
    -- This creates a unique identifier using both ID and ParentID, allowing TestOturum table to validate the link.
    CONSTRAINT UQ_Konu_Ders_Integrity UNIQUE(KonuID, DersID),

    CONSTRAINT FK_Ders_Konu FOREIGN KEY(DersID)
    REFERENCES Ders(DersID) ON DELETE CASCADE
);

-- =============================================
-- 4. LEVEL 3 TABLES (The Question Bank)
-- =============================================

CREATE TABLE Soru(
    SoruID INT PRIMARY KEY IDENTITY(1,1),
    KonuID INT NOT NULL,
    ZorlukID INT NOT NULL,
    SoruMetin NVARCHAR(500),
    SilinmeTarihi DATETIME DEFAULT NULL,
    CONSTRAINT FK_Konular_Soru FOREIGN KEY(KonuID)
    REFERENCES Konu(KonuID) ON DELETE CASCADE,

    CONSTRAINT FK_ZorlukSeviye_Soru FOREIGN KEY(ZorlukID)
    REFERENCES ZorlukSeviye(ZorlukID) ON DELETE NO ACTION
);

-- =============================================
-- 5. LEVEL 4 TABLES (Options)
-- =============================================

CREATE TABLE SoruSecenek(
    SecenekID INT PRIMARY KEY IDENTITY(1,1),
    SoruID INT NOT NULL,
    SecenekMetin NVARCHAR(500),
    DogruMu BIT, -- 1 = Correct Answer, 0 = Distractor
    SilinmeTarihi DATETIME DEFAULT NULL,
    CONSTRAINT FK_Soru_SoruSecenek FOREIGN KEY(SoruID)
    REFERENCES Soru(SoruID) ON DELETE CASCADE,
    -- This creates a unique identifier using both ID and ParentID, allowing KullaniciTestSoru table to validate the link.
    -- There by ensuring SecenekID belongs to the question's ID
    CONSTRAINT UQ_Soru_Secenek_Integrity UNIQUE (SoruID, SecenekID)
);

-- =============================================
-- 6. LEVEL 5 TABLES (Exam Headers)
-- =============================================
CREATE TABLE TestOturum(
    OturumID INT PRIMARY KEY IDENTITY(1,1),
    KullaniciID INT NOT NULL,
    DersID INT NOT NULL,        -- ALWAYS KNOW THE LESSON (e.g., Math) NB DOES NOT FOLLOW 3NF
    KonuID INT DEFAULT NULL,    -- NULL = Mixed Topics / General Exam
    ZorlukID INT DEFAULT NULL,  -- NULL = Mixed Difficulty
    SoruSayisi INT,
    Sure INT, -- Duration in minutes
    BaslaZaman DATETIME,
    BitirZaman DATETIME,
    Puan INT,
    CONSTRAINT FK_Kullanici_TestOturum FOREIGN KEY(KullaniciID)
    REFERENCES Kullanici(KullaniciID) ON DELETE CASCADE,

    CONSTRAINT FK_Ders_TestOturum FOREIGN KEY(DersID)
    REFERENCES Ders(DersID) ON DELETE NO ACTION,

    -- This enforces that if a Topic is selected, it MUST belong to the selected Lesson.
    CONSTRAINT FK_TestOturum_StrictHierarchy FOREIGN KEY (KonuID, DersID)
    REFERENCES Konu(KonuID, DersID),

    CONSTRAINT FK_ZorlukSeviye_TestOturum FOREIGN KEY(ZorlukID)
    REFERENCES ZorlukSeviye(ZorlukID)
);

-- =============================================
-- 7. LEVEL 6 TABLES (The User Answers)
-- =============================================

CREATE TABLE KullaniciTestSoru(
    OturumID INT NOT NULL,
    SoruID INT NOT NULL,
    SecenekID INT DEFAULT NULL, -- NULL ALLOWED: Means the user skipped the question
    SoruSira INT,
    CONSTRAINT PK_KullaniciTestSoru PRIMARY KEY(OturumID, SoruID),
    --preventing two questions from being #1 in the same exam.
    CONSTRAINT UQ_Oturum_SoruSira UNIQUE(OturumID, SoruSira),

    -- If the Session is deleted, the answers are deleted.
    CONSTRAINT FK_TestOturum_KullaniciTestSoru FOREIGN KEY(OturumID)
    REFERENCES TestOturum(OturumID) ON DELETE CASCADE,

    -- SAFETY LOCK: A question CANNOT be deleted if a user has answered it.
    CONSTRAINT Soru_KullaniciTestSoru FOREIGN KEY(SoruID)
    REFERENCES Soru(SoruID) ON DELETE NO ACTION,

    -- This is a Composite constraint it ensures an option belongs to a question
    -- Can be null if SecenekID is null
    CONSTRAINT FK_Integrity_Soru_Secenek 
    FOREIGN KEY (SoruID, SecenekID) 
    REFERENCES SoruSecenek (SoruID, SecenekID) ON DELETE NO ACTION
);
GO
use TestBankasi;


-- =============================================
-- 8. OPTIMIZED INDEXES (The Speed Layer)
-- =============================================
--NB All the nonclustered indexes are on foreign keys and not primary keys(automatically a clustered index)

-- 2. INDEX FOR FILTERING QUESTIONS
-- When a student selects a Subject(Konu) and Difficulty (Zorluk), we need to fetch questions fast.
-- We use a Composite Index (combining two columns).
CREATE NONCLUSTERED INDEX IDX_Soru_Konu_Zorluk 
ON Soru(KonuID, ZorlukID) 
INCLUDE (SilinmeTarihi); -- We include SilinmeTarihi so we don't fetch archived questions by mistake

-- 3. INDEX FOR FETCHING OPTIONS
-- It will now ignore archived options, speeding up queries.
CREATE NONCLUSTERED INDEX IDX_SoruSecenek_SoruID
ON SoruSecenek(SoruID)
WHERE SilinmeTarihi IS NULL;

-- 4. INDEX FOR EDUCATION HIERARCHY
-- Helps populate dropdown menus (e.g., "Select University" -> "Select Level")
CREATE NONCLUSTERED INDEX IDX_EgitimSeviye_KurumID 
ON EgitimSeviye(KurumID);

CREATE NONCLUSTERED INDEX IDX_Ders_SeviyeID 
ON Ders(SeviyeID);

-- 5. INDEX FOR TOPICS
-- Helps populate dropdown menus (e.g., "Select topic" -> "Topic name")
CREATE NONCLUSTERED INDEX IDX_Konu_DersID
ON Konu(DersID)

-- 6. INDEX FOR PERFORMANCE HISTORY
-- Helps show "My Past Exams" on the user profile page
CREATE NONCLUSTERED INDEX IDX_TestOturum_KullaniciID 
ON TestOturum(KullaniciID);


-- 7. SCORING & REVIEW
-- and INCLUDE SecenekID so SQL can quickly JOIN to the Options table.
CREATE NONCLUSTERED INDEX IX_KullaniciTestSoru_OturumID 
ON KullaniciTestSoru(OturumID)
INCLUDE (SecenekID);
GO
SELECT *FROM Rol
SELECT *FROM Kullanici
SELECT *FROM Kurum
SELECT *FROM EgitimSeviye
SELECT *FROM Ders
SELECT *FROM Konu
SELECT *FROM Soru
SELECT *FROM SoruSecenek
SELECT *FROM ZorlukSeviye
SELECT *FROM TestOturum
SELECT *FROM KullaniciTestSoru



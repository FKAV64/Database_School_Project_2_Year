USE TestBankasi;
GO
-- =====================================================
-- 0.0 SECURITY GATEKEEPER
-- =====================================================
USE TestBankasi;
GO
CREATE PROCEDURE sp_YetkiKontrol
    @KullaniciID INT
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @RolID INT;

    SELECT @RolID = RolID FROM Kullanici WHERE KullaniciID = @KullaniciID;
    --Yetkisiz Erişim (Unauthorized)
    IF @RolID NOT IN (1, 2)
    BEGIN
        -- Block the user
        RAISERROR(N'Yetkisiz işlem', 16, 1);
        RETURN 0;
    END

    RETURN 1;
END
GO
-- ======================================================
-- Procedure 1.0: Register students
-- =====================================================
CREATE PROCEDURE sp_KullaniciKayit
    @Ad NVARCHAR(100),
    @Soyad NVARCHAR(100),
    @DogumTarihi DATE,
    @Email NVARCHAR(100),
    @HashedPassword NVARCHAR(225), -- C# sends the hash, not plain text!
    @SeviyeID INT
AS
BEGIN
    SET NOCOUNT ON;

    -- 1. Validation: Check if email already exists
    IF EXISTS (SELECT 1 FROM Kullanici WHERE Email = @Email)
    BEGIN
        RAISERROR(N'Hata: Bu email adresi zaten kayıtlı.', 16, 1);
        RETURN;
    END

    -- 2. Insert the new user
    -- Notice: We hardcode RolID = 3 (Student). 
    -- This prevents a hacker from registering themselves as Admin/teachers (RolID = 1/2).
    INSERT INTO Kullanici (RolID, Ad, Soyad, DogumTarihi, Email, Sifre, SeviyeID)
    VALUES (3, @Ad, @Soyad, @DogumTarihi, @Email, @HashedPassword, @SeviyeID);

    -- 3. Return the new ID (Auto-login after register)
    SELECT SCOPE_IDENTITY() AS YeniKullaniciID;
END
GO
-- =============================================
-- Procedure 0.1: Verify Session Ownership
-- Purpose: Returns 1 if the user owns the session, 0 if not.
-- =============================================
CREATE PROCEDURE sp_OturumSahibiKontrol
    @OturumID INT,
    @KullaniciID INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT COUNT(1) 
    FROM TestOturum 
    WHERE OturumID = @OturumID AND KullaniciID = @KullaniciID;
END
GO
-- ======================================================
-- Procedure 0.2: Login students
-- ======================================================
CREATE PROCEDURE sp_KullaniciGirisBilgi
    @Email NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        K.KullaniciID,
        K.RolID,
        R.RolAdi, -- FIX 1: Prevents the 500 Crash (TokenService needs this)
        K.Ad,
        K.Soyad,
        K.Email,
        K.Sifre,
        K.SeviyeID -- FIX 2: Prevents Empty Dropdowns (ExamController needs this)
    FROM Kullanici K
    INNER JOIN Rol R ON K.RolID = R.RolID
    WHERE K.Email = @Email;
END
GO
-- ======================================================
-- Procedure 1.0 Get all lesson for a particular level
-- ======================================================
-- 1. GET LESSONS (For the lesson drop down)
CREATE PROCEDURE sp_DersleriGetir
    @SeviyeID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT DersID, DersAdi 
    FROM Ders 
    WHERE SeviyeID = @SeviyeID 
      AND SilinmeTarihi IS NULL -- Critical: Don't show deleted lessons
    ORDER BY DersAdi;
END
GO

-- 2. GET TOPICS (For the second dropdown)
CREATE PROCEDURE sp_KonulariGetir
    @DersID INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT KonuID, KonuAdi 
    FROM Konu 
    WHERE DersID = @DersID 
      AND SilinmeTarihi IS NULL -- Critical: Don't show deleted lessons
    ORDER BY KonuAdi;
END
GO
-- ======================================================
-- Procedure 1.1 Get questions
-- ======================================================

-- 1. RETURNS ALL THE QUESTIONS UNDER A PARTICULAR LESSON AND/OR TOPIC

CREATE PROCEDURE sp_SorulariListele
    @DersID INT,          -- Mandatory: Teacher MUST select a lesson first
    @KonuID INT = NULL    -- Optional: If NULL, show all topics in that lesson
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        S.SoruID,
        S.SoruMetin,
        K.KonuAdi,
        Z.ZorlukAdi,
        S.SilinmeTarihi
    FROM Soru S
    INNER JOIN Konu K ON S.KonuID = K.KonuID
    INNER JOIN ZorlukSeviye Z ON S.ZorlukID = Z.ZorlukID
    WHERE 
        K.DersID = @DersID -- Filter by Lesson
        AND (@KonuID IS NULL OR S.KonuID = @KonuID) -- Filter by Topic (if selected)
    ORDER BY S.SoruID DESC;
END
GO

-- 2. RETURNS ALL THE QUESTIONS + OPTIONS UNDER A PARTICULAR LESSON

CREATE PROCEDURE sp_SoruDetayGetir
    @SoruID INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        S.SoruID, 
        S.SoruMetin, 
        S.KonuID, 
        K.DersID,
        S.ZorlukID,
        
        -- Options columns (The "Many" side)
        SS.SecenekID, 
        SS.SecenekMetin, 
        SS.DogruMu
    FROM Soru S
    INNER JOIN Konu K ON S.KonuID = K.KonuID -- Join to get the Lesson ID
    INNER JOIN SoruSecenek SS ON S.SoruID = SS.SoruID
    WHERE S.SoruID = @SoruID;
END
GO

CREATE PROCEDURE sp_ZorlukSeviyeleriGetir
AS
BEGIN
    SET NOCOUNT ON;
    SELECT ZorlukID, ZorlukAdi FROM ZorlukSeviye;
END
GO
-- =====================================================
-- Procedure 2: Start Exam (Fair Distribution Algorithm)
-- =====================================================
USE TestBankasi;
GO

ALTER PROCEDURE sp_BaslatSinav
    @KullaniciID INT,
    @DersID INT,
    @KonuListesi VARCHAR(MAX) = NULL, -- If no value is added the default is null
    @ZorlukID INT = NULL,
    @SoruSayisi INT,
    @SureDakika INT
AS  -- Start of procedure body
BEGIN  -- Start of code block
    SET NOCOUNT ON;  -- Don't show "X rows affected" messages

    -- 1. INSTITUTION INTEGRITY CHECK

    DECLARE @UserSeviyeID INT;
    DECLARE @DersSeviyeID INT;

    -- Get User's exact Level (e.g., 9th Grade)
    SELECT @UserSeviyeID = SeviyeID
    FROM Kullanici
    WHERE KullaniciID = @KullaniciID;

    -- Get Lesson's Level
    SELECT @DersSeviyeID = SeviyeID
    FROM Ders
    WHERE DersID = @DersID;

    -- The Logic: 
    -- A student can ONLY take an exam for their specific Level.
    -- This effectively blocks them from other Institutions AND other Grades.
    IF @UserSeviyeID <> @DersSeviyeID
    BEGIN
        RAISERROR(N'Hata: Sadece kayıtlı olduğunuz eğitim seviyesine (sınıf) ait derslerden sınav olabilirsiniz.', 16, 1);
        RETURN;
    END

    -- 2. SETUP EXAM HEADER & VARIABLES
    
    -- Handle Single vs Multi Topic inputs
    DECLARE @SingleKonuID INT = NULL; 

    -- Check if topic list exists AND doesn't contain commas
    IF @KonuListesi IS NOT NULL AND CHARINDEX(',', @KonuListesi) = 0
        SET @SingleKonuID = CAST(@KonuListesi AS INT);

    -- Create the Exam Header
    INSERT INTO TestOturum (KullaniciID, DersID, KonuID, ZorlukID, SoruSayisi, Sure, BaslaZaman)
    VALUES (@KullaniciID, @DersID, @SingleKonuID, @ZorlukID, @SoruSayisi, @SureDakika, GETDATE());

    -- Getting the last auto-generated OturumID
    DECLARE @YeniOturumID INT = SCOPE_IDENTITY();

    -- 3. THE BALANCED SELECTION LOGIC
    
    -- Calculate Counts (40% Easy, 40% Med, 20% Hard)
    -- We assume standard integer rounding.
    DECLARE @EasyCount   INT = @SoruSayisi * 40 / 100;
    DECLARE @MediumCount INT = @SoruSayisi * 40 / 100;
    -- The remainder goes to Hard to ensure Total matches exactly
    DECLARE @HardCount   INT = @SoruSayisi - (@EasyCount + @MediumCount);

    -- If a specific Difficulty is chosen, we override the counts to 100%
    IF @ZorlukID IS NOT NULL 
    BEGIN
        IF @ZorlukID = 1 SET @EasyCount = @SoruSayisi; ELSE SET @EasyCount = 0;
        IF @ZorlukID = 2 SET @MediumCount = @SoruSayisi; ELSE SET @MediumCount = 0;
        IF @ZorlukID = 3 SET @HardCount = @SoruSayisi; ELSE SET @HardCount = 0;
    END;

    -- CTE: Filter Valid Questions First
    WITH SoruHavuzu AS (
        SELECT 
            S.SoruID,
            S.KonuID,
            S.ZorlukID,
            /* PARTITION BY S.KonuID
            “Restart numbering for each topic.”
            ORDER BY NEWID()
            “Shuffle questions inside each topic randomly.”
            ROW_NUMBER()
            “Give each question a position after shuffling.”*/
            -- Rank randomly INSIDE each Topic+Difficulty group
            -- This ensures that if we pick 4 Easy questions, we prioritize getting them from DIFFERENT topics first.
            ROW_NUMBER() OVER (PARTITION BY S.ZorlukID, S.KonuID ORDER BY NEWID()) AS DagilimSira
        FROM Soru S
        INNER JOIN Konu K ON S.KonuID = K.KonuID
        WHERE 
            K.DersID = @DersID 
            AND (@KonuListesi IS NULL OR S.KonuID IN (SELECT value FROM STRING_SPLIT(@KonuListesi, ',')))
            AND S.SilinmeTarihi IS NULL 
            AND K.SilinmeTarihi IS NULL
    ),
    SecilenSorular AS (
        -- Step A: Pick Easy Questions (Fairly distributed by topic)
        SELECT TOP (@EasyCount) SoruID
        FROM SoruHavuzu
        WHERE ZorlukID = 1
        ORDER BY DagilimSira -- Pick Rank 1s (1st q from Topic A, 1st from Topic B) before Rank 2s

        UNION ALL

        -- Step B: Pick Medium Questions
        SELECT TOP (@MediumCount) SoruID
        FROM SoruHavuzu
        WHERE ZorlukID = 2
        ORDER BY DagilimSira

        UNION ALL

        -- Step C: Pick Hard Questions
        SELECT TOP (@HardCount) SoruID
        FROM SoruHavuzu
        WHERE ZorlukID = 3
        ORDER BY DagilimSira
    )
    -- Step D: Insert and Shuffle the Final Display Order (1 to N)
    INSERT INTO KullaniciTestSoru (OturumID, SoruID, SoruSira)
    SELECT 
        @YeniOturumID,
        SoruID,
        ROW_NUMBER() OVER (ORDER BY NEWID()) -- Shuffle the final mix so Easy/Hard aren't grouped together
    FROM SecilenSorular;

    -- 4. Return the ID
    SELECT @YeniOturumID AS ExamID;  
END
GO
-- =====================================================
-- Procedure 2.1: Return randomly selected questions to the API
-- =====================================================
--Here we get the text questions and sents it to the API
CREATE PROCEDURE sp_OturumSorulariniGetir
    @OturumID INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        -- Exam Context
        KTS.OturumID,
        KTS.SoruSira,
        
        -- Question Data
        S.SoruID,
        S.SoruMetin,
        
        --This order is very important for the dapper because it splits on SecenekID
        SS.SecenekID,
        SS.SecenekMetin
        -- NOTE: We do NOT select 'DogruMu'. 
        -- Security: The frontend should NEVER receive the correct answer flag.
        
    FROM KullaniciTestSoru KTS
    INNER JOIN Soru S ON KTS.SoruID = S.SoruID
    INNER JOIN SoruSecenek SS ON S.SoruID = SS.SoruID
    WHERE 
        KTS.OturumID = @OturumID
    ORDER BY 
        KTS.SoruSira ASC, -- Show questions in the random order we generated earlier
        SS.SecenekID ASC; -- Order options consistently
END
GO

-- ==============================================================
-- Procedure 3.0: Save Single Answer
-- Purpose: Updates the student's choice for a specific question.
-- ==============================================================
CREATE PROCEDURE sp_CevapKaydet
    @OturumID INT,
    @SoruID INT,
    @SecenekID INT -- The ID of the option the user clicked
AS
BEGIN
    SET NOCOUNT ON;

    -- 1. Security/Integrity Check (Optional but good)
    -- Ensure the Question actually belongs to this Session
    IF NOT EXISTS (SELECT 1 FROM KullaniciTestSoru WHERE OturumID = @OturumID AND SoruID = @SoruID)
    BEGIN
        RAISERROR(N'Hata: Bu soru bu oturuma ait değil.', 16, 1);
        RETURN;
    END

    -- 2. Update the answer
    UPDATE KullaniciTestSoru
    SET SecenekID = @SecenekID
    WHERE OturumID = @OturumID 
      AND SoruID = @SoruID;
END
GO
-- =============================================
-- Procedure 3.1: Grade Exam (Auto-Calculator)
-- =============================================
CREATE PROCEDURE sp_TamamlaSinav
    @OturumID INT
AS
BEGIN
    SET NOCOUNT ON;

    -- 1. Calculate Statistics
    DECLARE @DogruSayisi INT;
    DECLARE @ToplamSoru INT;
    DECLARE @Puan INT;

    -- Count Total Questions for this specific session
    SELECT @ToplamSoru = COUNT(*) 
    FROM KullaniciTestSoru 
    WHERE OturumID = @OturumID;

    -- Count Correct Answers
    -- We join the User's Answer (SecenekID) to the Options Table to check if DogruMu = 1
    SELECT @DogruSayisi = COUNT(*)
    FROM KullaniciTestSoru KTS
    INNER JOIN SoruSecenek SS ON KTS.SecenekID = SS.SecenekID
    WHERE KTS.OturumID = @OturumID 
      AND SS.DogruMu = 1;

    -- 2. Calculate Score (Handle Divide by Zero error if exam has 0 questions)
    IF @ToplamSoru > 0
        SET @Puan = (@DogruSayisi * 100) / @ToplamSoru;
    ELSE
        SET @Puan = 0;

    -- 3. Update the Exam Header (Permanently save the result)
    UPDATE TestOturum
    SET 
        Puan = @Puan,
        BitirZaman = GETDATE()
    WHERE OturumID = @OturumID;

    -- 4. Return the Result to the App 
    SELECT 
        @OturumID AS OturumID,
        @DogruSayisi AS Dogru,
        @ToplamSoru AS Toplam,
        @Puan AS Puan,
        GETDATE() AS BitirZaman;
END
GO

-- =====================================================
-- Procedure 4: Creating questions
-- =====================================================
CREATE PROCEDURE sp_SoruVeSecenekleriEkle
    @KullaniciID INT,
    @KonuID INT,
    @ZorlukID INT,
    @SoruMetin NVARCHAR(MAX),
    @SeceneklerJSON NVARCHAR(MAX) -- This holds all options!
AS
BEGIN
    SET NOCOUNT ON;

    -- 1. Security Gatekeeper
    DECLARE @IsAuthorized INT;
    EXEC @IsAuthorized = sp_YetkiKontrol @KullaniciID;
    IF @IsAuthorized <> 1 RETURN;

    -- 2. VALIDATION CHECKS IF JSON IS VALID
    IF ISJSON(@SeceneklerJSON) = 0
    BEGIN
        RAISERROR(N'Hata: Geçersiz JSON formatı.', 16, 2);
        RETURN;
    END

    -- 3. THE ATOMIC TRANSACTION
    BEGIN TRANSACTION;

    BEGIN TRY
        -- A. Insert the Question Header
        INSERT INTO Soru (KonuID, ZorlukID, SoruMetin)
        VALUES (@KonuID, @ZorlukID, @SoruMetin);

        DECLARE @YeniSoruID INT = SCOPE_IDENTITY();

        -- B. Insert Options using OPENJSON
        -- This maps the JSON keys "SecenekMetin" and "DogruMu" to our table columns
        INSERT INTO SoruSecenek (SoruID, SecenekMetin, DogruMu)
        SELECT 
            @YeniSoruID, 
            SecenekMetin, 
            DogruMu 
        FROM OPENJSON(@SeceneklerJSON)
        WITH (
            SecenekMetin NVARCHAR(500) '$.SecenekMetin',
            DogruMu BIT '$.DogruMu'
        );

        -- C. LOGICAL VALIDATION (The "Business Rules")
        
        -- Rule 1: Must have at least 2 options
        DECLARE @SecenekSayisi INT;
        SELECT @SecenekSayisi = COUNT(*) FROM SoruSecenek WHERE SoruID = @YeniSoruID;
        
        IF @SecenekSayisi < 2
        BEGIN
            RAISERROR(N'Hata: Bir soru en az 2 seçeneğe sahip olmalıdır.', 16, 3);
        END

        -- Rule 2: Must have EXACTLY ONE correct answer
        DECLARE @DogruSayisi INT;
        SELECT @DogruSayisi = COUNT(*) FROM SoruSecenek WHERE SoruID = @YeniSoruID AND DogruMu = 1;

        IF @DogruSayisi <> 1
        BEGIN
            RAISERROR(N'Hata: Sorunun tam olarak 1 doğru cevabı olmalıdır.', 16, 3);
        END

        -- If we survived all errors, commit the changes!
        COMMIT TRANSACTION;
        
        -- Return the ID for the frontend
        SELECT @YeniSoruID AS YeniSoruID;

    END TRY
    BEGIN CATCH
        -- If ANY error happened above (SQL error or our RAISERROR), we undo everything.
        -- The Question will NOT be saved. The Options will NOT be saved. Total cleanup.
        IF @@TRANCOUNT > 0 -- @@TRANCOUNT returns the number of active "BEGIN TRAN" 
            ROLLBACK TRANSACTION;

        -- Tell the user what went wrong
        DECLARE @ErrMsg NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR(@ErrMsg, 16, 4);
    END CATCH
END
GO
-- =====================================================
-- Procedure 5: Updating questions
-- =====================================================
CREATE PROCEDURE sp_SoruVeSecenekleriGuncelle
    @KullaniciID INT,
    @SoruID INT,
    @YeniMetin NVARCHAR(MAX),
    @YeniZorlukID INT,
    @SeceneklerJSON NVARCHAR(MAX) -- format: [{"SecenekID":1, "SecenekMetin":"...", "DogruMu":1}, ...]
AS
BEGIN
    SET NOCOUNT ON;

    -- 1. Security Check
    DECLARE @IsAuthorized INT;
    EXEC @IsAuthorized = sp_YetkiKontrol @KullaniciID;
    IF @IsAuthorized <> 1 RETURN;

    -- 2. Validate JSON
    IF ISJSON(@SeceneklerJSON) = 0
    BEGIN
        RAISERROR(N'Hata: Geçersiz JSON formatı.', 16, 2);
        RETURN;
    END

    -- 3. OPTIMIZATION: Capture the "Old" Correct Answer ID
    DECLARE @EskiDogruCevapID INT;
    SELECT @EskiDogruCevapID = SecenekID 
    FROM SoruSecenek 
    WHERE SoruID = @SoruID AND DogruMu = 1;

    -- 4. Start Transaction
    BEGIN TRANSACTION;

    BEGIN TRY
        -- A. Update the Question Header
        UPDATE Soru
        SET SoruMetin = @YeniMetin,
            ZorlukID = @YeniZorlukID
        WHERE SoruID = @SoruID;

        -- B. Update the Options (Bulk Update)
        -- We join the JSON directly to the Table to update matches
        UPDATE SS
        SET 
            SS.SecenekMetin = J.SecenekMetin,
            SS.DogruMu = J.DogruMu
        FROM SoruSecenek SS
        INNER JOIN OPENJSON(@SeceneklerJSON) 
        WITH (
            SecenekID INT '$.SecenekID',
            SecenekMetin NVARCHAR(500) '$.SecenekMetin',
            DogruMu BIT '$.DogruMu'
        ) AS J ON SS.SecenekID = J.SecenekID
        WHERE SS.SoruID = @SoruID; -- Safety: Ensure we only touch options for THIS question

        -- C. Validation: Ensure exactly ONE correct answer exists
        DECLARE @DogruSayisi INT;
        SELECT @DogruSayisi = COUNT(*) 
        FROM SoruSecenek 
        WHERE SoruID = @SoruID AND DogruMu = 1 
          AND SilinmeTarihi IS NULL; -- Ignore deleted options

        IF @DogruSayisi <> 1
        BEGIN
            RAISERROR(N'Hata: Güncelleme sonrası sorunun tam olarak 1 doğru cevabı olmalıdır.', 16, 3);
        END

        -- 5. Capture the "New" Correct Answer ID
        DECLARE @YeniDogruCevapID INT;
        SELECT @YeniDogruCevapID = SecenekID 
        FROM SoruSecenek 
        WHERE SoruID = @SoruID AND DogruMu = 1;
        

        -- D. THE RIPPLE EFFECT (Auto-Regrading)
        -- This logic hunts down old exams and fixes their scores based on the new "Truth"

        -- Here we check if the the question's correct answer was modify. If yes we recalculate scores
        IF @EskiDogruCevapID <> @YeniDogruCevapID
        BEGIN
            ;WITH EtkilenenSinavlar AS (
                -- A. Find all exams that contain THIS question
                SELECT DISTINCT OturumID 
                FROM KullaniciTestSoru 
                WHERE SoruID = @SoruID
            ),
            YeniPuanlar AS (
                -- B. Recalculate scores for those exams using the NEW option statuses
                SELECT 
                    KTS.OturumID,
                    -- Count total questions in that exam
                    COUNT(KTS.SoruID) AS TotalQuestions,
                    -- Count correct answers (using the updated SoruSecenek table)
                    SUM(CASE WHEN SS.DogruMu = 1 THEN 1 ELSE 0 END) AS DogruSayisi
                FROM KullaniciTestSoru KTS
                INNER JOIN EtkilenenSinavlar EtS ON KTS.OturumID = EtS.OturumID -- Only look at affected exams
                INNER JOIN SoruSecenek SS ON KTS.SecenekID = SS.SecenekID -- Join to see if chosen option is NOW correct
                GROUP BY KTS.OturumID
            )
            -- C. Apply the update to the Cache (TestOturum Table)
            UPDATE T
            SET T.Puan = CASE 
                            WHEN YP.TotalQuestions = 0 THEN 0 
                            ELSE (YP.DogruSayisi * 100) / YP.TotalQuestions 
                         END
            FROM TestOturum T
            INNER JOIN YeniPuanlar YP ON T.OturumID = YP.OturumID;
        END
         -- ==================================================================================
        -- If logic passes, save it.
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        -- If anything failed, undo updates to Header AND Options.
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        
        DECLARE @ErrMsg NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR(@ErrMsg, 16, 4);
    END CATCH
END
GO

-- =====================================================
-- Procedure 6: Updating questions
-- =====================================================
CREATE PROCEDURE sp_SoruSil
    @KullaniciID INT,
    @SoruID INT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @IsAuthorized INT;
    EXEC @IsAuthorized = sp_YetkiKontrol @KullaniciID;

    IF @IsAuthorized <> 1 RETURN;

    UPDATE Soru
    SET SilinmeTarihi = GETDATE()
    WHERE SoruID = @SoruID 
      AND SilinmeTarihi IS NULL; -- Only update if it's NOT already deleted

    -- @@ROWCOUNT is a system variable that tells us how many rows the last command touched.
    IF @@ROWCOUNT = 0
    BEGIN
        -- If we touched 0 rows, it means either:
        -- A) The ID doesn't exist
        -- B) It was already deleted (SilinmeTarihi was not null)
        
        -- Optional: Now we can do a quick check to see WHICH one it was
        IF EXISTS (SELECT 1 FROM Soru WHERE SoruID = @SoruID)
             RAISERROR(N'Bilgi: Soru zaten silinmiş.', 16, 5);
        ELSE
             RAISERROR(N'Hata: Soru bulunamadı.', 16, 5);
    END
END
GO

-- =====================================================
-- Procedure 7: Restore Question
-- =====================================================
CREATE PROCEDURE sp_SoruGeriYukle
    @KullaniciID INT,
    @SoruID INT
AS
BEGIN
    SET NOCOUNT ON;

    -- 1. SECURITY (Gatekeeper)
    DECLARE @IsAuthorized INT;
    EXEC @IsAuthorized = sp_YetkiKontrol @KullaniciID;
    
    IF @IsAuthorized <> 1 RETURN;

    -- We try to set SilinmeTarihi to NULL, but ONLY if it is currently not null.
    UPDATE Soru
    SET SilinmeTarihi = NULL
    WHERE SoruID = @SoruID 
      AND SilinmeTarihi IS NOT NULL; 

    -- 3. CHECK RESULT
    IF @@ROWCOUNT = 0
    BEGIN
        -- If we failed, figure out why (for the user's sake)
        IF NOT EXISTS (SELECT 1 FROM Soru WHERE SoruID = @SoruID)
            RAISERROR(N'Hata: Soru bulunamadı.', 16, 5);
        ELSE
            -- It exists, so it must have been active already.
            RAISERROR(N'Bilgi: Bu soru zaten aktif (silinmemiş).', 16, 5);
    END
END
GO
-- =====================================================
-- Procedure 8: Historical Analysis
-- =====================================================
CREATE PROCEDURE sp_GozdenGecirmeSinavi
    @OturumID INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        -- Question Info
        S.SoruID,
        S.SoruMetin,
        KTS.SoruSira, -- Maintains the specific order the user saw
        K.KonuAdi,  
        Z.ZorlukAdi,
        
        -- Option Info
        SS.SecenekID,
        SS.SecenekMetin,
        SS.DogruMu AS DogruMu, -- Reveals the truth (1 or 0)
        
        -- User Interaction
        CASE 
            WHEN KTS.SecenekID = SS.SecenekID THEN 1 
            ELSE 0 
        END AS VerilenCevap -- Flags the option the user clicked
        
    FROM KullaniciTestSoru KTS
    INNER JOIN Soru S ON KTS.SoruID = S.SoruID
    INNER JOIN SoruSecenek SS ON S.SoruID = SS.SoruID
    INNER JOIN Konu K ON S.KonuID = K.KonuID
    INNER JOIN ZorlukSeviye Z ON S.ZorlukID = Z.ZorlukID
    WHERE KTS.OturumID = @OturumID
    ORDER BY KTS.SoruSira, SS.SecenekID;
END
GO 
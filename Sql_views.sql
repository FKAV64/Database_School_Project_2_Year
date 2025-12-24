USE TestBankasi;
GO
-- =============================================
-- 0. Returns educational levels with their
-- corresponing institution
-- =============================================
CREATE VIEW View_EgitimSeviyeleri AS
SELECT
    K.KurumID,
    ES.SeviyeID, 
    K.KurumAdi, 
    ES.SeviyeAdi,  
    ES.SeviyeSira  
FROM EgitimSeviye ES
INNER JOIN Kurum K ON ES.KurumID = K.KurumID;
GO

-- =============================================
-- 1. EXAM HISTORY DATABOARD
-- Purpose: Filterable list of exams for the student UI.
-- =============================================
CREATE VIEW View_OturumOzet AS
SELECT
    T.KullaniciID,
    T.OturumID,
    K.Ad + ' ' + K.Soyad AS OgrenciIsim, -- Concatenating First and Last Name
    D.DersAdi,
    ISNULL(Ko.KonuAdi, N'Genel Sinav') AS Konu, -- Handles NULLs for General Exams
    ISNULL(Z.ZorlukAdi, N'Karışık') AS Zorluk,    -- Handles NULLs for Mixed Difficulty
    T.SoruSayisi,
    T.Puan,
    CASE 
        WHEN T.BitirZaman IS NULL THEN 'Aktif'
        ELSE 'Tamamlandi'
    END AS Durum,
    T.Sure AS SureDakika,
    T.BaslaZaman,
    T.BitirZaman
FROM TestOturum T
    INNER JOIN Kullanici K ON T.KullaniciID = K.KullaniciID
    INNER JOIN Ders D ON T.DersID = D.DersID
    LEFT JOIN Konu Ko ON T.KonuID = Ko.KonuID
    LEFT JOIN ZorlukSeviye Z ON T.ZorlukID = Z.ZorlukID;
GO

-- =============================================
-- 2. EXAM DETAIL REPORTS
-- Purpose: Shows questions, user answers, AND corrects answers. Includes Topic/Difficulty context.
-- =============================================
CREATE VIEW View_DetayliAnaliz AS
SELECT 
    KTS.OturumID,
    KTS.SoruID,
    KTS.SoruSira,
    K.KonuAdi,
    Z.ZorlukAdi,
    S.SoruMetin,
    ISNULL(SS_User.SecenekMetin, N'(Boş Bırakıldı)') AS VerilenCevap, -- Handles skipped questions
    CASE 
        WHEN SS_User.DogruMu = 1 THEN 'Dogru'
        WHEN SS_User.DogruMu = 0 THEN N'Yanlış'
        ELSE N'Boş' 
    END AS Sonuc,
    SS_Dogru.SecenekMetin AS DogruCevapMetin
FROM KullaniciTestSoru KTS
    INNER JOIN Soru S ON KTS.SoruID = S.SoruID
    
    -- JOIN 1: Get the Topic (Via Soru)
    INNER JOIN Konu K ON S.KonuID = K.KonuID 
    
    -- JOIN 2: Get the Difficulty (Via Soru)
    INNER JOIN ZorlukSeviye Z ON S.ZorlukID = Z.ZorlukID
    
    -- JOIN 3: User's Answer
     -- We use LEFT JOIN here because SecenekID might be NULL (Skipped Question)
    LEFT JOIN SoruSecenek SS_User ON KTS.SecenekID = SS_User.SecenekID
    
    -- JOIN 4: Correct Answer
    LEFT JOIN SoruSecenek SS_Dogru ON S.SoruID = SS_Dogru.SoruID AND SS_Dogru.DogruMu = 1;
GO

-- =============================================
-- 3. EXAM STATISTICAL REPORTS
-- Purpose: School analytics
-- =============================================
CREATE VIEW View_DetayliPerformans AS
SELECT
    KR.KurumAdi,
    ES.SeviyeID,
    ES.SeviyeAdi,
    T.KullaniciID,
    Kullanici.Ad + ' ' + Kullanici.Soyad AS OgrenciIsim,
    D.DersID,
    D.DersAdi,
    K.KonuAdi, 
    Z.ZorlukAdi,

    -- STATS
    COUNT(KTS.SoruID) AS ToplamSoru, -- Total questions answered in this category
    
    -- Calculate Correct Answers
    SUM(CASE WHEN SS.DogruMu = 1 THEN 1 ELSE 0 END) AS DogruSayisi,
    
    -- Calculate Success Percentage (Avoid Divide by Zero)
    CASE 
        WHEN COUNT(KTS.SoruID) = 0 THEN 0 
        ELSE (SUM(CASE WHEN SS.DogruMu = 1 THEN 1 ELSE 0 END) * 100.0) / COUNT(KTS.SoruID) 
    END AS BasariYuzdesi
    

FROM KullaniciTestSoru KTS
    INNER JOIN TestOturum T ON KTS.OturumID = T.OturumID
    INNER JOIN Kullanici ON T.KullaniciID = Kullanici.KullaniciID
    INNER JOIN Soru S ON KTS.SoruID = S.SoruID
    INNER JOIN Konu K ON S.KonuID = K.KonuID           
    INNER JOIN Ders D ON K.DersID = D.DersID
    INNER JOIN EgitimSeviye ES ON D.SeviyeID = ES.SeviyeID
    INNER JOIN Kurum KR ON ES.KurumID = KR.KurumID
    INNER JOIN ZorlukSeviye Z ON S.ZorlukID = Z.ZorlukID
    LEFT JOIN SoruSecenek SS ON KTS.SecenekID = SS.SecenekID
GROUP BY
    KR.KurumAdi,
    ES.SeviyeID,
    ES.SeviyeAdi,
    T.KullaniciID, 
    Kullanici.Ad, 
    Kullanici.Soyad,
    D.DersID,
    D.DersAdi,
    K.KonuAdi,
    Z.ZorlukAdi;
GO

-- =============================================
-- 4. Sample test
-- =============================================
USE TestBankasi;
GO
--Track their results
SELECT * FROM View_OturumOzet
--Track detail results
SELECT * FROM View_DetayliAnaliz

select * from View_DetayliPerformans
--Most preferred topics
SELECT KonuAdi,SUM(ToplamSoru) As YapilanSayisi
FROM View_DetayliPerformans
GROUP BY KonuAdi
ORDER BY YapilanSayisi DESC

--Highest scoring topics
SELECT KonuAdi, CAST(AVG(BasariYuzdesi*1.00) AS DECIMAL(5,2)) AS BasariOrani 
FROM View_DetayliPerformans
GROUP BY KonuAdi
ORDER BY BasariOrani DESC

USE TestBankasi;
GO
--Highest scoring student per subjects
SELECT KurumAdi,SeviyeAdi,OgrenciIsim,DersAdi,ZorlukAdi, CAST(AVG(BasariYuzdesi*1.00) AS DECIMAL(5,2)) AS BasariOrani 
FROM View_DetayliPerformans
WHERE ZorlukAdi = 'Zor'
GROUP BY KurumAdi,SeviyeAdi,DersAdi,OgrenciIsim,ZorlukAdi
ORDER BY BasariOrani DESC


USE TestBankasi;
GO
-- =============================================
-- 1. Returns educational levels with their
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
-- 2. EXAM HISTORY DATABOARD
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
    

FROM KullaniciTestSoru KTS (NOLOCK)
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



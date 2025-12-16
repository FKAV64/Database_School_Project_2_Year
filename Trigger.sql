USE TestBankasi;
GO

CREATE TRIGGER trg_SinavZamanKilidi
ON KullaniciTestSoru
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    -- Check if any of the affected sessions have already ended
    IF EXISTS (
        SELECT 1 
        FROM inserted i
        INNER JOIN TestOturum t ON i.OturumID = t.OturumID
        WHERE t.BitisZaman IS NOT NULL
    )
    BEGIN
        -- If we found a match, the exam is over. BLOCK IT.
        RAISERROR (N'Hata: Bu sınav tamamlanmıştır. Cevap değiştirilemez.', 16, 1);
        ROLLBACK TRANSACTION;
        RETURN;
    END
END
GO
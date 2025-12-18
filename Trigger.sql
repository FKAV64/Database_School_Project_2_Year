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
        ROLLBACK TRANSACTION;
        -- Error Number 51000 = "Time Expired" standard for this app
        THROW 51000, 'Hata: Bu sınav tamamlanmıştır. Cevap değiştirilemez.', 1;
        RETURN;
    END
END
GO
USE TestBankasi;
GO

-- =============================================
-- 1. SERVER & DATABASE IDENTITY
-- =============================================

-- Create the Login (The Key to the Server)
CREATE LOGIN [TestBankasi_AppUser] WITH PASSWORD = 'Admin!237';
GO

-- Create the User (The Identity inside this specific Database)
CREATE USER [AppUser] FOR LOGIN [TestBankasi_AppUser];
GO

-- =============================================
-- 2. ROLE CONFIGURATION (The "Uniform")
-- We configure the permissions BEFORE adding the user.
-- =============================================

-- Create the generic role for the API
CREATE ROLE [App_Executor_Role];
GO

-- A. THE BLANKET PERMISSION (Service Entrance)
-- Allow execution of ALL Stored Procedures (Present and Future) in the dbo schema.
-- This automatically covers sp_KullaniciKayit, sp_BaslatSinav, etc.
GRANT EXECUTE ON SCHEMA::dbo TO [App_Executor_Role];
GO

-- B. THE EXCEPTIONS (The Windows)
-- We strictly allow reading ONLY these specific Views.
GRANT SELECT ON OBJECT::View_OturumOzet TO [App_Executor_Role];
GRANT SELECT ON OBJECT::View_DetayliAnaliz TO [App_Executor_Role];
GRANT SELECT ON OBJECT::View_DetayliPerformans TO [App_Executor_Role];
GRANT SELECT ON OBJECT::View_EgitimSeviyeleri TO [App_Executor_Role];
GO
GO

-- C. THE LOCKDOWN (The Front Door)
--In SQL, No Permission = Access Denied. So the app can only select on objects on which we gave them the grant

-- =============================================
-- 3. ACTIVATE USER
-- =============================================

-- Now that the Role is fully secured, we add the User to it.
ALTER ROLE [App_Executor_Role] ADD MEMBER [AppUser];
GO

using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using Microsoft.OpenApi.Models;
using System.Text;
using TestBankasi.API.DataAccess;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllersWithViews();

// 1. HELPER FOR API DISCOVERY
// This allows .NET to find all your endpoints (Controllers) so they can be listed.
builder.Services.AddEndpointsApiExplorer();
//builder.Services.AddSwaggerGen();
// ==============================================================================
// 2. SWAGGER CONFIGURATION (The "Instruction Manual")
// This entire block changes the blue/green UI page. It does NOT secure the API.
// It just adds the "Authorize" button to the webpage so YOU can test it.
// ==============================================================================
builder.Services.AddSwaggerGen(c =>
{
    // A. DEFINE THE SCHEME
    // This tells Swagger: "We use a security system called 'Bearer'. 
    // It expects a header named 'Authorization' containing 'Bearer <token>'."
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "Standard Authorization header using the Bearer scheme. Example: \"bearer {token}\"",
        In = ParameterLocation.Header, // The key must be in the HTTP Header
        Name = "Authorization",        // The header name must be "Authorization"
        Type = SecuritySchemeType.ApiKey
    });

    // B. APPLY THE REQUIREMENT
    // This tells Swagger: "Assume the 'Bearer' lock we just defined applies to the whole API."
    // This adds the little Padlock icons next to every endpoint in the UI.
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer" // Must match the name defined in part A
                }
            },
            new string[] {}
        }
    });
});

// ==============================================================================
// 3. AUTHENTICATION CONFIGURATION (The Real "Bouncer")
// This is the actual security logic that runs on the Server.
// ==============================================================================
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            // CRITICAL: This checks the signature.
            // If the user tries to fake a token, the signatures won't match our Secret Key.
            ValidateIssuerSigningKey = true,

            // This grabs the "Secret Key" from your appsettings.json to verify the signature.
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["JwtSettings:Key"])),

            // These are set to false for simplicity. 
            // In big apps, you'd verify "Who created this?" (Issuer) and "Who is it for?" (Audience).
            ValidateIssuer = false,
            ValidateAudience = false
        };
    });
// ==================================================================

// DATABASE REGISTRATION
// This creates a single instance of our DapperContext tool.
// Whenever a Controller needs to talk to DB, it will ask for this.
builder.Services.AddSingleton<TestBankasi.API.DataAccess.DapperContext>();

// This tells the App: "Whenever someone asks for IAuthRepository, give them AuthRepository."
builder.Services.AddScoped<TestBankasi.API.DataAccess.IAuthRepository, TestBankasi.API.DataAccess.AuthRepository>();

// This tells the App: "Whenever someone asks for IExamRepository, give them ExamRepository."
builder.Services.AddScoped<TestBankasi.API.DataAccess.IExamRepository, TestBankasi.API.DataAccess.ExamRepository>();

// Register the Badge Printer
builder.Services.AddScoped<ITokenService, TokenService>();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(); // <--- This creates the blue/green page
}

// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
    app.UseHsts();
}

app.UseHttpsRedirection(); // Force http:// to become https://
app.UseStaticFiles();

app.UseRouting(); // Figure out which Controller the user is asking for

app.UseAuthentication();
app.UseAuthorization();

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}");

app.Run(); //start engin

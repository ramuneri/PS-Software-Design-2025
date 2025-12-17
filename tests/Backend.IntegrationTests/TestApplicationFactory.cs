using backend.Data;
using backend.Data.Models;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Net.Http.Headers;
using System.Security.Claims;
using System.Text.Encodings.Web;

namespace Backend.IntegrationTests;

public class TestApplicationFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");

        builder.ConfigureLogging(logging =>
        {
            logging.ClearProviders();
            logging.SetMinimumLevel(LogLevel.Warning);
        });

        builder.ConfigureServices(services =>
        {
            // Remove existing ApplicationDbContext registration (Postgres)
            var descriptor = services.SingleOrDefault(
                d => d.ServiceType == typeof(DbContextOptions<ApplicationDbContext>));
            if (descriptor != null)
            {
                services.Remove(descriptor);
            }

            // Use in-memory DB for tests
            services.AddDbContext<ApplicationDbContext>(options =>
            {
                options.UseInMemoryDatabase("TestDb");
            });

            // OVERRIDE authentication defaults to use the Test scheme
            services.AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = "Test";
                options.DefaultChallengeScheme = "Test";
                options.DefaultScheme = "Test";
            })
            .AddScheme<AuthenticationSchemeOptions, TestAuthHandler>("Test", options => { });

            // Build the service provider
            var sp = services.BuildServiceProvider();

            // Create scope and seed the database
            using var scope = sp.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var logger = scope.ServiceProvider.GetRequiredService<ILogger<TestApplicationFactory>>();

            try
            {
                db.Database.EnsureCreated();
                SeedTestData(db);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "An error occurred while seeding the test database.");
            }
        });
    }

    private void SeedTestData(ApplicationDbContext db)
    {
        var merchant = new Merchant
        {
            MerchantId = 1,
            Name = "Test Merchant"
        };
        db.Merchants.Add(merchant);

        var user = new User
        {
            Id = "test-user-id",
            UserName = "TestUser",
            Email = "test@example.com",
            MerchantId = merchant.MerchantId,
            Role = "admin",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            LastLoginAt = DateTime.UtcNow
        };
        db.Users.Add(user);

        db.Products.Add(new Product
        {
            ProductId = 1,
            MerchantId = merchant.MerchantId,
            Name = "Test Product",
            Price = 10.99m,
            Category = "Test",
            IsActive = true
        });

        db.Services.Add(new Service
        {
            ServiceId = 1,
            MerchantId = merchant.MerchantId,
            Name = "Test Service",
            Description = "Initial test service",
            DefaultPrice = 49.99m,
            DurationMinutes = 60,
            IsActive = true
        });

        db.SaveChanges();
    }


    // Create client with default auth header
    public HttpClient CreateAuthenticatedClient()
    {
        return CreateAuthenticatedClient(role: "Owner", merchantId: 1, userId: "test-user-id", isSuperAdmin: false);
    }

    // Create client with custom claims for testing
    public HttpClient CreateAuthenticatedClient(string role, int merchantId, string userId = "test-user-id", bool isSuperAdmin = false)
    {
        var client = CreateClient();
        // Pass claims via a custom header that TestAuthHandler can read
        client.DefaultRequestHeaders.Add("X-Test-Role", role);
        client.DefaultRequestHeaders.Add("X-Test-MerchantId", merchantId.ToString());
        client.DefaultRequestHeaders.Add("X-Test-UserId", userId);
        client.DefaultRequestHeaders.Add("X-Test-IsSuperAdmin", isSuperAdmin.ToString());
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Test");
        return client;
    }
}

// Fake authentication handler for integration tests
public class TestAuthHandler : AuthenticationHandler<AuthenticationSchemeOptions>
{
    public TestAuthHandler(
        IOptionsMonitor<AuthenticationSchemeOptions> options,
        ILoggerFactory logger,
        UrlEncoder encoder)
        : base(options, logger, encoder)
    {
    }

    protected override Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.Name, "TestUser"),
            new Claim(ClaimTypes.NameIdentifier, "test-user-id"),
        };

        // Read custom claims from headers if present
        if (Request.Headers.TryGetValue("X-Test-UserId", out var userId))
        {
            claims.RemoveAll(c => c.Type == ClaimTypes.NameIdentifier);
            claims.Add(new Claim(ClaimTypes.NameIdentifier, userId.ToString()));
        }

        if (Request.Headers.TryGetValue("X-Test-Role", out var role))
        {
            claims.Add(new Claim(ClaimTypes.Role, role.ToString()));
            claims.Add(new Claim("role", role.ToString())); // Also add as "role" claim
        }
        else
        {
            // Default role
            claims.Add(new Claim(ClaimTypes.Role, "Owner"));
            claims.Add(new Claim("role", "Owner"));
        }

        if (Request.Headers.TryGetValue("X-Test-MerchantId", out var merchantId))
        {
            claims.Add(new Claim("merchantId", merchantId.ToString()));
        }
        else
        {
            // Default merchantId
            claims.Add(new Claim("merchantId", "1"));
        }

        if (Request.Headers.TryGetValue("X-Test-IsSuperAdmin", out var isSuperAdmin))
        {
            claims.Add(new Claim("isSuperAdmin", isSuperAdmin.ToString()));
        }

        var identity = new ClaimsIdentity(claims, Scheme.Name);
        var principal = new ClaimsPrincipal(identity);
        var ticket = new AuthenticationTicket(principal, Scheme.Name);

        return Task.FromResult(AuthenticateResult.Success(ticket));
    }
}

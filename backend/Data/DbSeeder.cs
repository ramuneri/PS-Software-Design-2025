using System;
using System.Threading.Tasks;
using backend.Data.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace backend.Data
{
    public class DbSeeder
    {
        private readonly ApplicationDbContext _db;
        private readonly UserManager<User> _userManager;
        private readonly ILogger<DbSeeder> _logger;

        public DbSeeder(
            ApplicationDbContext db,
            UserManager<User> userManager,
            ILogger<DbSeeder> logger)
        {
            _db = db;
            _userManager = userManager;
            _logger = logger;
        }

        public async Task SeedAsync()
        {
            _logger.LogInformation("Starting database seeding...");

            // Apply pending migrations (creates DB if missing)
            await _db.Database.MigrateAsync();

            await SeedTestUserAsync();

            // TODO: Later, when Merchant/Product/Service entities exist,
            // add seeding methods here:
            // await SeedMerchantAsync();
            // await SeedProductAsync();
            // await SeedServiceAsync();

            _logger.LogInformation("Database seeding completed.");
        }

        private async Task SeedTestUserAsync()
        {
            const string testEmail = "test@temp.com";
            const string testPassword = "test123";

            var existing = await _userManager.FindByEmailAsync(testEmail);
            if (existing != null)
            {
                _logger.LogInformation("Test user already exists, skipping.");
                return;
            }

            var user = new User
            {
                UserName = testEmail,
                Email = testEmail
                // add other fields if your User class requires them
            };

            var result = await _userManager.CreateAsync(user, testPassword);

            if (result.Succeeded)
            {
                _logger.LogInformation("Seeded test user {Email}", testEmail);
            }
            else
            {
                var errors = string.Join(", ", result.Errors.Select(e => e.Description));
                _logger.LogError("Failed to create test user: {Errors}", errors);
            }
        }
    }
}

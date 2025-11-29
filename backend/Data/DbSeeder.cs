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

            await _db.Database.MigrateAsync();

            var merchant = await SeedMerchantAsync();

            var employee = await SeedEmployeeUserAsync(merchant);

            await SeedProductAsync(merchant);

            await SeedServiceAsync(merchant);

            _logger.LogInformation("Database seeding completed.");
        }

        private async Task<Merchant> SeedMerchantAsync()
        {
            var merchant = await _db.Merchants.FirstOrDefaultAsync(m => m.Name == "Test Merchant");

            if (merchant != null)
                return merchant;

            merchant = new Merchant
            {
                Name = "Test Merchant",
                Country = "LT",
                City = "Vilnius",
                Address = "Test Street 123",
                Email = "merchant@test.com"
            };

            _db.Merchants.Add(merchant);
            await _db.SaveChangesAsync();

            _logger.LogInformation("Seeded default Merchant");

            return merchant;
        }

        private async Task<User> SeedEmployeeUserAsync(Merchant merchant)
        {
            const string email = "test@temp.com";
            const string password = "test123";

            var existing = await _userManager.FindByEmailAsync(email);
            if (existing != null)
                return existing;

            var user = new User
            {
                UserName = email,
                Email = email,
                MerchantId = merchant.MerchantId,
                Role = "Employee",
                CreatedAt = DateTime.UtcNow,
                LastLoginAt = DateTime.UtcNow
            };

            var result = await _userManager.CreateAsync(user, password);

            if (!result.Succeeded)
            {
                var errorMsg = string.Join(", ", result.Errors.Select(e => e.Description));
                _logger.LogError("Failed to seed employee user: {Error}", errorMsg);
            }
            else
            {
                _logger.LogInformation("Seeded Employee user {Email}", email);
            }

            return user;
        }


        private async Task SeedProductAsync(Merchant merchant)
        {
            if (await _db.Products.AnyAsync(p => p.Name == "Test Product"))
                return;

            var product = new Product
            {
                MerchantId = merchant.MerchantId,
                Name = "Test Product",
                Price = 9.99m,
                Category = "General",
                IsActive = true
            };

            _db.Products.Add(product);
            await _db.SaveChangesAsync();

            _logger.LogInformation("Seeded test Product");
        }


        private async Task SeedServiceAsync(Merchant merchant)
        {
            if (await _db.Services.AnyAsync(s => s.Name == "Test Service"))
                return;

            var service = new Service
            {
                MerchantId = merchant.MerchantId,
                Name = "Test Service",
                DefaultPrice = 19.99m,
                DurationMinutes = 60,
                Description = "This is a test service used for development purposes.",
                IsActive = true
            };

            _db.Services.Add(service);
            await _db.SaveChangesAsync();

            _logger.LogInformation("Seeded test Service");
        }
    }
}

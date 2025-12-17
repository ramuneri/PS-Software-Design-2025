using System;
using System.Threading.Tasks;
using backend.Data.Models;
using backend.Enums;
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

            var superAdmin = await SeedSuperAdminUserAsync(merchant);
            var owner = await SeedOwnerUserAsync(merchant);
            var employee = await SeedEmployeeUserAsync(merchant);
            var customer = await SeedCustomerUserAsync(merchant);

            await SeedTaxCategoriesAndRatesAsync(merchant);
            await SeedProductAsync(merchant);
            await SeedServiceAsync(merchant);
            await SeedServiceChargePoliciesAsync(merchant);
            await SeedDiscountsAsync(merchant);
            await SeedGiftcardsAsync(merchant);

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


        private async Task<User> SeedSuperAdminUserAsync(Merchant merchant)
        {
            const string email = "test@temp.com";
            const string password = "test123";

            var user = await _userManager.FindByEmailAsync(email);

            if (user == null)
            {
                user = new User
                {
                    UserName = email,
                    Email = email,
                    MerchantId = merchant.MerchantId,
                    Role = UserRoles.Owner,
                    IsSuperAdmin = true,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    LastLoginAt = DateTime.UtcNow
                };

                var result = await _userManager.CreateAsync(user, password);

                if (!result.Succeeded)
                {
                    var errorMsg = string.Join(", ", result.Errors.Select(e => e.Description));
                    _logger.LogError("Failed to seed super admin user: {Error}", errorMsg);
                }
                else
                {
                    _logger.LogInformation("Seeded SuperAdmin user {Email}", email);
                }
            }
            else
            {
                var needsUpdate = false;
                // Update existing user to ensure SuperAdmin status
                if (!user.IsSuperAdmin || user.Role != UserRoles.Owner)
                {
                    user.IsSuperAdmin = true;
                    user.Role = UserRoles.Owner;
                    needsUpdate = true;
                }
                if (user.MerchantId != merchant.MerchantId)
                {
                    user.MerchantId = merchant.MerchantId;
                    needsUpdate = true;
                }
                if (!user.IsActive)
                {
                    user.IsActive = true;
                    needsUpdate = true;
                }
                if (needsUpdate)
                {
                    await _db.SaveChangesAsync();
                    _logger.LogInformation("Updated user to SuperAdmin: {Email}", email);
                }
            }

            return user;
        }

        private async Task<User> SeedOwnerUserAsync(Merchant merchant)
        {
            const string email = "owner@temp.com";
            const string password = "test123";

            var user = await _userManager.FindByEmailAsync(email);

            if (user == null)
            {
                user = new User
                {
                    UserName = email,
                    Email = email,
                    MerchantId = merchant.MerchantId,
                    Role = UserRoles.Owner,
                    IsSuperAdmin = false,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    LastLoginAt = DateTime.UtcNow
                };

                var result = await _userManager.CreateAsync(user, password);

                if (!result.Succeeded)
                {
                    var errorMsg = string.Join(", ", result.Errors.Select(e => e.Description));
                    _logger.LogError("Failed to seed owner user: {Error}", errorMsg);
                }
                else
                {
                    _logger.LogInformation("Seeded Owner user {Email}", email);
                }
            }
            else
            {
                var needsUpdate = false;
                // Update existing user to ensure Owner status
                if (user.IsSuperAdmin || user.Role != UserRoles.Owner)
                {
                    user.IsSuperAdmin = false;
                    user.Role = UserRoles.Owner;
                    needsUpdate = true;
                }
                if (user.MerchantId != merchant.MerchantId)
                {
                    user.MerchantId = merchant.MerchantId;
                    needsUpdate = true;
                }
                if (!user.IsActive)
                {
                    user.IsActive = true;
                    needsUpdate = true;
                }
                if (needsUpdate)
                {
                    await _db.SaveChangesAsync();
                    _logger.LogInformation("Updated user to Owner: {Email}", email);
                }
            }

            return user;
        }

        private async Task<User> SeedEmployeeUserAsync(Merchant merchant)
        {
            const string email = "employee@temp.com";
            const string password = "test123";

            var user = await _userManager.FindByEmailAsync(email);

            if (user == null)
            {
                user = new User
                {
                    UserName = email,
                    Email = email,
                    MerchantId = merchant.MerchantId,
                    Role = UserRoles.Employee,
                    IsActive = true,
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
            }
            else
            {
                var needsUpdate = false;
                if (user.MerchantId != merchant.MerchantId)
                {
                    user.MerchantId = merchant.MerchantId;
                    needsUpdate = true;
                }
                if (!user.IsActive)
                {
                    user.IsActive = true;
                    needsUpdate = true;
                }
                if (needsUpdate)
                {
                    await _db.SaveChangesAsync();
                    _logger.LogInformation("Updated employee user to correct MerchantId and/or IsActive status");
                }
            }

            return user;
        }

        private async Task<User> SeedCustomerUserAsync(Merchant merchant)
        {
            const string email = "customer@temp.com";
            const string password = "test123";

            var user = await _userManager.FindByEmailAsync(email);

            if (user == null)
            {
                user = new User
                {
                    UserName = email,
                    Email = email,
                    MerchantId = merchant.MerchantId,
                    Role = UserRoles.Customer,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    LastLoginAt = DateTime.UtcNow
                };

                var result = await _userManager.CreateAsync(user, password);

                if (!result.Succeeded)
                {
                    var errorMsg = string.Join(", ", result.Errors.Select(e => e.Description));
                    _logger.LogError("Failed to seed customer user: {Error}", errorMsg);
                }
                else
                {
                    _logger.LogInformation("Seeded Customer user {Email}", email);
                }
            }
            else
            {
                var needsUpdate = false;
                if (user.MerchantId != merchant.MerchantId)
                {
                    user.MerchantId = merchant.MerchantId;
                    needsUpdate = true;
                }
                if (!user.IsActive)
                {
                    user.IsActive = true;
                    needsUpdate = true;
                }
                if (needsUpdate)
                {
                    await _db.SaveChangesAsync();
                    _logger.LogInformation("Updated customer user to correct MerchantId and/or IsActive status");
                }
            }

            return user;
        }




        private async Task SeedProductAsync(Merchant merchant)
        {
            if (await _db.Products.AnyAsync(p => p.Name == "Test Product")) // TODO maybe - like with service bellow (re-seed if deleted)
                return;

            var taxCategory = await _db.TaxCategories.FirstOrDefaultAsync(
                tc => tc.MerchantId == merchant.MerchantId && tc.Name == "Standard" && tc.IsActive
            );

            var product = new Product
            {
                MerchantId = merchant.MerchantId,
                Name = "Test Product",
                Price = 9.99m,
                Category = "General",
                TaxCategoryId = taxCategory?.Id,
                IsActive = true
            };

            _db.Products.Add(product);
            await _db.SaveChangesAsync();

            _logger.LogInformation("Seeded test Product");
        }


        private async Task SeedServiceAsync(Merchant merchant)
        {
            var existing = await _db.Services.FirstOrDefaultAsync(s => s.Name == "Test Service");
            if (existing != null)
            {
                if (!existing.IsActive)
                {
                    existing.IsActive = true;
                    await _db.SaveChangesAsync();
                    _logger.LogInformation("Restored soft-deleted Test Service");
                }

                return;
            }

            var taxCategory = await _db.TaxCategories.FirstOrDefaultAsync(
                tc => tc.MerchantId == merchant.MerchantId && tc.Name == "Standard" && tc.IsActive
            );

            var service = new Service
            {
                MerchantId = merchant.MerchantId,
                Name = "Test Service",
                DefaultPrice = 19.99m,
                DurationMinutes = 60,
                Description = "This is a test service used for development purposes.",
                TaxCategoryId = taxCategory?.Id,
                IsActive = true
            };

            _db.Services.Add(service);
            await _db.SaveChangesAsync();

            _logger.LogInformation("Seeded test Service");
        }

        private async Task SeedTaxCategoriesAndRatesAsync(Merchant merchant)
        {
            var now = DateTime.UtcNow;

            var taxCategories = new[] { "Standard", "Reduced", "Super Reduced" };

            foreach (var categoryName in taxCategories)
            {
                var existing = await _db.TaxCategories.FirstOrDefaultAsync(
                    tc => tc.MerchantId == merchant.MerchantId && tc.Name == categoryName && tc.IsActive
                );

                if (existing != null)
                    continue;

                var category = new TaxCategories
                {
                    MerchantId = merchant.MerchantId,
                    Name = categoryName,
                    IsActive = true
                };

                _db.TaxCategories.Add(category);
                await _db.SaveChangesAsync();

                var ratePercent = categoryName switch
                {
                    "Standard" => 21m,
                    "Reduced" => 9m,
                    "Super Reduced" => 5m,
                    _ => 21m
                };

                var taxRate = new TaxRate
                {
                    TaxCategoryId = category.Id,
                    RatePercent = ratePercent,
                    EffectiveFrom = now,
                    EffectiveTo = null,
                    IsActive = true
                };

                _db.TaxRates.Add(taxRate);
            }

            await _db.SaveChangesAsync();
            _logger.LogInformation("Seeded Tax Categories and Rates");
        }

        private async Task SeedServiceChargePoliciesAsync(Merchant merchant)
        {
            var servicePolicies = new[]
            {
                new { Name = "Service 10%", Type = "percentage", Value = 10m },
                new { Name = "Service 15%", Type = "percentage", Value = 15m },
                new { Name = "Service 20%", Type = "percentage", Value = 20m }
            };

            foreach (var policy in servicePolicies)
            {
                var existing = await _db.ServiceChargePolicies.FirstOrDefaultAsync(
                    sp => sp.MerchantId == merchant.MerchantId && sp.Name == policy.Name && sp.IsActive
                );

                if (existing != null)
                    continue;

                var serviceChargePolicy = new ServiceChargePolicy
                {
                    MerchantId = merchant.MerchantId,
                    Name = policy.Name,
                    Type = policy.Type,
                    Value = policy.Value,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };

                _db.ServiceChargePolicies.Add(serviceChargePolicy);
            }

            await _db.SaveChangesAsync();
            _logger.LogInformation("Seeded Service Charge Policies");
        }

        private async Task SeedDiscountsAsync(Merchant merchant)
        {
            var discounts = new[]
            {
                new { Name = "Discount 5%", Scope = "general", Type = "percentage", Value = 5m },
                new { Name = "Discount 10%", Scope = "general", Type = "percentage", Value = 10m },
                new { Name = "Discount 15%", Scope = "general", Type = "percentage", Value = 15m },
                new { Name = "Discount 20%", Scope = "general", Type = "percentage", Value = 20m }
            };

            foreach (var discount in discounts)
            {
                var existing = await _db.Discounts.FirstOrDefaultAsync(
                    d => d.Name == discount.Name && d.IsActive
                );

                if (existing != null)
                    continue;

                var newDiscount = new Discount
                {
                    Name = discount.Name,
                    Scope = discount.Scope,
                    Type = discount.Type,
                    Value = discount.Value,
                    StartsAt = DateTime.UtcNow,
                    EndsAt = null,
                    IsActive = true
                };

                _db.Discounts.Add(newDiscount);
            }

            await _db.SaveChangesAsync();
            _logger.LogInformation("Seeded Discounts");
        }

        private async Task SeedGiftcardsAsync(Merchant merchant)
        {
            var giftcards = new[]
            {
                new { Code = "GIFT-2024-001", InitialBalance = 100m, ExpiresAt = (DateTime?)DateTime.UtcNow.AddYears(1) },
                new { Code = "GIFT-2024-002", InitialBalance = 50m, ExpiresAt = (DateTime?)DateTime.UtcNow.AddYears(1) },
                new { Code = "GIFT-2024-003", InitialBalance = 200m, ExpiresAt = (DateTime?)null },
                new { Code = "GIFT-2024-004", InitialBalance = 75m, ExpiresAt = (DateTime?)DateTime.UtcNow.AddMonths(6) }
            };

            foreach (var gc in giftcards)
            {
                var existing = await _db.Giftcards.FirstOrDefaultAsync(
                    g => g.Code == gc.Code && g.MerchantId == merchant.MerchantId
                );

                if (existing != null)
                    continue;

                var giftcard = new Giftcard
                {
                    MerchantId = merchant.MerchantId,
                    Code = gc.Code,
                    InitialBalance = gc.InitialBalance,
                    Balance = gc.InitialBalance,
                    IssuedAt = DateTime.UtcNow,
                    ExpiresAt = gc.ExpiresAt,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _db.Giftcards.Add(giftcard);
            }

            await _db.SaveChangesAsync();
            _logger.LogInformation("Seeded Giftcards");
        }
    }
}
